import { readFile } from "node:fs/promises"
import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import {
  hasAvailabilityContent,
  mapProfileAvailability,
  parseProfileAvailabilityUpsert,
} from "@/lib/serverPlayerAvailability"

const weekly = { monday: [{ start: "19:00", end: "21:00" }] }

describe("profile availability (belongs to the player, not to a league)", () => {
  it("accepts a weekly schedule without any league or season", () => {
    const parsed = parseProfileAvailabilityUpsert({ timezone: "Europe/Madrid", weeklySlots: weekly })
    expect(parsed).toMatchObject({ ok: true, timezone: "Europe/Madrid", dateOverrides: null })
    expect(parsed.ok && parsed.weeklySlots.monday).toEqual(weekly.monday)
    expect(parsed.ok && parsed.weeklySlots.sunday).toEqual([])
  })

  it("allows clearing the schedule, which means total availability", () => {
    expect(parseProfileAvailabilityUpsert({ timezone: "Europe/Madrid", weeklySlots: {} })).toMatchObject({ ok: true })
  })

  it("rejects invalid slots, timezones and overrides", () => {
    expect(parseProfileAvailabilityUpsert({ timezone: "Europe/Madrid", weeklySlots: { monday: [{ start: "21:00", end: "19:00" }] } })).toEqual({ ok: false, error: "invalid_weekly_slots" })
    expect(parseProfileAvailabilityUpsert({ timezone: "", weeklySlots: weekly })).toEqual({ ok: false, error: "invalid_timezone" })
    expect(parseProfileAvailabilityUpsert({ timezone: "Europe/Madrid", weeklySlots: weekly, dateOverrides: { "2026-01-01": "x" } })).toEqual({ ok: false, error: "invalid_date_overrides" })
  })

  it("maps account or profile data to the shape the match chat expects", () => {
    const source = { timezone: null, weeklySlots: weekly, dateOverrides: {} }
    expect(hasAvailabilityContent(source)).toBe(true)
    expect(hasAvailabilityContent({ timezone: "x", weeklySlots: {}, dateOverrides: {} })).toBe(false)
    expect(mapProfileAvailability({ leagueId: "l", seasonId: "s", playerId: "p", userId: "u", source })).toMatchObject({
      leagueId: "l", seasonId: "s", playerId: "p", userId: "u", timezone: "Europe/Madrid",
    })
  })

  it("only exposes it to match participants when the season uses recommendations", async () => {
    const route = await readFile("src/app/api/leagues/[id]/matches/[matchId]/availability/route.ts", "utf8")
    expect(route).toContain("availability_recommendations_enabled")
    expect(route).toContain("isSpectator")
    expect(route).toContain("match.participantIds")
    expect(route).not.toContain('.from("player_availability")')
  })

  it("is always editable from the profile, whatever the season setting says", async () => {
    const section = await readFile("src/components/settings/AccountAvailabilitySettings.tsx", "utf8")
    const page = await readFile("src/app/settings/profile/page.tsx", "utf8")
    expect(page).toContain("<AccountAvailabilitySettings />")
    expect(section).not.toContain("availabilityRecommendationsEnabled")
    expect(section).not.toContain("useCurrentLeagueData")
  })

  it("migrates the per-league table into the player without dropping it", async () => {
    const migration = await readFile("supabase/migrations/20261117090000_player_availability_on_profile.sql", "utf8")
    expect(migration).toContain("standard_availability_date_overrides")
    expect(migration).toContain("availability_weekly_slots")
    expect(migration).toContain("UPDATE public.app_users")
    expect(migration).toContain("UPDATE public.players")
    expect(migration).toContain("DROP TRIGGER IF EXISTS season_players_seed_standard_availability")
    expect(migration).not.toMatch(/DROP TABLE[^;]*player_availability/i)
    expect(migration).not.toMatch(/DELETE FROM[^;]*player_availability/i)
  })
})
