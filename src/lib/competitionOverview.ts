import type { PersonalMatchItem } from "@/lib/personalMatches"
import { getMatchDisplayStatus } from "@/lib/matchLifecycle"
import { parseMatchScheduleDate } from "@/lib/matchScheduleTime"

/** Select only dated, own encounters. Never present overdue fixtures as played. */
export function selectCompetitionHighlight(items: PersonalMatchItem[], now: Date) {
  const own = items.filter(item => item.participants.some(player => player.isCurrentUser))
  const time = (item: PersonalMatchItem) => parseMatchScheduleDate(item.scheduledAt)?.getTime() ?? 0
  const live = own.filter(item => getMatchDisplayStatus({ ...item, now }) === "in_progress").sort((a, b) => time(a) - time(b))[0]
  if (live) return { kind: "live" as const, match: live }
  const next = own.filter(item => item.status === "scheduled" && time(item) > now.getTime()).sort((a, b) => time(a) - time(b))[0]
  if (next) return { kind: "next" as const, match: next }
  const lastTime = (item: PersonalMatchItem) => parseMatchScheduleDate(item.resultRecordedAt)?.getTime() || time(item)
  const last = own.filter(item => item.status === "finished" && lastTime(item) > 0 && lastTime(item) <= now.getTime()).sort((a, b) => lastTime(b) - lastTime(a))[0]
  return last ? { kind: "last" as const, match: last } : null
}
/** Keep the same privacy/date rules while exposing the two activity cards. */
export function selectCompetitionHighlights(items: PersonalMatchItem[], now: Date) {
  const next = selectCompetitionHighlight(items.filter(item => item.status !== "finished"), now)
  const last = selectCompetitionHighlight(items.filter(item => item.status === "finished"), now)
  return [next, last].filter((item): item is NonNullable<typeof item> => item !== null)
}
