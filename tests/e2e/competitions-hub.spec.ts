import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import type { Locator, Page } from "@playwright/test"
import { leagues as fixtureLeagues, seasons as fixtureSeasons, playerProfiles as fixtureProfiles, seasonPlayers as fixturePlayers, seasonRoundSettings as fixtureSettings, allMatches as fixtureMatches } from "../../src/data/fakeData"

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
    await expect.poll(() => slider.evaluate(el => { const step = el.clientWidth + (parseFloat(getComputedStyle(el).columnGap) || 0); return Math.abs(el.scrollLeft / step - Math.round(el.scrollLeft / step)) })).toBeLessThan(0.01)
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

test("share menu offers three branded QR destinations without changing league access", async ({ page }, testInfo) => {
  await page.route("**/api/leagues/*/spectator-invite", route => route.fulfill({ json: { code: "READ", url: "http://127.0.0.1:3100/spectate/READ" } }))
  await page.addInitScript(() => localStorage.setItem("smash-lob-guided-onboarding-v1", JSON.stringify(Object.fromEntries([["app-introduction", 1], ["home", 7]].map(([tourKey, tourVersion]) => [tourKey, { tourKey, tourVersion, status: "completed", completedAt: "2026-08-06T00:00:00Z", skippedAt: null }])))))
  await page.goto("/leagues")
  await page.getByRole("button", { name: "Compartir invitación", exact: true }).click()
  await expect(page.getByRole("dialog").getByRole("img")).toBeVisible()
  await expect(page.getByRole("dialog").getByRole("group")).toHaveCount(0)
  await page.getByRole("dialog").getByRole("button", { name: "Cerrar", exact: true }).click()
  await page.getByRole("button", { name: /^Entrar en/ }).first().click()
  await expect(page).toHaveURL(/\/$/)
  for (const width of [320, 393]) {
    await page.setViewportSize({ width, height: 852 })
    const back = page.getByRole("link", { name: "Competiciones", exact: true })
    await expect.poll(() => back.evaluate(el => { const text = el.querySelector("span span")!, range = document.createRange(); range.selectNodeContents(text); const rect = range.getBoundingClientRect(), link = el.getBoundingClientRect(), controls = document.querySelector("[data-floating-top-toolbar]")!.getBoundingClientRect(); return range.getClientRects().length === 1 && rect.right <= link.right + 0.5 && link.right <= controls.left })).toBe(true)
  }
  await page.getByRole("button", { name: "Compartir invitación", exact: true }).click()
  await page.setViewportSize({ width: 320, height: 852 })
  let modal = page.getByRole("dialog")
  await expect(modal.getByRole("img")).toHaveCount(0)
  await expect(modal.getByRole("button", { name: "Descargar", exact: true })).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath("share-choices-320.png"), scale: "css" })
  for (const [type, label] of [["spectator", "Invitar a seguir la liga"], ["player", "Invitar a jugar en la liga"], ["app", "Compartir Smash & Lob"]]) {
    await modal.getByRole("button", { name: label, exact: true }).click()
    await expect(modal.getByRole("group", { name: "Qué quieres compartir" })).toHaveCount(0)
    const image = modal.getByRole("img")
    await expect(image).toBeVisible()
    expect(decodeURIComponent((await image.getAttribute("src"))!)).toContain('aria-label="Smash &amp; Lob"')
    await expect(modal.getByRole("button", { name: "Compartir", exact: true })).toBeEnabled()
    const a11y = await new AxeBuilder({ page }).include('[role="dialog"]').analyze()
    expect(a11y.violations.filter(item => item.impact === "serious" || item.impact === "critical")).toEqual([])
    await page.screenshot({ path: testInfo.outputPath(`share-${type}.png`), scale: "css" })
    await modal.getByRole("button", { name: "Cerrar", exact: true }).click()
    await page.getByRole("button", { name: "Compartir invitación", exact: true }).click()
    await expect(modal.getByRole("group", { name: "Qué quieres compartir" })).toBeVisible()
    await expect(modal.getByRole("img")).toHaveCount(0)
  }
  await modal.getByRole("button", { name: "Cerrar", exact: true }).click()
  await page.addInitScript(() => localStorage.setItem("smash-lob-user-league-memberships", JSON.stringify([{ userId: "qa-v1-1@example.test", leagueId: "league-smash-lob", playerId: "davo", role: "player" }])))
  await page.reload()
  await page.getByRole("button", { name: "Compartir invitación", exact: true }).click()
  modal = page.getByRole("dialog")
  await expect(modal.getByRole("button", { name: "Invitar a jugar en la liga" })).toHaveCount(0)
  await expect(modal.getByRole("button", { name: "Invitar a seguir la liga", exact: true })).toBeVisible()
})

