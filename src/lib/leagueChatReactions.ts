/** The closed set of reactions of the league chat. The database stores the key; the emoji only exists here. */
export const LEAGUE_CHAT_REACTIONS = [
  { key: "thumbs_up", emoji: "\u{1F44D}", label: "Me gusta" },
  { key: "heart", emoji: "❤️", label: "Me encanta" },
  { key: "laugh", emoji: "\u{1F602}", label: "Me hace gracia" },
  { key: "surprised", emoji: "\u{1F62E}", label: "Me sorprende" },
  { key: "ball", emoji: "\u{1F3BE}", label: "Bola de pádel" },
  { key: "fire", emoji: "\u{1F525}", label: "Fuego" },
] as const

export type LeagueChatReactionKey = (typeof LEAGUE_CHAT_REACTIONS)[number]["key"]

/** What each message carries: how many people picked each reaction and whether one of them is the viewer. */
export type LeagueChatReaction = { key: LeagueChatReactionKey; count: number; mine: boolean }

export function isLeagueChatReactionKey(value: unknown): value is LeagueChatReactionKey {
  return LEAGUE_CHAT_REACTIONS.some((reaction) => reaction.key === value)
}

/** The viewer's reaction after choosing `key` (choosing the same one again withdraws it), as the server decides it. */
export function applyLeagueChatReaction(reactions: LeagueChatReaction[] | undefined, key: LeagueChatReactionKey | null): LeagueChatReaction[] {
  const without = (reactions ?? [])
    .map((reaction) => (reaction.mine ? { ...reaction, count: reaction.count - 1, mine: false } : reaction))
    .filter((reaction) => reaction.count > 0)
  if (!key) return without
  const existing = without.find((reaction) => reaction.key === key)
  const next = existing
    ? without.map((reaction) => (reaction.key === key ? { ...reaction, count: reaction.count + 1, mine: true } : reaction))
    : [...without, { key, count: 1, mine: true }]
  return sortLeagueChatReactions(next)
}

/** Most chosen first; ties keep the order of the picker, so the chips do not jump around. */
export function sortLeagueChatReactions(reactions: LeagueChatReaction[]) {
  const order = (key: string) => LEAGUE_CHAT_REACTIONS.findIndex((reaction) => reaction.key === key)
  return [...reactions].sort((a, b) => b.count - a.count || order(a.key) - order(b.key))
}
