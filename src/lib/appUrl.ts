export const PRODUCTION_APP_URL = "https://smashandlob.com"
export const PREPRODUCTION_APP_URL = "https://pre.smashandlob.com"

const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i
const PREPRODUCTION_HINT_PATTERN = /(^|[.-])(pre|prep|preview|staging)([.-]|$)/i

function normalizeOrigin(value: string | null | undefined) {
  const cleanValue = value?.trim()

  if (!cleanValue) {
    return null
  }

  try {
    const url = new URL(cleanValue)
    return url.origin.replace(/\/+$/, "")
  } catch {
    return null
  }
}

function getRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
  const host = forwardedHost || request.headers.get("host")?.trim()
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()

  if (host) {
    const protocol = forwardedProto || (LOCAL_HOST_PATTERN.test(host) ? "http" : "https")
    return normalizeOrigin(`${protocol}://${host}`)
  }

  return normalizeOrigin(request.url)
}

function getBrowserOrigin() {
  if (typeof window === "undefined") {
    return null
  }

  return normalizeOrigin(window.location.origin)
}

function isPreproductionHint(value: string | null | undefined) {
  if (!value) {
    return false
  }

  try {
    const hostname = new URL(value).hostname.toLowerCase()
    return hostname === "pre.smashandlob.com" || PREPRODUCTION_HINT_PATTERN.test(hostname)
  } catch {
    return PREPRODUCTION_HINT_PATTERN.test(value.toLowerCase())
  }
}

function canonicalizeKnownOrigin(value: string | null) {
  if (!value) {
    return null
  }

  const url = new URL(value)
  const hostname = url.hostname.toLowerCase()
  const hostWithPort = url.host.toLowerCase()

  if (LOCAL_HOST_PATTERN.test(hostWithPort)) {
    return value
  }

  if (hostname === "pre.smashandlob.com") {
    return PREPRODUCTION_APP_URL
  }

  if (hostname === "smashandlob.com" || hostname === "www.smashandlob.com") {
    return PRODUCTION_APP_URL
  }

  if (hostname.endsWith(".vercel.app")) {
    return isPreproductionHint(value)
      ? PREPRODUCTION_APP_URL
      : PRODUCTION_APP_URL
  }

  return null
}

function getConfiguredAppUrl() {
  const explicitVariant = (process.env.NEXT_PUBLIC_APP_VARIANT ?? "")
    .trim()
    .toLowerCase()

  if (explicitVariant === "pre" || explicitVariant === "staging") {
    return PREPRODUCTION_APP_URL
  }

  if (explicitVariant === "prod" || explicitVariant === "production") {
    return PRODUCTION_APP_URL
  }

  const configuredUrl = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL)
  const canonicalConfiguredUrl = canonicalizeKnownOrigin(configuredUrl)

  if (canonicalConfiguredUrl) {
    return canonicalConfiguredUrl
  }

  if (isPreproductionHint(configuredUrl)) {
    return PREPRODUCTION_APP_URL
  }

  return PRODUCTION_APP_URL
}

export function getPublicAppBaseUrl(request?: Request) {
  const requestUrl = request ? canonicalizeKnownOrigin(getRequestOrigin(request)) : null

  if (requestUrl) {
    return requestUrl
  }

  const browserUrl = canonicalizeKnownOrigin(getBrowserOrigin())

  if (browserUrl) {
    return browserUrl
  }

  return getConfiguredAppUrl()
}

export function isPreproductionAppUrl(value?: string | null) {
  const normalizedValue = normalizeOrigin(value)

  if (!normalizedValue) {
    return false
  }

  return canonicalizeKnownOrigin(normalizedValue) === PREPRODUCTION_APP_URL
}
