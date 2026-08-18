import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFileSync(path, "utf8")

describe("v1.6.1 UI polish", () => {
  it("adds explicit accent strips to ranking and the two profile summary cards", () => {
    const ranking = read("src/components/ranking/RankingTable.tsx")
    const profile = read("src/components/player/PlayerProfileScreen.tsx")
    expect(ranking).toContain('<AppCard accentStrip className="app-ranking-list')
    expect(profile.match(/<AppCard accentStrip className="overflow-hidden !p-0">/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it("does not render a fallback league logo on HOME", () => {
    const home = read("src/app/page.tsx")
    expect(home).toContain("{activeLeague.logoUrl ? (")
    expect(home).toContain("<LeagueLogo league={activeLeague}")
  })

  it("compacts scheduling and removes league context below Jornada", () => {
    const schedule = read("src/components/match/MatchScheduleForm.tsx")
    const detail = read("src/components/match/MatchDetailView.tsx")
    expect(schedule).toContain('className="px-3 pb-3 pt-1"')
    expect(schedule).toContain('${hasSchedule ? "pt-0" : "pt-1"}')
    expect(detail).not.toContain("{eyebrow ? (")
  })

  it("uses searchable, scrollable player and location pickers", () => {
    const participant = read("src/components/personal/PersonalMatchParticipantSelector.tsx")
    const leagueSchedule = read("src/components/match/MatchScheduleForm.tsx")
    const friendlySchedule = read("src/components/personal/PersonalMatchSchedulePanel.tsx")
    const friendlyNew = read("src/app/personal-matches/new/page.tsx")
    const friendlyLocationPicker = read("src/components/personal/PersonalMatchLocationPicker.tsx")
    expect(participant).toContain('type="search"')
    expect(participant).toContain("sourceLeagueNames")
    expect(participant).toContain("Otro jugador...")
    expect(leagueSchedule).toContain("filteredAvailableLocations.map")
    expect(leagueSchedule).not.toContain("filteredAvailableLocations.slice(0, 6)")
    expect(friendlySchedule).toContain("<PersonalMatchLocationPicker")
    expect(friendlyNew).toContain("<PersonalMatchLocationPicker")
    expect(friendlyLocationPicker).toContain("filteredLocations.map")
    expect(friendlyLocationPicker).toContain('type="search"')
  })

  it("extends Help with locations and friendly-player selection", () => {
    const guide = read("src/lib/leagueGuide.ts")
    expect(guide).toContain('id: "friendly-matches"')
    expect(guide).toContain("Programación y ubicaciones")
    expect(guide).toContain("buscar por jugador o liga")
    expect(guide).toContain("pareja ganadora con el resultado más dominante")
  })
})
