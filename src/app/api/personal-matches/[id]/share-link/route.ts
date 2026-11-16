import { randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { formatPersonalMatchShareTitle, getPublicPersonalMatchUrl } from "@/lib/personalMatchShare"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { loadManageablePersonalMatch } from "@/lib/serverPersonalMatches"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function generateShareCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const content = Array.from(randomBytes(12))
    .map((value) => alphabet[value % alphabet.length])
    .join("")

  return `PM-${content.slice(0, 4)}-${content.slice(4, 8)}-${content.slice(8, 12)}`
}

/**
 * Returns the single active read-only link of a friendly, creating it on first
 * use. Only the creator and linked participants (the same people who can edit
 * the match) can obtain it.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "personal_match_share_link",
    limit: 10,
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
  const { actor } = authResult

  try {
    const match = await loadManageablePersonalMatch(actor, matchId)
    if (!match) {
      return NextResponse.json({ error: "personal_match_not_found" }, { status: 404 })
    }
    if (match === "forbidden") {
      return NextResponse.json({ error: "personal_match_forbidden" }, { status: 403 })
    }

    const readActiveCode = async () => {
      const { data, error } = await actor.supabase
        .from("personal_match_share_links")
        .select("code")
        .eq("match_id", matchId)
        .eq("is_active", true)
        .maybeSingle()
      if (error) throw new Error("personal_match_share_link_lookup_failed")
      return data?.code ?? null
    }

    let code = await readActiveCode()

    for (let attempt = 0; attempt < 8 && !code; attempt += 1) {
      const { data, error } = await actor.supabase
        .from("personal_match_share_links")
        .insert({
          match_id: matchId,
          code: generateShareCode(),
          created_by_user_id: actor.user.id,
          is_active: true,
        })
        .select("code")
        .single()

      if (!error && data?.code) {
        code = data.code
        break
      }
      // 23505: a concurrent request created the link (or the code collided).
      if (error?.code === "23505") {
        code = await readActiveCode()
        continue
      }
      throw new Error("personal_match_share_link_create_failed")
    }

    if (!code) {
      return NextResponse.json({ error: "personal_match_share_link_failed" }, { status: 500 })
    }

    // Only a label for the share dialog; the caller already manages this match.
    let title: string | null = null
    try {
      const { data: participants } = await actor.supabase
        .from("personal_match_participants")
        .select("team,slot,display_name")
        .eq("match_id", matchId)
      const teamNames = (team: number) =>
        (participants ?? [])
          .filter((participant) => participant.team === team)
          .sort((left, right) => left.slot - right.slot)
          .map((participant) => participant.display_name?.trim().slice(0, 40) || "Jugador")
      title = formatPersonalMatchShareTitle([teamNames(1), teamNames(2)])
    } catch {
      title = null
    }

    return NextResponse.json({ code, url: getPublicPersonalMatchUrl(code, request), title })
  } catch {
    return NextResponse.json({ error: "personal_match_share_link_failed" }, { status: 500 })
  }
}
