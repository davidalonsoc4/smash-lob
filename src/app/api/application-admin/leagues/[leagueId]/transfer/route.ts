import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type TransferBody = {
  currentOwnerUserId?: unknown
  newOwnerUserId?: unknown
}

function mapTransferError(message: string) {
  if (message.includes("same_owner")) return "same_owner"
  if (message.includes("owner_mismatch")) return "owner_mismatch"
  if (message.includes("new_owner_suspended")) return "new_owner_suspended"
  if (message.includes("new_owner_membership_not_found")) {
    return "new_owner_membership_not_found"
  }
  if (message.includes("current_owner_membership_not_found")) {
    return "current_owner_membership_not_found"
  }
  if (message.includes("league_not_found")) return "league_not_found"
  return "league_ownership_transfer_failed"
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  const { leagueId } = await params
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  if (!authResult.actor.user.isSuperuser) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const body = await parseJsonBody<TransferBody>(request)
  const currentOwnerUserId =
    typeof body?.currentOwnerUserId === "string" ? body.currentOwnerUserId : ""
  const newOwnerUserId =
    typeof body?.newOwnerUserId === "string" ? body.newOwnerUserId : ""

  if (
    !validateUuid(leagueId) ||
    !validateUuid(currentOwnerUserId) ||
    !validateUuid(newOwnerUserId)
  ) {
    return NextResponse.json({ error: "invalid_transfer_request" }, { status: 400 })
  }

  const { data, error } = await authResult.actor.supabase.rpc(
    "server_transfer_league_ownership",
    {
      p_actor_user_id: authResult.actor.user.id,
      p_league_id: leagueId,
      p_current_owner_user_id: currentOwnerUserId,
      p_new_owner_user_id: newOwnerUserId,
    },
  )

  if (error || !Array.isArray(data) || !data[0]) {
    return NextResponse.json(
      { error: mapTransferError(error?.message ?? "") },
      { status: 409 },
    )
  }

  const result = data[0] as {
    league_id: string
    league_name: string
    previous_owner_user_id: string
    new_owner_user_id: string
  }

  return NextResponse.json({
    ok: true,
    league: {
      id: result.league_id,
      name: result.league_name,
      previousOwnerUserId: result.previous_owner_user_id,
      newOwnerUserId: result.new_owner_user_id,
    },
  })
}
