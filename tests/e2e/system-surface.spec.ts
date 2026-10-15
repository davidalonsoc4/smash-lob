import { expect, test } from "@playwright/test"

for (const style of ["classic", "competition"]) {
  for (const mode of ["dark", "light"]) {
    test(`installed app ${style} ${mode} has matching metadata without a bottom overlay`, async ({ page }) => {
      await page.addInitScript(({ style, mode }) => {
        localStorage.setItem("smash-lob-theme-mode", mode)
        localStorage.setItem("smash-lob-visual-style", style)
        const nativeMatchMedia = window.matchMedia.bind(window)
        window.matchMedia = (query) => {
          const result = nativeMatchMedia(query)
          if (query === "(display-mode: standalone)") Object.defineProperty(result, "matches", { value: true })
          return result
        }
      }, { style, mode })
      await page.goto("/")
      await expect(page.locator("html")).toHaveAttribute("data-theme", mode)
      // Activate the real standalone rules in desktop Chromium's CSSOM.
      // This checks cascade/layout, not a native Android/iOS system bar.
      await page.evaluate(() => {
        for (const sheet of document.styleSheets) {
          for (const rule of sheet.cssRules) {
            if (rule instanceof CSSMediaRule && rule.conditionText.includes("display-mode: standalone")) rule.media.mediaText = "all"
          }
        }
      })
      const surface = await page.evaluate(() => ({
        meta: [...document.querySelectorAll('meta[name="theme-color"]')].map((meta) => meta.getAttribute("content")),
        root: getComputedStyle(document.documentElement).backgroundColor,
        body: getComputedStyle(document.body).backgroundColor,
        scheme: getComputedStyle(document.documentElement).colorScheme,
        overlay: getComputedStyle(document.body, "::after").content,
      }))
      expect(surface.meta.length).toBeGreaterThan(0)
      expect(surface.meta.every((color) => color === "#000000")).toBe(true)
      expect(surface.overlay).toBe("none")
      expect(surface.root).toBe("rgb(0, 0, 0)")
      expect(surface.body).toBe(surface.root)
      expect(surface.scheme).toBe(mode)
      for (const routeState of ["bottomNavVisible", "matchChatActive"]) {
        const routeBody = await page.evaluate((key) => {
          document.documentElement.dataset[key] = "true"
          const color = getComputedStyle(document.body).backgroundColor
          delete document.documentElement.dataset[key]
          return color
        }, routeState)
        expect(routeBody).toBe("rgb(0, 0, 0)")
      }
    })
  }
}
