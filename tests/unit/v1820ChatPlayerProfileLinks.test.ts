import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.20 chat player profile links", () => {
  it("routes visible chat player names through the real participant player id", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")

    expect(page).toContain("function participantProfileHref(participant: Participant | null | undefined)")
    expect(page).toContain("const player = players.find((item) => item.id === participant.playerId)")
    expect(page).toContain("return `/player/${player?.slug ?? participant.playerId}`")
  })

  it("links sender names, proposal voters and reply references without nesting links inside proposal buttons", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")

    expect(page).toContain("participantNameLink(item, true)")
    expect(page).toContain("const senderHref = participantProfileHref(sender)")
    expect(page).toContain("const quotedHref = participantProfileHref(quotedParticipant)")
    expect(page).toContain("const replyingHref = participantProfileHref(replyingParticipant)")
    expect(page).toContain("href={senderHref}")
    expect(page).toContain("href={quotedHref}")
    expect(page).toContain("href={replyingHref}")
  })
})
