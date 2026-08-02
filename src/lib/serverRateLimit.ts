import "server-only"

import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { createRequestId, logServerEvent } from "@/lib/serverLog"

type RateLimitBucket = {
  count: number
  resetAt: number
}

type RateLimitStore = Map<string, RateLimitBucket>

const globalRateLimit = globalThis as typeof globalThis & {
  __smashLobRateLimits?: RateLimitStore
}

const store =
  globalRateLimit.__smashLobRateLimits ??
  (globalRateLimit.__smashLobRateLimits = new Map())

export function consumeRateLimit({
  key,
  limit,
  windowMs,
  now = Date.now(),
}: {
  key: string
  limit: number
  windowMs: number
  now?: number
}) {
  if (store.size > 5_000) {
    for (const [storedKey, bucket] of store) {
      if (bucket.resetAt <= now) {
        store.delete(storedKey)
      }
    }
  }

  const current = store.get(key)

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true as const, remaining: Math.max(0, limit - 1), retryAfter: 0 }
  }

  if (current.count >= limit) {
    return {
      allowed: false as const,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1
  return {
    allowed: true as const,
    remaining: Math.max(0, limit - current.count),
    retryAfter: 0,
  }
}

function getClientKey(request: Request, scope: string) {
  const clientAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"

  return createHash("sha256")
    .update(`${scope}:${clientAddress}`)
    .digest("hex")
}

export function enforceRequestRateLimit({
  request,
  scope,
  limit,
  windowMs,
}: {
  request: Request
  scope: string
  limit: number
  windowMs: number
}) {
  const result = consumeRateLimit({
    key: getClientKey(request, scope),
    limit,
    windowMs,
  })

  if (result.allowed) {
    return null
  }

  logServerEvent("warn", "request_rate_limited", {
    requestId: createRequestId(request),
    route: new URL(request.url).pathname,
    method: request.method,
    operation: scope,
    outcome: "rate_limited",
    errorCode: "rate_limited",
  })

  return NextResponse.json(
    {
      error: "rate_limited",
      message: "Demasiadas solicitudes. Espera unos segundos y vuelve a intentarlo.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfter),
        "Cache-Control": "no-store",
      },
    },
  )
}
