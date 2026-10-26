// @vitest-environment jsdom
import React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { es } from "@/i18n/locales/es"
import { MatchResultForm } from "@/components/match/MatchResultForm"
import { CourtBookingPanel } from "@/components/match/CourtBookingPanel"
import { MatchScheduleForm } from "@/components/match/MatchScheduleForm"
import { getEmptyCourtBooking } from "@/lib/courtBooking"
import type { PlayerProfile } from "@/data/fakeData"

vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ locale: "es", tx: (s: string) => s, t: es }) }))
vi.mock("@/context/MatchDataProvider", () => ({ useMatchData: () => ({}) }))
vi.mock("@/lib/actionFeedback", () => ({ showActionFeedback: vi.fn() }))
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe("result entry", () => {
  const props = { matchId: "fixture", mode: "create" as const, requiresThreeSets: false, reportedByPlayerId: "a", teamAPlayers: ["Ana", "Bea"], teamBPlayers: ["Carla", "Dani"] }
  it("identifies the teams and keeps a partly entered set quiet and unsavable", () => {
    render(<MatchResultForm {...props} />)
    expect(screen.getByRole("group", { name: "Pareja A" }).textContent).toContain("AnaBea")
    expect(screen.getByRole("group", { name: "Pareja B" }).querySelectorAll("input")).toHaveLength(3)
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "6" } })
    expect(screen.queryByText(/Set 1:.*Set no válido/)).toBeNull()
    expect((screen.getByRole("button", { name: "Guardar resultado" }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText("Completa los dos marcadores de cada set empezado.")).toBeTruthy()
  })
  it("never converts a missing rival score to zero, but accepts an explicit zero", async () => {
    const save = vi.fn().mockResolvedValue(true)
    render(<MatchResultForm {...props} persistResult={save} />)
    const inputs = screen.getAllByRole("textbox")
    fireEvent.change(inputs[0], { target: { value: "6" } })
    expect((screen.getByRole("button", { name: "Guardar resultado" }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(inputs[3], { target: { value: "0" } })
    fireEvent.click(screen.getByRole("button", { name: "Guardar resultado" }))
    await waitFor(() => expect(save).toHaveBeenCalledWith([{ a: 6, b: 0 }]))
  })
  it("keeps the three-set requirement and shows completed invalid scores", () => {
    render(<MatchResultForm {...props} requiresThreeSets />)
    const inputs = screen.getAllByRole("textbox")
    fireEvent.change(inputs[0], { target: { value: "6" } })
    fireEvent.change(inputs[3], { target: { value: "6" } })
    expect(screen.getByText(/Set 1: Set no válido/)).toBeTruthy()
    fireEvent.change(inputs[3], { target: { value: "4" } })
    expect(screen.getByText("Completa los tres sets obligatorios.")).toBeTruthy()
    expect((screen.getByRole("button", { name: "Guardar resultado" }) as HTMLButtonElement).disabled).toBe(true)
  })
  it("allows early entry from a compact header and retains entered values when folded", () => {
    render(<MatchResultForm {...props} initiallyExpanded={false} />)
    expect(screen.queryAllByRole("textbox")).toHaveLength(0)
    fireEvent.click(screen.getByRole("button", { name: "Registrar resultado" }))
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "6" } })
    fireEvent.click(screen.getByRole("button", { name: "Registrar resultado" }))
    fireEvent.click(screen.getByRole("button", { name: "Registrar resultado" }))
    expect((screen.getAllByRole("textbox")[0] as HTMLInputElement).value).toBe("6")
  })
})

describe("payment feedback and permissions", () => {
  const players = ["a", "b", "c", "d"].map(id => ({ id, slug: id, leagueId: "league", displayName: id.toUpperCase(), avatarInitials: id })) as PlayerProfile[]
  const booking = { ...getEmptyCourtBooking(), isReserved: true, reservations: [{ playerId: "a", amount: 40 }], transfers: [{ id: "transfer", fromPlayerId: "b", toPlayerId: "a", amount: 10, isPaid: false, paidAt: null }] }
  const props = { matchId: "fixture", teamA: ["a", "b"], teamB: ["c", "d"], players, currentUserId: "a", canManage: true, booking, initiallyExpanded: true }
  it("distinguishes money to receive and reports rejected transfer/reminder requests beside their actions", async () => {
    const actions = { update: vi.fn(), clear: vi.fn(), updateTransfer: vi.fn().mockRejectedValue(new Error("offline")), sendReminder: vi.fn().mockResolvedValue(false) }
    render(<CourtBookingPanel {...props} actions={actions} />)
    expect(screen.getByRole("button", { name: /Por cobrar/ })).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Marcar transferencia como recibida" }))
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("No se ha podido actualizar el pago"))
    fireEvent.click(screen.getByRole("button", { name: "Mandar recordatorio" }))
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("No se ha podido enviar el recordatorio"))
  })
  it("asks before deleting app records and does nothing if cancelled", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
    const actions = { update: vi.fn(), clear: vi.fn().mockResolvedValue(true), updateTransfer: vi.fn() }
    render(<CourtBookingPanel {...props} actions={actions} />)
    fireEvent.click(screen.getByRole("button", { name: "Eliminar datos de reserva" }))
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("no cancela la reserva con el club"))
    expect(actions.clear).not.toHaveBeenCalled()
    confirm.mockReturnValue(true)
    fireEvent.click(screen.getByRole("button", { name: "Eliminar datos de reserva" }))
    await waitFor(() => expect(actions.clear).toHaveBeenCalledOnce())
  })
  it("lets a debtor mark their own payment but cannot edit or delete somebody else's records", () => {
    render(<CourtBookingPanel {...props} currentUserId="b" />)
    expect(screen.getByRole("button", { name: "Marcar pagado" })).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Marcar transferencia como recibida" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Eliminar datos de reserva" })).toBeNull()
  })
})

it("prioritizes an agreed booking while preserving manual scheduling", () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ locations: [] }) }))
  render(<MatchScheduleForm matchId="fixture" leagueId="league" seasonId="season" status="scheduling" scheduledAt={null} dateLabel={null} location={null} availableLocations={[]} playerIds={[]} players={[]} roundStartsAt={null} roundEndsAt={null} canManage coordinationAction={<button>Confirmar reserva de prueba</button>} />)
  expect(screen.getByRole("button", { name: "Confirmar reserva de prueba" })).toBeTruthy()
  expect(screen.queryByRole("button", { name: "Guardar programación" })).toBeNull()
  fireEvent.click(screen.getByRole("button", { name: "Programar manualmente" }))
  expect(screen.getByRole("button", { name: "Guardar programación" })).toBeTruthy()
})

 it.each(["scheduling", "scheduled", "finished", "postponed"])("keeps town, venue and court visible when the match is %s", status => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ locations: [] }) }))
  const location = JSON.stringify({ id: "test-club", name: "Club Central", town: "Bilbao", address: "Calle Mayor 10", selectedCourt: "Pista 2" })
  render(<MatchScheduleForm matchId="fixture" leagueId="league" seasonId="season" status={status} scheduledAt={status === "scheduling" ? null : "2026-10-24T10:00:00Z"} dateLabel={null} location={location} availableLocations={[]} playerIds={[]} players={[]} roundStartsAt={null} roundEndsAt={null} canManage={false} />)
  expect(screen.getByText("Bilbao · Club Central · Pista 2")).toBeTruthy()
  if (status === "postponed") expect(screen.queryByText(/24 de Octubre/)).toBeNull()
})
