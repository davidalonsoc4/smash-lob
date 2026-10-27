// @vitest-environment jsdom
import React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { MatchPreviewTeams } from "@/components/matches/MatchPreviewTeams"
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ tx: (s: string) => s }) }))
vi.mock("@/components/ui/FitText", () => ({ FitText: ({ children }: { children: string }) => <span>{children}</span> }))
afterEach(cleanup)
const props = { teamA: [{ id: "a", name: "Ana" }, { id: "b", name: "Bea", highlightedLabel: "MVP de jornada", substituteLabel: "Eva" }], teamB: [{ id: "c", name: "Carla" }, { id: "d", name: "Dani" }], sets: [{ a: 6, b: 4 }, { a: 3, b: 6 }, { a: 7, b: 5 }], scores: { a: 2, b: 1 } }
describe("shared compact previews", () => {
  it("keeps facing pairs, MVP and substitutions without a result", () => {
    const { container } = render(<MatchPreviewTeams {...props} finished={false} />)
    expect(screen.getByText("VS")).toBeTruthy()
    expect(screen.getByText("Ana")).toBeTruthy()
    expect(screen.getByLabelText("MVP de jornada")).toBeTruthy()
    expect(screen.getByText(/Suplente/)).toBeTruthy()
    expect(container.querySelector("[data-preview-score-head]")).toBeNull()
  })
  it("shares set columns and totals, with a trophy only for the winning pair", () => {
    const { container } = render(<MatchPreviewTeams {...props} finished />)
    expect(screen.getAllByText("S1")).toHaveLength(1)
    expect(screen.getAllByText("Sets")).toHaveLength(1)
    expect(container.querySelectorAll("[data-preview-team]")).toHaveLength(2)
    expect(container.querySelectorAll("[data-preview-winner]")).toHaveLength(1)
    expect(container.querySelector('[data-preview-winner]')?.textContent).toContain("Ana")
    expect(container.querySelectorAll(".match-preview-trophy")).toHaveLength(1)
    expect(screen.getByLabelText("Sets ganados por la pareja A").textContent).toBe("2")
    expect(screen.getByLabelText("Sets ganados por la pareja B").textContent).toBe("1")
  })
  it("does not invent a winning pair when totals are tied", () => {
    const { container } = render(<MatchPreviewTeams {...props} finished sets={[]} scores={{ a: 0, b: 0 }} />)
    expect(container.querySelector("[data-preview-winner]")).toBeNull()
    expect(container.querySelector(".match-preview-trophy")).toBeNull()
    expect(screen.getAllByText("Sets")).toHaveLength(1)
  })
})
