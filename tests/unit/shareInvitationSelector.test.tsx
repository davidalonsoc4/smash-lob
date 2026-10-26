// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"
import { FloatingSpectatorShareButton } from "@/components/spectator/FloatingSpectatorShareButton"

const state = vi.hoisted(() => ({ spectator: vi.fn(), addData: vi.fn(), clipboard: vi.fn() }))
vi.mock("@/lib/spectatorInvites", () => ({ createOrGetSpectatorInvite: state.spectator }))
vi.mock("@/lib/inviteUrls", () => ({ getPublicAppBaseUrl: () => "https://example.test", getPublicInviteUrl: (code: string) => `https://example.test/invite/${code}` }))
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ tx: (text: string) => text }) }))
vi.mock("qrcode-generator", () => ({ default: () => ({ addData: state.addData, make: vi.fn(), getModuleCount: () => 21, isDark: (row: number) => row === 0 }) }))

beforeEach(() => {
  state.spectator.mockResolvedValue({ url: "https://example.test/spectate/READ" })
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["logo"], { type: "image/png" }) }))
  Object.defineProperty(navigator, "clipboard", { value: { writeText: state.clipboard }, configurable: true })
  state.clipboard.mockResolvedValue(undefined)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks() })
function open(props = {}) {
  render(<FloatingSpectatorShareButton leagueId="a" leagueName="Liga A" {...props} />)
  fireEvent.click(screen.getByRole("button", { name: "Compartir invitación" }))

}
const labels: Record<string, string> = { spectator: "Invitar a seguir la liga", player: "Invitar a jugar en la liga", app: "Compartir Smash & Lob" }
function reopen() {
  fireEvent.click(screen.getByRole("button", { name: "Cerrar" }))
  fireEvent.click(screen.getByRole("button", { name: "Compartir invitación" }))
}
async function choose(value: string) {
  fireEvent.click(screen.getByRole("button", { name: labels[value] }))
  await screen.findByRole("img")
}
it("waits for a choice, then shares each distinct URL with a branded QR and reuses generated player links", async () => {
  const player = vi.fn().mockResolvedValue("PLAY")
  open({ onGeneratePlayerInvite: player })
  expect(screen.queryByRole("img")).toBeNull()
  expect(state.spectator).not.toHaveBeenCalled()
  expect(screen.queryByRole("button", { name: /^Compartir$/ })).toBeNull()
  for (const [type, url] of [["spectator", "https://example.test/spectate/READ"], ["player", "https://example.test/invite/PLAY"], ["app", "https://example.test"], ["player", "https://example.test/invite/PLAY"]]) {
    await choose(type)
    expect(state.addData).toHaveBeenLastCalledWith(url, "Byte")
    expect(decodeURIComponent(screen.getByRole("img").getAttribute("src")!)).toContain('href="data:image/png;base64,')
    fireEvent.click(screen.getByRole("button", { name: /^Compartir$/ }))
    await waitFor(() => expect(state.clipboard).toHaveBeenLastCalledWith(url))
    expect(screen.queryByRole("group", { name: "Qué quieres compartir" })).toBeNull()
    reopen()
    expect(screen.getByRole("group", { name: "Qué quieres compartir" })).toBeTruthy()
    expect(screen.queryByRole("img")).toBeNull()
  }
  expect(player).toHaveBeenCalledTimes(1)
  expect(state.spectator).toHaveBeenCalledTimes(1)
})
it("keeps player invitations restricted and allows app sharing without a league", async () => {
  open({ canShareLeague: false })
  await screen.findByRole("img")
  expect(screen.queryByRole("button", { name: "Invitar a jugar en la liga" })).toBeNull()
  expect(screen.queryByRole("button", { name: "Invitar a seguir la liga" })).toBeNull()
  expect(screen.queryByRole("group", { name: "Qué quieres compartir" })).toBeNull()
  reopen()
  await screen.findByRole("img")
  expect(state.addData).toHaveBeenLastCalledWith("https://example.test", "Byte")
  expect(state.spectator).not.toHaveBeenCalled()
})
it("ignores a late spectator response after switching to the app", async () => {
  let resolve!: (value: { url: string }) => void
  state.spectator.mockImplementationOnce(() => new Promise(done => { resolve = done }))
  open()
  fireEvent.click(screen.getByRole("button", { name: labels.spectator }))
  reopen()
  await choose("app")
  await act(async () => { resolve({ url: "https://example.test/spectate/LATE" }) })
  expect(state.addData).toHaveBeenCalledTimes(1)
  expect(state.addData).toHaveBeenLastCalledWith("https://example.test", "Byte")
})
it("shows generation failures without enabling sharing", async () => {
  state.spectator.mockRejectedValueOnce(new Error("unavailable"))
  open()
  fireEvent.click(screen.getByRole("button", { name: labels.spectator }))
  await screen.findByText("No se ha podido generar el código QR.")
  expect(screen.getByRole("button", { name: /^Compartir$/ })).toBeDisabled()
  expect(screen.queryByRole("img")).toBeNull()
})

it("hides player invitations for non-admin league members", () => {
  open()
  expect(screen.queryByRole("button", { name: labels.player })).toBeNull()
  expect(screen.getByRole("button", { name: labels.spectator })).toBeEnabled()
  expect(screen.getByRole("button", { name: labels.app })).toBeEnabled()
})

it("shares a tournament URL directly and keeps spectator access locked", async () => {
  const player = vi.fn().mockResolvedValue("https://example.test/tournament-invite/TOKEN")
  open({ tournamentId: "a", tournamentName: "Torneo A", onGeneratePlayerInvite: player })
  expect(screen.getByRole("button", { name: "Invitar a seguir el torneo" })).toBeDisabled()
  fireEvent.click(screen.getByRole("button", { name: "Invitar a jugar en el torneo" }))
  await screen.findByRole("img")
  expect(state.addData).toHaveBeenLastCalledWith("https://example.test/tournament-invite/TOKEN", "Byte")
  expect(state.spectator).not.toHaveBeenCalled()
})

it("hides tournament player invitations without organizer permission", () => {
  open({ tournamentId: "a", canShareLeague: false })
  expect(screen.queryByRole("button", { name: "Invitar a jugar en el torneo" })).toBeNull()
  expect(screen.getByRole("button", { name: "Invitar a seguir el torneo" })).toBeDisabled()
  expect(screen.getByRole("button", { name: "Compartir Smash & Lob" })).toBeEnabled()
})
