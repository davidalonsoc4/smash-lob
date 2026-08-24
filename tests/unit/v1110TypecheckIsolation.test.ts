import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("v1.11.0 typecheck isolation", () => {
  it("generates route types before running the standalone typecheck", () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as {
      scripts?: Record<string, string>
    }

    expect(packageJson.scripts?.typecheck).toBe(
      "next typegen && tsc --noEmit --incremental false -p tsconfig.build.json",
    )
  })

  it("never typechecks mutable next dev artifacts in validation/build", () => {
    const config = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "tsconfig.build.json"), "utf8"),
    ) as { include?: string[]; exclude?: string[] }

    expect(config.include).toContain("next-env.d.ts")
    expect(config.include).toContain(".next/types/**/*.ts")
    expect(config.exclude).toContain(".next/dev")
  })

  it("uses the isolated config for non-development Next commands", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "next.config.ts"), "utf8")

    expect(source).toContain(
      'process.env.NODE_ENV === "development" ? "tsconfig.json" : "tsconfig.build.json"',
    )
  })
})
