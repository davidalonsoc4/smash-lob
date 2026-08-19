import { describe, expect, it } from "vitest"
import {
  createScheduledLeagueLocationValue,
  findLeagueLocationByScheduleLocation,
  getLeagueLocationOptionLabel,
  type LeagueLocation,
} from "@/lib/leagueLocations"
import { readFile } from "node:fs/promises"

const locations: LeagueLocation[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Otro club",
    town: "Barakaldo",
    address: "Calle Uno 1",
    courtCount: 3,
    selectedCourt: null,
    googlePlaceId: "place-other",
    googlePlaceName: "Otro club Barakaldo",
    googleMapsUrl: "https://maps.app.goo.gl/other",
    latitude: 43.1,
    longitude: -2.9,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Lasesarre",
    town: "Barakaldo",
    address: "Avenida Lasesarre 1",
    courtCount: 2,
    selectedCourt: null,
    googlePlaceId: "place-lasesarre",
    googlePlaceName: "Lasesarre Kirolgunea",
    googleMapsUrl: "https://maps.app.goo.gl/lasesarre",
    latitude: 43.2,
    longitude: -2.99,
  },
]

describe("v1.10.19 strict location resolution", () => {
  it("keeps the exact selected league location when several locations share the same town", () => {
    const stored = createScheduledLeagueLocationValue(locations[1], "Pista 2")
    const resolved = findLeagueLocationByScheduleLocation({
      locations,
      scheduleLocation: stored,
    })

    expect(resolved).toMatchObject({
      id: locations[1].id,
      name: "Lasesarre",
      town: "Barakaldo",
      selectedCourt: "Pista 2",
      googleMapsUrl: "https://maps.app.goo.gl/lasesarre",
    })
  })

  it("never treats a shared town by itself as a location identity", () => {
    expect(
      findLeagueLocationByScheduleLocation({
        locations,
        scheduleLocation: "Barakaldo",
      }),
    ).toBeNull()
  })

  it("recovers a legacy friendly label and its court without binding to a false duplicate", () => {
    const falseLegacyDuplicate: LeagueLocation = {
      id: "33333333-3333-4333-8333-333333333333",
      name: "Barakaldo - Lasesarre - Pista 2",
      town: null,
      address: null,
      courtCount: null,
      selectedCourt: null,
      googlePlaceId: null,
      googlePlaceName: null,
      googleMapsUrl: null,
      latitude: null,
      longitude: null,
    }
    const legacyText = `${getLeagueLocationOptionLabel(locations[1])} · Pista 2`
    const resolved = findLeagueLocationByScheduleLocation({
      locations: [falseLegacyDuplicate, ...locations],
      scheduleLocation: legacyText,
    })

    expect(resolved?.id).toBe(locations[1].id)
    expect(resolved?.selectedCourt).toBe("Pista 2")
  })

  it("keeps the structured friendly location for schedule editing while retaining a display label", async () => {
    const [types, server, panel, scheduleForm] = await Promise.all([
      readFile("src/lib/personalMatches.ts", "utf8"),
      readFile("src/lib/serverPersonalMatches.ts", "utf8"),
      readFile("src/components/personal/PersonalMatchSchedulePanel.tsx", "utf8"),
      readFile("src/components/match/MatchScheduleForm.tsx", "utf8"),
    ])

    expect(types).toContain("scheduleLocation?: string | null")
    expect(server).toContain("createScheduledLeagueLocationValue(")
    expect(server).toContain("scheduleLocation,")
    expect(panel).toContain("location={match.scheduleLocation ?? match.locationName}")
    expect(scheduleForm).toContain("current === otherLocationValue")
  })
})
