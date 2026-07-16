import { NextResponse } from "next/server"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import { deleteServerMatchMvpVotes } from "@/lib/serverMvp"
import { validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function canClearMatchVotes(actor: {
  isAdmin: boolean
  participantPlayerId: string | null
}) {
  return actor.isAdmin || Boolean(actor.participantPlayerId)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params

  if (!validateUuid(matchId)) {
    return NextResponse.json({ error: "invalid_match_id" }, { status: 400 })
  }

  const access = await getServerMatchActor(matchId, {
    requireLeagueAccess: true,
  })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  if (!canClearMatchVotes(access.actor)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  try {
    await deleteServerMatchMvpVotes({
      supabase: access.actor.supabase,
      matchId,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: "match_mvp_vote_delete_failed" },
      { status: 500 }
    )
  }
}
