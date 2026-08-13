import "server-only"

import { createHmac } from "node:crypto"

const REALTIME_EVENT = "refresh"

function realtimeSecret() {
  return process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || null
}

function topicToken(scope: string) {
  const secret = realtimeSecret()
  if (!secret) return null
  return createHmac("sha256", secret).update(scope).digest("base64url").slice(0, 32)
}

export function getMatchChatRealtimeTopic(matchId: string) {
  const token = topicToken(`match:${matchId}`)
  return token ? `sl_chat_match_${token}` : null
}

export function getChatOverviewRealtimeTopic(leagueId: string, seasonId: string) {
  const token = topicToken(`overview:${leagueId}:${seasonId}`)
  return token ? `sl_chat_overview_${token}` : null
}

async function broadcastTopic(topic: string | null) {
  if (!topic) return false
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return false

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/realtime/v1/api/broadcast/${topic}/events/${REALTIME_EVENT}`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: true }),
      cache: "no-store",
    },
  )

  return response.ok
}

export async function broadcastMatchChatRefresh(input: {
  matchId: string
  leagueId: string
  seasonId: string
  includeOverview?: boolean
}) {
  const topics = [getMatchChatRealtimeTopic(input.matchId)]
  if (input.includeOverview !== false) {
    topics.push(getChatOverviewRealtimeTopic(input.leagueId, input.seasonId))
  }
  await Promise.all(topics.map((topic) => broadcastTopic(topic).catch(() => false)))
}

export const CHAT_REALTIME_EVENT = REALTIME_EVENT
