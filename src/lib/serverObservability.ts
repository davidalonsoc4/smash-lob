import "server-only"

export type ObservabilityLevel = "info" | "warn" | "error"

export type ObservabilityEvent = {
  timestamp: string
  level: ObservabilityLevel
  environment: string
  version: string
  commitSha: string | null
  deploymentId: string | null
  region: string | null
  message: string
  requestId?: string
  route?: string
  method?: string
  operation?: string
  outcome?: string
  errorCode?: string
  incidenceCode?: string
  durationMs?: number
  userId?: string
  leagueId?: string
  responseBytes?: number
}

const LEVEL_WEIGHT: Record<ObservabilityLevel, number> = {
  info: 10,
  warn: 20,
  error: 30,
}

const globalObservability = globalThis as typeof globalThis & {
  __smashLobObservabilityFingerprints?: Map<string, number>
}

const recentFingerprints =
  globalObservability.__smashLobObservabilityFingerprints ??
  (globalObservability.__smashLobObservabilityFingerprints = new Map())

function getMinimumLevel(): ObservabilityLevel {
  const configured = process.env.OBSERVABILITY_MIN_LEVEL?.trim().toLowerCase()
  return configured === "info" || configured === "warn" || configured === "error"
    ? configured
    : "error"
}

export function isObservabilityWebhookConfigured() {
  return Boolean(process.env.OBSERVABILITY_WEBHOOK_URL?.trim())
}

function shouldSend(event: ObservabilityEvent) {
  return LEVEL_WEIGHT[event.level] >= LEVEL_WEIGHT[getMinimumLevel()]
}

function getFingerprint(event: ObservabilityEvent) {
  return [
    event.level,
    event.message,
    event.route ?? "",
    event.operation ?? "",
    event.errorCode ?? "",
  ].join(":")
}

function reserveFingerprint(event: ObservabilityEvent, now = Date.now()) {
  const fingerprint = getFingerprint(event)
  const previous = recentFingerprints.get(fingerprint)

  if (previous && now - previous < 60_000) {
    return false
  }

  recentFingerprints.set(fingerprint, now)

  if (recentFingerprints.size > 500) {
    const cutoff = now - 5 * 60_000
    for (const [key, timestamp] of recentFingerprints) {
      if (timestamp < cutoff) recentFingerprints.delete(key)
    }
  }

  return true
}

export async function sendObservabilityEvent(event: ObservabilityEvent) {
  const webhookUrl = process.env.OBSERVABILITY_WEBHOOK_URL?.trim()
  if (!webhookUrl || !shouldSend(event) || !reserveFingerprint(event)) return false

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2_000)

  try {
    const token = process.env.OBSERVABILITY_WEBHOOK_TOKEN?.trim()
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(event),
      cache: "no-store",
      signal: controller.signal,
    })

    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}
