import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.10.25 season preview availability", () => {
  it("keeps selection, floating preview and its actions on the same available export", async () => {
    const source = await readFile(
      "src/components/statistics/SeasonShareExportsCard.tsx",
      "utf8",
    )

    expect(source).toContain(
      "exportOptions.find((option) => option.kind === activeKind && !option.disabled)",
    )
    expect(source).toContain("exportOptions.find((option) => !option.disabled)")
    expect(source).toContain("const resolvedActiveKind = activeOption?.kind ?? activeKind")
    expect(source).toContain("openPreview(resolvedActiveKind)")
    expect(source).toContain("active={resolvedActiveKind === option.kind}")
    expect(source).toContain("setPreviewKind(kind)")
    expect(source).toContain("if (busyAction || !previewBlob || !previewKind) return")
    expect(source).toContain("getFilename(previewKind)")
  })
})
