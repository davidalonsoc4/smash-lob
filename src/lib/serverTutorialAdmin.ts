import "server-only"

import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { TUTORIAL_AUDIENCES, TUTORIAL_BUCKET, TUTORIAL_CATEGORIES, isTutorialPath, isTutorialScreen, type TutorialAudience, type TutorialCategory, type TutorialScreenId } from "@/lib/tutorialVideos"
import { announceTutorialInLeagues } from "@/lib/serverTutorialChatShare"
import { TUTORIAL_FIELDS, requireTutorialManager, type TutorialRow } from "@/lib/serverTutorials"
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

export type TutorialFields = { title: string; description: string; audience: TutorialAudience; leagueIds: string[]; publishAt: string | null; screen: TutorialScreenId | null; category: TutorialCategory }

const MAX_SCHEDULE_AHEAD_MS = 2 * 365 * 24 * 3_600_000

/** A moment in the future (ISO) or null when it is empty, already past (publish now) or the tutorial is a draft; undefined if invalid. */
function parsePublishAt(value: unknown, audience: TutorialAudience, now = Date.now()) {
  if (value === undefined || value === null || value === "") return null
  if (typeof value !== "string") return undefined
  const time = Date.parse(value)
  if (!Number.isFinite(time) || time - now > MAX_SCHEDULE_AHEAD_MS) return undefined
  return audience === "draft" || time <= now ? null : new Date(time).toISOString()
}

/** Validates the editable fields; null means the input is invalid. */
export function parseTutorialFields(input: Record<string, unknown> | null): TutorialFields | null {
  if (!input) return null
  const title = normalizeBoundedText(input.title, 120)
  const description = typeof input.description === "string" ? input.description.trim().slice(0, 500) : ""
  const rawAudience = input.audience as TutorialAudience
  const category = (input.category === undefined || input.category === null ? "app" : input.category) as TutorialCategory
  if (!title || !TUTORIAL_AUDIENCES.includes(rawAudience) || !TUTORIAL_CATEGORIES.includes(category)) return null
  // Social media material is never published to the app: it stays a private draft that only the managers see.
  if (category === "social") return { title, description, audience: "draft", leagueIds: [], publishAt: null, screen: null, category }
  const audience = rawAudience
  const rawLeagues = Array.isArray(input.leagueIds) ? input.leagueIds : []
  const leagueIds = [...new Set(rawLeagues.map(validateUuid))]
  if (leagueIds.some((id) => id === null)) return null
  const ids = leagueIds as string[]
  if (audience === "leagues" && ids.length === 0) return null
  const publishAt = parsePublishAt(input.publishAt, audience)
  if (publishAt === undefined) return null
  const rawScreen = input.screen === undefined || input.screen === null || input.screen === "" ? null : input.screen
  if (rawScreen !== null && !isTutorialScreen(rawScreen)) return null
  return { title, description, audience, leagueIds: audience === "leagues" ? ids : [], publishAt, screen: rawScreen, category }
}

export async function tutorialFileExists(actor: Actor, path: string) {
  const found = await actor.supabase.storage.from(TUTORIAL_BUCKET).list("", { search: path, limit: 5 })
  return !found.error && (found.data ?? []).some((item) => item.name === path)
}

export function validTutorialPaths(videoPath: unknown, posterPath: unknown) {
  if (!isTutorialPath(videoPath, "video")) return false
  return posterPath === null || posterPath === undefined || isTutorialPath(posterPath, "poster")
}

/**
 * Makes the tutorial's leagues exactly `leagueIds`. Leagues that stay keep their row, so the mark that says the
 * league was already announced (announced_at) is not lost when the tutorial is edited.
 */
export async function replaceTutorialLeagues(actor: Actor, tutorialId: string, leagueIds: string[]) {
  const current = await actor.supabase.from("tutorial_video_leagues").select("league_id").eq("tutorial_id", tutorialId)
  if (current.error) return false
  const existing = new Set((current.data ?? []).map((row) => String(row.league_id)))
  const removable = [...existing].filter((id) => !leagueIds.includes(id))
  if (removable.length) {
    const removed = await actor.supabase.from("tutorial_video_leagues").delete().eq("tutorial_id", tutorialId).in("league_id", removable)
    if (removed.error) return false
  }
  const missing = leagueIds.filter((id) => !existing.has(id))
  if (!missing.length) return true
  const added = await actor.supabase
    .from("tutorial_video_leagues")
    .insert(missing.map((leagueId) => ({ tutorial_id: tutorialId, league_id: leagueId })))
  return !added.error
}

export async function allLeaguesExist(actor: Actor, leagueIds: string[]) {
  if (!leagueIds.length) return true
  const found = await actor.supabase.from("leagues").select("id").in("id", leagueIds)
  return !found.error && (found.data ?? []).length === leagueIds.length
}

/** Scheduling columns for a save: the notice waits for publish_at when there is one, otherwise it goes out right away. */
export function tutorialScheduleColumns(fields: TutorialFields, announce: boolean) {
  return { publish_at: fields.publishAt, announce_on_publish: Boolean(fields.publishAt) && announce && fields.audience === "leagues" }
}

/** Posts the "Novedad" in the chats of the leagues that were not announced yet, when the admin asked for it. Scheduled tutorials wait. */
export async function announceTutorialIfRequested(actor: Actor, tutorialId: string, wanted: boolean, fields: Pick<TutorialFields, "audience" | "leagueIds" | "publishAt">) {
  const { audience, leagueIds } = fields
  if (!wanted || fields.publishAt || audience !== "leagues" || !leagueIds.length) return null
  const row = await actor.supabase.from("tutorial_videos").select(TUTORIAL_FIELDS).eq("id", tutorialId).maybeSingle()
  if (row.error || !row.data) return null
  return announceTutorialInLeagues({ supabase: actor.supabase, user: actor.user, tutorial: row.data as unknown as TutorialRow, leagueIds })
}
