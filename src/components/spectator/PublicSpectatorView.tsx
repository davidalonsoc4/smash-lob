"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import { useI18n } from "@/i18n/I18nProvider"
import type { PublicSpectatorMatch, PublicSpectatorRankingRow } from "@/lib/publicSpectator"

type PublicViewPayload = {
  league: { name: string; description: string; logoUrl: string | null }
  season: { name: string; status: string; totalRounds: number; completedRounds: number } | null
  ranking: PublicSpectatorRankingRow[]
  matches: PublicSpectatorMatch[]
  visibility: "empty" | "locked" | "secrets" | "progressive" | "full"
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function MatchCard({ match, tx }: { match: PublicSpectatorMatch; tx: (value: string) => string }) {
  const statusLabel = match.status === "finished"
    ? tx("Finalizado")
    : match.status === "scheduled"
      ? tx("Programado")
      : match.status === "postponed"
        ? tx("Aplazado")
        : match.status === "scheduling"
          ? tx("Pendiente de programar")
          : tx("Detalles aún no disponibles")

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="type-caption font-black uppercase tracking-wide text-neutral-500">
          {tx("Jornada")} {match.round}
        </p>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 type-micro font-bold text-neutral-600">
          {statusLabel}
        </span>
      </div>
      {match.teams ? (
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <p className="text-sm font-bold leading-5 text-neutral-900">{match.teams[0].join(" / ")}</p>
          {match.score ? (
            <div className="text-center">
              <p className="text-sm font-black tabular-nums text-neutral-950">
                {match.score.sets.map((set) => `${set.a}-${set.b}`).join("  ") || `${match.score.pointsA ?? 0}-${match.score.pointsB ?? 0}`}
              </p>
              <p className="type-micro font-bold text-neutral-400">{tx("SETS")}</p>
            </div>
          ) : <span className="text-xs font-black text-neutral-400">VS</span>}
          <p className="text-right text-sm font-bold leading-5 text-neutral-900">{match.teams[1].join(" / ")}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm font-semibold text-neutral-500">{tx("La organización mostrará los detalles cuando empiece la temporada.")}</p>
      )}
      {match.scheduledAt || match.location ? (
        <p className="mt-3 border-t border-neutral-100 pt-2 type-caption font-semibold text-neutral-500">
          {[match.scheduledAt ? formatDate(match.scheduledAt) : null, match.location].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </article>
  )
}

export function PublicSpectatorView({ code }: { code: string }) {
  const { tx } = useI18n()
  const [view, setView] = useState<PublicViewPayload | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading")

  useEffect(() => {
    let cancelled = false
    fetch(`/api/public-spectator/${encodeURIComponent(code)}`, { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 404) return null
        if (!response.ok) throw new Error("public_spectator_unavailable")
        return await response.json() as PublicViewPayload
      })
      .then((payload) => {
        if (cancelled) return
        if (!payload) {
          setState("missing")
          return
        }
        setView(payload)
        setState("ready")
      })
      .catch(() => {
        if (!cancelled) setState("error")
      })
    return () => { cancelled = true }
  }, [code])

  return (
    <main className="min-h-screen bg-neutral-100 px-3 pb-10 pt-6 text-neutral-950 sm:px-5 sm:pt-10">
      <div className="mx-auto max-w-2xl space-y-4">
        {state === "loading" ? <AppCard><p className="font-black">{tx("Cargando liga...")}</p></AppCard> : null}
        {state === "missing" ? <AppCard><h1 className="text-xl font-black">{tx("Enlace no válido")}</h1><p className="mt-2 text-sm text-neutral-500">{tx("Este enlace de espectador no existe o ha sido desactivado.")}</p></AppCard> : null}
        {state === "error" ? <AppCard><h1 className="text-xl font-black">{tx("No se ha podido cargar la liga")}</h1><p className="mt-2 text-sm text-neutral-500">{tx("Comprueba tu conexión e inténtalo de nuevo.")}</p><button type="button" onClick={() => { setState("loading"); setView(null); window.location.reload() }} className="mt-4 flex items-center justify-center rounded-xl bg-neutral-950 px-4 py-2 text-center text-sm font-black text-white">{tx("Reintentar")}</button></AppCard> : null}
        {state === "ready" && view ? (
          <>
            <AppCard className="overflow-hidden bg-neutral-950 text-white">
              <div className="flex items-center gap-3">
                <LeagueLogo league={{ name: view.league.name, logoUrl: view.league.logoUrl }} size="lg" />
                <div className="min-w-0">
                  <p className="type-caption font-black uppercase tracking-[0.16em] text-white/60">{tx("Vista de espectador")}</p>
                  <h1 className="mt-1 truncate text-2xl font-black tracking-tight">{view.league.name}</h1>
                  {view.season ? <p className="mt-1 text-sm font-bold text-white/70">{view.season.name}</p> : null}
                </div>
              </div>
              {view.league.description ? <p className="mt-4 text-sm font-semibold leading-6 text-white/75">{view.league.description}</p> : null}
              <p className="mt-4 rounded-xl bg-white/10 px-3 py-2 type-caption font-bold text-white/75">{tx("Solo lectura · no se muestran datos personales ni actividad interna")}</p>
            </AppCard>

            {!view.season ? <AppCard><p className="font-bold text-neutral-600">{tx("Esta liga todavía no tiene temporadas.")}</p></AppCard> : null}
            {view.visibility === "locked" ? <AppCard><p className="text-sm font-bold leading-6 text-neutral-600">{tx("La organización aún no ha abierto la información de esta temporada.")}</p></AppCard> : null}
            {view.visibility === "secrets" ? <AppCard><p className="text-sm font-bold leading-6 text-neutral-600">{tx("La temporada está en fase de preparación. Los enfrentamientos aparecerán cuando comience.")}</p></AppCard> : null}

            {view.ranking.length ? (
              <AppCard>
                <h2 className="text-lg font-black">{tx("Clasificación")}</h2>
                <div className="mt-3 divide-y divide-neutral-100">
                  {view.ranking.map((player) => (
                    <div key={`${player.position}-${player.name}`} className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 py-2.5">
                      <span className="text-sm font-black text-neutral-400">{player.position}</span>
                      <span className="min-w-0 truncate text-sm font-bold">{player.name}</span>
                      <span className="text-right text-sm font-black tabular-nums">{player.points} <span className="type-micro text-neutral-400">{tx("PTS")}</span></span>
                    </div>
                  ))}
                </div>
              </AppCard>
            ) : null}

            {view.matches.length ? (
              <AppCard>
                <h2 className="text-lg font-black">{tx("Partidos")}</h2>
                <div className="mt-3 space-y-2">
                  {view.matches.map((match, index) => <MatchCard key={`${match.round}-${index}`} match={match} tx={tx} />)}
                </div>
              </AppCard>
            ) : null}
            {view.visibility === "progressive" ? <p className="px-2 text-center type-caption font-semibold text-neutral-500">{tx("El calendario se muestra según lo vaya publicando la organización.")}</p> : null}
            <Link href={`/spectate/${encodeURIComponent(code)}`} className="block px-2 text-center type-caption font-bold text-neutral-500 underline underline-offset-2">{tx("Volver a la invitación")}</Link>
          </>
        ) : null}
      </div>
    </main>
  )
}
