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

const accessibleScreens = [
  { name: "public home", path: "/" },
  { name: "about", path: "/about" },
  { name: "authentication error", path: "/auth/error?error=Configuration" },
] as const

for (const screen of accessibleScreens) {
  test(`@a11y ${screen.name} has no serious Axe violations`, async ({ page }) => {
    await page.goto(screen.path)
    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter(({ impact }) =>
      ["critical", "serious"].includes(impact ?? ""),
    )

    expect(serious, `${screen.path}: ${serious.map(({ id }) => id).join(", ")}`).toEqual([])
  })
}

test("@visual anonymous home remains stable", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("button", { name: /google/i })).toBeVisible()
  await page.addStyleTag({
    content: "nextjs-portal { display: none !important; }",
  })
  await expect(page).toHaveScreenshot("anonymous-home.png", {
    fullPage: true,
    animations: "disabled",
  })
})

test("@visual authentication error remains stable", async ({ page }) => {
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
