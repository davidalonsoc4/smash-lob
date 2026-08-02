export type StoredLeagueInvite = {
  league_id: string
  revoked_at: string | null
}

export function isActiveStoredLeagueInvite(
  invite: StoredLeagueInvite | null | undefined,
): invite is StoredLeagueInvite {
  return Boolean(invite?.league_id && invite.revoked_at === null)
}
