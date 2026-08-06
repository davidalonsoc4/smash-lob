import "server-only"

import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { createRequestId, logServerEvent } from "@/lib/serverLog"

type RateLimitBucket = {
  count: number
  resetAt: number
}

type RateLimitStore = Map<string, RateLimitBucket>

type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfter: number
  backend: "memory" | "redis"
}

const globalRateLimit = globalThis as typeof globalThis & {
  __smashLobRateLimits?: RateLimitStore
}

const store =
  globalRateLimit.__smashLobRateLimits ??
  (globalRateLimit.__smashLobRateLimits = new Map())

const DISTRIBUTED_RATE_LIMIT_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return { current, ttl }
`.trim()

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

async function consumeConfiguredRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string
  limit: number
  windowMs: number
}): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

  if (!redisUrl || !redisToken) {
    return { ...consumeRateLimit({ key, limit, windowMs }), backend: "memory" }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2_000)

  try {
    const response = await fetch(redisUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "EVAL",
        DISTRIBUTED_RATE_LIMIT_SCRIPT,
        "1",
        `smash-lob:rate-limit:${key}`,
        String(windowMs),
      ]),
      cache: "no-store",
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`redis_http_${response.status}`)
    }

    const payload = (await response.json()) as {
      result?: unknown
      error?: unknown
    }
    if (payload.error || !Array.isArray(payload.result)) {
      throw new Error("redis_invalid_response")
    }

    const count = Number(payload.result[0])
    const ttlMs = Number(payload.result[1])
    if (!Number.isFinite(count) || !Number.isFinite(ttlMs)) {
      throw new Error("redis_invalid_counters")
    }

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfter: count <= limit ? 0 : Math.max(1, Math.ceil(ttlMs / 1000)),
      backend: "redis",
    }
  } catch (error) {
    logServerEvent("warn", "distributed_rate_limit_unavailable", {
      operation: "rate_limit_backend",
      outcome: "memory_fallback",
      errorCode:
        error instanceof Error ? error.message.slice(0, 80) : "unknown_error",
    })
    return { ...consumeRateLimit({ key, limit, windowMs }), backend: "memory" }
  } finally {
    clearTimeout(timeout)
  }
}

export async function enforceRequestRateLimit({
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
  const result = await consumeConfiguredRateLimit({
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
        "X-Smash-Lob-RateLimit-Backend": result.backend,
      },
    },
  )
}
