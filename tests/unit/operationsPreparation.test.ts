import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("external operations remain explicit and safely disabled", () => {
  it("protects release branches without requiring pull requests", async () => {
    const ruleset = JSON.parse(
      await readFile("quality/github/release-branches-ruleset.json", "utf8"),
    )
    expect(ruleset.conditions.ref_name.include).toEqual([
      "refs/heads/main",
      "refs/heads/staging",
    ])
    expect(ruleset.rules.map((rule: { type: string }) => rule.type)).toEqual([
      "deletion",
      "non_fast_forward",
    ])
  })

  it("keeps PRE account checks outside the local Playwright suite", async () => {
    const localConfig = await readFile("playwright.config.ts", "utf8")
    const qaConfig = await readFile("playwright.qa.config.ts", "utf8")

    expect(localConfig.match(/\*\*\/qa-pre\.spec\.ts/g)).toHaveLength(2)
    expect(qaConfig).toContain('testMatch: "**/qa-pre.spec.ts"')
    expect(qaConfig).toContain('baseURL: "https://pre.smashandlob.com"')
  })

  it("keeps remote QA and backups disabled until repository variables enable them", async () => {
    const qa = await readFile(".github/workflows/qa-pre.yml", "utf8")
    const backup = await readFile(".github/workflows/supabase-backup.yml", "utf8")

    expect(qa).toContain("vars.QA_PRE_ENABLED == 'true'")
    expect(qa).toContain("secrets.QA_PRE_STORAGE_STATE_B64")
    expect(backup).toContain("vars.SUPABASE_BACKUP_ENABLED == 'true'")
    expect(backup).toContain("BACKUP_ENCRYPTION_PASSPHRASE")
    expect(backup).toContain("*.gpg")
    expect(backup).not.toContain("path: .quality-artifacts/backups/*.sql")
  })
})
