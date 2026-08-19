import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.4.12 personal and league polish", () => {
  it("moves first-league locations to season creation and keeps them searchable", async () => {
    const [newLeague, seasonAdmin, editor, schedule] = await Promise.all([
      read("src/app/league/new/page.tsx"),
      read("src/app/admin/season/page.tsx"),
      read("src/components/league/LeagueLocationsEditor.tsx"),
      read("src/components/match/MatchScheduleForm.tsx"),
    ])

    expect(newLeague).not.toContain("<LeagueLocationsEditor")
    expect(seasonAdmin).toContain("<LeagueLocationsEditor")
    expect(seasonAdmin).toContain("Cancelar creación de la liga")
    expect(seasonAdmin).toContain("updateLeagueLocations")
    expect(editor).toContain("Buscar por nombre, localidad o dirección...")
    expect(schedule).toContain("Buscar por localidad o nombre...")
    expect(schedule).toContain("Recomendadas por la liga")
    expect(schedule).toContain("Todas las ubicaciones")
    expect(schedule).toContain("recommendedLocations.length === 0")
    expect(schedule).toContain("+ Añadir nueva ubicación")
    expect(schedule).toContain('fetch("/api/locations"')
  })

  it("uses context-specific match headers and only prompts the next pending league match", async () => {
    const [home, calendar, card] = await Promise.all([
      read("src/app/page.tsx"),
      read("src/app/matches/page.tsx"),
      read("src/components/matches/MatchCard.tsx"),
    ])

    expect(home).toContain("Jornada ${selectedNextMatch.round}")
    expect(home).toContain("Jornada ${selectedLastMatch.round}")
    expect(home).toContain('statusPosition="right"')
    expect(calendar).toContain('headerLeftLabel={tx(`Jornada ${match.round}`)}')
    expect(calendar).toContain('statusPosition="right"')
    expect(calendar).not.toContain('"Jugado" : "Pendiente de jugar"')
    expect(calendar).toContain("nextPendingUserMatch")
    expect(calendar).toContain("getNextMatch(currentUserMatches)")
    expect(calendar).toContain("match.id === nextPendingUserMatch?.id")
    expect(card).toContain("showChevron = false")
    expect(card).toContain("hideMissingScheduleMeta")
    expect(card).toContain("showChevron ? <ClickableChevron")
  })

  it("redirects a deleted league to Mis ligas and exposes direct friendly creation", async () => {
    const [adminLeague, leagues] = await Promise.all([
      read("src/app/admin/league/page.tsx"),
      read("src/app/leagues/page.tsx"),
    ])

    expect(adminLeague).toContain('window.location.replace("/leagues")')
    expect(leagues).toContain('href="/personal-matches/new"')
    expect(leagues).toContain("Registrar encuentro amistoso")
  })

  it("normalizes location text before rendering shared match metadata", async () => {
    const [meta, server] = await Promise.all([
      read("src/components/matches/MatchEventMeta.tsx"),
      read("src/lib/serverPersonalMatches.ts"),
    ])

    expect(meta).toContain("getScheduleLocationDisplayText")
    expect(server).toContain("getScheduleLocationDisplayText")
  })
})
