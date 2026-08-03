import { expect, test } from "@playwright/test"

test("keeps an authenticated session behind the offline fallback until a full retry", async ({
  context,
  page,
}) => {
  await context.addInitScript(() => {
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
  await context.route("**/api/auth/session", async (route) => {
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
  await context.route("**/api/account/profile", async (route) => {
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

  await page.goto("/")
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await expect(
    page.getByRole("link", { name: "Inicio", exact: true }),
  ).toBeVisible()

  await context.setOffline(true)
  await page.evaluate(() => {
    window.dispatchEvent(new Event("offline"))
  })

  await expect(
    page.getByRole("heading", { name: "Sin conexión" }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Entrar con Google" }),
  ).toHaveCount(0)

  await context.setOffline(false)
  await expect(
    page.getByRole("heading", { name: "Sin conexión" }),
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Completa tu perfil" }),
  ).toHaveCount(0)

  await page.getByRole("button", { name: "Reintentar" }).click()
  await expect(page).toHaveURL("/")
  await expect(
    page.getByRole("button", { name: "Entrar con Google" }),
  ).toHaveCount(0)
  await expect(
    page.getByRole("heading", { name: "Completa tu perfil" }),
  ).toHaveCount(0)
})

test("redirects a fresh offline launch to the cached fallback", async ({
  context,
  page,
}) => {
  await page.goto("/")
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))

  await context.setOffline(true)
  await page.close()

  const relaunchedPage = await context.newPage()
  await relaunchedPage.goto("/")

  await expect(relaunchedPage).toHaveURL("/offline")
  await expect(
    relaunchedPage.getByRole("heading", { name: "Sin conexión" }),
  ).toBeVisible()
  await expect(
    relaunchedPage.getByRole("button", { name: "Entrar con Google" }),
  ).toHaveCount(0)
})
