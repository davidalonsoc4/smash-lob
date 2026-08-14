import { NextResponse } from "next/server"
import { getServerMatchActor } from "@/lib/serverMatchAccess"
import { validateUuid } from "@/lib/serverRequest"
import { getMatchChatRealtimeTopic } from "@/lib/serverChatRealtime"
import { getServerMatchChatCoordination } from "@/lib/serverMatchChatCoordination"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> },
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

  if (!access.actor.isAdmin && !access.actor.participantPlayerId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  try {
    const coordination = await getServerMatchChatCoordination({
      db: access.actor.supabase,
      match: access.actor.match,
    })
    return NextResponse.json({
      coordination,
      realtimeTopic: getMatchChatRealtimeTopic(matchId),
    })
  } catch {
    return NextResponse.json(
      { error: "match_chat_coordination_lookup_failed" },
      { status: 500 },
    )
  }
}
