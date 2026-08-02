import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
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

async function getScreenshotDifferenceDiagnostics({
  actual,
  expectedPath,
}: {
  actual: Buffer
  expectedPath: string
}) {
  const [actualImage, expectedImage] = await Promise.all([
    sharp(actual).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(expectedPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ])

  if (
    actualImage.info.width !== expectedImage.info.width ||
    actualImage.info.height !== expectedImage.info.height
  ) {
    return `image-size actual=${actualImage.info.width}x${actualImage.info.height} expected=${expectedImage.info.width}x${expectedImage.info.height}`
  }

  let differentPixels = 0
  let minX = actualImage.info.width
  let minY = actualImage.info.height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < actualImage.info.height; y += 1) {
    for (let x = 0; x < actualImage.info.width; x += 1) {
      const offset = (y * actualImage.info.width + x) * 4
      const maximumChannelDifference = Math.max(
        Math.abs(actualImage.data[offset] - expectedImage.data[offset]),
        Math.abs(
          actualImage.data[offset + 1] - expectedImage.data[offset + 1],
        ),
        Math.abs(
          actualImage.data[offset + 2] - expectedImage.data[offset + 2],
        ),
        Math.abs(
          actualImage.data[offset + 3] - expectedImage.data[offset + 3],
        ),
      )

      if (maximumChannelDifference <= 16) continue

      differentPixels += 1
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }

  return differentPixels === 0
    ? "raw-diff none above channel threshold 16"
    : `raw-diff pixels=${differentPixels} bounds=(${minX},${minY})-(${maxX},${maxY})`
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("smash-lob-theme-mode", "light")
    window.localStorage.setItem("smash-lob-visual-style", "plain")
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

test("@visual authenticated screens remain stable", async ({
  page,
}, testInfo) => {
  for (const screen of screens) {
    await page.goto(screen.path)
    await expect(page.locator("main")).toBeVisible()
    await page.addStyleTag({
      content: "nextjs-portal { display: none !important; }",
    })
    const snapshotName = `authenticated-${screen.name}.png`

    try {
      await expect(page).toHaveScreenshot(snapshotName, {
        fullPage: true,
        animations: "disabled",
      })
    } catch (error) {
      const actual = await page.screenshot({
        fullPage: true,
        animations: "disabled",
      })
      const diagnostics = await getScreenshotDifferenceDiagnostics({
        actual,
        expectedPath: testInfo.snapshotPath(snapshotName),
      })

      throw new Error(
        `${error instanceof Error ? error.message : String(error)}\n${diagnostics}`,
      )
    }
  }
})
