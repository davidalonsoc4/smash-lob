"use client"

import { useEffect, useMemo, useState } from "react"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AppCard } from "@/components/ui/AppCard"
import { EmptyState } from "@/components/ui/EmptyState"
import { useAccountProfile } from "@/context/AccountProfileProvider"
import type {
  PersonalMatchItem,
  PersonalMatchesDashboardPayload,
} from "@/lib/personalMatches"
import {
  filterPersonalProfileMatches,
  getPersonalProfileStats,
  type PersonalProfileOriginFilter,
} from "@/lib/personalProfileStats"

async function loadAllFinishedMatches() {
  const items: PersonalMatchItem[] = []
  let offset = 0

  for (let page = 0; page < 200; page += 1) {
    const response = await fetch(
      `/api/personal-matches?limit=50&offset=${offset}&includeUpcoming=0`,
      { cache: "no-store" },
    )
    const payload = (await response.json()) as PersonalMatchesDashboardPayload & {
      error?: string
    }

    if (!response.ok) {
      throw new Error(payload.error ?? "personal_profile_lookup_failed")
    }

    items.push(...payload.items.filter((match) => match.status === "finished"))

    if (!payload.hasMore || payload.nextOffset === null) {
      return items
    }

    offset = payload.nextOffset
  }

  throw new Error("personal_profile_history_too_large")
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value}`
}

function percentage(value: number) {
  return `${Math.round(value)}%`
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-[0_1px_8px_rgba(15,23,42,0.045)]">
      <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-0.5 text-xl font-black tracking-tight text-neutral-950">
        {value}
      </p>
    </div>
  )
}

export default function PersonalProfilePage() {
  const { profile } = useAccountProfile()
  const [items, setItems] = useState<PersonalMatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [origin, setOrigin] = useState<PersonalProfileOriginFilter>("all")
  const [leagueId, setLeagueId] = useState("")
  const [seasonId, setSeasonId] = useState("")

  useEffect(() => {
    let cancelled = false

    void loadAllFinishedMatches()
      .then((matches) => {
        if (cancelled) return
        setItems(matches)
      })
      .catch(() => {
        if (cancelled) return
        setError("No se han podido cargar tus estadísticas globales.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const leagues = useMemo(() => {
    const byId = new Map<string, string>()
    items.forEach((match) => {
      if (match.origin === "league" && match.leagueId) {
        byId.set(match.leagueId, match.leagueName ?? "Liga")
      }
    })
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
  }, [items])

  const seasons = useMemo(() => {
    if (!leagueId) return []

    const byId = new Map<string, string>()
    items.forEach((match) => {
      if (match.leagueId === leagueId && match.seasonId) {
        byId.set(match.seasonId, match.seasonName ?? "Temporada")
      }
    })

    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
  }, [items, leagueId])

  const effectiveLeagueId = origin === "friendly" ? "" : leagueId
  const effectiveSeasonId = effectiveLeagueId ? seasonId : ""
  const filteredMatches = useMemo(
    () =>
      filterPersonalProfileMatches(items, {
        origin,
        leagueId: effectiveLeagueId || null,
        seasonId: effectiveSeasonId || null,
      }),
    [effectiveLeagueId, effectiveSeasonId, items, origin],
  )
  const stats = useMemo(
    () => getPersonalProfileStats(filteredMatches),
    [filteredMatches],
  )

  const displayName = profile?.displayName?.trim() || "Mi perfil"

  return (
    <div className="space-y-3">
      <header className="pt-2">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">
          Mis partidos · Perfil global
        </p>

        <div className="mt-2 flex items-center gap-2.5">
          <PlayerAvatar
            player={{ displayName, avatarUrl: profile?.avatarUrl ?? null }}
            size="md"
            previewable
          />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black tracking-tight">
              {displayName}
            </h1>
            <p className="mt-0.5 text-xs font-semibold text-neutral-500">
              Estadísticas de todos tus encuentros registrados.
            </p>
          </div>
        </div>
      </header>

      <AppCard className="p-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
          Filtrar estadísticas
        </p>

        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
              Tipo
            </span>
            <select
              value={origin}
              onChange={(event) => {
                const nextOrigin = event.target.value as PersonalProfileOriginFilter
                setOrigin(nextOrigin)
                if (nextOrigin === "friendly") {
                  setLeagueId("")
                  setSeasonId("")
                }
              }}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs font-bold text-neutral-900 outline-none focus:border-neutral-400"
            >
              <option value="all">Todos los partidos</option>
              <option value="friendly">Amistosos</option>
              <option value="league">Partidos de liga</option>
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
              Liga
            </span>
            <select
              value={effectiveLeagueId}
              disabled={origin === "friendly"}
              onChange={(event) => {
                setLeagueId(event.target.value)
                setSeasonId("")
              }}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs font-bold text-neutral-900 outline-none focus:border-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400"
            >
              <option value="">Todas las ligas</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
              Temporada
            </span>
            <select
              value={effectiveSeasonId}
              disabled={!effectiveLeagueId}
              onChange={(event) => setSeasonId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs font-bold text-neutral-900 outline-none focus:border-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400"
            >
              <option value="">Todas las temporadas</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </AppCard>

      {loading ? (
        <AppCard>
          <p className="text-sm font-semibold text-neutral-500">
            Calculando tu histórico completo...
          </p>
        </AppCard>
      ) : error ? (
        <AppCard>
          <p className="text-sm font-bold text-red-700">{error}</p>
        </AppCard>
      ) : stats.matchesPlayed === 0 ? (
        <EmptyState
          title="No hay partidos para este filtro"
          description="Prueba otro ámbito o registra nuevos resultados para ampliar tus estadísticas."
          action={{ label: "Volver a Mis partidos", href: "/personal-matches" }}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <StatTile label="Partidos" value={stats.matchesPlayed} />
            <StatTile label="Dif. juegos" value={signed(stats.gamesDiff)} />
          </div>

          <AppCard className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-neutral-500">
                  Estadísticas de juego
                </p>
                <p className="mt-0.5 text-base font-black tracking-tight">
                  Rendimiento global
                </p>
              </div>
              <div className="rounded-xl bg-neutral-950 px-3 py-2 text-right text-white">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-neutral-300">
                  Victorias
                </p>
                <p className="text-lg font-black leading-none">
                  {percentage(stats.winRate)}
                </p>
                <p className="mt-1 text-[10px] font-semibold text-neutral-300">
                  {stats.wins}-{stats.losses}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <StatTile label="Sets" value={`${stats.setsFor}-${stats.setsAgainst}`} />
              <StatTile label="Dif. sets" value={signed(stats.setsDiff)} />
              <StatTile label="Juegos" value={`${stats.gamesFor}-${stats.gamesAgainst}`} />
              <StatTile label="Mejor racha" value={stats.bestWinStreak} />
            </div>
          </AppCard>

          <AppCard className="p-3">
            <p className="text-xs font-semibold text-neutral-500">Relaciones</p>
            <p className="mt-0.5 text-base font-black tracking-tight">
              Con quién juegas más
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-neutral-50 px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
                  Compañero más frecuente
                </p>
                <p className="mt-1 truncate text-sm font-black text-neutral-950">
                  {stats.mostFrequentTeammate?.name ?? "—"}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
                  {stats.mostFrequentTeammate
                    ? `${stats.mostFrequentTeammate.matches} partidos`
                    : "Sin datos"}
                </p>
              </div>

              <div className="rounded-xl bg-neutral-50 px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
                  Rival más frecuente
                </p>
                <p className="mt-1 truncate text-sm font-black text-neutral-950">
                  {stats.mostFrequentRival?.name ?? "—"}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
                  {stats.mostFrequentRival
                    ? `${stats.mostFrequentRival.matches} partidos`
                    : "Sin datos"}
                </p>
              </div>
            </div>
          </AppCard>

          <AppCard className="p-3">
            <p className="text-xs font-semibold text-neutral-500">Rachas y márgenes</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-neutral-100 px-2 py-2">
                <p className="text-[9px] font-black uppercase tracking-wide text-neutral-500">
                  Racha actual
                </p>
                <p className="mt-1 text-base font-black">{stats.currentWinStreak}</p>
              </div>
              <div className="rounded-xl bg-neutral-100 px-2 py-2">
                <p className="text-[9px] font-black uppercase tracking-wide text-neutral-500">
                  Mejor margen
                </p>
                <p className="mt-1 text-base font-black">
                  {stats.bestGameDiff === null ? "—" : signed(stats.bestGameDiff)}
                </p>
              </div>
              <div className="rounded-xl bg-neutral-100 px-2 py-2">
                <p className="text-[9px] font-black uppercase tracking-wide text-neutral-500">
                  Peor margen
                </p>
                <p className="mt-1 text-base font-black">
                  {stats.toughestGameDiff === null ? "—" : signed(stats.toughestGameDiff)}
                </p>
              </div>
            </div>
          </AppCard>
        </>
      )}
    </div>
  )
}
