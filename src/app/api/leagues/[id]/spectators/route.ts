import { NextResponse } from "next/server"
import { getServerLeagueActor } from "@/lib/serverLeagueAccess"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type DeleteBody = {
  userId?: unknown
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: leagueId } = await params
  const access = await getServerLeagueActor(leagueId, { requireAdmin: true })

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    )
  }

  const { supabase } = access.actor
  const { data: spectatorRows, error: spectatorError } = await supabase
    .from("league_spectators")
    .select("user_id,joined_at")
    .eq("league_id", leagueId)
    .order("joined_at", { ascending: false })

  if (spectatorError) {
    return NextResponse.json(
      { error: spectatorError.message },
      { status: 500 },
    )
  }

  const userIds = (spectatorRows ?? [])
    .map((row) => row.user_id)
    .filter((userId): userId is string => typeof userId === "string")
  const { data: users, error: usersError } = userIds.length
    ? await supabase
        .from("app_users")
        .select("id,email,display_name,avatar_url")
        .in("id", userIds)
    : { data: [], error: null }

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const userById = new Map((users ?? []).map((user) => [user.id, user]))

  return NextResponse.json({
    spectators: (spectatorRows ?? []).map((row) => {
      const user = userById.get(row.user_id)

      return {
        userId: row.user_id,
        email: user?.email ?? "",
        displayName: user?.display_name ?? null,
        avatarUrl: user?.avatar_url ?? null,
        joinedAt: row.joined_at,
      }
    }),
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: leagueId } = await params
  const access = await getServerLeagueActor(leagueId, { requireAdmin: true })

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    )
  }

  const body = (await request.json().catch(() => ({}))) as DeleteBody
  const userId = typeof body.userId === "string" ? body.userId.trim() : ""

  if (!userId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const { error } = await access.actor.supabase
    .from("league_spectators")
    .delete()
    .eq("league_id", leagueId)
    .eq("user_id", userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
