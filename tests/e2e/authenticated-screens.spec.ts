import { openSeasonAdvanced, confirmSeasonCreation } from "./helpers/seasonCreation"
import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import jsQR from "jsqr"
import sharp from "sharp"
import type { SeasonSnapshot } from "@/context/SeasonSettingsProvider"
import { seasonRoundSettings, playerProfiles, allMatches as fixtureMatches, seasons as fixtureSeasons, leagues as fixtureLeagues } from "@/data/fakeData"

const screens = [
  { name: "home", path: "/" },
  { name: "matches", path: "/matches" },
  { name: "ranking", path: "/ranking" },
  { name: "statistics", path: "/statistics" },
  { name: "settings", path: "/settings" },
  { name: "invitation", path: "/invite" },
  { name: "season-admin", path: "/admin/season" },
  { name: "season-summary", path: "/statistics/season" },
] as const

for (const theme of ["light", "dark"]) {
  test(`match workflow prioritizes scheduling, pending results and corrections (${theme})`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.route("**/api/locations", route => route.fulfill({ json: { locations: [{ id: "qa-derio", name: "Padel Derio", town: "Derio" }] } }))
    await page.addInitScript(({ theme, matches }) => {
      localStorage.setItem("smash-lob-theme-mode", theme)
      localStorage.setItem("smash-lob-visual-style", "competition")
      localStorage.setItem("smash-lob-matches", JSON.stringify(matches))
      const guides = JSON.parse(localStorage.getItem("smash-lob-guided-onboarding-v1") ?? "{}")
      guides.match = { tourKey: "match", tourVersion: 1, status: "completed", completedAt: "2026-08-06T00:00:00.000Z", skippedAt: null }
      localStorage.setItem("smash-lob-guided-onboarding-v1", JSON.stringify(guides))
    }, { theme, matches: fixtureMatches.map(match => match.id === "season-2-round-5-match-2" ? { ...match, scheduledAt: "2026-08-09T12:00:00Z", location: "Club QA" } : match.id === "season-2-round-5-match-1" ? { ...match, location: JSON.stringify({ id: "qa-derio", name: "Padel Derio", town: "Derio" }), courtBooking: { isReserved: true, reservations: [{ playerId: "davo", amount: 40 }], ballPurchases: [], transfers: [{ id: "fixture-transfer", fromPlayerId: "bea", toPlayerId: "davo", amount: 10, isPaid: false, paidAt: null }], updatedAt: null } } : match) })

    await page.goto("/match/season-2-round-4-match-1")
    await expect(page.getByRole("button", { name: "Guardar programación", exact: true })).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath(`match-unscheduled-${theme}.png`), fullPage: true, scale: "css" })

    await page.goto("/match/season-2-round-5-match-1")
    const scheduleHeader = page.locator(".app-schedule-card > button")
    await scheduleHeader.scrollIntoViewIfNeeded()
    const headerBox = await scheduleHeader.boundingBox()
    await page.mouse.move(headerBox!.x + 20, headerBox!.y + 20)
    await page.mouse.down()
    if (theme === "dark") expect(await scheduleHeader.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe("rgb(250, 250, 250)")
    await page.mouse.up()
    await expect(page.locator(".app-schedule-card").getByRole("button", { name: "Editar", exact: true })).toBeVisible()
    await expect(page.locator(".app-schedule-card").getByText("Derio · Padel Derio", { exact: true })).toBeVisible()
    const directionsButton = page.locator(".app-schedule-card").getByRole("button", { name: "Cómo llegar", exact: true })
    const directionsBox = await directionsButton.boundingBox()
    const calendarBox = await page.locator(".app-schedule-card").getByRole("button", { name: "Calendario", exact: true }).boundingBox()
    expect(Math.abs(directionsBox!.width - calendarBox!.width)).toBeLessThanOrEqual(1)
    expect(Math.abs(directionsBox!.height - calendarBox!.height)).toBeLessThanOrEqual(1)
    await directionsButton.click()
    const directionsDialog = page.getByRole("dialog", { name: "Cómo llegar" })
    await expect(directionsDialog).toBeVisible()
    await expect(directionsDialog.getByRole("link", { name: "Google Maps", exact: true })).toBeVisible()
    await expect(directionsDialog.getByRole("link", { name: "Apple Maps", exact: true })).toBeVisible()
    await expect(directionsDialog.getByRole("link", { name: "Waze", exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Cancelar" }).click()
    const paymentsTitleBox = await page.getByRole("heading", { name: "Pagos y reservas", exact: true }).boundingBox()
    const receiveBox = await page.getByRole("button", { name: /Por cobrar/ }).boundingBox()
    expect(Math.abs(paymentsTitleBox!.y + paymentsTitleBox!.height / 2 - receiveBox!.y - receiveBox!.height / 2)).toBeLessThanOrEqual(2)
    await page.screenshot({ path: testInfo.outputPath(`match-schedule-expanded-${theme}.png`), fullPage: true, scale: "css" })
    await page.getByRole("button", { name: "Ver pagos", exact: true }).click()
    await expect(page.getByRole("button", { name: "Marcar transferencia como recibida" })).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath(`match-payments-${theme}.png`), fullPage: true, scale: "css" })
    const result = page.getByRole("region", { name: "Resultado del partido", exact: true })
    await expect(result.getByRole("textbox")).toHaveCount(0)
    await result.getByRole("button", { name: "Registrar resultado", exact: true }).click()
    await expect(result.getByText("Davo", { exact: true })).toBeVisible()
    await expect(result.getByRole("textbox")).toHaveCount(6)
    await expect(result.getByText("Resultado", { exact: true })).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath(`match-early-result-${theme}.png`), fullPage: true, scale: "css" })

    await page.goto("/match/season-2-round-5-match-2")
    await expect(result.getByRole("textbox")).toHaveCount(6)
    const resultBox = await result.boundingBox()
    const scheduleBox = await page.getByText("Programación", { exact: true }).boundingBox()
    expect(resultBox!.y).toBeLessThan(scheduleBox!.y)
    await page.screenshot({ path: testInfo.outputPath(`match-result-pending-${theme}.png`), fullPage: true, scale: "css" })
    const accessibility = await new AxeBuilder({ page }).analyze()
    expect(accessibility.violations.filter(item => item.impact === "serious" || item.impact === "critical")).toEqual([])

    await page.goto("/match/season-2-round-3-match-1")
    await expect(result.getByRole("heading", { name: "Resultado registrado", exact: true })).toBeVisible()
    await expect(result.getByRole("button", { name: "Limpiar resultado", exact: true })).toHaveCount(0)
    await result.getByRole("button", { name: "Editar resultado", exact: true }).click()
    await expect(result.getByRole("textbox").first()).toHaveValue("6")
    await result.getByRole("button", { name: "Cancelar", exact: true }).click()
    await result.getByText("Más acciones del resultado", { exact: true }).click()
    await expect(result.getByRole("button", { name: "Limpiar resultado", exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`match-result-saved-${theme}.png`), fullPage: true, scale: "css" })
  })
}

