import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import {
  decodePendingAccessDestination,
  getPendingAccessIntentKind,
  PENDING_ACCESS_INTENT_COOKIE,
} from "@/lib/pendingAccessIntent"
import { expirePendingAccessIntentCookie } from "@/lib/serverPendingAccessIntent"

export async function GET(request: NextRequest) {
  const destination = decodePendingAccessDestination(
    request.cookies.get(PENDING_ACCESS_INTENT_COOKIE)?.value,
  )
  const response = NextResponse.json(
    {
      pending: Boolean(destination),
      kind: destination ? getPendingAccessIntentKind(destination) : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  )

  if (!destination && request.cookies.has(PENDING_ACCESS_INTENT_COOKIE)) {
    expirePendingAccessIntentCookie(response, request)
  }

  return response
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  )
  return expirePendingAccessIntentCookie(response, request)
}
