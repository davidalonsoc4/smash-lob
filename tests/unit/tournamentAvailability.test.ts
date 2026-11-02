import { afterEach, describe, expect, it, vi } from "vitest"
import { areTournamentsEnabled, isTournamentRequestEnabled } from "@/lib/tournamentAvailability"

afterEach(() => vi.unstubAllEnvs())
describe("temporary tournament release availability", () => {
  it.each(["https://smashandlob.com", "https://www.smashandlob.com"])("hides tournaments for every user in %s", origin => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", origin)
    expect(areTournamentsEnabled()).toBe(false)
    expect(isTournamentRequestEnabled(new Request(`${origin}/api/tournaments`))).toBe(false)
  })
  it.each(["https://pre.smashandlob.com", "http://localhost:3100"])("keeps tournaments in %s", origin => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", origin)
    expect(areTournamentsEnabled()).toBe(true)
    expect(isTournamentRequestEnabled(new Request(`${origin}/tournaments/new`))).toBe(true)
  })
  it("never enables a production request with PRE config or forged headers", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://pre.smashandlob.com")
    expect(isTournamentRequestEnabled(new Request("https://smashandlob.com/api/tournaments", {headers:{"x-forwarded-host":"pre.smashandlob.com"}}))).toBe(false)
  })
})