for (const theme of ["light", "dark"]) {
  test(`recommended match sides and their help fit on mobile (${theme})`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.addInitScript(({ theme, players }) => {
      localStorage.setItem("smash-lob-theme-mode", theme)
      localStorage.setItem("smash-lob-visual-style", "competition")
      localStorage.setItem("smash-lob-season-data", JSON.stringify({ playerProfiles: players }))
      const guides = JSON.parse(localStorage.getItem("smash-lob-guided-onboarding-v1") ?? "{}")
      guides.match = { tourKey: "match", tourVersion: 1, status: "completed", completedAt: "2026-08-06T00:00:00.000Z", skippedAt: null }
      localStorage.setItem("smash-lob-guided-onboarding-v1", JSON.stringify(guides))
    }, { theme, players: playerProfiles.map(player => ({ ...player, preferredSide: "reves" })) })
    await page.goto("/match/season-2-round-5-match-1")
    const help = page.getByRole("button", { name: "Información sobre posiciones recomendadas" })
    await expect(help).toBeVisible()
    await expect(page.locator('[data-recommended-side="drive"]')).toHaveCount(2)
    await expect(page.locator(".app-match-player-name")).toHaveText(["Davo", "Bea", "Carlos", "Alvaro"])
    const changed = page.getByRole("button", { name: /Lado recomendado: Drive.*Preferencia: Revés/ }).first()
    await expect(changed).toHaveAttribute("aria-label", /Lado recomendado: Drive.*Preferencia: Revés/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`recommended-sides-closed-${theme}.png`), scale: "css" })
    await help.click()
    const tooltip = page.getByRole("tooltip")
    await expect(tooltip).toContainText("Un lado para cada uno")
    await expect(tooltip).toContainText("vosotros decidís")
    const bounds = await tooltip.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(360)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(800)
    await page.screenshot({ path: testInfo.outputPath(`recommended-sides-${theme}.png`) })
    const accessibility = await new AxeBuilder({ page }).include("[role=tooltip]").analyze()
    expect(accessibility.violations.filter(item => item.impact === "serious" || item.impact === "critical")).toEqual([])
    await page.keyboard.press("Escape")
    await expect(tooltip).toHaveCount(0)
    await changed.click()
    await expect(tooltip).toContainText("Un lado para cada uno")
    await page.keyboard.press("Escape")
    await expect(tooltip).toHaveCount(0)
    await page.goto("/match/season-2-round-3-match-1")
    await expect(page.locator("[data-recommended-side]")).toHaveCount(0)
    await expect(help).toHaveCount(0)
  })
}

test("welcome pack uses the final overgrip design and prints a full A4 sheet", async ({ page, context }) => {
  await context.addInitScript(() => { window.print = () => {} })
  await page.goto("/admin/media-kit/welcome-pack")
  await page.getByRole("button", { name: /Fajín del overgrip/ }).click()
  const design = page.locator('[data-overgrip-band-design="true"]')
  await expect(design).toBeVisible()
  await expect(design).not.toContainText("Welcome Pack")
  const popupPromise = page.waitForEvent("popup")
  await page.getByRole("button", { name: "Generar PDF / imprimir" }).click()
  const popup = await popupPromise
  await expect(popup.locator('.slot [data-overgrip-band-design="true"]')).toHaveCount(18)
  await expect(popup.locator(".sheet")).toBeVisible()
  await popup.close()
})

test("welcome pack selects sticker designs and prints them together on one A4 sheet", async ({ page, context }) => {
  await context.addInitScript(() => { window.print = () => {} })
  await page.goto("/admin/media-kit/welcome-pack")
  const stickersTab = page.locator("button").filter({ has: page.getByRole("heading", { name: "Pegatinas", exact: true }) })
  await stickersTab.click()
  await expect(stickersTab).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByRole("button", { name: "Generar PDF A4 · una hoja" })).toBeVisible()
  const padelLovers = page.getByRole("button", { name: /Padel Lovers/ })
  await expect(padelLovers).toHaveAttribute("aria-pressed", "true")
  await padelLovers.click()
  await expect(padelLovers).toHaveAttribute("aria-pressed", "false")
  await page.getByLabel("Copias de cada diseño").selectOption("2")

  const popupPromise = page.waitForEvent("popup")
  await page.getByRole("button", { name: "Generar PDF A4 · una hoja" }).click()
  const popup = await popupPromise
  await expect(popup.locator(".sticker-artwork")).toHaveCount(10)
  await expect(popup.locator(".sheet")).toBeVisible()
  await expect(popup.locator(".sheet img").first()).toHaveAttribute("src", /\/media-kit\/stickers\//)
  await popup.close()
})