for (const theme of ["light", "dark"]) {
  test(`league badges follow their own accent and stay readable (${theme})`, async ({ page }, testInfo) => {
    await page.addInitScript(({ leagues, mode }) => {
      localStorage.setItem("smash-lob-theme-mode", mode)
      localStorage.setItem("smash-lob-visual-style", "competition")
      localStorage.setItem("smash-lob-leagues", JSON.stringify(leagues.map((league, i) => ({ ...league, accentColor: i ? "#FFFFFF" : "#000011" }))))
    }, { leagues: fixtureLeagues, mode: theme })
    const match = { id: "fixture-colour", origin: "league", leagueId: "league-smash-lob", leagueName: "Liga oscura", seasonId: "season-2", seasonName: "Temporada", round: 4, canManage: false, canDelete: false, locationName: "Pista", sets: [], participants: [{ team: 1, slot: 1, displayName: "Fixture propia", isCurrentUser: true }, { team: 2, slot: 1, displayName: "Fixture rival", isCurrentUser: false }], status: "scheduled", scheduledAt: "2099-10-17T18:00:00Z", resultRecordedAt: null }
    await page.route("**/api/personal-matches?**", route => route.fulfill({ json: { items: [], upcoming: [match], hasMore: false, nextOffset: null } }))
    for (const path of ["/leagues", "/personal-matches"]) {
      await page.goto(path)
      const badge = page.locator('[data-personal-match-origin="league"]').first()
      await expect(badge).toHaveAttribute("data-league-accent", "#000011")
      expect(await badge.evaluate(el => getComputedStyle(el).getPropertyValue("--personal-league-accent"))).toBe("#000011")
      const a11y = await new AxeBuilder({ page }).analyze()
      expect(a11y.violations.filter(item => item.impact === "serious" || item.impact === "critical")).toEqual([])
    }
    await page.screenshot({ path: testInfo.outputPath(`league-colour-${theme}.png`), scale: "css" })
  })
}

