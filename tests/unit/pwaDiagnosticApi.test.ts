import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextResponse } from "next/server"
import { POST } from "@/app/api/observability/pwa-diagnostic/route"
import { sanitizePwaDiagnostic } from "@/lib/pwaDiagnostic"
const { limiter } = vi.hoisted(() => ({ limiter: vi.fn() }))
vi.mock("@/lib/serverRateLimit", () => ({ enforceRequestRateLimit: limiter }))
vi.mock("@/lib/serverLog", () => ({ createIncidenceCode: () => "SL-12345678" }))
const report = { schema: 1, values: { appVersion: "1.15.14", capturedAt: "2026-10-15T12:00:00.000Z", themeColors: "#000000", theme: "dark", systemDark: true } }
const request = (body: unknown = report, host = "pre.smashandlob.com", headers: Record<string, string> = {}) => new Request(`https://${host}/api/observability/pwa-diagnostic`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) })
beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://pre.smashandlob.com"); limiter.mockResolvedValue(null); vi.spyOn(console, "info").mockImplementation(() => {}) })
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks() })
describe("PRE PWA diagnostics", () => {
  it("logs only technical whitelisted fields and returns a searchable code", async () => {
    const response = await POST(request({ ...report, token: "SECRET", values: { ...report.values, email: "PERSONAL", cookie: "SECRET", bodyBackground: "rgb(0, 0, 0)" } }))
    expect(response.status).toBe(202)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(await response.json()).toEqual({ accepted: true, incidenceCode: "SL-12345678" })
    const entry = JSON.parse(vi.mocked(console.info).mock.calls[0][0])
    expect(entry.message).toBe("pwa_diagnostic_reported")
    expect(entry.diagnostic.values.bodyBackground).toBe("rgb(0, 0, 0)")
    expect(JSON.stringify(entry)).not.toMatch(/SECRET|PERSONAL|email|cookie|token/)
  })
  it("denies production even with spoofed PRE headers and configuration", async () => {
    expect((await POST(request(report, "smashandlob.com", { host: "pre.smashandlob.com", "x-forwarded-host": "pre.smashandlob.com" }))).status).toBe(404)
    expect(console.info).not.toHaveBeenCalled()
  })
  it("denies production configuration and foreign origins", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://smashandlob.com")
    expect((await POST(request())).status).toBe(404)
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://pre.smashandlob.com")
    expect((await POST(request(report, "pre.smashandlob.com", { origin: "https://other.example.test" }))).status).toBe(403)
    expect(console.info).not.toHaveBeenCalled()
  })
  it("respects rate limits", async () => {
    limiter.mockResolvedValueOnce(NextResponse.json({ error: "rate_limited" }, { status: 429 }))
    expect((await POST(request())).status).toBe(429)
    expect(console.info).not.toHaveBeenCalled()
  })
  it("uses the validated external Host when Next's internal URL differs", async () => {
    expect((await POST(request(report, "localhost:3100", { host: "127.0.0.1:3100", origin: "https://127.0.0.1:3100" }))).status).toBe(202)
  })
  it("rejects oversized or malformed reports without logging", async () => {
    expect((await POST(request(report, "pre.smashandlob.com", { "content-length": "9000" }))).status).toBe(413)
    expect((await POST(request({ ...report, values: { ...report.values, theme: "my private text" } }))).status).toBe(400)
    expect((await POST(request({ ...report, values: { ...report.values, width: -1 } }))).status).toBe(400)
    expect(console.info).not.toHaveBeenCalled()
  })
  it("cannot hide arbitrary text inside color fields", () => {
    expect(sanitizePwaDiagnostic({ ...report, values: { ...report.values, themeColors: "account@example.test" } })).toBeNull()
  })
})