test("cached league access waits until the initial snapshot request finishes", async ({ page }) => {
  let release: () => void = () => {}
  const pending = new Promise<void>(resolve => { release = resolve })
  await page.route("**/api/access*", async route => { await pending; await route.fulfill({ status: 401, json: { error: "unauthorized" } }) })
  await page.goto("/matches")
  await expect(page.getByRole("status", { name: "Cargando Smash & Lob" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Calendario de liga" })).not.toBeVisible()
  release()
  await expect(page.getByRole("heading", { name: "Calendario de liga" })).toBeVisible()
})

test("proposal votes wait for confirmation, prevent duplicate writes and survive reload", async ({ page }, testInfo) => {
  let release: () => void = () => {}
  let writes = 0, voted = false, failNext = false
  const pending = new Promise<void>(resolve => { release = resolve })
  await page.route("**/api/matches/season-2-round-4-match-1/chat*", async route => {
    if (route.request().method() === "PATCH") {
      writes++; await pending
      if (failNext) { failNext = false; await route.fulfill({ status: 503, json: { error: "No se ha podido guardar el voto QA." } }); return }
      voted = !voted
      await route.fulfill({ json: { ok: true } }); return
    }
    await route.fulfill({ json: { currentUserId: "qa-user", round: 4, readOnly: false, participants: [{ playerId: "davo", userId: "qa-user", displayName: "QA v1.1", handle: "qa", avatarUrl: null }], messages: [{ id: "proposal-qa", sender_user_id: "other", sender_display_name: "QA Rival", body: "", kind: "location_proposal", payload: { key: "location", name: "Pista QA" }, created_at: "2026-08-10T08:00:00Z", responses: voted ? [{ userId: "qa-user", optionKey: "location", response: "available" }] : [] }] } })
  })
  await page.goto("/match/season-2-round-4-match-1/chat")
  const yes = page.getByRole("button", { name: "Me viene bien · 0 votos" })
  await yes.click()
  await expect(page.getByRole("status").filter({ hasText: "Guardando" })).toBeVisible()
  await expect(yes).toBeDisabled()
  await expect(page.getByRole("button", { name: "No puedo · 0 votos" })).toBeDisabled()
  await expect.poll(() => writes).toBe(1)
  await page.screenshot({ path: testInfo.outputPath("vote-saving.png"), fullPage: true })
  release()
  await expect(page.getByRole("button", { name: "Quitar mi voto favorable · 1 votos" })).toHaveAttribute("aria-pressed", "true")
  await page.reload()
  await expect(page.getByRole("button", { name: "Quitar mi voto favorable · 1 votos" })).toHaveAttribute("aria-pressed", "true")
  failNext = true
  await page.getByRole("button", { name: "Quitar mi voto favorable · 1 votos" }).click()
  await expect(page.getByText("No se ha podido guardar el voto QA.", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Quitar mi voto favorable · 1 votos" })).toBeEnabled()
  await page.getByRole("button", { name: "Quitar mi voto favorable · 1 votos" }).click()
  await expect(page.getByRole("button", { name: "Me viene bien · 0 votos" })).toHaveAttribute("aria-pressed", "false")
  expect(writes).toBe(3)
})

test("calendar view selector fits without horizontal scrolling", async ({ page }) => {
  await page.goto("/matches")
  const selector = page.locator('[data-tour="matches-scope"] > div')
  await expect(selector).toBeVisible()
  expect(await selector.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
})

test("friendly chat reservation opens calendar options in both Competition modes", async ({ page }, testInfo) => {
  await page.route("**/api/personal-matches/qa-friendly/chat*", async route => {
    await route.fulfill({ json: { currentUserId: "qa-user", messages: [], participants: [], readOnly: false, match: { id: "qa-friendly", origin: "friendly", status: "scheduled", scheduledAt: "2026-08-12T17:00:00Z", locationName: "Pista QA", participants: [{ team: 1, slot: 1, displayName: "Ana QA" }, { team: 2, slot: 1, displayName: "Rival QA" }], courtBooking: { isReserved: true } } } })
  })
  for (const mode of ["light", "dark"]) {
    await page.addInitScript(mode => { localStorage.setItem("smash-lob-visual-style", "competition"); localStorage.setItem("smash-lob-theme-mode", mode) }, mode)
    await page.goto("/personal-matches/qa-friendly/chat")
    const trigger = page.getByRole("button", { name: /Reserva.*Guardar en calendario/ })
    await expect(trigger).toBeVisible()
    await expect(trigger).toContainText("Pista QA")
    expect(await trigger.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
    await trigger.click()
    const dialog = page.getByRole("dialog", { name: "Añadir al calendario" })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("button", { name: "Google Calendar" })).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath("friendly-calendar-" + mode + ".png"), fullPage: true })
    const download = page.waitForEvent("download")
    await dialog.getByRole("button", { name: "Apple Calendar / otros (.ics)" }).click()
    expect((await download).suggestedFilename()).toBe("smash-lob.ics")
    await expect(dialog).not.toBeVisible()
  }
})

test("league spectator share shows a downloadable QR and shares the league link", async ({ page }) => {
  const spectatorUrl = "http://localhost:3000/spectator/invite/league-code"
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async ({ url }: { url: string }) => {
        window.sessionStorage.setItem("qa-shared-spectator-url", url)
      },
    })
  })
  await page.route("**/api/leagues/league-smash-lob/spectator-invite", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ code: "league-code", url: spectatorUrl }),
    })
  })

  await page.goto("/")
  await page.getByRole("button", { name: "Compartir invitación" }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await dialog.getByRole("button", { name: "Invitar a seguir la liga" }).click()
  const qrImage = dialog.getByRole("img", { name: /Sigue nuestra liga/ })
  await expect(qrImage).toBeVisible()
  await expect(dialog.getByRole("button", { name: "Descargar" })).toBeEnabled()
  const qrDataUrl = await qrImage.getAttribute("src")
  expect(qrDataUrl).toMatch(/^data:image\/svg\+xml;charset=utf-8,/)
  const qrSvg = decodeURIComponent(qrDataUrl!.slice(qrDataUrl!.indexOf(",") + 1))
  expect(qrSvg).toContain('fill="#171719"')
  expect(qrSvg).toContain('href="data:image/png;base64,')
  expect(qrSvg).toContain('width="96" height="96" rx="16"')
  expect(qrSvg).toContain('M48,48l12,0 0,12 -12,0 0,-12z')
  expect(qrSvg).toContain('rx="2.5"')
  const { data, info } = await sharp(Buffer.from(qrSvg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const decodedQr = jsQR(new Uint8ClampedArray(data), info.width, info.height)
  expect(decodedQr?.data).toBe(spectatorUrl)
  const popupSurface = dialog.locator(":scope > div")
  const appSurface = page.locator('.app-shell-frame[data-home-route="true"]')
  await expect(popupSurface).toHaveClass(/app-shell-frame/)
  expect(await popupSurface.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(
    await appSurface.evaluate((element) => getComputedStyle(element).backgroundColor),
  )

  const downloadPromise = page.waitForEvent("download")
  await dialog.getByRole("button", { name: "Descargar" }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/smash-lob-qr-spectator\.svg$/)

  await dialog.getByRole("button", { name: "Compartir" }).click()
  await expect(dialog.getByRole("status")).toContainText("Enlace compartido")
  expect(await page.evaluate(() => window.sessionStorage.getItem("qa-shared-spectator-url"))).toBe(spectatorUrl)
})

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-08-10T10:00:00+02:00"))
  await page.route("**/api/onboarding/progress", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [] }) })
      return
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) })
  })
  await page.addInitScript(() => {
    window.localStorage.setItem("smash-lob:competition-launch-popup-v2:qa-v1-1@example.test", "dismissed")
    window.localStorage.setItem("smash-lob-theme-mode", "light")
    window.localStorage.setItem("smash-lob-visual-style", "plain")
    window.localStorage.setItem(
      "smash-lob-guided-onboarding-v1",
      JSON.stringify({
        "app-introduction": { tourKey: "app-introduction", tourVersion: 1, status: "completed", completedAt: "2026-08-06T00:00:00.000Z", skippedAt: null },
        home: { tourKey: "home", tourVersion: 7, status: "completed", completedAt: "2026-08-06T00:00:00.000Z", skippedAt: null },
        matches: { tourKey: "matches", tourVersion: 2, status: "completed", completedAt: "2026-08-06T00:00:00.000Z", skippedAt: null },
        ranking: { tourKey: "ranking", tourVersion: 2, status: "completed", completedAt: "2026-08-06T00:00:00.000Z", skippedAt: null },
        statistics: { tourKey: "statistics", tourVersion: 2, status: "completed", completedAt: "2026-08-06T00:00:00.000Z", skippedAt: null },
        "season-admin": { tourKey: "season-admin", tourVersion: 3, status: "completed", completedAt: "2026-08-06T00:00:00.000Z", skippedAt: null },
        settings: { tourKey: "settings", tourVersion: 4, status: "completed", completedAt: "2026-08-06T00:00:00.000Z", skippedAt: null },
      }),
    )
    window.localStorage.setItem(
      "smash-lob-user-league-memberships",
      JSON.stringify([
        {
          userId: "qa-v1-1@example.test",
          leagueId: "league-smash-lob",
          playerId: "davo",
          role: "admin",
        },
      ]),
    )
  })

  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          name: "QA v1.1",
          email: "qa-v1-1@example.test",
          image: null,
        },
        expires: "2099-01-01T00:00:00.000Z",
      }),
    })
  })

  await page.route("**/api/account/profile", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        profile: {
          firstName: "QA",
          lastName: "v1.1",
          displayName: "QA v1.1",
          profileCompletedAt: "2026-08-03T00:00:00.000Z",
          availabilityCompletedAt: "2026-08-03T00:00:00.000Z",
          standardAvailabilityTimezone: "Europe/Madrid",
          standardAvailabilityWeeklySlots: {},
          preferredSide: "reves",
          dominantHand: "right",
          isComplete: true,
          isSuperuser: false,
        },
      }),
    })
  })
})

