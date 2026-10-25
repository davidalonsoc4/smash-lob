import { describe, expect, it } from "vitest"
import { buildRapidFixtures, buildRapidScheduleChecks } from "@/lib/rapidTournament"

const players = "ABCDEFGHIJKL".split("").map(id => ({ id, name: id }))
const fixtures = () => buildRapidFixtures().map(match => ({ ...match, teamAIds: match.teamA, teamBIds: match.teamB }))
describe("rapid schedule integrity", () => {
  it("rejects two simultaneous matches allocated to the same court", () => {
    const matches = fixtures()
    // Swapping the collision to another round keeps aggregate court usage balanced.
    matches[1].court = 1
    matches[2].court = 2
    expect(buildRapidScheduleChecks(players, matches).passed).toBe(false)
  })
  it("rejects duplicate participant identities even when roster size is unchanged", () => {
    expect(buildRapidScheduleChecks([...players.slice(0, 11), players[0]], fixtures()).passed).toBe(false)
  })
  it.each([0, 7, 1.5, NaN])("rejects matches outside integer rounds: %s", round => {
    const matches = fixtures()
    matches[0].round = round
    expect(buildRapidScheduleChecks(players, matches).checks.find(check => check.id === "complete-calendar")?.passed).toBe(false)
  })
  it.each([0, 3, 1.5, NaN])("rejects invalid court numbers: %s", court => {
    const matches = fixtures()
    matches[0].court = court
    expect(buildRapidScheduleChecks(players, matches).passed).toBe(false)
  })
})
