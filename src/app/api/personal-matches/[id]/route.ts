import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { validateUuid } from "@/lib/serverRequest"
import { loadPersonalMatch } from "@/lib/serverPersonalMatches"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const matchId = validateUuid(id)
  if (!matchId) {
    return NextResponse.json({ error: "invalid_personal_match_id" }, { status: 400 })
  }

  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const item = await loadPersonalMatch(authResult.actor, matchId)
    if (!item) {
      return NextResponse.json({ error: "personal_match_not_found" }, { status: 404 })
    }
    return NextResponse.json({ item })
  } catch {
    return NextResponse.json({ error: "personal_match_lookup_failed" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "personal_match_delete",
    limit: 20,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const { id } = await params
  const matchId = validateUuid(id)
  if (!matchId) {
    return NextResponse.json({ error: "invalid_personal_match_id" }, { status: 400 })
  }

  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { data: match, error: matchError } = await authResult.actor.supabase
    .from("personal_matches")
    .select("id,created_by_user_id")
    .eq("id", matchId)
    .maybeSingle()

  if (matchError) {
    return NextResponse.json({ error: "personal_match_lookup_failed" }, { status: 500 })
  }
  if (!match) {
    return NextResponse.json({ error: "personal_match_not_found" }, { status: 404 })
  }
  if (match.created_by_user_id !== authResult.actor.user.id) {
    return NextResponse.json({ error: "personal_match_delete_forbidden" }, { status: 403 })
  }

  const { error } = await authResult.actor.supabase
    .from("personal_matches")
    .delete()
    .eq("id", matchId)

  if (error) {
    return NextResponse.json({ error: "personal_match_delete_failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
