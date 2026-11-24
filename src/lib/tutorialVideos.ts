/** Shared (client + server) rules for the tutorial videos shown in Help. */
export const TUTORIAL_BUCKET = "tutorial-videos"
export const TUTORIAL_URL_TTL_SECONDS = 60 * 60 * 6

export type TutorialAudience = "draft" | "public" | "leagues"
export const TUTORIAL_AUDIENCES: TutorialAudience[] = ["draft", "public", "leagues"]

/** 'app' = tutorial of the application (with its audience); 'social' = material for social media, only seen by whoever manages tutorials. */
export type TutorialCategory = "app" | "social"
export const TUTORIAL_CATEGORIES: TutorialCategory[] = ["app", "social"]

/** Who a tutorial is for: 'player' = any player; 'creator' = only who organizes (league creators and admins). */
export type TutorialRole = "player" | "creator"
export const TUTORIAL_ROLES: TutorialRole[] = ["player", "creator"]

/** The tab of Help a tutorial belongs to: generic, league videos or social media. */
export type TutorialGroup = "generic" | "leagues" | "social"
export function getTutorialGroup(category: TutorialCategory | null | undefined, audience: TutorialAudience): TutorialGroup {
  if (category === "social") return "social"
  return audience === "leagues" ? "leagues" : "generic"
}

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

/** Screens a tutorial video can belong to. The help button of each screen offers the video of that screen. */
export const TUTORIAL_SCREENS = [
  { id: "home", label: "Inicio", pattern: /^\/league\/home(\/|$)/ },
  { id: "matches", label: "Partidos y jornadas", pattern: /^\/matches(\/|$)/ },
  { id: "match-chat", label: "Chat del partido", pattern: /^\/match\/[^/]+\/chat(\/|$)/ },
  { id: "match", label: "Detalle de partido", pattern: /^\/match\/[^/]+\/?$/ },
  { id: "chats", label: "Chats", pattern: /^\/chats(\/|$)/ },
  { id: "ranking", label: "Clasificación", pattern: /^\/ranking(\/|$)/ },
  { id: "statistics", label: "Estadísticas", pattern: /^\/statistics(\/|$)/ },
  { id: "notification-settings", label: "Ajustes de notificaciones", pattern: /^\/settings\/notifications(\/|$)/ },
  { id: "profile", label: "Perfil y disponibilidad", pattern: /^\/(settings\/profile|availability|profile)(\/|$)/ },
  { id: "settings", label: "Ajustes", pattern: /^\/settings\/?$/ },
  { id: "personal-matches", label: "Amistosos", pattern: /^\/personal-matches(\/|$)/ },
  { id: "payments", label: "Pagos", pattern: /^\/payments(\/|$)/ },
  { id: "leagues", label: "Mis Competiciones", pattern: /^\/leagues(\/|$)/ },
  { id: "activity", label: "Actividad", pattern: /^\/activity(\/|$)/ },
  { id: "season-admin", label: "Administrar temporada", pattern: /^\/admin\/season(\/|$)/ },
  { id: "league-admin", label: "Administrar liga", pattern: /^\/admin\/league(\/|$)/ },
  { id: "users-admin", label: "Usuarios y roles", pattern: /^\/admin\/users(\/|$)/ },
  { id: "tournaments", label: "Torneos", pattern: /^\/tournaments(\/|$)/ },
] as const
export type TutorialScreenId = (typeof TUTORIAL_SCREENS)[number]["id"]

export function isTutorialScreen(value: unknown): value is TutorialScreenId {
  return typeof value === "string" && TUTORIAL_SCREENS.some((screen) => screen.id === value)
}

/** The tutorial screen a path belongs to, or null when no video is organised for it. */
export function getTutorialScreenForPath(pathname: string): TutorialScreenId | null {
  return TUTORIAL_SCREENS.find((screen) => screen.pattern.test(pathname))?.id ?? null
}

export type TutorialAccess = {
  audience: TutorialAudience
  /** Leagues the tutorial is limited to (only meaningful for 'leagues'). */
  leagueIds: string[]
  /** Leagues the viewer belongs to. */
  memberLeagueIds: string[]
  isSuperuser: boolean
  /** Scheduled publication (ISO). Until then only managers see it. */
  publishAt?: string | null
  now?: number
  /** Social media material is only seen by the managers, whatever its audience. */
  category?: TutorialCategory | null
  /** Who the tutorial is for; 'creator' ones are hidden from people who do not organize any league. */
  role?: TutorialRole | null
  /** Leagues where the viewer is creator or admin. */
  organizerLeagueIds?: string[]
}

/** True while a tutorial is scheduled for a moment that has not come yet. */
export function isTutorialScheduled(publishAt: string | null | undefined, now = Date.now()) {
  if (!publishAt) return false
  const time = Date.parse(publishAt)
  return Number.isFinite(time) && time > now
}

/** Who sees a tutorial: the manager sees all; everyone with a session sees 'public'; members see their leagues'. */
export function canViewTutorial({ audience, leagueIds, memberLeagueIds, isSuperuser, publishAt, now, category, role, organizerLeagueIds = [] }: TutorialAccess) {
  if (isSuperuser) return true
  if (category === "social") return false
  if (isTutorialScheduled(publishAt, now)) return false
  const forCreators = role === "creator"
  if (audience === "public") return !forCreators || organizerLeagueIds.length > 0
  if (audience === "leagues") return leagueIds.some((id) => (forCreators ? organizerLeagueIds : memberLeagueIds).includes(id))
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
  /** Screen this video explains (see TUTORIAL_SCREENS); empty when it is general. */
  screen?: string | null
  /** Tab of Help it belongs to. */
  group?: TutorialGroup
  /** Leagues of a league video (only the ones this person may see). */
  leagues?: { id: string; name: string }[]
  /** Only the managers see it (not published yet). */
  draft?: boolean
}

export type TutorialAdminItem = TutorialSummary & {
  audience: TutorialAudience
  category: TutorialCategory
  role: TutorialRole
  leagueIds: string[]
  /** Leagues that already received the automatic notice in their chat. */
  announcedLeagueIds: string[]
  /** Leagues whose automatic notice could not be sent (kept until it is sent). */
  announceFailures: { leagueId: string; reason: string }[]
  /** When it goes live (ISO), while that moment has not come yet. */
  publishAt: string | null
  /** The league-chat notice is waiting for publishAt. */
  announceOnPublish: boolean
  viewCount: number
}

export function formatTutorialDuration(durationMs: number | null) {
  if (durationMs === null || durationMs <= 0) return ""
  const total = Math.round(durationMs / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}
