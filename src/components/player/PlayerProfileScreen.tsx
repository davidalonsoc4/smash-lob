"use client"
import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { SeasonContextLineSelector, SeasonContextLine } from "@/components/layout/SeasonContextLine"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { PlayerProfileIdentityCard } from "@/components/player/PlayerProfileIdentityCard"
import { PlayerSeasonScopeSelector } from "@/components/player/PlayerSeasonScopeSelector"
import { PlayerStatsPanel } from "@/components/player/PlayerStatsPanel"
import { PersonalProfileStatistics } from "@/components/personal/PersonalProfileStatistics"
import type { PersonalProfileSection } from "@/components/player/ProfileSectionTabs"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { useMatchData } from "@/context/MatchDataProvider"
import { useMvp } from "@/context/MvpProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { getPlayerSideAndHandLabel } from "@/lib/accountProfile"
import type { PersonalMatchItem } from "@/lib/personalMatches"
import { getPersonalProfileHeadToHead, getPersonalProfileStats } from "@/lib/personalProfileStats"
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
  const router = useRouter()
  const { tx } = useI18n()
  const { t } = useI18n()
  const { matches: allMatches } = useMatchData()
  const { votes } = useMvp()
  const { seasons, seasonPlayers, playerProfiles, seasonSettings } = useSeasonSettings()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const { currentUserId } = useCurrentUser()
  const isSelf = mode === "self"
  const latestSeason = useMemo(
    () =>
      isSelf ? activeSeason : getLatestPlayerProfileSeason({
        leagueId: activeLeague.id,
        seasons,
        fallbackSeason: activeSeason,
      }),
    [activeLeague.id, activeSeason, isSelf, seasons],
  )
  const [selectedScopeId, setSelectedScopeId] = useState(latestSeason.id)
  const [section, setSection] = useState<PersonalProfileSection>("summary")
  const [comparisonKey, setComparisonKey] = useState("")
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
    showHistory: !isSelf && latestSeason.status === "finished",
  })
  const showSeasonSelector = shouldShowPlayerProfileSeasonSelector({
    latestSeason,
    scopes: visibleSeasonScopes,
  })
  const selectedScope =
    visibleSeasonScopes.find((scope) => scope.id === (isSelf ? activeSeason.id : selectedScopeId)) ??
    visibleSeasonScopes.find((scope) => scope.id === latestSeason.id) ??
    visibleSeasonScopes[0]
  const selectedSeasonIds = selectedScope?.seasonIds ?? [latestSeason.id]
  const latestSeasonSettings = seasonSettings.find((settings) => settings.seasonId === latestSeason.id)
  const playerPositionLabel = getPlayerSideAndHandLabel(player?.preferredSide, player?.dominantHand)
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
  const personalProfileItems = useMemo<PersonalMatchItem[]>(() => {
    if (!player) return []
    const playerById = new Map(selectedPlayers.map((item) => [item.id, item]))
    return selectedMatches.map((match) => ({
      id: match.id,
      origin: "league",
      status: match.status === "finished" ? "finished" : "scheduled",
      scheduledAt: match.scheduledAt,
      resultRecordedAt: match.resultRecordedAt,
      locationName: match.location,
      sets: match.sets,
      participants: [match.teamA, match.teamB].flatMap((teamIds, teamIndex) =>
        teamIds.map((participantId, slotIndex) => {
          const participant = playerById.get(participantId)
          return {
            team: (teamIndex + 1) as 1 | 2,
            slot: (slotIndex + 1) as 1 | 2,
            displayName: participant?.displayName ?? tx("Jugador"),
            isCurrentUser: participantId === player.id,
            personKey: `player:${activeLeague.id}:${participantId}`,
            profilePlayerId: participantId,
            profileLeagueId: activeLeague.id,
            avatarUrl: participant?.avatarUrl ?? null,
          }
        }),
      ),
      canManage: false,
      canDelete: false,
      leagueId: activeLeague.id,
      leagueName: activeLeague.name,
      seasonId: match.seasonId,
      seasonName: seasons.find((season) => season.id === match.seasonId)?.name ?? null,
      round: match.round,
    }))
  }, [activeLeague.id, activeLeague.name, player, seasons, selectedMatches, selectedPlayers, tx])
  const profileStats = useMemo(() => getPersonalProfileStats(personalProfileItems), [personalProfileItems])
  const comparisonPeople = useMemo(() => {
    const byKey = new Map<string, { key: string; name: string; avatarUrl: string | null }>()
    for (const relation of [...profileStats.teammateRelations, ...profileStats.rivalRelations]) {
      const current = byKey.get(relation.key)
      byKey.set(relation.key, { key: relation.key, name: relation.name, avatarUrl: relation.avatarUrl ?? current?.avatarUrl ?? null })
    }
    return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }))
  }, [profileStats.rivalRelations, profileStats.teammateRelations])
  const effectiveComparisonKey = comparisonPeople.some((person) => person.key === comparisonKey) ? comparisonKey : comparisonPeople[0]?.key ?? ""
  const headToHead = useMemo(() => getPersonalProfileHeadToHead(personalProfileItems, effectiveComparisonKey), [effectiveComparisonKey, personalProfileItems])
  function openHeadToHead(personKey: string) {
    setComparisonKey(personKey)
    setSection("head-to-head")
  }
  function openPlayerProfile(playerId: string) {
    router.push(`/player/${playerProfiles.find((item) => item.id === playerId)?.slug ?? playerId}`)
  }
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
        {isSelf ? (
          <PlayerProfileIdentityCard player={{ displayName: player.displayName, avatarUrl: player.avatarUrl ?? null }} positionLabel={playerPositionLabel} context="league" leagueName={activeLeague.name} contextDetails={<SeasonContextLineSelector leagueId={activeLeague.id} season={activeSeason} seasons={seasons} onChange={setSelectedScopeId} />} />
        ) : (
          <div className="flex items-start gap-3">
            <PlayerAvatar player={player} size="md" previewable />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1 className="type-page-title min-w-0 w-full break-words text-2xl font-black tracking-tight">{player.displayName}</h1>
                {showSeasonSelector && visibleSeasonScopes.length > 1 ? <PlayerSeasonScopeSelector inline title={t.playerProfile.scopeSelectorTitle} description={t.playerProfile.scopeSelectorDescription} value={selectedScope.id} scopes={visibleSeasonScopes} onChange={setSelectedScopeId} /> : null}
              </div>
              <SeasonContextLine seasonName={latestSeason.name} statusLabel={seasonStatusLabel} className="mt-0.5" />
              {playerPositionLabel ? <p className="mt-0.5 type-caption font-bold text-neutral-500">{tx("Posición preferida ·")} {playerPositionLabel}</p> : null}
            </div>
          </div>
        )}
      </header>
      {isSelf ? (
        <PersonalProfileStatistics
          stats={profileStats}
          section={section}
          onSectionChange={setSection}
          comparisonPeople={comparisonPeople}
          comparisonKey={effectiveComparisonKey}
          onComparisonChange={setComparisonKey}
          onRelationSelect={openHeadToHead}
          onOpenPlayerProfile={openPlayerProfile}
          headToHead={headToHead}
          contextLabel={tx("Comparación de liga y temporada")}
          summaryContent={(
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <AppCard accentStrip className="overflow-hidden !p-0"><div className="flex items-center justify-between gap-2 px-3 py-2"><p className="truncate text-xs font-black uppercase tracking-wide text-neutral-500">{t.profile.points}</p><p className="shrink-0 text-xl font-black tracking-tight text-neutral-950">{selectedStats.points}</p></div></AppCard>
                <AppCard accentStrip className="overflow-hidden !p-0"><div className="flex items-center justify-between gap-2 px-3 py-2"><p className="truncate text-xs font-black uppercase tracking-wide text-neutral-500">{t.ranking.gamesDiff}</p><p className="shrink-0 text-xl font-black tracking-tight text-neutral-950">{`${selectedStats.gamesDiff > 0 ? "+" : ""}${selectedStats.gamesDiff}`}</p></div></AppCard>
              </div>
              <PlayerStatsPanel playerId={player.id} leagueId={activeLeague.id} seasonId={selectedSeasonIds[0] ?? latestSeason.id} seasonIds={selectedSeasonIds} scopeLabel={undefined} players={selectedPlayers} matches={playerMatches} seasonMatches={selectedMatches} votes={votes} mvpSystemBySeasonId={mvpSystemBySeasonId} />
            </div>
          )}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <AppCard accentStrip className="overflow-hidden !p-0"><div className="flex items-center justify-between gap-2 px-3 py-2"><p className="truncate text-xs font-black uppercase tracking-wide text-neutral-500">{t.profile.points}</p><p className="shrink-0 text-xl font-black tracking-tight text-neutral-950">{selectedStats.points}</p></div></AppCard>
            <AppCard accentStrip className="overflow-hidden !p-0"><div className="flex items-center justify-between gap-2 px-3 py-2"><p className="truncate text-xs font-black uppercase tracking-wide text-neutral-500">{t.ranking.gamesDiff}</p><p className="shrink-0 text-xl font-black tracking-tight text-neutral-950">{`${selectedStats.gamesDiff > 0 ? "+" : ""}${selectedStats.gamesDiff}`}</p></div></AppCard>
          </div>
          <PlayerStatsPanel playerId={player.id} leagueId={activeLeague.id} seasonId={selectedSeasonIds[0] ?? latestSeason.id} seasonIds={selectedSeasonIds} scopeLabel={undefined} players={selectedPlayers} matches={playerMatches} seasonMatches={selectedMatches} votes={votes} mvpSystemBySeasonId={mvpSystemBySeasonId} />
        </>
      )}
      {isSelf && section === "summary" && latestSeasonSettings?.availabilityRecommendationsEnabled ? (
        <Link href="/availability" className="block">
          <AppCard className="p-2.5 transition active:scale-[0.99]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="type-panel-title font-black">{tx("Mi disponibilidad")}</p>
                <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
                  {tx("Configura tus horarios habituales para que la app pueda recomendar fechas de partido.")}{" "}</p>
              </div>
              <ClickableChevron className="shrink-0" />
            </div>
          </AppCard>
        </Link>
      ) : null}
      {(!isSelf || section === "summary") ? <Link href={historyHref} className="block">
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
      </Link> : null}
    </div>
  )
}