test("mobile cards snap between next/last and league/mine, with centered uncut labels", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Physical touch gestures use the mobile project")
  const base = { origin: "league", leagueId: "league-smash-lob", leagueName: "Liga de prueba con un nombre especialmente largo para el móvil", seasonId: "season-2", seasonName: "Temporada", round: 4, canManage: false, canDelete: false, locationName: "Pista ficticia", sets: [], participants: [{ team: 1, slot: 1, displayName: "Fixture propia", isCurrentUser: true }, { team: 2, slot: 1, displayName: "Fixture rival", isCurrentUser: false }] }
  await page.route("**/api/personal-matches?**", route => route.fulfill({ json: { upcoming: [{ ...base, id: "fixture-next", status: "scheduled", scheduledAt: "2099-10-17T18:00:00Z", resultRecordedAt: null }], items: [{ ...base, id: "fixture-last", status: "finished", scheduledAt: "2026-10-15T10:00:00Z", resultRecordedAt: "2026-10-15T11:00:00Z", sets: [{ a: 6, b: 3 }] }], hasMore: false, nextOffset: null } }))
  await page.goto("/leagues")
  base.participants[1].displayName = "Andoni Fernández"
  await page.reload()
  const activity = page.locator('section[aria-labelledby="personal-activity"]'), slider = activity.locator(".match-slides")
  await expect(activity.getByText("Tu próximo partido", { exact: true })).toBeVisible()
  for (const width of [320, 393]) {
    await page.setViewportSize({ width, height: 852 })
    const playerNames = slider.locator('[aria-hidden="false"] p').filter({ hasText: /Fixture propia|Andoni Fernández/ })
    await expect.poll(() => playerNames.evaluateAll(names => names.every(name => {
      const text = name.querySelector("span span") as HTMLElement | null
      if (!text) return false
      const css = getComputedStyle(text)
      return parseFloat(css.fontSize) >= 10 && css.whiteSpace === "nowrap"
    }))).toBe(true)
    if (width === 393) await expect.poll(() => playerNames.evaluateAll(names => names.every(name => {
      const text = name.querySelector("span span")!, range = document.createRange()
      range.selectNodeContents(text)
      return range.getBoundingClientRect().width <= text.getBoundingClientRect().width + .5
    }))).toBe(true)
    const heading = activity.locator("[data-activity-heading]")
    expect(await heading.evaluate(el => {
      const title = el.querySelector("h2")!.getBoundingClientRect(), context = el.querySelector("p")!.getBoundingClientRect()
      return title.right <= context.left && Math.abs((title.top + title.bottom - context.top - context.bottom) / 2) < 1
    })).toBe(true)
    expect(await slider.evaluate(el => { const panels = [...el.children].map(child => child.getBoundingClientRect()); return panels[1].left - panels[0].right })).toBeGreaterThanOrEqual(11.5)
    const nav = page.getByRole("navigation", { name: "Navegación global" })
    expect(await nav.getByRole("link").evaluateAll(links => { const widths = links.map(link => link.getBoundingClientRect().width); return Math.max(...widths) - Math.min(...widths) < 1 })).toBe(true)
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
    await swipe(page, slider, "left")
    await expect.poll(() => slider.evaluate(el => el.scrollLeft / (el.clientWidth + (parseFloat(getComputedStyle(el).columnGap) || 0)))).toBeCloseTo(1, 2)
    await swipe(page, slider, "right")
    await page.screenshot({ path: testInfo.outputPath(`activity-${width}.png`), scale: "css" })
  }
  const navGeometry = (el: HTMLElement) => {
    const grid = el.firstElementChild!, item = el.querySelector("a")!, icon = item.querySelector("svg")!
    return [el.getBoundingClientRect().height, getComputedStyle(grid).paddingTop, getComputedStyle(grid).paddingBottom, getComputedStyle(grid).columnGap, getComputedStyle(item).fontSize, getComputedStyle(item).borderRadius, item.getBoundingClientRect().height, icon.getBoundingClientRect().width, icon.getBoundingClientRect().height]
  }
  const globalGeometry = await page.getByRole("navigation", { name: "Navegación global" }).evaluate(navGeometry)
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
  expect(await page.locator('nav[data-tour="bottom-navigation"]').evaluate(navGeometry)).toEqual(globalGeometry)
  const league = page.locator('[data-tour="home-next-match"]'), leagueSlider = league.locator(".match-slides")
  await expect(league.getByRole("button", { name: "Mi próximo partido", exact: true })).toHaveAttribute("aria-pressed", "true")
  await swipe(page, leagueSlider, "left")
  await expect(league.getByRole("button", { name: "Próximo partido", exact: true })).toHaveAttribute("aria-pressed", "true")
  await expect(league.getByRole("heading", { name: "Próximo partido", exact: true })).toBeVisible()
  await swipe(page, leagueSlider, "right")
  await expect(league.getByRole("button", { name: "Mi próximo partido", exact: true })).toHaveAttribute("aria-pressed", "true")
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
  const activity = page.getByRole("region", { name: "Actividad personal", exact: true })
  // League round windows can now supply the first card without a booked date.
  await expect(activity.locator('[data-personal-match-origin="friendly"]')).toHaveCount(1)
  const slider = activity.locator(".match-slides")
  if (await slider.count()) await slider.evaluate(el => el.scrollTo({ left: el.scrollWidth, behavior: "instant" }))
  await expect(page.getByText("Tu último encuentro", { exact: true })).toBeVisible()
  const origin = page.locator('[data-personal-match-origin="friendly"]').first()
  await expect.poll(() => origin.evaluate(el => {
    const range = document.createRange(); range.selectNodeContents(el.querySelector("span span")!)
    return el.getBoundingClientRect().width - range.getBoundingClientRect().width
  })).toBeLessThanOrEqual(20)
  await expect(page.getByText(last.locationName)).toHaveCount(0)
  await expect(page.getByText(/15 oct 2026/)).toHaveCount(0)
  const header = page.locator("#personal-activity").locator("..")
  await expect(header.getByRole("link", { name: "Ver Mis partidos" })).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath("hub-last-compact.png"), fullPage: true })
  await page.getByRole("navigation", { name: "Navegación global", exact: true }).getByRole("link", { name: "Mis partidos", exact: true }).click()
  await expect(page.getByText(last.locationName)).toBeVisible()
})

