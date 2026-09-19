import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import jsQR from "jsqr"
import sharp from "sharp"

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

test("calendar view selector fits without horizontal scrolling", async ({ page }) => {
  await page.goto("/matches")
  const selector = page.locator('[data-tour="matches-scope"] > div')
  await expect(selector).toBeVisible()
  expect(await selector.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
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
  await page.getByRole("button", { name: "Compartir enlace de espectador" }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  const qrImage = dialog.getByRole("img", { name: /Código QR de espectadores/ })
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
  expect(download.suggestedFilename()).toMatch(/qr-espectador\.svg$/)

  await dialog.getByRole("button", { name: "Compartir" }).click()
  await expect(dialog.getByRole("status")).toContainText("Enlace de espectador compartido.")
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
  await expect(page.getByRole("navigation", { name: "Navegación de Mis partidos" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Mis partidos", exact: true })).toBeVisible()
  await expect(page.getByRole("link", { name: "Mis ligas", exact: true })).toBeVisible()
  await expect(page.getByRole("link", { name: "Mi perfil", exact: true })).toBeVisible()
  await expect(page.getByRole("link", { name: "+ Partido", exact: true })).toHaveCount(0)
  await expect(page.locator('[data-tour="floating-settings"]')).toHaveCount(1)
  await expect(page.locator('[data-tour="floating-help"]')).toHaveCount(0)
  await expect(page.locator('[data-tour="floating-notifications"]')).toHaveCount(0)
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
