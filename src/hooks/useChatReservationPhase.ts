import { useEffect, useState } from "react"
import { MATCH_IN_PROGRESS_WINDOW_MS } from "@/lib/matchLifecycle"
import { parseMatchScheduleDate } from "@/lib/matchScheduleTime"

export function useChatReservationPhase(scheduledAt: string | null | undefined) {
  const startsAt = parseMatchScheduleDate(scheduledAt)?.getTime() ?? NaN
  const [now, setNow] = useState(Date.now)
  const endsAt = startsAt + MATCH_IN_PROGRESS_WINDOW_MS
  const nextChange = now < startsAt ? startsAt : endsAt

  useEffect(() => {
    if (!(nextChange > now)) return
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(Math.max(nextChange - Date.now(), 0), 2_147_000_000))
    return () => window.clearTimeout(timer)
  }, [nextChange, now])

  if (!Number.isFinite(startsAt)) return null
  if (now < startsAt) return "upcoming"
  return now < endsAt ? "in_progress" : "result_pending"
}
