import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.9.1 round summary polish", () => {
  it("keeps the accent strip at the top and removes duplicate progress from the headline", async () => {
    const page = await readFile("src/app/round/[id]/page.tsx", "utf8")

    expect(page).toContain('<AppCard accentStrip className="overflow-hidden !p-0">')
    expect(page).toContain('? "Jornada completada"')
    expect(page).not.toContain('Jornada completada · ${metrics.finishedMatches}/${metrics.totalMatches} partidos')
    expect(page).toContain("{metrics.finishedMatches}/{metrics.totalMatches}")
  })

  it("reuses the PARTIDO pairing component for results without duplicating it in highlights", async () => {
    const page = await readFile("src/app/round/[id]/page.tsx", "utf8")
    const pairingUsages = page.match(/<MatchDetailPairingPanel/g) ?? []

    expect(page).toContain('import { MatchDetailPairingPanel } from "@/components/match/MatchDetailPairingPanel"')
    expect(pairingUsages).toHaveLength(1)
    expect(page).toContain("highlight.matchId")
    expect(page).toContain("linkPlayers={false}")
  })

  it("uses the actual season state and removes the floating round label from ranking", async () => {
    const page = await readFile("src/app/round/[id]/page.tsx", "utf8")

    expect(page).toContain('activeSeason.status === "finished"')
    expect(page).toContain('activeSeason.status === "upcoming"')
    expect(page).toContain("t.rounds.statusActive")
    expect(page).toContain("statusLabel={seasonStatusLabel}")
    expect(page).not.toContain('>J{round}</span>')
  })

  it("keeps the season-summary-style share action connected to the round export component", async () => {
    const page = await readFile("src/app/round/[id]/page.tsx", "utf8")
    const shareButton = await readFile("src/components/round/RoundSummaryShareButton.tsx", "utf8")

    expect(page).toContain('<RoundSummaryShareButton data={roundSummaryImageData} />')
    expect(page).not.toContain("El exportable de jornada se conectará en el siguiente desarrollo")
    expect(shareButton).toContain("Compartir resumen")
    expect(shareButton).toContain("Descargar resumen")
    expect(shareButton).toContain("bg-neutral-950 px-3 py-2.5")
  })

  it("marks match-based highlights with their real match id", async () => {
    const source = await readFile("src/lib/roundSummary.ts", "utf8")

    expect(source).toContain("matchId?: string")
    expect(source).toContain("matchId: closestMatch.match.id")
  })
})
