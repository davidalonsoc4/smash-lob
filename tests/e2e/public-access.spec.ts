import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("opens the app without a session", async ({ page }) => {
  await page.goto("/")

  await expect(
    page.getByRole("button", { name: /google/i }),
  ).toBeVisible()
  await expect(page.getByRole("link", { name: "Privacidad" })).toBeVisible()
})

test("shows an actionable authentication error with an incidence code", async ({
  page,
}) => {
  await page.goto("/auth/error?error=Configuration")

  await expect(
    page.getByRole("heading", { name: "No se ha podido iniciar sesión" }),
  ).toBeVisible()
  await expect(page.getByText(/^Código de incidencia: SL-[A-F0-9]{8}$/)).toBeVisible()
})

test("@a11y public and authentication screens have no serious Axe violations", async ({
  page,
}) => {
  for (const path of ["/", "/about", "/auth/error?error=Configuration"]) {
    await page.goto(path)
    const results = await new AxeBuilder({ page })
      .analyze()
    const serious = results.violations.filter(({ impact }) =>
      ["critical", "serious"].includes(impact ?? ""),
    )

    expect(serious, `${path}: ${serious.map(({ id }) => id).join(", ")}`).toEqual([])
  }
})

test("@visual public screens remain stable", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("button", { name: /google/i })).toBeVisible()
  await page.addStyleTag({
    content: "nextjs-portal { display: none !important; }",
  })
  await expect(page).toHaveScreenshot("anonymous-home.png", {
    fullPage: true,
    animations: "disabled",
  })

  await page.goto("/auth/error?error=Configuration")
  const incidenceCode = page.getByText(/^Código de incidencia:/)
  await page.addStyleTag({
    content: "nextjs-portal { display: none !important; }",
  })
  await expect(page).toHaveScreenshot("auth-error.png", {
    fullPage: true,
    animations: "disabled",
    mask: [incidenceCode],
  })
})
