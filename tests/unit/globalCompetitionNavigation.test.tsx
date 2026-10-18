// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PersonalMatchesNav } from "@/components/personal/PersonalMatchesNav"
import { isCompetitionOverviewRoute } from "@/lib/competitionNavigation"

const state = vi.hoisted(() => ({ pathname: "/leagues" }))
vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }))
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ tx: (text: string) => text }) }))
afterEach(cleanup)

describe("shared global navigation", () => {
  it.each([
    ["/leagues", "Competiciones"], ["/leagues/all", "Competiciones"], ["/tournaments", "Competiciones"],
    ["/personal-matches", "Mis partidos"], ["/personal-matches/new", "Mis partidos"],
    ["/personal-matches/chats", "Chats"], ["/personal-matches/profile", "Mi perfil"],
  ])("keeps four destinations and one active link on %s", (pathname, active) => {
    state.pathname = pathname
    render(<PersonalMatchesNav />)
    expect(screen.getAllByRole("link").map(link => link.getAttribute("href"))).toEqual(["/leagues", "/personal-matches", "/personal-matches/chats", "/personal-matches/profile"])
    expect(screen.getAllByRole("link", { current: "page" })).toHaveLength(1)
    expect(screen.getByRole("link", { name: active })).toHaveAttribute("aria-current", "page")
  })
  it.each(["/", "/matches", "/settings", "/leagues/unknown", "/tournaments/new", "/tournaments/fixture", "/tournaments/fixture/calendar", "/personal-matches/fixture/chat"])("does not classify %s as a competition overview", pathname => {
    expect(isCompetitionOverviewRoute(pathname)).toBe(false)
  })
})
