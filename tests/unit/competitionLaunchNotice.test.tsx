// @vitest-environment jsdom
import React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CompetitionLaunchNotice } from "@/components/announcements/CompetitionLaunchNotice"
const state = vi.hoisted(() => ({ status: "authenticated", style: "classic", apply: vi.fn(), mode: vi.fn() }))
vi.mock("next-auth/react", () => ({ useSession: () => ({ status: state.status, data: { user: { email: "fixture@example.com" } } }) }))
vi.mock("@/context/ThemeProvider", () => ({ useTheme: () => ({ visualStyle: state.style, setVisualStyle: state.apply, setThemeMode: state.mode }) }))
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ tx: (text: string) => text }) }))
beforeEach(() => { HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", "") }; HTMLDialogElement.prototype.close = function () { this.removeAttribute("open") }; localStorage.clear(); state.status = "authenticated"; state.style = "classic"; state.apply.mockClear(); state.mode.mockClear() })
afterEach(() => { cleanup(); vi.restoreAllMocks() })
describe("Competition launch notice", () => {
  it("requires explicit application and keeps reversal instructions visible", () => {
    render(<CompetitionLaunchNotice />)
    expect(screen.getByRole("dialog", { name: "NUEVO TEMA OSCURO DISPONIBLE" }).hasAttribute("open")).toBe(true)
    expect(screen.getByRole("link", { name: "Puedes cambiar de tema en Ajustes → Temas y apariencia." }).getAttribute("href")).toBe("/settings/appearance#visual-style")
    expect(state.apply).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "APLICAR AHORA" }))
    expect(state.apply).toHaveBeenCalledWith("competition")
    expect(state.mode).toHaveBeenCalledWith("dark")
    expect(screen.queryByRole("dialog")).toBeNull()
  })
  it("persists dismissal across remounts", () => {
    const view = render(<CompetitionLaunchNotice />)
    fireEvent.click(screen.getByRole("button", { name: "AHORA NO" }))
    expect(state.apply).not.toHaveBeenCalled()
    view.unmount()
    render(<CompetitionLaunchNotice />)
    expect(screen.queryByRole("dialog")).toBeNull()
  })
  it("keeps both choices available when Competition is already applied", () => {
    state.style = "competition"
    render(<CompetitionLaunchNotice />)
    expect(screen.getByRole("button", { name: "APLICAR AHORA" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "AHORA NO" })).toBeTruthy()
  })
  it("does not announce themes before authentication", () => {
    state.status = "unauthenticated"
    render(<CompetitionLaunchNotice />)
    expect(screen.queryByRole("dialog")).toBeNull()
  })
  it("still closes when local storage cannot persist the dismissal", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage disabled") })
    render(<CompetitionLaunchNotice />)
    fireEvent.click(screen.getByRole("button", { name: "AHORA NO" }))
    expect(screen.queryByRole("dialog")).toBeNull()
  })
})
