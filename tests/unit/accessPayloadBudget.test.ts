import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("initial access payload budget", () => {
  it("measures and reports oversized snapshots", async () => {
    const route = await readFile("src/app/api/access/route.ts", "utf8")
    const log = await readFile("src/lib/serverLog.ts", "utf8")

    expect(route).toContain("Buffer.byteLength(body)")
    expect(route).toContain("responseBytes > 1024 * 1024")
    expect(route).toContain("access_snapshot_over_budget")
    expect(route).toContain('"X-Smash-Lob-Snapshot-Bytes"')
    expect(route).toContain('"Cache-Control": "no-store"')
    expect(log).toContain("responseBytes?: number")
  })
})
