export type ImageCropRotation = 0 | 90 | 180 | 270
export type ImageOutputType = "image/webp" | "image/jpeg" | "image/png" | "auto"

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("No se ha podido leer la imagen"))
      }
    }
    reader.onerror = () => reject(reader.error ?? new Error("Error leyendo imagen"))
    reader.readAsDataURL(file)
  })
}

export function validateImageFile(file: File, maxBytes = 12 * 1024 * 1024) {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen")
  }

  if (file.size > maxBytes) {
    throw new Error("La imagen es demasiado grande. El límite es 12 MB.")
  }
}

export function getCropDisplayMetrics({
  imageWidth,
  imageHeight,
  cropSize,
  zoom,
  rotation,
}: {
  imageWidth: number
  imageHeight: number
  cropSize: number
  zoom: number
  rotation: ImageCropRotation
}) {
  if (!imageWidth || !imageHeight) {
    return { scale: 1, displayWidth: cropSize, displayHeight: cropSize }
  }

  const swapsAxes = rotation === 90 || rotation === 270
  const rotatedWidth = swapsAxes ? imageHeight : imageWidth
  const rotatedHeight = swapsAxes ? imageWidth : imageHeight
  const baseScale = Math.max(cropSize / rotatedWidth, cropSize / rotatedHeight)
  const scale = baseScale * Math.max(1, zoom)

  return {
    scale,
    displayWidth: rotatedWidth * scale,
    displayHeight: rotatedHeight * scale,
  }
}

export function clampCropOffset({
  offsetX,
  offsetY,
  displayWidth,
  displayHeight,
  cropSize,
}: {
  offsetX: number
  offsetY: number
  displayWidth: number
  displayHeight: number
  cropSize: number
}) {
  const maxOffsetX = Math.max(0, (displayWidth - cropSize) / 2)
  const maxOffsetY = Math.max(0, (displayHeight - cropSize) / 2)

  return {
    x: Math.min(maxOffsetX, Math.max(-maxOffsetX, offsetX)),
    y: Math.min(maxOffsetY, Math.max(-maxOffsetY, offsetY)),
  }
}

function canvasHasTransparentPixels(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const pixels = context.getImageData(0, 0, width, height).data

  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] < 255) {
      return true
    }
  }

  return false
}

function getDataUrlByteLength(dataUrl: string) {
  const separatorIndex = dataUrl.indexOf(",")

  if (separatorIndex < 0) {
    return Number.POSITIVE_INFINITY
  }

  const payload = dataUrl.slice(separatorIndex + 1)
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0

  return Math.max(0, Math.floor((payload.length * 3) / 4) - padding)
}

function encodeCanvasWithinLimit({
  canvas,
  preferredType,
  quality,
  maxOutputBytes,
}: {
  canvas: HTMLCanvasElement
  preferredType: Exclude<ImageOutputType, "auto">
  quality: number
  maxOutputBytes?: number
}) {
  const preferredDataUrl = canvas.toDataURL(preferredType, quality)

  if (
    !maxOutputBytes ||
    getDataUrlByteLength(preferredDataUrl) <= maxOutputBytes ||
    preferredType !== "image/png"
  ) {
    return preferredDataUrl
  }

  // WebP conserva el canal alfa y permite reducir logos PNG complejos sin
  // superar el límite de almacenamiento de imágenes embebidas del servidor.
  const fallbackQualities = [quality, 0.82, 0.74, 0.66]
  let smallestDataUrl = preferredDataUrl

  for (const fallbackQuality of fallbackQualities) {
    const dataUrl = canvas.toDataURL("image/webp", fallbackQuality)

    if (dataUrl.length < smallestDataUrl.length) {
      smallestDataUrl = dataUrl
    }

    if (getDataUrlByteLength(dataUrl) <= maxOutputBytes) {
      return dataUrl
    }
  }

  if (getDataUrlByteLength(smallestDataUrl) > maxOutputBytes) {
    throw new Error(
      "La imagen recortada sigue siendo demasiado grande. Prueba con un encuadre o archivo más sencillo.",
    )
  }

  return smallestDataUrl
}

export function cropImageElementToDataUrl({
  image,
  cropSize,
  outputSize,
  zoom,
  rotation,
  offsetX,
  offsetY,
  outputType = "image/webp",
  quality = 0.88,
  maxOutputBytes,
}: {
  image: HTMLImageElement
  cropSize: number
  outputSize: number
  zoom: number
  rotation: ImageCropRotation
  offsetX: number
  offsetY: number
  outputType?: ImageOutputType
  quality?: number
  maxOutputBytes?: number
}) {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("El navegador no permite procesar la imagen.")
  }

  const metrics = getCropDisplayMetrics({
    imageWidth: image.naturalWidth,
    imageHeight: image.naturalHeight,
    cropSize,
    zoom,
    rotation,
  })
  const normalizedOffset = clampCropOffset({
    offsetX,
    offsetY,
    displayWidth: metrics.displayWidth,
    displayHeight: metrics.displayHeight,
    cropSize,
  })
  const outputRatio = outputSize / cropSize

  canvas.width = outputSize
  canvas.height = outputSize
  context.clearRect(0, 0, outputSize, outputSize)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = "high"
  context.translate(
    outputSize / 2 + normalizedOffset.x * outputRatio,
    outputSize / 2 + normalizedOffset.y * outputRatio,
  )
  context.rotate((rotation * Math.PI) / 180)
  context.scale(metrics.scale * outputRatio, metrics.scale * outputRatio)
  context.drawImage(
    image,
    -image.naturalWidth / 2,
    -image.naturalHeight / 2,
  )

  const resolvedOutputType =
    outputType === "auto"
      ? canvasHasTransparentPixels(context, outputSize, outputSize)
        ? "image/png"
        : "image/webp"
      : outputType

  return encodeCanvasWithinLimit({
    canvas,
    preferredType: resolvedOutputType,
    quality,
    maxOutputBytes,
  })
}

export async function resizeImageFileToDataUrl({
  file,
  maxSize,
  quality = 0.82,
}: {
  file: File
  maxSize: number
  quality?: number
}) {
  validateImageFile(file)
  const originalDataUrl = await readFileAsDataUrl(file)

  if (typeof document === "undefined") {
    return originalDataUrl
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("No se ha podido cargar la imagen"))
    img.src = originalDataUrl
  })
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    return originalDataUrl
  }

  canvas.width = width
  canvas.height = height
  context.drawImage(image, 0, 0, width, height)

  return canvas.toDataURL("image/jpeg", quality)
}
