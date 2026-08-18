import { describe, expect, it } from "vitest"
import {
  getVersionBlock,
  groupReleasesByVersionBlock,
} from "@/lib/changelogGrouping"
import type { ChangelogRelease } from "@/lib/changelog"

const release = (
  version: string,
  date: string,
  changes: string[],
): ChangelogRelease => ({
  version,
  date,
  title: version,
  summary: version,
  category: "improvement",
  changes,
})

describe("changelog grouping", () => {
  it("groups patches without mixing v1.0 and v1.1", () => {
    const blocks = groupReleasesByVersionBlock([
      release("v1.1.0", "3 de agosto", ["a", "b"]),
      release("v1.0.1", "1 de agosto", ["c"]),
      release("v1.0.0", "31 de julio", ["d"]),
    ])

    expect(blocks.map(({ version }) => version)).toEqual(["v1.1", "v1.0"])
    expect(blocks[1]).toMatchObject({
      changeCount: 2,
      latestDate: "1 de agosto",
      firstDate: "31 de julio",
    })
  })

  it("keeps an unrecognized label intact", () => {
    expect(getVersionBlock("próximamente")).toBe("próximamente")
  })

  it("uses source date boundaries instead of nesting an existing display range", () => {
    const rangedRelease = {
      ...release("v1.8.12 – v1.8.16", "16 de agosto", ["a"]),
      dateRange: "14 de agosto – 16 de agosto",
      firstDate: "14 de agosto",
      latestDate: "16 de agosto",
    }
    const blocks = groupReleasesByVersionBlock([
      rangedRelease,
      release("v1.8.0", "12 de agosto", ["b"]),
    ])

    expect(blocks[0]).toMatchObject({
      latestDate: "16 de agosto",
      firstDate: "12 de agosto",
    })
  })
})
