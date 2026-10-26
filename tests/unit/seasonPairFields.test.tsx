// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { getLeaguePairGroups } from "@/lib/fixedPairLeague"
import { SeasonPairFields } from "@/components/season/SeasonPairFields"
import { SeasonPartnerSelect } from "@/components/season/SeasonPartnerSelect"
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ tx: (value: string) => value }) }))
afterEach(cleanup)
it("keeps incomplete or withdrawn pairs out of the confirmed groups", () => {
  expect(getLeaguePairGroups([{ playerId: "a", pairNumber: 1 }, { playerId: "b", pairNumber: 1 }, { playerId: "c", pairNumber: 2 }, { playerId: "d", pairNumber: 2, status: "withdrawn" }, { playerId: "e", pairNumber: null }])).toEqual({ pairs: [{ number: 1, playerIds: ["a","b"] }], pending: ["e","c"] })
})
it("shows two named slots per pair and swaps players without duplicating one", () => {
  const change = vi.fn()
  render(<SeasonPairFields pairs={[["a","b"],["c","d"]]} options={["a","b","c","d"].map(value => ({ value, label: `Jugador ${value}` }))} onChange={change} renderPlayerDetails={id => <span>Nombre {id}</span>} />)
  expect(screen.getAllByRole("group")).toHaveLength(2)
  expect(screen.getByText("Nombre a")).toBeVisible()
  fireEvent.change(screen.getByRole("combobox", { name: "Pareja 1 · Jugador 2" }), { target: { value: "c" } })
  expect(change).toHaveBeenCalledWith([["a","c"],["b","d"]])
})
it("offers an explicit not-yet-registered partner choice", () => {
  const change = vi.fn()
  render(<SeasonPartnerSelect value="" players={[{ id: "a", displayName: "Ana" }]} onChange={change} />)
  expect(screen.getByRole("option", { name: "Ana" })).toBeVisible()
  fireEvent.change(screen.getByRole("combobox", { name: "Tu compañero" }), { target: { value: "__pending__" } })
  expect(change).toHaveBeenCalledWith("__pending__")
})
