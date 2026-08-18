import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.4 preset-driven media kit customizer", () => {
  it("loads every campaign preset into one shared preview before sharing", async () => {
    const page = await read("src/app/admin/media-kit/page.tsx")

    expect(page).toContain("const presets =")
    expect(page).toContain("function loadPreset")
    expect(page).toContain("setActivePresetKind(kind)")
    expect(page).toContain("compactPresetTitles")
    expect(page).toContain('aria-label="Personalización"')
    expect(page).toContain('aria-label="Vista previa"')
    expect(page).toContain('setWorkspaceView("preview")')
    expect(page).toContain("aria-pressed={isActive}")
    expect(page).toContain("sharePiece(activePresetKind, openingData)")
    expect(page.indexOf(">Presets<")).toBeLessThan(page.indexOf('id="media-kit-customizer"'))
  })

  it("renames the editor and its editable fields around the active composition", async () => {
    const page = await read("src/app/admin/media-kit/page.tsx")

    for (const label of [
      "Personalizaci",
      ">Titular<",
      "Subt",
      "Bloque destacado",
      "Dato central",
      "Etiqueta izquierda",
      "Etiqueta derecha",
    ]) expect(page).toContain(label)
    expect(page).toContain("compactPresetTitles[activePresetKind]")
    expect(page).toContain('alt="Vista previa del cartel activo"')
  })

  it("adds an expandable custom accent color without removing the curated palette", async () => {
    const page = await read("src/app/admin/media-kit/page.tsx")

    expect(page).toContain("openingAccentOptions.map")
    expect(page).toContain("showCustomAccent")
    expect(page).toContain("customAccentDraft")
    expect(page).toContain("aria-expanded={showCustomAccent}")
    expect(page).toContain('aria-label="Color personalizado"')
    expect(page).toContain('aria-label="Selector de color personalizado"')
    expect(page).toContain('aria-label="C')
    expect(page).toContain("/^#[0-9a-f]{6}$/i")
  })

  it("adds the frequent green and automatic logo-based accent suggestions", async () => {
    const page = await read("src/app/admin/media-kit/page.tsx")

    expect(page).toContain('"#53B401"')
    expect(page).toContain("extractLogoAccentPalette")
    expect(page).toContain("Sugeridos por el logo")
    expect(page).toContain("logoAccentSuggestions.map")
    expect(page).toContain("openingLogoOverride ?? activeLeague.logoUrl")
  })

  it("prefills Inicio with dynamic players and rounds plus the new campaign copy", async () => {
    const page = await read("src/app/admin/media-kit/page.tsx")

    expect(page).toContain('subtitle: "Volvemos con más ganas"')
    expect(page).toContain('roundLabel: `${players.length} jugadores`')
    expect(page).toContain('eventTimeLabel: "1 campeón"')
    expect(page).toContain('venue: `${activeSeason.totalRounds} jornadas`')
  })
})
