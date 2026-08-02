import { expect, test } from "@playwright/test"

test("shows the offline fallback instead of a cached login screen", async ({
  context,
  page,
}) => {
  await page.goto("/")
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))

  await context.setOffline(true)

  await expect(
    page.getByRole("heading", { name: "Sin conexión" }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Entrar con Google" }),
  ).toHaveCount(0)

  await page.goto("/")

  await expect(
    page.getByRole("heading", { name: "Sin conexión" }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Entrar con Google" }),
  ).toHaveCount(0)

  await context.setOffline(false)
  await page.getByRole("link", { name: "Reintentar" }).click()

  await expect(
    page.getByRole("button", { name: "Entrar con Google" }),
  ).toBeVisible()
})
