import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("global locations integration", () => {
  it("connects the global catalog to league and friendly creation", async () => {
    const [api, server, leagueEditor, friendlyEditor, friendlySchedule, locationPicker, matchScheduleForm, matchScheduleRoute, migration] = await Promise.all([
      readFile("src/app/api/locations/route.ts", "utf8"),
      readFile("src/lib/serverGlobalLocations.ts", "utf8"),
      readFile("src/components/league/LeagueLocationsEditor.tsx", "utf8"),
      readFile("src/app/personal-matches/new/page.tsx", "utf8"),
      readFile("src/components/personal/PersonalMatchSchedulePanel.tsx", "utf8"),
      readFile("src/components/personal/PersonalMatchLocationPicker.tsx", "utf8"),
      readFile("src/components/match/MatchScheduleForm.tsx", "utf8"),
      readFile("src/app/api/matches/[matchId]/schedule/route.ts", "utf8"),
      readFile("supabase/migrations/20260808183000_add_global_padel_locations.sql", "utf8"),
    ])

    expect(api).toContain("requireAuthenticatedAppUser")
    expect(server).toContain('from("padel_locations")')
    expect(server).toContain('from("leagues").select("locations")')
    expect(server).toContain('from("personal_matches")')
    expect(leagueEditor).toContain("Ubicaciones de la app")
    expect(leagueEditor).toContain('fetch("/api/locations"')
    expect(friendlyEditor).toContain('fetch("/api/locations"')
    expect(friendlyEditor).toContain("<PersonalMatchLocationPicker")
    expect(friendlySchedule).toContain("<MatchScheduleForm")
    expect(matchScheduleForm).toContain('fetch("/api/locations"')
    expect(matchScheduleForm).toContain("getLeagueLocationTownNameLabel")
    expect(locationPicker).toContain("Se guardará en el catálogo global al guardar el partido.")
    expect(matchScheduleRoute).toContain("saveGlobalLocation")
    expect(matchScheduleRoute).toContain("update({ locations: nextLeagueLocations })")
    expect(migration).toContain("enable row level security")
    expect(migration).toContain("service_role")
  })
})
