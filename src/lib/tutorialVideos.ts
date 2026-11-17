/** Shared (client + server) rules for the tutorial videos shown in Help. */
export const TUTORIAL_BUCKET = "tutorial-videos"
export const TUTORIAL_URL_TTL_SECONDS = 60 * 60 * 6

export type TutorialAudience = "draft" | "public" | "leagues"
export const TUTORIAL_AUDIENCES: TutorialAudience[] = ["draft", "public", "leagues"]

const FILE_TYPES = {
  "video/mp4": { kind: "video", extension: "mp4", maxBytes: 50 * 1024 * 1024 },
  "image/jpeg": { kind: "poster", extension: "jpg", maxBytes: 5 * 1024 * 1024 },
  "image/png": { kind: "poster", extension: "png", maxBytes: 5 * 1024 * 1024 },
  "image/webp": { kind: "poster", extension: "webp", maxBytes: 5 * 1024 * 1024 },
} as const satisfies Record<string, { kind: "video" | "poster"; extension: string; maxBytes: number }>

export const TUTORIAL_FILE_ACCEPT = "video/mp4"

export function getTutorialFileRule(contentType: unknown) {
  return typeof contentType === "string" && contentType in FILE_TYPES
    ? FILE_TYPES[contentType as keyof typeof FILE_TYPES]
    : null
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"

export function buildTutorialPath(objectId: string, contentType: string) {
  const rule = getTutorialFileRule(contentType)
  return rule ? `${objectId}.${rule.extension}` : null
}

export function isTutorialPath(path: unknown, kind: "video" | "poster") {
  if (typeof path !== "string") return false
  const match = new RegExp(`^${UUID}\\.(mp4|jpg|png|webp)$`, "i").exec(path)
  if (!match) return false
  return kind === "video" ? match[1].toLowerCase() === "mp4" : match[1].toLowerCase() !== "mp4"
}

export type TutorialAccess = {
  audience: TutorialAudience
  /** Leagues the tutorial is limited to (only meaningful for 'leagues'). */
  leagueIds: string[]
  /** Leagues the viewer belongs to. */
  memberLeagueIds: string[]
  isSuperuser: boolean
}

/** Who sees a tutorial: the manager sees all; everyone with a session sees 'public'; members see their leagues'. */
export function canViewTutorial({ audience, leagueIds, memberLeagueIds, isSuperuser }: TutorialAccess) {
  if (isSuperuser) return true
  if (audience === "public") return true
  if (audience === "leagues") return leagueIds.some((id) => memberLeagueIds.includes(id))
  return false
}

export type TutorialSummary = {
  id: string
  title: string
  description: string
  position: number
  posterUrl: string | null
  width: number | null
  height: number | null
  durationMs: number | null
  seen: boolean
}

export type TutorialAdminItem = TutorialSummary & {
  audience: TutorialAudience
  leagueIds: string[]
  viewCount: number
}

export function formatTutorialDuration(durationMs: number | null) {
  if (durationMs === null || durationMs <= 0) return ""
  const total = Math.round(durationMs / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}
