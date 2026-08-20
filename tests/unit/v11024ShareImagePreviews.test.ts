import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.24 share image previews", () => {
  it("uses one real preview workspace for the selected season export", async () => {
    const source = await read("src/components/statistics/SeasonShareExportsCard.tsx")

    expect(source).toContain('const [activeKind, setActiveKind] = useState<ExportKind>("calendar-current")')
    expect(source).toContain("<GeneratedImagePreview")
    expect(source).toContain("createImage(resolvedActiveKind)")
    expect(source).toContain('kind: "calendar-fixtures" as const')
    expect(source).toContain('kind: "ranking"')
    expect(source).toContain('kind: "summary" as const')
    expect(source).toContain('onSelect={() => { refreshPreviewState(); setActiveKind(option.kind) }}')
    expect(source).toContain('onClick={() => void runAction(resolvedActiveKind, "share")}')
    expect(source).toContain('onClick={() => void runAction(resolvedActiveKind, "download")}')
  })

  it("regenerates the season preview from the same logo and player-image options used by downloads", async () => {
    const source = await read("src/components/statistics/SeasonShareExportsCard.tsx")

    expect(source).toContain("includeLeagueLogo: hasLeagueLogo && includeLeagueLogo")
    expect(source).toContain("includePlayerImages")
    expect(source).toContain("createSeasonCalendarImage")
    expect(source).toContain("createSeasonRankingImage")
    expect(source).toContain("createSeasonSummaryImage")
    expect(source).toContain("refreshPreviewState(); setIncludeLeagueLogo")
    expect(source).toContain("refreshPreviewState(); setIncludePlayerImages")
  })

  it("previews the real round-summary blob before the existing share and download actions", async () => {
    const source = await read("src/components/round/RoundSummaryShareButton.tsx")

    expect(source).toContain("<GeneratedImagePreview")
    expect(source).toContain("const createBlob = useCallback(() => createRoundSummaryImage(data), [data])")
    expect(source).toContain("void createBlob()")
    expect(source).toContain("navigator.canShare?.({ files: [file] })")
    expect(source).toContain("downloadRoundSummaryImage(await createBlob(), filename)")
  })

  it("keeps previews contained and revokes generated object URLs", async () => {
    const preview = await read("src/components/images/GeneratedImagePreview.tsx")
    const season = await read("src/components/statistics/SeasonShareExportsCard.tsx")
    const round = await read("src/components/round/RoundSummaryShareButton.tsx")

    expect(preview).toContain("object-contain")
    expect(preview).toContain("h-[min(68vh,620px)]")
    expect(preview).toContain("type-caption font-bold text-neutral-400")
    expect(season).toContain("URL.revokeObjectURL(previewUrlRef.current)")
    expect(round).toContain("URL.revokeObjectURL(previewUrlRef.current)")
  })
})
