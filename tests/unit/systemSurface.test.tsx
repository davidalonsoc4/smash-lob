// @vitest-environment jsdom
import React from "react"
import { readFileSync } from "node:fs"
import { act, cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ThemeProvider, useTheme } from "@/context/ThemeProvider"
import manifest from "@/app/manifest"
import { applySpectatorInviteAppearance } from "@/lib/spectatorTheme"

vi.mock("next-auth/react", () => ({ useSession: () => ({ status: "unauthenticated" }) }))
vi.mock("next/navigation", () => ({ usePathname: () => "/" }))
afterEach(() => { cleanup(); localStorage.clear(); document.documentElement.removeAttribute("style"); vi.unstubAllGlobals() })
const bootstrap = readFileSync("src/app/layout.tsx", "utf8").match(/__html: `([^`]+)`/)![1]
function expectSurface(dark: boolean, standalone = false) {
  expect(document.documentElement.style.colorScheme).toBe(dark ? "dark" : "light")
  expect(document.documentElement.style.getPropertyValue("--app-system-surface")).toBe(standalone || dark ? "#000000" : "#ffffff")
  const expectedThemeColor = standalone || dark ? "#000000" : "#ffffff"
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => expect(meta.getAttribute("content")).toBe(expectedThemeColor))
}
describe("installed app system surfaces", () => {
  it("uses a black native navigation-bar fallback while retaining runtime page colors", () => {
    const installed = manifest()
    expect(installed.theme_color).toBe("#000000")
    expect(installed.background_color).toBe("#000000")
    expect(installed.id).toBe("/")
    expect(installed.display).toBe("standalone")
  })
  it.each(["classic", "competition"])("keeps %s cold start and runtime aligned across mode changes", (style) => {
    document.head.innerHTML = '<meta name="theme-color" content="red"><meta name="theme-color" content="blue">'
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("prefers-color-scheme: dark"), addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    localStorage.setItem("smash-lob-visual-style", style)
    localStorage.setItem("smash-lob-theme-mode", "light")
    window.eval(bootstrap)
    expectSurface(false)
    localStorage.setItem("smash-lob-theme-mode", "dark")
    window.eval(bootstrap)
    expectSurface(true)
    let theme: ReturnType<typeof useTheme>
    function Controls() { theme = useTheme(); return null }
    render(<ThemeProvider><Controls /></ThemeProvider>)
    expectSurface(true)
    act(() => theme.setThemeMode("light"))
    expectSurface(false)
    act(() => theme.setThemeMode("system"))
    expectSurface(true)
  })
  it.each(["classic", "competition"] as const)("keeps the installed %s canvas and metadata black while preserving the content color scheme", (style) => {
    document.head.innerHTML = '<meta name="theme-color" content="#000000">'
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("display-mode: standalone"), addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    localStorage.setItem("smash-lob-visual-style", style)
    localStorage.setItem("smash-lob-theme-mode", "light")
    window.eval(bootstrap)
    expectSurface(false, true)
    let theme: ReturnType<typeof useTheme>
    function Controls() { theme = useTheme(); return null }
    render(<ThemeProvider><Controls /></ThemeProvider>)
    expectSurface(false, true)
    act(() => theme.setThemeMode("dark"))
    expectSurface(true, true)
    act(() => theme.setThemeMode("light"))
    expectSurface(false, true)
    applySpectatorInviteAppearance({ visualStyle: style, baseTheme: "light" })
    expectSurface(false, true)
  })
  it("does not cover the bottom of the viewport with an artificial overlay", () => {
    const css = readFileSync("src/app/globals.css", "utf8")
    expect(css).not.toMatch(/body::after/)
    expect(css).not.toContain("max(env(safe-area-inset-bottom, 0px), 24px)")
  })
})
