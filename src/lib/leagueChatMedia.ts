/** Shared (client + server) rules for photos and videos published in the season chat. */
export const LEAGUE_CHAT_MEDIA_BUCKET = "league-chat-media"

export type LeagueChatMediaKind = "image" | "video"

const MEDIA_TYPES = {
  "video/mp4": { kind: "video", extension: "mp4", maxBytes: 50 * 1024 * 1024 },
  "image/jpeg": { kind: "image", extension: "jpg", maxBytes: 10 * 1024 * 1024 },
  "image/png": { kind: "image", extension: "png", maxBytes: 10 * 1024 * 1024 },
  "image/webp": { kind: "image", extension: "webp", maxBytes: 10 * 1024 * 1024 },
} as const satisfies Record<string, { kind: LeagueChatMediaKind; extension: string; maxBytes: number }>

export const LEAGUE_CHAT_MEDIA_ACCEPT = Object.keys(MEDIA_TYPES).join(",")
export const LEAGUE_CHAT_MEDIA_URL_TTL_SECONDS = 60 * 60 * 6

export function getLeagueChatMediaRule(contentType: unknown) {
  return typeof contentType === "string" && contentType in MEDIA_TYPES
    ? MEDIA_TYPES[contentType as keyof typeof MEDIA_TYPES]
    : null
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"

/** Objects always live under `<seasonId>/<uuid>.<ext>` so a path can never point at another season. */
export function buildLeagueChatMediaPath(seasonId: string, objectId: string, contentType: string) {
  const rule = getLeagueChatMediaRule(contentType)
  return rule ? `${seasonId}/${objectId}.${rule.extension}` : null
}

export function isLeagueChatMediaPathForSeason(path: unknown, seasonId: string) {
  return (
    typeof path === "string" &&
    new RegExp(`^${seasonId}/${UUID}\\.(mp4|jpg|png|webp)$`, "i").test(path)
  )
}

export function getLeagueChatMediaKindFromPath(path: string): LeagueChatMediaKind {
  return path.toLowerCase().endsWith(".mp4") ? "video" : "image"
}
