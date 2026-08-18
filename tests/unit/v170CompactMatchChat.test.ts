import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.7.0 compact match chat", () => {
  it("keeps the participant-only API and message limits", async () => {
    const api = await readFile("src/app/api/matches/[matchId]/chat/route.ts", "utf8")
    for (const token of ["getServerMatchActor", "requireLeagueAccess: true", "requireParticipant: true", "participantPlayerId", "body.length > 2000", "Date.now() - 10_000", ">= 8", ".limit(60)"]) expect(api).toContain(token)
  })
  it("keeps the mobile realtime and detail entry contracts", async () => {
    const [page, shared, detail] = await Promise.all([
      readFile("src/app/match/[id]/chat/page.tsx", "utf8"),
      readFile("src/components/match/chat/MatchChatShared.tsx", "utf8"),
      readFile("src/app/match/[id]/page.tsx", "utf8"),
    ])
    for (const token of ["const initialTimer = window.setTimeout", "subscribeChatRealtime", "Chat · Jornada", "useCurrentLeagueData"]) expect(page).toContain(token)
    expect(page).toContain("<MatchChatFrame")
    expect(page).toContain("<MatchChatComposer")
    expect(shared).toContain("<BackButton")
    expect(shared).toContain("maxLength={2000}")
    expect(shared).toContain('event.key === "Enter"')
    expect(page).not.toContain("window.setInterval")
    expect(detail).toContain('chatHref={isMatchParticipant ? `/match/${match.id}/chat` : null}')
    expect(detail).not.toContain("Habla con los otros jugadores y organiza el encuentro.")
  })
})
