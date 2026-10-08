import { parseMatchScheduleDate } from "@/lib/matchScheduleTime"
export type CalendarEvent = { title: string; description: string; location?: string | null; start: string; end?: string; uid?: string }
export type CalendarProvider = "google" | "ics"
const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
const escape = (text: string) => text.replace(/\\/g, "\\\\").replace(/\r?\n|\r/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,")
function fold(line: string) {
  const lines: string[] = []; let current = "", size = 0
  for (const char of line) { const bytes = new TextEncoder().encode(char).length; if (size + bytes > 75) { lines.push(current); current = " "; size = 1 }; current += char; size += bytes }
  return [...lines, current].join("\r\n")
}
export function getCalendarExport(event: CalendarEvent, now = new Date()) {
  const start = parseMatchScheduleDate(event.start), end = event.end ? parseMatchScheduleDate(event.end) : start ? new Date(start.getTime() + 120 * 60000) : null
  if (!start || !end || end <= start) return null
  let hash = 2166136261; for (const char of event.title + event.description) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  const params = new URLSearchParams({ action: "TEMPLATE", text: event.title, dates: stamp(start) + "/" + stamp(end), ctz: "Europe/Madrid", details: event.description, location: event.location ?? "" })
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Smash and Lob//Calendar//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", "UID:" + escape(event.uid ?? (hash >>> 0).toString(16) + "@smashandlob.com"), "DTSTAMP:" + stamp(now), "DTSTART:" + stamp(start), "DTEND:" + stamp(end), "SUMMARY:" + escape(event.title), "DESCRIPTION:" + escape(event.description), "LOCATION:" + escape(event.location ?? ""), "END:VEVENT", "END:VCALENDAR"].map(fold).join("\r\n") + "\r\n"
  return { googleUrl: "https://calendar.google.com/calendar/render?" + params.toString(), ics }
}
