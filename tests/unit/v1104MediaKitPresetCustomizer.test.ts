import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.4 preset-driven media kit customizer", () => {
  it("loads every campaign preset into one shared preview before sharing", async () => {
    const page = await read("src/app/admin/media-kit/page.tsx")

    expect(page).toContain("const presets =")
    expect(page).toContain("presetOrder.indexOf(first.kind)")
    expect(page).toContain("function loadPreset")
    expect(page).toContain("setActivePresetKind(kind)")
    expect(page).toContain("compactPresetTitles")
    expect(page).toContain('aria-label={tx("Personalización")}')
    expect(page).toContain('aria-label={tx("Vista previa")}')
    expect(page).toContain('setWorkspaceView("preview")')
    expect(page).toContain("aria-pressed={isActive}")
    expect(page).toContain('whitespace-nowrap type-micro font-black uppercase tracking-[.1em]')
    expect(page).toContain("sharePiece(activePresetKind, openingData)")
    expect(page.indexOf(">Presets<")).toBeLessThan(page.indexOf('id="media-kit-customizer"'))
  })

  it("orders presets from league setup through season closure", async () => {
    const page = await read("src/app/admin/media-kit/page.tsx")
    const order = page.slice(page.indexOf("const presetOrder"), page.indexOf("const openingHeadlineFontOptions"))

    for (const [first, second] of [
      ['"format"', '"registration"'],
      ['"registration"', '"start"'],
      ['"start"', '"opening"'],
      ['"opening"', '"matchday"'],
      ['"matchday"', '"results"'],
      ['"results"', '"standings"'],
      ['"mvp"', '"season_final"'],
    ]) expect(order.indexOf(first)).toBeLessThan(order.indexOf(second))
  })

  it("renames the editor and its editable fields around the active composition", async () => {
    const page = await read("src/app/admin/media-kit/page.tsx")

    for (const label of [
      "Personalizaci",
      'tx("Titular")',
      "Subt",
      "Bloque destacado",
      "Dato central",
      "Etiqueta izquierda",
      "Etiqueta derecha",
    ]) expect(page).toContain(label)
    expect(page).toContain("compactPresetTitles[activePresetKind]")
    expect(page).toContain('alt={tx("Vista previa del cartel activo")}')
  })

  it("adds an expandable custom accent color without removing the curated palette", async () => {
    const shell = await read("src/components/media-kit/MediaKitWorkspaceShell.tsx")

    expect(shell).toContain("MEDIA_KIT_ACCENT_OPTIONS.map")
    expect(shell).toContain("showCustom")
    expect(shell).toContain("customDraft")
    expect(shell).toContain('tx("+ Propio")')
    expect(shell).toContain('aria-label={tx("Selector de color personalizado")}')
    expect(shell).toContain('aria-label={tx("Código hexadecimal personalizado")}')
    expect(shell).toContain('aria-label={tx(`Usar color ${color}`)}')
    expect(shell).toContain("/^#[0-9a-f]{6}$/i")
  })

  it("adds the frequent green and automatic logo-based accent suggestions", async () => {
    const [page, shell, theme] = await Promise.all([
      read("src/app/admin/media-kit/page.tsx"),
      read("src/components/media-kit/MediaKitWorkspaceShell.tsx"),
      read("src/lib/mediaKitTheme.ts"),
    ])

    expect(theme).toContain('"#53B401"')
    expect(shell).toContain("extractLogoAccentPalette")
    expect(shell).toContain("Sugeridos por el logo")
    expect(shell).toContain("logoColors.map")
    expect(page).toContain("openingLogoOverride ?? activeLeague.logoUrl")
  })

  it("prefills Inicio with dynamic players and rounds plus the new campaign copy", async () => {
    const page = await read("src/app/admin/media-kit/page.tsx")

    expect(page).toContain('subtitle: "Volvemos con más ganas"')
    expect(page).toContain('roundLabel: tx(`${players.length} jugadores`)')
    expect(page).toContain('eventTimeLabel: "1 campeón"')
    expect(page).toContain('venue: tx(`${activeSeason.totalRounds} jornadas`)')
  })
})
