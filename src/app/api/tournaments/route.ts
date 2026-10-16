import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import { normalizeBoundedText, parseJsonBody, validateIsoDateTime } from "@/lib/serverRequest"
import { shuffleTournamentNames, validateTournamentParticipants } from "@/lib/rapidTournament"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CreateTournamentBody = { name?: unknown; description?: unknown; startsAt?: unknown; courtNames?: unknown; players?: unknown }

export async function GET(request: Request) {
  const rateLimited = await enforceRequestRateLimit({ request, scope: "rapid_tournaments_list", limit: 120, windowMs: 60_000 })
  if (rateLimited) return rateLimited
  const auth = await requireAuthenticatedAppUser()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: { "Cache-Control": "no-store" } })
  const { data, error } = await auth.actor.supabase
    .from("rapid_tournaments")
    .select("id,name,description,starts_at,status,created_at,finished_at")
    .eq("created_by_user_id", auth.actor.user.id)
    .order("starts_at", { ascending: false })
    .limit(50)
  if (error) return NextResponse.json({ error: "tournaments_read_failed" }, { status: 500, headers: { "Cache-Control": "no-store" } })
  return NextResponse.json({ tournaments: (data ?? []).map((item) => ({ id: item.id, name: item.name, description: item.description, startsAt: item.starts_at, status: item.status, createdAt: item.created_at, finishedAt: item.finished_at })) }, { headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: Request) {
  const rateLimited = await enforceRequestRateLimit({ request, scope: "rapid_tournaments_create", limit: 10, windowMs: 60 * 60_000 })
  if (rateLimited) return rateLimited
  const auth = await requireAuthenticatedAppUser()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const body = await parseJsonBody<CreateTournamentBody>(request)
  const name = normalizeBoundedText(body?.name, 100)
  const description = normalizeBoundedText(body?.description, 1000)
  const startsAt = validateIsoDateTime(body?.startsAt)
  const courtNames = Array.isArray(body?.courtNames) ? body.courtNames.map((item) => normalizeBoundedText(item, 80)) : []
  const participants = validateTournamentParticipants(body?.players)
  if (!body || !name || !startsAt || courtNames.length !== 2 || courtNames.some((court) => !court) || !participants.ok) {
    return NextResponse.json({ error: !participants.ok ? participants.error : "invalid_tournament_details" }, { status: 400 })
  }
  const shuffledNames = shuffleTournamentNames(participants.names)
  const { data, error } = await auth.actor.supabase.rpc("create_rapid_tournament", {
    p_creator_user_id: auth.actor.user.id,
    p_name: name,
    p_description: description,
    p_starts_at: startsAt,
    p_court_one_name: courtNames[0],
    p_court_two_name: courtNames[1],
    p_shuffled_names: shuffledNames,
  })
  if (error || typeof data !== "string") {
    console.error("[rapidTournaments] create failed", { code: error?.code ?? null })
    return NextResponse.json({ error: "tournament_create_failed" }, { status: 500 })
  }
  return NextResponse.json({ id: data }, { status: 201, headers: { "Cache-Control": "no-store" } })
}
