"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, type ReactNode } from "react"
import { PersonalProfileStatistics } from "@/components/personal/PersonalProfileStatistics"
import type { PersonalProfileSection } from "@/components/player/ProfileSectionTabs"
import { AppCard } from "@/components/ui/AppCard"
import { EmptyState } from "@/components/ui/EmptyState"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useI18n } from "@/i18n/I18nProvider"
import type { PersonalMatchItem } from "@/lib/personalMatches"
import {
  filterPersonalProfileMatches,
  getPersonalProfileHeadToHead,
  getPersonalProfileStats,
  type PersonalProfileOriginFilter,
} from "@/lib/personalProfileStats"

// Body of a global profile (filters, statistics, head to head). Shared by "Mi perfil" and the card of another person:
// they only differ in the matches they pass in and in a few texts.
export function PersonalProfileView({
  items,
  loaded,
  failed,
  animate = false,
  topSlot,
  leagueFilterCount,
  loadingText = "Calculando tu histórico completo...",
  failedText = "No se han podido cargar tus estadísticas globales.",
  emptyDescription = "Prueba otro ámbito o registra nuevos resultados para ampliar tus estadísticas.",
}: {
  items: PersonalMatchItem[]
  loaded: boolean
  failed: boolean
  animate?: boolean
  topSlot?: ReactNode
  leagueFilterCount: number
  loadingText?: string
  failedText?: string
  emptyDescription?: string
}) {
  const { tx } = useI18n()
  const router = useRouter()
  const { activateLeague } = useActiveLeague()
  const [origin, setOrigin] = useState<PersonalProfileOriginFilter>("all")
  const [leagueId, setLeagueId] = useState("")
  const [seasonId, setSeasonId] = useState("")
  const [section, setSection] = useState<PersonalProfileSection>("summary")
  const [comparisonKey, setComparisonKey] = useState("")

  const leagues = useMemo(() => {
    const byId = new Map<string, string>()
    items.forEach((match) => {
      if (match.origin === "league" && match.leagueId) {
        byId.set(match.leagueId, match.leagueName ?? tx("Liga"))
      }
    })
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
  }, [items, tx])

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

  const effectiveLeagueId = origin === "league" ? leagueId : ""
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
  const friendlyCount = items.filter((match) => match.origin === "friendly").length
  const filterOptions = [
    ["all", tx("Todos"), tx("Todos los partidos")],
    ...(leagueFilterCount > 0 ? [["league", tx(leagueFilterCount === 1 ? "Liga" : "Ligas"), tx("Partidos de liga")] as const] : []),
    ...(friendlyCount > 0 ? [["friendly", tx(friendlyCount === 1 ? "Amistoso" : "Amistosos"), tx("Amistosos")] as const] : []),
  ] as const
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

  function openHeadToHead(personKey: string) {
    setComparisonKey(personKey)
    setSection("head-to-head")
  }

  function openPlayerProfile(playerId: string, sourceLeagueId: string | null) {
    if (sourceLeagueId && !activateLeague(sourceLeagueId)) return
    router.push(`/player/${playerId}`)
  }

  return (
    <>
      {topSlot}

      <AppCard data-personal-global-filters className="!p-2">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${filterOptions.length}, minmax(0, 1fr))` }}>
          {filterOptions.map(([value, label, ariaLabel]) => (
            <button key={value} type="button" aria-label={tx(ariaLabel)} aria-pressed={origin === value} onClick={() => { setOrigin(value); if (value === "friendly") { setLeagueId(""); setSeasonId("") } }} className={`flex min-w-0 items-center justify-center rounded-lg px-1.5 py-1.5 text-center type-caption font-black transition ${origin === value ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-600"}`}>{tx(label)}</button>
          ))}
        </div>
        {origin === "league" ? (
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <label className="min-w-0"><span className="sr-only">{tx("Liga")}</span><select aria-label={tx("Liga")} value={effectiveLeagueId} onChange={(event) => { setLeagueId(event.target.value); setSeasonId("") }} className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 type-caption font-bold text-neutral-900 outline-none focus:border-neutral-400"><option value="">{tx("Todas las ligas")}</option>{leagues.map((league) => <option key={league.id} value={league.id}>{league.name}</option>)}</select></label>
            <label className="min-w-0"><span className="sr-only">{tx("Temporada")}</span><select aria-label={tx("Temporada")} value={effectiveSeasonId} disabled={!effectiveLeagueId} onChange={(event) => setSeasonId(event.target.value)} className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 type-caption font-bold text-neutral-900 outline-none focus:border-neutral-400 disabled:bg-neutral-100 disabled:text-neutral-400"><option value="">{tx("Todas las temporadas")}</option>{seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}</select></label>
          </div>
        ) : null}
      </AppCard>

      {!loaded && !failed ? (
        <AppCard><p className="text-sm font-semibold text-neutral-500">{tx(loadingText)}</p></AppCard>
      ) : failed ? (
        <AppCard><p className="text-sm font-bold text-red-700">{tx(failedText)}</p></AppCard>
      ) : (
        <div className={animate ? "personal-profile-enter" : undefined}>
          <PersonalProfileStatistics
            stats={stats}
            section={section}
            onSectionChange={setSection}
            comparisonPeople={comparisonPeople}
            comparisonKey={effectiveComparisonKey}
            onComparisonChange={setComparisonKey}
            onRelationSelect={openHeadToHead}
            onOpenPlayerProfile={openPlayerProfile}
            headToHead={headToHead}
            summaryContent={stats.matchesPlayed === 0 ? (
              <EmptyState
                title={tx("No hay partidos para este filtro")}
                description={tx(emptyDescription)}
                action={{ label: "Volver a Mis partidos", href: "/personal-matches" }}
              />
            ) : undefined}
          />
        </div>
      )}
    </>
  )
}
