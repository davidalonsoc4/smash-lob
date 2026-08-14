import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.8.6 home and calendar coordination status", () => {
  it("derives coordination in the access snapshot without exposing chat details in cards", async () => {
    const [access, matchData, matchCard, statusBadge, statusStyles] = await Promise.all([
      read("src/app/api/access/route.ts"),
      read("src/context/MatchDataProvider.tsx"),
      read("src/components/matches/MatchCard.tsx"),
      read("src/components/matches/MatchStatusBadge.tsx"),
      read("src/lib/statusStyles.ts"),
    ])
    expect(access).toContain('from("match_chat_messages")')
    expect(access).toContain('from("match_chat_proposal_responses")')
    expect(access).toContain("buildMatchChatCoordination")
    expect(access).toContain("coordinationStatus: coordinationStatusByMatchId.get(mappedMatch.id) ?? null")
    expect(matchData).toContain('coordinationStatus?: "coordinating" | "awaiting_booking" | null')
    expect(matchCard).toContain("coordinationStatus={match.coordinationStatus ?? null}")
    expect(statusBadge).toContain('coordinating: "Coordinando"')
    expect(statusBadge).toContain('awaiting_booking: "Pendiente de reserva"')
    expect(statusStyles).toContain('coordinating: "violet"')
    expect(statusStyles).toContain('awaiting_booking: "indigo"')
  })

  it("keeps Home and Calendar on the existing MatchCard instead of adding extra coordination UI", async () => {
    const [home, calendar] = await Promise.all([read("src/app/page.tsx"), read("src/app/matches/page.tsx")])
    expect(home).toContain("<MatchCard")
    expect(calendar).toContain("<MatchCard")
    expect(home).not.toContain("Pendiente de reserva</")
    expect(calendar).not.toContain("Pendiente de reserva</")
    expect(home).not.toContain("Coordinando</")
    expect(calendar).not.toContain("Coordinando</")
  })

  it("syncs the derived state after chat actions so back navigation is immediately current", async () => {
    const chat = await read("src/app/match/[id]/chat/page.tsx")
    expect(chat).toContain("const { hydrateMatches } = useMatchData()")
    expect(chat).toContain("coordinationStatus: snapshot.coordination?.status")
  })
})
