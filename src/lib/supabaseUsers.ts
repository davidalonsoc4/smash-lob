import { supabase } from "@/lib/supabase"

export type SupabaseAppUser = {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  is_superuser: boolean
  can_create_leagues: boolean
}

function normalizeAvatarUrl(value: string | null | undefined) {
  const cleanValue = value?.trim()

  return cleanValue ? cleanValue : null
}

function isCustomUploadedAvatar(value: string | null | undefined) {
  return normalizeAvatarUrl(value)?.startsWith("data:image/") ?? false
}

function resolveStoredAvatarUrl({
  existingAvatarUrl,
  googleAvatarUrl,
}: {
  existingAvatarUrl?: string | null
  googleAvatarUrl?: string | null
}) {
  const cleanExistingAvatarUrl = normalizeAvatarUrl(existingAvatarUrl)
  const cleanGoogleAvatarUrl = normalizeAvatarUrl(googleAvatarUrl)

  if (isCustomUploadedAvatar(cleanExistingAvatarUrl)) {
    return cleanExistingAvatarUrl
  }

  return cleanGoogleAvatarUrl ?? cleanExistingAvatarUrl ?? null
}

export async function upsertAppUser({
  email,
  displayName,
  avatarUrl,
}: {
  email: string
  displayName?: string | null
  avatarUrl?: string | null
}) {
  const normalizedEmail = email.trim().toLowerCase()
  const { data: existingUser, error: existingUserError } = await supabase
    .from("app_users")
    .select("is_superuser,can_create_leagues,avatar_url")
    .eq("email", normalizedEmail)
    .maybeSingle()

  if (existingUserError) {
    throw existingUserError
  }

  const { data, error } = await supabase
    .from("app_users")
    .upsert(
      {
        email: normalizedEmail,
        display_name: displayName ?? null,
        avatar_url: resolveStoredAvatarUrl({
          existingAvatarUrl: existingUser?.avatar_url,
          googleAvatarUrl: avatarUrl,
        }),
        is_superuser: Boolean(existingUser?.is_superuser),
        can_create_leagues: Boolean(existingUser?.can_create_leagues),
      },
      { onConflict: "email" }
    )
    .select("id,email,display_name,avatar_url,is_superuser,can_create_leagues")
    .single()

  if (error) {
    throw error
  }

  return data as SupabaseAppUser
}
