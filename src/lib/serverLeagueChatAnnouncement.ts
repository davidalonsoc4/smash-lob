import "server-only"

import { recordServerActorActivity } from "@/lib/serverActivityWrite"

type ActivityArgs = Parameters<typeof recordServerActorActivity>[0]

/**
 * A "Novedad" always notifies every participant of the chat. The event type is in the always-enabled list,
 * so personal and league notification settings do not silence it. The message is already saved if this fails.
 */
export async function notifyLeagueChatAnnouncement({ supabase, user, leagueId, seasonId, messageId, body }: {
  supabase: ActivityArgs["supabase"]
  user: ActivityArgs["user"]
  leagueId: string
  seasonId: string
  messageId: string
  body: string
}) {
  try {
    const [participants, league] = await Promise.all([
      supabase.from("league_season_chat_participants").select("user_id,player_id").eq("season_id", seasonId),
      supabase.from("leagues").select("name").eq("id", leagueId).maybeSingle(),
    ])
    const rows = participants.data ?? []
    await recordServerActorActivity({
      supabase, user, membership: null,
      leagueId,
      seasonId,
      type: "league_chat_announcement",
      title: `Novedad · ${league.data?.name ?? "Liga"}`,
      description: body.slice(0, 200) || "Hay una novedad en el chat de la liga.",
      metadata: {
        messageId,
        forcePush: true,
        targetUserIds: rows.map((row) => row.user_id),
        targetPlayerIds: rows.flatMap((row) => (row.player_id ? [row.player_id] : [])),
      },
    })
  } catch {
    // Delivery problems must not lose the message itself.
  }
}
