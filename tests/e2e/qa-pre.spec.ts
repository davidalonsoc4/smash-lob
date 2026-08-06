import { expect, test } from "@playwright/test"

const authenticatedRoutes = ["/", "/matches", "/ranking", "/statistics", "/settings"]

test("real PRE account can open the main authenticated routes", async ({ page }) => {
  for (const route of authenticatedRoutes) {
    await page.goto(route)
    await expect(page).not.toHaveURL(/\/api\/auth\/signin|\/auth\/error/)
    await expect(page.locator("main")).toBeVisible()
  }
})

test("normal QA account receives the public changelog", async ({ page }) => {
  await page.goto("/changelog")
  await expect(page.getByText("Información pública", { exact: true })).toBeVisible()
  await expect(page.getByText("Detalle superadmin", { exact: true })).toHaveCount(0)
})
