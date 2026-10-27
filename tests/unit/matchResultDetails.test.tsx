// @vitest-environment jsdom
import React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { MatchResultDetails } from "@/components/match/MatchResultDetails"

vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ tx: (text: string) => text }) }))
afterEach(cleanup)

describe("compact match result disclosures", () => {
  it("opens both panels independently without hiding their controls or actions", () => {
    render(<MatchResultDetails information={<p>Resultado guardado</p>} actions={<button>Fijar resultado</button>} />)
    expect(screen.queryAllByRole("region")).toHaveLength(0)
    const info = screen.getByRole("button", { name: "Información del resultado" })
    const actions = screen.getByRole("button", { name: "Más acciones" })
    fireEvent.click(info)
    expect(info.getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByRole("region", { name: "Información del resultado" }).textContent).toContain("Resultado guardado")
    fireEvent.click(actions)
    expect(screen.getAllByRole("region")).toHaveLength(2)
    expect(screen.getByRole("button", { name: "Fijar resultado" })).toBeTruthy()
    fireEvent.click(info)
    expect(info.getAttribute("aria-expanded")).toBe("false")
    expect(screen.getByRole("button", { name: "Fijar resultado" })).toBeTruthy()
  })
  it("keeps important information open initially and omits unavailable admin actions", () => {
    render(<MatchResultDetails information="Resultado bloqueado" initiallyShowInformation />)
    const info = screen.getByRole("button", { name: "Información del resultado" })
    expect(info.getAttribute("aria-expanded")).toBe("true")
    expect(screen.getByRole("region").id).toBe(info.getAttribute("aria-controls"))
    expect(screen.queryByRole("button", { name: "Más acciones" })).toBeNull()
  })
})
