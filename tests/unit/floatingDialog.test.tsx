// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useState } from "react"
import { afterEach, beforeAll, expect, it, vi } from "vitest"
import { es } from "@/i18n/locales/es"
import { FloatingDialog } from "@/components/ui/FloatingDialog"
import { DirectionsPicker } from "@/components/ui/DirectionsPicker"
import { CalendarEventButton } from "@/components/calendar/CalendarEventButton"
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ tx: (text: string) => text, t: es }) }))
vi.mock("@/lib/actionFeedback", () => ({ showActionFeedback: vi.fn() }))
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", "") }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open") }
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })
function Harness({ busy = false, dirty = false }: { busy?: boolean; dirty?: boolean }) {
  const [open, setOpen] = useState(false)
  return <><button onClick={() => setOpen(true)}>Abrir</button><FloatingDialog open={open} onClose={() => setOpen(false)} title="Prueba" busy={busy} dirty={dirty}><input type="search" aria-label="Buscar" /><button>Acción</button></FloatingDialog></>
}
it("focuses search, locks background scrolling and returns focus on Escape", async () => {
  render(<Harness />)
  const trigger = screen.getByText("Abrir"); trigger.focus(); fireEvent.click(trigger)
  expect(document.body.style.overflow).toBe("hidden")
  expect(screen.getByRole("searchbox")).toHaveFocus()
  fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }))
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  expect(trigger).toHaveFocus(); expect(document.body.style.overflow).not.toBe("hidden")
})
it("ignores dismissal while an action is saving", () => {
  render(<Harness busy />); fireEvent.click(screen.getByText("Abrir"))
  fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }))
  expect(screen.getByRole("dialog")).toBeVisible()
})
it("closes from a populated search field on Escape", () => {
  render(<Harness />); fireEvent.click(screen.getByText("Abrir"))
  const input = screen.getByRole("searchbox")
  fireEvent.change(input, { target: { value: "Consulta" } })
  fireEvent.keyDown(input, { key: "Escape" })
  expect(screen.queryByRole("dialog")).toBeNull()
})
it("preserves dirty edits when discard is rejected", () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
  render(<Harness dirty />); fireEvent.click(screen.getByText("Abrir"))
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Borrador" } })
  fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }))
  expect(confirm).toHaveBeenCalledOnce(); expect(screen.getByRole("searchbox")).toHaveValue("Borrador")
})
it("keeps directions open after a copy failure and closes after retry succeeds", async () => {
  const copy = vi.fn().mockRejectedValueOnce(new Error("denied")).mockResolvedValue(undefined)
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copy } })
  render(<DirectionsPicker mapsUrl="https://maps.google.com/?q=Bilbao" locationLabel="Bilbao" />)
  fireEvent.click(screen.getByRole("button", { name: "Cómo llegar" }))
  fireEvent.click(screen.getByRole("button", { name: /Copiar ubicación/ }))
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("No se ha podido copiar"))
  fireEvent.click(screen.getByRole("button", { name: /Copiar ubicación/ }))
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  expect(copy).toHaveBeenCalledWith("Bilbao")
})
it("retains the calendar selector on export errors", async () => {
  vi.spyOn(window, "open").mockImplementation(() => { throw Error("blocked") })
  render(<CalendarEventButton event={{ title: "Partido", description: "Partido de prueba", start: "2026-11-01T12:00:00Z", location: "Bilbao" }} />)
  fireEvent.click(screen.getByRole("button", { name: "Añadir al calendario" }))
  fireEvent.click(screen.getByRole("button", { name: "Google Calendar" }))
  expect(screen.getByRole("alert")).toHaveTextContent("No se ha podido abrir")
  expect(screen.getByRole("dialog")).toBeVisible()
})
