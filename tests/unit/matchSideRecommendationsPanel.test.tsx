// @vitest-environment jsdom
import React from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { PlayerProfile } from "@/data/fakeData"
import { MatchDetailPairingPanel, MatchSideHelp } from "@/components/match/MatchDetailPairingPanel"

vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ locale: "es", tx: (text: string) => text }) }))
vi.mock("@/components/ui/FitText", () => ({ FitText: ({ children, className }: { children: React.ReactNode; className?: string }) => <span className={className}>{children}</span> }))
const players: PlayerProfile[] = [
  { id: "a", leagueId: "league", slug: "a", displayName: "Ana", avatarInitials: "A", preferredSide: "reves", dominantHand: "right" },
  { id: "b", leagueId: "league", slug: "b", displayName: "Bea", avatarInitials: "B", preferredSide: "reves", dominantHand: "left" },
  { id: "c", leagueId: "league", slug: "c", displayName: "Carla", avatarInitials: "C", preferredSide: "drive" },
  { id: "d", leagueId: "league", slug: "d", displayName: "Dani", avatarInitials: "D", preferredSide: "versatile" },
]
const props = { teamA: ["a", "b"], teamB: ["c", "d"], players, sideStatistics: {a:{matchesPlayed:4,wins:2,gamesFor:40,gamesAgainst:40},b:{matchesPlayed:4,wins:2,gamesFor:40,gamesAgainst:40}}, rankingPositions: { a: 1, b: 2 }, showPlayerMetadata: true, showPositionHelp: true, linkPlayers: false }
afterEach(cleanup)

