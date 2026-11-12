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

export function getPersonalMatchChatRealtimeTopic(matchId: string) {
  const token = topicToken(`personal-match:${matchId}`)
  return token ? `sl_chat_personal_${token}` : null
}

export function getLeagueSeasonChatRealtimeTopic(seasonId: string) {
  const token = topicToken(`league-season:${seasonId}`)
  return token ? `sl_chat_season_${token}` : null
}

export function getChatOverviewRealtimeTopic(leagueId: string, seasonId: string) {
  const token = topicToken(`overview:${leagueId}:${seasonId}`)
  return token ? `sl_chat_overview_${token}` : null
}

async function broadcastTopic(topic: string | null, leagueDataChanged = false) {
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
      body: JSON.stringify({ refresh: true, ...(leagueDataChanged ? { leagueDataChanged } : {}) }),
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
  leagueDataChanged?: boolean
}) {
  const thread = broadcastTopic(getMatchChatRealtimeTopic(input.matchId)).catch(() => false)
  const overview = input.includeOverview === false ? null : broadcastTopic(
    getChatOverviewRealtimeTopic(input.leagueId, input.seasonId), input.leagueDataChanged,
  ).catch(() => false)
  await Promise.all([thread, overview])
}

export const CHAT_REALTIME_EVENT = REALTIME_EVENT

export async function broadcastLeagueSeasonChatRefresh(leagueId: string, seasonId: string) {
  await Promise.all([
    getLeagueSeasonChatRealtimeTopic(seasonId),
    getChatOverviewRealtimeTopic(leagueId, seasonId),
  ].map((topic) => broadcastTopic(topic).catch(() => false)))
}


export async function broadcastPersonalMatchChatRefresh(matchId: string) {
  await broadcastTopic(getPersonalMatchChatRealtimeTopic(matchId)).catch(() => false)
}
