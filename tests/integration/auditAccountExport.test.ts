import { beforeEach, expect, it, vi } from "vitest"
const gate = vi.hoisted(() => vi.fn())
vi.mock("@/lib/serverAuth", () => ({ requireAuthenticatedAppUser: gate }))
import { GET } from "@/app/api/account/export/route"
beforeEach(() => vi.clearAllMocks())

function fixture(failedTable?: string) {
  const tables: Record<string, Record<string, unknown>[]> = {
    league_memberships: [{ user_id: "account", player_id: "player-one" }, { user_id: "account", player_id: "player-two" }, { user_id: "other", player_id: "other-player" }],
    season_players: [{ player_id: "player-one" }, { player_id: "player-two" }, { player_id: "other-player" }],
    notification_preferences: [{ user_email: "fixture@example.test" }, { user_email: "other@example.test" }],
    push_subscriptions: [{ user_email: "fixture@example.test" }, { user_email: "other@example.test" }],
  }
  gate.mockResolvedValue({ ok: true, actor: { user: { id: "account", email: "fixture@example.test" }, supabase: { from: (table: string) => ({ select: () => ({
    eq: async (column: string, value: unknown) => ({ data: (tables[table] ?? []).filter((row) => row[column] === value), error: table === failedTable ? { message: "private database detail" } : null }),
    in: async (column: string, values: unknown[]) => ({ data: (tables[table] ?? []).filter((row) => values.includes(row[column])), error: table === failedTable ? { message: "private database detail" } : null }),
  }) }) } } })
}

it("exports linked league players across seasons without including another account", async () => {
  fixture()
  const response = await GET()
  expect(response.status).toBe(200)
  expect(response.headers.get("cache-control")).toContain("no-store")
  const result = await response.json()
  expect(result.memberships).toHaveLength(2)
  expect(result.seasonPlayers.map((row: { player_id: string }) => row.player_id)).toEqual(["player-one", "player-two"])
  expect(result.notificationPreferences).toEqual([{ user_email: "fixture@example.test" }])
  expect(result.pushSubscriptions).toEqual([{ user_email: "fixture@example.test" }])
})
it.each(["league_memberships", "season_players", "notification_preferences", "push_subscriptions"])("does not report a complete export when %s fails", async (table) => {
  fixture(table)
  const response = await GET()
  expect(response.status).toBe(500)
  expect(await response.json()).toEqual({ error: "account_export_failed" })
})
