import { expect, it } from "vitest"
import { buildAvailabilityRecommendations, createEmptyWeeklyAvailability, type PlayerAvailability } from "@/lib/playerAvailability"
import { createAvailabilityInstantResolver } from "@/lib/availabilityInstants"

function availability(playerId: string, timezone: string, start = "18:00", end = "20:00"): PlayerAvailability {
  const weeklySlots = createEmptyWeeklyAvailability()
  for (const key of Object.keys(weeklySlots) as Array<keyof typeof weeklySlots>) weeklySlots[key] = [{ start, end }]
  return { leagueId: "fixture", seasonId: "fixture", playerId, timezone, weeklySlots, dateOverrides: {} }
}

it("does not claim a two-hour match fits a one-hour actual overlap across time zones", () => {
  const availabilities = [availability("a", "Europe/Madrid"), availability("b", "Europe/Madrid"), availability("c", "Atlantic/Canary"), availability("d", "Atlantic/Canary")]
  const result = buildAvailabilityRecommendations({ playerIds: ["a", "b", "c", "d"], availabilities, startsAt: "2099-01-05", endsAt: "2099-01-05", slotDurationMinutes: 120 })
  expect(result.some((recommendation) => recommendation.coverage === 4)).toBe(false)
})

it("finds actual common slots and applies overrides in the player's own calendar date", () => {
  const availabilities = [availability("a", "Europe/Madrid", "18:00", "22:00"), availability("b", "Atlantic/Canary", "17:00", "21:00")]
  const params = { playerIds: ["a", "b"], availabilities, startsAt: "2099-01-05", endsAt: "2099-01-05", slotDurationMinutes: 120 }
  expect(buildAvailabilityRecommendations(params).some((recommendation) => recommendation.coverage === 2)).toBe(true)
  availabilities[1].dateOverrides["2099-01-05"] = []
  expect(buildAvailabilityRecommendations(params).some((recommendation) => recommendation.coverage === 2)).toBe(false)
})

it("resolves DST offsets by date and rejects ambiguous/nonexistent endpoints and invalid zones", () => {
  const resolve = createAvailabilityInstantResolver("Europe/Madrid")
  expect(resolve("2027-01-05", "18:00")).toBe(Date.parse("2027-01-05T17:00:00Z"))
  expect(resolve("2027-07-05", "18:00")).toBe(Date.parse("2027-07-05T16:00:00Z"))
  expect(resolve("2027-03-28", "02:30")).toBeNull()
  expect(resolve("2027-10-31", "02:30")).toBeNull()
  expect(createAvailabilityInstantResolver("invalid/zone")("2099-01-05", "18:00")).toBeNull()
})
