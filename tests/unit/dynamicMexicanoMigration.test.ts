import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("dynamic Mexicano migration", () => {
  it("adds only the format seed and reuses the tournament domain", async () => {
    const sql = await readFile("supabase/migrations/20261020164339_add_dynamic_mexicano_tournaments.sql", "utf8")
    expect(sql).toContain("generation_seed integer")
    expect(sql).toContain("status IN ('pending','generated','completed')")
    expect(sql).toContain("dynamic_mexicano")
    expect(sql).toContain("INSERT INTO public.rapid_tournament_matches")
    expect(sql).toContain("INSERT INTO public.rapid_tournament_rounds")
    expect(sql).not.toContain("CREATE TABLE public.dynamic")
  })

  it("serializes generation and makes duplicate requests idempotent", async () => {
    const sql = await readFile("supabase/migrations/20261020164339_add_dynamic_mexicano_tournaments.sql", "utf8")
    expect(sql).toContain("FOR UPDATE")
    expect(sql).toContain("IF v_existing > 0 THEN RETURN true")
    expect(sql).toContain("p_round_number <> v_previous + 1")
    expect(sql).toContain("score_a IS NULL OR score_b IS NULL")
  })

  it("locks historical results and direct execution by user roles", async () => {
    const sql = await readFile("supabase/migrations/20261020164339_add_dynamic_mexicano_tournaments.sql", "utf8")
    expect(sql).toContain("round_number>v_round")
    expect(sql).toContain("SECURITY INVOKER")
    expect(sql).toContain("FROM PUBLIC,anon,authenticated")
    expect(sql).toContain("TO service_role")
  })
})
