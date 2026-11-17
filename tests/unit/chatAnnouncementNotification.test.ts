import { describe, expect, it } from "vitest"
import { activityEventDefinitions } from "@/lib/activitySettings"
import { isAlwaysEnabledNotificationEvent } from "@/lib/notificationSettings"

describe("league chat announcements (Novedad)", () => {
  it("is always delivered, whatever the notification preferences", () => {
    expect(isAlwaysEnabledNotificationEvent("league_chat_announcement")).toBe(true)
    expect(isAlwaysEnabledNotificationEvent("league_announcement_published")).toBe(false)
  })

  it("is a push-ready, targeted activity event", () => {
    expect(activityEventDefinitions.league_chat_announcement).toMatchObject({ defaultMode: "notify", pushReady: true, personalScope: "target_player" })
  })
})
