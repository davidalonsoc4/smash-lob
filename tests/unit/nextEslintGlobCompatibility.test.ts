import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { Linter } from "eslint"

const require = createRequire(import.meta.url)
const { getRootDirs } = require("@next/eslint-plugin-next/dist/utils/get-root-dirs.js")
const nextPlugin = require("@next/eslint-plugin-next")

describe("Next ESLint scoped glob replacement", () => {
  let workspace: string

  beforeEach(() => {
    workspace = mkdtempSync(path.join(tmpdir(), "next-eslint-glob-"))
    for (const app of ["web", "admin"]) {
      mkdirSync(path.join(workspace, "apps", app, "pages"), { recursive: true })
      writeFileSync(path.join(workspace, "apps", app, "pages", "about.tsx"), "export default function About() { return null }")
    }
    writeFileSync(path.join(workspace, "apps", "README.md"), "not a directory")
  })

  afterEach(() => rmSync(workspace, { recursive: true, force: true }))

  const normalized = (dirs: string[]) => dirs.map((dir) => path.resolve(dir)).sort()

  it("resolves directory wildcards without including files", () => {
    const roots = getRootDirs({ cwd: workspace, settings: { next: { rootDir: `${workspace}/apps/*` } } })
    expect(normalized(roots)).toEqual(normalized([path.join(workspace, "apps", "web"), path.join(workspace, "apps", "admin")]))
  })

  it("retains default, missing, brace and array root settings including Windows separators", () => {
    const context = { cwd: workspace, settings: {} }
    expect(getRootDirs(context)).toEqual([workspace])
    expect(getRootDirs({ ...context, settings: { next: { rootDir: `${workspace}/absent/*` } } })).toEqual([])
    const expected = normalized([path.join(workspace, "apps", "web"), path.join(workspace, "apps", "admin")])
    expect(normalized(getRootDirs({ ...context, settings: { next: { rootDir: `${workspace}/apps/{web,admin}` } } }))).toEqual(expected)
    expect(normalized(getRootDirs({ ...context, settings: { next: { rootDir: [path.join(workspace, "apps", "web").replaceAll("/", "\\"), `${workspace}/apps/admin`] } } }))).toEqual(expected)
  })

  it("still reports the Next navigation rule for pages discovered through a glob", () => {
    const messages = new Linter().verify('const Page = () => <a href="/about">About</a>', [{
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      plugins: { "@next/next": nextPlugin },
      settings: { next: { rootDir: `${workspace}/apps/*` } },
      rules: { "@next/next/no-html-link-for-pages": "error" },
    }])
    expect(messages.map((message) => message.ruleId)).toContain("@next/next/no-html-link-for-pages")
  })
})
