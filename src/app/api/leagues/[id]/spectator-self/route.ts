import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: leagueId } = await params
  if (!validateUuid(leagueId)) {
    return NextResponse.json({ error: "invalid_league_id" }, { status: 400 })
  }

  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    )
  }

  const {
    supabase,
    user: { id: userId },
  } = authResult.actor
  const { error } = await supabase
    .from("league_spectators")
    .delete()
    .eq("league_id", leagueId)
    .eq("user_id", userId)

  if (error) {
    return NextResponse.json({ error: "spectator_access_delete_failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
