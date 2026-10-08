// @vitest-environment jsdom
import React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CalendarEventButton } from "@/components/calendar/CalendarEventButton"
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ tx: (text: string) => text }) }))
const event = { title: "Partido de prueba", description: "Fixture", start: "2026-10-08T18:00:00Z" }
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute("open", "") } })
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.removeAttribute("open") } })
})
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks() })
describe("calendar provider chooser", () => {
  it("always asks for a calendar, including when an old preference exists", () => {
    localStorage.setItem("smash-lob-calendar-provider", "google")
    const open = vi.spyOn(window, "open").mockReturnValue(null)
    render(<CalendarEventButton event={event} />)
    expect(screen.queryByRole("checkbox")).toBeNull()
    expect(screen.queryByRole("button", { name: "Elegir otro calendario" })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Añadir al calendario" }))
    expect(open).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Google Calendar" }))
    expect(open).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole("button", { name: "Añadir al calendario" }))
    expect(screen.getByRole("dialog")).toBeTruthy()
    expect(open).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }))
    expect(open).toHaveBeenCalledOnce()
  })
  it("downloads an ICS file only after choosing that option", () => {
    const create = vi.fn((blob: Blob) => { void blob; return "blob:fixture" })
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: create })
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() })
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe("smash-lob.ics")
      expect(this.href).toBe("blob:fixture")
    })
    render(<CalendarEventButton event={event} />)
    fireEvent.click(screen.getByRole("button", { name: "Añadir al calendario" }))
    fireEvent.click(screen.getByRole("button", { name: "Apple Calendar / otros (.ics)" }))
    expect(create.mock.calls[0]?.[0].type).toBe("text/calendar;charset=utf-8")
    expect(click).toHaveBeenCalledOnce()
    expect(localStorage.getItem("smash-lob-calendar-provider")).toBeNull()
  })
})
