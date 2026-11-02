import { afterEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { proxy } from "@/proxy"
afterEach(() => vi.unstubAllEnvs())
describe("tournament production route boundary", () => {
  const paths = ["/tournaments", "/tournaments/new", "/tournaments/fixture/calendar", "/api/tournaments", "/api/tournaments/fixture/start", "/tournament-invite/fixture", "/api/tournament-invites/fixture/claim", "/settings/sounds"]
  it.each(paths)("denies %s in production regardless of operation", path => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://smashandlob.com")
    for (const method of ["GET", "POST", "DELETE"]) {
      const response = proxy(new NextRequest(`https://smashandlob.com${path}`, { method }))
      expect(response.status).toBe(404)
      expect(response.headers.get("Cache-Control")).toBe("no-store")
    }
  })
  it.each(paths)("keeps %s available in PRE", path => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://pre.smashandlob.com")
    expect(proxy(new NextRequest(`https://pre.smashandlob.com${path}`)).headers.get("x-middleware-next")).toBe("1")
  })
})
