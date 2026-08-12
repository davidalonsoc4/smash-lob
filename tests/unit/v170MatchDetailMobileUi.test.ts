import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.7.0 match detail mobile UI polish", () => {
  it("keeps the location selector compact in a top-level, keyboard-bounded scrollable portal", async () => {
    const schedule = await readFile("src/components/match/MatchScheduleForm.tsx", "utf8")
    for (const token of [
      'import { createPortal } from "react-dom"',
      "createPortal(<>",
      'aria-haspopup="dialog"',
      'aria-label="Buscar ubicación"',
      "z-[100]",
      "z-[110]",
      "bg-neutral-950/45",
      "100dvh",
      "min(440px",
      "min-h-0 flex-1 overflow-y-auto overscroll-contain",
      "Buscar por localidad o nombre...",
      "Recomendadas por la liga",
      "Todas las ubicaciones",
      "+ Añadir nueva ubicación",
      "selectedLocationLabel",
    ]) expect(schedule).toContain(token)
    expect(schedule).not.toContain("min(620px")
  })

  it("stacks the chat bubble above the larger match-actions menu", async () => {
    const menu = await readFile("src/components/match/MatchActionsMenu.tsx", "utf8")
    expect(menu).toContain('aria-label="Abrir chat del partido"')
    expect(menu).toContain("flex flex-col items-end gap-2")
    expect(menu).toContain("min-w-52")
    expect(menu).toContain("px-3 py-2.5 text-left text-sm font-black")
  })

  it("shows journey and current players while pinning the composer to the navbar", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    const header = page.match(/<header\b[^>]*app-page-header[^>]*>[\s\S]*?<\/header>/)?.[0] ?? ""
    expect(header).toContain("Chat · Jornada")
    expect(header).not.toContain("<p")
    expect(page).toContain("useCurrentLeagueData")
    expect(page).toContain('match.teamA.map(name).join(" / ")')
    expect(page).toContain('match.teamB.map(name).join(" / ")')
    expect(page).toContain('bottom: "calc(72px + env(safe-area-inset-bottom, 0px))"')
    expect(page).not.toContain("sticky bottom-16")
  })
})
