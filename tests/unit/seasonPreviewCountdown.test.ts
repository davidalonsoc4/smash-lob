import { expect, it } from "vitest"
import { getSeasonPreviewCountdown } from "@/lib/seasonScheduling"

it("only offers a countdown for a valid future scheduled start", () => {
  const now = new Date("2026-10-23T10:00:00Z")
  expect(getSeasonPreviewCountdown(null, now)).toBeNull()
  expect(getSeasonPreviewCountdown("invalid", now)).toBeNull()
  expect(getSeasonPreviewCountdown(now.toISOString(), now)).toBeNull()
  expect(getSeasonPreviewCountdown("2026-10-22T10:00:00Z", now)).toBeNull()
})
it("distinguishes today, tomorrow and days across the Madrid DST change", () => {
  const now = new Date("2026-10-24T20:00:00Z")
  expect(getSeasonPreviewCountdown("2026-10-24T23:00", now)?.days).toBe(0)
  expect(getSeasonPreviewCountdown("2026-10-25T23:00", now)?.days).toBe(1)
  expect(getSeasonPreviewCountdown("2026-10-26T23:00", now)?.days).toBe(2)
})
