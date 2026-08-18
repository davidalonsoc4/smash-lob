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
    const chatAction = await readFile("src/components/match/MatchChatFloatingAction.tsx", "utf8")
    expect(menu).toContain("<MatchChatActionLink")
    expect(chatAction).toContain('aria-label="Abrir chat del partido"')
    expect(chatAction).toContain("flex flex-col items-end gap-2")
    expect(menu).toContain("min-w-52")
    expect(menu).toContain("px-3 py-2.5 text-left text-sm font-black")
  })

  it("shows journey and current players in an immersive keyboard-aware shared chat", async () => {
    const [page, shared, shell] = await Promise.all([
      readFile("src/app/match/[id]/chat/page.tsx", "utf8"),
      readFile("src/components/match/chat/MatchChatShared.tsx", "utf8"),
      readFile("src/components/layout/AppShell.tsx", "utf8"),
    ])
    expect(page).toContain('matchRound ? `Chat · Jornada ${matchRound}`')
    expect(page).toContain("useCurrentLeagueData")
    expect(page).toContain('import { MatchTeamsPanel } from "@/components/matches/MatchTeamsPanel"')
    expect(page).toContain("teamA={match.teamA}")
    expect(page).toContain("teamB={match.teamB}")
    expect(page).toContain("<MatchChatFrame")
    expect(page).toContain("<MatchChatComposer")
    expect(page).toContain("hasTopAttachment={Boolean(replyingTo)}")
    expect(shared).toContain("window.visualViewport")
    expect(shared).toContain('data-tour="chat-composer"')
    expect(shared).toContain('hasTopAttachment ? "" : "border-t border-neutral-200"')
    expect(shared).toContain("<header")
    expect(shared).not.toContain("<header><p")
    expect(shell).toContain("isMatchChatRoute")
    expect(shell).toContain("!isMatchChatRoute &&")
    expect(page).not.toContain('match.teamA.map(name).join(" / ")')
    expect(page).not.toContain('match.teamB.map(name).join(" / ")')
    expect(shared).not.toContain('bottom: "calc(72px')
    expect(shared).not.toContain("sticky bottom-16")
  })
})
