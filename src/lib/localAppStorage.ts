export const localDomainStorageKeys = [
  "smash-lob-active-league",
  "smash-lob-user-league-memberships",
  "smash-lob-leagues",
  "smash-lob-league-invite-codes",
  "smash-lob-league-settings",
  "smash-lob-matches",
  "smash-lob-season-round-settings",
  "smash-lob-season-data",
  "smash-lob-last-supabase-error",
]

export function clearLocalDomainStorage() {
  Array.from({ length: window.localStorage.length }, (_, index) =>
    window.localStorage.key(index)
  )
    .filter((key): key is string => Boolean(key))
    .filter((key) => key.startsWith("smash-lob-"))
    .forEach((key) => window.localStorage.removeItem(key))
}

export function getLastSupabaseError() {
  return window.localStorage.getItem("smash-lob-last-supabase-error")
}
