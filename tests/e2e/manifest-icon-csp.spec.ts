import { expect, test } from "@playwright/test"
import path from "node:path"

test("PRE installation icons load under the actual response CSP", async ({ page }) => {
  // Serve fixtures locally through interception; never contact Production.
  const files = ["icon-pre-192.png", "icon-pre-512.png", "icon-maskable-pre-192.png", "icon-maskable-pre-512.png"]
  for (const file of files) {
    await page.route(`https://smashandlob.com/${file}`, (route) =>
      route.fulfill({ path: path.join(process.cwd(), "public", file), contentType: "image/png" }),
    )
  }
  await page.goto("/")
  const results = await page.evaluate(async (files) => {
    return Promise.all(files.map((file) => new Promise<{ loaded: boolean; width: number }>((resolve) => {
      const image = new Image()
      image.onload = () => resolve({ loaded: true, width: image.naturalWidth })
      image.onerror = () => resolve({ loaded: false, width: 0 })
      image.src = `https://smashandlob.com/${file}`
    })))
  }, files)
  expect(results).toEqual([
    { loaded: true, width: 192 }, { loaded: true, width: 512 },
    { loaded: true, width: 192 }, { loaded: true, width: 512 },
  ])
})
