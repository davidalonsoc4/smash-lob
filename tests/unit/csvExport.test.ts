import { describe, expect, it } from "vitest"
import {
  getExportSafeFilenamePart,
  protectSpreadsheetCell,
} from "@/lib/csvExport"

describe("spreadsheet exports", () => {
  it.each(["=2+2", "+SUM(A1:A2)", "-1+2", "@IMPORTXML(A1)"])(
    "neutralizes formula-like text: %s",
    (value) => {
      expect(protectSpreadsheetCell(value)).toBe(`'${value}`)
    },
  )

  it.each([" normal", "Smash & Lob", "", 12, true, null])(
    "keeps safe values unchanged: %s",
    (value) => {
      expect(protectSpreadsheetCell(value)).toBe(value)
    },
  )

  it("creates a filesystem-safe Spanish filename part", () => {
    expect(getExportSafeFilenamePart("  Liga Pádel / 2026  ")).toBe(
      "liga-padel-2026",
    )
  })
})
