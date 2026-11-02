import { getPublicAppBaseUrl, isPreproductionAppUrl } from "./appUrl"

/** Temporary release boundary: tournaments remain available only in PRE and local. */
export function areTournamentsEnabled() {
  const origin = getPublicAppBaseUrl()
  return isPreproductionAppUrl(origin) || /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(new URL(origin).hostname)
}

export function isTournamentRequestEnabled(request: Request) {
  const hostname = new URL(request.url).hostname.toLowerCase()
  if (["smashandlob.com", "www.smashandlob.com"].includes(hostname)) return false
  return areTournamentsEnabled()
}
