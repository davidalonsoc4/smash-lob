"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { PlayerMatchesList } from "@/components/player/PlayerMatchesList"
import { PlayerSeasonScopeSelector } from "@/components/player/PlayerSeasonScopeSelector"
import { PlayerStatsPanel } from "@/components/player/PlayerStatsPanel"
import { AppCard } from "@/components/ui/AppCard"
import { StatCard } from "@/components/ui/StatCard"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useMatchData } from "@/context/MatchDataProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import {
  getPlayerScopeStats,
  getPlayerSeasonScopes,
  getPlayersForSeasonScope,
} from "@/lib/playerHistory"

function getMatchSortTime(match: { resultRecordedAt?: string | null; scheduledAt?: string | null }) {
  const value = match.resultRecordedAt ?? match.scheduledAt

  if (!value) {
    return 0
  }

  const time = new Date(value).getTime()

  return Number.isNaN(time) ? 0 : time
}

export default function ProfilePage() {
  const { t } = useI18n()
  const { currentUserId } = useCurrentUser()
  const { matches: allMatches } = useMatchData()
  const { seasons, seasonPlayers, playerProfiles } = useSeasonSettings()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const [selectedScopeId, setSelectedScopeId] = useState(activeSeason.id)

  const player = playerProfiles.find(
    (item) => item.id === currentUserId && item.leagueId === activeLeague.id
  )

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
    seasonScopes.find((scope) => scope.id === selectedScopeId) ?? seasonScopes[0]
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
  const selectedStats = player
    ? getPlayerScopeStats({
        playerId: player.id,
        seasonIds: selectedSeasonIds,
        matches: leagueMatches,
      })
    : null
  const selectedSeason = selectedScope?.isTotal
    ? null
    : seasons.find((season) => season.id === selectedScope?.id) ?? activeSeason
  const showNextMatch = Boolean(
    selectedSeason && selectedSeason.status !== "finished" && !selectedScope?.isTotal
  )
  const playerMatches = player
    ? selectedMatches.filter(
        (match) => match.teamA.includes(player.id) || match.teamB.includes(player.id)
      )
    : []
  const nextMatches = playerMatches
    .filter((match) => match.status !== "finished")
    .sort((firstMatch, secondMatch) => firstMatch.round - secondMatch.round)
  const recentFinishedMatches = playerMatches
    .filter((match) => match.status === "finished")
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

  if (!player || !selectedStats || !selectedScope) {
    return (
      <div className="space-y-3">
        <header className="pt-2">
          <p className="text-sm font-medium text-stone-500">
            {activeLeague.name} · {activeSeason.name}
          </p>

          <h1 className="mt-1 sl-page-title">
            {t.profile.title}
          </h1>
        </header>

        <AppCard>
          <p className="font-bold">{t.profile.notFound}</p>
        </AppCard>

        <AppCard>
          <p className="font-bold">{t.profile.placeholderTitle}</p>
          <p className="mt-2 text-sm text-stone-500">
            {t.profile.placeholderDescription}
          </p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <header className="pt-2">
        <p className="text-sm font-medium text-stone-500">
          {activeLeague.name} · {selectedScope.label}
        </p>

        <div className="mt-3 flex items-center gap-3">
          <PlayerAvatar player={player} size="lg" />

          <h1 className="min-w-0 sl-page-title">
            {player.displayName}
          </h1>
        </div>

        <p className="mt-3 sl-page-subtitle">
          {t.profile.description}
        </p>
      </header>

      {leagueSeasonCount > 1 ? (
        <PlayerSeasonScopeSelector
          title={t.playerProfile.scopeSelectorTitle}
          description={t.playerProfile.scopeSelectorDescription}
          value={selectedScope.id}
          scopes={seasonScopes}
          onChange={setSelectedScopeId}
        />
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={t.profile.points}
          value={selectedStats.points}
          helper={t.common.pointsShort}
        />

        <StatCard
          label={t.ranking.gamesDiff}
          value={`${selectedStats.gamesDiff > 0 ? "+" : ""}${selectedStats.gamesDiff}`}
          helper={t.ranking.diff}
        />
      </div>

      <PlayerStatsPanel
        playerId={player.id}
        leagueId={activeLeague.id}
        seasonId={selectedSeasonIds[0] ?? activeSeason.id}
        seasonIds={selectedSeasonIds}
        scopeLabel={selectedScope.label}
        players={selectedPlayers}
        matches={playerMatches}
        seasonMatches={selectedMatches}
      />

      {showNextMatch ? (
        <PlayerMatchesList
          playerId={player.id}
          title={t.profile.nextMatch}
          matches={nextMatches}
          players={selectedPlayers}
          seasonMatches={selectedMatches}
          limit={1}
          emptyMessage={t.profile.noUpcomingMatches}
        />
      ) : null}

      <PlayerMatchesList
        playerId={player.id}
        title={t.profile.recentResults}
        matches={recentFinishedMatches}
        players={selectedPlayers}
        seasonMatches={selectedMatches}
        limit={3}
        emptyMessage={t.profile.noRecentResults}
        actionHref="/matches?scope=mine"
        actionLabel="Ver todo"
      />

      <Link href="/profile/matches">
        <AppCard className="sl-action-card pr-8 transition">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold">{t.profile.matchHistoryTitle}</p>
              <p className="mt-2 text-sm text-stone-500">
                {t.profile.matchHistoryDescription}
              </p>
            </div>
          </div>
        </AppCard>
      </Link>
    </div>
  )
}
