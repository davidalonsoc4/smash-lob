import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.11.0 shared export chrome R33", () => {
  it("uses one shared header and footer implementation for season summary and finance transparency", async () => {
    const [chrome, summary, finance] = await Promise.all([
      readFile("src/lib/exportImageChrome.ts", "utf8"),
      readFile("src/lib/seasonSummaryImage.ts", "utf8"),
      readFile("src/lib/seasonFinanceTransparencyImage.ts", "utf8"),
    ])

    expect(chrome).toContain("export const SHARED_EXPORT_HEADER_HEIGHT = 254")
    expect(chrome).toContain('export const SHARED_EXPORT_APP_ICON_PATH = "/icon-192.png"')
    expect(chrome).toContain("height: 48")
    expect(chrome).toContain("height: 84")
    expect(chrome).toContain("export function drawSharedExportHeader")
    expect(chrome).toContain("export function drawSharedExportFooter")

    for (const source of [summary, finance]) {
      expect(source).toContain('from "@/lib/exportImageChrome"')
      expect(source).toContain("drawSharedExportHeader({")
      expect(source).toContain("drawSharedExportFooter({")
      expect(source).toContain("SHARED_EXPORT_HEADER_HEIGHT")
      expect(source).toContain("SHARED_EXPORT_APP_ICON_PATH")
    }

    expect(summary).not.toContain("function drawHeader({")
    expect(summary).not.toContain("function drawFooter({")
    expect(finance).not.toContain("function drawExportHeader({")
    expect(finance).not.toContain("function drawFooter({")
    expect(finance).toContain("function drawRoundedRect(")
    expect(finance).toContain("function drawText(")
  })
})
