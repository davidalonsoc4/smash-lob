import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("image crop dialog layout", () => {
  it("renders above app navigation in a body portal", async () => {
    const source = await readFile(
      "src/components/images/ImageCropDialog.tsx",
      "utf8",
    )

    expect(source).toContain("<FloatingDialog open")
    expect(source).toContain('variant="content"')
    expect(source).toContain("busy={isSaving}")
    expect(source).toContain("requestCancel")
    const shared = await readFile("src/components/ui/FloatingDialog.tsx", "utf8")
    expect(shared).toContain("createPortal")
    expect(shared).toContain("document.body")
    expect(shared).toContain("showModal()")
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
    const css = await readFile("src/app/globals.css", "utf8")
    expect(css).toContain(".app-dialog-crop")
  })
})
