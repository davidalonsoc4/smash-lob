import "server-only"

import { signLeagueChatMediaUrls } from "@/lib/serverLeagueChatMedia"
import type { getLeagueSeasonChatActor } from "@/lib/serverLeagueSeasonChatAccess"

type ChatActor = Extract<Awaited<ReturnType<typeof getLeagueSeasonChatActor>>, { ok: true }>["actor"]

export const LEAGUE_CHAT_MESSAGE_FIELDS =
  "id,sender_user_id,sender_display_name,body,created_at,edited_at,deleted_at,media_kind,media_path,reply_to_id,is_announcement,media_poster_path,media_width,media_height,media_duration_ms,has_poll"

export type LeagueChatMessageRow = {
  id: string
  sender_user_id: string
  sender_display_name: string
  body: string
  created_at: string
  edited_at: string | null
  deleted_at: string | null
  media_kind: string | null
  media_path: string | null
  reply_to_id: string | null
  is_announcement: boolean
  media_poster_path: string | null
  media_width: number | null
  media_height: number | null
  media_duration_ms: number | null
  has_poll: boolean
}

export type LeagueChatPoll = {
  options: { id: string; label: string; votes: number; voterIds: string[] }[]
  total: number
  myVote: string | null
}

const REPLY_SNIPPET_LENGTH = 140

/**
 * Turns database rows into what participants may see: short-lived signed URLs instead of storage paths,
 * no media for deleted messages, and a small preview of the message each one replies to.
 */
export async function shapeLeagueChatMessages(actor: ChatActor, seasonId: string, rows: LeagueChatMessageRow[]) {
  const urls = await signLeagueChatMediaUrls(
    actor,
    rows.flatMap((row) => (row.deleted_at ? [] : [row.media_path, row.media_poster_path].filter((path): path is string => Boolean(path)))),
  )
  if (!urls) return null

  const replyIds = [...new Set(rows.flatMap((row) => (row.reply_to_id ? [row.reply_to_id] : [])))]
  const originals = new Map<string, { sender_user_id: string; sender_display_name: string; body: string; deleted_at: string | null; media_kind: string | null }>()
  if (replyIds.length) {
    const found = await actor.supabase
      .from("league_season_chat_messages")
      .select("id,sender_user_id,sender_display_name,body,deleted_at,media_kind")
      .eq("season_id", seasonId)
      .in("id", replyIds)
    if (found.error) return null
    for (const item of found.data ?? []) originals.set(item.id, item)
  }

  const pollMessageIds = rows.filter((row) => row.has_poll && !row.deleted_at).map((row) => row.id)
  const polls = new Map<string, LeagueChatPoll>()
  if (pollMessageIds.length) {
    const [options, votes] = await Promise.all([
      actor.supabase.from("league_season_chat_poll_options").select("id,message_id,position,label").in("message_id", pollMessageIds).order("position", { ascending: true }),
      actor.supabase.from("league_season_chat_poll_votes").select("message_id,user_id,option_id").in("message_id", pollMessageIds),
    ])
    if (options.error || votes.error) return null
    for (const messageId of pollMessageIds) {
      const messageVotes = (votes.data ?? []).filter((vote) => vote.message_id === messageId)
      const choices = (options.data ?? []).filter((option) => option.message_id === messageId).map((option) => {
        const voterIds = messageVotes.filter((vote) => vote.option_id === option.id).map((vote) => vote.user_id as string)
        return { id: option.id as string, label: option.label as string, votes: voterIds.length, voterIds }
      })
      polls.set(messageId, {
        options: choices,
        total: messageVotes.length,
        myVote: messageVotes.find((vote) => vote.user_id === actor.user.id)?.option_id ?? null,
      })
    }
  }

  return rows.map(({ media_path, media_poster_path, has_poll, ...row }) => {
    const original = row.reply_to_id ? originals.get(row.reply_to_id) : undefined
    return {
      ...row,
      media_kind: row.deleted_at ? null : row.media_kind,
      media_url: media_path && !row.deleted_at ? (urls.get(media_path) ?? null) : null,
      media_poster_url: media_poster_path && !row.deleted_at ? (urls.get(media_poster_path) ?? null) : null,
      poll: has_poll && !row.deleted_at ? (polls.get(row.id) ?? null) : null,
      reply: original
        ? {
            id: row.reply_to_id as string,
            sender_user_id: original.sender_user_id,
            sender_display_name: original.sender_display_name,
            body: original.deleted_at ? "" : original.body.slice(0, REPLY_SNIPPET_LENGTH),
            deleted: Boolean(original.deleted_at),
            media_kind: original.deleted_at ? null : original.media_kind,
          }
        : null,
    }
  })
}
