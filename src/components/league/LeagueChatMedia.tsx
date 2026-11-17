"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useI18n } from "@/i18n/I18nProvider"
import { getIntlLocale } from "@/i18n/localeFormatting"

export type LeagueChatMediaMessage = {
  body: string
  sender_display_name?: string
  created_at?: string
  media_kind?: "image" | "video" | null
  media_url?: string | null
  /** 0..1 while the sender's own file is still uploading. */
  upload_progress?: number | null
}

/** Keeps extreme shapes (very tall or very wide) from taking over the chat. */
const clampRatio = (ratio: number) => Math.min(1.8, Math.max(0.5, ratio))
/** Portrait stays narrow, landscape gets more width: the bubble follows the shape of the file. */
const widthForRatio = (ratio: number | null) => ratio === null || ratio < 0.9 ? "11rem" : ratio < 1.05 ? "13rem" : "16rem"

function formatDuration(seconds: number) {
  const whole = Math.max(0, Math.round(seconds))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`
}

/** Body of a chat bubble with a photo or video: tappable preview plus the caption (the time follows the caption). */
export function LeagueChatMediaBody({ message }: { message: LeagueChatMediaMessage }) {
  const { tx } = useI18n()
  const [open, setOpen] = useState(false)
  const [duration, setDuration] = useState<number | null>(null)
  const [ratio, setRatio] = useState<number | null>(null)
  const { media_kind: kind, media_url: url } = message
  if (!kind || !url) return <>{message.body}</>
  const uploading = typeof message.upload_progress === "number"
  const progress = Math.round((message.upload_progress ?? 0) * 100)
  const label = tx(kind === "video" ? "Reproducir vídeo" : "Ampliar foto")
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={uploading}
        aria-label={uploading ? `${tx("Subiendo")} ${progress}%` : label}
        title={label}
        data-league-chat-media={kind}
        style={{ width: widthForRatio(ratio) }}
        className="relative mb-1 block max-w-full overflow-hidden rounded-xl bg-neutral-900 active:scale-[0.98]"
      >
        {kind === "video" ? (
          // #t=0.1 makes mobile browsers paint a still frame as the thumbnail.
          <video src={`${url}#t=0.1`} preload="metadata" muted playsInline tabIndex={-1}
            onLoadedMetadata={(event) => {
              const { duration: length, videoWidth, videoHeight } = event.currentTarget
              if (Number.isFinite(length)) setDuration(length)
              if (videoWidth && videoHeight) setRatio(videoWidth / videoHeight)
            }}
            style={{ aspectRatio: clampRatio(ratio ?? 9 / 16) }}
            className="pointer-events-none w-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" loading="lazy"
            onLoad={(event) => { const { naturalWidth, naturalHeight } = event.currentTarget; if (naturalWidth && naturalHeight) setRatio(naturalWidth / naturalHeight) }}
            style={ratio ? { aspectRatio: clampRatio(ratio) } : undefined}
            className="w-full object-cover" />
        )}
        {uploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/45" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <span className="relative flex h-14 w-14 items-center justify-center">
              <svg viewBox="0 0 36 36" className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgb(255 255 255 / 0.3)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(progress / 100) * 97.4} 97.4`} />
              </svg>
              <span className="text-xs font-black text-white">{progress}%</span>
            </span>
          </span>
        ) : kind === "video" ? (
          <>
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white">
                <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-current"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </span>
            {duration !== null ? <span aria-hidden="true" className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 type-micro font-bold leading-none text-white">{formatDuration(duration)}</span> : null}
          </>
        ) : null}
      </button>
      {message.body}
      {open ? <LeagueChatMediaViewer kind={kind} url={url} caption={message.body} author={message.sender_display_name} createdAt={message.created_at} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

const CLOSE_DRAG = 110

/** Full-screen viewer inside the app: no redirect; closes with the button, Escape or by dragging it down. */
function LeagueChatMediaViewer({ kind, url, caption, author, createdAt, onClose }: {
  kind: "image" | "video"
  url: string
  caption: string
  author?: string
  createdAt?: string
  onClose: () => void
}) {
  const { tx, locale } = useI18n()
  const stage = useRef<HTMLDivElement>(null)
  const drag = useRef<{ y: number } | null>(null)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = previousOverflow }
  }, [onClose])
  function move(distance: number, animate: boolean) {
    if (!stage.current) return
    stage.current.style.transition = animate ? "transform 160ms ease-out, opacity 160ms ease-out" : "none"
    stage.current.style.transform = distance ? `translateY(${distance}px)` : ""
    stage.current.style.opacity = String(Math.max(0.4, 1 - distance / 400))
  }
  const when = createdAt
    ? new Date(createdAt).toLocaleString(getIntlLocale(locale), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : ""
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={caption} className="fixed inset-0 z-[200] bg-black" onClick={onClose}>
      <div ref={stage} className="flex h-full w-full items-center justify-center" style={{ touchAction: "none" }}
        onPointerDown={(event) => {
          // On a video, leave the bottom area to the player controls.
          if (kind === "video" && event.clientY > window.innerHeight * 0.7) return
          drag.current = { y: event.clientY }
        }}
        onPointerMove={(event) => { if (drag.current) move(Math.max(0, event.clientY - drag.current.y), false) }}
        onPointerUp={(event) => {
          const started = drag.current
          drag.current = null
          if (started && event.clientY - started.y > CLOSE_DRAG) onClose()
          else move(0, true)
        }}
        onPointerCancel={() => { drag.current = null; move(0, true) }}
      >
        <div className="flex h-full w-full max-w-md items-center justify-center" onClick={(event) => event.stopPropagation()}>
          {kind === "video"
            ? <video src={url} controls autoPlay playsInline controlsList="nodownload" className="max-h-full max-w-full" />
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={url} alt={caption} draggable={false} className="max-h-full max-w-full object-contain" />}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start gap-3 bg-gradient-to-b from-black/70 to-transparent px-4 pb-8 text-white"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top, 0px))" }}>
        <div className="min-w-0 flex-1 pr-12">
          {author ? <p className="truncate text-sm font-black">{author}</p> : null}
          {when ? <p className="truncate text-xs font-semibold text-white/75">{when}</p> : null}
        </div>
      </div>
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); onClose() }}
        aria-label={tx("Cerrar")}
        className="absolute right-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white"
        style={{ top: "max(12px, env(safe-area-inset-top, 0px))" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-5 w-5"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
    </div>,
    document.body,
  )
}
