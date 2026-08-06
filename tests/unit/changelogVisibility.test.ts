import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("changelog visibility", () => {
  it("keeps the changelog link for both player and spectator settings", async () => {
    const settings = await readFile("src/app/settings/page.tsx", "utf8")
    expect(settings.match(/href="\/changelog"/g)).toHaveLength(2)
  })

  it("selects detailed content only for a superadmin on the server", async () => {
    const page = await readFile("src/app/changelog/page.tsx", "utf8")
    expect(page).toContain("requireAuthenticatedAppUser")
    expect(page).toContain("authResult.actor.user.isSuperuser")
    expect(page).toContain("buildPublicChangelog")
    expect(page).toContain("Detalle superadmin")
    expect(page).toContain("Información pública")
  })

  it("uses deliberately generic public copy", async () => {
    const publicChangelog = await readFile("src/lib/publicChangelog.ts", "utf8")
    expect(publicChangelog).toContain("Mejoras generales de la aplicación")
    expect(publicChangelog).toContain("Mantenimiento y preparación interna")
    expect(publicChangelog).not.toContain("SUPABASE_SERVICE_ROLE_KEY")
    expect(publicChangelog).not.toContain("league_avatar_url")
  })
})
