import { NextResponse } from "next/server"
import { getServerLeagueViewer } from "@/lib/serverLeagueAccess"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import { validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; announcementId: string }> },
) {
  const { id: leagueId, announcementId } = await params

  if (!validateUuid(leagueId) || !validateUuid(announcementId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 })
  }

  const access = await getServerLeagueViewer(leagueId, { requireAdmin: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { data: announcement, error: lookupError } = await access.actor.supabase
    .from("league_announcements")
    .select("id,season_id,title")
    .eq("id", announcementId)
    .eq("league_id", leagueId)
    .maybeSingle()

  if (lookupError) {
    return NextResponse.json(
      { error: "announcement_lookup_failed" },
      { status: 500 },
    )
  }

  if (!announcement) {
    return NextResponse.json({ error: "announcement_not_found" }, { status: 404 })
  }

  const { error } = await access.actor.supabase
    .from("league_announcements")
    .delete()
    .eq("id", announcementId)
    .eq("league_id", leagueId)

  if (error) {
    return NextResponse.json(
      { error: "announcement_delete_failed" },
      { status: 500 },
    )
  }

  await recordServerActorActivity({
    supabase: access.actor.supabase,
    user: access.actor.user,
    membership: access.actor.membership,
    leagueId,
    seasonId:
      typeof announcement.season_id === "string"
        ? announcement.season_id
        : null,
    type: "league_announcement_deleted",
    title: "Comunicado eliminado",
    description:
      typeof announcement.title === "string" ? announcement.title : null,
    metadata: { announcementId },
  }).catch(() => null)

  return NextResponse.json({ ok: true })
}
