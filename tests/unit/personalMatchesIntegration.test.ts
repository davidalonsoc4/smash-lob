import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("personal matches integration", () => {
  it("keeps personal matches separate from league competition", async () => {
    const [leagues, shell, gate] = await Promise.all([
      readFile("src/app/leagues/page.tsx", "utf8"),
      readFile("src/components/layout/AppShell.tsx", "utf8"),
      readFile("src/components/auth/LeagueEntryGate.tsx", "utf8"),
    ])

    expect(leagues).toContain('href="/personal-matches"')
    expect(leagues).toContain("Actividad personal")
    expect(shell).toContain("isPersonalMatchesRoute")
    expect(shell).toContain("!isPersonalMatchesRoute")
    expect(gate).toContain("isPersonalMatchesRoute")
  })

  it("protects the API and supports shared linked accounts plus external names", async () => {
    const [listRoute, detailRoute, peopleRoute, serverHelper] = await Promise.all([
      readFile("src/app/api/personal-matches/route.ts", "utf8"),
      readFile("src/app/api/personal-matches/[id]/route.ts", "utf8"),
      readFile("src/app/api/personal-matches/people/route.ts", "utf8"),
      readFile("src/lib/serverPersonalMatches.ts", "utf8"),
    ])

    for (const route of [listRoute, detailRoute, peopleRoute]) {
      expect(route).toContain("requireAuthenticatedAppUser")
    }
    expect(listRoute).toContain("personal_match_requires_current_user")
    expect(listRoute).toContain("person.userId")
    expect(listRoute).toContain("display_name: draft.displayName")
    expect(serverHelper).toContain('key: `user:${user.id}`')
    expect(serverHelper).toContain('`player:${player.id}`')
  })

  it("stores personal data behind service-role-only database access", async () => {
    const migration = await readFile(
      "supabase/migrations/20260808110500_add_personal_matches.sql",
      "utf8",
    )

    expect(migration).toContain("personal_matches")
    expect(migration).toContain("personal_match_participants")
    expect(migration).toContain("server_create_personal_match")
    expect(migration).toContain("enable row level security")
    expect(migration).toContain("from public, anon, authenticated")
    expect(migration).toContain("to service_role")
    expect(migration.toLowerCase()).not.toContain("pretemporada")
  })
})
