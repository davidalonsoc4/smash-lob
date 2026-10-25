import { expect, type Page } from "@playwright/test"

export async function openSeasonAdvanced(page: Page) {
  await page.getByRole("button", { name: "Personalizar ajustes avanzados", exact: true }).click()
  const sections = page.locator("[data-season-creation-advanced] > details")
  for (const section of await sections.all()) {
    if (await section.getAttribute("open") === null) await section.locator(":scope > summary").click()
  }
}

export async function confirmSeasonCreation(page: Page) {
  if (await page.locator("[data-season-creation-step]").getAttribute("data-season-creation-step") !== "summary") await page.getByRole("button", { name: "Siguiente paso", exact: true }).click()
  const confirm = page.getByRole("button", { name: "Confirmar y crear temporada", exact: true })
  await expect(confirm).toBeEnabled()
  await confirm.click()
}
