import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.18 chat history and proposal vote details", () => {
  it("uses asymmetric first-message corners without chat tails", async () => {
    const [page, css] = await Promise.all([readFile("src/app/match/[id]/chat/page.tsx", "utf8"), readFile("src/app/globals.css", "utf8")])
    expect(page).toContain('!previousSameSender ? "rounded-tl-md " : ""')
    expect(page).toContain('!previousSameSender ? "rounded-tr-md " : ""')
    expect(page).not.toContain("chat-bubble-incoming-first")
    expect(css).not.toContain("chat-bubble-incoming-first")
  })

  it("keeps timestamp and receipts reserved at the right edge of each message", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain('className="relative"')
    expect(page).toContain('mine ? "pr-16" : "pr-11"')
    expect(page).toContain('absolute bottom-0 right-0 inline-flex whitespace-nowrap leading-none')
    expect(page).not.toContain('inline-flex whitespace-nowrap align-baseline leading-none')
  })

  it("shows settings above the immersive match-chat layer", async () => {
    const shell = await readFile("src/components/layout/AppShell.tsx", "utf8")
    expect(shell).toContain('isMatchChatRoute ? "z-[70]" : "z-50"')
    expect(shell).toContain('data-tour="floating-settings"')
  })

  it("expands proposal vote details without cluttering the default card", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain("expandedProposalId")
    expect(page).toContain("proposalVoteDetailRows")
    expect(page).toContain("Toca para ver quién ha votado")
    expect(page).toContain("Pendiente:")
    expect(page).toContain("event.stopPropagation()")
  })

  it("documents proposal vote details in chat tour v6", async () => {
    const tours = await readFile("src/features/onboarding/tours.ts", "utf8")
    expect(tours).toContain('{ key: "chat", version: 6')
    expect(tours).toContain("quién ha votado a favor, en contra o sigue pendiente")
  })
})
