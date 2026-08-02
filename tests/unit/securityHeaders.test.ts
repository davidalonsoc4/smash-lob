import { describe, expect, it } from "vitest"
import nextConfig from "../../next.config"

describe("security headers", () => {
  it("sets the compatible browser security baseline", async () => {
    const rules = await nextConfig.headers?.()
    const headers = new Map(
      (rules?.[0]?.headers ?? []).map(({ key, value }) => [key, value]),
    )
    const csp = headers.get("Content-Security-Policy") ?? ""

    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("https://*.supabase.co")
    expect(csp).toContain("https://accounts.google.com")
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff")
    expect(headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    )
    expect(headers.get("Permissions-Policy")).toContain("camera=()")
  })
})
