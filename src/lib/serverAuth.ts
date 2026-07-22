import "server-only"

import { auth } from "@/auth"
import { normalizeStoredImageUrl } from "@/lib/serverImageValidation"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"
import { splitGoogleDisplayName } from "@/lib/accountProfile"

export type AuthenticatedAppUser = {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>
  user: {
    id: string
    email: string
    displayName: string | null
    firstName: string | null
    lastName: string | null
    profileCompletedAt: string | null
    avatarUrl: string | null
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

  const { data: existingUser, error: existingUserError } = await supabase
    .from("app_users")
    .select("id,display_name,first_name,last_name,profile_completed_at,avatar_url,is_superuser,can_create_leagues")
    .eq("email", email)
    .maybeSingle()

  if (existingUserError) {
    return { ok: false, status: 500, error: "app_user_lookup_failed" }
  }

  const googleName = splitGoogleDisplayName(session?.user?.name)
  const hasCompletedProfile = Boolean(existingUser?.profile_completed_at)
  const storedFirstName = existingUser?.first_name?.trim() || null
  const storedLastName = existingUser?.last_name?.trim() || null
  const firstName = storedFirstName || googleName.firstName || null
  const lastName = storedLastName || googleName.lastName || null
  const completedDisplayName =
    existingUser?.display_name ??
    ([firstName, lastName].filter(Boolean).join(" ") || null)
  const displayName = hasCompletedProfile
    ? completedDisplayName
    : session?.user?.name?.trim() || existingUser?.display_name || null

  const { data: user, error: userError } = await supabase
    .from("app_users")
    .upsert(
      {
        email,
        display_name: displayName,
        first_name: firstName,
        last_name: lastName,
        profile_completed_at: existingUser?.profile_completed_at ?? null,
        avatar_url:
          normalizeStoredImageUrl(existingUser?.avatar_url) ??
          normalizeStoredImageUrl(session?.user?.image) ??
          null,
        is_superuser: Boolean(existingUser?.is_superuser),
        can_create_leagues: Boolean(existingUser?.can_create_leagues),
      },
      { onConflict: "email" }
    )
    .select("id,email,display_name,first_name,last_name,profile_completed_at,avatar_url,is_superuser,can_create_leagues")
    .single()

  if (userError) {
    return { ok: false, status: 500, error: "app_user_upsert_failed" }
  }

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
        avatarUrl: normalizeStoredImageUrl(user.avatar_url) ?? null,
        isSuperuser: Boolean(user.is_superuser),
        canCreateLeagues: Boolean(user.can_create_leagues),
      },
    },
  }
}
