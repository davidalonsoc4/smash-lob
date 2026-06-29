import { supabase } from "@/lib/supabase"
import { isSuperuserEmail } from "@/lib/superuser"

export type SupabaseAppUser = {
  id: string
  email: string
  display_name: string | null
  is_superuser: boolean
}

export async function upsertAppUser({
  email,
  displayName,
}: {
  email: string
  displayName?: string | null
}) {
  const normalizedEmail = email.trim().toLowerCase()
  const { data, error } = await supabase
    .from("app_users")
    .upsert(
      {
        email: normalizedEmail,
        display_name: displayName ?? null,
        is_superuser: isSuperuserEmail(normalizedEmail),
      },
      { onConflict: "email" }
    )
    .select("id,email,display_name,is_superuser")
    .single()

  if (error) {
    throw error
  }

  return data as SupabaseAppUser
}
