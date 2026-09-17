import { describe, expect, it } from "vitest"
import { getPublicSpectatorUrl } from "@/lib/inviteUrls"

describe("league spectator QR destinations", () => {
  it("points PRE invitations to the public PRE spectator page", () => {
    const request = new Request("https://pre.smashandlob.com/api/leagues/league-id/spectator-invite")

    expect(getPublicSpectatorUrl("spectator-code", request)).toBe(
      "https://pre.smashandlob.com/spectate/spectator-code",
    )
  })

  it("points production invitations to the public production spectator page", () => {
    const request = new Request("https://smashandlob.com/api/leagues/league-id/spectator-invite")

    expect(getPublicSpectatorUrl("spectator-code", request)).toBe(
      "https://smashandlob.com/spectate/spectator-code",
    )
  })

  it("uses localhost only for a local development request", () => {
    const request = new Request("http://localhost:3000/api/leagues/league-id/spectator-invite")

    expect(getPublicSpectatorUrl("spectator-code", request)).toBe(
      "http://localhost:3000/spectate/spectator-code",
    )
  })
})
