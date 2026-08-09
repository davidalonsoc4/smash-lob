"use client"

import { useEffect, useMemo, useState } from "react"
import { PersonalProfileStatistics, type PersonalProfileSection } from "@/components/personal/PersonalProfileStatistics"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AppCard } from "@/components/ui/AppCard"
import { EmptyState } from "@/components/ui/EmptyState"
import { useAccountProfile } from "@/context/AccountProfileProvider"
import type { PersonalMatchItem, PersonalMatchesDashboardPayload } from "@/lib/personalMatches"
import {
  filterPersonalProfileMatches,
  getPersonalProfileHeadToHead,
  getPersonalProfileStats,
  type PersonalProfileOriginFilter,
} from "@/lib/personalProfileStats"

async function loadAllFinishedMatches() {
  const items: PersonalMatchItem[] = []
  let offset = 0

  for (let page = 0; page < 200; page += 1) {
    const response = await fetch(
      `/api/personal-matches?limit=50&offset=${offset}&includeUpcoming=0&includeAvatars=1`,
      { cache: "no-store" },
    )
    const payload = (await response.json()) as PersonalMatchesDashboardPayload & { error?: string }

    if (!response.ok) throw new Error(payload.error ?? "personal_profile_lookup_failed")

    items.push(...payload.items.filter((match) => match.status === "finished"))
    if (!payload.hasMore || payload.nextOffset === null) return items
    offset = payload.nextOffset
  }

  throw new Error("personal_profile_history_too_large")
}

export default function PersonalProfilePage() {
  const { profile } = useAccountProfile()
  const [items, setItems] = useState<PersonalMatchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [origin, setOrigin] = useState<PersonalProfileOriginFilter>("all")
  const [leagueId, setLeagueId] = useState("")
  const [seasonId, setSeasonId] = useState("")
  const [section, setSection] = useState<PersonalProfileSection>("summary")
  const [comparisonKey, setComparisonKey] = useState("")

  useEffect(() => {
    let cancelled = false

    void loadAllFinishedMatches()
      .then((matches) => {
        if (!cancelled) setItems(matches)
      })
      .catch(() => {
        if (!cancelled) setError("No se han podido cargar tus estadísticas globales.")
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
  const stats = useMemo(() => getPersonalProfileStats(filteredMatches), [filteredMatches])
  const comparisonPeople = useMemo(() => {
    const byKey = new Map<string, { key: string; name: string; avatarUrl: string | null }>()
    for (const relation of [...stats.teammateRelations, ...stats.rivalRelations]) {
      const current = byKey.get(relation.key)
      byKey.set(relation.key, {
        key: relation.key,
        name: relation.name,
        avatarUrl: relation.avatarUrl ?? current?.avatarUrl ?? null,
      })
    }
    return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }))
  }, [stats.rivalRelations, stats.teammateRelations])

  const effectiveComparisonKey = comparisonPeople.some((person) => person.key === comparisonKey)
    ? comparisonKey
    : comparisonPeople[0]?.key ?? ""
  const headToHead = useMemo(
    () => getPersonalProfileHeadToHead(filteredMatches, effectiveComparisonKey),
    [effectiveComparisonKey, filteredMatches],
  )
  const displayName = profile?.displayName?.trim() || "Mi perfil"

  return (
    <div className="space-y-3">
      <header className="pt-2">
        <p className="type-caption font-black uppercase tracking-[0.18em] text-neutral-500">Mis partidos · Perfil global</p>
        <div className="mt-2 flex items-center gap-2.5">
          <PlayerAvatar player={{ displayName, avatarUrl: profile?.avatarUrl ?? null }} size="md" previewable />
          <div className="min-w-0">
            <h1 className="type-player-name-hero truncate">{displayName}</h1>
          </div>
        </div>
      </header>

      <AppCard className="p-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-500">Filtrar estadísticas</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <label className="block">
            <span className="type-caption font-black uppercase tracking-wide text-neutral-500">Tipo</span>
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
            <span className="type-caption font-black uppercase tracking-wide text-neutral-500">Liga</span>
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
              {leagues.map((league) => <option key={league.id} value={league.id}>{league.name}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="type-caption font-black uppercase tracking-wide text-neutral-500">Temporada</span>
            <select
              value={effectiveSeasonId}
              disabled={!effectiveLeagueId}
              onChange={(event) => setSeasonId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs font-bold text-neutral-900 outline-none focus:border-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400"
            >
              <option value="">Todas las temporadas</option>
              {seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}
            </select>
          </label>
        </div>
      </AppCard>

      {loading ? (
        <AppCard><p className="text-sm font-semibold text-neutral-500">Calculando tu histórico completo...</p></AppCard>
      ) : error ? (
        <AppCard><p className="text-sm font-bold text-red-700">{error}</p></AppCard>
      ) : stats.matchesPlayed === 0 ? (
        <EmptyState
          title="No hay partidos para este filtro"
          description="Prueba otro ámbito o registra nuevos resultados para ampliar tus estadísticas."
          action={{ label: "Volver a Mis partidos", href: "/personal-matches" }}
        />
      ) : (
        <PersonalProfileStatistics
          stats={stats}
          section={section}
          onSectionChange={setSection}
          comparisonPeople={comparisonPeople}
          comparisonKey={effectiveComparisonKey}
          onComparisonChange={setComparisonKey}
          headToHead={headToHead}
        />
      )}
    </div>
  )
}
