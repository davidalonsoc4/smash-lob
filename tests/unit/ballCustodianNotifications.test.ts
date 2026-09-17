import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import {
  isTargetedCustodianActivityType,
  isTargetedCustodianActivityVisibleToPlayer,
} from "@/lib/activity"
import { getNotificationPreferenceKeyForEvent } from "@/lib/notificationSettings"

describe("ball custodian notifications", () => {
  it("restricts duty notices to the assigned player", () => {
    const metadata = { targetPlayerIds: ["custodian"] }

    expect(isTargetedCustodianActivityType("match_ball_custodian_assigned", metadata)).toBe(true)
    expect(isTargetedCustodianActivityVisibleToPlayer("match_ball_custodian_assigned", metadata, "custodian")).toBe(true)
    expect(isTargetedCustodianActivityVisibleToPlayer("match_ball_custodian_assigned", metadata, "teammate")).toBe(false)
  })

  it("keeps assigned-player 2-hour reminders targeted as well", () => {
    const metadata = { targetPlayerIds: ["custodian"] }

    expect(isTargetedCustodianActivityVisibleToPlayer("match_ball_custodian_reminder", metadata, "teammate")).toBe(false)
    expect(isTargetedCustodianActivityVisibleToPlayer("match_upcoming_reminder", metadata, "teammate")).toBe(false)
    expect(isTargetedCustodianActivityVisibleToPlayer("match_upcoming_reminder", { participantIds: ["teammate"] }, "teammate")).toBe(true)
  })

  it("does not make ordinary match activity private", () => {
    expect(isTargetedCustodianActivityType("match_scheduled", { targetPlayerIds: ["custodian"] })).toBe(false)
    expect(isTargetedCustodianActivityVisibleToPlayer("match_scheduled", {}, "teammate")).toBe(true)
  })

  it("uses the existing schedule and upcoming-match preferences", () => {
    expect(getNotificationPreferenceKeyForEvent("match_ball_custodian_assigned")).toBe("match_schedule")
    expect(getNotificationPreferenceKeyForEvent("match_ball_custodian_reminder")).toBe("match_upcoming")
  })

  it("creates duty notices only after a match is scheduled and outside hidden pre-start phases", async () => {
    const source = await readFile("src/lib/serverBallCustodianNotifications.ts", "utf8")
    expect(source).toContain('match.status !== "scheduled" || !match.scheduled_at')
    expect(source).toContain("shouldSuppressSeasonMatchNotifications")
    expect(source).toContain("scheduledTime > now.getTime() + 2 * 60 * 60 * 1000")
  })
})
