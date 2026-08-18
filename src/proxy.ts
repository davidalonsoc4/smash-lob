import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { isAvatarLabRequest } from "@/lib/avatarLabAccess"
import {
  decodePendingAccessDestination,
  encodePendingAccessDestination,
  PENDING_ACCESS_INTENT_COOKIE,
  PENDING_ACCESS_INTENT_MAX_AGE_SECONDS,
} from "@/lib/pendingAccessIntent"

function isAccessInviteRequest(request: NextRequest) {
  return (
    /^\/invite\/[^/]+$/.test(request.nextUrl.pathname) ||
    /^\/spectate\/[^/]+$/.test(request.nextUrl.pathname)
  )
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/launch") {
    const pendingDestination = decodePendingAccessDestination(
      request.cookies.get(PENDING_ACCESS_INTENT_COOKIE)?.value,
    )

    return NextResponse.redirect(
      new URL(pendingDestination ?? "/", request.url),
    )
  }

  if (isAccessInviteRequest(request)) {
    const response = NextResponse.next()
    const destination = encodePendingAccessDestination(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    )

    if (destination) {
      response.cookies.set({
        name: PENDING_ACCESS_INTENT_COOKIE,
        value: destination,
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        path: "/",
        maxAge: PENDING_ACCESS_INTENT_MAX_AGE_SECONDS,
      })
    }

    return response
  }

  if (!isAvatarLabRequest(request)) {
    return new NextResponse(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/experimental/avatar-lab/:path*",
    "/invite/:path*",
    "/launch",
    "/spectate/:path*",
  ],
}
