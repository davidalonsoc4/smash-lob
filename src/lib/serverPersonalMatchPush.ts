import "server-only"

import { createSupabaseServiceClient } from "@/lib/supabaseServer"
import { removeExpiredPushSubscription } from "@/lib/serverPushDispatch"
import { normalizeNotificationPreferences, type NotificationPreferenceKey } from "@/lib/notificationSettings"

type PersonalPushInput = {
  matchId: string
  actorUserId: string
  title: string
  body: string
  url?: string
  tag?: string
  visiblePath?: string | null
  recipientUserIds?: string[]
  preferenceKey?: NotificationPreferenceKey
}

type SubscriptionRow = {
  id: string
  league_id: string
  user_email: string
  endpoint: string
  p256dh: string
  auth: string
}

type PreferenceRow = {
  league_id: string
  user_email: string
  settings: unknown
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ""
}

export async function getPersonalMatchLinkedUserIds(matchId: string) {
  const supabase = createSupabaseServiceClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("personal_match_participants")
    .select("user_id")
    .eq("match_id", matchId)

  if (error) return []
  return Array.from(
    new Set(
      (data ?? [])
        .map((row) => row.user_id)
        .filter((value): value is string => typeof value === "string" && Boolean(value)),
    ),
  )
}

export async function dispatchPersonalMatchPush({
  matchId,
  actorUserId,
  title,
  body,
  url = `/personal-matches/${matchId}`,
  tag = `smash-lob-personal-${matchId}`,
  visiblePath = null,
  recipientUserIds,
  preferenceKey,
}: PersonalPushInput) {
  const supabase = createSupabaseServiceClient()
  if (!supabase) return { ok: false, sent: 0, reason: "missing_service_role" as const }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT
  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return { ok: false, sent: 0, reason: "missing_vapid" as const }
  }

  const linkedUserIds = recipientUserIds ?? (await getPersonalMatchLinkedUserIds(matchId))
  const targets = Array.from(new Set(linkedUserIds)).filter((userId) => userId !== actorUserId)
  if (targets.length === 0) return { ok: true, sent: 0 }

  const { data: users, error: usersError } = await supabase
    .from("app_users")
    .select("id,email")
    .in("id", targets)
  if (usersError) return { ok: false, sent: 0, reason: "users_lookup_failed" as const }

  const targetEmails = Array.from(
    new Set(
      (users ?? [])
        .map((row) => normalizeEmail(row.email))
        .filter(Boolean),
    ),
  )
  if (targetEmails.length === 0) return { ok: true, sent: 0 }

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("push_subscriptions")
    .select("id,league_id,user_email,endpoint,p256dh,auth")
    .eq("enabled", true)
    .in("user_email", targetEmails)
  if (subscriptionsError) {
    return { ok: false, sent: 0, reason: "subscriptions_lookup_failed" as const }
  }

  const subscriptionRows = (subscriptions ?? []) as SubscriptionRow[]
  let eligibleSubscriptions = subscriptionRows

  if (preferenceKey && subscriptionRows.length > 0) {
    const leagueIds = Array.from(new Set(subscriptionRows.map((row) => row.league_id)))
    const { data: preferences, error: preferencesError } = await supabase
      .from("notification_preferences")
      .select("league_id,user_email,settings")
      .in("league_id", leagueIds)
      .in("user_email", targetEmails)

    if (preferencesError) {
      return { ok: false, sent: 0, reason: "preferences_lookup_failed" as const }
    }

    const preferenceBySubscription = new Map(
      ((preferences ?? []) as PreferenceRow[]).map((row) => [
        `${row.league_id}|${normalizeEmail(row.user_email)}`,
        normalizeNotificationPreferences(row.settings),
      ]),
    )

    eligibleSubscriptions = subscriptionRows.filter((subscription) => {
      const preferences = preferenceBySubscription.get(
        `${subscription.league_id}|${normalizeEmail(subscription.user_email)}`,
      ) ?? normalizeNotificationPreferences(null)
      return preferences[preferenceKey]
    })
  }

  const uniqueSubscriptions = Array.from(
    new Map(
      eligibleSubscriptions.map((subscription) => [subscription.endpoint, subscription]),
    ).values(),
  )
  if (uniqueSubscriptions.length === 0) return { ok: true, sent: 0 }

  const webPush = await import("web-push")
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
  let sent = 0

  await Promise.all(
    uniqueSubscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({
            title,
            body,
            url,
            tag,
            visiblePath,
          }),
        )
        sent += 1
      } catch (error) {
        const statusCode =
          typeof error === "object" && error !== null && "statusCode" in error
            ? Number((error as { statusCode?: unknown }).statusCode)
            : null
        await removeExpiredPushSubscription({
          supabase,
          statusCode,
          subscriptionId: subscription.id,
        })
      }
    }),
  )

  return { ok: true, sent }
}
