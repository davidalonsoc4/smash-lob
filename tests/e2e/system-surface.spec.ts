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
        overlay: getComputedStyle(document.body, "::after").content,
      }))
      expect(surface.meta.length).toBeGreaterThan(0)
      expect(surface.meta.every((color) => color === (mode === "dark" ? "#000000" : "#ffffff"))).toBe(true)
      expect(surface.overlay).toBe("none")
      expect(surface.root).toBe(mode === "dark" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)")
      expect(surface.body).toBe(surface.root)
    })
  }
}
