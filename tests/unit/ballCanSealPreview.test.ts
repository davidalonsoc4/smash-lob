import { describe, expect, it } from "vitest"
import {
  BALL_CAN_SEAL_PRINT,
  buildBallCanSealPrintPieceHtml,
  buildBallCanSealPrintStyles,
} from "@/components/media-kit/BallCanSealPreview"

describe("Ball can seal print layout", () => {
  it("keeps the longer seal dimensions explicit", () => {
    expect(BALL_CAN_SEAL_PRINT.trimWidthMm).toBe(60)
    expect(BALL_CAN_SEAL_PRINT.trimHeightMm).toBe(15)
    expect(BALL_CAN_SEAL_PRINT.bleedMm).toBe(2)
    expect(BALL_CAN_SEAL_PRINT.printWidthMm).toBe(64)
    expect(BALL_CAN_SEAL_PRINT.printHeightMm).toBe(19)
  })

  it("centers the content and rotates the league mark for vertical mounting", () => {
    const styles = buildBallCanSealPrintStyles("#53B401")
    const html = buildBallCanSealPrintPieceHtml({
      leagueName: "Liga Norte",
      leagueLogoUrl: "https://example.com/league-logo.png",
      accent: "#53B401",
    })

    expect(styles).toContain("width: 60mm")
    expect(styles).toContain("align-items: center")
    expect(styles).toContain("transform: rotate(90deg)")
    expect(html).toContain('src="https://example.com/league-logo.png"')
    expect(html).toContain("Liga Norte")
  })
})
