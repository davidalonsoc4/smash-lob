import { describe, expect, it } from "vitest"
import { activityEventDefinitions } from "@/lib/activitySettings"
import { getNotificationPreferenceKeyForEvent, isAlwaysEnabledNotificationEvent } from "@/lib/notificationSettings"

describe("league chat announcements (Novedad)", () => {
  it("is always delivered, whatever the notification preferences", () => {
    expect(isAlwaysEnabledNotificationEvent("league_chat_announcement")).toBe(true)
    expect(isAlwaysEnabledNotificationEvent("league_announcement_published")).toBe(false)
  })

  it("is a push-ready, targeted activity event", () => {
    expect(activityEventDefinitions.league_chat_announcement).toMatchObject({ defaultMode: "notify", pushReady: true, personalScope: "target_player" })
  })

  it("a normal league chat message notifies exactly like a match chat message", () => {
    expect(getNotificationPreferenceKeyForEvent("league_chat_message")).toBe(getNotificationPreferenceKeyForEvent("match_chat_message"))
    expect(isAlwaysEnabledNotificationEvent("league_chat_message")).toBe(false)
    expect(activityEventDefinitions.league_chat_message).toMatchObject({ defaultMode: activityEventDefinitions.match_chat_message.defaultMode, pushReady: true })
  })
})
