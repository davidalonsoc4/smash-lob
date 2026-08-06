import "server-only"

import { headers } from "next/headers"
import { isAvatarLabRequest } from "@/lib/avatarLabAccess"

const PRODUCTION_HOSTS = new Set(["smashandlob.com", "www.smashandlob.com"])

function normalizeHost(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/\.$/, "") ?? ""
}

function isProductionHost(value: string | null | undefined) {
  return PRODUCTION_HOSTS.has(normalizeHost(value).split(":")[0])
}

function buildRequest(host: string, protocol: string) {
  return new Request(`${protocol}://${host}`, {
    headers: { host },
  })
}

export async function isAvatarLabRequestContext() {
  const requestHeaders = await headers()
  const host = requestHeaders.get("host")?.trim() ?? ""
  const forwardedHost =
    requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim() ?? ""

  // Deny whenever either proxy view identifies PROD. This prevents an
  // internal/local Host value from overriding the public production host.
  if (isProductionHost(host) || isProductionHost(forwardedHost)) {
    return false
  }

  const forwardedProto =
    requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? ""
  const protocol =
    forwardedProto ||
    (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host) ? "http" : "https")

  if (host && isAvatarLabRequest(buildRequest(host, protocol))) {
    return true
  }

  return Boolean(
    forwardedHost &&
      isAvatarLabRequest(buildRequest(forwardedHost, protocol)),
  )
}
