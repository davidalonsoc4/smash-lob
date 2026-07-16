import { NextResponse } from "next/server"
import {
  mergeWithDefaultActivitySettings,
  normalizeLeagueActivitySettings,
} from "@/lib/activitySettings"
import { getServerLeagueViewer } from "@/lib/serverLeagueAccess"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type UpdateActivitySettingsBody = {
  settings?: unknown
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params

  if (!validateUuid(leagueId)) {
    return NextResponse.json({ error: "invalid_league_id" }, { status: 400 })
  }

  const access = await getServerLeagueViewer(leagueId, {
    requireAccess: true,
  })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { data, error } = await access.actor.supabase
    .from("leagues")
    .select("activity_settings")
    .eq("id", leagueId)
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { error: "activity_settings_lookup_failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    settings: normalizeLeagueActivitySettings(data?.activity_settings),
  })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params

  if (!validateUuid(leagueId)) {
    return NextResponse.json({ error: "invalid_league_id" }, { status: 400 })
  }

  const access = await getServerLeagueViewer(leagueId, {
    requireAdmin: true,
  })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const settings = mergeWithDefaultActivitySettings(
    normalizeLeagueActivitySettings(
      (await parseJsonBody<UpdateActivitySettingsBody>(request))?.settings
    )
  )

  const { data, error } = await access.actor.supabase
    .from("leagues")
    .update({ activity_settings: settings })
    .eq("id", leagueId)
    .select("activity_settings")
    .single()

  if (error) {
    return NextResponse.json(
      { error: "activity_settings_update_failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    settings: normalizeLeagueActivitySettings(data?.activity_settings),
  })
}
