import { describe, expect, it } from "vitest"
import {
  getPersonalMatchOriginBadgeClass,
  getPersonalMatchOriginBadgeStyle,
} from "@/lib/personalMatches"

describe("personal match origin colors", () => {
  it("uses each configured league accent with theme variables and rejects invalid CSS", () => {
    const match = { origin: "league" as const, leagueId: "a", leagueName: "Liga A" }
    const style = getPersonalMatchOriginBadgeStyle(match, "#123456")
    expect(style).toMatchObject({ "--personal-league-accent": "#123456", color: "var(--personal-league-text)", backgroundColor: "var(--personal-league-background)" })
    expect(getPersonalMatchOriginBadgeStyle(match, "red;display:none")).toEqual(getPersonalMatchOriginBadgeStyle(match))
    expect(getPersonalMatchOriginBadgeStyle({ ...match, origin: "friendly" }, "#123456")).toBeUndefined()
  })
  it("keeps friendlies neutral and assigns stable visibly distinct safe colors to leagues", () => {
    const friendly = {
      origin: "friendly" as const,
      leagueId: null,
      leagueName: null,
    }
    expect(getPersonalMatchOriginBadgeClass(friendly)).toContain("slate")
    expect(getPersonalMatchOriginBadgeStyle(friendly)).toBeUndefined()

    const leagueInputs = [
      "178fc810-5ff2-4e47-a23d-e3a16c5db201",
      "2e47d982-e2ee-4fd1-a478-675f87ccf302",
      "851c2245-952d-4706-b79d-3a4f7be2f403",
    ].map((leagueId) => ({
      origin: "league" as const,
      leagueId,
      leagueName: leagueId,
    }))
    const styles = leagueInputs.map((match) => getPersonalMatchOriginBadgeStyle(match))

    expect(new Set(styles.map((style) => style?.backgroundColor)).size).toBe(styles.length)
    expect(getPersonalMatchOriginBadgeStyle(leagueInputs[0])).toEqual(styles[0])

    for (const style of styles) {
      expect(style?.backgroundColor).toMatch(/^hsl\(/)
      expect(style?.borderColor).toMatch(/^hsl\(/)
      expect(style?.color).toMatch(/^hsl\(/)
      const hue = Number(style?.backgroundColor.match(/^hsl\((\d+)/)?.[1])
      expect(hue < 60 || (hue >= 180 && hue <= 326)).toBe(true)
    }
  })
})
