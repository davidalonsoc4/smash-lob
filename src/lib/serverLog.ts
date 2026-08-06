import "server-only"

import { randomBytes, randomUUID } from "node:crypto"
import { APP_VERSION } from "@/lib/appVersion"

type LogLevel = "info" | "warn" | "error"
type SafeLogValue = string | number | boolean | null | undefined

export type ServerLogContext = {
  requestId?: string
  route?: string
  method?: string
  operation?: string
  durationMs?: number
  outcome?: string
  errorCode?: string
  userId?: string
  leagueId?: string
  incidenceCode?: string
  responseBytes?: number
}

const SAFE_CONTEXT_KEYS = new Set<keyof ServerLogContext>([
  "requestId",
  "route",
  "method",
  "operation",
  "durationMs",
  "outcome",
  "errorCode",
  "userId",
  "leagueId",
  "incidenceCode",
  "responseBytes",
])

export function createRequestId(request?: Request) {
  const incoming = request?.headers.get("x-request-id")?.trim()
  return incoming && /^[a-zA-Z0-9._:-]{8,128}$/.test(incoming)
    ? incoming
    : randomUUID()
}

export function createIncidenceCode() {
  return `SL-${randomBytes(4).toString("hex").toUpperCase()}`
}

export function logServerEvent(
  level: LogLevel,
  message: string,
  context: ServerLogContext = {},
) {
  const safeContext: Record<string, SafeLogValue> = {}

  for (const [key, value] of Object.entries(context)) {
    if (SAFE_CONTEXT_KEYS.has(key as keyof ServerLogContext)) {
      safeContext[key] = value
    }
  }

  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    version: APP_VERSION,
    message,
    ...safeContext,
  })

  if (level === "error") {
    console.error(entry)
  } else if (level === "warn") {
    console.warn(entry)
  } else {
    console.info(entry)
  }
}