test("league creation selector reaches 32 players and refuses a thirty-third", async ({page}) => {
  await page.addInitScript(seasons => {
    localStorage.setItem("smash-lob-season-data",JSON.stringify({seasons:seasons.map(season=>({...season,status:"finished"})),activeSeasonIds:{"league-smash-lob":"season-2"}}))
  },fixtureSeasons)
  await page.goto("/admin/season")
  await page.getByRole("button",{name:"Configurar nueva temporada",exact:true}).click()
  const increase=page.getByRole("button",{name:"Aumentar número de jugadores",exact:true})
  await expect(increase).toBeVisible()
  for(let i=0;i<24&&!await increase.isDisabled();i++)await increase.click()
  await expect(increase).toBeDisabled()
  await expect(increase.locator("..").getByText("32",{exact:true})).toBeVisible()
  await page.getByRole("button",{name:"Reducir número de jugadores",exact:true}).click()
  await expect(increase).toBeEnabled()
  await expect(increase.locator("..").getByText("31",{exact:true})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
})

for (const screen of screens) {
  test(`@a11y authenticated ${screen.name} has no serious Axe violations`, async ({
    page,
  }) => {
    await page.goto(screen.path)
    await expect(page.locator("main")).toBeVisible()

    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter(({ impact }) =>
      ["critical", "serious"].includes(impact ?? ""),
    )
    const diagnostics = serious.flatMap(({ id, nodes }) =>
      nodes.map(({ html, target }) => `${id}: ${target.join(" ")} :: ${html}`),
    )

    expect(diagnostics, `${screen.path}\n${diagnostics.join("\n")}`).toEqual([])
  })
}

for (const screen of screens) {
  test(`@visual authenticated ${screen.name} remains stable`, async ({ page }) => {
    await page.goto(screen.path)
    await expect(page.locator("main")).toBeVisible()
    await page.addStyleTag({
      content: `
        nextjs-portal { display: none !important; }
        input[type="date"]::-webkit-datetime-edit {
          visibility: hidden !important;
        }
        /* Avatar Lab is intentionally enabled on localhost but excluded from
           the stable production UI baseline. Hide its complete section so the
           test does not leave an empty experimental card behind. */
        section:has(#avatar-lab) { display: none !important; }
        [data-tour="floating-help"] { display: none !important; }
        .app-main {
          --app-floating-top-reserved-width: var(--app-floating-top-reserved-width-without-help) !important;
        }
      `,
    })

    // The installed version changes every delivery and is not a visual
    // regression. Keep the existing baseline deterministic.
    await page.locator("[data-visual-stable-version]").evaluateAll((elements) => {
      for (const element of elements) {
        element.textContent = "Smash & Lob · v1.2.1"
      }
    })

    await expect(page).toHaveScreenshot(`authenticated-${screen.name}.png`, {
      fullPage: true,
      animations: "disabled",
    })
  })
}


test("guided help can repeat the current screen tour", async ({ page }) => {
  await page.goto("/matches")
  await page.getByRole("button", { name: "Ayuda de esta pantalla" }).click()
  await expect(page.getByRole("dialog", { name: "Ayuda de esta pantalla" })).toBeVisible()
  await page.getByRole("button", { name: "Repetir guía" }).click()
  await expect(page.getByRole("dialog", { name: "Partidos y jornadas" })).toBeVisible()
  await expect(page.getByText("Todos o solo los tuyos", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Siguiente" }).click()
  await expect(page.getByText("Jornadas y estados", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Omitir" }).click()
  await expect(page.getByRole("dialog", { name: "Partidos y jornadas" })).toHaveCount(0)
})

test("repeating the home guide skips the one-time welcome", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Ayuda de esta pantalla" }).click()
  await page.getByRole("button", { name: "Repetir guía" }).click()
  await expect(page.getByRole("dialog", { name: "Pantalla de inicio" })).toBeVisible()
  await expect(page.getByText("Bienvenido a Smash & Lob", { exact: true })).toHaveCount(0)
  await expect(page.getByText("Resumen de la liga", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Omitir" }).click()
})

test("personal matches use a separate simplified mode", async ({ page }) => {
  await page.route("**/api/personal-matches**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            origin: "friendly",
            status: "finished",
            scheduledAt: "2026-08-08T08:00:00.000Z",
            resultRecordedAt: "2026-08-08T10:00:00.000Z",
            locationName: "Padel Indoor",
            sets: [
              { a: 6, b: 4 },
              { a: 3, b: 6 },
              { a: 6, b: 2 },
            ],
            participants: [
              { team: 1, slot: 1, displayName: "QA v1.1", isCurrentUser: true },
              { team: 1, slot: 2, displayName: "Álvaro", isCurrentUser: false },
              { team: 2, slot: 1, displayName: "Unai", isCurrentUser: false },
              { team: 2, slot: 2, displayName: "Joseba", isCurrentUser: false },
            ],
            canManage: true,
            canDelete: true,
            leagueId: null,
            leagueName: null,
            seasonId: null,
            round: null,
          },
          {
            id: "22222222-2222-4222-8222-222222222222",
            origin: "league",
            status: "finished",
            scheduledAt: "2026-08-07T18:00:00.000Z",
            resultRecordedAt: "2026-08-07T20:00:00.000Z",
            locationName: "Club Liga",
            sets: [
              { a: 6, b: 2 },
              { a: 6, b: 3 },
            ],
            participants: [
              { team: 1, slot: 1, displayName: "QA v1.1", isCurrentUser: true },
              { team: 1, slot: 2, displayName: "Mikel", isCurrentUser: false },
              { team: 2, slot: 1, displayName: "Iker", isCurrentUser: false },
              { team: 2, slot: 2, displayName: "Aitor", isCurrentUser: false },
            ],
            canManage: false,
            canDelete: false,
            leagueId: "league-1",
            leagueName: "Liga QA",
            seasonId: "season-1",
            round: 3,
          },
        ],
        hasMore: true,
        nextOffset: 10,
        upcoming: [
          {
            id: "44444444-4444-4444-8444-444444444444",
            origin: "friendly",
            status: "scheduled",
            scheduledAt: "2026-08-23T19:00:00.000Z",
            resultRecordedAt: null,
            locationName: "Padel Indoor",
            sets: [],
            participants: [
              { team: 1, slot: 1, displayName: "QA v1.1", isCurrentUser: true },
              { team: 1, slot: 2, displayName: "Álvaro", isCurrentUser: false },
              { team: 2, slot: 1, displayName: "Unai", isCurrentUser: false },
              { team: 2, slot: 2, displayName: "Joseba", isCurrentUser: false },
            ],
            canManage: true,
            canDelete: true,
            leagueId: null,
            leagueName: null,
            seasonId: null,
            round: null,
          },
        ],
      }),
    })
  })

  await page.goto("/personal-matches")
  await expect(page.getByRole("heading", { name: "Mis partidos" })).toBeVisible()
  await expect(page.getByText("Próximos partidos", { exact: true })).toBeVisible()
  await expect(page.getByText("1 amistoso", { exact: true })).toBeVisible()
  await expect(page.getByText("QA v1.1", { exact: true }).first()).toBeVisible()
  await expect(page.getByText("Álvaro", { exact: true }).first()).toBeVisible()
  await expect(page.getByText("Victoria", { exact: true }).first()).toBeVisible()
  await expect(page.getByLabel("Juegos por set de la pareja A").first()).toBeVisible()
  await expect(page.getByLabel("Sets ganados por la pareja A").first()).toHaveText("2")
  await expect(page.getByText("Liga QA", { exact: true }).first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Cargar 10 más" })).toBeVisible()
  await expect(page.locator(".app-bottom-nav")).toHaveCount(0)
  await expect(page.getByRole("navigation", { name: "Navegación global" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Mis partidos", exact: true })).toBeVisible()
  await expect(page.getByRole("link", { name: "Competiciones", exact: true })).toBeVisible()
  await expect(page.getByRole("link", { name: "Mi perfil", exact: true })).toBeVisible()
  await expect(page.getByRole("link", { name: "+ Partido", exact: true })).toHaveCount(0)
  await expect(page.locator('[data-tour="floating-settings"]')).toHaveCount(1)
  await expect(page.locator('[data-tour="floating-help"]')).toHaveCount(1)
  await expect(page.locator('[data-tour="floating-notifications"]')).toHaveCount(1)
})

test("personal matches hide the whole upcoming section when there is no future match", async ({ page }) => {
  await page.route("**/api/personal-matches**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [],
        hasMore: false,
        nextOffset: null,
        upcoming: [],
      }),
    })
  })

  await page.goto("/personal-matches")
  await expect(page.getByRole("heading", { name: "Mis partidos" })).toBeVisible()
  await expect(page.getByText("Próximos partidos", { exact: true })).toHaveCount(0)
  await expect(page.getByText("Sin partidos programados", { exact: true })).toHaveCount(0)
  await expect(page.getByText("Historial", { exact: true })).toBeVisible()
})

