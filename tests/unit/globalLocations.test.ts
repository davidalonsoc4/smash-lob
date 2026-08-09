import { describe, expect, it } from "vitest"
import {
  createLeagueLocation,
  getLeagueLocationIdentityKey,
  normalizeLeagueLocations,
} from "@/lib/leagueLocations"

describe("global padel location identity", () => {
  it("deduplicates the same Google place independently of league-local ids", () => {
    const first = createLeagueLocation({
      name: "Padel Indoor Bilbao",
      town: "Bilbao",
      googlePlaceId: "ChIJ-global-place",
    })
    const second = createLeagueLocation({
      name: "Padel Indoor Bilbao",
      town: "Bilbao",
      googlePlaceId: "ChIJ-global-place",
    })

    expect(first).not.toBeNull()
    expect(second).not.toBeNull()

    const firstWithLeagueLocalId = { ...first!, id: "league-a-local" }
    const secondWithLeagueLocalId = { ...second!, id: "league-b-local" }

    expect(getLeagueLocationIdentityKey(firstWithLeagueLocalId)).toBe(
      getLeagueLocationIdentityKey(secondWithLeagueLocalId),
    )
    expect(
      normalizeLeagueLocations([firstWithLeagueLocalId, secondWithLeagueLocalId]),
    ).toHaveLength(1)
  })

  it("normalizes manual names and towns for stable global identity", () => {
    const first = createLeagueLocation({ name: "  Pádel Norte ", town: "Bilbao" })
    const second = createLeagueLocation({ name: "padel norte", town: " BILBAO " })
    expect(getLeagueLocationIdentityKey(first!)).toBe(getLeagueLocationIdentityKey(second!))
  })
})
