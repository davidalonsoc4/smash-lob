import { describe, expect, it } from "vitest"
import { getPersonalMatchOriginBadgeClass } from "@/lib/personalMatches"

describe("personal match origin colors", () => {
  it("keeps friendlies neutral and league colors stable without victory/defeat colors", () => {
    const friendly = getPersonalMatchOriginBadgeClass({
      origin: "friendly",
      leagueId: null,
      leagueName: null,
    })
    expect(friendly).toContain("slate")
    expect(friendly).not.toMatch(/red|rose|green|emerald|lime|teal/)

    const leagueInputs = ["league-alpha", "league-beta", "league-gamma"].map((leagueId) => ({
      origin: "league" as const,
      leagueId,
      leagueName: leagueId,
    }))
    const colors = leagueInputs.map((match) => getPersonalMatchOriginBadgeClass(match))

    expect(new Set(colors).size).toBe(3)
    for (const color of colors) {
      expect(color).not.toMatch(/red|rose|green|emerald|lime|teal/)
    }
    expect(getPersonalMatchOriginBadgeClass(leagueInputs[0])).toBe(colors[0])
  })
})
