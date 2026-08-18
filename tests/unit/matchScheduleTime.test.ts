import { describe, expect, it } from "vitest"
import {
  MATCH_SCHEDULE_TIME_ZONE,
  dateTimeLocalToUtcIso,
  formatNextFullHourForDateTimeInput,
  parseMatchScheduleDate,
  toCalendarFloatingDate,
} from "@/lib/matchScheduleTime"

describe("match dates", () => {
  it("uses Europe/Madrid as the domain timezone", () => {
    expect(MATCH_SCHEDULE_TIME_ZONE).toBe("Europe/Madrid")
  })

  it("preserves explicit summer and winter offsets", () => {
    expect(dateTimeLocalToUtcIso("2026-08-02T18:30:00+02:00")).toBe(
      "2026-08-02T16:30:00.000Z",
    )
    expect(dateTimeLocalToUtcIso("2026-12-02T18:30:00+01:00")).toBe(
      "2026-12-02T17:30:00.000Z",
    )
  })

  it("rounds the local device time up to the next full hour", () => {
    expect(
      formatNextFullHourForDateTimeInput(new Date(2026, 7, 18, 13, 17)),
    ).toBe("2026-08-18T14:00")
    expect(
      formatNextFullHourForDateTimeInput(new Date(2026, 7, 18, 23, 42)),
    ).toBe("2026-08-19T00:00")
  })

  it("rejects invalid input and emits a floating calendar timestamp", () => {
    expect(parseMatchScheduleDate("not-a-date")).toBeNull()
    expect(
      toCalendarFloatingDate(new Date("2026-08-02T16:30:45.000Z")),
    ).toMatch(/^\d{8}T\d{6}$/)
  })
})
