// @vitest-environment jsdom
import React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { StatusHelp } from "@/components/ui/StatusHelp"
import { getStatusExplanation } from "@/lib/statusHelp"
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge"

vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ locale: "es", tx: (text: string) => text, t: { matches: { scheduled: "Programado", resultPending: "Pendiente de resultado", unscheduled: "Sin programar" } } }) }))
afterEach(cleanup)
describe("status help", () => {
  it("guides participants to the chat while keeping spectator explanations informative", () => {
    const view = render(<MatchStatusBadge status="scheduling" coordinationStatus="coordinating" isParticipant />)
    fireEvent.click(screen.getByRole("button"))
    expect(screen.getByRole("tooltip").textContent).toContain("Entra en el chat")
    view.unmount()
    render(<MatchStatusBadge status="scheduling" coordinationStatus="coordinating" />)
    fireEvent.click(screen.getByRole("button"))
    expect(screen.getByRole("tooltip").textContent).toContain("Los jugadores")
  })
  it("only asks a participant to record a result when the screen allows it", () => {
    const view = render(<MatchStatusBadge status="scheduled" scheduledAt="2020-01-01T10:00:00Z" isParticipant canRecordResult />)
    fireEvent.click(screen.getByRole("button"))
    expect(screen.getByRole("tooltip").textContent).toContain("Regístralo")
    view.unmount()
    render(<MatchStatusBadge status="scheduled" scheduledAt="2020-01-01T10:00:00Z" isParticipant />)
    fireEvent.click(screen.getByRole("button"))
    expect(screen.getByRole("tooltip").textContent).toContain("acciones disponibles")
  })
  it("opens on mouse hover and closes when the pointer leaves", () => {
    render(<StatusHelp kind="match" status="scheduled">Programado</StatusHelp>)
    const trigger = screen.getByRole("button")
    const enter = new Event("pointerover", { bubbles: true })
    Object.defineProperty(enter, "pointerType", { value: "mouse" })
    fireEvent(trigger, enter)
    expect(screen.getByRole("tooltip")).toBeTruthy()
    const leave = new Event("pointerout", { bubbles: true })
    Object.defineProperty(leave, "pointerType", { value: "mouse" })
    fireEvent(trigger, leave)
    expect(screen.queryByRole("tooltip")).toBeNull()
  })
  it("opens on one tap without activating a parent card and closes outside", () => {
    const navigate = vi.fn()
    render(<div onClick={navigate}><StatusHelp kind="match" status="scheduled">Programado</StatusHelp></div>)
    fireEvent.click(screen.getByRole("button"))
    expect(screen.getByRole("tooltip").textContent).toContain("fecha y hora")
    expect(navigate).not.toHaveBeenCalled()
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole("tooltip")).toBeNull()
  })
  it("supports focus, keyboard activation, Escape and reopening", () => {
    render(<StatusHelp kind="payment" status="pay">Pendiente</StatusHelp>)
    const trigger = screen.getByRole("button")
    fireEvent.focus(trigger)
    expect(trigger.getAttribute("aria-describedby")).toBe(screen.getByRole("tooltip").id)
    fireEvent.keyDown(trigger, { key: "Enter" })
    fireEvent.keyDown(trigger, { key: "Escape" })
    expect(screen.queryByRole("tooltip")).toBeNull()
    fireEvent.keyDown(trigger, { key: " " })
    expect(screen.getByRole("tooltip")).toBeTruthy()
    fireEvent.blur(trigger)
    expect(screen.queryByRole("tooltip")).toBeNull()
  })
  it("renders outside clipping containers and closes on scroll", () => {
    render(<div style={{ overflow: "hidden" }}><StatusHelp kind="incident" status="pending">Pendiente</StatusHelp></div>)
    fireEvent.click(screen.getByRole("button"))
    expect(screen.getByRole("tooltip").parentElement).toBe(document.body)
    fireEvent.scroll(window)
    expect(screen.queryByRole("tooltip")).toBeNull()
  })
  it("does not create an empty help control for an unknown state", () => {
    render(<StatusHelp kind="match" status="unknown">Desconocido</StatusHelp>)
    expect(screen.queryByRole("button")).toBeNull()
  })
  it.each(["es", "en", "eu"])("explains all match states in %s", locale => {
    for (const status of ["scheduling", "scheduled", "in_progress", "result_pending", "finished", "postponed", "coordinating", "awaiting_booking", "victory", "defeat"]) {
      expect(getStatusExplanation("match", status, locale).length).toBeGreaterThan(10)
    }
  })
})
