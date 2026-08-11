import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"

describe("v1.6.6 release smoke version contract", () => {
  it("pins PRE and PROD smoke checks to the current release", async () => {
    const pkg = JSON.parse(await readFile("package.json", "utf8"))

    expect(pkg.version).toBe("1.6.6")
    expect(pkg.scripts["smoke:pre"]).toBe(
      "node scripts/smoke-deployment.mjs https://pre.smashandlob.com 1.6.6 pre",
    )
    expect(pkg.scripts["smoke:prod"]).toBe(
      "node scripts/smoke-deployment.mjs https://smashandlob.com 1.6.6 prod",
    )
  })
})
