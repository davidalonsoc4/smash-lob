import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.14 match detail player metadata layout", () => {
  it("uses mirrored three-line metadata only before a result", async () => {
    const panel = await readFile("src/components/match/MatchDetailPairingPanel.tsx", "utf8")

    expect(panel).toContain('metadataPlacement: "before-name" | "after-name"')
    expect(panel).toContain('metadataPlacement={index === 0 ? "before-name" : "after-name"}')
    expect(panel).toContain('const positionLine = <p className={metadataClass}>{position ? `#${position} en liga` : "\\u00a0"}</p>')
    expect(panel).toContain('const playLine = <p className={metadataClass}>{playerPositionLabel ?? "\\u00a0"}</p>')
    expect(panel).toContain(`<>\n              {positionLine}\n              {playLine}\n              {nameLine}\n            </>`)
    expect(panel).toContain(`<>\n              {nameLine}\n              {playLine}\n              {positionLine}\n            </>`)
    expect(panel).toContain('min-h-4 type-caption font-bold uppercase leading-4 tracking-wide text-neutral-500')
    expect(panel).toContain("const showPendingMetadata = Object.keys(rankingPositions).length > 0")
    expect(panel.match(/showMetadata=\{showPendingMetadata\}/g) ?? []).toHaveLength(2)

    const finishedPlayer = panel.slice(
      panel.indexOf("function FinishedPlayerName({"),
      panel.indexOf("function FinishedPairRow({"),
    )
    expect(finishedPlayer).not.toContain("getPlayerSideAndHandLabel")
    expect(finishedPlayer).not.toContain("position")
    expect(finishedPlayer).toContain("type-player-name-prominent")
  })
})
