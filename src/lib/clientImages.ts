export type ImageCropRotation = 0 | 90 | 180 | 270

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
}: {
  image: HTMLImageElement
  cropSize: number
  outputSize: number
  zoom: number
  rotation: ImageCropRotation
  offsetX: number
  offsetY: number
  outputType?: "image/webp" | "image/jpeg"
  quality?: number
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

  return canvas.toDataURL(outputType, quality)
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
