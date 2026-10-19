import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("flexible rapid tournament migration", () => {
  it("stores the supported player, court, booking and preparation configuration", async () => {
    const sql = await readFile("supabase/migrations/20261019145647_rapid_tournament_flexible_americana.sql", "utf8")
    for (const fragment of ["player_count BETWEEN 8 AND 16", "court_count BETWEEN 1 AND 4", "reservation_minutes IN (60, 90, 120)", "preparation_minutes", "court_four_name", "rapid_tournament_matches_court_number_check"]) expect(sql).toContain(fragment)
    expect(sql).toContain("p_preparation_minutes > v_safety - 2")
    expect(sql).toContain("round_count * least(court_count,floor(player_count/4.0))")
  })

  it("keeps tournament creation and flexible rerolls unavailable to direct user roles", async () => {
    const sql = await readFile("supabase/migrations/20261019145647_rapid_tournament_flexible_americana.sql", "utf8")
    expect(sql).toContain("SECURITY INVOKER")
    expect(sql).toContain("FROM PUBLIC,anon,authenticated")
    expect(sql).toContain("TO service_role")
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.finish_rapid_tournament")
  })

  it("replaces the flexible RPCs with PostgreSQL-valid JSON and unambiguous account checks", async () => {
    const sql = await readFile("supabase/migrations/20261019154207_fix_rapid_tournament_flexible_function_lint.sql", "utf8")
    expect(sql).toContain("jsonb_array_length(p_matches)")
    expect(sql).toContain("AS accounts(user_id)")
    expect(sql).not.toContain("cardinality(p_matches)")
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.reroll_rapid_tournament_flexible")
  })
})
