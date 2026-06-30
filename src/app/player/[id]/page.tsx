"use client"

import { useParams } from "next/navigation"
import { useMemo, useState } from "react"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { PlayerMatchesList } from "@/components/player/PlayerMatchesList"
import { PlayerSeasonScopeSelector } from "@/components/player/PlayerSeasonScopeSelector"
import { PlayerStatsPanel } from "@/components/player/PlayerStatsPanel"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { StatCard } from "@/components/ui/StatCard"
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

export default function PlayerPage() {
  const { t } = useI18n()
  const params = useParams<{ id: string }>()
  const { matches: allMatches } = useMatchData()
  const { seasons, seasonPlayers, playerProfiles } = useSeasonSettings()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const [selectedScopeId, setSelectedScopeId] = useState(activeSeason.id)

  const player = playerProfiles.find(
    (item) =>
      item.leagueId === activeLeague.id &&
      (item.slug === params.id || item.id === params.id)
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
  const playerMatches = player
    ? selectedMatches.filter(
        (match) => match.teamA.includes(player.id) || match.teamB.includes(player.id)
      )
    : []
  const orderedPlayerMatches = [...playerMatches].sort((firstMatch, secondMatch) => {
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
      <div className="space-y-5">
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
    <div className="space-y-5">
      <header className="pt-2">
        <BackButton fallbackHref="/ranking" label={t.common.back} />

        <p className="mt-4 text-sm font-medium text-neutral-500">
          {activeLeague.name} · {selectedScope.label}
        </p>

        <div className="mt-3 flex items-center gap-3">
          <PlayerAvatar player={player} size="lg" />

          <h1 className="min-w-0 text-3xl font-black tracking-tight">
            {player.displayName}
          </h1>
        </div>

        <p className="mt-3 text-sm text-neutral-500">
          {t.playerProfile.description}
        </p>
      </header>

      <PlayerSeasonScopeSelector
        title={t.playerProfile.scopeSelectorTitle}
        description={t.playerProfile.scopeSelectorDescription}
        value={selectedScope.id}
        scopes={seasonScopes}
        onChange={setSelectedScopeId}
      />

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

      <PlayerMatchesList
        playerId={player.id}
        title={t.playerProfile.playerMatches}
        matches={orderedPlayerMatches}
        players={selectedPlayers}
        seasonMatches={selectedMatches}
      />
    </div>
  )
}
