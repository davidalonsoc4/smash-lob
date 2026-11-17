// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { LockedRoundChatCard } from "@/components/chats/LockedRoundChatCard"

vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ tx: (text: string) => text, locale: "es" }) }))

afterEach(cleanup)

describe("locked round card in the chat lists", () => {
  it("shows the round, the lock wording and no way in", () => {
    const { container } = render(<LockedRoundChatCard round={3} withDate={false} />)
    expect(screen.getByText("Jornada 3")).toBeTruthy()
    expect(screen.getByText("Emparejamientos secretos")).toBeTruthy()
    expect(container.querySelector("a, button")).toBeNull()
    expect(container.querySelector("svg rect")).not.toBeNull()
  })

  it("carries no counters, names or messages", () => {
    const { container } = render(<LockedRoundChatCard round={2} withDate={false} />)
    expect(container.querySelector("[aria-label*='sin leer']")).toBeNull()
    expect(container.textContent).not.toMatch(/con .* vs /)
    expect(container.textContent).not.toContain("Sin mensajes")
  })

  it("only mentions the start date when the season has date windows", () => {
    const without = render(<LockedRoundChatCard round={2} withDate={false} />)
    expect(without.container.textContent).toContain("Se revelarán cuando finalice la jornada anterior.")
    expect(without.container.textContent).not.toContain("como máximo")
    cleanup()
    const withDate = render(<LockedRoundChatCard round={2} withDate />)
    expect(withDate.container.textContent).toContain("como máximo, al comenzar esta jornada")
  })

  it("names the league in the global list", () => {
    render(<LockedRoundChatCard round={4} withDate={false} leagueName="Smash & Lob PRO League" />)
    expect(screen.getByText("Smash & Lob PRO League")).toBeTruthy()
  })
})
