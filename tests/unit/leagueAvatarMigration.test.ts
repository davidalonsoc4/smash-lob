import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const migrationPath =
  "supabase/migrations/20260803160000_add_league_avatars_and_restore_unlinked_identity.sql"

describe("league avatar and unlink identity migration", () => {
  it("stores league-specific avatars and captures a reversible identity snapshot", async () => {
    const source = await readFile(migrationPath, "utf8")

    expect(source).toContain("ADD COLUMN IF NOT EXISTS league_avatar_url text")
    expect(source).toContain("ADD COLUMN IF NOT EXISTS link_identity_snapshot jsonb")
    expect(source).toContain("jsonb_build_object(")
    expect(source).toContain("'displayName', player.display_name")
    expect(source).toContain("'avatarInitials', player.avatar_initials")
    expect(source).toContain("'avatarUrl', player.avatar_url")
    expect(source).toContain("avatar_url = NULL")
  })

  it("restores identity on membership deletion and clears legacy account photos", async () => {
    const source = await readFile(migrationPath, "utf8")

    expect(source).toContain("TG_OP = 'DELETE'")
    expect(source).toContain("link_identity_snapshot = NULL")
    expect(source).toContain("ELSE NULL")
    expect(source).toContain("league_memberships_sync_linked_player_identity")
  })
})
