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

const validFilters: MatchFilter[] = [
  "finished",
  "all",
  "pending",
  "scheduled",
  "scheduling",
  "postponed",
]

export default function ProfileMatchesPage() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentUserId } = useCurrentUser()
  const { activeLeague, activeSeason, players, matches } =
    useCurrentLeagueData()

  const queryFilter = searchParams.get("status")
  const activeFilter = validFilters.includes(queryFilter as MatchFilter)
    ? (queryFilter as MatchFilter)
    : "finished"
  const player = players.find((item) => item.id === currentUserId)

  const filterOptions: { value: MatchFilter; label: string }[] = [
    { value: "finished", label: t.profile.filterFinished },
    { value: "all", label: t.profile.filterAll },
    { value: "pending", label: t.profile.filterPending },
    { value: "scheduled", label: t.profile.filterScheduled },
    { value: "scheduling", label: t.profile.filterUnscheduled },
    { value: "postponed", label: t.profile.filterPostponed },
  ]

  const playerMatches = matches
    .filter(
      (match) =>
        match.teamA.includes(currentUserId) ||
        match.teamB.includes(currentUserId)
    )
    .sort((firstMatch, secondMatch) => secondMatch.round - firstMatch.round)
  const filteredMatches = playerMatches.filter((match) => {
    if (activeFilter === "all") {
      return true
    }

    if (activeFilter === "pending") {
      return match.status !== "finished"
    }

    return match.status === activeFilter
  })

  function handleFilterChange(filter: MatchFilter) {
    router.push(
      filter === "finished"
        ? "/profile/matches"
        : `/profile/matches?status=${filter}`
    )
  }

  if (!player) {
    return (
      <div className="space-y-5">
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
    <div className="space-y-5">
      <header className="pt-2">
        <BackButton fallbackHref="/profile" label={t.common.back} />

        <p className="mt-4 text-sm font-medium text-neutral-500">
          {activeLeague.name} - {activeSeason.name}
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
          {t.profile.matchHistoryTitle}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {t.profile.matchHistoryPageDescription}
        </p>
      </header>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-sm font-black text-neutral-700">
          {t.profile.filterLabel}
        </p>

        <select
          value={activeFilter}
          onChange={(event) =>
            handleFilterChange(event.target.value as MatchFilter)
          }
          className="min-w-40 rounded-full border border-neutral-200 bg-neutral-100 px-4 py-2 text-sm font-black text-neutral-900 outline-none"
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
        players={players}
        seasonMatches={matches}
        emptyMessage={t.profile.noFilteredMatches}
      />
    </div>
  )
}
