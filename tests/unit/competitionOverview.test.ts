import { describe, expect, it } from "vitest"
import { selectCompetitionHighlight } from "@/lib/competitionOverview"
import type { PersonalMatchItem } from "@/lib/personalMatches"

const now = new Date("2026-10-16T12:00:00Z")
function match(id: string, overrides: Partial<PersonalMatchItem> = {}): PersonalMatchItem {
  return { id, origin: "friendly", status: "scheduled", scheduledAt: "2026-10-17T12:00:00Z", resultRecordedAt: null, locationName: null, sets: [], canManage: false, canDelete: false, leagueId: null, leagueName: null, seasonId: null, seasonName: null, round: null, participants: [{ team: 1, slot: 1, displayName: "Fixture", isCurrentUser: true }], ...overrides }
}
describe("competition overview", () => {
  it("prioritizes a match in progress over future league and friendly encounters", () => {
    const live = match("live", { scheduledAt: "2026-10-16T11:00:00Z" })
    expect(selectCompetitionHighlight([match("future"), live], now)).toEqual({ kind: "live", match: live })
  })
  it("chooses the earliest own encounter across leagues and friendlies", () => {
    const league = match("league", { origin: "league", leagueId: "league-a", scheduledAt: "2026-10-16T14:00:00Z" })
    const other = match("other", { scheduledAt: "2026-10-16T13:00:00Z", participants: [] })
    expect(selectCompetitionHighlight([match("friendly"), other, league], now)).toEqual({ kind: "next", match: league })
  })
  it("falls back to the latest played encounter, excluding overdue and invalid dates", () => {
    const last = match("last", { status: "finished", scheduledAt: "2026-10-15T12:00:00Z", resultRecordedAt: "2026-10-15T15:00:00Z" })
    expect(selectCompetitionHighlight([match("overdue", { scheduledAt: "2026-10-16T08:00:00Z" }), match("invalid", { scheduledAt: "invalid" }), last], now)).toEqual({ kind: "last", match: last })
  })
  it("does not invent an encounter when only unscheduled or overdue fixtures exist", () => {
    expect(selectCompetitionHighlight([match("none", { scheduledAt: null }), match("old", { scheduledAt: "2026-10-01T12:00:00Z" })], now)).toBeNull()
    expect(selectCompetitionHighlight([], now)).toBeNull()
  })
})
