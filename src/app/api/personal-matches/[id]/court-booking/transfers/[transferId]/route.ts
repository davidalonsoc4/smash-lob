import { NextResponse } from "next/server"
import { setCourtBookingTransferPaidStatus } from "@/lib/courtBooking"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import {
  getPersonalMatchBookingAccess,
  savePersonalMatchBooking,
} from "@/lib/serverPersonalMatchBooking"
import { loadPersonalMatch } from "@/lib/serverPersonalMatches"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { normalizeBoundedText, parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; transferId: string }> },
) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "personal_match_booking_transfer",
    limit: 40,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const values = await params
  const matchId = validateUuid(values.id)
  const transferId = normalizeBoundedText(values.transferId, 200)
  if (!matchId || !transferId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }
  const body = await parseJsonBody<{ isPaid?: unknown }>(request)
  if (typeof body?.isPaid !== "boolean") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  try {
    const access = await getPersonalMatchBookingAccess(authResult.actor, matchId)
    if (!access) {
      return NextResponse.json({ error: "personal_match_not_found" }, { status: 404 })
    }
    const transfer = access.booking.transfers.find((item) => item.id === transferId)
    if (!transfer) {
      return NextResponse.json({ error: "transfer_not_found" }, { status: 404 })
    }
    const canManage =
      access.isCreator ||
      transfer.toPlayerId === access.currentParticipantId ||
      (transfer.fromPlayerId === access.currentParticipantId && !transfer.isPaid && body.isPaid)
    if (!canManage) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    const booking = setCourtBookingTransferPaidStatus({
      booking: access.booking,
      transferId,
      isPaid: body.isPaid,
    })
    await savePersonalMatchBooking(authResult.actor, matchId, booking)
    const item = await loadPersonalMatch(authResult.actor, matchId)
    return NextResponse.json({ item })
  } catch {
    return NextResponse.json({ error: "personal_match_booking_transfer_failed" }, { status: 500 })
  }
}
