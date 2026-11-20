import { LEAGUE_CHAT_REACTIONS, type LeagueChatReaction, type LeagueChatReactionKey } from "@/lib/leagueChatReactions"

const emojiOf = (key: LeagueChatReactionKey) => LEAGUE_CHAT_REACTIONS.find((reaction) => reaction.key === key)?.emoji ?? ""
const labelOf = (key: LeagueChatReactionKey) => LEAGUE_CHAT_REACTIONS.find((reaction) => reaction.key === key)?.label ?? key

/** Row of the six reactions at the top of the message menu; the viewer's current one is pressed. */
export function LeagueChatReactionPicker({ current, onPick, translate }: {
  current: LeagueChatReactionKey | null
  onPick: (key: LeagueChatReactionKey) => void
  translate: (text: string) => string
}) {
  return (
    <div role="group" aria-label={translate("Reaccionar")} data-league-chat-reaction-picker className="flex items-center justify-between gap-0.5 border-b border-neutral-200 px-2 pb-1.5 pt-1">
      {LEAGUE_CHAT_REACTIONS.map((reaction) => (
        <button key={reaction.key} type="button" data-reaction={reaction.key} aria-label={translate(reaction.label)} aria-pressed={current === reaction.key}
          onClick={() => onPick(reaction.key)}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xl leading-none active:scale-90 ${current === reaction.key ? "bg-neutral-200" : ""}`}>
          <span aria-hidden="true">{reaction.emoji}</span>
        </button>
      ))}
    </div>
  )
}

/** The reactions of a message under its bubble: tapping one toggles the viewer's own reaction. */
export function LeagueChatReactionChips({ reactions, mine, disabled, onToggle, translate }: {
  reactions: LeagueChatReaction[]
  /** The message is the viewer's own: chips line up on the right, like the bubble. */
  mine: boolean
  disabled: boolean
  onToggle: (key: LeagueChatReactionKey) => void
  translate: (text: string) => string
}) {
  if (!reactions.length) return null
  return (
    <div data-league-chat-reactions className={`mt-0.5 flex flex-wrap gap-1 ${mine ? "justify-end" : "justify-start pl-8"}`}>
      {reactions.map((reaction) => (
        <button key={reaction.key} type="button" data-reaction={reaction.key} disabled={disabled} aria-pressed={reaction.mine}
          aria-label={`${translate(labelOf(reaction.key))}: ${reaction.count}`} onClick={() => onToggle(reaction.key)}
          className={`league-chat-reaction inline-flex min-h-7 items-center gap-1 rounded-full border px-2 text-xs font-bold leading-none ${reaction.mine ? "border-neutral-950 bg-neutral-200 text-neutral-950" : "border-neutral-300 bg-white text-neutral-700"}`}>
          <span aria-hidden="true">{emojiOf(reaction.key)}</span>
          <span>{reaction.count}</span>
        </button>
      ))}
    </div>
  )
}
