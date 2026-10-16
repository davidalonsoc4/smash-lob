// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import type { MatchData } from "@/context/MatchDataProvider"
import type { PersonalMatchItem } from "@/lib/personalMatches"
import { getEmptyCourtBooking } from "@/lib/courtBooking"
import LeaguesPage from "@/app/leagues/page"

const state = vi.hoisted(() => ({ enter: vi.fn(), refresh: vi.fn(), locale: "es", matches: [] as MatchData[], leagues: [
  { id: "a", name: "Liga A", status: "active" }, { id: "b", name: "Liga B", status: "active" },
  { id: "c", name: "Liga C", status: "upcoming" }, { id: "d", name: "Liga D", status: "finished" },
] }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: state.refresh }) }))
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ locale: state.locale, tx: (text: string) => text, t: { common: { refreshApp: "Actualizar" } } }) }))
vi.mock("@/context/ActiveLeagueProvider", () => ({ useActiveLeague: () => ({ activeLeagueId: "a", changeActiveLeague: state.enter }) }))
vi.mock("@/context/LeagueAccessProvider", () => ({ useLeagueAccess: () => ({ userLeagues: state.leagues, canCreateLeagues: true, canAccessLeagueAdminTools: () => true, getMembershipForLeague: () => ({ playerId: "own" }), isLeagueAdmin: () => false, isLeagueSpectator: () => false }) }))
vi.mock("@/context/MatchDataProvider", () => ({ useMatchData: () => ({ matches: state.matches }) }))
vi.mock("@/context/SeasonSettingsProvider", () => ({ useSeasonSettings: () => ({ playerProfiles: [], seasons: state.leagues.map(item => ({ id: item.id, leagueId: item.id, status: item.status, totalRounds: 3 })), getActiveSeasonByLeagueId: (id: string) => ({ status: state.leagues.find(item => item.id === id)?.status, totalRounds: 3 }), getSeasonRoundSettings: () => ({ calendarVisibilityMode: "full" }) }) }))
vi.mock("@/components/league/LeagueLogo", () => ({ LeagueLogo: () => <span /> }))
vi.mock("@/components/personal/PersonalMatchCard", () => ({ PersonalMatchCard: ({ match }: { match: PersonalMatchItem }) => <div data-testid="highlight">{match.id}</div> }))
const empty = { items: [], upcoming: [], hasMore: false, nextOffset: null }
beforeEach(() => { state.locale = "es"; state.matches = []; vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => empty })) })
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks() })

it("limits the summary to two leagues and opens all leagues without changing context", async () => {
  render(<LeaguesPage />)
  await screen.findByText("Todavía no tienes encuentros para mostrar.")
  expect(screen.getAllByRole("button", { name: /^Entrar en/ })).toHaveLength(2)
  fireEvent.click(screen.getByRole("button", { name: "Ver todas" }))
  expect(screen.getAllByRole("button", { name: /^Entrar en/ })).toHaveLength(4)
  const archive = screen.getByText(/Finalizadas/).closest("details")!
  expect(archive.open).toBe(false)
  fireEvent.click(screen.getByRole("button", { name: "Entrar en Liga C" }))
  expect(state.enter).toHaveBeenCalledWith("c")
})
it("keeps tournaments informational and friendlies on their existing routes", async () => {
  render(<LeaguesPage />)
  fireEvent.click(screen.getByRole("button", { name: "Torneos" }))
  expect(screen.getByText("Todavía no tienes torneos.")).toBeVisible()
  expect(screen.getByRole("link", { name: "Crear" })).toHaveAttribute("href", "/tournaments/new")
  fireEvent.click(screen.getByRole("button", { name: "Amistosos" }))
  expect(screen.getByRole("link", { name: "+ Registrar encuentro amistoso" })).toHaveAttribute("href", "/personal-matches/new")
  expect(screen.getByRole("link", { name: "Mis partidos" })).toHaveAttribute("href", "/personal-matches")
  expect(state.enter).not.toHaveBeenCalled()
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
})
it.each(["es", "en", "eu"])("renders an existing tournament with date and time in %s", async (locale) => {
  state.locale = locale
  vi.mocked(fetch).mockImplementation(async (input) => ({ ok: true, json: async () => String(input) === "/api/tournaments" ? { tournaments: [{ id: "fixture-tournament", name: "Americana de prueba", startsAt: "2026-10-17T07:00:00Z", status: "draft" }] } : empty }) as Response)
  render(<LeaguesPage />)
  const tournament = await screen.findByRole("link", { name: /Americana de prueba/ })
  expect(tournament).toHaveAttribute("href", "/tournaments/fixture-tournament")
  expect(tournament).toHaveTextContent("2026")
  fireEvent.click(screen.getByRole("button", { name: "Torneos" }))
  expect(screen.getByRole("link", { name: /Americana de prueba/ })).toBeVisible()
})
it("shows a clear error and can retry through the refresh action", async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"))
  render(<LeaguesPage />)
  await screen.findByRole("alert")
  fireEvent.click(screen.getByRole("button", { name: /Actualizar/ }))
  await screen.findByText("Todavía no tienes encuentros para mostrar.")
  expect(fetch).toHaveBeenCalledTimes(3)
})
it("does not expose another player's encounter or a not-yet-started season", async () => {
  const base: MatchData = { id: "base", leagueId: "a", seasonId: "a", round: 1, status: "scheduled", teamA: ["own"], teamB: [], pointsA: null, pointsB: null, sets: [], scheduledAt: "2099-01-01T12:00:00Z", dateLabel: null, location: null, resultRecordedAt: null, resultReportedByPlayerId: null, resultLocked: false, rankingCounts: true, incidentType: null, incidentStatus: null, incidentReason: null, incidentNotes: null, incidentCreatedAt: null, incidentResolvedAt: null, resolutionType: null, courtBooking: getEmptyCourtBooking() }
  state.matches = [
    { ...base, id: "other", teamA: ["other"] },
    { ...base, id: "locked", leagueId: "c", seasonId: "c" },
  ]
  render(<LeaguesPage />)
  await screen.findByText("Todavía no tienes encuentros para mostrar.")
  expect(screen.queryByTestId("highlight")).toBeNull()
})
