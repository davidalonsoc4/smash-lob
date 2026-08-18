import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { parseJsonBody } from "@/lib/serverRequest"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import type { OnboardingProgressStatus, OnboardingTourKey } from "@/features/onboarding/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const tourKeys = new Set<OnboardingTourKey>([
  "app-introduction",
  "home",
  "matches",
  "ranking",
  "statistics",
  "season-admin",
  "settings",
  "chats",
  "match",
  "chat",
])

function normalizeTourKey(value: unknown): OnboardingTourKey | null {
  return typeof value === "string" && tourKeys.has(value as OnboardingTourKey)
    ? value as OnboardingTourKey
    : null
}

function normalizeStatus(value: unknown): OnboardingProgressStatus | null {
  return value === "completed" || value === "skipped" ? value : null
}

function mapRow(row: {
  tour_key: string
  tour_version: number
  status: string
  completed_at: string | null
  skipped_at: string | null
}) {
  return {
    tourKey: row.tour_key,
    tourVersion: row.tour_version,
    status: row.status,
    completedAt: row.completed_at,
    skippedAt: row.skipped_at,
  }
}

export async function GET() {
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { data, error } = await authResult.actor.supabase
    .from("user_onboarding_progress")
    .select("tour_key,tour_version,status,completed_at,skipped_at")
    .eq("user_id", authResult.actor.user.id)
    .order("tour_key")

  if (error) {
    return NextResponse.json({ error: "onboarding_progress_lookup_failed" }, { status: 500 })
  }

  return NextResponse.json({ items: (data ?? []).map(mapRow) })
}

export async function PATCH(request: Request) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "onboarding_progress_update",
    limit: 30,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const body = await parseJsonBody<{
    tourKey?: unknown
    tourVersion?: unknown
    status?: unknown
  }>(request)
  const tourKey = normalizeTourKey(body?.tourKey)
  const tourVersion = Number(body?.tourVersion)
  const status = normalizeStatus(body?.status)

  if (!tourKey || !Number.isInteger(tourVersion) || tourVersion < 1 || tourVersion > 100 || !status) {
    return NextResponse.json({ error: "invalid_onboarding_progress" }, { status: 400 })
  }

  const timestamp = new Date().toISOString()
  const { data, error } = await authResult.actor.supabase
    .from("user_onboarding_progress")
    .upsert(
      {
        user_id: authResult.actor.user.id,
        tour_key: tourKey,
        tour_version: tourVersion,
        status,
        completed_at: status === "completed" ? timestamp : null,
        skipped_at: status === "skipped" ? timestamp : null,
        updated_at: timestamp,
      },
      { onConflict: "user_id,tour_key" },
    )
    .select("tour_key,tour_version,status,completed_at,skipped_at")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "onboarding_progress_update_failed" }, { status: 500 })
  }

  return NextResponse.json({ item: mapRow(data) })
}

export async function DELETE(request: Request) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "onboarding_progress_reset",
    limit: 5,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { error } = await authResult.actor.supabase
    .from("user_onboarding_progress")
    .delete()
    .eq("user_id", authResult.actor.user.id)

  if (error) {
    return NextResponse.json({ error: "onboarding_progress_reset_failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
