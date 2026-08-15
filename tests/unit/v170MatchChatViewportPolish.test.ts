import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.7.0 match chat viewport polish", () => {
  it("turns match chat into an immersive screen without the global navbar", async () => {
    const shell = await readFile("src/components/layout/AppShell.tsx", "utf8")
    expect(shell).toContain('pathname.startsWith("/match/") && pathname.endsWith("/chat")')
    expect(shell).toContain("!isMatchChatRoute &&")
    expect(shell).toContain('data-match-chat-route={isMatchChatRoute}')
    expect(shell).toContain('isMatchChatRoute ? "h-[100dvh] min-h-0 overflow-hidden p-0" : "px-3"')
    expect(shell).toContain('paddingTop: isMatchChatRoute')
    expect(shell).toContain('paddingBottom: isMatchChatRoute')
  })

  it("follows the visual viewport so the keyboard shrinks chat instead of moving the page", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain("window.visualViewport")
    expect(page).toContain("visualViewport?.height ?? window.innerHeight")
    expect(page).toContain("visualViewport?.offsetTop ?? 0")
    expect(page).toContain('html.style.overflow = "hidden"')
    expect(page).toContain('pageBody.style.overflow = "hidden"')
    expect(page).toContain('visualViewport?.addEventListener("resize", handleViewportResize)')
    expect(page).toContain('visualViewport?.addEventListener("scroll", handleViewportScroll)')
    expect(page).toContain('composer?.addEventListener("focus", handleComposerFocus)')
    expect(page).toContain('syncViewport(true, true)')
    expect(page).toContain('for (const delay of [0, 80, 180, 320])')
    expect(page).toContain('className="fixed inset-x-0 top-0 z-[60] mx-auto flex w-full max-w-md min-h-0 flex-col overflow-hidden bg-stone-50"')
    expect(page).toContain('ref={messagesRef}')
    expect(page).toContain("panel.scrollTop = panel.scrollHeight")
  })

  it("centers the chat title independently from the back button", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain('className="relative flex min-h-10 items-center"')
    expect(page).toContain('absolute left-1/2 max-w-[65%] -translate-x-1/2 truncate text-center')
  })

  it("keeps the composer attached to the visible viewport and avoids iOS input zoom", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain('data-tour="chat-composer"')
    expect(page).toContain('replyingTo ? "" : "border-t border-neutral-200"')
    expect(page).toContain("--match-chat-bottom-inset")
    expect(page).toContain("restingViewportHeight - visibleHeight > 120")
    expect(page).toContain('keyboardLikelyOpen ? "0px"')
    expect(page).toContain('enterKeyHint="send"')
    expect(page).toContain("text-base")
    expect(page).toContain("resizeComposer")
    expect(page).not.toContain('bottom: "calc(72px')
    expect(page).not.toContain("sticky bottom-16")
  })

  it("reuses the compact calendar team panel and keeps message time compact", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain('import { MatchTeamsPanel } from "@/components/matches/MatchTeamsPanel"')
    expect(page).toContain("teamA={match.teamA}")
    expect(page).toContain("teamB={match.teamB}")
    expect(page).toContain('mode="versus"')
    expect(page).toContain('linkPlayers={false}')
    expect(page).toContain("origin-right scale-90 type-caption")
    expect(page).not.toMatch(/text-\[\d+px\]/)
  })
})
