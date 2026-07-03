import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"
import {
  getNotificationPreferenceKeyForEvent,
  normalizeNotificationPreferences,
} from "@/lib/notificationSettings"
import type { ActivityEventType } from "@/lib/activity"

export const runtime = "nodejs"

type ActivityEventRow = {
  id: string
  league_id: string
  season_id: string | null
  match_id: string | null
  actor_email: string | null
  actor_display_name: string | null
  type: ActivityEventType
  title: string | null
  description: string | null
  metadata: Record<string, unknown> | null
}

type PushSubscriptionRow = {
  id: string
  user_email: string
  endpoint: string
  p256dh: string
  auth: string
}

type NotificationPreferenceRow = {
  user_email: string
  settings: unknown
}

type LeagueMembershipRow = {
  user_id: string | null
  player_id: string | null
}

type AppUserRow = {
  id: string
  email: string | null
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ""
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === "string")
}

function toTransfers(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      const transfer = toRecord(item)
      const fromPlayerId = String(transfer.fromPlayerId ?? "")
      const toPlayerId = String(transfer.toPlayerId ?? "")

      if (!fromPlayerId || !toPlayerId) {
        return null
      }

      return {
        fromPlayerId,
        toPlayerId,
        isPaid: Boolean(transfer.isPaid),
      }
    })
    .filter(
      (item): item is { fromPlayerId: string; toPlayerId: string; isPaid: boolean } =>
        Boolean(item)
    )
}

function getTargetPlayerIds(event: ActivityEventRow) {
  const metadata = toRecord(event.metadata)

  if (
    event.type === "match_scheduled" ||
    event.type === "match_schedule_updated" ||
    event.type === "match_postponed" ||
    event.type === "match_result_saved" ||
    event.type === "match_result_updated" ||
    event.type === "match_result_cleared"
  ) {
    return toStringArray(metadata.participantIds)
  }

  if (event.type === "court_booking_updated") {
    return Array.from(
      new Set(
        toTransfers(metadata.transfers)
          .filter((transfer) => !transfer.isPaid)
          .map((transfer) => transfer.fromPlayerId)
      )
    )
  }

  if (event.type === "court_booking_payment_paid") {
    const paidTransfer = toRecord(metadata.paidTransfer)
    const toPlayerId = String(paidTransfer.toPlayerId ?? "")

    return toPlayerId ? [toPlayerId] : []
  }

  return []
}

function isLeagueWideEvent(eventType: ActivityEventType) {
  return (
    eventType === "season_created" ||
    eventType === "season_started" ||
    eventType === "season_finished"
  )
}

function getNotificationUrl(event: ActivityEventRow) {
  if (event.match_id) {
    return `/match/${event.match_id}`
  }

  if (
    event.type === "season_created" ||
    event.type === "season_started" ||
    event.type === "season_finished"
  ) {
    return "/"
  }

  return "/activity?scope=mine"
}

function getNotificationBody(event: ActivityEventRow) {
  const actor = event.actor_display_name || event.actor_email || "Smash & Lob"
  const description = event.description?.trim()

  if (description) {
    return description.length > 150 ? `${description.slice(0, 147)}...` : description
  }

  return `${actor} ha actualizado tu liga.`
}

async function getRecipientEmails({
  supabase,
  event,
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>
  event: ActivityEventRow
}) {
  let membershipsQuery = supabase
    .from("league_memberships")
    .select("user_id,player_id")
    .eq("league_id", event.league_id)

  const targetPlayerIds = getTargetPlayerIds(event)

  if (!isLeagueWideEvent(event.type)) {
    if (targetPlayerIds.length === 0) {
      return []
    }

    membershipsQuery = membershipsQuery.in("player_id", targetPlayerIds)
  }

  const { data: memberships, error: membershipsError } = await membershipsQuery

  if (membershipsError) {
    throw membershipsError
  }

  const userIds = Array.from(
    new Set(
      ((memberships ?? []) as LeagueMembershipRow[])
        .map((membership) => membership.user_id)
        .filter((userId): userId is string => Boolean(userId))
    )
  )

  if (userIds.length === 0) {
    return []
  }

  const { data: users, error: usersError } = await supabase
    .from("app_users")
    .select("id,email")
    .in("id", userIds)

  if (usersError) {
    throw usersError
  }

  const actorEmail = normalizeEmail(event.actor_email)

  return Array.from(
    new Set(
      ((users ?? []) as AppUserRow[])
        .map((user) => normalizeEmail(user.email))
        .filter((email) => email && email !== actorEmail)
    )
  )
}

async function filterByPreferences({
  supabase,
  leagueId,
  eventType,
  recipientEmails,
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>
  leagueId: string
  eventType: ActivityEventType
  recipientEmails: string[]
}) {
  const preferenceKey = getNotificationPreferenceKeyForEvent(eventType)

  if (!preferenceKey || recipientEmails.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("user_email,settings")
    .eq("league_id", leagueId)
    .in("user_email", recipientEmails)

  if (error) {
    throw error
  }

  const settingsByEmail = new Map(
    ((data ?? []) as NotificationPreferenceRow[]).map((row) => [
      normalizeEmail(row.user_email),
      normalizeNotificationPreferences(row.settings),
    ])
  )

  return recipientEmails.filter((email) => {
    const preferences = settingsByEmail.get(email) ?? normalizeNotificationPreferences(null)
    return preferences[preferenceKey]
  })
}

export async function POST(request: Request) {
  const session = await auth()
  const currentEmail = normalizeEmail(session?.user?.email)
  const body = (await request.json().catch(() => null)) as { eventId?: string } | null
  const eventId = body?.eventId?.trim() ?? ""

  if (!currentEmail) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  if (!eventId) {
    return NextResponse.json({ error: "missing_event" }, { status: 400 })
  }

  const supabase = createSupabaseServiceClient()

  if (!supabase) {
    return NextResponse.json({ ok: false, reason: "missing_service_role" }, { status: 200 })
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return NextResponse.json({ ok: false, reason: "missing_vapid" }, { status: 200 })
  }

  const { data: eventData, error: eventError } = await supabase
    .from("activity_events")
    .select("id,league_id,season_id,match_id,actor_email,actor_display_name,type,title,description,metadata")
    .eq("id", eventId)
    .single()

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 })
  }

  const event = eventData as ActivityEventRow
  const recipientEmails = await getRecipientEmails({ supabase, event })
  const allowedEmails = await filterByPreferences({
    supabase,
    leagueId: event.league_id,
    eventType: event.type,
    recipientEmails,
  })

  if (allowedEmails.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("push_subscriptions")
    .select("id,user_email,endpoint,p256dh,auth")
    .eq("league_id", event.league_id)
    .eq("enabled", true)
    .in("user_email", allowedEmails)

  if (subscriptionsError) {
    return NextResponse.json({ error: subscriptionsError.message }, { status: 500 })
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  const webPush = await import("web-push")

  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  const payload = JSON.stringify({
    title: event.title || "Smash & Lob",
    body: getNotificationBody(event),
    url: getNotificationUrl(event),
    tag: `smash-lob-${event.id}`,
  })
  let sent = 0

  await Promise.all(
    (subscriptions as PushSubscriptionRow[]).map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload
        )
        sent += 1
      } catch (error) {
        const statusCode =
          typeof error === "object" && error !== null && "statusCode" in error
            ? Number((error as { statusCode?: unknown }).statusCode)
            : null

        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .update({ enabled: false, updated_at: new Date().toISOString() })
            .eq("id", subscription.id)
        }
      }
    })
  )

  return NextResponse.json({ ok: true, sent })
}
