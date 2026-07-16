import "server-only"

import {
  isSafeDataImageUrl,
  isSafeImageUrl,
  normalizeImageUrl,
} from "@/lib/imageUrl"

const maxDataImageBytes = 512 * 1024

function getDataImageByteLength(value: string) {
  const separatorIndex = value.indexOf(",")

  if (separatorIndex < 0) {
    return null
  }

  try {
    return Buffer.from(value.slice(separatorIndex + 1), "base64").byteLength
  } catch {
    return null
  }
}

export function normalizeStoredImageUrl(value: string | null | undefined) {
  const cleanValue = normalizeImageUrl(value)

  if (!cleanValue) {
    return null
  }

  if (!isSafeImageUrl(cleanValue)) {
    return null
  }

  if (isSafeDataImageUrl(cleanValue)) {
    const byteLength = getDataImageByteLength(cleanValue)

    if (!byteLength || byteLength > maxDataImageBytes) {
      return null
    }
  }

  return cleanValue
}

export function isValidStoredImageUrl(value: string | null | undefined) {
  if (value === null) {
    return true
  }

  return Boolean(normalizeStoredImageUrl(value))
}
