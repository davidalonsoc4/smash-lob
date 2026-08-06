import { createHash } from "node:crypto"
import { NextResponse } from "next/server"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import {
  createIncidenceCode,
  createRequestId,
  logServerEvent,
} from "@/lib/serverLog"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function safeString(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : ""
}

export async function POST(request: Request) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "client-error-report",
    limit: 10,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const contentLength = Number(request.headers.get("content-length") ?? "0")
  if (Number.isFinite(contentLength) && contentLength > 4_096) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 })
  }

  const rawPayload = await request.text()
  if (rawPayload.length > 4_096) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 })
  }

  let payload: Record<string, unknown> | null = null
  try {
    const parsed = JSON.parse(rawPayload) as unknown
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      payload = parsed as Record<string, unknown>
    }
  } catch {
    payload = null
  }

  if (!payload) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  }

  const kind = safeString(payload.kind, 40) || "client_error"
  const route = safeString(payload.route, 200) || "unknown"
  const message = safeString(payload.message, 500) || "client_error"
  const fingerprint = createHash("sha256")
    .update(`${kind}:${route}:${message}`)
    .digest("hex")
    .slice(0, 16)
  const incidenceCode = createIncidenceCode()

  logServerEvent("error", "client_error_reported", {
    requestId: createRequestId(request),
    route,
    method: "CLIENT",
    operation: kind,
    outcome: "reported",
    errorCode: fingerprint,
    incidenceCode,
  })

  return NextResponse.json(
    { accepted: true, incidenceCode },
    { status: 202, headers: { "Cache-Control": "no-store" } },
  )
}
