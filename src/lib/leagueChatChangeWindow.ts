/**
 * How long after sending a person may still change their own league chat message.
 * Editing is short so nobody rewrites what others already read and answered; deleting keeps a longer window
 * to take back a mistake. The database enforces the same limits (migration 20261117190000), this only decides
 * which options the menu shows.
 */
export const LEAGUE_CHAT_EDIT_WINDOW_MS = 15 * 60_000
export const LEAGUE_CHAT_DELETE_WINDOW_MS = 60 * 60_000

function age(createdAt: string, now: number) {
  const sent = Date.parse(createdAt)
  return Number.isFinite(sent) ? now - sent : Number.POSITIVE_INFINITY
}

export function canEditLeagueChatMessage(createdAt: string, now = Date.now()) {
  return age(createdAt, now) <= LEAGUE_CHAT_EDIT_WINDOW_MS
}

export function canDeleteLeagueChatMessage(createdAt: string, now = Date.now()) {
  return age(createdAt, now) <= LEAGUE_CHAT_DELETE_WINDOW_MS
}
