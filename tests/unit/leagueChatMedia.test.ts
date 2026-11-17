import { describe, expect, it } from "vitest"
import {
  buildLeagueChatMediaPath,
  getLeagueChatMediaKindFromPath,
  getLeagueChatMediaRule,
  isLeagueChatMediaPathForSeason,
} from "@/lib/leagueChatMedia"

const season = "11111111-1111-4111-8111-111111111111"
const otherSeason = "22222222-2222-4222-8222-222222222222"
const object = "33333333-3333-4333-8333-333333333333"

describe("league chat media rules", () => {
  it("accepts MP4 video and common photos, and nothing else", () => {
    expect(getLeagueChatMediaRule("video/mp4")?.kind).toBe("video")
    expect(getLeagueChatMediaRule("image/jpeg")?.kind).toBe("image")
    expect(getLeagueChatMediaRule("image/png")?.kind).toBe("image")
    expect(getLeagueChatMediaRule("image/webp")?.kind).toBe("image")
    for (const rejected of ["video/quicktime", "image/svg+xml", "text/html", "application/pdf", "", undefined, 3]) {
      expect(getLeagueChatMediaRule(rejected)).toBeNull()
    }
  })

  it("limits videos to 50 MB and photos to 10 MB", () => {
    expect(getLeagueChatMediaRule("video/mp4")?.maxBytes).toBe(50 * 1024 * 1024)
    expect(getLeagueChatMediaRule("image/jpeg")?.maxBytes).toBe(10 * 1024 * 1024)
  })

  it("builds paths under the season and rejects unknown types", () => {
    expect(buildLeagueChatMediaPath(season, object, "video/mp4")).toBe(`${season}/${object}.mp4`)
    expect(buildLeagueChatMediaPath(season, object, "image/jpeg")).toBe(`${season}/${object}.jpg`)
    expect(buildLeagueChatMediaPath(season, object, "text/html")).toBeNull()
  })

  it("only accepts a path that belongs to the same season", () => {
    expect(isLeagueChatMediaPathForSeason(`${season}/${object}.mp4`, season)).toBe(true)
    expect(isLeagueChatMediaPathForSeason(`${otherSeason}/${object}.mp4`, season)).toBe(false)
    expect(isLeagueChatMediaPathForSeason(`${season}/../${otherSeason}/${object}.mp4`, season)).toBe(false)
    expect(isLeagueChatMediaPathForSeason(`${season}/${object}.exe`, season)).toBe(false)
    expect(isLeagueChatMediaPathForSeason(`${season}/${object}.mp4?x=1`, season)).toBe(false)
    expect(isLeagueChatMediaPathForSeason(null, season)).toBe(false)
  })

  it("derives the kind from the extension", () => {
    expect(getLeagueChatMediaKindFromPath(`${season}/${object}.mp4`)).toBe("video")
    expect(getLeagueChatMediaKindFromPath(`${season}/${object}.webp`)).toBe("image")
  })
})
