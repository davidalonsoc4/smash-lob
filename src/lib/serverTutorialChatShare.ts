import "server-only"

import { randomUUID } from "node:crypto"
import sharp from "sharp"
import type { SupabaseClient } from "@supabase/supabase-js"
import { LEAGUE_CHAT_MEDIA_BUCKET } from "@/lib/leagueChatMedia"
import { broadcastLeagueSeasonChatRefresh } from "@/lib/serverChatRealtime"
import { notifyLeagueChatAnnouncement } from "@/lib/serverLeagueChatAnnouncement"
import type { TutorialRow } from "@/lib/serverTutorials"
import { TUTORIAL_BUCKET } from "@/lib/tutorialVideos"

export type TutorialChatMedia = {
  mediaPath: string
  posterPath: string | null
  width: number | null
  height: number | null
  durationMs: number | null
  title: string
}

/** Size of the thumbnail, so the chat can show the message in the shape of the image instead of the (vertical) video. */
async function readPosterSize(supabase: SupabaseClient, posterPath: string) {
  try {
    const file = await supabase.storage.from(TUTORIAL_BUCKET).download(posterPath)
    if (file.error || !file.data) return null
    const meta = await sharp(Buffer.from(await file.data.arrayBuffer())).metadata()
    return meta.width && meta.height ? { width: meta.width, height: meta.height } : null
  } catch {
    return null
  }
}

/**
 * Copies a tutorial's files into the chat bucket so the message keeps working on its own, even if the tutorial is
 * later changed or deleted. The message takes the shape of the thumbnail when there is one.
 */
export async function copyTutorialToChat(supabase: SupabaseClient, tutorial: TutorialRow, seasonId: string): Promise<TutorialChatMedia | null> {
  const storage = supabase.storage.from(TUTORIAL_BUCKET)
  const mediaPath = `${seasonId}/${randomUUID()}.mp4`
  const copiedVideo = await storage.copy(tutorial.video_path, mediaPath, { destinationBucket: LEAGUE_CHAT_MEDIA_BUCKET })
  if (copiedVideo.error) return null
  let posterPath: string | null = null
  let size = tutorial.width && tutorial.height ? { width: tutorial.width, height: tutorial.height } : null
  if (tutorial.poster_path) {
    const extension = tutorial.poster_path.split(".").pop() ?? "jpg"
    const candidate = `${seasonId}/${randomUUID()}.${extension}`
    const copiedPoster = await storage.copy(tutorial.poster_path, candidate, { destinationBucket: LEAGUE_CHAT_MEDIA_BUCKET })
    if (!copiedPoster.error) {
      posterPath = candidate
      size = (await readPosterSize(supabase, tutorial.poster_path)) ?? size
    }
  }
  return { mediaPath, posterPath, width: size?.width ?? null, height: size?.height ?? null, durationMs: tutorial.duration_ms, title: tutorial.title }
}

/** The chat that receives the automatic notice: the newest season that is running or has not started. */
async function latestOpenSeasonId(supabase: SupabaseClient, leagueId: string) {
  const found = await supabase.from("seasons").select("id").eq("league_id", leagueId).in("status", ["active", "upcoming"])
    .order("created_at", { ascending: false }).limit(1).maybeSingle()
  return found.error ? null : ((found.data?.id as string | undefined) ?? null)
}

export type TutorialAnnouncementResult = { posted: number; skipped: { leagueId: string; leagueName: string; reason: "no_season" | "failed" }[] }

/**
 * Posts the tutorial as a "Novedad" signed by each league itself, in the chat of its newest open season.
 * Every league is announced once: the link remembers it (announced_at), so editing the tutorial never repeats it.
 */
export async function announceTutorialInLeagues({ supabase, user, tutorial, leagueIds }: {
  supabase: SupabaseClient
  user: Parameters<typeof notifyLeagueChatAnnouncement>[0]["user"]
  tutorial: TutorialRow
  leagueIds: string[]
}): Promise<TutorialAnnouncementResult> {
  const result: TutorialAnnouncementResult = { posted: 0, skipped: [] }
  if (!leagueIds.length) return result
  const [links, leagues] = await Promise.all([
    supabase.from("tutorial_video_leagues").select("league_id,announced_at").eq("tutorial_id", tutorial.id).in("league_id", leagueIds),
    supabase.from("leagues").select("id,name").in("id", leagueIds),
  ])
  const alreadyAnnounced = new Set((links.data ?? []).filter((link) => link.announced_at).map((link) => String(link.league_id)))
  const names = new Map((leagues.data ?? []).map((league) => [String(league.id), String(league.name)]))
  for (const leagueId of leagueIds) {
    if (alreadyAnnounced.has(leagueId)) continue
    const leagueName = names.get(leagueId) ?? "Liga"
    const seasonId = await latestOpenSeasonId(supabase, leagueId)
    // The reason is stored, so the management screen can show what is still pending (a scheduled run has nobody watching).
    const skip = async (reason: "no_season" | "failed") => {
      result.skipped.push({ leagueId, leagueName, reason })
      await supabase.from("tutorial_video_leagues").update({ announce_failed_reason: reason }).eq("tutorial_id", tutorial.id).eq("league_id", leagueId)
    }
    if (!seasonId) { await skip("no_season"); continue }
    const media = await copyTutorialToChat(supabase, tutorial, seasonId)
    const sent = media
      ? await supabase.rpc("send_league_system_announcement", {
          p_season_id: seasonId, p_sender_display_name: leagueName, p_body: media.title, p_media_path: media.mediaPath,
          p_poster_path: media.posterPath, p_width: media.width, p_height: media.height, p_duration_ms: media.durationMs,
        })
      : null
    const message = sent && !sent.error ? (sent.data as { id: string } | null) : null
    if (!message?.id) { await skip("failed"); continue }
    await supabase.from("tutorial_video_leagues").update({ announced_at: new Date().toISOString(), announce_failed_reason: null }).eq("tutorial_id", tutorial.id).eq("league_id", leagueId)
    try { await broadcastLeagueSeasonChatRefresh(leagueId, seasonId) } catch { /* the message is saved; clients refresh on their own */ }
    await notifyLeagueChatAnnouncement({ supabase, user, leagueId, seasonId, messageId: message.id, body: media!.title })
    result.posted += 1
  }
  return result
}
