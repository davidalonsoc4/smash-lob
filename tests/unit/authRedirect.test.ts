import { describe, expect, it } from "vitest"
import { buildPostAuthDestination } from "@/lib/authRedirect"

describe("post-auth destination", () => {
  it("preserves a player invitation and its league hint", () => {
    expect(
      buildPostAuthDestination(
        "/invite/ABC-123",
        new URLSearchParams({ leagueId: "league-a" }),
      ),
    ).toBe("/invite/ABC-123?leagueId=league-a")
  })

  it("preserves a spectator invitation", () => {
    expect(
      buildPostAuthDestination("/spectate/SPECTATOR-123", new URLSearchParams()),
    ).toBe("/spectate/SPECTATOR-123")
  })

  it.each([
    "https://attacker.example/invite/ABC",
    "//attacker.example/invite/ABC",
    "/settings",
    "/invite",
    "/",
  ])("falls back to Home for a non-invite destination: %s", (destination) => {
    expect(buildPostAuthDestination(destination)).toBe("/")
  })
})
