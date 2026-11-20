import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"

describe("v1.6.6 release smoke version contract", () => {
  it("pins PRE and PROD smoke checks to the package current release", async () => {
    const pkg = JSON.parse(await readFile("package.json", "utf8"))

    const currentVersion = pkg.version as string
    const finalVersion = currentVersion.replace(/-pre\.\d+$/, "") // PRE may carry X.Y.Z-pre.N; PROD and the changelog use X.Y.Z
    expect(pkg.scripts["smoke:pre"]).toBe(
      `node scripts/smoke-deployment.mjs https://pre.smashandlob.com ${currentVersion} pre`,
    )
    expect(pkg.scripts["smoke:prod"]).toBe(
      `node scripts/smoke-deployment.mjs https://smashandlob.com ${finalVersion} prod`,
    )
  })
})
