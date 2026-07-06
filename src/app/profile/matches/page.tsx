"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { PlayerMatchesList } from "@/components/player/PlayerMatchesList"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"

type MatchFilter =
  | "all"
  | "finished"
  | "pending"
  | "scheduled"
  | "scheduling"
  | "postponed"

type MatchSort = "recent" | "roundAsc" | "roundDesc"

const validFilters: MatchFilter[] = [
  "finished",
  "all",
  "pending",
  "scheduled",
  "scheduling",
  "postponed",
]

const validSorts: MatchSort[] = ["recent", "roundAsc", "roundDesc"]

function getMatchSortTime(match: { resultRecordedAt?: string | null; scheduledAt?: string | null; round: number }) {
  const value = match.resultRecordedAt ?? match.scheduledAt

  if (!value) {
    return 0
  }

  const time = new Date(value).getTime()

  return Number.isNaN(time) ? 0 : time
}

function sortMatchesByOrder<T extends { resultRecordedAt?: string | null; scheduledAt?: string | null; round: number }>(
  matches: T[],
  sort: MatchSort,
) {
  return [...matches].sort((firstMatch, secondMatch) => {
    if (sort === "roundAsc") {
      return firstMatch.round - secondMatch.round
    }

    if (sort === "roundDesc") {
      return secondMatch.round - firstMatch.round
    }

    const timeDiff = getMatchSortTime(secondMatch) - getMatchSortTime(firstMatch)

    if (timeDiff !== 0) {
      return timeDiff
    }

    return secondMatch.round - firstMatch.round
  })
}

export default function ProfileMatchesPage() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentUserId } = useCurrentUser()
  const { activeLeague, activeSeason, players, matches } =
    useCurrentLeagueData()

  const queryFilter = searchParams.get("status")
  const querySort = searchParams.get("sort")
  const activeFilter = validFilters.includes(queryFilter as MatchFilter)
    ? (queryFilter as MatchFilter)
    : "finished"
  const activeSort = validSorts.includes(querySort as MatchSort)
    ? (querySort as MatchSort)
    : "recent"
  const player = players.find((item) => item.id === currentUserId)

  const filterOptions: { value: MatchFilter; label: string }[] = [
    { value: "finished", label: t.profile.filterFinished },
    { value: "all", label: t.profile.filterAll },
    { value: "pending", label: t.profile.filterPending },
    { value: "scheduled", label: t.profile.filterScheduled },
    { value: "scheduling", label: t.profile.filterUnscheduled },
    { value: "postponed", label: t.profile.filterPostponed },
  ]
  const sortOptions: { value: MatchSort; label: string }[] = [
    { value: "recent", label: "Más recientes" },
    { value: "roundAsc", label: "Jornada 1 → final" },
    { value: "roundDesc", label: "Última jornada → primera" },
  ]

  const playerMatches = matches.filter(
    (match) =>
      match.teamA.includes(currentUserId) || match.teamB.includes(currentUserId),
  )
  const filteredMatches = sortMatchesByOrder(playerMatches.filter((match) => {
    if (activeFilter === "all") {
      return true
    }

    if (activeFilter === "pending") {
      return match.status !== "finished"
    }

    return match.status === activeFilter
  }), activeSort)

  function buildHref({
    filter = activeFilter,
    sort = activeSort,
  }: {
    filter?: MatchFilter
    sort?: MatchSort
  }) {
    const nextParams = new URLSearchParams()

    if (filter !== "finished") {
      nextParams.set("status", filter)
    }

    if (sort !== "recent") {
      nextParams.set("sort", sort)
    }

    const query = nextParams.toString()

    return query ? `/profile/matches?${query}` : "/profile/matches"
  }

  function handleFilterChange(filter: MatchFilter) {
    router.push(buildHref({ filter }))
  }

  function handleSortChange(sort: MatchSort) {
    router.push(buildHref({ sort }))
  }

  if (!player) {
    return (
      <div className="space-y-4">
        <header className="pt-2">
          <BackButton fallbackHref="/profile" label={t.common.back} />
        </header>

        <AppCard>
          <p className="font-bold">{t.profile.notFound}</p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <BackButton fallbackHref="/profile" label={t.common.back} />

        <p className="mt-3 text-sm font-medium text-neutral-500">
          {activeLeague.name} - {activeSeason.name}
        </p>

        <h1 className="mt-1 text-2xl font-black tracking-tight">
          {t.profile.matchHistoryTitle}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {t.profile.matchHistoryPageDescription}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm">
        <label className="min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            Estado
          </span>
          <select
            value={activeFilter}
            onChange={(event) =>
              handleFilterChange(event.target.value as MatchFilter)
            }
            className="mt-1 w-full rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-2 text-xs font-black text-neutral-900 outline-none"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            Orden
          </span>
          <select
            value={activeSort}
            onChange={(event) => handleSortChange(event.target.value as MatchSort)}
            className="mt-1 w-full rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-2 text-xs font-black text-neutral-900 outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <PlayerMatchesList
        playerId={player.id}
        title={t.profile.filteredMatches}
        matches={filteredMatches}
        players={players}
        seasonMatches={matches}
        emptyMessage={t.profile.noFilteredMatches}
        leagueLocations={activeLeague.locations}
      />
    </div>
  )
}
