import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { deleteGlobalLocation, listManagedGlobalLocations } from "@/lib/serverGlobalLocations"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
async function requireSuperuser() { const authResult = await requireAuthenticatedAppUser(); if (!authResult.ok) return authResult; if (!authResult.actor.user.isSuperuser) return { ok: false as const, status: 403, error: "forbidden" }; return authResult }
export async function GET() {
  const authResult = await requireSuperuser(); if (!authResult.ok) return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  try { return NextResponse.json({ locations: await listManagedGlobalLocations(authResult.actor.supabase) }) } catch { return NextResponse.json({ error: "application_locations_lookup_failed" }, { status: 500 }) }
}
export async function DELETE(request: Request) {
  const rateLimited = await enforceRequestRateLimit({ request, scope: "application_location_delete", limit: 12, windowMs: 60_000 }); if (rateLimited) return rateLimited
  const authResult = await requireSuperuser(); if (!authResult.ok) return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  const body = await parseJsonBody<{ locationId?: unknown }>(request); const locationId = validateUuid(body?.locationId); if (!locationId) return NextResponse.json({ error: "invalid_location_id" }, { status: 400 })
  try { const result = await deleteGlobalLocation(authResult.actor.supabase, locationId); if (!result.ok && result.reason === "not_found") return NextResponse.json({ error: "global_location_not_found" }, { status: 404 }); if (!result.ok) return NextResponse.json({ error: "global_location_in_use", usage: result.usage }, { status: 409 }); return NextResponse.json({ deleted: true, location: result.location }) } catch { return NextResponse.json({ error: "global_location_delete_failed" }, { status: 500 }) }
}
