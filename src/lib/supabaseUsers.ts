import { supabase } from "@/lib/supabase"

export type SupabaseAppUser = {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  is_superuser: boolean
  can_create_leagues: boolean
}

export async function upsertAppUser({
  email,
  displayName,
}: {
  email: string
  displayName?: string | null
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
        avatar_url: existingUser?.avatar_url ?? null,
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
