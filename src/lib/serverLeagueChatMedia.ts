import "server-only"

import { LEAGUE_CHAT_MEDIA_BUCKET, LEAGUE_CHAT_MEDIA_URL_TTL_SECONDS } from "@/lib/leagueChatMedia"
import type { getLeagueSeasonChatActor } from "@/lib/serverLeagueSeasonChatAccess"

type ChatActor = Extract<Awaited<ReturnType<typeof getLeagueSeasonChatActor>>, { ok: true }>["actor"]

async function getLeagueChatRole(actor: ChatActor, leagueId: string) {
  const membership = await actor.supabase
    .from("league_memberships")
    .select("role")
    .eq("league_id", leagueId)
    .eq("user_id", actor.user.id)
    .maybeSingle()
  return membership.error ? null : ((membership.data?.role as string | undefined) ?? "")
}

/** Only the league creator can publish photos and videos. Checked on the server, not only in the UI. */
export async function canPublishLeagueChatMedia(actor: ChatActor, leagueId: string) {
  const role = await getLeagueChatRole(actor, leagueId)
  return role === null ? null : role === "creator"
}

/** The creator and the administrators can post a "Novedad" that notifies every participant. */
export async function canAnnounceInLeagueChat(actor: ChatActor, leagueId: string) {
  const role = await getLeagueChatRole(actor, leagueId)
  return role === null ? null : role === "creator" || role === "admin"
}

/** Short-lived signed URLs, issued only after the caller was verified as a chat participant. */
export async function signLeagueChatMediaUrls(actor: ChatActor, paths: string[]) {
  const unique = [...new Set(paths)]
  const urls = new Map<string, string>()
  if (!unique.length) return urls
  const signed = await actor.supabase.storage
    .from(LEAGUE_CHAT_MEDIA_BUCKET)
    .createSignedUrls(unique, LEAGUE_CHAT_MEDIA_URL_TTL_SECONDS)
  if (signed.error) return null
  for (const item of signed.data ?? []) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl)
  return urls
}

export async function leagueChatMediaExists(actor: ChatActor, path: string) {
  const slash = path.lastIndexOf("/")
  const found = await actor.supabase.storage
    .from(LEAGUE_CHAT_MEDIA_BUCKET)
    .list(path.slice(0, slash), { search: path.slice(slash + 1), limit: 1 })
  return !found.error && (found.data ?? []).some((item) => item.name === path.slice(slash + 1))
}
