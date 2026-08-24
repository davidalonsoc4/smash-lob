import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.24 share image previews", () => {
  it("opens the selected season export in the shared floating preview", async () => {
    const source = await read("src/components/statistics/SeasonShareExportsCard.tsx")

    expect(source).toContain('const [activeKind, setActiveKind] = useState<ExportKind>("calendar-current")')
    expect(source).toContain("<GeneratedImagePreviewModal")
    expect(source).toContain("openPreview(resolvedActiveKind)")
    expect(source).toContain('kind: "calendar-fixtures" as const')
    expect(source).toContain('kind: "ranking"')
    expect(source).toContain('kind: "summary" as const')
    expect(source).toContain('onSelect={() => setActiveKind(option.kind)}')
    expect(source).toContain("data-season-export-preview")
    expect(source).toContain("onDownload={downloadPreview}")
    expect(source).toContain("onShare={sharePreview}")
  })

  it("uses the same logo and player-image options when the modal image is generated", async () => {
    const source = await read("src/components/statistics/SeasonShareExportsCard.tsx")

    expect(source).toContain("includeLeagueLogo: hasLeagueLogo && includeLeagueLogo")
    expect(source).toContain("includePlayerImages")
    expect(source).toContain("createSeasonCalendarImage")
    expect(source).toContain("createSeasonRankingImage")
    expect(source).toContain("createSeasonSummaryImage")
    expect(source).toContain("setIncludeLeagueLogo((current) => !current)")
    expect(source).toContain("setIncludePlayerImages((current) => !current)")
  })

  it("opens the real round-summary PNG in the shared floating preview", async () => {
    const source = await read("src/components/round/RoundSummaryShareButton.tsx")

    expect(source).toContain("<GeneratedImagePreviewModal")
    expect(source).toContain("const createBlob = useCallback(() => createRoundSummaryImage(data), [data])")
    expect(source).toContain("const blob = await createBlob()")
    expect(source).toContain("navigator.canShare?.({ files: [file] })")
    expect(source).toContain("downloadRoundSummaryImage(previewBlob, filename)")
    expect(source).toContain("data-round-summary-preview")
  })

  it("keeps modal previews contained and revokes generated object URLs", async () => {
    const preview = await read("src/components/images/GeneratedImagePreviewModal.tsx")
    const season = await read("src/components/statistics/SeasonShareExportsCard.tsx")
    const round = await read("src/components/round/RoundSummaryShareButton.tsx")

    expect(preview).toContain("fixed inset-0 z-[120]")
    expect(preview).toContain("backdrop-blur-sm")
    expect(preview).toContain("object-contain")
    expect(preview).toContain("max-h-[72vh]")
    expect(season).toContain("URL.revokeObjectURL(previewUrlRef.current)")
    expect(round).toContain("URL.revokeObjectURL(previewUrlRef.current)")
  })
})
