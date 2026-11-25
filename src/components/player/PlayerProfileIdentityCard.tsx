"use client"

import { useEffect, useState, type ReactNode } from "react"
import { DialogCloseButton, FloatingDialog } from "@/components/ui/FloatingDialog"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { useI18n } from "@/i18n/I18nProvider"

type PlayerProfileIdentityCardProps = {
  player: { displayName: string; avatarUrl: string | null }
  positionLabel?: string | null
  context: "global" | "league"
  leagueName?: string
  contextDetails?: ReactNode
  /** Small element on the right of the name (e.g. the Elo). */
  trailing?: ReactNode
}

export function PlayerProfileIdentityCard({
  player,
  positionLabel,
  context,
  leagueName,
  contextDetails,
  trailing,
}: PlayerProfileIdentityCardProps) {
  const { tx } = useI18n()
  const contextLabel = context === "global" ? tx("Perfil global") : leagueName ?? tx("Liga")

  return (
    <div data-profile-identity={context} className="min-w-0">
      <div className="flex min-w-0 items-center gap-3">
        <PlayerAvatar player={player} size="md" previewable />
        <div className="min-w-0 flex-1">
          <p className="type-caption truncate font-black uppercase tracking-[0.14em] text-neutral-500">
            {contextLabel}
          </p>
          <h1 className="type-player-name-hero break-words">{player.displayName}</h1>
          {contextDetails ? <div className="mt-0.5 min-w-0">{contextDetails}</div> : null}
          {positionLabel ? (
            <p className="mt-1 type-caption font-bold text-neutral-500">
              {positionLabel}
            </p>
          ) : null}
        </div>
        {trailing ? <div className="shrink-0 self-start">{trailing}</div> : null}
      </div>
    </div>
  )
}

export type EloSummary = { rating: number; matches: number; wins: number; provisional: boolean }

// Elo next to the name. The number is absolute and only means something next to other players' numbers, so it is
// shown plain; the detail (matches, provisional, difference with the viewer) opens in a small dialog.
export function EloChip({ elo, differenceToViewer = null, children }: { elo: EloSummary; differenceToViewer?: number | null; children?: ReactNode }) {
  const { tx } = useI18n()
  const [open, setOpen] = useState(false)
  const difference = differenceToViewer === null ? null : Math.round(differenceToViewer)
  return (
    <div className="flex flex-col items-end gap-0.5">
      <button type="button" onClick={() => setOpen(true)} aria-label={tx("Ver el nivel")} className="inline-flex items-baseline gap-1 rounded-lg border border-neutral-300 bg-neutral-100 px-2.5 py-1 text-sm font-black text-neutral-900 transition active:scale-[0.97]">
        {Math.round(elo.rating)}<span className="type-caption font-bold text-neutral-500">Elo</span>
      </button>
      {elo.provisional ? <span className="type-caption font-semibold text-neutral-500">{tx("provisional")}</span> : null}
      <FloatingDialog open={open} onClose={() => setOpen(false)} title={tx("Nivel")} variant="content">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="type-panel-title font-black">{tx("Nivel")}</p>
            <DialogCloseButton onClick={() => setOpen(false)} />
          </div>
          <p className="mt-2 text-4xl font-black leading-none">{Math.round(elo.rating)}<span className="ml-1 text-base font-bold text-neutral-500">Elo</span></p>
          <p className="mt-2 type-caption font-semibold text-neutral-600">{elo.matches} {tx("partidos")} · {elo.wins} {tx("ganados")}</p>
          {elo.provisional ? <p className="type-caption font-semibold text-neutral-500">{tx("Provisional: aún con pocos partidos, puede moverse mucho.")}</p> : null}
          {difference !== null && difference !== 0 ? <p className="mt-1 type-caption font-black text-neutral-800">{difference > 0 ? `${difference} ${tx("Elo por encima de ti")}` : `${-difference} ${tx("Elo por debajo de ti")}`}</p> : null}
          <p className="mt-2 type-caption font-semibold text-neutral-500">{tx("Es relativo a los jugadores de la app: solo sirve para compararse con otros.")}</p>
          {children}
        </div>
      </FloatingDialog>
    </div>
  )
}

let inflight: Promise<{ userId: string; rating: EloSummary | null } | null> | null = null
// Your own Elo (the chip in your global profile). One request shared by every chip on screen.
export function PersonalRatingChip() {
  const [mine, setMine] = useState<{ rating: EloSummary | null } | null>(null)
  useEffect(() => {
    let active = true
    inflight ??= fetch("/api/rating/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { userId: string; rating: { rating: number; matches: number; wins: number; provisional: boolean } | null } | null) => payload)
      .catch(() => null)
      .finally(() => { setTimeout(() => { inflight = null }, 1500) })
    void inflight.then((payload) => { if (active) setMine(payload) })
    return () => { active = false }
  }, [])
  return mine?.rating ? <EloChip elo={mine.rating} /> : null
}
