"use client"

import type { CSSProperties } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"

/**
 * A round that is still locked, shown in the chat lists with the same look as the calendar ("Emparejamientos
 * secretos"). It has no names, messages or unread counter, and it cannot be opened.
 */
export function LockedRoundChatCard({ round, leagueName, badgeStyle, withDate, className = "" }: {
  round: number
  leagueName?: string
  badgeStyle?: CSSProperties
  /** The round also unlocks by its official start date (the season has date windows). */
  withDate: boolean
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
      <div className="flex min-w-0 items-center gap-3 px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center text-neutral-400" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="type-panel-title min-w-0 flex-1 truncate font-black">{tx("Jornada")} {round}</p>
            {leagueName ? <span className="personal-match-league-origin max-w-[42%] truncate rounded-xl px-2 py-0.5 type-caption font-semibold" style={badgeStyle}>{leagueName}</span> : null}
          </div>
          <p className="mt-0.5 type-caption font-black uppercase tracking-[0.16em] text-neutral-500">{tx("Emparejamientos secretos")}</p>
          <p className="mt-0.5 type-caption font-semibold text-neutral-500">
            {tx(withDate
              ? "Se revelarán cuando finalice la jornada anterior o, como máximo, al comenzar esta jornada."
              : "Se revelarán cuando finalice la jornada anterior.")}
          </p>
        </div>
      </div>
    </AppCard>
  )
}
