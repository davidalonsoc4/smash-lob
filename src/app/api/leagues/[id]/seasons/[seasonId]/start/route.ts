import { NextResponse } from "next/server"
import { getServerSeasonAdmin } from "@/lib/serverSeasonAccess"
import { recordServerActorActivity } from "@/lib/serverActivityWrite"
import {
  isSeasonMutationError,
  reopenServerFinishedSeason,
  startServerExistingSeason,
} from "@/lib/serverSeasonMutations"
import { validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; seasonId: string }> }
) {
  const { id: leagueId, seasonId } = await params

  if (!validateUuid(leagueId) || !validateUuid(seasonId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const access = await getServerSeasonAdmin(leagueId, seasonId, { requireMutable: true })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  try {
    if (access.season.status === "upcoming") {
      const { data: settings, error: settingsError } = await access.actor.supabase
        .from("season_settings")
        .select("scheduled_start_at")
        .eq("season_id", seasonId)
        .eq("league_id", leagueId)
        .maybeSingle()

      if (settingsError) {
        return NextResponse.json({ error: "season_settings_lookup_failed" }, { status: 500 })
      }

      if (
        typeof settings?.scheduled_start_at === "string" &&
        new Date(settings.scheduled_start_at).getTime() > Date.now()
      ) {
        return NextResponse.json({ error: "season_scheduled_start_pending" }, { status: 409 })
      }
    }

    const result =
      access.season.status === "finished"
        ? await reopenServerFinishedSeason({
            supabase: access.actor.supabase,
            leagueId,
            seasonId,
          })
        : await startServerExistingSeason({
            supabase: access.actor.supabase,
            leagueId,
            seasonId,
            actorUserId: access.actor.user.id,
            actorIsSuperuser: access.actor.user.isSuperuser,
          })

    await recordServerActorActivity({
      supabase: access.actor.supabase,
      user: access.actor.user,
      membership: access.actor.membership,
      leagueId,
      seasonId,
      type: "season_started",
      title:
        access.season.status === "finished"
          ? "Temporada reabierta"
          : "Temporada comenzada",
      description:
        access.season.status === "finished"
          ? "La temporada se ha reabierto manualmente para corregir partidos o resultados."
          : "La temporada ha pasado de proximamente a activa.",
    }).catch(() => null)

    return NextResponse.json(result)
  } catch (error) {
    if (isSeasonMutationError(error)) {
      return NextResponse.json({ error: error.code }, { status: error.status })
    }

    return NextResponse.json({ error: "season_start_failed" }, { status: 500 })
  }
}
