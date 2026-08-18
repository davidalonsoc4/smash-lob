import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.7.0 match chat viewport polish", () => {
  it("turns match chat into an immersive screen without the global navbar", async () => {
    const shell = await readFile("src/components/layout/AppShell.tsx", "utf8")
    expect(shell).toContain('(pathname.startsWith("/match/") ||')
    expect(shell).toContain('pathname.startsWith("/personal-matches/")) &&')
    expect(shell).toContain('pathname.endsWith("/chat")')
    expect(shell).toContain("!isMatchChatRoute &&")
    expect(shell).toContain('data-match-chat-route={isMatchChatRoute}')
    expect(shell).toContain('isMatchChatRoute ? "h-[100dvh] min-h-0 overflow-hidden p-0" : "px-3"')
    expect(shell).toContain('paddingTop: isMatchChatRoute')
    expect(shell).toContain('paddingBottom: isMatchChatRoute')
  })

  it("follows the visual viewport so the keyboard shrinks both chats instead of moving the page", async () => {
    const [page, personal, shared] = await Promise.all([
      readFile("src/app/match/[id]/chat/page.tsx", "utf8"),
      readFile("src/app/personal-matches/[id]/chat/page.tsx", "utf8"),
      readFile("src/components/match/chat/MatchChatShared.tsx", "utf8"),
    ])
    expect(page).toContain("useMatchChatViewport")
    expect(personal).toContain("useMatchChatViewport")
    expect(shared).toContain("window.visualViewport")
    expect(shared).toContain("visualViewport?.height ?? window.innerHeight")
    expect(shared).toContain("visualViewport?.offsetTop ?? 0")
    expect(shared).toContain('html.style.overflow = "hidden"')
    expect(shared).toContain('pageBody.style.overflow = "hidden"')
    expect(shared).toContain('visualViewport?.addEventListener("resize", handleViewportResize)')
    expect(shared).toContain('visualViewport?.addEventListener("scroll", handleViewportScroll)')
    expect(shared).toContain('composer?.addEventListener("focus", handleComposerFocus)')
    expect(shared).toContain('syncViewport(true, true)')
    expect(shared).toContain('for (const delay of [0, 80, 180, 320])')
    expect(shared).toContain('className="fixed inset-x-0 top-0 z-[60] mx-auto flex w-full max-w-md min-h-0 flex-col overflow-hidden bg-stone-50"')
    expect(page).toContain('ref={messagesRef}')
    expect(shared).toContain("panel.scrollTop = panel.scrollHeight")
  })

  it("centers the shared chat title independently from the back button", async () => {
    const shared = await readFile("src/components/match/chat/MatchChatShared.tsx", "utf8")
    expect(shared).toContain('className="relative flex min-h-10 items-center"')
    expect(shared).toContain('absolute left-1/2 max-w-[65%] -translate-x-1/2 truncate')
  })

  it("keeps the shared composer attached to the visible viewport and avoids iOS input zoom", async () => {
    const [page, shared] = await Promise.all([
      readFile("src/app/match/[id]/chat/page.tsx", "utf8"),
      readFile("src/components/match/chat/MatchChatShared.tsx", "utf8"),
    ])
    expect(page).toContain("<MatchChatComposer")
    expect(shared).toContain('data-tour="chat-composer"')
    expect(shared).toContain('hasTopAttachment ? "" : "border-t border-neutral-200"')
    expect(shared).toContain("--match-chat-bottom-inset")
    expect(shared).toContain("restingViewportHeight - visibleHeight > 120")
    expect(shared).toContain('keyboardLikelyOpen ? "0px"')
    expect(shared).toContain('enterKeyHint="send"')
    expect(shared).toContain("text-base")
    expect(page).toContain("resizeMatchChatComposer")
    expect(shared).not.toContain('bottom: "calc(72px')
    expect(shared).not.toContain("sticky bottom-16")
  })

  it("reuses the compact calendar team panel and keeps message time compact", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain('import { MatchTeamsPanel } from "@/components/matches/MatchTeamsPanel"')
    expect(page).toContain("teamA={match.teamA}")
    expect(page).toContain("teamB={match.teamB}")
    expect(page).toContain('mode="versus"')
    expect(page).toContain('linkPlayers={false}')
    const shared = await readFile("src/components/match/chat/MatchChatShared.tsx", "utf8")
    expect(shared).toContain("origin-right scale-90 type-caption")
    expect(page).not.toMatch(/text-\[\d+px\]/)
  })
})
