import { describe, expect, it } from "vitest"
import { selectCompetitionPreview } from "@/lib/competitionOverview"

describe("competition summary selection", () => {
  it("reserves a slot for upcoming competitions even with multiple active ones", () => {
    expect(selectCompetitionPreview([
      { item: "active-a", phase: "active" }, { item: "active-b", phase: "active" },
      { item: "upcoming", phase: "upcoming" }, { item: "finished", phase: "finished" },
    ])).toEqual(["active-a", "upcoming"])
  })
  it("orders upcoming competitions by start, then newest creation without dates", () => {
    const upcoming = (item: string, startsAt?: string, createdAt?: string) => ({ item, phase: "upcoming" as const, startsAt, createdAt })
    expect(selectCompetitionPreview([
      upcoming("later", "2026-12-01"), upcoming("undated", undefined, "2026-10-23"), upcoming("sooner", "2026-11-01"),
    ])).toEqual(["sooner", "later"])
    expect(selectCompetitionPreview([
      upcoming("old", undefined, "2026-10-01"), upcoming("new", undefined, "2026-10-23"), upcoming("unknown"),
    ])).toEqual(["new", "old"])
  })
  it("fills available slots from one group and excludes finished competitions", () => {
    expect(selectCompetitionPreview([{ item: "a", phase: "active" }, { item: "b", phase: "active" }])).toEqual(["a", "b"])
    expect(selectCompetitionPreview([{ item: "a", phase: "upcoming" }, { item: "b", phase: "finished" }])).toEqual(["a"])
    expect(selectCompetitionPreview([])).toEqual([])
  })
})
