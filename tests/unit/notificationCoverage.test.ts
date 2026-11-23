import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { activityEventDefinitions } from "@/lib/activitySettings"
import {
  alwaysEnabledNotificationEventTypes, getNotificationPreferenceKeyForEvent, normalizeNotificationPreferences,
  notificationPreferenceDefinitions, requiredNotificationKeys,
} from "@/lib/notificationSettings"
import { isCoinTossOpenNoticeDue } from "@/lib/matchCoinToss"
import { es } from "@/i18n/locales/es"
import { en } from "@/i18n/locales/en"
import { eu } from "@/i18n/locales/eu"

/** Events that are only written to the activity feed of the league and never sent as a push, so there is nothing to configure. */
const FEED_ONLY = new Set(["league_created", "league_updated", "league_logo_updated", "league_locations_updated", "league_invite_regenerated", "league_announcement_deleted"])

describe("every notification can be configured, or is shown as required", () => {
  it("each event that is sent as a push belongs to one preference, or is always sent (and then it is a required notice)", () => {
    for (const type of Object.keys(activityEventDefinitions)) {
      const configurable = getNotificationPreferenceKeyForEvent(type as never)
      const always = alwaysEnabledNotificationEventTypes.includes(type as never)
      if (FEED_ONLY.has(type)) { expect(configurable, type).toBeNull(); continue }
      expect(configurable !== null || always, type).toBe(true)
    }
    expect(alwaysEnabledNotificationEventTypes).toEqual(["league_chat_announcement"])
    expect([...requiredNotificationKeys]).toEqual(["league_news", "chat_mentions"])
  })

  it("every preference has its title and description in the three languages, and so does every required notice", () => {
    for (const locale of [es, en, eu]) {
      for (const { key } of notificationPreferenceDefinitions) {
        const text = (locale.notifications.preferences as Record<string, { title: string; description: string }>)[key]
        expect(text?.title, key).toBeTruthy()
        expect(text?.description, key).toBeTruthy()
      }
      for (const key of requiredNotificationKeys) expect(locale.notifications.required[key].title, key).toBeTruthy()
    }
  })

  it("every preference appears in a group of the settings screen", () => {
    const lib = readFileSync("src/lib/notificationSettings.ts", "utf8")
    const page = readFileSync("src/app/settings/notifications/page.tsx", "utf8")
    expect(page).toContain("notificationPreferenceGroupDefinitions")
    for (const { key } of notificationPreferenceDefinitions) expect(lib.split("notificationPreferenceGroupDefinitions = [")[1], key).toContain(`"${key}"`)
  })

  it("a person who saved their preferences before the coin toss notice existed gets it switched on", () => {
    const preferences = normalizeNotificationPreferences({ match_upcoming: false })
    expect(preferences.match_coin_toss).toBe(true)
    expect(preferences.match_upcoming).toBe(false)
  })
})

describe("the notice that the coin toss is open", () => {
  const START = "2026-11-26T16:00:00Z"
  const at = (iso: string) => Date.parse(iso)
  it("goes out from 30 minutes before the match until 30 minutes after it starts, and not outside", () => {
    expect(isCoinTossOpenNoticeDue(START, at("2026-11-26T15:29:00Z"))).toBe(false)
    expect(isCoinTossOpenNoticeDue(START, at("2026-11-26T15:30:00Z"))).toBe(true)
    expect(isCoinTossOpenNoticeDue(START, at("2026-11-26T16:30:00Z"))).toBe(true)
    expect(isCoinTossOpenNoticeDue(START, at("2026-11-26T16:31:00Z"))).toBe(false)
    expect(isCoinTossOpenNoticeDue(null, at("2026-11-26T15:45:00Z"))).toBe(false)
  })
})
