import { describe, expect, it } from "vitest"
import {
  defaultNotificationPreferences,
  isNotificationGroupEnabled,
  legacyNotificationGroupIds,
  notificationPreferenceGroupDefinitions,
  notificationPreferenceKeys,
  setNotificationGroupEnabled,
} from "@/lib/notificationSettings"

describe("notification settings groups", () => {
  it("puts every preference key in exactly one group", () => {
    const grouped = notificationPreferenceGroupDefinitions.flatMap((group) => [...group.keys])
    expect([...grouped].sort()).toEqual([...notificationPreferenceKeys].sort())
    expect(new Set(grouped).size).toBe(grouped.length)
  })

  it("reads a mixed group as enabled and switches every key together", () => {
    const keys = ["match_upcoming", "match_coin_toss"] as const
    const mixed = { ...defaultNotificationPreferences, match_upcoming: false }
    expect(isNotificationGroupEnabled(mixed, keys)).toBe(true)
    const off = setNotificationGroupEnabled(mixed, keys, false)
    expect(isNotificationGroupEnabled(off, keys)).toBe(false)
    expect(off.match_chat).toBe(true)
    expect(setNotificationGroupEnabled(off, keys, true).match_upcoming).toBe(true)
  })

  it("maps the old section links to a current group", () => {
    const ids = new Set(notificationPreferenceGroupDefinitions.map((group) => group.id))
    for (const target of Object.values(legacyNotificationGroupIds)) expect(ids.has(target)).toBe(true)
  })
})
