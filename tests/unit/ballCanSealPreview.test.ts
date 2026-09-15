import { describe, expect, it } from "vitest"
import {
  BALL_CAN_SEAL_PRINT,
  buildBallCanSealPrintPieceHtml,
  buildBallCanSealPrintStyles,
} from "@/components/media-kit/BallCanSealPreview"

describe("Ball can seal print layout", () => {
  it("keeps the taller vertical seal dimensions explicit", () => {
    expect(BALL_CAN_SEAL_PRINT.trimWidthMm).toBe(50)
    expect(BALL_CAN_SEAL_PRINT.trimHeightMm).toBe(35)
    expect(BALL_CAN_SEAL_PRINT.bleedMm).toBe(2)
    expect(BALL_CAN_SEAL_PRINT.printWidthMm).toBe(54)
    expect(BALL_CAN_SEAL_PRINT.printHeightMm).toBe(39)
  })

  it("centers the content and rotates the league mark for vertical mounting", () => {
    const styles = buildBallCanSealPrintStyles("#53B401")
    const html = buildBallCanSealPrintPieceHtml({
      leagueName: "Liga Norte",
      leagueLogoUrl: "https://example.com/league-logo.png",
      accent: "#53B401",
    })

    expect(styles).toContain("height: 35mm")
    expect(styles).toContain("align-items: center")
    expect(styles).toContain("transform: rotate(-90deg)")
    expect(html).toContain('src="https://example.com/league-logo.png"')
    expect(html).toContain("Liga Norte")
  })
})
