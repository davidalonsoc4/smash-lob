import { describe, expect, it } from "vitest"
import { getCalendarExport } from "@/lib/calendarEvent"
const event = { title: "Liga: A vs B", description: "Jornada 3", location: "Pista 1", start: "2026-10-08T18:00:00Z" }
describe("shared calendar exports", () => {
  it("exports identical UTC instants to Google and ICS with the default two hours", () => {
    const result = getCalendarExport(event)!
    expect(new URL(result.googleUrl).searchParams.get("dates")).toBe("20261008T180000Z/20261008T200000Z")
    expect(result.ics).toContain("DTSTART:20261008T180000Z\r\nDTEND:20261008T200000Z")
    expect(result.ics).toContain("LOCATION:Pista 1")
  })
  it("preserves the real interval over daylight saving changes", () => {
    const result = getCalendarExport({ ...event, start: "2026-10-25T02:30:00+02:00", end: "2026-10-25T03:30:00+01:00" })!
    expect(result.ics).toContain("DTSTART:20261025T003000Z\r\nDTEND:20261025T023000Z")
  })
  it("rejects missing, invalid or reversed dates", () => {
    expect(getCalendarExport({ ...event, start: "" })).toBeNull()
    expect(getCalendarExport({ ...event, start: "invalid" })).toBeNull()
    expect(getCalendarExport({ ...event, end: event.start })).toBeNull()
  })
  it("escapes values to prevent extra ICS properties and folds UTF-8 safely", () => {
    const result = getCalendarExport({ ...event, title: "á😀".repeat(50), description: "A,B;C\\D\r\nBEGIN:VALARM" })!
    const unfolded = result.ics.replace(/\r\n /g, "")
    expect(unfolded).toContain("SUMMARY:" + "á😀".repeat(50))
    expect(unfolded).toContain("DESCRIPTION:A\\,B\\;C\\\\D\\nBEGIN:VALARM")
    expect(result.ics.split("\r\n").every(line => new TextEncoder().encode(line).length <= 75)).toBe(true)
  })
  it("keeps event identity across exports without claiming automatic synchronization", () => {
    const uid = (value: string) => value.match(/UID:([^\r]+)/)?.[1]
    expect(uid(getCalendarExport(event)!.ics)).toBe(uid(getCalendarExport({ ...event, start: "2026-10-09T18:00:00Z" })!.ics))
  })
})
