"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useState } from "react"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { PlayerSeasonScopeSelector } from "@/components/player/PlayerSeasonScopeSelector"
import { PlayerStatsPanel } from "@/components/player/PlayerStatsPanel"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { useMatchData } from "@/context/MatchDataProvider"
import { useMvp } from "@/context/MvpProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { getSeasonStatusBadgeClassName } from "@/lib/statusStyles"
import {
  getPlayerScopeStats,
  getPlayerSeasonScopes,
  getPlayersForSeasonScope,
} from "@/lib/playerHistory"
import {
  getLatestPlayerProfileSeason,
  getVisiblePlayerSeasonScopes,
  shouldShowPlayerProfileSeasonSelector,
} from "@/lib/playerProfileVisibility"

export default function PlayerPage() {
  const { t } = useI18n()
  const params = useParams<{ id: string }>()
  const { matches: allMatches } = useMatchData()
  const { votes } = useMvp()
  const { seasons, seasonPlayers, playerProfiles, seasonSettings } = useSeasonSettings()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const latestSeason = useMemo(
    () =>
      getLatestPlayerProfileSeason({
        leagueId: activeLeague.id,
        seasons,
        fallbackSeason: activeSeason,
      }),
    [activeLeague.id, activeSeason, seasons],
  )
  const [selectedScopeId, setSelectedScopeId] = useState(latestSeason.id)
  const isSeasonClosed = latestSeason.status === "finished"

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
      activeSeasonId: latestSeason.id,
      seasons,
      seasonPlayers,
      matches: leagueMatches,
    })
  }, [activeLeague.id, latestSeason.id, leagueMatches, player, seasonPlayers, seasons])


  const visibleSeasonScopes = getVisiblePlayerSeasonScopes({
    scopes: seasonScopes,
    activeSeason: latestSeason,
    showHistory: latestSeason.status === "finished",
  })
  const showSeasonSelector = shouldShowPlayerProfileSeasonSelector({
    latestSeason,
    scopes: visibleSeasonScopes,
  })
  const selectedScope =
    visibleSeasonScopes.find((scope) => scope.id === selectedScopeId) ??
    visibleSeasonScopes.find((scope) => scope.id === latestSeason.id) ??
    visibleSeasonScopes[0]
  const selectedSeasonIds = selectedScope?.seasonIds ?? [latestSeason.id]
  const mvpSystemBySeasonId = Object.fromEntries(
    seasonSettings.map((settings) => [settings.seasonId, settings.mvpSystem]),
  )
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
  if (!player || !selectedStats || !selectedScope) {
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
    <div className="space-y-3">
      <header className="pt-1">
        <BackButton fallbackHref="/ranking" label={t.common.back} />

        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-neutral-500">
          <span>{activeLeague.name}</span>
          {isSeasonClosed ? (
            <span className={getSeasonStatusBadgeClassName("finished")}>
              Terminada
            </span>
          ) : null}
        </p>

        <div className="mt-2 flex items-center gap-2.5">
          <PlayerAvatar player={player} size="md" previewable />

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1 className="min-w-0 flex-1 truncate text-2xl font-black tracking-tight">
              {player.displayName}
            </h1>

            {showSeasonSelector && visibleSeasonScopes.length > 1 ? (
              <PlayerSeasonScopeSelector
                inline
                title={t.playerProfile.scopeSelectorTitle}
                description={t.playerProfile.scopeSelectorDescription}
                value={selectedScope.id}
                scopes={visibleSeasonScopes}
                onChange={setSelectedScopeId}
              />
            ) : null}
          </div>
        </div>

        <p className="mt-1.5 text-xs font-semibold leading-5 text-neutral-500">
          {t.playerProfile.description}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-[0_1px_8px_rgba(15,23,42,0.045)]">
          <p className="truncate text-xs font-black uppercase tracking-wide text-neutral-500">
            {t.profile.points}
          </p>
          <p className="shrink-0 text-xl font-black tracking-tight text-neutral-950">
            {selectedStats.points}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-[0_1px_8px_rgba(15,23,42,0.045)]">
          <p className="truncate text-xs font-black uppercase tracking-wide text-neutral-500">
            {t.ranking.gamesDiff}
          </p>
          <p className="shrink-0 text-xl font-black tracking-tight text-neutral-950">
            {`${selectedStats.gamesDiff > 0 ? "+" : ""}${selectedStats.gamesDiff}`}
          </p>
        </div>
      </div>

      <PlayerStatsPanel
        playerId={player.id}
        leagueId={activeLeague.id}
        seasonId={selectedSeasonIds[0] ?? latestSeason.id}
        seasonIds={selectedSeasonIds}
        scopeLabel={selectedScope.label}
        players={selectedPlayers}
        matches={playerMatches}
        seasonMatches={selectedMatches}
        votes={votes}
        mvpSystemBySeasonId={mvpSystemBySeasonId}
      />

      <Link href={`/player/${player.slug ?? player.id}/matches?scope=${selectedScope.id}`}>
        <AppCard className="p-2.5 transition active:scale-[0.99]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-black">{t.profile.matchHistoryTitle}</p>
              <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
                {t.playerProfile.matchHistoryDescription}
              </p>
            </div>

            <ClickableChevron className="shrink-0" />
          </div>
        </AppCard>
      </Link>
    </div>
  )
}
