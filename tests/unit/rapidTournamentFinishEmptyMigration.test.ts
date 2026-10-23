import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("empty rapid tournament finishing migration", () => {
  it("allows only the creator to close an unscored draft or active tournament", async () => {
    const sql = await readFile("supabase/migrations/20261021223000_finish_empty_rapid_tournament.sql", "utf8")
    expect(sql).toContain("CREATE FUNCTION public.finish_empty_rapid_tournament")
    expect(sql).toContain("v_status NOT IN ('draft', 'in_progress')")
    expect(sql).toContain("score_a IS NOT NULL OR score_b IS NOT NULL")
    expect(sql).toContain("created_by_user_id = p_creator_user_id")
    expect(sql).toContain("SECURITY INVOKER")
    expect(sql).toContain("REVOKE ALL ON FUNCTION public.finish_empty_rapid_tournament")
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION public.finish_empty_rapid_tournament(uuid, uuid) TO service_role")
  })
})
