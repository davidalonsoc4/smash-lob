import { describe, expect, it } from "vitest"
import { isActiveStoredLeagueInvite } from "@/lib/inviteValidity"

describe("stored league invitation validity", () => {
  it("accepts an invitation that has not been revoked", () => {
    expect(
      isActiveStoredLeagueInvite({
        league_id: "11111111-1111-4111-8111-111111111111",
        revoked_at: null,
      }),
    ).toBe(true)
  })

  it("rejects a revoked invitation", () => {
    expect(
      isActiveStoredLeagueInvite({
        league_id: "11111111-1111-4111-8111-111111111111",
        revoked_at: "2026-08-02T21:00:00.000Z",
      }),
    ).toBe(false)
  })

  it("rejects missing or malformed stored invitations", () => {
    expect(isActiveStoredLeagueInvite(null)).toBe(false)
    expect(
      isActiveStoredLeagueInvite({
        league_id: "",
        revoked_at: null,
      }),
    ).toBe(false)
  })
})
