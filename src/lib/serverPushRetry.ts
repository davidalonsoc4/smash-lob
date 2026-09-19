import "server-only"

type QueueClient = {
  from: (table: string) => unknown
}

type QueueQuery = PromiseLike<{ data?: unknown[] }> & {
  upsert: (values: Record<string, unknown>, options?: Record<string, unknown>) => QueueQuery
  select: (columns: string) => QueueQuery
  eq: (column: string, value: unknown) => QueueQuery
  lte: (column: string, value: unknown) => QueueQuery
  order: (column: string, options: Record<string, unknown>) => QueueQuery
  limit: (count: number) => QueueQuery
  update: (values: Record<string, unknown>) => QueueQuery
}

type QueueRow = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
  payload: Record<string, unknown>
  attempts: number
}

function query(client: QueueClient, table: string) {
  return client.from(table) as QueueQuery
}

const MAX_ATTEMPTS = 5

function backoffMinutes(attempts: number) {
  return Math.min(60, 2 ** Math.max(0, attempts))
}

export async function enqueuePushRetry({
  supabase,
  eventId,
  subscription,
  payload,
}: {
  supabase: QueueClient
  eventId: string
  subscription: { id: string; endpoint: string; p256dh: string; auth: string }
  payload: Record<string, unknown>
}) {
  await query(supabase, "push_delivery_queue").upsert(
    {
      event_id: eventId,
      subscription_id: subscription.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
      payload,
      status: "pending",
      next_attempt_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "event_id,subscription_id", ignoreDuplicates: true },
  )
}

export async function processPushRetryQueue(supabase: QueueClient) {
  const { data } = await query(supabase, "push_delivery_queue")
    .select("id,endpoint,p256dh,auth,payload,attempts")
    .eq("status", "pending")
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at", { ascending: true })
    .limit(50)
  const rows = (data ?? []) as QueueRow[]

  if (!rows?.length) return { attempted: 0, sent: 0, discarded: 0 }
  const webPush = await import("web-push")
  const subject = process.env.VAPID_SUBJECT
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!subject || !publicKey || !privateKey) return { attempted: 0, sent: 0, discarded: 0 }
  webPush.setVapidDetails(subject, publicKey, privateKey)

  let sent = 0
  let discarded = 0
  for (const row of rows) {
    const attempts = Number(row.attempts ?? 0) + 1
    try {
      await webPush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        JSON.stringify(row.payload),
      )
      await query(supabase, "push_delivery_queue").update({ status: "sent", attempts, updated_at: new Date().toISOString() }).eq("id", row.id)
      sent += 1
    } catch (error) {
      const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number((error as { statusCode?: unknown }).statusCode) : null
      const discard = statusCode === 404 || statusCode === 410 || attempts >= MAX_ATTEMPTS
      await query(supabase, "push_delivery_queue").update({
        status: discard ? "discarded" : "pending",
        attempts,
        next_attempt_at: new Date(Date.now() + backoffMinutes(attempts) * 60_000).toISOString(),
        last_error: statusCode ? `push_${statusCode}` : "push_delivery_failed",
        updated_at: new Date().toISOString(),
      }).eq("id", row.id)
      if (discard) discarded += 1
    }
  }
  return { attempted: rows.length, sent, discarded }
}
