"use client"

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { createPortal } from "react-dom"
import {
  clampCropOffset,
  cropImageElementToDataUrl,
  getCropDisplayMetrics,
  type ImageCropRotation,
  type ImageOutputType,
} from "@/lib/clientImages"

type ImageCropDialogProps = {
  src: string
  title: string
  description: string
  shape?: "circle" | "square"
  outputSize?: number
  outputType?: ImageOutputType
  maxOutputBytes?: number
  confirmLabel?: string
  cancelLabel?: string
  onCancel: () => void
  onConfirm: (dataUrl: string) => Promise<boolean | void> | boolean | void
}

type DragState = {
  pointerId: number
  startX: number
  startY: number
  offsetX: number
  offsetY: number
}

const CROP_VIEWPORT_SIZE = 288
const MIN_ZOOM = 1
const MAX_ZOOM = 3
const MIN_RESPONSIVE_CROP_SIZE = 200

function getResponsiveCropViewportSize() {
  if (typeof window === "undefined") {
    return CROP_VIEWPORT_SIZE
  }

  return Math.max(
    MIN_RESPONSIVE_CROP_SIZE,
    Math.min(
      CROP_VIEWPORT_SIZE,
      window.innerWidth - 56,
      window.innerHeight - 280,
    ),
  )
}

function RotateIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d={
          direction === "left"
            ? "M5.5 8.5V4.8m0 0h3.7m-3.7 0 2.4 2.4a7 7 0 1 1-1.4 7.7"
            : "M18.5 8.5V4.8m0 0h-3.7m3.7 0-2.4 2.4a7 7 0 1 0 1.4 7.7"
        }
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ImageCropDialog({
  src,
  title,
  description,
  shape = "square",
  outputSize = 512,
  outputType = "image/webp",
  maxOutputBytes,
  confirmLabel = "Usar imagen",
  cancelLabel = "Cancelar",
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const imageRef = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  const [cropViewportSize, setCropViewportSize] = useState(CROP_VIEWPORT_SIZE)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState<ImageCropRotation>(0)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    const updateCropViewportSize = () => {
      setCropViewportSize(getResponsiveCropViewportSize())
    }
    const animationFrame = window.requestAnimationFrame(updateCropViewportSize)

    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    window.addEventListener("resize", updateCropViewportSize)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener("resize", updateCropViewportSize)
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [])

  const metrics = useMemo(
    () =>
      getCropDisplayMetrics({
        imageWidth: naturalSize.width,
        imageHeight: naturalSize.height,
        cropSize: cropViewportSize,
        zoom,
        rotation,
      }),
    [cropViewportSize, naturalSize.height, naturalSize.width, rotation, zoom],
  )

  const visibleOffset = useMemo(
    () =>
      clampCropOffset({
        offsetX: offset.x,
        offsetY: offset.y,
        displayWidth: metrics.displayWidth,
        displayHeight: metrics.displayHeight,
        cropSize: cropViewportSize,
      }),
    [cropViewportSize, metrics.displayHeight, metrics.displayWidth, offset.x, offset.y],
  )

  function updateZoom(nextZoom: number) {
    const normalizedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom))
    const nextMetrics = getCropDisplayMetrics({
      imageWidth: naturalSize.width,
      imageHeight: naturalSize.height,
      cropSize: cropViewportSize,
      zoom: normalizedZoom,
      rotation,
    })
    const nextOffset = clampCropOffset({
      offsetX: visibleOffset.x,
      offsetY: visibleOffset.y,
      displayWidth: nextMetrics.displayWidth,
      displayHeight: nextMetrics.displayHeight,
      cropSize: cropViewportSize,
    })

    setZoom(normalizedZoom)
    setOffset(nextOffset)
  }

  function rotate(delta: -90 | 90) {
    const nextRotation = (((rotation + delta) % 360) + 360) % 360 as ImageCropRotation
    const nextMetrics = getCropDisplayMetrics({
      imageWidth: naturalSize.width,
      imageHeight: naturalSize.height,
      cropSize: cropViewportSize,
      zoom,
      rotation: nextRotation,
    })
    const nextOffset = clampCropOffset({
      offsetX: visibleOffset.x,
      offsetY: visibleOffset.y,
      displayWidth: nextMetrics.displayWidth,
      displayHeight: nextMetrics.displayHeight,
      cropSize: cropViewportSize,
    })

    setRotation(nextRotation)
    setOffset(nextOffset)
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!naturalSize.width || !naturalSize.height) {
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: visibleOffset.x,
      offsetY: visibleOffset.y,
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    const nextOffset = clampCropOffset({
      offsetX: drag.offsetX + event.clientX - drag.startX,
      offsetY: drag.offsetY + event.clientY - drag.startY,
      displayWidth: metrics.displayWidth,
      displayHeight: metrics.displayHeight,
      cropSize: cropViewportSize,
    })

    setOffset(nextOffset)
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
    }
  }

  async function handleConfirm() {
    const image = imageRef.current

    if (!image || !naturalSize.width || !naturalSize.height) {
      setError("La imagen todavía no está preparada.")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const dataUrl = cropImageElementToDataUrl({
        image,
        cropSize: cropViewportSize,
        outputSize,
        zoom,
        rotation,
        offsetX: visibleOffset.x,
        offsetY: visibleOffset.y,
        outputType,
        quality: 0.88,
        maxOutputBytes,
      })
      const result = await onConfirm(dataUrl)
      if (result === false) {
        setIsSaving(false)
      }
    } catch (cropError) {
      setError(
        cropError instanceof Error
          ? cropError.message
          : "No se ha podido recortar la imagen.",
      )
      setIsSaving(false)
    }
  }

  const previewTransform = `translate(-50%, -50%) translate(${visibleOffset.x}px, ${visibleOffset.y}px) rotate(${rotation}deg)`

  if (typeof document === "undefined") {
    return null
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-crop-title"
      aria-describedby="image-crop-description"
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/55 px-3 backdrop-blur-sm"
      style={{
        paddingTop: "max(12px, env(safe-area-inset-top))",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
      }}
    >
      <div
        className="flex w-full max-w-md flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-neutral-900"
        style={{
          maxHeight:
            "calc(100dvh - max(24px, env(safe-area-inset-top)) - max(24px, env(safe-area-inset-bottom)))",
        }}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 px-4 pt-4">
          <div>
            <h2 id="image-crop-title" className="text-lg font-black text-neutral-950 dark:text-white">
              {title}
            </h2>
            <p
              id="image-crop-description"
              className="mt-1 text-xs font-semibold leading-5 text-neutral-500 dark:text-neutral-400"
            >
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            aria-label={cancelLabel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-lg font-black text-neutral-600 disabled:opacity-40 dark:bg-neutral-800 dark:text-neutral-300"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto px-4 pb-4">
          <div className="mt-4 flex justify-center">
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              className={`relative shrink-0 touch-none overflow-hidden bg-neutral-200 shadow-inner dark:bg-neutral-800 ${
                shape === "circle" ? "rounded-full" : "rounded-3xl"
              }`}
              style={{
                width: `${cropViewportSize}px`,
                height: `${cropViewportSize}px`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={src}
                alt="Vista previa del recorte"
                draggable={false}
                onLoad={(event) => {
                  setNaturalSize({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
                  })
                }}
                className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: `${naturalSize.width * metrics.scale}px`,
                  height: `${naturalSize.height * metrics.scale}px`,
                  transform: previewTransform,
                }}
              />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/70" />
              <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-white/35" />
              <div className="pointer-events-none absolute inset-y-0 left-1/2 border-l border-white/35" />
            </div>
          </div>

          <p className="mt-2 text-center text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
            Arrastra la imagen para colocarla dentro del marco.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => rotate(-90)}
              disabled={isSaving}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 disabled:opacity-40 dark:bg-neutral-800 dark:text-neutral-200"
              aria-label="Girar a la izquierda"
            >
              <RotateIcon direction="left" />
            </button>
            <label className="flex min-w-0 flex-1 items-center gap-3">
              <span className="text-xs font-black text-neutral-500">Zoom</span>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                disabled={isSaving}
                onChange={(event) => updateZoom(Number(event.target.value))}
                className="w-full accent-neutral-950"
              />
            </label>
            <button
              type="button"
              onClick={() => rotate(90)}
              disabled={isSaving}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 disabled:opacity-40 dark:bg-neutral-800 dark:text-neutral-200"
              aria-label="Girar a la derecha"
            >
              <RotateIcon direction="right" />
            </button>
          </div>

          {error ? (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-2xl bg-neutral-100 px-3 py-3 text-sm font-black text-neutral-700 disabled:opacity-40 dark:bg-neutral-800 dark:text-neutral-200"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isSaving || !naturalSize.width}
            className="rounded-2xl bg-neutral-950 px-3 py-3 text-sm font-black text-white disabled:bg-neutral-300 dark:bg-white dark:text-neutral-950 dark:disabled:bg-neutral-700"
          >
            {isSaving ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
