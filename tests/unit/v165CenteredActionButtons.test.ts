import { describe, expect, it } from "vitest"
import { readFile, readdir } from "node:fs/promises"
import path from "node:path"

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else if (/\.(tsx|jsx)$/.test(entry.name)) files.push(full)
  }
  return files
}

function openingTagEnd(source: string, start: number) {
  let quote: string | null = null
  let escaped = false
  let braceDepth = 0
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i]
    if (quote) {
      if (escaped) escaped = false
      else if (ch === "\\") escaped = true
      else if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue }
    if (ch === "{") { braceDepth += 1; continue }
    if (ch === "}") { braceDepth = Math.max(0, braceDepth - 1); continue }
    if (ch === ">" && braceDepth === 0) return i
  }
  return -1
}

function riskySimpleActions(source: string, file: string) {
  const findings: string[] = []
  for (const tag of ["button", "Link", "a"]) {
    const needle = `<${tag}`
    let cursor = 0
    while (true) {
      const start = source.indexOf(needle, cursor)
      if (start < 0) break
      const afterName = source[start + needle.length] ?? ""
      if (/[A-Za-z0-9_-]/.test(afterName)) { cursor = start + needle.length; continue }
      const end = openingTagEnd(source, start + needle.length)
      if (end < 0) break
      const opening = source.slice(start, end + 1)
      const match = /className\s*=\s*"([^"]*)"/.exec(opening)
      if (!match) { cursor = end + 1; continue }
      const close = source.indexOf(`</${tag}>`, end + 1)
      if (close < 0) { cursor = end + 1; continue }
      const body = source.slice(end + 1, close)
      const cls = match[1]
      const simple = body.trim().length > 0 && !body.includes("<")
      const action = /(?:^|\s)rounded(?:-|\[|\s)/.test(cls) && /(?:^|\s)(?:font-(?:black|bold|semibold|medium)|type-)/.test(cls) && /(?:^|\s)(?:bg-|border(?:-|\s))/.test(cls) && /(?:^|\s)(?:p[xytrbl]?-[^\s]+|h-[^\s]+|min-h-[^\s]+)/.test(cls)
      const intentionalSide = /(?:^|\s)(?:text-left|text-right|justify-start|justify-end|items-start|items-end)(?:\s|$)/.test(cls)
      const grid = /(?:^|\s)(?:grid|inline-grid)(?:\s|$)/.test(cls)
      if (simple && action && !intentionalSide && !grid) {
        const centered = ["items-center", "justify-center", "text-center"].every((token) => cls.split(/\s+/).includes(token))
        const flex = cls.split(/\s+/).some((token) => token === "flex" || token === "inline-flex")
        if (!centered || !flex) findings.push(`${file}: <${tag}> ${body.trim().replace(/\s+/g, " ").slice(0, 90)}`)
      }
      cursor = end + 1
    }
  }
  return findings
}

describe("v1.6.5 centered action buttons", () => {
  it("centers both finished-season HOME actions horizontally and vertically", async () => {
    const home = await readFile("src/app/page.tsx", "utf8")
    for (const marker of ["t.dashboard.historyAndStatistics", "t.dashboard.shareSeasonSummary"]) {
      const markerIndex = home.indexOf(marker)
      expect(markerIndex).toBeGreaterThan(-1)
      const start = home.lastIndexOf("<Link", markerIndex)
      const openingEnd = home.indexOf(">", start)
      const opening = home.slice(start, openingEnd + 1)
      expect(opening).toContain("items-center")
      expect(opening).toContain("justify-center")
      expect(opening).toContain("text-center")
      expect(opening.includes("flex") || opening.includes("inline-flex")).toBe(true)
    }
  })

  it("keeps every simple action control explicitly centered unless lateral alignment is intentional", async () => {
    const files = await walk("src")
    const findings: string[] = []
    for (const file of files) {
      const source = await readFile(file, "utf8")
      findings.push(...riskySimpleActions(source, file.replaceAll("\\", "/")))
    }
    expect(findings, findings.join("\n")).toEqual([])
  })
})
