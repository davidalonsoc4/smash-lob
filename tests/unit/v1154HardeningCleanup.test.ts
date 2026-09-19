import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"

describe("v1.15.4 account capability separation", () => {
  it("keeps create-league visible in player experience mode", async () => {
    const source = await readFile("src/app/settings/page.tsx", "utf8")
    expect(source).toContain("const canCreateLeaguesInCurrentView = canCreateLeagues")
    expect(source).not.toContain("canCreateLeagues && canAccessAdmin")
  })
})

describe("v1.15.4 hardening contracts", () => {
  it("persists notification read state server-side", async () => {
    const migration = await readFile("supabase/migrations/20260919100000_add_notification_read_state.sql", "utf8")
    const route = await readFile("src/app/api/notifications/read-state/route.ts", "utf8")
    expect(migration).toContain("notification_reads")
    expect(route).toContain("onConflict: \"user_id,event_id\"")
  })

  it("exposes cursor pagination for activity", async () => {
    const route = await readFile("src/app/api/leagues/[id]/activity/route.ts", "utf8")
    expect(route).toContain("createdAtBefore")
    expect(route).toContain("nextCursor")
  })

  it("keeps legal and about pages discoverable", async () => {
    const source = await readFile("src/lib/settingsSearch.ts", "utf8")
    expect(source).toContain('"aboutApp"')
    expect(source).toContain('"privacy"')
    expect(source).toContain('"terms"')
  })

  it("offers JSON export and explicit account anonymization", async () => {
    const exportRoute = await readFile("src/app/api/account/export/route.ts", "utf8")
    const deleteRoute = await readFile("src/app/api/account/delete/route.ts", "utf8")
    expect(exportRoute).toContain("exportedAt")
    expect(deleteRoute).toContain("ELIMINAR MI CUENTA")
    expect(deleteRoute).toContain("Usuario eliminado")
  })
})
