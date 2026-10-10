import "server-only"

import { auth } from "@/auth"
import { normalizeStoredImageUrl } from "@/lib/serverImageValidation"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"
import { normalizeAccountStandardAvailability, normalizeDominantHand, normalizePreferredPlayerSide, splitGoogleDisplayName } from "@/lib/accountProfile"

export type AuthenticatedAppUser = {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>
  user: {
    id: string
    email: string
    displayName: string | null
    firstName: string | null
    lastName: string | null
    profileCompletedAt: string | null
    availabilityCompletedAt: string | null
    standardAvailabilityTimezone: string
    standardAvailabilityWeeklySlots: ReturnType<typeof normalizeAccountStandardAvailability>
    avatarUrl: string | null
    preferredSide: ReturnType<typeof normalizePreferredPlayerSide>
    dominantHand: ReturnType<typeof normalizeDominantHand>
    isSuperuser: boolean
    canCreateLeagues: boolean
  }
}

export function normalizeSessionEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ""
}

export async function requireAuthenticatedAppUser(): Promise<
  | { ok: true; actor: AuthenticatedAppUser }
  | { ok: false; status: number; error: string }
> {
  const session = await auth()
  const email = normalizeSessionEmail(session?.user?.email)

  if (!email) {
    return { ok: false, status: 401, error: "unauthenticated" }
  }

  const supabase = createSupabaseServiceClient()

  if (!supabase) {
    return { ok: false, status: 501, error: "missing_service_role" }
  }

  const userSelect = "id,email,display_name,first_name,last_name,profile_completed_at,availability_completed_at,standard_availability_timezone,standard_availability_weekly_slots,avatar_url,preferred_side,dominant_hand,is_superuser,can_create_leagues,suspended_at,suspension_reason"
  const { data: existingUser, error: existingUserError } = await supabase
    .from("app_users")
    .select(userSelect)
    .eq("email", email)
    .maybeSingle()

  if (existingUserError) {
    return { ok: false, status: 500, error: "app_user_lookup_failed" }
  }

  if (existingUser?.suspended_at) {
    return { ok: false, status: 403, error: "account_suspended" }
  }

  // Authentication must never write a stale profile or authorization snapshot.
  let user = existingUser
  if (!user) {
    const googleName = splitGoogleDisplayName(session?.user?.name)
    const { error: createError } = await supabase.from("app_users").upsert({
      email,
      display_name: session?.user?.name?.trim() || null,
      first_name: googleName.firstName || null,
      last_name: googleName.lastName || null,
      avatar_url: normalizeStoredImageUrl(session?.user?.image) ?? null,
    }, { onConflict: "email", ignoreDuplicates: true })
    if (createError) return { ok: false, status: 500, error: "app_user_upsert_failed" }
    // Another sign-in may have created/suspended the account in the meantime.
    const created = await supabase.from("app_users").select(userSelect).eq("email", email).maybeSingle()
    if (created.error || !created.data) return { ok: false, status: 500, error: "app_user_lookup_failed" }
    user = created.data
  }
  if (user.suspended_at) return { ok: false, status: 403, error: "account_suspended" }

  return {
    ok: true,
    actor: {
      supabase,
      user: {
        id: user.id,
        email,
        displayName: user.display_name ?? null,
        firstName: user.first_name ?? null,
        lastName: user.last_name ?? null,
        profileCompletedAt: user.profile_completed_at ?? null,
        availabilityCompletedAt: user.availability_completed_at ?? null,
        standardAvailabilityTimezone:
          user.standard_availability_timezone ?? "Europe/Madrid",
        standardAvailabilityWeeklySlots: normalizeAccountStandardAvailability(
          user.standard_availability_weekly_slots,
        ),
        avatarUrl: normalizeStoredImageUrl(user.avatar_url) ?? null,
        preferredSide: normalizePreferredPlayerSide(user.preferred_side),
        dominantHand: normalizeDominantHand(user.dominant_hand),
        isSuperuser: Boolean(user.is_superuser),
        canCreateLeagues: Boolean(user.can_create_leagues),
      },
    },
  }
}
