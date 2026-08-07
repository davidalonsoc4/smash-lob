import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

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

test.beforeEach(async ({ page }) => {
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
        home: { tourKey: "home", tourVersion: 4, status: "completed", completedAt: "2026-08-06T00:00:00.000Z", skippedAt: null },
        matches: { tourKey: "matches", tourVersion: 2, status: "completed", completedAt: "2026-08-06T00:00:00.000Z", skippedAt: null },
        ranking: { tourKey: "ranking", tourVersion: 2, status: "completed", completedAt: "2026-08-06T00:00:00.000Z", skippedAt: null },
        statistics: { tourKey: "statistics", tourVersion: 2, status: "completed", completedAt: "2026-08-06T00:00:00.000Z", skippedAt: null },
        "season-admin": { tourKey: "season-admin", tourVersion: 2, status: "completed", completedAt: "2026-08-06T00:00:00.000Z", skippedAt: null },
        settings: { tourKey: "settings", tourVersion: 1, status: "completed", completedAt: "2026-08-06T00:00:00.000Z", skippedAt: null },
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
          isComplete: true,
          isSuperuser: false,
        },
      }),
    })
  })
})

test("@a11y authenticated screens have no serious Axe violations", async ({
  page,
}) => {
  for (const screen of screens) {
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
  }
})

test("@visual authenticated screens remain stable", async ({ page }) => {
  for (const screen of screens) {
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
  }
})


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
