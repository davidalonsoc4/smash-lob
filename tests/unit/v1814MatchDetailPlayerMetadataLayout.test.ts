import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.14 match detail player metadata layout", () => {
  it("mirrors league metadata and supports play profile in friendly results", async () => {
    const panel = await readFile("src/components/match/MatchDetailPairingPanel.tsx", "utf8")

    expect(panel).toContain('metadataPlacement: "before-name" | "after-name"')
    expect(panel).toContain('metadataPlacement={index === 0 ? "before-name" : "after-name"}')
    expect(panel).toContain('const positionLine = <p className={metadataClass}>{position ? tx(`#${position} en liga`) : "\\u00a0"}</p>')
    expect(panel).toContain("const playLine = playerPositionLabel ? (")
    expect(panel).toContain(`<>
              {showRankingPosition ? positionLine : null}
              {playLine}
              {nameLine}
            </>`)
    expect(panel).toContain(`<>
              {nameLine}
              {playLine}
              {showRankingPosition ? positionLine : null}
            </>`)
    expect(panel).toContain("min-h-4 type-caption font-bold uppercase leading-4 tracking-wide text-neutral-500")
    expect(panel).toContain("showPendingPlayerMetadata?: boolean")
    expect(panel).toContain("showFinishedPlayerMetadata?: boolean")
    expect(panel).toContain("const showPendingMetadata = pendingPlayerMetadata || showRankingPosition")
    expect(panel.match(/showMetadata=\{showPendingMetadata\}/g) ?? []).toHaveLength(2)

    const finishedPlayer = panel.slice(
      panel.indexOf("function FinishedPlayerName({"),
      panel.indexOf("function FinishedPairRow({"),
    )
    expect(finishedPlayer).toContain("getPlayerSideAndHandLabel")
    expect(finishedPlayer).toContain("showPlayerMetadata && playerPositionLabel")
    expect(finishedPlayer).not.toContain("en liga")
    expect(finishedPlayer).toContain("type-player-name-prominent")
  })
})
