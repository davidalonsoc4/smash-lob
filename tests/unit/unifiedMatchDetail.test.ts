import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (file: string) => readFile(file, "utf8")

describe("unified match detail", () => {
  it("shares the league visual shell while keeping personal persistence isolated", async () => {
    const [leaguePage, personalPage, sharedView, editor, selector, detailRoute, serverHelper, personalResult] =
      await Promise.all([
        read("src/app/match/[id]/page.tsx"),
        read("src/app/personal-matches/[id]/page.tsx"),
        read("src/components/match/MatchDetailView.tsx"),
        read("src/components/personal/PersonalMatchParticipantsPanel.tsx"),
        read("src/components/personal/PersonalMatchParticipantSelector.tsx"),
        read("src/app/api/personal-matches/[id]/route.ts"),
        read("src/lib/serverPersonalMatches.ts"),
        read("src/components/personal/PersonalMatchResultForm.tsx"),
      ])

    expect(leaguePage).toContain("<MatchDetailView")
    expect(leaguePage).toContain('title={`${t.matches.round} ${match.round}`}')
    expect(leaguePage).not.toContain('subtitle={`${t.matches.round} ${match.round}`}')
    expect(personalPage).toContain('title="Partido"')
    expect(personalPage).toContain("<MatchDetailView")
    expect(sharedView).toContain("<BackButton")
    expect(sharedView).toContain("<MatchStatusBadge")
    expect(sharedView).toContain("<MatchDetailPairingPanel")
    expect(personalPage).toContain("<PersonalMatchParticipantsPanel")
    expect(editor).toContain("<PersonalMatchParticipantSelector")
    expect(editor).toContain('action: "participants"')
    expect(selector).toContain("Otro jugador...")
    expect(detailRoute).toContain('match.status !== "scheduled"')
    expect(detailRoute).toContain("replacePersonalMatchParticipants")
    expect(serverHelper).toContain("originalParticipants")
    expect(serverHelper).toContain("personal_match_requires_current_user")
    expect(personalResult).toContain("<MatchResultForm")
  })
})
