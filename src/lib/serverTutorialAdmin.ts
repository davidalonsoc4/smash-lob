import "server-only"

import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { TUTORIAL_AUDIENCES, TUTORIAL_BUCKET, isTutorialPath, type TutorialAudience } from "@/lib/tutorialVideos"
import { requireTutorialManager } from "@/lib/serverTutorials"
import { normalizeBoundedText, validateUuid } from "@/lib/serverRequest"

/** The superuser and the app admin manage tutorials. */
export async function requireTutorialAdmin() {
  const auth = await requireAuthenticatedAppUser()
  if (!auth.ok) return auth
  if (!requireTutorialManager(auth.actor)) return { ok: false as const, status: 403, error: "forbidden" }
  return auth
}

export const adminFail = (error: string, status: number) => NextResponse.json({ error }, { status })

type Actor = Extract<Awaited<ReturnType<typeof requireTutorialAdmin>>, { ok: true }>["actor"]

export type TutorialFields = { title: string; description: string; audience: TutorialAudience; leagueIds: string[] }

/** Validates the editable fields; null means the input is invalid. */
export function parseTutorialFields(input: Record<string, unknown> | null): TutorialFields | null {
  if (!input) return null
  const title = normalizeBoundedText(input.title, 120)
  const description = typeof input.description === "string" ? input.description.trim().slice(0, 500) : ""
  const audience = input.audience as TutorialAudience
  if (!title || !TUTORIAL_AUDIENCES.includes(audience)) return null
  const rawLeagues = Array.isArray(input.leagueIds) ? input.leagueIds : []
  const leagueIds = [...new Set(rawLeagues.map(validateUuid))]
  if (leagueIds.some((id) => id === null)) return null
  const ids = leagueIds as string[]
  if (audience === "leagues" && ids.length === 0) return null
  return { title, description, audience, leagueIds: audience === "leagues" ? ids : [] }
}

export async function tutorialFileExists(actor: Actor, path: string) {
  const found = await actor.supabase.storage.from(TUTORIAL_BUCKET).list("", { search: path, limit: 5 })
  return !found.error && (found.data ?? []).some((item) => item.name === path)
}

export function validTutorialPaths(videoPath: unknown, posterPath: unknown) {
  if (!isTutorialPath(videoPath, "video")) return false
  return posterPath === null || posterPath === undefined || isTutorialPath(posterPath, "poster")
}

export async function replaceTutorialLeagues(actor: Actor, tutorialId: string, leagueIds: string[]) {
  const removed = await actor.supabase.from("tutorial_video_leagues").delete().eq("tutorial_id", tutorialId)
  if (removed.error) return false
  if (!leagueIds.length) return true
  const added = await actor.supabase
    .from("tutorial_video_leagues")
    .insert(leagueIds.map((leagueId) => ({ tutorial_id: tutorialId, league_id: leagueId })))
  return !added.error
}

export async function allLeaguesExist(actor: Actor, leagueIds: string[]) {
  if (!leagueIds.length) return true
  const found = await actor.supabase.from("leagues").select("id").in("id", leagueIds)
  return !found.error && (found.data ?? []).length === leagueIds.length
}
