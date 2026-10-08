// @vitest-environment jsdom
import React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CompetitionLaunchNotice } from "@/components/announcements/CompetitionLaunchNotice"
const state = vi.hoisted(() => ({ status: "authenticated", style: "classic", apply: vi.fn() }))
vi.mock("next-auth/react", () => ({ useSession: () => ({ status: state.status, data: { user: { email: "fixture@example.com" } } }) }))
vi.mock("@/context/ThemeProvider", () => ({ useTheme: () => ({ visualStyle: state.style, setVisualStyle: state.apply }) }))
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ tx: (text: string) => text }) }))
beforeEach(() => { HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", "") }; HTMLDialogElement.prototype.close = function () { this.removeAttribute("open") }; localStorage.clear(); state.status = "authenticated"; state.style = "classic"; state.apply.mockClear() })
afterEach(() => { cleanup(); vi.restoreAllMocks() })
describe("Competition launch notice", () => {
  it("requires explicit application and keeps reversal instructions visible", () => {
    render(<CompetitionLaunchNotice />)
    expect(screen.getByRole("dialog", { name: "Nuevos temas disponibles" }).hasAttribute("open")).toBe(true)
    expect(state.apply).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "HAZ CLICK PARA APLICAR" }))
    expect(state.apply).toHaveBeenCalledWith("competition")
    expect(screen.getByText(/solo en modo oscuro/)).toBeTruthy()
    expect(screen.getByRole("link", { name: "Ir a Temas" }).getAttribute("href")).toBe("/settings/appearance#visual-style")
  })
  it("persists dismissal across remounts", () => {
    const view = render(<CompetitionLaunchNotice />)
    fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso de temas" }))
    view.unmount()
    render(<CompetitionLaunchNotice />)
    expect(screen.queryByRole("dialog")).toBeNull()
  })
  it("shows confirmation when Competition is already applied", () => {
    state.style = "competition"
    render(<CompetitionLaunchNotice />)
    expect(screen.getByRole("status").textContent).toBe("Competition aplicado")
    expect(screen.queryByRole("button", { name: "HAZ CLICK PARA APLICAR" })).toBeNull()
    expect(screen.getByRole("link", { name: "Ir a Temas" })).toBeTruthy()
  })
  it("does not announce themes before authentication", () => {
    state.status = "unauthenticated"
    render(<CompetitionLaunchNotice />)
    expect(screen.queryByRole("region")).toBeNull()
  })
  it("still closes when local storage cannot persist the dismissal", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage disabled") })
    render(<CompetitionLaunchNotice />)
    fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso de temas" }))
    expect(screen.queryByRole("region")).toBeNull()
  })
})
