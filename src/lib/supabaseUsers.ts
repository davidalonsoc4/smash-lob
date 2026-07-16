export type SupabaseAppUser = {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  is_superuser: boolean
  can_create_leagues: boolean
}

export async function fetchCurrentAppUser() {
  const response = await fetch("/api/app-user", { cache: "no-store" })

  if (!response.ok) {
    throw new Error(`app-user-api-${response.status}`)
  }

  const payload = (await response.json()) as {
    user?: SupabaseAppUser
  }

  if (!payload.user) {
    throw new Error("app-user-api-empty")
  }

  return payload.user
}

export async function upsertAppUser(input: {
  email: string
  displayName?: string | null
  avatarUrl?: string | null
}) {
  void input
  return fetchCurrentAppUser()
}
