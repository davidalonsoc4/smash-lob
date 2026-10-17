import "server-only"
import { getPublicAppBaseUrl, isPreproductionAppUrl } from "@/lib/appUrl"

// Temporary action: the server rejects old clients after 25 October as well.
export function canRestartRapidTournamentForTesting(now = Date.now()) {
  if (now >= Date.parse("2026-10-26T00:00:00Z") || process.env.VERCEL_ENV === "production") return false
  const origin = getPublicAppBaseUrl()
  return isPreproductionAppUrl(origin) || ["localhost", "127.0.0.1", "0.0.0.0"].includes(new URL(origin).hostname)
}
