import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("opens the app without a session", async ({ page }) => {
  await page.goto("/")

  await expect(
    page.getByRole("button", { name: /google/i }),
  ).toBeVisible()
  await expect(page.getByRole("link", { name: "Privacidad" })).toBeVisible()
})

test("recovers an invitation when the installed app starts", async ({ page }) => {
  const invitationPath =
    "/invite/SL-FLOW-TEST?leagueId=019fc39c-26cf-43e1-9d4b-9439d3366675"

  await page.goto(invitationPath)
  await expect(
    page.getByRole("heading", { name: "Te han invitado a una liga" }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Continuar y unirme" }),
  ).toBeVisible()
  const recoveryCookie = (await page.context().cookies()).find(
    ({ name }) => name === "smash-lob-pending-access-intent",
  )
  expect(recoveryCookie).toBeDefined()
  expect(decodeURIComponent(recoveryCookie?.value ?? "")).toBe(invitationPath)

  await page.goto("/launch?source=pwa")

  await expect(page).toHaveURL(new RegExp(`${invitationPath.replace("?", "\\?")}$`))
})

test("spectator invitation opens a read-only league without signing in", async ({ page }) => {
  const code = "SL-PUBLIC-TEST"
  await page.route(`**/api/public-spectator/${code}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        league: { name: "Liga de prueba", description: "Competición de prueba", logoUrl: null },
        season: { name: "Temporada activa", status: "active", totalRounds: 4, completedRounds: 1 },
        visibility: "full",
        ranking: [{ position: 1, name: "Ana", points: 6, gamesDiff: 5, matchesPlayed: 2, wins: 2, losses: 0 }],
        matches: [{ round: 1, status: "finished", teams: [["Ana", "Luis"], ["Eva", "Raúl"]], score: { sets: [{ a: 6, b: 4 }], pointsA: 1, pointsB: 0 }, scheduledAt: null, location: null }],
      }),
    })
  })

  await page.goto(`/spectate/${code}/view`)
  await expect(page.getByRole("heading", { name: "Liga de prueba" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Clasificación" })).toBeVisible()
  await expect(page.getByText("Ana / Luis")).toBeVisible()
  await expect(page.getByText("Solo lectura · no se muestran datos personales ni actividad interna")).toBeVisible()
  await expect(page.getByRole("button", { name: /google/i })).toHaveCount(0)
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
