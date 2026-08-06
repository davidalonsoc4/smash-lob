export type LeagueAuthorizationRole = "creator" | "admin" | "player"

export type AuthorizationRequirement =
  | "authenticated"
  | "league:access"
  | "league:member"
  | "league:admin"
  | "league:creator"
  | "match:participant"

export type AuthorizationContext = {
  authenticated: boolean
  suspended?: boolean
  isSuperuser?: boolean
  membershipRole?: LeagueAuthorizationRole | null
  isSpectator?: boolean
  isParticipant?: boolean
}

export type AuthorizationDecision = {
  allowed: boolean
  reason:
    | "allowed"
    | "unauthenticated"
    | "account_suspended"
    | "league_access_required"
    | "league_membership_required"
    | "league_admin_required"
    | "league_creator_required"
    | "match_participant_required"
}

export function evaluateAuthorization(
  context: AuthorizationContext,
  requirement: AuthorizationRequirement,
): AuthorizationDecision {
  if (!context.authenticated) {
    return { allowed: false, reason: "unauthenticated" }
  }

  if (context.suspended) {
    return { allowed: false, reason: "account_suspended" }
  }

  if (requirement === "authenticated") {
    return { allowed: true, reason: "allowed" }
  }

  const isSuperuser = context.isSuperuser === true
  const role = context.membershipRole ?? null
  const isMember = role !== null
  const isAdmin = isSuperuser || role === "creator" || role === "admin"

  if (requirement === "league:access") {
    return isSuperuser || isMember || context.isSpectator === true
      ? { allowed: true, reason: "allowed" }
      : { allowed: false, reason: "league_access_required" }
  }

  if (requirement === "league:member") {
    return isSuperuser || isMember
      ? { allowed: true, reason: "allowed" }
      : { allowed: false, reason: "league_membership_required" }
  }

  if (requirement === "league:admin") {
    return isAdmin
      ? { allowed: true, reason: "allowed" }
      : { allowed: false, reason: "league_admin_required" }
  }

  if (requirement === "league:creator") {
    return isSuperuser || role === "creator"
      ? { allowed: true, reason: "allowed" }
      : { allowed: false, reason: "league_creator_required" }
  }

  return context.isParticipant === true
    ? { allowed: true, reason: "allowed" }
    : { allowed: false, reason: "match_participant_required" }
}

export function isAuthorized(
  context: AuthorizationContext,
  requirement: AuthorizationRequirement,
) {
  return evaluateAuthorization(context, requirement).allowed
}
