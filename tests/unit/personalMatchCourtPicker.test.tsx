// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { es } from "@/i18n/locales/es"
import { PersonalMatchLocationPicker } from "@/components/personal/PersonalMatchLocationPicker"
import {
  createScheduledLeagueLocationValue,
  getScheduleLocationDisplayText,
  normalizeScheduleLocationValue,
  type LeagueLocation,
} from "@/lib/leagueLocations"

vi.mock("@/i18n/I18nProvider", () => ({
  useI18n: () => ({ tx: (value: string) => value, t: es }),
}))

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", "") }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open") }
})
afterEach(() => cleanup())

const locations: LeagueLocation[] = [
  { id: "club-three", name: "Club Tres", town: "Bilbao", courtCount: 3 },
  { id: "club-one", name: "Club Uno", town: "Bilbao", courtCount: 1 },
  { id: "club-unspecified", name: "Club Libre", town: "Getxo", courtCount: null },
]

function Harness() {
  const [selectedLocationId, setSelectedLocationId] = useState("")
  const [selectedCourt, setSelectedCourt] = useState("")
  const [manualLocationName, setManualLocationName] = useState("")
  const selectedLocation = locations.find((item) => item.id === selectedLocationId)
  const payload = selectedLocation
    ? createScheduledLeagueLocationValue(selectedLocation, selectedCourt)
    : manualLocationName

  return (
    <>
      <PersonalMatchLocationPicker
        locations={locations}
        loading={false}
        selectedLocationId={selectedLocationId}
        manualLocationName={manualLocationName}
        selectedCourt={selectedCourt}
        onSelectedLocationIdChange={setSelectedLocationId}
        onSelectedCourtChange={setSelectedCourt}
        onManualLocationNameChange={setManualLocationName}
      />
      <output data-testid="payload">{payload}</output>
    </>
  )
}

function selectVenue(name: string) {
  fireEvent.click(screen.getByRole("button", { name: /Seleccionar ubicación|Club/i }))
  fireEvent.click(screen.getByText(name))
}

describe("friendly creation court picker", () => {
  it("lists numbered courts and persists the selected one in the existing location payload", () => {
    render(<Harness />)
    selectVenue("Bilbao - Club Tres")
    const court = screen.getByRole("combobox", { name: /Pista/ })
    expect(court).toHaveValue("")
    expect(screen.getByRole("option", { name: "Pista 3" })).toBeInTheDocument()

    fireEvent.change(court, { target: { value: "Pista 3" } })
    const payload = screen.getByTestId("payload").textContent ?? ""
    expect(normalizeScheduleLocationValue(payload)?.selectedCourt).toBe("Pista 3")
    expect(getScheduleLocationDisplayText(payload)).toContain("Pista 3")
  })

  it("resets an old court when the club changes and preselects the only court", () => {
    render(<Harness />)
    selectVenue("Bilbao - Club Tres")
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Pista 3" } })
    selectVenue("Bilbao - Club Uno")
    expect(screen.getByRole("combobox")).toHaveValue("Pista 1")
    expect(normalizeScheduleLocationValue(screen.getByTestId("payload").textContent)?.selectedCourt).toBe("Pista 1")
  })

  it("does not require a court and hides the control at venues without numbered courts", () => {
    render(<Harness />)
    selectVenue("Bilbao - Club Tres")
    expect(screen.getByRole("option", { name: "Sin especificar" })).toBeInTheDocument()
    selectVenue("Getxo - Club Libre")
    expect(screen.queryByRole("combobox")).toBeNull()
    expect(normalizeScheduleLocationValue(screen.getByTestId("payload").textContent)?.selectedCourt).toBeNull()
  })
})
