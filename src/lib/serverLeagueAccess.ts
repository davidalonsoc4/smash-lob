import { auth } from "@/auth"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"

export type ServerLeagueActor = {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>
  user: {
    id: string
    email: string
    displayName: string | null
    avatarUrl: string | null
    isSuperuser: boolean
  }
  membership: {
    role: "creator" | "admin" | "player"
    playerId: string | null
  } | null
}

type GetServerLeagueActorOptions = {
  requireAdmin?: boolean
  requireMember?: boolean
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ""
}

function normalizeRole(value: unknown): "creator" | "admin" | "player" {
  return value === "creator" || value === "admin" || value === "player"
    ? value
    : "player"
}

export async function getServerLeagueActor(
  leagueId: string,
  options: GetServerLeagueActorOptions = {},
): Promise<
  | { ok: true; actor: ServerLeagueActor }
  | { ok: false; status: number; error: string }
> {
  const session = await auth()
  const email = normalizeEmail(session?.user?.email)

  if (!email) {
    return { ok: false, status: 401, error: "unauthenticated" }
  }

  const supabase = createSupabaseServiceClient()

  if (!supabase) {
    return { ok: false, status: 501, error: "missing_service_role" }
  }

  const { data: existingUser, error: existingUserError } = await supabase
    .from("app_users")
    .select("id,email,display_name,avatar_url,is_superuser,can_create_leagues")
    .eq("email", email)
    .maybeSingle()

  if (existingUserError) {
    return { ok: false, status: 500, error: existingUserError.message }
  }

  const { data: user, error: userError } = await supabase
    .from("app_users")
    .upsert(
      {
        email,
        display_name: session?.user?.name?.trim() || existingUser?.display_name || null,
        avatar_url: session?.user?.image ?? existingUser?.avatar_url ?? null,
        is_superuser: Boolean(existingUser?.is_superuser),
        can_create_leagues: Boolean(existingUser?.can_create_leagues),
      },
      { onConflict: "email" },
    )
    .select("id,email,display_name,avatar_url,is_superuser")
    .single()

  if (userError) {
    return { ok: false, status: 500, error: userError.message }
  }

  const { data: membershipRow, error: membershipError } = await supabase
    .from("league_memberships")
    .select("role,player_id")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError) {
    return { ok: false, status: 500, error: membershipError.message }
  }

  const membership = membershipRow
    ? {
        role: normalizeRole(membershipRow.role),
        playerId:
          typeof membershipRow.player_id === "string"
            ? membershipRow.player_id
            : null,
      }
    : null
  const isAdmin =
    Boolean(user.is_superuser) ||
    membership?.role === "creator" ||
    membership?.role === "admin"

  if (options.requireAdmin && !isAdmin) {
    return { ok: false, status: 403, error: "forbidden" }
  }

  if (options.requireMember && !membership && !user.is_superuser) {
    return { ok: false, status: 403, error: "forbidden" }
  }

  return {
    ok: true,
    actor: {
      supabase,
      user: {
        id: user.id,
        email,
        displayName: user.display_name ?? null,
        avatarUrl: user.avatar_url ?? null,
        isSuperuser: Boolean(user.is_superuser),
      },
      membership,
    },
  }
}