for (const theme of ["light", "dark"] as const) {
  for (const visualStyle of ["competition", "classic"] as const) {
  test(`competitions hub keeps each view compact and preserves context (${theme}, ${visualStyle})`, async ({ page, context }, testInfo) => {
    await context.addInitScript(({ mode, style }) => {
      localStorage.setItem("smash-lob-theme-mode", mode)
      localStorage.setItem("smash-lob-visual-style", style)
    }, { mode: theme, style: visualStyle })
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
    await expect.poll(() => navigation.getByRole("link").evaluateAll(links => links.every(link => {
      const label = link.querySelector("span")!, range = document.createRange()
      range.selectNodeContents(label)
      const text = range.getBoundingClientRect(), box = link.getBoundingClientRect()
      return text.left >= box.left - 1 && text.right <= box.right + 1
    }))).toBe(true)
    await page.screenshot({ path: testInfo.outputPath("hub-320-" + theme + ".png"), scale: "css" })
    await page.setViewportSize(viewport)
    await page.getByRole("link", { name: "Ver todas", exact: true }).click()
    await expect(page).toHaveURL(/\/leagues\/all$/)
    await expect(page.locator("html")).toHaveAttribute("data-visual-style", visualStyle)
    await expect.poll(() => page.locator("html").evaluate(el => el.classList.contains("dark"))).toBe(theme === "dark")
    await expect(page.getByRole("link", { name: "Unirme con invitación" })).toBeVisible()
    const leagueCards = page.getByRole("button", { name: /^Entrar en/ })
    expect(await leagueCards.evaluateAll(cards => cards.every(card => card.getBoundingClientRect().height >= 128 && !card.className.includes("ring-2")))).toBe(true)
    await expect(leagueCards.first()).toContainText(/Jugadores/)
    await expect(leagueCards.first()).toContainText(/Partidos/)
    await expect(leagueCards.first()).toContainText(/Líder/)
    await expect(leagueCards).not.toContainText("Toca para entrar")
    await expect(leagueCards).not.toContainText("Actual")
    await expect(leagueCards.first()).toContainText("Individual de Smash & Lob")
    await expect(page.getByRole("heading", { name: /^Mis ligas/ })).toHaveCount(1)
    for (const width of [320, 393]) {
      await page.setViewportSize({ width, height: 852 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
      expect(await leagueCards.first().locator('[class*="status-tone-"]').evaluate(el => {
        const css = getComputedStyle(el)
        return css.textTransform === "none" && css.borderWidth === "0px" && css.fontWeight === "600"
      })).toBe(true)
    }
    const listAccessibility = await new AxeBuilder({ page }).analyze()
    expect(listAccessibility.violations.filter(item => item.impact === "serious" || item.impact === "critical")).toEqual([])
    await page.screenshot({ path: testInfo.outputPath("league-list-" + theme + ".png"), fullPage: true, scale: "css" })
    await expect(page.getByRole("heading", { name: "Actividad personal" })).toHaveCount(0)
    await expect(navigation).toHaveCount(1)
    await expect(page.locator(".app-bottom-nav")).toHaveCount(0)
    await page.reload()
    await expect(navigation.getByRole("link", { name: "Competiciones", exact: true })).toHaveAttribute("aria-current", "page")
    await page.getByRole("link", { name: "Volver", exact: true }).click()
    await expect(page).toHaveURL(/\/leagues$/)
    await expect(page.getByRole("heading", { name: "Mis torneos", exact: true })).toHaveCount(0)
    await expect(navigation).toHaveCount(1)
    await expect(page.getByRole("navigation", { name: "Navegación del torneo" })).toHaveCount(0)
    await navigation.getByRole("link", { name: "Mis partidos", exact: true }).click()
    await expect(navigation.getByRole("link", { name: "Mis partidos", exact: true })).toHaveAttribute("aria-current", "page")
    await expect(page.getByRole("link", { name: "Crear nuevo encuentro", exact: true })).toBeVisible()
    await page.route("**/api/personal-matches/chats", route => route.fulfill({ json: { chats: [] } }))
    await navigation.getByRole("link", { name: "Chats", exact: true }).click()
    await expect(navigation.getByRole("link", { name: "Chats", exact: true })).toHaveAttribute("aria-current", "page")
    await navigation.getByRole("link", { name: "Mi perfil", exact: true }).click()
    await expect(navigation.getByRole("link", { name: "Mi perfil", exact: true })).toHaveAttribute("aria-current", "page")
    await expect(page.locator('[data-profile-identity="global"]')).toBeVisible()
    await expect(page.locator("[data-personal-global-filters]")).toBeVisible()
    await expect(page.locator("[data-personal-profile-sections]")).toBeVisible()
    await navigation.getByRole("link", { name: "Competiciones", exact: true }).click()
    await expect(page.getByRole("heading", { name: "Actividad personal" })).toBeVisible()
    await expect(navigation).toHaveCount(1)
    await navigation.getByRole("link", { name: "Mis partidos", exact: true }).click()
    await page.getByRole("link", { name: "Volver", exact: true }).click()
    await expect(page).toHaveURL(/\/leagues$/)
    await page.getByRole("link", { name: "Ver todas", exact: true }).click()
    await page.getByRole("button", { name: /^Entrar en/ }).first().click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator(".app-bottom-nav")).toHaveCount(1)
    await expect(navigation).toHaveCount(0)
    await page.getByRole("link", { name: "Competiciones", exact: true }).click()
    await expect(navigation).toHaveCount(1)

    // Exercise the visual hierarchy with real content in every section and a
    // non-default accent; single-league fixtures cannot expose crowded layouts.
    const expandedLeagues = [...fixtureLeagues, { ...fixtureLeagues[0], id: "league-archive", name: "Liga histórica", activeSeasonId: "season-archive" }]
      .map((league, index) => ({ ...league, accentColor: index === 1 ? "#477BD1" : "#8B5FC0", logoUrl: "http://127.0.0.1:3100/fixture-crest.svg" }))
    await page.route("**/fixture-crest.svg", route => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#477BD1" d="M8 6h48v30L32 59 8 36z"/><path fill="white" d="M20 20h24v6H26v6h18v6H20z"/></svg>' }))
    await page.route("**/api/access**", route => route.fulfill({ json: {
      isSuperuser: false, canCreateLeagues: true, leagues: expandedLeagues,
      memberships: expandedLeagues.map(league => ({ userId: "qa-v1-1@example.test", leagueId: league.id, playerId: "davo", role: "admin" })), spectatorLeagueIds: [], matches: fixtureMatches.filter(match => match.leagueId !== "league-work"),
      seasonSnapshot: {
        seasons: [...fixtureSeasons.map(season => season.id === "season-work-1" ? { ...season, status: "upcoming" } : season), { id: "season-archive", leagueId: "league-archive", name: "Temporada anterior", status: "finished", totalRounds: 7, completedRounds: 7 }],
        playerProfiles: fixtureProfiles, seasonPlayers: fixturePlayers,
        seasonSettings: fixtureSettings.map(settings => settings.seasonId === "season-work-1" ? { ...settings, scheduledStartAt: "2026-10-20T08:00:00Z", seasonStartsAt: "2026-10-20" } : settings),
        activeSeasonIds: Object.fromEntries(expandedLeagues.map(league => [league.id, league.activeSeasonId])),
      },
    } }))
    await page.route("**/api/tournaments", route => route.fulfill({ json: { tournaments: [
      { id: "tournament-running", name: "Americana del club", startsAt: "2026-10-16T12:00:00Z", status: "in_progress" },
      { id: "tournament-upcoming", name: "Torneo de otoño por parejas", startsAt: "2026-10-20T09:00:00Z", status: "draft" },
    ] } }))
    await page.addInitScript(() => {
      localStorage.setItem("smash-lob-competition-accent", "ice")
      localStorage.setItem("smash-lob-palette", "indigo")
    })
    await page.reload()
    await expect(page.getByRole("link", { name: /Americana del club/ })).toBeVisible()
    await expect(page.getByRole("link", { name: /Torneo de otoño/ })).toBeVisible()
    await expect.poll(() => page.locator('img[src$="fixture-crest.svg"]').evaluateAll(images => images.length >= 2 && images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true)
    for (const width of [320, 393]) {
      await page.setViewportSize({ width, height: 852 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    }
    const filledAccessibility = await new AxeBuilder({ page }).analyze()
    expect(filledAccessibility.violations.filter(item => item.impact === "serious" || item.impact === "critical")).toEqual([])
    await page.screenshot({ path: testInfo.outputPath("hub-filled-custom-accent.png"), fullPage: true, scale: "css" })
    await page.getByRole("link", { name: "Ver todas", exact: true }).click()
    await expect(page.getByText("Finalizadas", { exact: false })).toBeVisible()
    await page.locator("details > summary").click()
    await expect(page.getByRole("button", { name: "Entrar en Liga histórica", exact: true })).toBeVisible()
    const filledListAccessibility = await new AxeBuilder({ page }).analyze()
    expect(filledListAccessibility.violations.filter(item => item.impact === "serious" || item.impact === "critical")).toEqual([])
    await page.screenshot({ path: testInfo.outputPath("leagues-filled-custom-accent.png"), fullPage: true, scale: "css" })
  })
  }
}

for (const theme of ["light", "dark"] as const) {
  test(`Competition headers remain vertically balanced across screens (${theme})`, async ({ page }, testInfo) => {
    test.setTimeout(120_000)
    const viewport = page.viewportSize()!
    await page.addInitScript(mode => {
      localStorage.setItem("smash-lob-theme-mode", mode)
      localStorage.setItem("smash-lob-visual-style", "competition")
      localStorage.setItem("smash-lob-guided-onboarding-v1", JSON.stringify(Object.fromEntries([
        ["app-introduction", 1], ["home", 7], ["matches", 2], ["ranking", 2], ["statistics", 2], ["settings", 4],
      ].map(([tourKey, tourVersion]) => [tourKey, { tourKey, tourVersion, status: "completed", completedAt: "2026-08-06T00:00:00Z", skippedAt: null }]))))
    }, theme)
    await page.route("**/api/personal-matches?**", route => route.fulfill({ json: { items: [], upcoming: [], hasMore: false, nextOffset: null } }))
    await page.route("**/api/personal-matches/chats", route => route.fulfill({ json: { chats: [] } }))
    await page.route("**/api/tournaments/sources", route => route.fulfill({ json: { sources: [] } }))
    await page.route("**/api/tournaments/people", route => route.fulfill({ json: { people: [] } }))
    await page.route("**/api/locations", route => route.fulfill({ json: { locations: [] } }))
    await page.route("**/api/notifications/read-state", route => route.fulfill({ json: { items: [] } }))
    for (const path of ["/leagues", "/leagues/all", "/tournaments", "/tournaments/new", "/personal-matches", "/personal-matches/profile", "/personal-matches/chats", "/", "/matches", "/ranking", "/statistics", "/profile", "/match/season-2-round-5-match-1", "/settings", "/settings/appearance", "/notifications", "/help"]) {
      await test.step(path, async () => {
        await page.goto(path)
        const header = page.locator(".app-page-header").first()
        await expect(header).toBeVisible()
        await expect(page.locator("html")).toHaveAttribute("data-visual-style", "competition")
        await expect.poll(() => page.locator("html").evaluate(el => el.classList.contains("dark"))).toBe(theme === "dark")
        const padding = await header.evaluate(el => { const css = getComputedStyle(el); return [parseFloat(css.paddingTop), parseFloat(css.paddingBottom)] })
        expect(Math.abs(padding[0] - padding[1]), `${path}: symmetric title panel`).toBeLessThanOrEqual(.1)
        if (path === "/leagues" || path === "/leagues/all") {
          for (const width of [320, 393]) {
            await page.setViewportSize({ width, height: 852 })
            const offset = await header.evaluate(el => { const box = el.getBoundingClientRect(), title = el.querySelector("h1")!.getBoundingClientRect(); return Math.abs((box.top + box.bottom) / 2 - (title.top + title.bottom) / 2) })
            expect(offset).toBeLessThanOrEqual(.5)
          }
          await page.screenshot({ path: testInfo.outputPath(`centered-header-${path === "/leagues" ? "hub" : "leagues"}-${theme}.png`), scale: "css" })
          await page.setViewportSize(viewport)
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
      })
    }
    await page.goto("/match/season-2-round-5-match-1/chat")
    const chatHeader = page.locator(".app-match-chat-header")
    await expect(chatHeader).toBeVisible()
    await page.evaluate(() => document.documentElement.style.setProperty("--app-safe-top", "24px"))
    expect(await chatHeader.evaluate(el => parseFloat(getComputedStyle(el).paddingTop))).toBeGreaterThanOrEqual(32)
  })
}

for (const canCreate of [true, false]) {
  test(`scheduled league does not control global league creation (creator=${canCreate})`, async ({ page }) => {
    const id = "40000000-0000-4000-8000-000000000002"
    let created: typeof fixtureLeagues[number] | null = null
    const memberships = [{ userId: "qa-v1-1@example.test", leagueId: "league-smash-lob", role: "player", playerId: "davo" }]
    const snapshot = {
      seasons: fixtureSeasons.map(season => season.id === "season-2" ? { ...season, status: "upcoming", completedRounds: 0 } : season),
      playerProfiles: fixtureProfiles, seasonPlayers: fixturePlayers,
      seasonSettings: fixtureSettings.map(settings => settings.seasonId === "season-2" ? { ...settings, scheduledStartAt: "2026-10-20T08:00:00Z", seasonStartsAt: "2026-10-20", rosterCompletedAt: "2026-10-15T08:00:00Z" } : settings),
      activeSeasonIds: { "league-smash-lob": "season-2" },
    }
    await page.route("**/api/access**", route => route.fulfill({ json: { isSuperuser: false, canCreateLeagues: canCreate, leagues: [...fixtureLeagues, ...(created ? [created] : [])], memberships: [...memberships, ...(created ? [{ userId: "qa-v1-1@example.test", leagueId: id, role: "creator", playerId: "" }] : [])], spectatorLeagueIds: [], matches: fixtureMatches, seasonSnapshot: snapshot } }))
    await page.route("**/api/leagues", async route => {
      expect(canCreate).toBe(true)
      const body = route.request().postDataJSON()
      expect(body.leagueName).toBe("Nueva liga independiente")
      created = { id, name: body.leagueName, description: body.leagueDescription, slug: body.leagueSlug, modality: body.modality, inviteCode: body.inviteCode, activeSeasonId: "", joinMode: "closed", locations: [] }
      await route.fulfill({ json: { league: created, membership: { userId: "qa-v1-1@example.test", leagueId: id, role: "creator", playerId: "" }, seasonSnapshot: { seasons: [], playerProfiles: [], seasonPlayers: [], seasonSettings: [], activeSeasonIds: { [id]: "" } } } })
    })
    await page.addInitScript(() => {
      localStorage.setItem("smash-lob-active-league", "league-smash-lob")
      localStorage.setItem("smash-lob-guided-onboarding-v1", JSON.stringify(Object.fromEntries([["app-introduction", 1], ["home", 7]].map(([tourKey, tourVersion]) => [tourKey, { tourKey, tourVersion, status: "completed", completedAt: "2026-08-06T00:00:00Z", skippedAt: null }]))))
    })
    await page.goto("/")
    await expect(page.locator('[data-preseason-phase="locked"]')).toBeVisible()
    await page.goto("/ranking")
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('[data-preseason-phase="locked"]')).toBeVisible()
    await page.getByRole("link", { name: "Competiciones", exact: true }).click()
    await page.getByRole("link", { name: "Ver todas", exact: true }).click()
    if (!canCreate) {
      await expect(page.getByRole("link", { name: "Crear nueva liga", exact: true })).toHaveCount(0)
      await page.goto("/league/new")
      await expect(page.getByText("No tienes permisos para crear ligas", { exact: true })).toBeVisible()
      await expect(page).toHaveURL(/\/league\/new$/)
      await expect(page.getByRole("button", { name: "Siguiente paso", exact: true })).toHaveCount(0)
      return
    }
    await page.getByRole("link", { name: "Crear nueva liga", exact: true }).click()
    await expect(page.getByRole("combobox", { name: "Modalidad de liga", exact: true })).toBeVisible()
    await expect(page).toHaveURL(/\/league\/new$/)
    await expect(page.locator("[data-scheduled-season-home-lock]")).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole("combobox", { name: "Modalidad de liga", exact: true })).toBeVisible()
    await page.locator("form input").first().fill("Nueva liga independiente")
    await page.getByRole("button", { name: "Siguiente paso", exact: true }).click()
    await expect(page).toHaveURL(/\/league\/new$/)
    await expect(page.locator("[data-season-creation-step]")).toBeVisible()
    expect(created).toBeNull()
    await expect.poll(() => page.evaluate(() => localStorage.getItem("smash-lob-active-league"))).toBe("league-smash-lob")
    await page.getByRole("button", { name: "Competiciones", exact: true }).click()
    await expect(page).toHaveURL(/\/leagues$/)
  })
}

for (const theme of ["light", "dark"] as const) for (const visualStyle of ["classic", "competition"] as const) {
  test(`calendar locator centers on title and season and still scrolls (${theme}, ${visualStyle})`, async ({ page }, testInfo) => {
    await page.clock.setFixedTime(new Date("2026-08-01T12:00:00Z"))
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.addInitScript(({ theme, visualStyle }) => {
      localStorage.setItem("smash-lob-theme-mode", theme)
      localStorage.setItem("smash-lob-visual-style", visualStyle)
      localStorage.setItem("smash-lob-guided-onboarding-v1", JSON.stringify(Object.fromEntries([["app-introduction", 1], ["matches", 2]].map(([tourKey, tourVersion]) => [tourKey, { tourKey, tourVersion, status: "completed", completedAt: "2026-08-06T00:00:00Z", skippedAt: null }]))))
    }, { theme, visualStyle })
    await page.goto("/matches")
    const locator = page.getByRole("button", { name: "Ir a jornada en curso", exact: true })
    await expect(locator).toBeVisible()
    await expect(page.locator("html")).toHaveAttribute("data-visual-style", visualStyle)
    await expect.poll(() => page.locator("html").evaluate(el => el.classList.contains("dark"))).toBe(theme === "dark")
    for (const width of [320, 393]) {
      await page.setViewportSize({ width, height: 852 })
      const offset = await locator.evaluate(el => { const button = el.getBoundingClientRect(), row = el.parentElement!.getBoundingClientRect(), icon = el.querySelector("svg")!.getBoundingClientRect(); return Math.max(Math.abs((button.top + button.bottom - row.top - row.bottom) / 2), Math.abs((button.top + button.bottom - icon.top - icon.bottom) / 2)) })
      expect(offset).toBeLessThanOrEqual(.5)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    }
    await page.screenshot({ path: testInfo.outputPath(`calendar-locator-${theme}-${visualStyle}.png`), scale: "css" })
    await locator.click()
    await expect.poll(() => page.locator('[data-active-round="true"]').evaluate(el => { const rect = el.getBoundingClientRect(); return rect.top >= 0 && rect.top < window.innerHeight / 2 })).toBe(true)
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
      if (path === "/leagues") {
        await expect(page.getByRole("heading", { name: "Mis ligas", exact: false })).toHaveCount(0)
        await expect(page.getByRole("heading", { name: "Mis torneos", exact: false })).toHaveCount(0)
      }
    }
  })
}
