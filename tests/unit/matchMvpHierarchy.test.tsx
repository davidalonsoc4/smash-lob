// @vitest-environment jsdom
import React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MvpVotingCard } from "@/components/mvp/MvpVotingCard"
import type { MvpMatch } from "@/lib/mvp"
import { es } from "@/i18n/locales/es"

const vote = vi.hoisted(() => vi.fn().mockResolvedValue(true))
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ tx: (s: string) => s, t: es }) }))
vi.mock("@/context/MvpProvider", () => ({ useMvp: () => ({ votes: [], voteForMatchMvp: vote }) }))
const match: MvpMatch = { id: "match", leagueId: "league", seasonId: "season", round: 1, status: "finished", teamA: ["a", "b"], teamB: ["c", "d"], sets: [{ a: 6, b: 2 }], pointsA: 1, pointsB: 0 }
const players = ["a", "b", "c", "d"].map(id => ({ id, displayName: `Jugador ${id}`, avatarInitials: id }))
const props = { match, matches: [match], currentUserId: "a", players, resultActions: <button>Confirmar resultado</button> }
afterEach(() => { cleanup(); vote.mockClear() })

describe("MVP recognition and result actions", () => {
  it("puts the technical tie in the heading and explains the adjusted index on demand", () => {
    const { container } = render(<MvpVotingCard {...props} mvpSystem="automatic_advanced" />)
    expect(container.querySelector("[data-mvp-recognition] p")?.textContent).toBe("MVP de la jornada · Empate técnico")
    const detail = container.querySelector("[data-mvp-recognition] p:last-child")!
    expect(detail.textContent).not.toContain("empate técnico")
    const trigger = screen.getByRole("button", { name: "Información sobre el índice ajustado" })
    fireEvent.click(trigger)
    expect(screen.getByRole("tooltip").textContent).toContain("no es un porcentaje")
    expect(screen.getByRole("tooltip").textContent).toContain("3 puntos o menos")
    fireEvent.keyDown(trigger, { key: "Escape" })
    expect(screen.queryByRole("tooltip")).toBeNull()
  })
  it("keeps resolved round recognition before result management without a voting panel", () => {
    const { container } = render(<MvpVotingCard {...props} mvpSystem="automatic" />)
    const recognition = container.querySelector("[data-mvp-recognition]")!
    expect(recognition.textContent).toContain("MVP de la jornada")
    expect(recognition.textContent).toContain("Jugador a")
    expect(recognition.compareDocumentPosition(screen.getByText("Confirmar resultado")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(container.querySelectorAll("button")).toHaveLength(1)
  })
  it("shows pending automatic recognition as information, retaining result actions", () => {
    const pending = { ...match, id: "pending", status: "scheduling", sets: [], pointsA: null, pointsB: null }
    const { container } = render(<MvpVotingCard {...props} matches={[match, pending]} mvpSystem="automatic_advanced" />)
    expect(container.querySelector("[data-mvp-recognition]")).toBeNull()
    expect(container.querySelector("[data-mvp-pending]")?.textContent).toContain("Se calculará al completar la jornada")
    expect(screen.getByText("Confirmar resultado")).toBeTruthy()
  })
  it("keeps pending voting after result confirmation and sends the selected player's vote once", async () => {
    render(<MvpVotingCard {...props} mvpSystem="voting" />)
    const candidate = screen.getByRole("button", { name: "Jugador b" })
    expect(screen.getByText("Confirmar resultado").compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(candidate)
    await waitFor(() => expect(vote).toHaveBeenCalledTimes(1))
    expect(vote).toHaveBeenCalledWith(expect.objectContaining({ selectedPlayerId: "b", voterPlayerId: "a", matchId: "match" }))
    expect(screen.queryByRole("button", { name: "Jugador a" })).toBeNull()
  })
  it("retains result actions when MVP is disabled", () => {
    const { container } = render(<MvpVotingCard {...props} mvpSystem="none" />)
    expect(screen.getByText("Confirmar resultado")).toBeTruthy()
    expect(container.querySelector("[data-mvp-recognition]")).toBeNull()
  })
})
