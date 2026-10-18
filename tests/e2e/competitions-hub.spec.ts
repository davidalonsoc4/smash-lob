import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"

async function swipe(page: Page, slider: Locator, direction: "left" | "right", short = false) {
  await slider.scrollIntoViewIfNeeded()
  const box = (await slider.boundingBox())!
  const cdp = await page.context().newCDPSession(page)
  const x = box.x + box.width * (direction === "left" ? 0.85 : 0.15), y = box.y + Math.min(70, box.height / 2)
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] })
  for (let step = 1; step <= 8; step++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + (direction === "left" ? -1 : 1) * box.width * (short ? 0.15 : 0.7) * step / 8, y }] })
    await page.waitForTimeout(25)
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
  try {
    await expect.poll(() => slider.evaluate(el => Math.abs(el.scrollLeft / el.clientWidth - Math.round(el.scrollLeft / el.clientWidth)))).toBeLessThan(0.01)
  } finally { await cdp.detach() }
}

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

test("mobile cards snap between next/last and league/mine, with centered uncut labels", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Physical touch gestures use the mobile project")
  const base = { origin: "league", leagueId: "league-smash-lob", leagueName: "Liga de prueba con un nombre especialmente largo para el móvil", seasonId: "season-2", seasonName: "Temporada", round: 4, canManage: false, canDelete: false, locationName: "Pista ficticia", sets: [], participants: [{ team: 1, slot: 1, displayName: "Fixture propia", isCurrentUser: true }, { team: 2, slot: 1, displayName: "Fixture rival", isCurrentUser: false }] }
  await page.route("**/api/personal-matches?**", route => route.fulfill({ json: { upcoming: [{ ...base, id: "fixture-next", status: "scheduled", scheduledAt: "2099-10-17T18:00:00Z", resultRecordedAt: null }], items: [{ ...base, id: "fixture-last", status: "finished", scheduledAt: "2026-10-15T10:00:00Z", resultRecordedAt: "2026-10-15T11:00:00Z", sets: [{ a: 6, b: 3 }] }], hasMore: false, nextOffset: null } }))
  await page.goto("/leagues")
  const activity = page.locator('section[aria-labelledby="personal-activity"]'), slider = activity.locator(".match-slides")
  await expect(activity.getByText("Tu próximo partido", { exact: true })).toBeVisible()
  for (const width of [320, 393]) {
    await page.setViewportSize({ width, height: 852 })
    const heading = activity.locator("[data-activity-heading]")
    expect(await heading.evaluate(el => {
      const title = el.querySelector("p")!.getBoundingClientRect(), button = el.querySelector("button")!.getBoundingClientRect(), box = el.getBoundingClientRect()
      return title.right <= button.left && Math.abs((title.top + title.bottom - button.top - button.bottom) / 2) < 1 && Math.abs(button.right - box.right) < 1
    })).toBe(true)
    const nav = page.getByRole("navigation", { name: "Navegación global" })
    await expect.poll(() => nav.getByRole("link").evaluateAll(links => links.every(link => {
      const text = link.querySelector("span span")!, range = document.createRange(); range.selectNodeContents(text)
      const rect = range.getBoundingClientRect(), box = link.getBoundingClientRect()
      return range.getClientRects().length === 1 && Math.abs((rect.left + rect.right - box.left - box.right) / 2) < 1.5 && rect.left >= box.left && rect.right <= box.right
    }))).toBe(true)
    const badge = slider.locator('[aria-hidden="false"] [data-personal-match-origin]')
    await expect(badge).toHaveText(base.leagueName)
    expect(await badge.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
    await swipe(page, slider, "left")
    await expect(activity.getByText("Tu último encuentro", { exact: true })).toBeVisible()
    await expect(slider.locator('[aria-hidden="false"]')).not.toContainText(base.locationName)
    await swipe(page, slider, "right")
    await expect(activity.getByText("Tu próximo partido", { exact: true })).toBeVisible()
    await swipe(page, slider, "left", true)
    if (await activity.getByRole("button", { name: "Próximo partido", exact: true }).count()) await activity.getByRole("button", { name: "Próximo partido", exact: true }).click()
    await activity.getByRole("button", { name: "Último partido", exact: true }).click()
    await expect.poll(() => slider.evaluate(el => el.scrollLeft / el.clientWidth)).toBe(1)
    await activity.getByRole("button", { name: "Próximo partido", exact: true }).click()
    await page.screenshot({ path: testInfo.outputPath(`activity-${width}.png`), scale: "css" })
  }
  await page.addInitScript(() => {
    localStorage.setItem("smash-lob-guided-onboarding-v1", JSON.stringify(Object.fromEntries([['app-introduction', 1], ['home', 7]].map(([tourKey, tourVersion]) => [tourKey, { tourKey, tourVersion, status: "completed", completedAt: "2026-08-06T00:00:00Z", skippedAt: null }]))))
    localStorage.setItem("smash-lob-matches", JSON.stringify([
    { id: "season-2-round-4-match-1", status: "scheduled", scheduledAt: "2099-10-17T12:00:00Z" },
    { id: "season-2-round-4-match-2", status: "scheduled", scheduledAt: "2099-10-16T12:00:00Z" },
    ]))
  })
  await page.getByRole("button", { name: /^Entrar en/ }).first().click()
  await expect(page).toHaveURL(/\/$/)
  await page.reload()
  const league = page.locator('[data-tour="home-next-match"]'), leagueSlider = league.locator(".match-slides")
  await expect(league.getByRole("button", { name: "Liga", exact: true })).toHaveAttribute("aria-pressed", "true")
  await swipe(page, leagueSlider, "left")
  await expect(league.getByRole("button", { name: "Mío", exact: true })).toHaveAttribute("aria-pressed", "true")
  await expect(league.getByRole("heading", { name: "Mi próximo partido" })).toBeVisible()
  await swipe(page, leagueSlider, "right")
  await expect(league.getByRole("button", { name: "Liga", exact: true })).toHaveAttribute("aria-pressed", "true")
  await page.screenshot({ path: testInfo.outputPath("league-swipe.png"), scale: "css" })
  const a11y = await new AxeBuilder({ page }).analyze()
  expect(a11y.violations.filter(item => item.impact === "serious" || item.impact === "critical")).toEqual([])
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
    const navigation = page.getByRole("navigation", { name: "Navegación global", exact: true })
    await expect(navigation).toHaveCount(1)
    await expect(navigation.getByRole("link")).toHaveText(["Competiciones", "Mis partidos", "Chats", "Mi perfil"])
    await expect(navigation.getByRole("link", { name: "Competiciones", exact: true })).toHaveAttribute("aria-current", "page")
    await expect(page.getByRole("button", { name: /^(Resumen|Ligas|Torneos|Amistosos)$/ })).toHaveCount(0)
    await expect(page.getByRole("heading", { name: "Amistosos", exact: true })).toHaveCount(0)
    await expect(page.getByText("Tu próximo partido", { exact: true })).toBeVisible()
    await expect(page.locator(".app-bottom-nav")).toHaveCount(0)
    expect(await page.getByRole("button", { name: /^Entrar en/ }).count()).toBeLessThanOrEqual(2)
    const accessibility = await new AxeBuilder({ page }).analyze()
    expect(accessibility.violations.filter(item => item.impact === "serious" || item.impact === "critical")).toEqual([])
    await page.screenshot({ path: testInfo.outputPath("hub-summary-" + theme + ".png"), fullPage: true, scale: "css" })
    const viewport = page.viewportSize()!
    await page.setViewportSize({ width: 320, height: 812 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    expect(await navigation.getByRole("link").evaluateAll(links => links.every(link => {
      const label = link.querySelector("span")!, range = document.createRange()
      range.selectNodeContents(label)
      const text = range.getBoundingClientRect(), box = link.getBoundingClientRect()
      return text.left >= box.left - 1 && text.right <= box.right + 1
    }))).toBe(true)
    await page.screenshot({ path: testInfo.outputPath("hub-320-" + theme + ".png"), scale: "css" })
    await page.setViewportSize(viewport)
    await page.getByRole("link", { name: "Ver todas", exact: true }).click()
    await expect(page).toHaveURL(/\/leagues\/all$/)
    await expect(page.getByRole("link", { name: "Unirme con invitación" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Actividad personal" })).toHaveCount(0)
    await expect(navigation).toHaveCount(1)
    await expect(page.locator(".app-bottom-nav")).toHaveCount(0)
    await page.reload()
    await expect(navigation.getByRole("link", { name: "Competiciones", exact: true })).toHaveAttribute("aria-current", "page")
    await page.getByRole("link", { name: "Volver", exact: true }).click()
    await expect(page).toHaveURL(/\/leagues$/)
    await page.getByRole("link", { name: "Ver todos", exact: true }).click()
    await expect(page).toHaveURL(/\/tournaments$/)
    await expect(page.getByText("Todavía no tienes torneos.")).toBeVisible()
    await expect(page.getByRole("link", { name: "Crear", exact: true })).toHaveAttribute("href", "/tournaments/new")
    await expect(page.getByRole("button", { name: /^Entrar en/ })).toHaveCount(0)
    await expect(navigation).toHaveCount(1)
    await expect(page.getByRole("navigation", { name: "Navegación del torneo" })).toHaveCount(0)
    await page.getByRole("link", { name: "Volver", exact: true }).click()
    await expect(page).toHaveURL(/\/leagues$/)
    await navigation.getByRole("link", { name: "Mis partidos", exact: true }).click()
    await expect(navigation.getByRole("link", { name: "Mis partidos", exact: true })).toHaveAttribute("aria-current", "page")
    await expect(page.getByRole("link", { name: "Crear nuevo encuentro", exact: true })).toBeVisible()
    await page.route("**/api/personal-matches/chats", route => route.fulfill({ json: { chats: [] } }))
    await navigation.getByRole("link", { name: "Chats", exact: true }).click()
    await expect(navigation.getByRole("link", { name: "Chats", exact: true })).toHaveAttribute("aria-current", "page")
    await navigation.getByRole("link", { name: "Mi perfil", exact: true }).click()
    await expect(navigation.getByRole("link", { name: "Mi perfil", exact: true })).toHaveAttribute("aria-current", "page")
    await navigation.getByRole("link", { name: "Competiciones", exact: true }).click()
    await expect(page.getByRole("heading", { name: "Actividad personal" })).toBeVisible()
    await expect(navigation).toHaveCount(1)
    await page.getByRole("link", { name: "Ver todas", exact: true }).click()
    await page.getByRole("button", { name: /^Entrar en/ }).first().click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator(".app-bottom-nav")).toHaveCount(1)
    await expect(navigation).toHaveCount(0)
    await page.getByRole("link", { name: "Mis Competiciones", exact: true }).click()
    await expect(navigation).toHaveCount(1)
  })
}

for (const spectator of [false, true]) {
  test(`global competition routes remain available ${spectator ? "to spectators" : "without leagues"}`, async ({ page }) => {
    await page.route("**/api/auth/session", route => route.fulfill({ json: { user: { name: "QA Empty", email: "qa-empty@example.test", image: null }, expires: "2099-01-01T00:00:00Z" } }))
    await page.route("**/api/personal-matches?**", route => route.fulfill({ json: { items: [], upcoming: [], hasMore: false, nextOffset: null } }))
    await page.addInitScript(isSpectator => {
      localStorage.setItem("smash-lob-user-league-memberships", "[]")
      localStorage.setItem("smash-lob-spectator-leagues:qa-empty@example.test", JSON.stringify(isSpectator ? ["league-smash-lob"] : []))
      localStorage.setItem("smash-lob:competition-launch-popup-v2:qa-empty@example.test", "dismissed")
    }, spectator)
    for (const path of ["/leagues", "/leagues/all", "/tournaments"]) {
      await page.goto(path)
      await expect(page.getByRole("navigation", { name: "Navegación global", exact: true })).toHaveCount(1)
      await expect(page).toHaveURL(new RegExp(path + "$"))
      await expect(page.locator(".app-bottom-nav")).toHaveCount(0)
    }
  })
}
