// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest"
import { collectPwaDiagnostic } from "@/lib/pwaDiagnostic"
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })
it("captures actual browser colors and technical state without account or raw manifest data", async () => {
  document.documentElement.dataset.theme = "dark"
  document.documentElement.dataset.visualStyle = "competition"
  document.documentElement.style.cssText = "background:#000;color-scheme:dark"
  document.body.style.background = "#fff"
  document.head.innerHTML = '<meta name="theme-color" content="#000000">'
  vi.stubGlobal("matchMedia", () => ({ matches: true }))
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "/", name: "PRIVATE LEAGUE", token: "SECRET" }), { headers: { "content-type": "application/manifest+json" } })))
  const report = await collectPwaDiagnostic()
  expect(report.values.theme).toBe("dark")
  expect(report.values.rootBackground).toBe("rgb(0, 0, 0)")
  expect(report.values.bodyBackground).toBe("rgb(255, 255, 255)")
  expect(report.values.systemDark).toBe(true)
  expect(report.values.manifestTheme).toBe("absent")
  expect(JSON.stringify(report)).not.toMatch(/PRIVATE|SECRET|userAgent|token/)
})
