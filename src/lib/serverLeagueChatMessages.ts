import "server-only"

import { signLeagueChatMediaUrls } from "@/lib/serverLeagueChatMedia"
import type { getLeagueSeasonChatActor } from "@/lib/serverLeagueSeasonChatAccess"

type ChatActor = Extract<Awaited<ReturnType<typeof getLeagueSeasonChatActor>>, { ok: true }>["actor"]

export const LEAGUE_CHAT_MESSAGE_FIELDS =
  "id,sender_user_id,sender_display_name,body,created_at,edited_at,deleted_at,media_kind,media_path,reply_to_id,is_announcement"

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
}

const REPLY_SNIPPET_LENGTH = 140

/**
 * Turns database rows into what participants may see: short-lived signed URLs instead of storage paths,
 * no media for deleted messages, and a small preview of the message each one replies to.
 */
export async function shapeLeagueChatMessages(actor: ChatActor, seasonId: string, rows: LeagueChatMessageRow[]) {
  const urls = await signLeagueChatMediaUrls(
    actor,
    rows.flatMap((row) => (row.media_path && !row.deleted_at ? [row.media_path] : [])),
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

  return rows.map(({ media_path, ...row }) => {
    const original = row.reply_to_id ? originals.get(row.reply_to_id) : undefined
    return {
      ...row,
      media_kind: row.deleted_at ? null : row.media_kind,
      media_url: media_path && !row.deleted_at ? (urls.get(media_path) ?? null) : null,
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
