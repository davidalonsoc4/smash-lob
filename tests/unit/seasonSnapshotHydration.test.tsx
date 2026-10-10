// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, expect, it } from "vitest"
import { SeasonSettingsProvider, useSeasonSettings, type SeasonSnapshot } from "@/context/SeasonSettingsProvider"
import type { Season } from "@/data/fakeData"

afterEach(() => { cleanup(); localStorage.clear() })
const oldSeason: Season = { id: "old", leagueId: "qa", name: "Original", status: "finished", totalRounds: 7, completedRounds: 7 }
const newSeason: Season = { ...oldSeason, id: "new", name: "Copy", status: "upcoming", completedRounds: 0 }
const wrapper = ({ children }: { children: React.ReactNode }) => <SeasonSettingsProvider>{children}</SeasonSettingsProvider>

it("loads saved season settings on the first render", () => {
  localStorage.setItem("smash-lob-season-round-settings", JSON.stringify([{ leagueId: "qa", seasonId: "old", availabilityRecommendationsEnabled: true, roundWindowDays: 19 }]))
  const { result } = renderHook(useSeasonSettings, { wrapper })
  expect(result.current.getSeasonRoundSettings("old")).toMatchObject({ availabilityRecommendationsEnabled: true, roundWindowDays: 19 })
})

it("preserves historical roster and rules when duplication returns only the new roster", () => {
  const { result, unmount } = renderHook(useSeasonSettings, { wrapper })
  const oldSettings = { ...result.current.getSeasonRoundSettings("old"), leagueId: "qa", seasonId: "old", roundWindowDays: 19 }
  const oldRoster = { seasonId: "old", playerId: "p1" }
  const initial: SeasonSnapshot = { seasons: [oldSeason], playerProfiles: [], seasonPlayers: [oldRoster], seasonSettings: [oldSettings], activeSeasonIds: { qa: "old" } }
  act(() => result.current.hydrateSeasonSnapshot(initial))
  const copy: SeasonSnapshot = { ...initial, seasons: [oldSeason, newSeason], seasonPlayers: [{ ...oldRoster, seasonId: "new" }], seasonSettings: [{ ...oldSettings, seasonId: "new", roundWindowDays: 14 }], activeSeasonIds: { qa: "new" } }
  act(() => result.current.hydrateSeasonSnapshot(copy, true))
  expect(result.current.getSeasonPlayers("old")).toEqual([oldRoster])
  expect(result.current.getSeasonRoundSettings("old").roundWindowDays).toBe(19)
  expect(result.current.getActiveSeasonByLeagueId("qa").id).toBe("new")
  unmount()
  const reloaded = renderHook(useSeasonSettings, { wrapper })
  expect(reloaded.result.current.getSeasonPlayers("old")).toEqual([oldRoster])
  expect(reloaded.result.current.getSeasonRoundSettings("old").roundWindowDays).toBe(19)
  act(() => reloaded.result.current.hydrateSeasonSnapshot({ ...copy, seasons: [newSeason] }))
  expect(reloaded.result.current.seasons.some(season => season.id === "old")).toBe(false)
  expect(reloaded.result.current.getSeasonPlayers("old")).toEqual([])
})
