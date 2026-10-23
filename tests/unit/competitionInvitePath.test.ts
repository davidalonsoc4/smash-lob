import { describe, expect, it } from "vitest"
import { getCompetitionInvitePath } from "@/lib/inviteUrls"

describe("competition invitation entry", () => {
  it("keeps league codes and links compatible", () => {
    expect(getCompetitionInvitePath(" abc123 ")).toBe("/invite/ABC123")
    expect(getCompetitionInvitePath("https://example.test/invite/abc123?leagueId=test")).toBe("/invite/ABC123")
  })
  it("recognizes tournament links and tokens without changing case", () => {
    const token = "aB_9-".repeat(8) + "XyZ"
    expect(getCompetitionInvitePath(token)).toBe(`/tournament-invite/${token}`)
    expect(getCompetitionInvitePath(`https://example.test/tournament-invite/${token}?from=share`)).toBe(`/tournament-invite/${token}`)
    expect(getCompetitionInvitePath(`/tournament-invite/${token}`)).toBe(`/tournament-invite/${token}`)
  })
  it("rejects malformed or unrelated destinations", () => {
    for (const value of ["", "https://example.test/settings", "/tournament-invite/short", "/tournament-invite/%ZZ", "javascript:alert(1)"]) {
      expect(getCompetitionInvitePath(value)).toBeNull()
    }
  })
})
