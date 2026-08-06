import {
  getPublicAppBaseUrl,
  isPreproductionAppUrl,
} from "@/lib/appUrl"

const LOCAL_APP_HOST_PATTERN = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i
const PRODUCTION_HOSTS = new Set(["smashandlob.com", "www.smashandlob.com"])

function normalizeHost(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/\.$/, "") ?? ""
}

function isLocalHost(value: string) {
  return LOCAL_APP_HOST_PATTERN.test(value)
}

function isPreHost(value: string) {
  return normalizeHost(value).split(":")[0] === "pre.smashandlob.com"
}

function isLocalAppUrl(value: string) {
  try {
    return isLocalHost(new URL(value).host)
  } catch {
    return false
  }
}

export function isAvatarLabEnabled() {
  const appUrl = getPublicAppBaseUrl()
  return isPreproductionAppUrl(appUrl) || isLocalAppUrl(appUrl)
}

export function isAvatarLabRequest(request: Request) {
  const requestHost = normalizeHost(new URL(request.url).host)
  const requestHostname = requestHost.split(":")[0]

  // A production URL is always denied. Do not allow x-forwarded-host or a
  // stale environment variable to turn a production request into PRE.
  if (PRODUCTION_HOSTS.has(requestHostname)) {
    return false
  }

  if (isPreHost(requestHost) || isLocalHost(requestHost)) {
    return true
  }

  // Some reverse proxies preserve an internal URL but provide the real Host
  // header. Host is only considered when the URL itself is not a known PROD
  // origin; x-forwarded-host is deliberately ignored for this security gate.
  const hostHeader = normalizeHost(request.headers.get("host"))
  return isPreHost(hostHeader) || isLocalHost(hostHeader)
}
