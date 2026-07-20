import "server-only"

import { requireAuthenticatedAppUser } from "@/lib/serverAuth"

const substituteErrorCodes = [
  "season_not_found",
  "match_not_found",
  "player_not_found",
  "substitute_player_not_found",
  "incoming_player_not_found",
  "invalid_display_name",
  "invalid_from_round",
  "invalid_original_player",
  "finished_match_locked",
  "season_player_cannot_be_substitute",
  "substitute_already_in_match",
  "substitute_not_available",
  "original_player_already_substituted",
  "substitution_not_found",
  "outgoing_player_not_active",
  "replacement_round_has_finished_matches",
  "outgoing_has_future_substitutions",
  "incoming_player_not_available",
  "incoming_player_already_in_season",
  "incoming_has_future_substitutions",
  "replacement_has_no_future_matches",
] as const

export async function requireSeasonAdmin(seasonId: string) {
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) return authResult

  const { supabase, user } = authResult.actor
  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .select("id,league_id,status,total_rounds")
    .eq("id", seasonId)
    .maybeSingle()

  if (seasonError || !season) {
    return { ok: false as const, status: 404, error: "season_not_found" }
  }

  if (!user.isSuperuser) {
    const { data: membership, error: membershipError } = await supabase
      .from("league_memberships")
      .select("role")
      .eq("league_id", season.league_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (membershipError || !membership || !["creator", "admin"].includes(membership.role)) {
      return { ok: false as const, status: 403, error: "forbidden" }
    }
  }

  return {
    ok: true as const,
    actor: { ...authResult.actor, season },
  }
}

export function slugifySubstituteName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "suplente"
  )
}

export function buildSubstituteSlug(name: string) {
  return `${slugifySubstituteName(name)}-${crypto.randomUUID().slice(0, 8)}`
}

export function getSubstituteInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "SP"
  )
}

export function getSubstituteMutationError(
  error: unknown,
  fallback: string,
) {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : String(error ?? "")

  return substituteErrorCodes.find((code) => message.includes(code)) ?? fallback
}

export function getSubstituteErrorStatus(errorCode: string) {
  if (errorCode.endsWith("_failed")) {
    return 500
  }

  if (errorCode.endsWith("_not_found") || errorCode === "season_not_found" || errorCode === "match_not_found") {
    return 404
  }

  if (errorCode.startsWith("invalid_")) {
    return 400
  }

  return 409
}
