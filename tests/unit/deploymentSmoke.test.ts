import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("deployment smoke checks", () => {
  it("exposes a cache-free version health endpoint", async () => {
    const health = await readFile("src/app/api/health/route.ts", "utf8")

    expect(health).toContain('status: "ok"')
    expect(health).toContain("APP_VERSION")
    expect(health).toContain('"Cache-Control": "no-store"')
    expect(health).toContain('"X-Smash-Lob-Version"')
  })

  it("checks PRE and PROD Avatar Lab behavior", async () => {
    const smoke = await readFile("scripts/smoke-deployment.mjs", "utf8")

    expect(smoke).toContain('expectedEnvironment === "prod"')
    expect(smoke).toContain("avatarPageResponse.status !== 404")
    expect(smoke).toContain("avatarApiResponse.status !== 404")
    expect(smoke).toContain("avatarApiResponse.status !== 401")
  })
})
