import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const migrationPath =
  "supabase/migrations/20260803203000_remove_league_avatars_and_keep_account_identity.sql"

describe("account avatar and historical identity correction migration", () => {
  it("removes the rejected per-league avatar column", async () => {
    const source = await readFile(migrationPath, "utf8")

    expect(source).toContain("DROP COLUMN IF EXISTS league_avatar_url")
    expect(source).toContain("app_users.avatar_url")
    expect(source).toContain("UPDATE public.players")
    expect(source).toContain("WHERE avatar_url IS NOT NULL")
  })

  it("keeps only historical name and initials in the link snapshot", async () => {
    const source = await readFile(migrationPath, "utf8")
    const snapshotDefinition = source.slice(
      source.indexOf("link_identity_snapshot = COALESCE"),
      source.indexOf("display_name = COALESCE"),
    )

    expect(snapshotDefinition).toContain("'displayName'")
    expect(snapshotDefinition).toContain("'avatarInitials'")
    expect(snapshotDefinition).not.toContain("'avatarUrl'")
  })

  it("clears account images when a player is released", async () => {
    const source = await readFile(migrationPath, "utf8")

    expect(source).toContain("TG_OP = 'DELETE'")
    expect(source).toContain("avatar_url = NULL")
    expect(source).toContain("link_identity_snapshot = NULL")
    expect(source).toContain("league_memberships_sync_linked_player_identity")
  })
})
