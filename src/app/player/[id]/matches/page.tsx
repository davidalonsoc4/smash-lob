"use client"

import { useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { PlayerMatchesList } from "@/components/player/PlayerMatchesList"
import { PlayerSeasonScopeSelector } from "@/components/player/PlayerSeasonScopeSelector"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useMatchData } from "@/context/MatchDataProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import {
  getPlayerSeasonScopes,
  getPlayersForSeasonScope,
} from "@/lib/playerHistory"

type MatchFilter =
  | "all"
  | "finished"
  | "pending"
  | "scheduled"
  | "scheduling"
  | "postponed"

const validFilters: MatchFilter[] = [
  "finished",
  "all",
  "pending",
  "scheduled",
  "scheduling",
  "postponed",
]

function getMatchSortTime(match: { resultRecordedAt?: string | null; scheduledAt?: string | null }) {
  const value = match.resultRecordedAt ?? match.scheduledAt

  if (!value) {
    return 0
  }

  const time = new Date(value).getTime()

  return Number.isNaN(time) ? 0 : time
}

export default function PlayerMatchesPage() {
  const { t } = useI18n()
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { matches: allMatches } = useMatchData()
  const { seasons, seasonPlayers, playerProfiles } = useSeasonSettings()
  const { activeLeague, activeSeason } = useCurrentLeagueData()

  const player = playerProfiles.find(
    (item) =>
      item.leagueId === activeLeague.id &&
      (item.slug === params.id || item.id === params.id)
  )
  const queryFilter = searchParams.get("status")
  const activeFilter = validFilters.includes(queryFilter as MatchFilter)
    ? (queryFilter as MatchFilter)
    : "finished"
  const queryScopeId = searchParams.get("scope")
  const playerHref = `/player/${params.id}`
  const matchesHref = `/player/${params.id}/matches`

  const leagueMatches = useMemo(
    () => allMatches.filter((match) => match.leagueId === activeLeague.id),
    [activeLeague.id, allMatches]
  )

  const seasonScopes = useMemo(() => {
    if (!player) {
      return []
    }

    return getPlayerSeasonScopes({
      leagueId: activeLeague.id,
      playerId: player.id,
      activeSeasonId: activeSeason.id,
      seasons,
      seasonPlayers,
      matches: leagueMatches,
    })
  }, [activeLeague.id, activeSeason.id, leagueMatches, player, seasonPlayers, seasons])

  const selectedScope =
    seasonScopes.find((scope) => scope.id === queryScopeId) ??
    seasonScopes.find((scope) => scope.id === activeSeason.id) ??
    seasonScopes[0]
  const selectedSeasonIds = selectedScope?.seasonIds ?? [activeSeason.id]
  const leagueSeasonCount = seasons.filter(
    (season) => season.leagueId === activeLeague.id
  ).length
  const selectedMatches = leagueMatches.filter((match) =>
    selectedSeasonIds.includes(match.seasonId)
  )
  const selectedPlayers = getPlayersForSeasonScope({
    leagueId: activeLeague.id,
    seasonIds: selectedSeasonIds,
    playerProfiles,
    seasonPlayers,
    matches: leagueMatches,
  })

  const filterOptions: { value: MatchFilter; label: string }[] = [
    { value: "finished", label: t.profile.filterFinished },
    { value: "all", label: t.profile.filterAll },
    { value: "pending", label: t.profile.filterPending },
    { value: "scheduled", label: t.profile.filterScheduled },
    { value: "scheduling", label: t.profile.filterUnscheduled },
    { value: "postponed", label: t.profile.filterPostponed },
  ]

  const playerMatches = player
    ? selectedMatches
        .filter(
          (match) =>
            match.teamA.includes(player.id) || match.teamB.includes(player.id)
        )
        .sort((firstMatch, secondMatch) => {
          const timeDiff = getMatchSortTime(secondMatch) - getMatchSortTime(firstMatch)

          if (timeDiff !== 0) {
            return timeDiff
          }

          if (secondMatch.seasonId !== firstMatch.seasonId) {
            return secondMatch.seasonId.localeCompare(firstMatch.seasonId)
          }

          return secondMatch.round - firstMatch.round
        })
    : []
  const filteredMatches = playerMatches.filter((match) => {
    if (activeFilter === "all") {
      return true
    }

    if (activeFilter === "pending") {
      return match.status !== "finished"
    }

    return match.status === activeFilter
  })

  function buildHref({
    filter = activeFilter,
    scopeId = selectedScope?.id,
  }: {
    filter?: MatchFilter
    scopeId?: string
  }) {
    const nextParams = new URLSearchParams()

    if (filter !== "finished") {
      nextParams.set("status", filter)
    }

    if (scopeId) {
      nextParams.set("scope", scopeId)
    }

    const query = nextParams.toString()

    return query ? `${matchesHref}?${query}` : matchesHref
  }

  function handleFilterChange(filter: MatchFilter) {
    router.push(buildHref({ filter }))
  }

  function handleScopeChange(scopeId: string) {
    router.push(buildHref({ scopeId }))
  }

  if (!player || !selectedScope) {
    return (
      <div className="space-y-4">
        <header className="pt-2">
          <BackButton fallbackHref="/ranking" label={t.common.back} />
        </header>

        <AppCard>
          <p className="font-bold">{t.playerProfile.notFound}</p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <BackButton fallbackHref={playerHref} label={t.common.back} />

        <p className="mt-3 text-sm font-medium text-neutral-500">
          {activeLeague.name} · {selectedScope.label}
        </p>

        <h1 className="mt-1 text-2xl font-black tracking-tight">
          {t.profile.matchHistoryTitle}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {player.displayName} · {t.playerProfile.matchHistoryPageDescription}
        </p>
      </header>

      {leagueSeasonCount > 1 ? (
        <PlayerSeasonScopeSelector
          title={t.playerProfile.scopeSelectorTitle}
          description={t.playerProfile.scopeSelectorDescription}
          value={selectedScope.id}
          scopes={seasonScopes}
          onChange={handleScopeChange}
        />
      ) : null}

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm">
        <p className="text-sm font-black text-neutral-700">
          {t.profile.filterLabel}
        </p>

        <select
          value={activeFilter}
          onChange={(event) =>
            handleFilterChange(event.target.value as MatchFilter)
          }
          className="min-w-40 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm font-black text-neutral-900 outline-none"
        >
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <PlayerMatchesList
        playerId={player.id}
        title={t.profile.filteredMatches}
        matches={filteredMatches}
        players={selectedPlayers}
        seasonMatches={selectedMatches}
        emptyMessage={t.profile.noFilteredMatches}
        leagueLocations={activeLeague.locations}
      />
    </div>
  )
}
