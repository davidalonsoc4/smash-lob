import { NextResponse } from "next/server"
import { getServerLeagueViewer } from "@/lib/serverLeagueAccess"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type AudienceMode = "league" | "season" | "players"

type CreateBody = {
  audienceMode?: unknown
  seasonId?: unknown
  targetPlayerIds?: unknown
  title?: unknown
  body?: unknown
  pinned?: unknown
  sendNotification?: unknown
  expiresAt?: unknown
}

type AnnouncementRow = {
  id: string
  league_id: string
  season_id: string | null
  target_player_ids: string[] | null
  created_by_user_id: string | null
  title: string
  body: string
  pinned: boolean
  published_at: string
  expires_at: string | null
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : ""
}

function parseOptionalDate(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  if (typeof value !== "string") return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function parseAudienceMode(value: unknown): AudienceMode | null {
  return value === "league" || value === "season" || value === "players"
    ? value
    : null
}

function parsePlayerIds(value: unknown) {
  if (!Array.isArray(value)) return []

  const playerIds = value
    .map((playerId) => validateUuid(playerId))
    .filter((playerId): playerId is string => playerId !== null)

  return Array.from(new Set(playerIds)).slice(0, 64)
}

function normalizeTargetPlayerIds(row: AnnouncementRow) {
  return Array.isArray(row.target_player_ids)
    ? row.target_player_ids.filter((playerId) => typeof playerId === "string")
    : []
}

async function mapAnnouncements({
  supabase,
  rows,
}: {
  supabase: Extract<
    Awaited<ReturnType<typeof getServerLeagueViewer>>,
    { ok: true }
  >["actor"]["supabase"]
  rows: AnnouncementRow[]
}) {
  const userIds = Array.from(
    new Set(rows.map((row) => row.created_by_user_id).filter(Boolean)),
  ) as string[]
  const targetPlayerIds = Array.from(
    new Set(rows.flatMap((row) => normalizeTargetPlayerIds(row))),
  )
  const namesByUserId = new Map<string, string>()
  const namesByPlayerId = new Map<string, string>()

  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("app_users")
      .select("id,display_name,email")
      .in("id", userIds)

    ;(users ?? []).forEach((user) => {
      if (typeof user.id !== "string") return
      const name =
        typeof user.display_name === "string" && user.display_name.trim()
          ? user.display_name.trim()
          : typeof user.email === "string"
            ? user.email
            : "Administración"
      namesByUserId.set(user.id, name)
    })
  }

  if (targetPlayerIds.length > 0) {
    const { data: players } = await supabase
      .from("players")
      .select("id,display_name")
      .in("id", targetPlayerIds)

    ;(players ?? []).forEach((player) => {
      if (
        typeof player.id === "string" &&
        typeof player.display_name === "string"
      ) {
        namesByPlayerId.set(player.id, player.display_name)
      }
    })
  }

  return rows.map((row) => {
    const playerIds = normalizeTargetPlayerIds(row)
    return {
      id: row.id,
      leagueId: row.league_id,
      seasonId: row.season_id,
      targetPlayerIds: playerIds,
      targetPlayerNames: playerIds.map(
        (playerId) => namesByPlayerId.get(playerId) ?? "Jugador",
      ),
      title: row.title,
      body: row.body,
      pinned: row.pinned,
      publishedAt: row.published_at,
      expiresAt: row.expires_at,
      createdByDisplayName: row.created_by_user_id
        ? namesByUserId.get(row.created_by_user_id) ?? "Administración"
        : "Administración",
    }
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: leagueId } = await params
  const homeOnly = new URL(request.url).searchParams.get("homeOnly") === "1"

  if (!validateUuid(leagueId)) {
    return NextResponse.json({ error: "invalid_league_id" }, { status: 400 })
  }

  const access = await getServerLeagueViewer(leagueId, { requireAccess: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const now = new Date().toISOString()
  const { data, error } = await access.actor.supabase
    .from("league_announcements")
    .select(
      "id,league_id,season_id,target_player_ids,created_by_user_id,title,body,pinned,published_at,expires_at",
    )
    .eq("league_id", leagueId)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json(
      { error: "announcements_lookup_failed" },
      { status: 500 },
    )
  }

  let visibleRows = (data ?? []) as AnnouncementRow[]

  if (homeOnly || !access.actor.isAdmin) {
    const memberPlayerId = access.actor.membership?.playerId ?? null
    const allowedSeasonIds = new Set<string>()

    if (memberPlayerId) {
      const { data: seasonMemberships, error: seasonMembershipsError } =
        await access.actor.supabase
          .from("season_players")
          .select("season_id")
          .eq("player_id", memberPlayerId)

      if (seasonMembershipsError) {
        return NextResponse.json(
          { error: "announcement_audience_lookup_failed" },
          { status: 500 },
        )
      }

      ;(seasonMemberships ?? []).forEach((item) => {
        if (typeof item.season_id === "string") {
          allowedSeasonIds.add(item.season_id)
        }
      })
    }

    visibleRows = visibleRows
      .filter((row) => {
        if (!row.pinned) return false
        const targetIds = normalizeTargetPlayerIds(row)
        if (targetIds.length > 0) {
          return Boolean(memberPlayerId && targetIds.includes(memberPlayerId))
        }
        if (row.season_id) return allowedSeasonIds.has(row.season_id)
        return true
      })
      .slice(0, 10)
  }

  const announcements = await mapAnnouncements({
    supabase: access.actor.supabase,
    rows: visibleRows,
  })

  return NextResponse.json({ announcements })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: leagueId } = await params

  if (!validateUuid(leagueId)) {
    return NextResponse.json({ error: "invalid_league_id" }, { status: 400 })
  }

  const access = await getServerLeagueViewer(leagueId, { requireAdmin: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const body = await parseJsonBody<CreateBody>(request)
  const title = cleanText(body?.title, 100)
  const announcementBody = cleanText(body?.body, 1500)
  const audienceMode = parseAudienceMode(body?.audienceMode) ?? "league"
  const requestedSeasonId = validateUuid(body?.seasonId)
  const requestedPlayerIds = parsePlayerIds(body?.targetPlayerIds)
  const pinned = body?.pinned === true
  const sendNotification = body?.sendNotification === true
  const expiresAt = parseOptionalDate(body?.expiresAt)

  if (
    title.length < 1 ||
    announcementBody.length < 1 ||
    expiresAt === undefined ||
    (!pinned && !sendNotification)
  ) {
    return NextResponse.json({ error: "invalid_announcement" }, { status: 400 })
  }

  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "announcement_expiry_in_past" },
      { status: 400 },
    )
  }

  let seasonId: string | null = null
  let targetPlayerIds: string[] = []

  if (audienceMode === "season") {
    if (!requestedSeasonId) {
      return NextResponse.json({ error: "season_required" }, { status: 400 })
    }

    const [{ data: season, error: seasonError }, seasonPlayersResult] =
      await Promise.all([
        access.actor.supabase
          .from("seasons")
          .select("id")
          .eq("id", requestedSeasonId)
          .eq("league_id", leagueId)
          .maybeSingle(),
        access.actor.supabase
          .from("season_players")
          .select("player_id")
          .eq("season_id", requestedSeasonId)
          .eq("status", "active"),
      ])

    if (seasonError || !season) {
      return NextResponse.json({ error: "season_not_found" }, { status: 404 })
    }
    if (seasonPlayersResult.error) {
      return NextResponse.json(
        { error: "announcement_audience_lookup_failed" },
        { status: 500 },
      )
    }

    seasonId = requestedSeasonId
    targetPlayerIds = Array.from(
      new Set(
        (seasonPlayersResult.data ?? [])
          .map((item) =>
            typeof item.player_id === "string" ? item.player_id : null,
          )
          .filter((playerId): playerId is string => Boolean(playerId)),
      ),
    )
  } else if (audienceMode === "players") {
    if (requestedPlayerIds.length === 0) {
      return NextResponse.json({ error: "players_required" }, { status: 400 })
    }

    const { data: leaguePlayers, error: playersError } = await access.actor.supabase
      .from("players")
      .select("id")
      .eq("league_id", leagueId)
      .in("id", requestedPlayerIds)

    if (playersError || (leaguePlayers ?? []).length !== requestedPlayerIds.length) {
      return NextResponse.json({ error: "invalid_players" }, { status: 400 })
    }

    targetPlayerIds = requestedPlayerIds
  }

  const storedTargetPlayerIds =
    audienceMode === "players" ? targetPlayerIds : []
  const { data, error } = await access.actor.supabase
    .from("league_announcements")
    .insert({
      league_id: leagueId,
      season_id: seasonId,
      target_player_ids: storedTargetPlayerIds,
      created_by_user_id: access.actor.user.id,
      title,
      body: announcementBody,
      pinned,
      expires_at: expiresAt,
    })
    .select(
      "id,league_id,season_id,target_player_ids,created_by_user_id,title,body,pinned,published_at,expires_at",
    )
    .single()

  if (error) {
    return NextResponse.json(
      { error: "announcement_create_failed" },
      { status: 500 },
    )
  }

  await recordServerActorActivity({
    supabase: access.actor.supabase,
    user: access.actor.user,
    membership: access.actor.membership,
    leagueId,
    seasonId,
    type: "league_announcement_published",
    title,
    description: announcementBody,
    metadata: {
      announcementId: data.id,
      pinned,
      sendNotification,
      forcePush: sendNotification,
      skipPush: !sendNotification,
      audienceMode,
      targetPlayerIds,
    },
  }).catch(() => null)

  const announcements = await mapAnnouncements({
    supabase: access.actor.supabase,
    rows: [data as AnnouncementRow],
  })

  return NextResponse.json({ announcements }, { status: 201 })
}
