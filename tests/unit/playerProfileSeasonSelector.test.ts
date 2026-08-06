import { describe, expect, it } from "vitest"
import type { Season } from "@/data/fakeData"
import type { PlayerSeasonScope } from "@/lib/playerHistory"
import {
  getLatestPlayerProfileSeason,
  getVisiblePlayerSeasonScopes,
  shouldShowPlayerProfileSeasonSelector,
} from "@/lib/playerProfileVisibility"

const seasons: Season[] = [
  {
    id: "season-1",
    leagueId: "league-1",
    name: "Temporada 1",
    status: "finished",
    totalRounds: 7,
    completedRounds: 7,
  },
  {
    id: "season-2",
    leagueId: "league-1",
    name: "Temporada 2",
    status: "active",
    totalRounds: 7,
    completedRounds: 2,
  },
]

const scopes: PlayerSeasonScope[] = [
  {
    id: "total-history",
    label: "Total histórico",
    seasonIds: ["season-2", "season-1"],
    isTotal: true,
  },
  {
    id: "season-2",
    label: "Temporada 2",
    seasonIds: ["season-2"],
    isTotal: false,
  },
  {
    id: "season-1",
    label: "Temporada 1",
    seasonIds: ["season-1"],
    isTotal: false,
  },
]

describe("profile season selector", () => {
  it("defaults profile data to the latest league season", () => {
    expect(
      getLatestPlayerProfileSeason({
        leagueId: "league-1",
        seasons,
        fallbackSeason: seasons[0],
      }).id,
    ).toBe("season-2")
  })

  it("hides history while the latest season is open", () => {
    const visible = getVisiblePlayerSeasonScopes({
      scopes,
      activeSeason: seasons[1],
      showHistory: false,
    })
    expect(visible.map((scope) => scope.id)).toEqual(["season-2"])
    expect(
      shouldShowPlayerProfileSeasonSelector({
        latestSeason: seasons[1],
        scopes: visible,
      }),
    ).toBe(false)
  })

  it("shows the compact selector only after the latest season finishes", () => {
    const finished = { ...seasons[1], status: "finished" as const }
    expect(
      shouldShowPlayerProfileSeasonSelector({
        latestSeason: finished,
        scopes,
      }),
    ).toBe(true)
  })
})
