import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.10.25 season preview availability", () => {
  it("keeps preview, selection and actions on the same available export", async () => {
    const source = await readFile(
      "src/components/statistics/SeasonShareExportsCard.tsx",
      "utf8",
    )

    expect(source).toContain(
      "exportOptions.find((option) => option.kind === activeKind && !option.disabled)",
    )
    expect(source).toContain("exportOptions.find((option) => !option.disabled)")
    expect(source).toContain("const resolvedActiveKind = activeOption?.kind ?? activeKind")
    expect(source).toContain("void createImage(resolvedActiveKind)")
    expect(source).toContain("active={resolvedActiveKind === option.kind}")
    expect(source).toContain('runAction(resolvedActiveKind, "share")')
    expect(source).toContain('runAction(resolvedActiveKind, "download")')
  })
})
