"use client"

import { useEffect, useState, type ReactNode } from "react"
import { DialogCloseButton, FloatingDialog } from "@/components/ui/FloatingDialog"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { useI18n } from "@/i18n/I18nProvider"
import type { RatingSummary } from "@/lib/rating"

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

export type EloSummary = RatingSummary

const percent = (value: number) => `${Math.round(value * 100)} %`
const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toLocaleString("es-ES", { maximumFractionDigits: 1 })}`

// Elo next to the name. The number is absolute and only means something next to other players' numbers, so it is
// shown plain; what feeds it (results, games, rivals) and the difference with the viewer open in a small dialog.
export function EloChip({ elo, differenceToViewer = null, children }: { elo: EloSummary; differenceToViewer?: number | null; children?: ReactNode }) {
  const { tx } = useI18n()
  const [open, setOpen] = useState(false)
  const difference = differenceToViewer === null ? null : Math.round(differenceToViewer)
  const gamesPerMatch = elo.matches ? (elo.gamesFor - elo.gamesAgainst) / elo.matches : 0
  const rows: [string, string, string][] = [
    [tx("Victorias"), `${elo.wins} ${tx("de")} ${elo.matches}`, elo.matches ? percent(elo.wins / elo.matches) : "–"],
    [tx("Juegos"), `${elo.gamesFor}-${elo.gamesAgainst}`, `${signed(gamesPerMatch)} ${tx("por partido")}`],
    [tx("Prob. de ganar esperada"), tx("media de sus partidos"), percent(elo.avgExpected)],
    [tx("Amistosos"), `${elo.friendlyMatches} ${tx("de")} ${elo.matches}`, tx("valen la mitad")],
  ]
  return (
    <div className="flex flex-col items-end gap-0.5">
      <button type="button" onClick={() => setOpen(true)} aria-label={tx("Ver el nivel")} className="inline-flex items-baseline gap-1 rounded-2xl bg-neutral-100 px-3 py-1 text-sm font-black text-neutral-900">
        {Math.round(elo.rating)}<span className="type-caption font-bold text-neutral-500">Elo</span>
      </button>
      {elo.provisional ? <span className="type-micro font-semibold text-neutral-500">{tx("provisional")}</span> : null}
      <FloatingDialog open={open} onClose={() => setOpen(false)} title={tx("Nivel")} variant="content">
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="type-caption font-black uppercase tracking-[0.14em] text-neutral-500">{tx("Nivel")}</p>
            <DialogCloseButton onClick={() => setOpen(false)} />
          </div>
          <div className="rounded-2xl bg-neutral-100 px-4 py-3 text-center">
            <p className="text-5xl font-black leading-none">{Math.round(elo.rating)}</p>
            <p className="mt-1 type-caption font-black uppercase tracking-[0.2em] text-neutral-500">Elo</p>
            {elo.provisional ? <p className="mx-auto mt-2 w-fit rounded-full border border-amber-500/50 px-2.5 py-0.5 type-caption font-black text-amber-600">{tx("provisional")}</p> : null}
          </div>
          {difference !== null && difference !== 0 ? (
            <p className={`rounded-xl px-3 py-2 text-center text-sm font-black ${difference > 0 ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
              {difference > 0 ? `${difference} ${tx("Elo por encima de ti")}` : `${-difference} ${tx("Elo por debajo de ti")}`}
            </p>
          ) : null}
          <div className="rounded-xl bg-neutral-100 px-3 py-1">
            <p className="pt-1.5 type-caption font-black uppercase tracking-[0.14em] text-neutral-500">{tx("Qué lo define")}</p>
            {rows.map(([label, detail, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-3 border-b border-neutral-200 py-1.5 last:border-0">
                <p className="min-w-0 text-sm font-black">{label}<span className="ml-1.5 type-caption font-semibold text-neutral-500">{detail}</span></p>
                <p className="shrink-0 text-sm font-black">{value}</p>
              </div>
            ))}
          </div>
          <p className="type-caption font-semibold leading-4 text-neutral-500">
            {tx("Cada partido puntúa un 70 % por ganar o perder y un 30 % por los juegos conseguidos, y se compara con lo esperado según el nivel de los cuatro jugadores. Ganar a rivales fuertes sube más; perder contra rivales débiles baja más.")}
            {elo.provisional ? ` ${tx("Con pocos partidos el nivel tira hacia 1000 y puede moverse mucho.")}` : ""} {tx("Es relativo a los jugadores de la app: solo sirve para compararse con otros.")}
          </p>
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
      .then((payload: { userId: string; rating: EloSummary | null } | null) => payload)
      .catch(() => null)
      .finally(() => { setTimeout(() => { inflight = null }, 1500) })
    void inflight.then((payload) => { if (active) setMine(payload) })
    return () => { active = false }
  }, [])
  return mine?.rating ? <EloChip elo={mine.rating} /> : null
}
