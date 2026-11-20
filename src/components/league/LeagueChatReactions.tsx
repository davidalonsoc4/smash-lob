import { useState } from "react"
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

/**
 * The reactions of a message, floating over the bottom edge of its bubble: tapping one toggles the viewer's own reaction.
 * The count only shows from two people on. The row keeps its own height below the bubble, so it never covers the next message.
 */
export function LeagueChatReactionChips({ reactions, mine, disabled, onToggle, translate, isNew }: {
  reactions: LeagueChatReaction[]
  /** The message is the viewer's own: chips line up on the right, like the bubble. */
  mine: boolean
  disabled: boolean
  onToggle: (key: LeagueChatReactionKey) => void
  translate: (text: string) => string
  /** A reaction that has just appeared pops in; the ones already there when the chat opens stay still. */
  isNew?: (key: LeagueChatReactionKey) => boolean
}) {
  if (!reactions.length) return null
  return (
    <div data-league-chat-reactions className={`relative z-[1] -mt-2.5 flex flex-wrap gap-1 ${mine ? "justify-end pr-2" : "justify-start pl-10"}`}>
      {reactions.map((reaction) => (
        <LeagueChatReactionChip key={reaction.key} reaction={reaction} disabled={disabled} onToggle={onToggle} translate={translate} isNew={Boolean(isNew?.(reaction.key))} />
      ))}
    </div>
  )
}

/** One chip. It decides once, when it appears, whether to pop in, and keeps that for as long as it stays (removing the class would cut the animation short). */
function LeagueChatReactionChip({ reaction, disabled, onToggle, translate, isNew }: {
  reaction: LeagueChatReaction
  disabled: boolean
  onToggle: (key: LeagueChatReactionKey) => void
  translate: (text: string) => string
  isNew: boolean
}) {
  const [pop] = useState(isNew)
  return (
    <button type="button" data-reaction={reaction.key} data-reaction-new={pop ? "true" : undefined} disabled={disabled} aria-pressed={reaction.mine}
      aria-label={`${translate(labelOf(reaction.key))}: ${reaction.count}`} onClick={() => onToggle(reaction.key)}
      className={`league-chat-reaction ${pop ? "league-chat-reaction-pop" : ""} inline-flex h-6 min-w-6 items-center justify-center gap-1 rounded-full border px-1.5 shadow-sm leading-none ${reaction.mine ? "border-neutral-950 bg-neutral-200 text-neutral-950" : "border-neutral-300 bg-white text-neutral-700"}`}>
      <span aria-hidden="true" className="text-sm leading-none">{emojiOf(reaction.key)}</span>
      {reaction.count > 1 ? <span aria-hidden="true" data-reaction-count className="type-micro font-bold">{reaction.count}</span> : null}
    </button>
  )
}
