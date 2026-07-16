const allowedDataImagePattern =
  /^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i

const localhostHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"])

export function normalizeImageUrl(value: string | null | undefined) {
  const cleanValue = value?.trim()

  return cleanValue ? cleanValue : null
}

export function isSafeDataImageUrl(value: string | null | undefined) {
  const cleanValue = normalizeImageUrl(value)

  return cleanValue ? allowedDataImagePattern.test(cleanValue) : false
}

export function isSafeRemoteImageUrl(value: string | null | undefined) {
  const cleanValue = normalizeImageUrl(value)

  if (!cleanValue || cleanValue.length > 2048) {
    return false
  }

  try {
    const url = new URL(cleanValue)

    if (url.protocol === "https:") {
      return true
    }

    return url.protocol === "http:" && localhostHosts.has(url.hostname)
  } catch {
    return false
  }
}

export function isSafeImageUrl(value: string | null | undefined) {
  return isSafeDataImageUrl(value) || isSafeRemoteImageUrl(value)
}
