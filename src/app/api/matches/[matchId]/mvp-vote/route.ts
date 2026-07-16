import { NextResponse } from "next/server"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import {
  isServerMatchMvpClosed,
  saveServerMatchMvpVote,
} from "@/lib/serverMvp"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type VoteBody = {
  selectedPlayerId?: unknown
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params

  if (!validateUuid(matchId)) {
    return NextResponse.json({ error: "invalid_match_id" }, { status: 400 })
  }

  const access = await getServerMatchActor(matchId, {
    requireLeagueAccess: true,
    requireParticipant: true,
  })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const selectedPlayerId = validateUuid(
    (await parseJsonBody<VoteBody>(request))?.selectedPlayerId
  )

  if (
    !selectedPlayerId ||
    !access.actor.participantPlayerId ||
    selectedPlayerId === access.actor.participantPlayerId ||
    !access.actor.match.participantIds.includes(selectedPlayerId)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  if (access.actor.match.status !== "finished") {
    return NextResponse.json(
      { error: "match_mvp_not_allowed" },
      { status: 409 }
    )
  }

  const { data: settingsRow, error: settingsError } = await access.actor.supabase
    .from("season_settings")
    .select("mvp_system")
    .eq("league_id", access.actor.match.leagueId)
    .eq("season_id", access.actor.match.seasonId)
    .maybeSingle()

  if (settingsError) {
    return NextResponse.json(
      { error: "match_mvp_settings_lookup_failed" },
      { status: 500 }
    )
  }

  if (settingsRow?.mvp_system !== "voting") {
    return NextResponse.json(
      { error: "match_mvp_not_allowed" },
      { status: 409 }
    )
  }

  try {
    const matchIsClosed = await isServerMatchMvpClosed({
      supabase: access.actor.supabase,
      match: access.actor.match,
    })

    if (matchIsClosed) {
      return NextResponse.json(
        { error: "match_mvp_not_allowed" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      await saveServerMatchMvpVote({
        supabase: access.actor.supabase,
        match: access.actor.match,
        voterPlayerId: access.actor.participantPlayerId,
        selectedPlayerId,
      })
    )
  } catch {
    return NextResponse.json(
      { error: "match_mvp_vote_save_failed" },
      { status: 500 }
    )
  }
}