for (const theme of ["light", "dark"]) for (const duration of ["single", "double", "custom", "manual"]) {
  test(`fixed league pairs keep partners through creation, scoring and ranking (${duration}, ${theme})`, async ({ page }, testInfo) => {
    await page.addInitScript(({ seasons, leagues, theme }) => {
      localStorage.setItem("smash-lob-theme-mode", theme)
      if (sessionStorage.getItem("qa-fixed-league-initialized")) return
      sessionStorage.setItem("qa-fixed-league-initialized", "1")
      localStorage.setItem("smash-lob-leagues", JSON.stringify(leagues.map(league => league.id === "league-smash-lob" ? { ...league, modality: "fixed_pairs" } : league)))
      localStorage.setItem("smash-lob-season-data", JSON.stringify({ seasons: seasons.map(season => ({ ...season, status: "finished" })), activeSeasonIds: { "league-smash-lob": "season-2" } }))
    }, { seasons: fixtureSeasons, leagues: fixtureLeagues, theme })
    await page.goto("/admin/season")
    await page.getByRole("button", { name: "Configurar nueva temporada", exact: true }).click()
    await expect(page.getByText("Parejas de la temporada", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Reducir número de jugadores", exact: true }).click()
    const pairOne = page.getByRole("combobox", { name: "Pareja 1 · Jugador 1", exact: true })
    await expect(pairOne).toBeVisible()
    const values = await pairOne.locator("option").evaluateAll(options => options.map(option => (option as HTMLOptionElement).value))
    await pairOne.selectOption(values[2])
    if (duration !== "single") await openSeasonAdvanced(page)
    if (duration === "manual") await page.getByRole("button", { name: /^Calendario manual/ }).click()
    if (duration === "double") await page.getByRole("combobox", { name: "Vueltas completas", exact: true }).selectOption("double")
    if (duration === "custom") {
      await page.getByRole("combobox", { name: "Tipo de duración", exact: true }).selectOption("custom")
      await page.locator('input[type="number"][max="18"]').fill("4")
    }
    await confirmSeasonCreation(page)
    await expect(page).toHaveURL(/\/$/)
    const created = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem("smash-lob-season-data")!)
      const seasonId = data.activeSeasonIds["league-smash-lob"]
      return { season: data.seasons.find((season: {id:string}) => season.id === seasonId), roster: data.seasonPlayers.filter((row: {seasonId:string}) => row.seasonId === seasonId), matches: JSON.parse(localStorage.getItem("smash-lob-matches")!).filter((match: {seasonId:string}) => match.seasonId === seasonId) }
    })
    expect(created.season.totalRounds).toBe(duration === "double" ? 6 : duration === "custom" ? 4 : 3)
    expect(created.roster).toHaveLength(6)
    expect(created.matches).toHaveLength(created.season.totalRounds)
    for (const match of created.matches) for (const team of [match.teamA, match.teamB]) {
      expect(new Set(team.map((id: string) => created.roster.find((row: {playerId:string}) => row.playerId === id).pairNumber)).size).toBe(1)
    }
    await page.goto(`/match/${created.matches[0].id}`)
    const result = page.getByRole("region", { name: "Resultado del partido", exact: true })
    await result.getByRole("button", { name: "Registrar resultado", exact: true }).click()
    for (const [team, scores] of [["A", [6,4,6]], ["B", [4,6,3]]] as const) for (const [index, score] of scores.entries()) await result.getByRole("textbox", { name: `Pareja ${team} Set ${index + 1}`, exact: true }).fill(String(score))
    await result.getByRole("button", { name: "Guardar resultado", exact: true }).click()
    await expect(result.getByRole("heading", { name: "Resultado registrado", exact: true })).toBeVisible()
    await page.goto("/ranking")
    await expect(page.getByRole("heading", { name: "Clasificación por parejas", exact: true })).toBeVisible()
    await expect(page.locator(".app-ranking-row")).toHaveCount(3)
    await expect(page.locator(".app-ranking-row").first().locator("p").last()).toHaveText("2")
    await page.reload()
    await expect(page.locator(".app-ranking-row")).toHaveCount(3)
    if (theme === "dark") await expect(page.locator("html")).toHaveClass(/dark/)
    else await expect(page.locator("html")).not.toHaveClass(/dark/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const accessibility = await new AxeBuilder({ page }).analyze()
    expect(accessibility.violations.filter(item => item.impact === "serious" || item.impact === "critical")).toEqual([])
    await page.screenshot({ path: testInfo.outputPath(`pairs-ranking-${theme}.png`), scale: "css" })
  })
}

