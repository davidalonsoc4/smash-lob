// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { LockedRoundChatCard } from "@/components/chats/LockedRoundChatCard"

vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ tx: (text: string) => text, locale: "es" }) }))

afterEach(cleanup)

describe("locked round card in the chat lists", () => {
  it("shows the round, the lock wording and no way in", () => {
    const { container } = render(<LockedRoundChatCard round={3} />)
    expect(screen.getByText("Jornada 3")).toBeTruthy()
    expect(screen.getByText("Emparejamientos secretos")).toBeTruthy()
    expect(container.querySelector("a, button")).toBeNull()
    expect(container.querySelector("svg rect")).not.toBeNull()
  })

  it("is light: one short line, no uppercase and no long explanation per card", () => {
    const { container } = render(<LockedRoundChatCard round={2} />)
    expect(container.textContent).not.toContain("Se revelarán")
    expect(container.textContent).not.toContain("como máximo")
    expect(container.innerHTML).not.toContain("uppercase")
    expect(container.querySelectorAll("p")).toHaveLength(2)
  })

  it("carries no counters, names or messages", () => {
    const { container } = render(<LockedRoundChatCard round={2} />)
    expect(container.querySelector("[aria-label*='sin leer']")).toBeNull()
    expect(container.textContent).not.toMatch(/con .* vs /)
    expect(container.textContent).not.toContain("Sin mensajes")
  })

  it("names the league in the global list", () => {
    render(<LockedRoundChatCard round={4} leagueName="Smash & Lob PRO League" />)
    expect(screen.getByText("Smash & Lob PRO League")).toBeTruthy()
  })
})
