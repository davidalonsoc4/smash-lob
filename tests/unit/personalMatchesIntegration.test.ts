import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("personal matches integration", () => {
  it("aggregates league matches and friendlies without duplicating league data", async () => {
    const [page, serverHelper, migration] = await Promise.all([
      readFile("src/app/personal-matches/page.tsx", "utf8"),
      readFile("src/lib/serverPersonalMatches.ts", "utf8"),
      readFile("supabase/migrations/20260808124000_extend_personal_matches_schedule.sql", "utf8"),
    ])

    expect(page).toContain(">Mis partidos</h1>")
    expect(page).not.toContain("Tu agenda e historial completo: ligas y amistosos")
    expect(serverHelper).toContain('source === "friendly"')
    expect(serverHelper).toContain('source === "league"')
    expect(serverHelper).toContain('origin: "league"')
    expect(serverHelper).toContain('origin: "friendly"')
    expect(migration).toContain("server_list_user_match_history")
    expect(migration).toContain("from public.matches m")
    expect(migration).toContain("from public.personal_matches pm")
    expect(migration).not.toContain("insert into public.personal_matches\n    select")
  })

  it("paginates history ten at a time and exposes separate upcoming league/friendly matches", async () => {
    const [page, listRoute, serverHelper, migration] = await Promise.all([
      readFile("src/app/personal-matches/page.tsx", "utf8"),
      readFile("src/app/api/personal-matches/route.ts", "utf8"),
      readFile("src/lib/serverPersonalMatches.ts", "utf8"),
      readFile("supabase/migrations/20260808124000_extend_personal_matches_schedule.sql", "utf8"),
    ])

    expect(page).toContain("const pageSize = 10")
    expect(page).toContain("Cargar 10 más")
    expect(page).toContain("Liga")
    expect(page).toContain("Amistoso")
    expect(page).toContain("hasBothUpcoming")
    expect(listRoute).toContain('searchParams.get("offset")')
    expect(listRoute).toContain('searchParams.get("limit")')
    expect(listRoute).toContain('searchParams.get("includeUpcoming")')
    expect(serverHelper).toContain("safeLimit + 1")
    expect(serverHelper).toContain("server_list_user_match_history")
    expect(serverHelper).toContain("server_next_user_matches")
    expect(migration).toContain("limit least(greatest(coalesce(p_limit, 10), 1), 100)")
    expect(migration).toContain("offset greatest(coalesce(p_offset, 0), 0)")
  })

  it("supports scheduled friendlies and a league-like detail experience", async () => {
    const [createRoute, detailRoute, detailPage, card, shell] = await Promise.all([
      readFile("src/app/api/personal-matches/route.ts", "utf8"),
      readFile("src/app/api/personal-matches/[id]/route.ts", "utf8"),
      readFile("src/app/personal-matches/[id]/page.tsx", "utf8"),
      readFile("src/components/personal/PersonalMatchCard.tsx", "utf8"),
      readFile("src/components/layout/AppShell.tsx", "utf8"),
    ])

    expect(createRoute).toContain('value === "scheduled" || value === "finished"')
    expect(createRoute).toContain("p_status: status")
    expect(detailRoute).toContain("export async function PATCH")
    expect(detailRoute).toContain('action !== "schedule" && action !== "result"')
    expect(detailPage).toContain("<MatchDetailView")
    expect(detailPage).not.toContain("<MatchScoreboard")
    expect(detailPage).toContain("<PersonalMatchSchedulePanel")
    expect(detailPage).toContain("<PersonalMatchResultForm")
    expect(card).toContain("getPersonalMatchSetWins")
    expect(card).toContain("getPersonalMatchOutcome")
    expect(card).toContain("<SetGameScore")
    expect(card).toContain("showPersonalMatchChevron = false")
    expect(card).toContain("showPersonalMatchChevron ? <ClickableChevron")
    expect(card).toContain("match.locationName")
    expect(shell).toContain("const shouldShowSettingsButton")
    expect(shell).toContain("!isPersonalMatchesRoute")
    expect(shell).toContain('data-tour="floating-settings"')
  })

  it("keeps shared linked accounts, external names and service-role-only storage", async () => {
    const [listRoute, peopleRoute, serverHelper, baseMigration, extensionMigration] = await Promise.all([
      readFile("src/app/api/personal-matches/route.ts", "utf8"),
      readFile("src/app/api/personal-matches/people/route.ts", "utf8"),
      readFile("src/lib/serverPersonalMatches.ts", "utf8"),
      readFile("supabase/migrations/20260808110500_add_personal_matches.sql", "utf8"),
      readFile("supabase/migrations/20260808124000_extend_personal_matches_schedule.sql", "utf8"),
    ])

    for (const route of [listRoute, peopleRoute]) {
      expect(route).toContain("requireAuthenticatedAppUser")
    }
    expect(listRoute).toContain("personal_match_requires_current_user")
    expect(serverHelper).toContain("person.userId")
    expect(serverHelper).toContain("display_name: draft.displayName")
    expect(serverHelper).toContain('key: `user:${user.id}`')
    expect(serverHelper).toContain('`player:${player.id}`')
    expect(serverHelper).toContain("deduplicatePersonalMatchPeople(people)")
    expect(baseMigration).toContain("enable row level security")
    expect(extensionMigration).toContain("from public, anon, authenticated")
    expect(extensionMigration).toContain("to service_role")
    expect(extensionMigration).toContain("five-argument RPC as a compatibility wrapper")
    expect(extensionMigration.toLowerCase()).not.toContain("pretemporada")
  })
})
