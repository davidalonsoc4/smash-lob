import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import {
  getLeagueLocationTownNameLabel,
  type LeagueLocation,
} from "@/lib/leagueLocations"

function location(name: string, town: string | null): LeagueLocation {
  return { name, town } as unknown as LeagueLocation
}

describe("v1.6.8 league recommended locations", () => {
  it("formats catalog options as Localidad - Nombre corto", () => {
    expect(getLeagueLocationTownNameLabel(location("Padel Indoor", "Bilbao"))).toBe(
      "Bilbao - Padel Indoor",
    )
    expect(getLeagueLocationTownNameLabel(location("Club sin localidad", null))).toBe(
      "Club sin localidad",
    )
  })

  it("keeps league locations as recommendations while loading the global catalog", async () => {
    const schedule = await readFile("src/components/match/MatchScheduleForm.tsx", "utf8")
    expect(schedule).toContain('fetch("/api/locations", { cache: "no-store" })')
    expect(schedule).toContain("recommendedIdentityKeys")
    expect(schedule).toContain("Recomendadas por la liga")
    expect(schedule).toContain("Todas las ubicaciones")
    expect(schedule).toContain("recommendedLocations.length === 0")
  })

  it("searches and displays the town-name label", async () => {
    const schedule = await readFile("src/components/match/MatchScheduleForm.tsx", "utf8")
    expect(schedule).toContain("Buscar por localidad o nombre...")
    expect(schedule).toContain("getLeagueLocationTownNameLabel(availableLocation)")
    expect(schedule).toContain("availableLocation.address")
    expect(schedule).toContain("availableLocation.town")
  })

  it("uses the same visible catalog label in personal-match location searches", async () => {
    const [createFriendly, scheduleFriendly, locationPicker] = await Promise.all([
      readFile("src/app/personal-matches/new/page.tsx", "utf8"),
      readFile("src/components/personal/PersonalMatchSchedulePanel.tsx", "utf8"),
      readFile("src/components/personal/PersonalMatchLocationPicker.tsx", "utf8"),
    ])
    expect(createFriendly).toContain("<PersonalMatchLocationPicker")
    expect(scheduleFriendly).toContain("<PersonalMatchLocationPicker")
    expect(locationPicker).toContain("getLeagueLocationTownNameLabel(location)")
  })
})
