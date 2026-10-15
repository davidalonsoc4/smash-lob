// @vitest-environment jsdom
import React from "react"
import { readFileSync } from "node:fs"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ThemeProvider, useTheme } from "@/context/ThemeProvider"
import { COMPETITION_ACCENT_COLORS, getCompetitionTextAccent } from "@/lib/visualStyle"
import { applySpectatorInviteAppearance } from "@/lib/spectatorTheme"

vi.mock("next-auth/react", () => ({ useSession: () => ({ status: "authenticated" }) }))
vi.mock("next/navigation", () => ({ usePathname: () => "/settings/appearance" }))
let systemDark = false
const listeners = new Set<() => void>()
beforeEach(() => {
  localStorage.clear(); systemDark = false; listeners.clear()
  document.documentElement.removeAttribute("style")
  document.documentElement.className = ""
  document.head.innerHTML = '<meta name="theme-color" content="#000000">'
  vi.stubGlobal("matchMedia", () => ({ matches: systemDark, addEventListener: (_: string, fn: () => void) => listeners.add(fn), removeEventListener: (_: string, fn: () => void) => listeners.delete(fn) }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function Controls() {
  const theme = useTheme()
  return <><button onClick={() => theme.setVisualStyle("competition")}>Competition</button><button onClick={() => theme.setThemeMode("light")}>Light</button><button onClick={() => theme.setThemeMode("dark")}>Dark</button><button onClick={() => theme.setThemeMode("system")}>System</button></>
}
function luminance(hex: string) {
  const rgb = hex.match(/[a-f\d]{2}/gi)!.map(c => { const v = parseInt(c, 16) / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 })
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722
}
describe("Competition light", () => {
  it("preserves the base mode when selecting Competition and persists subsequent switches", () => {
    render(<ThemeProvider><Controls /></ThemeProvider>)
    fireEvent.click(screen.getByText("Competition"))
    expect(document.documentElement.dataset.theme).toBe("light")
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    fireEvent.click(screen.getByText("Dark"))
    expect(document.documentElement.dataset.theme).toBe("dark")
    fireEvent.click(screen.getByText("Light"))
    expect(localStorage.getItem("smash-lob-theme-mode")).toBe("light")
    expect(localStorage.getItem("smash-lob-visual-style")).toBe("competition")
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe("#ffffff")
  })
  it("follows system changes in both directions and removes its listener on unmount", () => {
    localStorage.setItem("smash-lob-visual-style", "competition")
    localStorage.setItem("smash-lob-theme-mode", "system")
    const view = render(<ThemeProvider><Controls /></ThemeProvider>)
    expect(document.documentElement.dataset.theme).toBe("light")
    act(() => { systemDark = true; listeners.forEach(fn => fn()) })
    expect(document.documentElement.dataset.theme).toBe("dark")
    act(() => { systemDark = false; listeners.forEach(fn => fn()) })
    expect(document.documentElement.dataset.theme).toBe("light")
    view.unmount(); expect(listeners.size).toBe(0)
  })
  it("restores light Competition before React starts for all stored accents", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf8")
    const script = layout.match(/__html: `([\s\S]*?)`,/)![1]
    for (const accent of Object.keys(COMPETITION_ACCENT_COLORS)) {
      localStorage.setItem("smash-lob-visual-style", "competition")
      localStorage.setItem("smash-lob-theme-mode", "light")
      localStorage.setItem("smash-lob-competition-accent", accent)
      new Function("window", "document", "localStorage", script)(window, document, localStorage)
      expect(document.documentElement.dataset.visualStyle).toBe("competition")
      expect(document.documentElement.dataset.theme).toBe("light")
      const color = COMPETITION_ACCENT_COLORS[accent as keyof typeof COMPETITION_ACCENT_COLORS]
      expect(document.documentElement.style.getPropertyValue("--competition-accent-text")).toBe(getCompetitionTextAccent(color, false))
    }
  })
  it("keeps accent text above 4.5:1 on light neutral and tinted surfaces", () => {
    for (const accent of [...Object.values(COMPETITION_ACCENT_COLORS), "#FFFFFF", "#000000", "#777777", "#FFFF00"]) {
      for (const surface of ["#ffffff", "#f3f5f8", "#e9edf3", "#e8dfcc", "#dce9f6"]) {
        expect((luminance(surface) + .05) / (luminance(getCompetitionTextAccent(accent, false)) + .05)).toBeGreaterThanOrEqual(4.5)
      }
      expect(getCompetitionTextAccent(accent, true)).toBe(accent.toUpperCase())
    }
  })
  it("keeps semantic status text readable against its actual light tint", () => {
    const css = readFileSync("src/app/globals.css", "utf8")
    const light = css.match(/html\[data-visual-style="competition"\]\[data-theme="light"\] \{([^}]+)\}/)![1]
    const values = Object.fromEntries([...light.matchAll(/--competition-([\w-]+): ([^;]+);/g)].map(match => [match[1], match[2]]))
    for (const [text, fill, alpha] of [["amber", "amber", .24], ["green", "green", .24], ["red", "red", .24], ["blue", "cyan", .22], ["violet", "violet", .22], ["orange", "orange", .22], ["rose", "rose", .22], ["friendly-text", "friendly", .32]] as const) {
      const background = "#" + values["rgb-" + fill].split(" ").map(c => Math.round(Number(c) * alpha + 255 * (1 - alpha)).toString(16).padStart(2, "0")).join("")
      expect((luminance(background) + .05) / (luminance(values["tone-" + text]) + .05), text).toBeGreaterThanOrEqual(4.5)
    }
    for (const text of ["text", "text-muted", "text-subtle"]) {
      for (const surface of ["bg", "surface", "surface-raised", "surface-muted"]) {
        expect((luminance(values[surface]) + .05) / (luminance(values[text]) + .05), text + "/" + surface).toBeGreaterThanOrEqual(4.5)
      }
    }
  })
  it("honors an explicit light appearance without persisting spectator preferences", () => {
    applySpectatorInviteAppearance({ visualStyle: "competition", baseTheme: "light" })
    expect(document.documentElement.dataset.theme).toBe("light")
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(localStorage.length).toBe(0)
  })
})
