// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { SeasonRosterWaitingRoom } from "@/components/season/SeasonRosterWaitingRoom"

const state = vi.hoisted(() => ({ admin: false, stale: false, refresh: vi.fn().mockResolvedValue(true), users: vi.fn().mockResolvedValue([]), feedback: vi.fn() }))
const profiles = [{ id: "a", displayName: "Ana" }, { id: "b", displayName: "Bea" }, { id: "c", displayName: "Cris" }, { id: "d", displayName: "Dani" }]
vi.mock("@/context/LeagueAccessProvider", () => ({ useLeagueAccess: () => ({ leagues: [{ id: "league", modality: "fixed_pairs" }], fetchLeagueUsers: state.users, getMembershipForLeague: () => ({ playerId: "a", userId: "qa@example.test" }), isLeagueAdmin: () => state.admin, refreshLeagueAccess: state.refresh }) }))
vi.mock("@/context/SeasonSettingsProvider", () => ({ useSeasonSettings: () => ({ playerProfiles: profiles, seasonPlayers: profiles.map((p,i) => ({ seasonId: "season", playerId: p.id, pairNumber: i >= 2 ? 2 : null })), getSeasonRoundSettings: () => ({ rosterMode: "self_registration", playerCapacity: 6, registrationOpen: true }) }) }))
vi.mock("@/components/player/PlayerAvatar", () => ({ PlayerAvatar: () => <span /> }))
vi.mock("@/lib/actionFeedback", () => ({ showActionFeedback: (...args: unknown[]) => state.feedback(...args) }))
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ tx: (text: string) => text, t: { common: { save: "Guardar", cancel: "Cancelar" }, roster: { title: "Jugadores", remaining: "Quedan {count} plazas", complete: "Completa", availableSlot: "Plaza disponible" } } }) }))
beforeEach(() => {
  state.admin=false; state.stale=false; vi.clearAllMocks()
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => ({ ok: !(String(input).endsWith("/pairs") && state.stale), json: async () => String(input).endsWith("/waitlist") ? { position: null, items: [] } : String(input).endsWith("/pairs") ? state.stale ? { error: "roster_changed" } : { ok: true, calendarInvalidated: true } : { ok: true, playerId: "a", registeredCount: 4, playerCapacity: 6, rosterComplete: false, method: init?.method } })))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it("groups confirmed pairs and offers only pending partners other than oneself", async () => {
  render(<SeasonRosterWaitingRoom leagueId="league" seasonId="season" />)
  await waitFor(() => expect(fetch).toHaveBeenCalled())
  expect(screen.getByText("Pareja 2")).toBeVisible()
  expect(screen.getByText("Pendientes de compañero")).toBeVisible()
  expect(screen.getByRole("option", { name: "Bea" })).toBeVisible()
  expect(screen.queryByRole("option", { name: "Ana" })).toBeNull()
  expect(screen.queryByRole("option", { name: "Cris" })).toBeNull()
  expect(screen.queryByRole("button", { name: "Revisar parejas" })).toBeNull()
  fireEvent.change(screen.getByRole("combobox", { name: "Tu compañero" }), { target: { value: "b" } })
  fireEvent.click(screen.getByRole("button", { name: "Vincular compañero" }))
  await waitFor(() => expect(state.refresh).toHaveBeenCalled())
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/registration"), expect.objectContaining({ method: "POST", body: JSON.stringify({ partnerPlayerId: "b" }) }))
})
it("lets organizers review and save pairs with a snapshot of the original roster", async () => {
  state.admin=true
  render(<SeasonRosterWaitingRoom leagueId="league" seasonId="season" />)
  fireEvent.click(screen.getByRole("button", { name: "Revisar parejas" }))
  fireEvent.change(screen.getByRole("combobox", { name: "Pareja 1 · Jugador 2" }), { target: { value: "a" } })
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
  await waitFor(() => expect(state.feedback).toHaveBeenCalledWith(expect.objectContaining({ message: "Parejas guardadas. Se recalculará el calendario sin resultados." })))
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/pairs"), expect.objectContaining({ method: "PATCH", body: JSON.stringify({ roster: { a: null, b: null, c: 2, d: 2 }, pairs: [["c","a"],["d","b"]] }) }))
})
it("refreshes instead of overwriting a changed roster", async () => {
  state.admin=true; state.stale=true
  render(<SeasonRosterWaitingRoom leagueId="league" seasonId="season" />)
  fireEvent.click(screen.getByRole("button", { name: "Revisar parejas" }))
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }))
  await screen.findByText("La plantilla ha cambiado. Revisa las parejas de nuevo.")
  expect(state.refresh).toHaveBeenCalled()
  expect(state.feedback).not.toHaveBeenCalled()
})
