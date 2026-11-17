import { describe, expect, it } from "vitest"
import { buildTutorialPath, canViewTutorial, formatTutorialDuration, getTutorialFileRule, isTutorialPath } from "@/lib/tutorialVideos"

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
