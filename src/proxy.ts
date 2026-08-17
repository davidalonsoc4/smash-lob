import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { isAvatarLabRequest } from "@/lib/avatarLabAccess"

export function proxy(request: NextRequest) {
  if (!isAvatarLabRequest(request)) {
    return new NextResponse(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/experimental/avatar-lab/:path*",
}
