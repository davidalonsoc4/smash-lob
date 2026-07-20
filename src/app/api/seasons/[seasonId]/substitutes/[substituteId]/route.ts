import { NextResponse } from "next/server"
import { requireSeasonAdmin } from "@/lib/serverSubstitutes"
import { validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ seasonId: string; substituteId: string }> },
) {
  const { seasonId, substituteId } = await params
  if (!validateUuid(seasonId) || !validateUuid(substituteId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const access = await requireSeasonAdmin(seasonId)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const { supabase } = access.actor
  const { data: poolItem, error: lookupError } = await supabase
    .from("season_substitutes")
    .select("id,active")
    .eq("id", substituteId)
    .eq("season_id", seasonId)
    .maybeSingle()

  if (lookupError) {
    return NextResponse.json({ error: "substitute_lookup_failed" }, { status: 500 })
  }

  if (!poolItem) {
    return NextResponse.json({ error: "substitute_not_found" }, { status: 404 })
  }

  const { error } = await supabase
    .from("season_substitutes")
    .update({
      active: false,
      inactive_reason: "retired",
      updated_at: new Date().toISOString(),
    })
    .eq("id", substituteId)

  if (error) {
    return NextResponse.json({ error: "substitute_disable_failed" }, { status: 500 })
  }

  return NextResponse.json({ disabled: true })
}
