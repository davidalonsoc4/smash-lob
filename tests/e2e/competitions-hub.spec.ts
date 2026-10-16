import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-16T12:00:00Z"))
  await page.route("**/api/auth/session", route => route.fulfill({ json: { user: { name: "QA v1.1", email: "qa-v1-1@example.test", image: null }, expires: "2099-01-01T00:00:00Z" } }))
  await page.route("**/api/account/profile", route => route.fulfill({ json: { profile: { firstName: "QA", lastName: "v1.1", displayName: "QA v1.1", profileCompletedAt: "2026-08-03T00:00:00Z", availabilityCompletedAt: "2026-08-03T00:00:00Z", standardAvailabilityTimezone: "Europe/Madrid", standardAvailabilityWeeklySlots: {}, preferredSide: "reves", dominantHand: "right", isComplete: true, isSuperuser: false } } }))
  await page.route("**/api/onboarding/progress", route => route.fulfill({ json: { items: [], ok: true } }))
  await page.route("**/api/tournaments", route => route.fulfill({ json: { tournaments: [] } }))
  await page.addInitScript(() => {
    localStorage.setItem("smash-lob:competition-launch-popup-v2:qa-v1-1@example.test", "dismissed")
    localStorage.setItem("smash-lob-user-league-memberships", JSON.stringify([{ userId: "qa-v1-1@example.test", leagueId: "league-smash-lob", playerId: "davo", role: "admin" }]))
  })
})

test("last encounter is compact only in the hub and history stays detailed", async ({ page }, testInfo) => {
  const last = {
    id: "fixture-last", origin: "friendly", status: "finished", scheduledAt: "2026-10-15T18:00:00Z", resultRecordedAt: "2026-10-15T20:00:00Z",
    locationName: "Pista del último encuentro", sets: [{ a: 6, b: 2 }, { a: 6, b: 3 }], canManage: true, canDelete: true, leagueId: null, leagueName: null, seasonId: null, seasonName: null, round: null,
    participants: [{ team: 1, slot: 1, displayName: "Fixture propia", isCurrentUser: true }, { team: 2, slot: 1, displayName: "Fixture rival", isCurrentUser: false }],
  }
  await page.route("**/api/personal-matches?**", route => route.fulfill({ json: { items: [last], upcoming: [], hasMore: false, nextOffset: null } }))
  await page.goto("/leagues")
  await expect(page.getByText("Tu último encuentro", { exact: true })).toBeVisible()
  await expect(page.getByText(last.locationName)).toHaveCount(0)
  await expect(page.getByText(/15 oct 2026/)).toHaveCount(0)
  const header = page.locator("#personal-activity").locator("..")
  await expect(header.getByRole("link", { name: "Ver Mis partidos" })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath("hub-last-compact.png"), fullPage: true })
  await header.getByRole("link", { name: "Ver Mis partidos" }).click()
  await expect(page.getByText(last.locationName)).toBeVisible()
})

for (const theme of ["light", "dark"] as const) {
  test(`competitions hub keeps each view compact and preserves context (${theme})`, async ({ page, context }, testInfo) => {
    await context.addInitScript(mode => {
      localStorage.setItem("smash-lob-theme-mode", mode)
      localStorage.setItem("smash-lob-visual-style", "competition")
    }, theme)
    const upcoming = {
      id: "fixture-friendly", origin: "friendly", status: "scheduled", scheduledAt: "2099-10-17T18:00:00Z", resultRecordedAt: null,
      locationName: "Pista ficticia", sets: [], canManage: true, canDelete: true, leagueId: null, leagueName: null, seasonId: null, seasonName: null, round: null,
      participants: [{ team: 1, slot: 1, displayName: "Fixture propia", isCurrentUser: true }, { team: 2, slot: 1, displayName: "Fixture rival", isCurrentUser: false }],
    }
    await page.route("**/api/personal-matches?**", route => route.fulfill({ json: { items: [], upcoming: [upcoming], hasMore: false, nextOffset: null } }))
    await page.goto("/leagues")
    await expect(page.getByRole("heading", { name: "Mis Competiciones" })).toBeVisible()
    const navigation = page.getByRole("navigation", { name: "Mis Competiciones", exact: true })
    await expect(navigation.getByRole("button", { name: "Resumen" })).toHaveAttribute("aria-pressed", "true")
    await expect(navigation.getByRole("button", { name: "Resumen" })).toHaveCSS("color", "rgb(17, 17, 17)")
    await expect(page.getByText("Tu próximo partido", { exact: true })).toBeVisible()
    await expect(page.locator(".app-bottom-nav,.personal-matches-bottom-nav")).toHaveCount(0)
    expect(await page.getByRole("button", { name: /^Entrar en/ }).count()).toBeLessThanOrEqual(2)
    const accessibility = await new AxeBuilder({ page }).analyze()
    expect(accessibility.violations.filter(item => item.impact === "serious" || item.impact === "critical")).toEqual([])
    await page.screenshot({ path: testInfo.outputPath(`hub-summary-${theme}.png`), fullPage: true })
    await navigation.getByRole("button", { name: "Ligas", exact: true }).click()
    await expect(page.getByRole("link", { name: "Unirme con invitación" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Actividad personal" })).toHaveCount(0)
    await navigation.getByRole("button", { name: "Torneos", exact: true }).click()
    await expect(page.getByText("Todavía no tienes torneos.")).toBeVisible()
    await expect(page.getByRole("link", { name: "Crear", exact: true })).toHaveAttribute("href", "/tournaments/new")
    await expect(page.getByRole("button", { name: /^Entrar en/ })).toHaveCount(0)
    await navigation.getByRole("button", { name: "Amistosos", exact: true }).click()
    await expect(page.getByRole("link", { name: "+ Registrar encuentro amistoso" })).toHaveAttribute("href", "/personal-matches/new")
    await page.getByRole("link", { name: "Mis partidos", exact: true }).click()
    await expect(page.getByRole("navigation", { name: "Navegación de Mis partidos" })).toBeVisible()
    await page.getByRole("link", { name: "Mis Competiciones", exact: true }).click()
    await expect(navigation.getByRole("button", { name: "Resumen" })).toHaveAttribute("aria-pressed", "true")
    await expect(page.locator(".app-bottom-nav,.personal-matches-bottom-nav")).toHaveCount(0)
  })
}
