import { describe, expect, it } from "vitest"
import { buildRapidRounds } from "@/lib/rapidTournament"
import { buildRapidCues, getDueRapidCues, getEffectiveRapidRounds, getRapidLiveState } from "@/lib/rapidTournamentTiming"

const anchor = "2026-10-17T07:05:00Z", start = Date.parse(anchor)
describe("rapid tournament actual-start clock", () => {
  it("runs preparation, six rounds and five pauses continuously within the reservation", () => {
    expect(getRapidLiveState(anchor, start)).toMatchObject({ phase: "preparation", remaining: 120 })
    for (let round = 1; round <= 6; round++) {
      const at = start + (2 + (round - 1) * 19) * 60_000
      expect(getRapidLiveState(anchor, at)).toMatchObject({ phase: "playing", round, remaining: 960 })
      if (round < 6) expect(getRapidLiveState(anchor, at + 960_000)).toMatchObject({ phase: "transition", round: round + 1, remaining: 180 })
    }
    expect(getRapidLiveState(anchor, start + 113 * 60_000)).toMatchObject({ phase: "ended", remaining: 0, finish: start + 113 * 60_000 })
    expect(getRapidLiveState("invalid", start)).toBeNull()
  })
  it("derives the persisted calendar from actual start without changing identities or fixtures", () => {
    const planned = buildRapidRounds("2026-10-17T07:00:00Z").map((r) => ({ ...r, id: `round-${r.round}` }))
    const actual = getEffectiveRapidRounds(planned, anchor)
    expect(actual[0]).toMatchObject({ id: "round-1", startsAt: "2026-10-17T07:07:00.000Z" })
    expect(actual[5].endsAt).toBe("2026-10-17T08:58:00.000Z")
    expect(getEffectiveRapidRounds(actual, anchor)).toEqual(actual)
    expect(planned[0].startsAt).toBe("2026-10-17T07:00:00.000Z")
  })
  it("announces preparation, starts, two-minute warnings and ends once per boundary, skipping stale alerts", () => {
    const cues = buildRapidCues(anchor)
    expect(cues).toHaveLength(19)
    expect(new Set(cues.map((cue) => cue.id)).size).toBe(19)
    expect(cues.at(-1)).toMatchObject({ kind: "finished", round: 6, at: start + 113 * 60_000 })
    for (const cue of cues) {
      expect(getDueRapidCues(cues, cue.at - 1, cue.at)).toEqual([cue])
      expect(getDueRapidCues(cues, cue.at, cue.at + 1000)).toEqual([])
      expect(getDueRapidCues(cues, cue.at - 1, cue.at + 4000)).toEqual([])
    }
    expect(cues.find((cue) => cue.id === "two-1")?.at).toBe(start + 16 * 60_000)
  })
  it("counts down each round start and end without changing the original schedule or replaying old numbers", () => {
    const cues = buildRapidCues(anchor, true), base = buildRapidCues(anchor)
    expect(cues).toHaveLength(55)
    expect(cues.filter((cue) => cue.kind !== "countdown")).toEqual(base)
    for (const boundary of base.filter((cue) => ["start", "end", "finished"].includes(cue.kind))) {
      const countdown = cues.filter((cue) => cue.id.startsWith(`count-${boundary.id}-`))
      expect(countdown.map((cue) => cue.count)).toEqual([3, 2, 1])
      expect(countdown.map((cue) => boundary.at - cue.at)).toEqual([3000, 2000, 1000])
    }
    const target = start + 120_000
    expect(getDueRapidCues(cues, target - 4000, target).map((cue) => cue.id)).toEqual(["start-1"])
  })
})
