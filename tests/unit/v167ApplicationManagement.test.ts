import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"
describe("v1.6.7 application management", () => {
  it("turns application-admin into a superuser-only management hub", async () => {
    const [settings, hub, users, locations] = await Promise.all([readFile("src/app/settings/page.tsx", "utf8"), readFile("src/app/application-admin/page.tsx", "utf8"), readFile("src/app/application-admin/users/page.tsx", "utf8"), readFile("src/app/application-admin/locations/page.tsx", "utf8")])
    expect(settings).toContain('title={tx("Gestión de la app")}'); expect(hub).toContain("requireAuthenticatedAppUser"); expect(hub).toContain("isSuperuser"); expect(hub).toContain('href: "/application-admin/users"'); expect(hub).toContain('href: "/application-admin/locations"'); expect(users).toContain('mode="users"'); expect(locations).toContain('mode="locations"')
  })
  it("reuses the existing global user administration instead of duplicating it", async () => {
    const client = await readFile("src/components/application-admin/ApplicationAdminManagement.tsx", "utf8")
    expect(client).toContain("fetchApplicationUsers"); expect(client).toContain("/api/application-admin/users"); expect(client).toContain("Gestión de usuarios"); expect(client).toContain("ApplicationUsersView")
  })
  it("protects location administration while allowing catalog deletion without destroying match history", async () => {
    const [api, service, client] = await Promise.all([readFile("src/app/api/application-admin/locations/route.ts", "utf8"), readFile("src/lib/serverGlobalLocations.ts", "utf8"), readFile("src/components/application-admin/ApplicationAdminManagement.tsx", "utf8")])
    expect(api).toContain("isSuperuser"); expect(api).toContain("forbidden"); expect(api).toContain("validateUuid"); expect(api).not.toContain("global_location_in_use"); expect(service).toContain("listManagedGlobalLocations"); expect(service).toContain("deleteGlobalLocation"); expect(service).toContain("leagueCount"); expect(service).toContain("personalMatchCount"); expect(service).toContain("Match snapshots are"); expect(client).toContain('mode === "locations"'); expect(client).toContain("El histórico de partidos se conserva")
  })
  it("keeps the release surfaces aligned with the current app version", async () => {
    const [pkg, lock, version, sw, changelog] = await Promise.all([readFile("package.json", "utf8"), readFile("package-lock.json", "utf8"), readFile("src/lib/appVersion.ts", "utf8"), readFile("public/sw.js", "utf8"), readFile("src/lib/changelog.ts", "utf8")])
    const currentVersion = JSON.parse(pkg).version as string
    expect(pkg).toContain(`"version": "${currentVersion}"`); expect(pkg).toContain(` ${currentVersion} pre`); expect(pkg).toContain(` ${currentVersion} prod`); expect(lock).toContain(`"version": "${currentVersion}"`); expect(version).toContain(currentVersion); expect(sw).toContain(`smash-lob-v${currentVersion}`); expect(changelog).toContain(`version: "v${currentVersion}"`)
  })
})
