import { describe, expect, it } from "vitest"
import { buildTutorialPath, canViewTutorial, formatTutorialDuration, getTutorialFileRule, getTutorialScreenForPath, isTutorialPath, isTutorialScreen } from "@/lib/tutorialVideos"

const id = "11111111-2222-4333-8444-555555555555"
const base = { leagueIds: [] as string[], memberLeagueIds: [] as string[], isSuperuser: false }

describe("who sees a tutorial", () => {
  it("shows public tutorials to anyone with a session", () => {
    expect(canViewTutorial({ ...base, audience: "public" })).toBe(true)
  })
  it("keeps drafts for the manager only", () => {
    expect(canViewTutorial({ ...base, audience: "draft", memberLeagueIds: ["a"] })).toBe(false)
    expect(canViewTutorial({ ...base, audience: "draft", isSuperuser: true })).toBe(true)
  })
  it("limits league tutorials to members of any chosen league", () => {
    expect(canViewTutorial({ ...base, audience: "leagues", leagueIds: ["a", "b"], memberLeagueIds: ["b", "z"] })).toBe(true)
    expect(canViewTutorial({ ...base, audience: "leagues", leagueIds: ["a"], memberLeagueIds: ["z"] })).toBe(false)
    expect(canViewTutorial({ ...base, audience: "leagues", leagueIds: [], memberLeagueIds: ["a"] })).toBe(false)
    expect(canViewTutorial({ ...base, audience: "leagues", leagueIds: ["a"], isSuperuser: true })).toBe(true)
  })
  it("hides a scheduled tutorial from everyone but the manager until its moment arrives", () => {
    const now = Date.parse("2026-11-20T10:00:00Z")
    const later = "2026-11-20T10:05:00Z"
    const earlier = "2026-11-20T09:55:00Z"
    expect(canViewTutorial({ ...base, audience: "public", publishAt: later, now })).toBe(false)
    expect(canViewTutorial({ ...base, audience: "leagues", leagueIds: ["a"], memberLeagueIds: ["a"], publishAt: later, now })).toBe(false)
    expect(canViewTutorial({ ...base, audience: "public", publishAt: later, now, isSuperuser: true })).toBe(true)
    expect(canViewTutorial({ ...base, audience: "public", publishAt: earlier, now })).toBe(true)
    expect(canViewTutorial({ ...base, audience: "public", publishAt: null, now })).toBe(true)
  })
})

describe("tutorial files", () => {
  it("accepts only mp4 videos and image thumbnails with a size limit", () => {
    expect(getTutorialFileRule("video/mp4")?.kind).toBe("video")
    expect(getTutorialFileRule("image/jpeg")?.kind).toBe("poster")
    expect(getTutorialFileRule("video/webm")).toBeNull()
    expect(getTutorialFileRule(undefined)).toBeNull()
  })
  it("builds flat paths and recognises them by kind", () => {
    expect(buildTutorialPath(id, "video/mp4")).toBe(`${id}.mp4`)
    expect(isTutorialPath(`${id}.mp4`, "video")).toBe(true)
    expect(isTutorialPath(`${id}.mp4`, "poster")).toBe(false)
    expect(isTutorialPath(`${id}.jpg`, "poster")).toBe(true)
    expect(isTutorialPath(`../${id}.mp4`, "video")).toBe(false)
    expect(isTutorialPath(`other/${id}.mp4`, "video")).toBe(false)
  })
  it("formats the duration as minutes and seconds", () => {
    expect(formatTutorialDuration(65_400)).toBe("1:05")
    expect(formatTutorialDuration(0)).toBe("")
    expect(formatTutorialDuration(null)).toBe("")
  })
})

describe("tutorial screens", () => {
  it("maps a path to the screen whose video the help button offers", () => {
    expect(getTutorialScreenForPath("/match/abc")).toBe("match")
    expect(getTutorialScreenForPath("/match/abc/chat")).toBe("match-chat")
    expect(getTutorialScreenForPath("/settings")).toBe("settings")
    expect(getTutorialScreenForPath("/settings/notifications")).toBe("notification-settings")
    expect(getTutorialScreenForPath("/personal-matches/xyz")).toBe("personal-matches")
    expect(getTutorialScreenForPath("/admin/season/finances")).toBe("season-admin")
    expect(getTutorialScreenForPath("/help")).toBeNull()
  })

  it("accepts only known screen ids", () => {
    expect(isTutorialScreen("ranking")).toBe(true)
    expect(isTutorialScreen("nope")).toBe(false)
    expect(isTutorialScreen(null)).toBe(false)
  })
})

describe("tutorial categories", () => {
  it("places each tutorial in the tab it belongs to", async () => {
    const { getTutorialGroup } = await import("@/lib/tutorialVideos")
    expect(getTutorialGroup("app", "public")).toBe("generic")
    expect(getTutorialGroup(undefined, "draft")).toBe("generic")
    expect(getTutorialGroup("app", "leagues")).toBe("leagues")
    expect(getTutorialGroup("social", "draft")).toBe("social")
  })

  it("keeps social media material away from everyone but the managers", async () => {
    const { canViewTutorial } = await import("@/lib/tutorialVideos")
    const base = { leagueIds: ["l1"], memberLeagueIds: ["l1"], isSuperuser: false }
    expect(canViewTutorial({ ...base, audience: "public", category: "social" })).toBe(false)
    expect(canViewTutorial({ ...base, audience: "leagues", category: "social" })).toBe(false)
    expect(canViewTutorial({ ...base, audience: "public", category: "app" })).toBe(true)
    expect(canViewTutorial({ ...base, isSuperuser: true, audience: "draft", category: "social" })).toBe(true)
  })
})
