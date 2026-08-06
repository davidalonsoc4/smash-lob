import "server-only"

import {
  isSafeDataImageUrl,
  isSafeImageUrl,
  normalizeImageUrl,
} from "@/lib/imageUrl"

export const LEGACY_STORED_IMAGE_MAX_BYTES = 512 * 1024
export const ACCOUNT_AVATAR_MAX_BYTES = 160 * 1024

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

    if (!byteLength || byteLength > LEGACY_STORED_IMAGE_MAX_BYTES) {
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

export function isValidAccountAvatarUrl(value: string | null | undefined) {
  if (value === null) {
    return true
  }

  const cleanValue = normalizeImageUrl(value)

  if (!cleanValue || !isSafeImageUrl(cleanValue)) {
    return false
  }

  if (!isSafeDataImageUrl(cleanValue)) {
    return true
  }

  const byteLength = getDataImageByteLength(cleanValue)
  return Boolean(byteLength && byteLength <= ACCOUNT_AVATAR_MAX_BYTES)
}
