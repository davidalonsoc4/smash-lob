import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("changelog visibility", () => {
  it("keeps the changelog link for both player and spectator settings", async () => {
    const settings = await readFile("src/app/settings/page.tsx", "utf8")
    expect(settings.match(/href="\/changelog"/g)).toHaveLength(2)
  })

  it("authorizes detailed content for superusers and league admins on the server", async () => {
    const page = await readFile("src/app/changelog/page.tsx", "utf8")
    expect(page).toContain("requireAuthenticatedAppUser")
    expect(page).toContain("authResult.actor.user.isSuperuser")
    expect(page).toContain('.in("role", ["creator", "admin"])')
    expect(page).toContain("buildPublicChangelog")
    expect(page).toContain("canViewDetailed ? CHANGELOG_RELEASES : null")
  })

  it("shows admin detail only while the admin view preference is enabled", async () => {
    const content = await readFile(
      "src/components/changelog/ChangelogPageContent.tsx",
      "utf8",
    )
    expect(content).toContain("isAdminViewEnabled")
    expect(content).toContain("detailedReleases && isAdminViewEnabled")
    expect(content).toContain("Detalle administrador")
    expect(content).toContain("Información pública")
  })

  it("uses the singular version label for one-release series", async () => {
    const content = await readFile(
      "src/components/changelog/ChangelogContent.tsx",
      "utf8",
    )
    expect(content).toContain(
      'block.releases.length === 1 ? "versión" : "versiones"',
    )
  })

  it("groups generic public copy while preserving concrete novelty titles", async () => {
    const publicChangelog = await readFile("src/lib/publicChangelog.ts", "utf8")
    expect(publicChangelog).toContain("Mejoras generales de la aplicación")
    expect(publicChangelog).toContain("Mantenimiento y preparación interna")
    expect(publicChangelog).toContain('release.category === "new"')
    expect(publicChangelog).toContain(
      "title: publicCopy?.title ?? release.title",
    )
    expect(publicChangelog).toContain("getVersionBlock")
    expect(publicChangelog).toContain('"v1.10.0"')
    expect(publicChangelog).toContain("perfiles personalizados")
    expect(publicChangelog).not.toContain("SUPABASE_SERVICE_ROLE_KEY")
    expect(publicChangelog).not.toContain("league_avatar_url")
  })
})
