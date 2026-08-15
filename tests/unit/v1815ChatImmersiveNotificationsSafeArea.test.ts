import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.15 immersive chat, grouped push and safe areas", () => {
  it("keeps CHAT full bleed, removes the coordinating strip and groups bubbles from the top", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    const css = await readFile("src/app/globals.css", "utf8")
    expect(page).toContain('data-tour="chat-messages" className="flex min-h-0 flex-1 flex-col overflow-hidden bg-neutral-100"')
    expect(page).not.toContain('>Coordinando</div>')
    expect(page).toContain("!previousSameSender ? <PlayerAvatar")
    expect(page).toContain('!previousSameSender ? \"rounded-tl-md \" : \"\"')
    expect(page).toContain('!previousSameSender ? \"rounded-tr-md \" : \"\"')
    expect(css).not.toContain("chat-bubble-incoming-first")
    expect(page).toContain("chat-message-enter")
    expect(page).toContain("chatMessageKey(message)")
    expect(css).toContain("@keyframes chat-message-enter")
  })

  it("groups every push from the same match chat under one notification tag", async () => {
    const dispatch = await readFile("src/lib/serverPushDispatch.ts", "utf8")
    const sw = await readFile("public/sw.js", "utf8")
    expect(dispatch).toContain('`smash-lob-chat-${event.match_id}`')
    expect(sw).toContain('startsWith("smash-lob-chat-")')
    expect(sw).toContain("renotify:")
  })

  it("keeps tours and headers inside the visual viewport and adds an iPhone standalone safe-area fallback", async () => {
    const overlay = await readFile("src/components/onboarding/GuidedTourOverlay.tsx", "utf8")
    const layout = await readFile("src/app/layout.tsx", "utf8")
    const css = await readFile("src/app/globals.css", "utf8")
    const shell = await readFile("src/components/layout/AppShell.tsx", "utf8")
    expect(overlay).toContain("window.visualViewport")
    expect(overlay).toContain("maxHeight")
    expect(overlay).toContain("viewport.top + 12")
    expect(layout).toContain("--app-safe-top-fallback")
    expect(layout).toContain("/iPhone/i")
    expect(css).toContain("--app-safe-top: max(env(safe-area-inset-top")
    expect(css).toContain("app-match-chat-header")
    expect(shell).toContain("var(--app-safe-top)")
  })
})
