import { NextResponse } from "next/server"
import { normalizeAccountStandardAvailability } from "@/lib/accountProfile"
import { countWeeklyAvailabilitySlots } from "@/lib/playerAvailability"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { parseProfileAvailabilityUpsert } from "@/lib/serverPlayerAvailability"
import { parseJsonBody } from "@/lib/serverRequest"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * The availability belongs to the player's account, so it can always be edited from the profile,
 * whatever the leagues or seasons the player is in.
 */
export async function PUT(request: Request) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "account_availability_update",
    limit: 30,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const parsed = parseProfileAvailabilityUpsert(
    await parseJsonBody<{ timezone?: unknown; weeklySlots?: unknown; dateOverrides?: unknown }>(request)
  )

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const { actor } = authResult
  const update: Record<string, unknown> = {
    standard_availability_timezone: parsed.timezone,
    standard_availability_weekly_slots: parsed.weeklySlots,
  }

  if (parsed.dateOverrides) update.standard_availability_date_overrides = parsed.dateOverrides
  if (!actor.user.availabilityCompletedAt && countWeeklyAvailabilitySlots(parsed.weeklySlots) > 0) {
    update.availability_completed_at = new Date().toISOString()
  }

  const { data, error } = await actor.supabase
    .from("app_users")
    .update(update)
    .eq("id", actor.user.id)
    .select(
      "availability_completed_at,standard_availability_timezone,standard_availability_weekly_slots"
    )
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "availability_update_failed" }, { status: 500 })
  }

  return NextResponse.json({
    availability: {
      availabilityCompletedAt: data.availability_completed_at,
      standardAvailabilityTimezone: data.standard_availability_timezone || "Europe/Madrid",
      standardAvailabilityWeeklySlots: normalizeAccountStandardAvailability(
        data.standard_availability_weekly_slots
      ),
    },
  })
}
