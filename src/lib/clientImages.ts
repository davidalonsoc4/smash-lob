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

export async function resizeImageFileToDataUrl({
  file,
  maxSize,
  quality = 0.82,
}: {
  file: File
  maxSize: number
  quality?: number
}) {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen")
  }

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
