import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { parseJsonBody } from "@/lib/serverRequest"
import {
  listGlobalLocations,
  saveGlobalLocation,
} from "@/lib/serverGlobalLocations"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SaveLocationBody = {
  location?: unknown
}

export async function GET() {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    )
  }

  try {
    const locations = await listGlobalLocations(authResult.actor.supabase)
    return NextResponse.json({ locations })
  } catch {
    return NextResponse.json(
      { error: "global_locations_lookup_failed" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "global_location_create",
    limit: 20,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    )
  }

  const body = await parseJsonBody<SaveLocationBody>(request)

  try {
    const location = await saveGlobalLocation(
      authResult.actor.supabase,
      body?.location,
    )
    return NextResponse.json({ location }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : ""

    return NextResponse.json(
      {
        error:
          message === "invalid_global_location"
            ? message
            : "global_location_save_failed",
      },
      { status: message === "invalid_global_location" ? 400 : 500 },
    )
  }
}
