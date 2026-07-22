import { NextResponse } from "next/server"
import { getServerLeagueViewer } from "@/lib/serverLeagueAccess"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CreateBody = {
  seasonId?: unknown
  title?: unknown
  body?: unknown
  pinned?: unknown
  expiresAt?: unknown
}

type AnnouncementRow = {
  id: string
  league_id: string
  season_id: string | null
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
  const namesByUserId = new Map<string, string>()

  if (userIds.length > 0) {
    const { data } = await supabase
      .from("app_users")
      .select("id,display_name,email")
      .in("id", userIds)

    ;(data ?? []).forEach((user) => {
      if (typeof user.id === "string") {
        const name =
          typeof user.display_name === "string" && user.display_name.trim()
            ? user.display_name.trim()
            : typeof user.email === "string"
              ? user.email
              : "Administración"
        namesByUserId.set(user.id, name)
      }
    })
  }

  return rows.map((row) => ({
    id: row.id,
    leagueId: row.league_id,
    seasonId: row.season_id,
    title: row.title,
    body: row.body,
    pinned: row.pinned,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
    createdByDisplayName: row.created_by_user_id
      ? namesByUserId.get(row.created_by_user_id) ?? "Administración"
      : "Administración",
  }))
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: leagueId } = await params

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
      "id,league_id,season_id,created_by_user_id,title,body,pinned,published_at,expires_at",
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

  if (!access.actor.isAdmin) {
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
      .filter(
        (row) =>
          row.season_id === null || allowedSeasonIds.has(row.season_id),
      )
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
  const seasonId =
    body?.seasonId === null || body?.seasonId === undefined || body.seasonId === ""
      ? null
      : validateUuid(body.seasonId)
  const expiresAt = parseOptionalDate(body?.expiresAt)

  if (
    title.length < 1 ||
    announcementBody.length < 1 ||
    expiresAt === undefined ||
    (body?.seasonId && !seasonId)
  ) {
    return NextResponse.json({ error: "invalid_announcement" }, { status: 400 })
  }

  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "announcement_expiry_in_past" },
      { status: 400 },
    )
  }

  let targetPlayerIds: string[] = []

  if (seasonId) {
    const [{ data: season, error: seasonError }, seasonPlayersResult] =
      await Promise.all([
        access.actor.supabase
          .from("seasons")
          .select("id")
          .eq("id", seasonId)
          .eq("league_id", leagueId)
          .maybeSingle(),
        access.actor.supabase
          .from("season_players")
          .select("player_id")
          .eq("season_id", seasonId),
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

    targetPlayerIds = Array.from(
      new Set(
        (seasonPlayersResult.data ?? [])
          .map((item) =>
            typeof item.player_id === "string" ? item.player_id : null,
          )
          .filter((playerId): playerId is string => Boolean(playerId)),
      ),
    )
  }

  const { data, error } = await access.actor.supabase
    .from("league_announcements")
    .insert({
      league_id: leagueId,
      season_id: seasonId,
      created_by_user_id: access.actor.user.id,
      title,
      body: announcementBody,
      pinned: body?.pinned === true,
      expires_at: expiresAt,
    })
    .select(
      "id,league_id,season_id,created_by_user_id,title,body,pinned,published_at,expires_at",
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
      pinned: body?.pinned === true,
      targetPlayerIds,
    },
  }).catch(() => null)

  const announcements = await mapAnnouncements({
    supabase: access.actor.supabase,
    rows: [data as AnnouncementRow],
  })

  return NextResponse.json({ announcements }, { status: 201 })
}
