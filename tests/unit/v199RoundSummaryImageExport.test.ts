import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.9.9 round summary image export", () => {
  it("connects the round share action to the real PNG generator", async () => {
    const page = await readFile("src/app/round/[id]/page.tsx", "utf8")
    const button = await readFile("src/components/round/RoundSummaryShareButton.tsx", "utf8")

    expect(page).toContain("<RoundSummaryShareButton data={roundSummaryImageData} />")
    expect(page).not.toContain("El exportable de jornada se conectará en el siguiente desarrollo")
    expect(button).toContain("createRoundSummaryImage(data)")
    expect(button).toContain("navigator.canShare?.({ files: [file] })")
    expect(button).toContain("downloadRoundSummaryImage(blob, filename)")
  })

  it("exports the agreed round content with season-style branding", async () => {
    const image = await readFile("src/lib/roundSummaryImage.ts", "utf8")

    for (const marker of [
      "RESUMEN DE JORNADA ${data.round}",
      'sectionTitle(context, "Resultados"',
      'sectionTitle(context, data.mvp.title',
      'sectionTitle(context, "Lo más destacado"',
      "sectionTitle(context, data.rankingTitle",
      'drawText(context, "Creado con"',
      'drawText(context, "Smash & Lob"',
    ]) {
      expect(image).toContain(marker)
    }
  })

  it("keeps the export tied to real round results, MVP configuration, highlights and historical ranking", async () => {
    const page = await readFile("src/app/round/[id]/page.tsx", "utf8")

    expect(page).toContain("results: roundMatches.map")
    expect(page).toContain('roundSettings.mvpSystem === "voting"')
    expect(page).toContain("highlights: highlights.map")
    expect(page).toContain("ranking: rankingThroughRound.map")
    expect(page).toContain('rankingTitle: isCompleted ? "Clasificación tras la jornada" : "Clasificación provisional"')
  })
})
