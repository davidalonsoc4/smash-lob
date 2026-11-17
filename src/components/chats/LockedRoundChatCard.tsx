"use client"

import type { CSSProperties } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"

/**
 * A round that is still locked, shown in the chat lists with the same look as the calendar ("Emparejamientos
 * secretos"), but light: lock, round and one short line. It has no names, messages or unread counter, and it
 * cannot be opened. The explanation of when it unlocks goes once under the section title, not on every card.
 */
export function LockedRoundChatCard({ round, leagueName, badgeStyle, className = "" }: {
  round: number
  leagueName?: string
  badgeStyle?: CSSProperties
  className?: string
}) {
  const { tx } = useI18n()
  return (
    <AppCard
      data-locked-round-chat={round}
      role="group"
      aria-label={`${tx("Jornada")} ${round} · ${tx("Emparejamientos secretos")}`}
      className={`app-card-explicit-accent !overflow-hidden !p-0 !shadow-none border-dashed ${className}`}
    >
      <div className="flex min-w-0 items-center gap-3 px-4 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center text-neutral-400" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="type-panel-title truncate font-black">{tx("Jornada")} {round}</p>
          <p className="type-caption font-semibold text-neutral-500">{tx("Emparejamientos secretos")}</p>
        </div>
        {leagueName ? <span className="personal-match-league-origin max-w-[42%] shrink-0 truncate rounded-xl px-2 py-0.5 type-caption font-semibold" style={badgeStyle}>{leagueName}</span> : null}
      </div>
    </AppCard>
  )
}
