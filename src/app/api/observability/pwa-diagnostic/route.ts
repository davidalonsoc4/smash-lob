import { NextResponse } from "next/server"
import { isAvatarLabEnabled, isAvatarLabRequest } from "@/lib/avatarLabAccess"
import { sanitizePwaDiagnostic } from "@/lib/pwaDiagnostic"
import { createIncidenceCode } from "@/lib/serverLog"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { APP_VERSION } from "@/lib/appVersion"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export async function POST(request: Request) {
  if (!isAvatarLabEnabled() || !isAvatarLabRequest(request)) return NextResponse.json({ error: "not_found" }, { status: 404 })
  const origin = request.headers.get("origin")
  if (origin) {
    try {
      const external = new URL(origin), host = request.headers.get("host") ?? new URL(request.url).host
      if (!/^https?:$/.test(external.protocol) || external.host.toLowerCase() !== host.toLowerCase() || !isAvatarLabRequest(new Request(external.origin))) return NextResponse.json({ error: "invalid_origin" }, { status: 403 })
    } catch { return NextResponse.json({ error: "invalid_origin" }, { status: 403 }) }
  }
  const limited = await enforceRequestRateLimit({ request, scope: "pwa-diagnostic", limit: 5, windowMs: 60_000 })
  if (limited) return limited
  if (Number(request.headers.get("content-length")) > 8_192) return NextResponse.json({ error: "payload_too_large" }, { status: 413 })
  let report
  try {
    const body = await request.text()
    if (body.length > 8_192) return NextResponse.json({ error: "payload_too_large" }, { status: 413 })
    report = sanitizePwaDiagnostic(JSON.parse(body))
  } catch { return NextResponse.json({ error: "invalid_payload" }, { status: 400 }) }
  if (!report) return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
  const incidenceCode = createIncidenceCode()
  console.info(JSON.stringify({ timestamp: new Date().toISOString(), level: "info", message: "pwa_diagnostic_reported", version: APP_VERSION, incidenceCode, diagnostic: report }))
  return NextResponse.json({ accepted: true, incidenceCode }, { status: 202, headers: { "Cache-Control": "no-store" } })
}
