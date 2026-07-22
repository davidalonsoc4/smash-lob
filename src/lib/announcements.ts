export const ANNOUNCEMENTS_REFRESH_EVENT = "smash-lob:announcements-refresh"

export type AnnouncementAudienceMode = "league" | "season" | "players"

export type LeagueAnnouncement = {
  id: string
  leagueId: string
  seasonId: string | null
  targetPlayerIds: string[]
  targetPlayerNames: string[]
  title: string
  body: string
  pinned: boolean
  publishedAt: string
  expiresAt: string | null
  createdByDisplayName: string | null
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function toAnnouncement(value: unknown): LeagueAnnouncement | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null
  }

  const row = value as Record<string, unknown>

  if (
    typeof row.id !== "string" ||
    typeof row.leagueId !== "string" ||
    typeof row.title !== "string" ||
    typeof row.body !== "string" ||
    typeof row.publishedAt !== "string"
  ) {
    return null
  }

  return {
    id: row.id,
    leagueId: row.leagueId,
    seasonId: typeof row.seasonId === "string" ? row.seasonId : null,
    targetPlayerIds: toStringArray(row.targetPlayerIds),
    targetPlayerNames: toStringArray(row.targetPlayerNames),
    title: row.title,
    body: row.body,
    pinned: Boolean(row.pinned),
    publishedAt: row.publishedAt,
    expiresAt: typeof row.expiresAt === "string" ? row.expiresAt : null,
    createdByDisplayName:
      typeof row.createdByDisplayName === "string"
        ? row.createdByDisplayName
        : null,
  }
}

async function readAnnouncements(response: Response) {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null
    throw new Error(payload?.error || `announcements-api-${response.status}`)
  }

  const payload = (await response.json()) as { announcements?: unknown[] }

  return (payload.announcements ?? [])
    .map(toAnnouncement)
    .filter((item): item is LeagueAnnouncement => Boolean(item))
}

export async function fetchLeagueAnnouncements(
  leagueId: string,
  options: { homeOnly?: boolean } = {},
) {
  const search = options.homeOnly ? "?homeOnly=1" : ""
  const response = await fetch(
    `/api/leagues/${encodeURIComponent(leagueId)}/announcements${search}`,
    { cache: "no-store" },
  )

  return readAnnouncements(response)
}

export async function createLeagueAnnouncement({
  leagueId,
  audienceMode,
  seasonId,
  targetPlayerIds,
  title,
  body,
  pinned,
  sendNotification,
  expiresAt,
}: {
  leagueId: string
  audienceMode: AnnouncementAudienceMode
  seasonId: string | null
  targetPlayerIds: string[]
  title: string
  body: string
  pinned: boolean
  sendNotification: boolean
  expiresAt: string | null
}) {
  const response = await fetch(
    `/api/leagues/${encodeURIComponent(leagueId)}/announcements`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audienceMode,
        seasonId,
        targetPlayerIds,
        title,
        body,
        pinned,
        sendNotification,
        expiresAt,
      }),
      cache: "no-store",
    },
  )

  return readAnnouncements(response)
}

export async function deleteLeagueAnnouncement({
  leagueId,
  announcementId,
}: {
  leagueId: string
  announcementId: string
}) {
  const response = await fetch(
    `/api/leagues/${encodeURIComponent(leagueId)}/announcements/${encodeURIComponent(announcementId)}`,
    {
      method: "DELETE",
      cache: "no-store",
    },
  )

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null
    throw new Error(payload?.error || `announcement-delete-api-${response.status}`)
  }
}

export function announceLeagueAnnouncementsRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ANNOUNCEMENTS_REFRESH_EVENT))
  }
}
