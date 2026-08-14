import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.7 match detail initial coordination status", () => {
  it("uses the access snapshot status before the detailed coordination request resolves", async () => {
    const detail = await readFile("src/app/match/[id]/page.tsx", "utf8")
    expect(detail).toContain("coordinationStatus={loadedCoordinationMatchId === matchId && coordination")
    expect(detail).toContain("setLoadedCoordinationMatchId(matchId)")
    expect(detail).toContain(": match.coordinationStatus ?? null}")
    expect(detail).toContain('/coordination`, { cache: "no-store" }')
    expect(detail).not.toContain('? coordination.status\n          : null\n      }')
  })

  it("lets the detailed coordination state override the snapshot once it exists", async () => {
    const detail = await readFile("src/app/match/[id]/page.tsx", "utf8")
    expect(detail).toContain('coordination.status === "coordinating" || coordination.status === "awaiting_booking" ? coordination.status : null')
  })
})
