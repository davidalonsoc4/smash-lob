"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { AppCard } from "@/components/ui/AppCard"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import { useI18n } from "@/i18n/I18nProvider"
import { clearPendingAccessIntent } from "@/lib/pendingAccessIntentClient"
import type { PublicSpectatorMatch, PublicSpectatorRankingRow } from "@/lib/publicSpectator"
import { applySpectatorInviteAppearance, hasStoredAppearancePreference, type SpectatorInviteAppearance } from "@/lib/spectatorTheme"

type PublicViewPayload = {
  league: { name: string; description: string; logoUrl: string | null }
  appearance: SpectatorInviteAppearance | null
  season: { name: string; status: string; totalRounds: number; completedRounds: number } | null
  seasonId?: string
  seasons: { id: string; name: string; status: "active" | "upcoming" | "finished" }[]
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
    <article className="public-spectator-match-card rounded-xl border border-neutral-200 bg-white p-3 shadow-[0_1px_8px_rgba(15,23,42,0.045)]">
      <div className="flex items-center justify-between gap-3">
        <p className="type-caption font-black uppercase tracking-wide text-neutral-500">
          {tx("Jornada")} {match.round}
        </p>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 type-micro font-bold text-neutral-600">
          {statusLabel}
        </span>
      </div>
      {match.teams ? (
        <div className="mt-3 min-w-0 space-y-2">
          {[match.teams[0], match.teams[1]].map((team, index) => (
            <div key={index} className="flex items-stretch justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2">
              <p className="min-w-0 flex-1 text-sm font-bold leading-5 text-neutral-900">{team.join(" / ")}</p>
              {match.score ? (
                <p className="min-w-6 self-center text-right text-lg font-black tabular-nums text-neutral-950">
                  {index === 0 ? match.score.pointsA : match.score.pointsB}
                </p>
              ) : null}
            </div>
          ))}
          {match.score ? (
            <div className="flex gap-1.5 text-xs font-bold text-neutral-600">
              {match.score.sets.map((set, index) => (
                <span key={index} className="rounded-md bg-neutral-100 px-1.5 py-0.5">{set.a}-{set.b}</span>
              ))}
            </div>
          ) : null}
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
  const { status: sessionStatus } = useSession()
  const [view, setView] = useState<PublicViewPayload | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading")
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void clearPendingAccessIntent()

    const query = selectedSeasonId ? `?seasonId=${encodeURIComponent(selectedSeasonId)}` : ""
    fetch(`/api/public-spectator/${encodeURIComponent(code)}${query}`, { cache: "no-store" })
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
        if (!selectedSeasonId && payload.seasonId) setSelectedSeasonId(payload.seasonId)
        setView(payload)
        setState("ready")
      })
      .catch(() => {
        if (!cancelled) setState("error")
      })
    return () => { cancelled = true }
  }, [code, selectedSeasonId])

  useEffect(() => {
    if (!view || sessionStatus !== "unauthenticated" || hasStoredAppearancePreference()) return
    applySpectatorInviteAppearance(view.appearance)
  }, [sessionStatus, view])

  return (
    <main className="min-h-screen bg-neutral-100 px-3 pb-10 pt-6 text-neutral-950 sm:px-5 sm:pt-10">
      <div className="mx-auto max-w-2xl space-y-4">
        {state === "loading" ? <AppCard><p className="font-black">{tx("Cargando liga...")}</p></AppCard> : null}
        {state === "missing" ? <AppCard><h1 className="text-xl font-black">{tx("Enlace no válido")}</h1><p className="mt-2 text-sm text-neutral-500">{tx("Este enlace de espectador no existe o ha sido desactivado.")}</p></AppCard> : null}
        {state === "error" ? <AppCard><h1 className="text-xl font-black">{tx("No se ha podido cargar la liga")}</h1><p className="mt-2 text-sm text-neutral-500">{tx("Comprueba tu conexión e inténtalo de nuevo.")}</p><button type="button" onClick={() => { setState("loading"); setView(null); window.location.reload() }} className="mt-4 flex items-center justify-center rounded-xl bg-neutral-950 px-4 py-2 text-center text-sm font-black text-white">{tx("Reintentar")}</button></AppCard> : null}
        {state === "ready" && view ? (
          <>
            <AppCard className="public-spectator-hero overflow-hidden bg-neutral-950 text-white">
              <div className="flex items-center gap-3">
                <LeagueLogo league={{ name: view.league.name, logoUrl: view.league.logoUrl }} size="lg" />
                <div className="min-w-0">
                  <p className="type-caption font-black uppercase tracking-[0.16em] text-white/60">{tx("Vista de espectador")}</p>
                  <h1 className="public-spectator-league-title mt-1 break-words text-[clamp(1.25rem,6vw,1.75rem)] font-black leading-tight tracking-tight">{view.league.name}</h1>
                </div>
              </div>
              {view.season ? (
                <div className="public-spectator-season mt-4 border-t border-white/15 pt-3">
                  <label htmlFor="public-spectator-season" className="type-micro font-black uppercase tracking-[0.16em] text-white/55">
                    {tx("Temporada")}
                  </label>
                  {view.seasons.length > 1 ? (
                    <select
                      id="public-spectator-season"
                      data-public-season-selector
                      value={view.seasonId ?? selectedSeasonId ?? ""}
                      onChange={(event) => {
                        setState("loading")
                        setSelectedSeasonId(event.target.value)
                      }}
                      className="mt-1 block w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-black text-white outline-none"
                    >
                      {view.seasons.map((season) => (
                        <option key={season.id} value={season.id} className="bg-neutral-900 text-white">
                          {season.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-1 text-base font-black text-white">{view.season.name}</p>
                  )}
                </div>
              ) : null}
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
