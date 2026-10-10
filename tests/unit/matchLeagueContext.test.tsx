// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { readSelectedSeasonId } from "@/lib/seasonSelection"
import { useMatchLeagueContext } from "@/hooks/useMatchLeagueContext"
const state = vi.hoisted(() => ({ hydrated: true, allowed: true, active: "league-a", matches: [{ id: "match-a", leagueId: "league-b", seasonId: "season-old" }], activate: vi.fn() }))
vi.mock("@/context/ActiveLeagueProvider", () => ({ useActiveLeague: () => ({ activeLeagueId: state.active, activateLeague: state.activate }) }))
vi.mock("@/context/LeagueAccessProvider", () => ({ useLeagueAccess: () => ({ isAccessHydrated: state.hydrated, canAccessLeague: () => state.allowed }) }))
vi.mock("@/context/MatchDataProvider", () => ({ useMatchData: () => ({ matches: state.matches }) }))
afterEach(() => { cleanup(); window.localStorage.clear(); vi.useRealTimers(); state.activate.mockClear(); state.hydrated = true; state.allowed = true })
it("resolves a known authorized match in another league", () => {
  vi.useFakeTimers(); const { result } = renderHook(() => useMatchLeagueContext("match-a"))
  expect(result.current).toBe(true); act(() => vi.runAllTimers()); expect(state.activate).toHaveBeenCalledWith("league-b"); expect(readSelectedSeasonId("league-b")).toBe("season-old")
})
it("does not switch to a league without access or an unknown match", () => {
  vi.useFakeTimers(); state.allowed = false; const view = renderHook(() => useMatchLeagueContext("match-a"))
  expect(view.result.current).toBe(false); act(() => vi.runAllTimers()); expect(state.activate).not.toHaveBeenCalled(); expect(readSelectedSeasonId("league-b")).toBeNull()
  view.unmount(); renderHook(() => useMatchLeagueContext("unknown")); act(() => vi.runAllTimers()); expect(state.activate).not.toHaveBeenCalled()
})
it("waits for access hydration before changing context", () => {
  vi.useFakeTimers(); state.hydrated = false; renderHook(() => useMatchLeagueContext("match-a")); act(() => vi.runAllTimers()); expect(state.activate).not.toHaveBeenCalled()
})
