"use client"

import { ChatTimeSpacer } from "@/components/match/chat/MatchChatShared"
import { useI18n } from "@/i18n/I18nProvider"

export type LeagueChatPoll = {
  options: { id: string; label: string; votes: number; voterIds: string[] }[]
  total: number
  myVote: string | null
}

const MAX_NAMES = 3

/** Poll inside a chat bubble: one option per person, results with bars and names, tap again to withdraw. */
export function LeagueChatPollBody({ question, poll, names, mine, disabled, onVote }: {
  question: string
  poll: LeagueChatPoll
  /** Display name by user id, for the "who voted" line. */
  names: Map<string, string>
  /** The bubble is the viewer's own: it needs more room for the time. */
  mine: boolean
  disabled: boolean
  onVote: (optionId: string | null) => void
}) {
  const { tx } = useI18n()
  return (
    <span className="block w-64 max-w-full" data-league-chat-poll role="radiogroup" aria-label={question}>
      <span className="block font-black leading-snug">{question}</span>
      <span className="league-chat-poll-soft mt-0.5 block text-xs font-semibold">{tx("Encuesta")} · {tx("Elige una opción")}</span>
      <span className="mt-2 block space-y-1.5">
        {poll.options.map((option) => {
          const selected = poll.myVote === option.id
          const percent = poll.total ? Math.round((option.votes / poll.total) * 100) : 0
          const voters = option.voterIds.map((id) => names.get(id) ?? tx("Jugador"))
          return (
            <span key={option.id} className="block">
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => onVote(selected ? null : option.id)}
                className={`league-chat-poll-option relative block w-full overflow-hidden rounded-lg px-2.5 py-2 text-left active:scale-[0.99] disabled:opacity-60 ${selected ? "is-selected" : ""}`}
              >
                <span aria-hidden="true" className="league-chat-poll-bar absolute inset-y-0 left-0" style={{ width: `${percent}%` }} />
                <span className="relative flex items-center gap-2">
                  <span aria-hidden="true" className="league-chat-poll-mark flex h-4 w-4 shrink-0 items-center justify-center rounded-full">
                    {selected ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="m5 12 5 5 9-10" /></svg> : null}
                  </span>
                  <span className="min-w-0 flex-1 break-words text-sm font-semibold leading-tight">{option.label}</span>
                  <span className="shrink-0 text-xs font-black tabular-nums">{option.votes}</span>
                </span>
              </button>
              {voters.length ? (
                <span className="league-chat-poll-soft mt-0.5 block truncate px-1 text-xs font-medium">
                  {voters.slice(0, MAX_NAMES).join(", ")}{voters.length > MAX_NAMES ? ` +${voters.length - MAX_NAMES}` : ""}
                </span>
              ) : null}
            </span>
          )
        })}
      </span>
      <span className="league-chat-poll-soft mt-1.5 block text-xs font-semibold">
        {poll.total} {tx(poll.total === 1 ? "voto" : "votos")}
        <ChatTimeSpacer mine={mine} />
      </span>
    </span>
  )
}
