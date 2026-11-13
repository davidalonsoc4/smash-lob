/**
 * Editing a friendly is shared with linked account participants.
 * Destructive actions such as deleting the match remain creator-only.
 */
export function canManagePersonalMatch(
  currentUserId: string,
  creatorUserId: string | null,
  isLinkedParticipant: boolean,
): boolean {
  return Boolean(currentUserId) &&
    (creatorUserId === currentUserId || isLinkedParticipant)
}
