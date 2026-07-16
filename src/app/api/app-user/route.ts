import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    )
  }

  return NextResponse.json({
    user: authResult.actor.user,
  })
}
