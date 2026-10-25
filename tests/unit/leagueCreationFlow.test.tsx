// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useState } from "react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { es } from "@/i18n/locales/es"
import { LeagueCreationWizard } from "@/components/league/LeagueCreationWizard"
import { LeagueCreationForm } from "@/components/league/LeagueCreationForm"
import { SeasonCreationSummary } from "@/components/admin/season/SeasonCreationSummary"

const state = vi.hoisted(() => ({ create: vi.fn(), logo: vi.fn(), details: vi.fn(), accent: vi.fn(), activate: vi.fn(), replace: vi.fn(), read: vi.fn(), palette: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: state.replace, push: state.replace }) }))
vi.mock("@/context/ActiveLeagueProvider", () => ({ useActiveLeague: () => ({ activateGrantedLeague: state.activate }) }))
vi.mock("@/context/LeagueAccessProvider", () => ({ useLeagueAccess: () => ({ canCreateLeagues: true, createLeague: state.create, updateLeagueLogo: state.logo, updateLeagueDetails: state.details, updateLeagueAccentColor: state.accent, updateLeagueLocations: vi.fn().mockResolvedValue(true) }) }))
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ tx: (text: string) => text, t: es }) }))
vi.mock("@/components/ui/BackButton", () => ({ BackButton: () => <span>Atrás</span> }))
vi.mock("@/components/league/LeagueLogo", () => ({ LeagueLogo: () => <span>Logo</span> }))
vi.mock("@/lib/clientImages", () => ({ validateImageFile: vi.fn(), readFileAsDataUrl: state.read }))
vi.mock("@/components/images/ImageCropDialog", () => ({ ImageCropDialog: ({ onConfirm }: { onConfirm: (url: string) => void }) => <button onClick={() => onConfirm("data:image/png;base64,fixture")}>Confirmar encuadre</button> }))

vi.mock("@/lib/logoAccentPalette", () => ({ extractLogoAccentPalette: state.palette }))
vi.mock("@/components/admin/season/NewSeasonForm", () => ({ NewSeasonForm: ({ onPrepareLeague }: { onPrepareLeague: (locations: []) => Promise<string> }) => {
  const [error, setError] = useState("")
  return <><button onClick={() => void onPrepareLeague([]).catch((e: Error) => setError(e.message))}>Guardar resumen</button><p role="alert">{error}</p></>
} }))
beforeEach(() => {
  vi.stubGlobal("scrollTo", vi.fn())
  state.palette.mockReset().mockResolvedValue(["#2070B0"])
  state.create.mockClear(); state.replace.mockClear();
  state.create.mockReset().mockResolvedValue({ id: "league-fixture", name: "Liga QA", modality: "individual", logoUrl: null, accentColor: "#fbbf24" })
  state.logo.mockReset().mockResolvedValue(true); state.details.mockReset().mockResolvedValue(true); state.accent.mockReset().mockResolvedValue(true)
  state.read.mockResolvedValue("data:image/png;base64,source")
})
afterEach(cleanup)

it("explains both formats and advances a draft without saving a league", async () => {
  const next = vi.fn()
  render(<LeagueCreationForm onNext={next} />)
  expect(screen.getByText(/Cada jugador compite individualmente/)).toBeVisible()
  fireEvent.change(screen.getByRole("combobox", { name: "Modalidad de liga" }), { target: { value: "fixed_pairs" } })
  expect(screen.getByText(/Cada pareja mantiene sus jugadores/)).toBeVisible()
  fireEvent.change(screen.getByRole("textbox", { name: "Nombre de la liga" }), { target: { value: "  Liga QA  " } })
  fireEvent.click(screen.getByRole("button", { name: "Siguiente paso" }))
  await waitFor(() => expect(next).toHaveBeenCalledTimes(1))
  expect(state.create).not.toHaveBeenCalled()
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ name: "Liga QA", modality: "fixed_pairs" }))
})

it("reuses image cropping and retries a failed logo without creating a second league", async () => {
  state.logo.mockResolvedValueOnce(false).mockResolvedValue(true)
  const { container } = render(<LeagueCreationWizard />)
  fireEvent.change(screen.getByRole("textbox", { name: "Nombre de la liga" }), { target: { value: "Liga QA" } })
  fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [new File(["image"], "logo.png", { type: "image/png" })] } })
  await screen.findByRole("button", { name: "Confirmar encuadre" })
  fireEvent.click(screen.getByRole("button", { name: "Confirmar encuadre" }))
  await waitFor(() => expect(screen.getByRole("button", { name: "Siguiente paso" })).toBeEnabled())
  fireEvent.click(screen.getByRole("button", { name: "Siguiente paso" }))
  expect(state.create).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole("button", { name: "Guardar resumen" }))
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("falta guardar el logo"))
  fireEvent.click(screen.getByRole("button", { name: "Guardar resumen" }))
  await waitFor(() => expect(state.logo).toHaveBeenCalledTimes(2))
  expect(state.create).toHaveBeenCalledTimes(1)
  expect(state.logo).toHaveBeenLastCalledWith("league-fixture", "data:image/png;base64,fixture")
})

it("review edit buttons return to the matching context", () => {
  const edit = vi.fn()
  render(<SeasonCreationSummary groups={[{ title: "Calendario y duración", target: "advanced", rows: [["Jornadas", 7]] }]} participants={[["Ana", "Bea"]]} onEdit={edit} />)
  expect(screen.getByText("Ana · Bea")).toBeVisible()
  fireEvent.click(screen.getByRole("button", { name: "Editar Calendario y duración" }))
  expect(edit).toHaveBeenCalledWith("advanced", "Calendario y duración")
})

it("updates the proposed accent after cropping and can restore the automatic color", async () => {
  const { container } = render(<LeagueCreationForm onNext={vi.fn()} />)
  fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [new File(["image"], "logo.png", { type: "image/png" })] } })
  fireEvent.click(await screen.findByRole("button", { name: "Confirmar encuadre" }))
  await waitFor(() => expect(container.querySelector('input[type="color"]')).toHaveValue("#2070b0"))
  fireEvent.change(container.querySelector('input[type="color"]')!, { target: { value: "#ff2200" } })
  fireEvent.click(screen.getByRole("button", { name: "Asignar color de liga automáticamente" }))
  await waitFor(() => expect(container.querySelector('input[type="color"]')).toHaveValue("#2070b0"))
  expect(state.create).not.toHaveBeenCalled()
})
