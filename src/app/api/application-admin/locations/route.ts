import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import {
  changeManagedLocationUsage,
  clearManagedLocationUsage,
  deleteGlobalLocation,
  listManagedGlobalLocations,
} from "@/lib/serverGlobalLocations"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function requireSuperuser() {
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) return authResult
  if (!authResult.actor.user.isSuperuser) {
    return { ok: false as const, status: 403, error: "forbidden" }
  }
  return authResult
}

export async function GET() {
  const authResult = await requireSuperuser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }
  try {
    return NextResponse.json({
      locations: await listManagedGlobalLocations(authResult.actor.supabase),
    })
  } catch {
    return NextResponse.json(
      { error: "application_locations_lookup_failed" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "application_location_usage_update",
    limit: 30,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const authResult = await requireSuperuser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }
  const body = await parseJsonBody<{
    action?: unknown
    source?: unknown
    matchId?: unknown
    locationId?: unknown
  }>(request)
  const matchId = validateUuid(body?.matchId)
  const locationId = validateUuid(body?.locationId)
  const source = body?.source === "league" || body?.source === "friendly" ? body.source : null
  const action = body?.action === "clear_usage" || body?.action === "change_usage"
    ? body.action
    : null
  if (!action || !source || !matchId || (action === "change_usage" && !locationId)) {
    return NextResponse.json({ error: "invalid_location_usage_update" }, { status: 400 })
  }

  try {
    const result = action === "change_usage"
      ? await changeManagedLocationUsage(authResult.actor.supabase, {
          source,
          matchId,
          locationId: locationId as string,
        })
      : await clearManagedLocationUsage(authResult.actor.supabase, {
          source,
          matchId,
        })
    if (!result.ok) {
      return NextResponse.json(
        {
          error:
            result.reason === "finished"
              ? "finished_match_locked"
              : result.reason === "location_not_found"
                ? "global_location_not_found"
                : "match_not_found",
        },
        { status: result.reason === "finished" ? 409 : 404 },
      )
    }
    return NextResponse.json({ updated: true })
  } catch {
    return NextResponse.json({ error: "location_usage_update_failed" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "application_location_delete",
    limit: 12,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const authResult = await requireSuperuser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }
  const body = await parseJsonBody<{ locationId?: unknown }>(request)
  const locationId = validateUuid(body?.locationId)
  if (!locationId) {
    return NextResponse.json({ error: "invalid_location_id" }, { status: 400 })
  }

  try {
    const result = await deleteGlobalLocation(authResult.actor.supabase, locationId)
    if (!result.ok) {
      return NextResponse.json({ error: "global_location_not_found" }, { status: 404 })
    }
    return NextResponse.json({ deleted: true, location: result.location })
  } catch {
    return NextResponse.json({ error: "global_location_delete_failed" }, { status: 500 })
  }
}