describe("recommended sides in the pairing panel", () => {
  it("aligns finished set scores, identifies the winning pair and keeps the overall score distinct", () => {
    const view = render(<MatchDetailPairingPanel {...props} pointsA={2} pointsB={1} sets={[{ a: 6, b: 4 }, { a: 3, b: 6 }, { a: 7, b: 5 }]} />)
    expect(view.container.querySelectorAll(".app-match-result-row")).toHaveLength(2)
    expect(view.container.querySelector('[data-winner="true"]')?.textContent).toContain("Ana")
    expect(Array.from(view.container.querySelectorAll(".app-match-result-total"), node => node.textContent)).toEqual(["2", "1"])
    expect(view.container.querySelectorAll(".app-match-result-set")).toHaveLength(6)
    expect(view.container.querySelector(".app-card")).toBeNull()
    view.rerender(<MatchDetailPairingPanel {...props} pointsA={1} pointsB={1} sets={[]} />)
    expect(view.container.querySelector("[data-winner]")).toBeNull()
    expect(screen.getAllByText("Puntos")).toHaveLength(1)
  })
  it("shows A backhand/forehand and B forehand/backhand without changing teams or attaching recommendations to the wrong player", () => {
    const teamA = ["b", "a"]
    const teamB = ["d", "c"]
    const { container } = render(<MatchDetailPairingPanel {...props} teamA={teamA} teamB={teamB} />)
    expect(Array.from(container.querySelectorAll(".app-match-player-name"), node => node.textContent)).toEqual(["Ana", "Bea", "Carla", "Dani"])
    expect(screen.getByLabelText("Lado recomendado: Drive. Preferencia: Revés").closest("p")?.textContent).toBe("#2 · Drive · Zurdo")
    expect(teamA).toEqual(["b", "a"])
    expect(teamB).toEqual(["d", "c"])
  })

  it("marks only the changed fixed preference, keeps metadata compact and explains the recommendation", () => {
    const { container } = render(<><MatchDetailPairingPanel {...props} /><MatchSideHelp /></>)
    const change = screen.getByLabelText("Lado recomendado: Drive. Preferencia: Revés")
    expect(change.className).toContain("text-red-700")
    expect(change.textContent).toBe("Drive")
    expect(change.querySelector("svg")).toBeTruthy()
    expect(change.closest("p")?.textContent).toBe("#2 · Drive · Zurdo")
    expect(container.querySelectorAll("[data-recommended-side]")).toHaveLength(4)
    fireEvent.click(screen.getByRole("button", { name: "Información sobre posiciones recomendadas" }))
    expect(screen.getByRole("tooltip").textContent).toContain("Un lado para cada uno")
    expect(screen.getByRole("tooltip").textContent).toContain("vosotros decidís")
    fireEvent.keyDown(screen.getByRole("button", { name: "Información sobre posiciones recomendadas" }), { key: "Escape" })
    expect(screen.queryByRole("tooltip")).toBeNull()
    fireEvent.click(change)
    expect(screen.getByRole("tooltip").textContent).toContain("Un lado para cada uno")
    fireEvent.keyDown(change, { key: "Escape" })
    fireEvent.click(change.querySelector('[aria-hidden="true"]')!)
    expect(screen.getByRole("tooltip").textContent).toContain("vosotros decidís")
    fireEvent.keyDown(change, { key: "Escape" })
    fireEvent.keyDown(change, { key: "Enter" })
    expect(screen.getByRole("tooltip")).toBeTruthy()
    fireEvent.keyDown(change, { key: "Escape" })
  })

  it("updates when the current ranking changes without changing player preferences", () => {
    const view = render(<MatchDetailPairingPanel {...props} />)
    expect(Array.from(view.container.querySelectorAll(".app-match-player-name"), node => node.textContent)).toEqual(["Ana", "Bea", "Carla", "Dani"])
    expect(screen.getByLabelText("Lado recomendado: Drive. Preferencia: Revés").closest("p")?.textContent).toContain("#2")
    view.rerender(<MatchDetailPairingPanel {...props} rankingPositions={{ a: 3, b: 1 }} />)
    expect(Array.from(view.container.querySelectorAll(".app-match-player-name"), node => node.textContent)).toEqual(["Bea", "Ana", "Carla", "Dani"])
    expect(screen.getByLabelText("Lado recomendado: Drive. Preferencia: Revés").closest("p")?.textContent).toContain("#3")
    expect(players[0].preferredSide).toBe("reves")
    expect(players[1].preferredSide).toBe("reves")
  })

  it("does not add recommendations outside league context or to finished results", () => {
    const view = render(<MatchDetailPairingPanel {...props} showPositionHelp={false} />)
    expect(view.container.querySelector("[data-recommended-side]")).toBeNull()
    expect(screen.queryByRole("button")).toBeNull()
    view.rerender(<MatchDetailPairingPanel {...props} sets={[{ a: 6, b: 4 }]} pointsA={3} pointsB={0} />)
    expect(view.container.querySelector("[data-recommended-side]")).toBeNull()
    expect(screen.queryByRole("button")).toBeNull()
    expect(screen.queryByRole("button", { name: /Lado recomendado:/ })).toBeNull()
  })

  it("preserves stored order outside recommendations and for finished results", () => {
    const view = render(<MatchDetailPairingPanel {...props} teamA={["b", "a"]} teamB={["d", "c"]} showPositionHelp={false} />)
    const names = () => Array.from(view.container.querySelectorAll(".app-match-player-name"), node => node.textContent)
    expect(names()).toEqual(["Bea", "Ana", "Dani", "Carla"])
    view.rerender(<MatchDetailPairingPanel {...props} teamA={["b", "a"]} teamB={["d", "c"]} sets={[{ a: 6, b: 4 }]} />)
    expect(names()).toEqual(["Bea", "Ana", "Dani", "Carla"])
  })

  it("preserves preferences when a ranking is tied and does not guess the winner", () => {
    const { container } = render(<MatchDetailPairingPanel {...props} teamA={["b", "a"]} rankingPositions={{ a: 1, b: 1 }} />)
    expect(Array.from(container.querySelectorAll(".app-match-player-name"), node => node.textContent).slice(0, 2)).toEqual(["Bea", "Ana"])
    expect(container.querySelectorAll('[data-recommended-side="drive"]')).toHaveLength(1)
    expect(screen.queryByLabelText("Lado recomendado: Drive. Preferencia: Revés")).toBeNull()
  })
})
