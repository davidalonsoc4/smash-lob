import "server-only"

import { getDueMatchResultReminderHours, type ResultReminderHour } from "@/lib/matchLifecycle"
import { dispatchPersonalMatchPush } from "@/lib/serverPersonalMatchPush"
import type { createSupabaseServiceClient } from "@/lib/supabaseServer"

type SupabaseServiceClient = NonNullable<ReturnType<typeof createSupabaseServiceClient>>

type PersonalMatchRow = {
  id: string
  status: string
  played_at: string | null
  result_recorded_at: string | null
  location_name: string | null
}

type NotificationEventKey = "upcoming_120" | `result_missing_${ResultReminderHour}`

const UPCOMING_WINDOW_MS = 2 * 60 * 60 * 1000
const RESULT_LOOKBACK_MS = 25 * 60 * 60 * 1000

function isUniqueViolation(error: { code?: string } | null) {
  return error?.code === "23505"
}

async function claimNotificationEvent({
  supabase,
  matchId,
  eventKey,
}: {
  supabase: SupabaseServiceClient
  matchId: string
  eventKey: NotificationEventKey
}) {
  const { error } = await supabase.from("personal_match_notification_events").insert({
    match_id: matchId,
    event_key: eventKey,
  })

  if (!error) return true
  if (isUniqueViolation(error)) return false
  throw error
}

function isUpcoming(match: PersonalMatchRow, now: Date) {
  if (match.status !== "scheduled" || !match.played_at) return false
  const scheduledTime = Date.parse(match.played_at)
  if (!Number.isFinite(scheduledTime)) return false
  return scheduledTime > now.getTime() && scheduledTime <= now.getTime() + UPCOMING_WINDOW_MS
}

export async function runPersonalMatchNotificationAutomation({
  supabase,
  now = new Date(),
}: {
  supabase: SupabaseServiceClient
  now?: Date
}) {
  const windowStart = new Date(now.getTime() - RESULT_LOOKBACK_MS).toISOString()
  const windowEnd = new Date(now.getTime() + UPCOMING_WINDOW_MS).toISOString()
  const { data, error } = await supabase
    .from("personal_matches")
    .select("id,status,played_at,result_recorded_at,location_name")
    .eq("status", "scheduled")
    .gte("played_at", windowStart)
    .lte("played_at", windowEnd)
    .limit(500)

  if (error) throw error

  let created = 0
  let sent = 0

  for (const match of (data ?? []) as PersonalMatchRow[]) {
    if (isUpcoming(match, now)) {
      const claimed = await claimNotificationEvent({
        supabase,
        matchId: match.id,
        eventKey: "upcoming_120",
      })

      if (claimed) {
        created += 1
        const result = await dispatchPersonalMatchPush({
          matchId: match.id,
          actorUserId: "system",
          preferenceKey: "match_upcoming",
          title: "Próximo amistoso",
          body: match.location_name
            ? `Tu amistoso empieza pronto · ${match.location_name}`
            : "Tu amistoso empieza pronto.",
          tag: `smash-lob-personal-upcoming-${match.id}`,
        })
        sent += result.sent
      }
    }

    const dueReminderHours = getDueMatchResultReminderHours({
      status: match.status,
      scheduledAt: match.played_at,
      resultRecordedAt: match.result_recorded_at,
      now,
    })

    for (const reminderHour of dueReminderHours) {
      const claimed = await claimNotificationEvent({
        supabase,
        matchId: match.id,
        eventKey: `result_missing_${reminderHour}`,
      })
      if (!claimed) continue

      created += 1
      const result = await dispatchPersonalMatchPush({
        matchId: match.id,
        actorUserId: "system",
        preferenceKey: "match_results",
        title: "Falta el resultado",
        body: "No olvidéis registrar el resultado del amistoso.",
        tag: `smash-lob-personal-result-${match.id}-${reminderHour}`,
      })
      sent += result.sent
      break
    }
  }

  return { created, sent }
}
