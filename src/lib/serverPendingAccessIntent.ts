import "server-only"

import type { NextResponse } from "next/server"
import { PENDING_ACCESS_INTENT_COOKIE } from "@/lib/pendingAccessIntent"

export function expirePendingAccessIntentCookie(
  response: NextResponse,
  request: Request,
) {
  response.cookies.set({
    name: PENDING_ACCESS_INTENT_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: 0,
  })

  return response
}
