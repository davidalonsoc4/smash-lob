"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { SeasonContextLine } from "@/components/layout/SeasonContextLine"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { PlayerSeasonScopeSelector } from "@/components/player/PlayerSeasonScopeSelector"
import { PlayerStatsPanel } from "@/components/player/PlayerStatsPanel"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { useMatchData } from "@/context/MatchDataProvider"
import { useMvp } from "@/context/MvpProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
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

type PlayerProfileScreenProps = {
  playerIdOrSlug?: string | null
  mode: "self" | "public"
}

export function PlayerProfileScreen({ playerIdOrSlug, mode }: PlayerProfileScreenProps) {
  const { t } = useI18n()
  const { matches: allMatches } = useMatchData()
  const { votes } = useMvp()
  const { seasons, seasonPlayers, playerProfiles, seasonSettings } = useSeasonSettings()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const { currentUserId } = useCurrentUser()
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
  const isSelf = mode === "self"
  const resolvedPlayerIdOrSlug = isSelf ? currentUserId : playerIdOrSlug

  const player = playerProfiles.find(
    (item) =>
      item.leagueId === activeLeague.id &&
      Boolean(resolvedPlayerIdOrSlug) &&
      (item.id === resolvedPlayerIdOrSlug || item.slug === resolvedPlayerIdOrSlug),
  )

  const leagueMatches = useMemo(
    () => allMatches.filter((match) => match.leagueId === activeLeague.id),
    [activeLeague.id, allMatches],
  )

  const seasonScopes = useMemo(() => {
    if (!player) return []

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
    selectedSeasonIds.includes(match.seasonId),
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
        (match) => match.teamA.includes(player.id) || match.teamB.includes(player.id),
      )
    : []

  const seasonStatusLabel =
    latestSeason.status === "finished"
      ? t.common.finishedSeasonBadge
      : latestSeason.status === "upcoming"
        ? t.rounds.statusUpcoming
        : t.rounds.statusActive

  if (!player || !selectedStats || !selectedScope) {
    return (
      <div className={isSelf ? "space-y-3" : "space-y-4"}>
        <header className="app-page-header">
          <BackButton fallbackHref={isSelf ? "/" : "/ranking"} label={t.common.back} />
          {isSelf ? (
            <>
              <h1 className="type-page-title text-2xl font-black tracking-tight">
                {t.profile.title}
              </h1>
              <SeasonContextLine
                seasonName={latestSeason.name}
                statusLabel={seasonStatusLabel}
                className="mt-0.5"
              />
            </>
          ) : null}
        </header>

        <AppCard>
          <p className="font-bold">{isSelf ? t.profile.notFound : t.playerProfile.notFound}</p>
        </AppCard>

        {isSelf ? (
          <AppCard>
            <p className="font-bold">{t.profile.placeholderTitle}</p>
            <p className="mt-2 text-sm text-neutral-500">
              {t.profile.placeholderDescription}
            </p>
          </AppCard>
        ) : null}
      </div>
    )
  }

  const historyHref = isSelf
    ? "/personal-matches"
    : `/player/${player.slug ?? player.id}/matches?scope=${selectedScope.id}`

  return (
    <div className="space-y-3">
      <header className="app-page-header">
        <BackButton fallbackHref={isSelf ? "/" : "/ranking"} label={t.common.back} />
        <div className="flex items-start gap-3">
          <PlayerAvatar player={player} size="md" previewable />

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="type-page-title min-w-0 flex-1 truncate text-2xl font-black tracking-tight">
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

            <SeasonContextLine
              seasonName={latestSeason.name}
              statusLabel={seasonStatusLabel}
              className="mt-0.5"
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <AppCard accentStrip className="overflow-hidden !p-0">
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <p className="truncate text-xs font-black uppercase tracking-wide text-neutral-500">
              {t.profile.points}
            </p>
            <p className="shrink-0 text-xl font-black tracking-tight text-neutral-950">
              {selectedStats.points}
            </p>
          </div>
        </AppCard>

        <AppCard accentStrip className="overflow-hidden !p-0">
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <p className="truncate text-xs font-black uppercase tracking-wide text-neutral-500">
              {t.ranking.gamesDiff}
            </p>
            <p className="shrink-0 text-xl font-black tracking-tight text-neutral-950">
              {`${selectedStats.gamesDiff > 0 ? "+" : ""}${selectedStats.gamesDiff}`}
            </p>
          </div>
        </AppCard>
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

      {isSelf ? (
        <Link href="/availability" className="block">
          <AppCard className="p-2.5 transition active:scale-[0.99]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="type-panel-title font-black">Mi disponibilidad</p>
                <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
                  Configura tus horarios habituales para que la app pueda recomendar fechas de partido.
                </p>
              </div>
              <ClickableChevron className="shrink-0" />
            </div>
          </AppCard>
        </Link>
      ) : null}

      <Link href={historyHref} className="block">
        <AppCard className="p-2.5 transition active:scale-[0.99]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="type-panel-title font-black">{isSelf ? t.profile.myMatches : t.playerProfile.playerMatches}</p>
              <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
                {isSelf ? t.profile.matchHistoryDescription : t.playerProfile.matchHistoryDescription}
              </p>
            </div>
            <ClickableChevron className="shrink-0" />
          </div>
        </AppCard>
      </Link>
    </div>
  )
}
