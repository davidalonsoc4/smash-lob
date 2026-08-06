import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("image crop dialog layout", () => {
  it("renders above app navigation in a body portal", async () => {
    const source = await readFile(
      "src/components/images/ImageCropDialog.tsx",
      "utf8",
    )

    expect(source).toContain('import { createPortal } from "react-dom"')
    expect(source).toContain("return createPortal(")
    expect(source).toContain("document.body")
    expect(source).toContain("z-[1000]")
    expect(source).toContain("items-center")
    expect(source).not.toContain("items-end")
  })

  it("keeps confirmation actions visible and adapts the crop viewport", async () => {
    const source = await readFile(
      "src/components/images/ImageCropDialog.tsx",
      "utf8",
    )

    expect(source).toContain("cropViewportSize")
    expect(source).toContain("window.innerWidth - 56")
    expect(source).toContain("window.innerHeight - 280")
    expect(source).toContain("min-h-0 overflow-y-auto")
    expect(source).toContain("grid shrink-0 grid-cols-2")
    expect(source).toContain("maxHeight")
  })
})
