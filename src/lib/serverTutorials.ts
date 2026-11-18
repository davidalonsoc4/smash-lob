import "server-only"

import {
  TUTORIAL_BUCKET,
  TUTORIAL_URL_TTL_SECONDS,
  canViewTutorial,
  type TutorialAdminItem,
  type TutorialAudience,
} from "@/lib/tutorialVideos"
import type { requireAuthenticatedAppUser } from "@/lib/serverAuth"

type Actor = Extract<Awaited<ReturnType<typeof requireAuthenticatedAppUser>>, { ok: true }>["actor"]

export const TUTORIAL_FIELDS =
  "id,title,description,position,audience,video_path,poster_path,width,height,duration_ms,created_at"

export type TutorialRow = {
  id: string
  title: string
  description: string
  position: number
  audience: TutorialAudience
  video_path: string
  poster_path: string | null
  width: number | null
  height: number | null
  duration_ms: number | null
}

export async function getMemberLeagueIds(actor: Actor) {
  const memberships = await actor.supabase.from("league_memberships").select("league_id").eq("user_id", actor.user.id)
  if (memberships.error) return null
  return (memberships.data ?? []).map((row) => String(row.league_id))
}

async function signPaths(actor: Actor, paths: string[]) {
  const unique = [...new Set(paths)]
  const urls = new Map<string, string>()
  if (!unique.length) return urls
  const signed = await actor.supabase.storage.from(TUTORIAL_BUCKET).createSignedUrls(unique, TUTORIAL_URL_TTL_SECONDS)
  if (signed.error) return null
  for (const item of signed.data ?? []) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl)
  return urls
}

export async function signTutorialPaths(actor: Actor, paths: string[]) {
  return signPaths(actor, paths)
}

/** The tutorials this person may see, in display order, with thumbnails signed and the "seen" mark. */
export async function listVisibleTutorials(actor: Actor): Promise<TutorialAdminItem[] | null> {
  const [rows, links, views, memberLeagueIds] = await Promise.all([
    actor.supabase.from("tutorial_videos").select(TUTORIAL_FIELDS).order("position", { ascending: true }).order("created_at", { ascending: true }),
    actor.supabase.from("tutorial_video_leagues").select("tutorial_id,league_id,announced_at"),
    actor.supabase.from("tutorial_video_views").select("tutorial_id").eq("user_id", actor.user.id),
    getMemberLeagueIds(actor),
  ])
  if (rows.error || links.error || views.error || memberLeagueIds === null) return null

  const leaguesByTutorial = new Map<string, string[]>()
  for (const link of links.data ?? []) {
    const list = leaguesByTutorial.get(String(link.tutorial_id)) ?? []
    list.push(String(link.league_id))
    leaguesByTutorial.set(String(link.tutorial_id), list)
  }
  const announcedByTutorial = new Map<string, string[]>()
  for (const link of links.data ?? []) {
    if (!link.announced_at) continue
    const list = announcedByTutorial.get(String(link.tutorial_id)) ?? []
    list.push(String(link.league_id))
    announcedByTutorial.set(String(link.tutorial_id), list)
  }
  const seen = new Set((views.data ?? []).map((row) => String(row.tutorial_id)))
  const visible = ((rows.data ?? []) as unknown as TutorialRow[]).filter((row) =>
    canViewTutorial({
      audience: row.audience,
      leagueIds: leaguesByTutorial.get(row.id) ?? [],
      memberLeagueIds,
      isSuperuser: requireTutorialManager(actor),
    }),
  )
  const posters = await signPaths(actor, visible.flatMap((row) => (row.poster_path ? [row.poster_path] : [])))
  if (posters === null) return null
  return visible.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    position: row.position,
    audience: row.audience,
    leagueIds: leaguesByTutorial.get(row.id) ?? [],
    announcedLeagueIds: announcedByTutorial.get(row.id) ?? [],
    viewCount: 0,
    posterUrl: row.poster_path ? (posters.get(row.poster_path) ?? null) : null,
    width: row.width,
    height: row.height,
    durationMs: row.duration_ms,
    seen: seen.has(row.id),
  }))
}

/** One tutorial if (and only if) this person may see it. */
export async function getVisibleTutorial(actor: Actor, tutorialId: string) {
  const list = await listVisibleTutorials(actor)
  if (list === null) return { status: "error" as const }
  const item = list.find((entry) => entry.id === tutorialId)
  if (!item) return { status: "not_found" as const }
  const row = await actor.supabase.from("tutorial_videos").select(TUTORIAL_FIELDS).eq("id", tutorialId).maybeSingle()
  if (row.error || !row.data) return { status: "error" as const }
  return { status: "ok" as const, item, row: row.data as unknown as TutorialRow }
}

export function requireTutorialManager(actor: Actor) {
  return actor.user.isSuperuser || actor.user.isAppAdmin
}