test("new league asks its format and opens the corresponding fixed-pair season form", async ({ page }) => {
  const id = "40000000-0000-4000-8000-000000000001"
  let created: typeof fixtureLeagues[number] | null = null
  let creationCount = 0
  let seasonCount = 0
  let snapshot: SeasonSnapshot = { seasons: [], playerProfiles: [], seasonPlayers: [], seasonSettings: [], activeSeasonIds: {} }
  await page.route("**/api/access**", route => route.fulfill({ json: { isSuperuser: false, canCreateLeagues: true, leagues: [...fixtureLeagues, ...(created ? [created] : [])], memberships: [{ userId: "qa-v1-1@example.test", leagueId: id, role: "creator", playerId: "" }], spectatorLeagueIds: [], matches: [], seasonSnapshot: snapshot } }))
  await page.route("**/api/leagues", async route => {
    creationCount += 1
    const body = route.request().postDataJSON()
    expect(body.modality).toBe("fixed_pairs")
    created = { id, name: body.leagueName, description: body.leagueDescription, slug: body.leagueSlug, modality: body.modality, inviteCode: body.inviteCode, activeSeasonId: "", joinMode: "closed", locations: [] }
    await route.fulfill({ json: { league: created, membership: { userId: "qa-v1-1@example.test", leagueId: id, playerId: "", role: "creator" }, seasonSnapshot: { seasons: [], playerProfiles: [], seasonPlayers: [], seasonSettings: [], activeSeasonIds: { [id]: "" } } } })
  })
  await page.route(`**/api/leagues/${id}`, async route => {
    const body = route.request().postDataJSON()
    created = { ...created!, ...(body.name ? { name: body.name, description: body.description, recommendations: body.recommendations } : {}), ...(Object.hasOwn(body, "logoUrl") ? { logoUrl: body.logoUrl } : {}) }
    await route.fulfill({ json: { leagueId: id, ...created } })
  })
  await page.route("**/player-directory", route => route.fulfill({ json: { people: [] } }))
  await page.route(`**/api/leagues/${id}/seasons`, async route => {
    seasonCount++
    const body = route.request().postDataJSON()
    const seasonId = "40000000-0000-4000-8000-000000000003"
    const profiles = body.newPlayerNames.map((displayName: string, i: number) => ({ id: `qa-player-${i}`, leagueId: id, slug: `qa-${i}`, displayName, avatarInitials: "QA" }))
    snapshot = { seasons: [{ id: seasonId, leagueId: id, name: body.name, status: "upcoming", totalRounds: body.targetRoundCount, completedRounds: 0 }], playerProfiles: profiles, seasonPlayers: profiles.map((p: { id: string }, i: number) => ({ seasonId, playerId: p.id, pairNumber: Math.floor(i / 2) + 1 })), seasonSettings: [{ ...seasonRoundSettings[0], ...body, leagueId: id, seasonId }], activeSeasonIds: { [id]: seasonId } }
    created = { ...created!, activeSeasonId: seasonId }
    await route.fulfill({ json: { matches: [], seasonSnapshot: snapshot, linkedMembership: { userId: "qa-v1-1@example.test", leagueId: id, playerId: profiles[0].id, role: "creator" } } })
  })
  await page.goto("/league/new")
  const modality = page.getByRole("combobox", { name: "Modalidad de liga", exact: true })
  await expect(modality).toHaveValue("individual")
  await modality.selectOption("fixed_pairs")
  await expect(page.getByText(/Cada pareja mantiene sus jugadores/)).toBeVisible()
  await page.locator('form input').first().fill("League pairs fixture")
  await page.locator("summary").filter({ hasText: "Personalizar liga" }).click()
  await page.locator('input[type="file"]').setInputFiles({ name: "logo-azul.png", mimeType: "image/png", buffer: await sharp({ create: { width: 128, height: 128, channels: 4, background: "#2070B0" } }).png().toBuffer() })
  await page.getByRole("button", { name: "Usar imagen", exact: true }).click()
  await expect(page.locator('input[type="color"]')).toHaveValue("#2070b0")
  await page.locator('input[type="color"]').fill("#ff2200")
  await page.getByRole("button", { name: "Asignar color de liga automáticamente", exact: true }).click()
  await expect(page.locator('input[type="color"]')).toHaveValue("#2070b0")
  await page.locator("summary").filter({ hasText: "Personalizar liga" }).click()
  await page.getByRole("button", { name: "Siguiente paso", exact: true }).click()
  await expect(page).toHaveURL(/league\/new$/)
  await expect(page.getByText("Parejas de la temporada", { exact: true })).toBeVisible()
  await expect(page.getByRole("combobox", { name: "Pareja 1 · Jugador 1", exact: true })).toBeVisible()
  expect(created).toBeNull()
  expect(creationCount).toBe(0)
  const names = page.locator("[data-season-pairs] input")
  await names.nth(1).fill("Nombre conservado")
  const registration = page.getByRole("combobox", { name: "¿Cómo se formará la plantilla?", exact: true })
  await registration.selectOption("self_registration")
  await expect(names).toHaveCount(0)
  await registration.selectOption("fixed")
  await expect(names.nth(1)).toHaveValue("Nombre conservado")
  await expect(names.nth(0)).toHaveValue("QA v1.1")
  await names.nth(0).fill("Alias organizador")
  await page.getByRole("button", { name: "Atrás", exact: true }).last().click()
  await expect(page.getByRole("combobox", { name: "Modalidad de liga", exact: true })).toBeEnabled()
  await page.getByRole("textbox", { name: "Nombre de la liga", exact: true }).fill("Liga revisada")
  await page.getByRole("button", { name: "Siguiente paso", exact: true }).click()
  await expect(names.nth(1)).toHaveValue("Nombre conservado")
  expect(created).toBeNull()
  expect(creationCount).toBe(0)
  const manualNames = page.locator("[data-season-pairs] input")
  await expect(manualNames.nth(0)).toHaveValue("Alias organizador")
  for (let i = 2; i < await manualNames.count(); i++) await manualNames.nth(i).fill(`Jugador QA ${i + 1}`)
  await page.getByRole("button", { name: "Siguiente paso", exact: true }).click()
  await page.getByRole("button", { name: "Editar Liga", exact: true }).click()
  await expect(page.locator("[data-league-creation] details")).toHaveAttribute("open", "")
  await page.getByRole("button", { name: "Siguiente paso", exact: true }).click()
  for (const [index, title] of ["Calendario y duración", "Inicio y visibilidad", "Reglas de juego", "Organización y pagos"].entries()) {
    await page.getByRole("button", { name: `Editar ${title}`, exact: true }).click()
    await expect(page.locator("[data-season-creation-advanced] > details").nth(index)).toHaveAttribute("open", "")
    await page.getByRole("button", { name: "Siguiente paso", exact: true }).click()
  }
  await expect(page.getByRole("button", { name: "Crear liga y primera temporada", exact: true })).toBeEnabled()
  expect(creationCount).toBe(0)
  for (const width of [320, 393]) {
    await page.setViewportSize({ width, height: 852 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    const header = page.locator("[data-season-creation-step] .app-page-header")
    expect(await header.locator("h1").evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  }
  const axe = await new AxeBuilder({ page }).analyze()
  expect(axe.violations.filter(v => v.impact === "serious" || v.impact === "critical")).toEqual([])
  await page.getByRole("button", { name: "Crear liga y primera temporada", exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  expect(creationCount).toBe(1)
  expect(seasonCount).toBe(1)
  expect(created!.name).toBe("Liga revisada")
  expect(created!.logoUrl).toMatch(/^data:image\//)
  await page.reload()
  await expect(page).toHaveURL(/\/$/)
  expect(creationCount).toBe(1)
  expect(seasonCount).toBe(1)
})

for (const theme of ["light", "dark"]) for (const modality of ["individual", "fixed_pairs"] as const) {
  test(`guided season creation preserves basic and advanced settings (${modality}, ${theme})`, async ({ page }, info) => {
    await page.addInitScript(({ seasons, leagues, theme, modality }) => {
      localStorage.setItem("smash-lob-theme-mode", theme)
      localStorage.setItem("smash-lob-visual-style", "competition")
      if (sessionStorage.getItem("qa-guided-season")) return
      sessionStorage.setItem("qa-guided-season", "1")
      localStorage.setItem("smash-lob-leagues", JSON.stringify(leagues.map(league => ({ ...league, modality }))))
      localStorage.setItem("smash-lob-season-data", JSON.stringify({ seasons: seasons.map(season => ({ ...season, status: "finished" })), activeSeasonIds: { "league-smash-lob": "season-2" } }))
    }, { seasons: fixtureSeasons, leagues: fixtureLeagues, theme, modality })
    await page.setViewportSize({ width: 393, height: 852 })
    await page.goto("/admin/season")
    await page.getByRole("button", { name: "Configurar nueva temporada", exact: true }).click()
    const wizard = page.locator("[data-season-creation-step]")
    await expect(wizard).toHaveAttribute("data-season-creation-step", "basic")
    const seasonName = wizard.locator("[data-season-creation-basic] input").first()
    await seasonName.fill("Temporada guiada")
    const heading = wizard.locator(".league-season-header")
    expect((await heading.boundingBox())!.height).toBeLessThanOrEqual(80)
    await expect.poll(async () => {
      const headerBox = await heading.boundingBox()
      const toolbarBox = await page.locator("[data-floating-top-toolbar]").boundingBox()
      return Boolean(headerBox && toolbarBox && headerBox.y >= toolbarBox.y + toolbarBox.height + 4)
    }).toBe(true)
    await expect(wizard.getByRole("heading", { name: "Configuración básica", exact: true })).toBeVisible()
    await expect(wizard.locator("p").filter({ hasText: /^Tres sets completos · MVP automático avanzado/ })).toBeVisible()
    await page.getByRole("button", { name: "Atrás", exact: true }).click()
    await expect(wizard).not.toBeVisible()
    await page.getByRole("button", { name: "Configurar nueva temporada", exact: true }).click()
    await expect(seasonName).toHaveValue("Temporada guiada")
    await page.screenshot({ path: info.outputPath(`guided-basic-${modality}-${theme}.png`), scale: "css" })
    await expect(page.getByRole("button", { name: "Personalizar ajustes avanzados", exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Siguiente paso", exact: true }).click()
    await expect(wizard).toHaveAttribute("data-season-creation-step", "summary")
    const summary = page.locator("[data-season-creation-summary]")
    await expect(summary.getByText("Sin cuota", { exact: true })).toBeVisible()
    await expect(summary.getByText("Tres sets completos", { exact: true })).toBeVisible()
    for (const label of ["Equilibrado", "Jornadas totales", "Manual", "Cuota de inscripción por jugador"]) await expect(summary.getByText(label, { exact: true })).toBeVisible()
    const participantFields = summary.locator(".season-review-card").filter({ has: page.getByRole("heading", { name: "Participantes", exact: true }) }).locator("dt")
    await expect(participantFields).toHaveText(modality === "fixed_pairs" ? ["Temporada", "Jugadores", "Inscripción", "Parejas"] : ["Temporada", "Jugadores", "Inscripción"])
    await expect(summary.getByText("Sin confirmación", { exact: true })).toBeVisible()
    const roster = summary.locator("[data-season-review-roster]")
    await roster.locator("summary").click()
    expect(await roster.locator(":scope > div").evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(2)
    await roster.locator("summary").click()
    await page.getByRole("button", { name: "Editar Calendario y duración", exact: true }).click()
    await expect(wizard).toHaveAttribute("data-season-creation-step", "advanced")
    await expect(page.locator("[data-season-creation-advanced] > details").first()).toHaveAttribute("open", "")
    const advanced = page.locator("[data-season-creation-advanced]")
    expect((await heading.boundingBox())!.height).toBeLessThanOrEqual(80)
    await advanced.locator("details > summary").first().click()
    await expect(advanced.locator("details[open]")).toHaveCount(0)
    await expect(advanced.locator("summary .league-creation-range")).toHaveText(["1–2", "3", "4–7", "8–9"])
    for (const range of await advanced.locator("summary .league-creation-range").all()) await expect(range).toBeVisible()
    await page.screenshot({ path: info.outputPath(`guided-numbered-sections-${modality}-${theme}.png`), fullPage: true })
    await page.getByRole("button", { name: "Atrás", exact: true }).last().click()
    await expect(wizard).toHaveAttribute("data-season-creation-step", "basic")
    await openSeasonAdvanced(page)
    await expect(advanced.locator(".league-creation-number")).toHaveText(["1", "2", "3", "4", "5", "6", "7", "8", "9"])
    for (const badge of await advanced.locator(".league-creation-number").all()) await expect(badge).toBeVisible()
    for (const width of [320,393]) {
      await page.setViewportSize({ width, height:852 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    }
    const advancedAxe = await new AxeBuilder({ page }).analyze()
    expect(advancedAxe.violations.filter(item => item.impact === "serious" || item.impact === "critical")).toEqual([])
    const availability = advanced.getByRole("checkbox", { name: "Usa los horarios habituales de los jugadores para sugerir fechas al programar partidos.", exact: true })
    await expect(availability).not.toBeChecked()
    await availability.check()
    await expect(availability).toBeChecked()
    await availability.uncheck()
    const date = page.getByLabel("Fecha y hora de activación", { exact: true })
    await date.focus()
    await expect(date).toHaveValue("")
    await page.getByRole("combobox", { name: "Vueltas completas", exact: true }).selectOption("double")
    await page.getByRole("button", { name: "Atrás", exact: true }).last().click()
    await expect(page.getByText("Ajustes personalizados", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Siguiente paso", exact: true }).click()
    await expect(summary.getByText("Doble vuelta", { exact: true })).toBeVisible()
    for (const width of [320,393]) {
      await page.setViewportSize({ width, height:852 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    }
    const axe = await new AxeBuilder({ page }).analyze()
    expect(axe.violations.filter(item => item.impact === "serious" || item.impact === "critical")).toEqual([])
    await page.screenshot({ path: info.outputPath(`guided-review-${modality}-${theme}.png`), fullPage: true })
    await page.getByRole("button", { name: "Confirmar y crear temporada", exact: true }).click()
    await expect(page).toHaveURL(/\/$/)
    const stored = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem("smash-lob-season-data")!)
      const id = data.activeSeasonIds["league-smash-lob"]
      return { season: data.seasons.find((season: { id: string }) => season.id === id), settings: JSON.parse(localStorage.getItem("smash-lob-season-round-settings")!).find((settings: { seasonId: string }) => settings.seasonId === id) }
    })
    expect(stored.season.status).toBe("upcoming")
    expect(stored.settings.scheduleMode).toBe("double")
    expect(stored.settings.registrationFee.enabled).toBe(false)
    expect(stored.settings.requiresThreeSets).toBe(true)
    expect(stored.settings.mvpSystem).toBe("automatic_advanced")
    expect(stored.settings.calendarVisibilityMode).toBe("full")
  })
}

for (const theme of ["light", "dark"]) {
  test(`season creation separates duration and searches global opening venues (${theme})`, async ({ page }, info) => {
    await page.addInitScript(({ seasons, leagues, theme }) => {
      localStorage.setItem("smash-lob-theme-mode", theme)
      localStorage.setItem("smash-lob-visual-style", "competition")
      if (sessionStorage.getItem("qa-opening-global")) return
      sessionStorage.setItem("qa-opening-global", "1")
      localStorage.setItem("smash-lob-leagues", JSON.stringify(leagues.map(league => ({ ...league, locations: [] }))))
      localStorage.setItem("smash-lob-season-data", JSON.stringify({ seasons: seasons.map(season => ({ ...season, status: "finished" })), activeSeasonIds: { "league-smash-lob": "season-2" } }))
    }, { seasons: fixtureSeasons, leagues: fixtureLeagues, theme })
    await page.route("**/api/locations", route => route.fulfill({ json: { locations: [{ id: "qa-bilbao-global", name: "Club Zorrotza", town: "Bilbao", address: "Dirección oficial" }, { id: "qa-derio-global", name: "Club Derio", town: "Derio" }] } }))
    await page.setViewportSize({ width: 393, height: 852 })
    await page.goto("/admin/season")
    await page.getByRole("button", { name: "Configurar nueva temporada", exact: true }).click()
    await openSeasonAdvanced(page)
    await expect(page.getByText("Ubicaciones de la liga", { exact: true })).toHaveCount(0)
    const duration = page.getByRole("combobox", { name: "Tipo de duración", exact: true })
    const cycles = page.getByRole("combobox", { name: "Vueltas completas", exact: true })
    await expect(duration).toHaveValue("complete")
    await expect(cycles).toHaveValue("single")
    await cycles.selectOption("double")
    await duration.selectOption("custom")
    await expect(cycles).toHaveCount(0)
    await page.locator("[data-season-duration] input[type=number]").fill("5")
    await duration.selectOption("complete")
    await expect(cycles).toHaveValue("double")
    await page.locator("[data-season-duration]").screenshot({ path: info.outputPath(`duration-structure-${theme}.png`) })
    await page.getByRole("checkbox", { name: /^Jornada de Apertura especial/ }).check()
    await page.getByLabel("Fecha y hora de Jornada de Apertura", { exact: true }).fill("2099-10-20T09:00")
    await page.getByRole("button", { name: "Seleccionar ubicación", exact: true }).click()
    const picker = page.getByRole("dialog", { name: "Buscar ubicación", exact: true })
    await expect(picker).toBeVisible()
    await expect(picker.getByRole("button", { name: "+ Añadir nueva ubicación", exact: true })).toHaveCount(0)
    await picker.getByRole("searchbox").fill("Bilbao")
    await expect(picker.getByRole("button", { name: /Derio/ })).toHaveCount(0)
    await picker.getByRole("button", { name: "Bilbao - Club Zorrotza", exact: true }).click()
    await expect(picker).not.toBeVisible()
    await page.getByRole("button", { name: "Siguiente paso", exact: true }).click()
    const review = page.locator("[data-season-creation-summary]")
    await expect(review.getByText(/Bilbao - Club Zorrotza/)).toBeVisible()
    await expect(review.getByText("14", { exact: true })).toBeVisible()
    await expect(review.locator(".season-review-number")).toHaveCount(4)
    await review.locator("[data-season-review-roster] > summary").click()
    await expect(review.getByText("Davo", { exact: true })).toBeVisible()
    const axe = await new AxeBuilder({ page }).analyze()
    expect(axe.violations.filter(v => v.impact === "serious" || v.impact === "critical")).toEqual([])
    for (const width of [320, 393]) {
      await page.setViewportSize({ width, height: 852 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    }
    await page.screenshot({ path: info.outputPath(`visual-review-${theme}.png`), fullPage: true })
    await review.getByRole("button", { name: "Editar Inicio y visibilidad", exact: true }).click()
    await expect(page.getByRole("button", { name: "Bilbao - Club Zorrotza", exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Siguiente paso", exact: true }).click()
    await page.getByRole("button", { name: "Confirmar y crear temporada", exact: true }).click()
    await expect(page).toHaveURL(/\/$/)
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("smash-lob-season-round-settings")!).find((row: { openingRoundEnabled: boolean }) => row.openingRoundEnabled))
    expect(JSON.parse(stored.openingRoundLocation).name).toBe("Club Zorrotza")
    expect(stored.scheduleMode).toBe("double")
  })
}
