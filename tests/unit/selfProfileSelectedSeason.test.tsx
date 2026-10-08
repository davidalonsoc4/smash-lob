// @vitest-environment jsdom
import React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { es } from "@/i18n/locales/es"
import { PlayerProfileScreen } from "@/components/player/PlayerProfileScreen"

const fixture = vi.hoisted(() => ({
  league: { id: "fixture-league" },
  seasons: [
    { id: "finished", leagueId: "fixture-league", name: "Temporada 1", status: "finished" },
    { id: "scheduled", leagueId: "fixture-league", name: "Temporada 2", status: "upcoming" },
  ],
  selected: "finished",
}))
vi.mock("@/hooks/useCurrentLeagueData", () => ({ useCurrentLeagueData: () => ({
  activeLeague: fixture.league, activeSeason: fixture.seasons.find(s => s.id === (localStorage.getItem("smash-lob-selected-season:fixture-league") ?? fixture.selected)),
}) }))
vi.mock("@/context/CurrentUserProvider", () => ({ useCurrentUser: () => ({ currentUserId: "fixture-player" }) }))
vi.mock("@/context/MatchDataProvider", () => ({ useMatchData: () => ({ matches: [] }) }))
vi.mock("@/context/MvpProvider", () => ({ useMvp: () => ({ votes: [] }) }))
vi.mock("@/context/SeasonSettingsProvider", () => ({ useSeasonSettings: () => ({
  seasons: fixture.seasons, seasonPlayers: [], seasonSettings: [],
  playerProfiles: [{ id: "fixture-player", leagueId: "fixture-league", displayName: "Jugador de prueba" }],
}) }))
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ t: es, tx: (text: string) => text }) }))
vi.mock("@/components/ui/AppCard", () => ({ AppCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }))
vi.mock("@/components/ui/BackButton", () => ({ BackButton: () => null }))
vi.mock("@/components/player/PlayerAvatar", () => ({ PlayerAvatar: () => null }))
vi.mock("@/components/player/PlayerStatsPanel", () => ({ PlayerStatsPanel: ({ seasonId }: { seasonId: string }) => <div data-testid="stats-season">{seasonId}</div> }))

afterEach(() => { cleanup(); localStorage.clear(); fixture.selected = "finished" })
describe("Mi perfil with a finished season and a scheduled next season", () => {
  it("shows the globally selected finished season even without a roster entry", () => {
    render(<PlayerProfileScreen mode="self" />)
    expect(screen.getByTestId("stats-season").textContent).toBe("finished")
    expect(screen.getByRole("button", { name: /Temporada 1/ })).toBeTruthy()
  })
  it("writes a profile selection to the same league storage used by HOME", () => {
    render(<PlayerProfileScreen mode="self" />)
    fireEvent.click(screen.getByRole("button", { name: /Temporada 1/ }))
    fireEvent.click(screen.getByRole("menuitemradio", { name: /Temporada 2/ }))
    expect(localStorage.getItem("smash-lob-selected-season:fixture-league")).toBe("scheduled")
    expect(screen.getByTestId("stats-season").textContent).toBe("scheduled")
    expect(screen.queryByRole("menu")).toBeNull()
  })
  it("shows an upcoming selection without substituting historical data", () => {
    fixture.selected = "scheduled"
    render(<PlayerProfileScreen mode="self" />)
    expect(screen.getByTestId("stats-season").textContent).toBe("scheduled")
  })
})
