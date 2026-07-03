"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { LeagueLogo } from "@/components/league/LeagueLogo";
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge";
import { DashboardMvpCard } from "@/components/mvp/DashboardMvpCard";
import { PlayerAvatar } from "@/components/player/PlayerAvatar";
import { TeamPlayers } from "@/components/player/TeamPlayers";
import { AppCard } from "@/components/ui/AppCard";
import { ClickableChevron } from "@/components/ui/ClickableChevron";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useCurrentUser } from "@/context/CurrentUserProvider";
import { useSeasonSettings } from "@/context/SeasonSettingsProvider";
import { useLeagueAccess } from "@/context/LeagueAccessProvider";
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData";
import { useI18n } from "@/i18n/I18nProvider";
import {
  getRoundMvpPlayerIds,
  getSeasonMvpSelection,
  getPlayersByIds,
} from "@/lib/mvp";
import { recordActivityEvent } from "@/lib/activity";
import {
  findLeagueLocationByScheduleLocation,
  getLeagueLocationCompactText,
  getScheduleLocationFallbackText,
} from "@/lib/leagueLocations";
import { getLastMatch, getNextMatch } from "@/lib/leagues";
import { startSupabaseExistingSeason } from "@/lib/supabaseSeasons";

const supabaseUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isSupabaseBackedId(id: string) {
  return supabaseUuidPattern.test(id);
}

function getActorFromSession(session: ReturnType<typeof useSession>["data"]) {
  return {
    actorEmail: session?.user?.email ?? "system@smash-lob.local",
    actorDisplayName: session?.user?.name ?? null,
  };
}

type AwardPlayer = {
  id: string;
  slug?: string;
  displayName: string;
  avatarInitials?: string | null;
  avatarUrl?: string | null;
};

type DashboardPlayer = AwardPlayer & {
  points: number;
  gamesDiff: number;
  gamesFor: number;
  matchesPlayed: number;
  wins: number;
};

function formatWinPercentage(player: DashboardPlayer) {
  if (player.matchesPlayed === 0) {
    return "0%";
  }

  return `${Math.round((player.wins / player.matchesPlayed) * 100)}%`;
}

function PlayerAwardCard({
  eyebrow,
  title,
  players,
  badge,
  stats,
  inlineStat,
  inlineStatHref,
  cardHref,
}: {
  eyebrow?: string;
  title: string;
  players: AwardPlayer[];
  badge: string;
  stats?: { label: string; value: string | number }[];
  inlineStat?: { label: string; value: string | number };
  inlineStatHref?: string;
  cardHref?: string;
}) {
  const firstPlayer = players[0];
  const isWholeCardClickable = Boolean(cardHref);

  if (!firstPlayer) {
    return null;
  }

  const cardContent = (
    <AppCard
      className={`overflow-hidden p-0 ${
        isWholeCardClickable ? "transition active:scale-[0.99]" : ""
      }`}
    >
      <div className="border-b border-neutral-100 bg-gradient-to-br from-neutral-950 to-neutral-800 px-3 py-2.5 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/60">
                {eyebrow}
              </p>
            ) : null}
            <h2
              className={`${eyebrow ? "mt-1" : ""} text-lg font-black tracking-tight`}
            >
              {title}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base font-black text-neutral-950">
              {badge}
            </div>
            {isWholeCardClickable ? (
              <span
                aria-hidden="true"
                className="text-xl font-black leading-none text-white/70"
              >
                ›
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            {players.slice(0, 3).map((player) => {
              const avatar = (
                <PlayerAvatar
                  player={player}
                  size="lg"
                  className="border-2 border-white bg-neutral-950 text-white"
                />
              );

              return isWholeCardClickable ? (
                <div key={player.id} className="rounded-full">
                  {avatar}
                </div>
              ) : (
                <Link
                  key={player.id}
                  href={`/player/${player.slug ?? player.id}`}
                  aria-label={`Ver perfil de ${player.displayName}`}
                  className="rounded-full transition active:scale-[0.97]"
                >
                  {avatar}
                </Link>
              );
            })}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-black tracking-tight text-neutral-950">
              {players.map((player, index) => (
                <span key={player.id}>
                  {isWholeCardClickable ? (
                    player.displayName
                  ) : (
                    <Link
                      href={`/player/${player.slug ?? player.id}`}
                      className="underline-offset-2 active:underline"
                    >
                      {player.displayName}
                    </Link>
                  )}
                  {index < players.length - 1 ? " / " : ""}
                </span>
              ))}
            </p>
          </div>

          {inlineStat ? (
            inlineStatHref && !isWholeCardClickable ? (
              <Link
                href={inlineStatHref}
                className="shrink-0 rounded-xl bg-neutral-100 px-3 py-2.5 text-center transition active:scale-[0.97]"
              >
                <p className="text-lg font-black text-neutral-950">
                  {inlineStat.value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                  {inlineStat.label}
                </p>
              </Link>
            ) : (
              <div className="shrink-0 rounded-xl bg-neutral-100 px-3 py-2.5 text-center">
                <p className="text-lg font-black text-neutral-950">
                  {inlineStat.value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                  {inlineStat.label}
                </p>
              </div>
            )
          ) : null}
        </div>

        {stats && stats.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-neutral-100 px-2 py-2.5"
              >
                <p className="text-lg font-black text-neutral-950">
                  {stat.value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </AppCard>
  );

  if (cardHref) {
    return (
      <Link href={cardHref} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

export default function Home() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const { hydrateSeasonSnapshot, startSeason } = useSeasonSettings();
  const [isStartingSeason, setIsStartingSeason] = useState(false);
  const [startSeasonError, setStartSeasonError] = useState<string | null>(null);
  const { currentUserId } = useCurrentUser();
  const { isLeagueAdmin } = useLeagueAccess();
  const { activeLeague, activeSeason, players, matches, rounds } =
    useCurrentLeagueData();

  const canManageSeason = isLeagueAdmin(activeLeague.id);
  const isSeasonClosed = activeSeason.status === "finished";
  const isSeasonUpcoming = activeSeason.status === "upcoming";
  const currentUserMatches = matches.filter(
    (match) =>
      match.teamA.includes(currentUserId) ||
      match.teamB.includes(currentUserId),
  );
  const lastMatch = getLastMatch(currentUserMatches);
  const nextMatch = getNextMatch(currentUserMatches);
  const lastMatchLocation = lastMatch
    ? findLeagueLocationByScheduleLocation({
        locations: activeLeague.locations,
        scheduleLocation: lastMatch.location,
      })
    : null;
  const nextMatchLocation = nextMatch
    ? findLeagueLocationByScheduleLocation({
        locations: activeLeague.locations,
        scheduleLocation: nextMatch.location,
      })
    : null;
  const lastMatchHighlightedPlayerIds = lastMatch
    ? getRoundMvpPlayerIds({
        leagueId: activeLeague.id,
        seasonId: activeSeason.id,
        round: lastMatch.round,
        matches,
      })
    : [];
  const nextMatchHighlightedPlayerIds = nextMatch
    ? getRoundMvpPlayerIds({
        leagueId: activeLeague.id,
        seasonId: activeSeason.id,
        round: nextMatch.round,
        matches,
      })
    : [];

  const rankingPlayers = [...players].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff;
    return b.gamesFor - a.gamesFor;
  });

  const leader = rankingPlayers[0];
  const currentUserRankingIndex = rankingPlayers.findIndex(
    (player) => player.id === currentUserId,
  );
  const rankingPreviewStart =
    currentUserRankingIndex <= 0
      ? 0
      : currentUserRankingIndex >= rankingPlayers.length - 1
        ? Math.max(0, rankingPlayers.length - 3)
        : currentUserRankingIndex - 1;
  const rankingPreviewPlayers =
    currentUserRankingIndex === -1
      ? rankingPlayers.slice(0, 3)
      : rankingPlayers.slice(rankingPreviewStart, rankingPreviewStart + 3);
  const seasonMvp = isSeasonClosed
    ? getSeasonMvpSelection({
        leagueId: activeLeague.id,
        seasonId: activeSeason.id,
        matches,
      })
    : null;
  const seasonMvpPlayers = getPlayersByIds(players, seasonMvp?.playerIds ?? []);
  const hasMeaningfulResults = rankingPlayers.some(
    (player) =>
      player.points > 0 ||
      player.gamesFor > 0 ||
      player.gamesDiff !== 0 ||
      player.matchesPlayed > 0,
  );
  const activeRound = rounds.find((round) => round.status === "active");
  const nextRound = rounds.find((round) => round.status === "upcoming");
  const dashboardRound = activeRound ?? nextRound ?? null;

  async function handleStartUpcomingSeason() {
    if (isStartingSeason || !isSeasonUpcoming || !canManageSeason) {
      return;
    }

    const confirmed = window.confirm(
      "¿Comenzar la temporada? A partir de ese momento se podrán programar partidos y registrar resultados.",
    );

    if (!confirmed) {
      return;
    }

    setIsStartingSeason(true);
    setStartSeasonError(null);

    if (isSupabaseBackedId(activeSeason.id)) {
      try {
        const snapshot = await startSupabaseExistingSeason({
          leagueId: activeLeague.id,
          seasonId: activeSeason.id,
        });

        hydrateSeasonSnapshot(snapshot);
      } catch (supabaseError) {
        const details =
          typeof supabaseError === "object" && supabaseError !== null
            ? supabaseError
            : { message: String(supabaseError) };

        window.localStorage.setItem(
          "smash-lob-last-supabase-error",
          JSON.stringify({
            action: "start-upcoming-season-home",
            ...details,
            createdAt: new Date().toISOString(),
          }),
        );
        setStartSeasonError(
          "No se ha podido comenzar la temporada en Supabase. Revisa smash-lob-last-supabase-error.",
        );
        setIsStartingSeason(false);
        return;
      }
    }

    startSeason(activeLeague.id, activeSeason.id);

    try {
      await recordActivityEvent({
        leagueId: activeLeague.id,
        seasonId: activeSeason.id,
        ...getActorFromSession(session),
        type: "season_created",
        title: "Temporada comenzada",
        description: "La temporada ha pasado de próximamente a activa.",
      });
    } catch {
      // La temporada ya ha comenzado; la actividad es auxiliar.
    }

    setIsStartingSeason(false);
  }

  return (
    <div className="space-y-4">
      <header className="pt-1">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
          {activeSeason.name}
        </p>

        <div className="mt-1.5 flex items-center gap-2.5">
          <LeagueLogo league={activeLeague} size="lg" />

          <h1 className="min-w-0 text-2xl font-black tracking-tight">
            {activeLeague.name}
          </h1>
        </div>

        <p className="mt-1 text-xs leading-5 text-neutral-500">
          {activeLeague.description} · {t.common.individualRanking}
        </p>
      </header>

      {isSeasonUpcoming ? (
        <AppCard className="border border-neutral-200 bg-neutral-50/80">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
            Temporada próximamente
          </p>
          <p className="mt-2 font-bold text-neutral-950">
            {activeSeason.name} está creada, pero todavía no ha comenzado.
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Mientras esté en este estado no se pueden programar partidos ni
            registrar resultados.
          </p>

          {canManageSeason ? (
            <>
              <button
                type="button"
                onClick={handleStartUpcomingSeason}
                disabled={isStartingSeason}
                className="mt-3 block w-full rounded-xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white disabled:bg-neutral-300"
              >
                {isStartingSeason ? "Comenzando..." : "Comenzar temporada"}
              </button>

              {startSeasonError ? (
                <p className="mt-3 text-center text-sm font-semibold text-red-600">
                  {startSeasonError}
                </p>
              ) : null}
            </>
          ) : null}
        </AppCard>
      ) : null}

      {isSeasonClosed ? (
        leader ? (
          <div className="space-y-4">
            <PlayerAwardCard
              title={t.dashboard.seasonWinner.replace(
                "{seasonName}",
                activeSeason.name,
              )}
              players={[leader]}
              badge="1º"
              cardHref={`/player/${leader.slug ?? leader.id}`}
              stats={[
                { label: t.common.pointsShort, value: leader.points },
                {
                  label: t.ranking.diff,
                  value: `${leader.gamesDiff > 0 ? "+" : ""}${leader.gamesDiff}`,
                },
                { label: "Victorias", value: formatWinPercentage(leader) },
              ]}
            />

            {seasonMvp ? (
              <PlayerAwardCard
                title={`MVP de ${activeSeason.name}`}
                players={seasonMvpPlayers}
                badge="★"
                inlineStat={{ label: "MVPs", value: seasonMvp.votes }}
                cardHref={
                  seasonMvpPlayers[0]
                    ? `/player/${seasonMvpPlayers[0].slug ?? seasonMvpPlayers[0].id}/mvp`
                    : undefined
                }
              />
            ) : null}

            {canManageSeason ? (
              <Link
                href="/admin/season"
                className="block rounded-xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white"
              >
                {t.dashboard.createSeason}
              </Link>
            ) : null}
          </div>
        ) : (
          <AppCard>
            <p className="font-bold text-neutral-950">
              {t.dashboard.closedSeasonTitle}
            </p>
            {canManageSeason ? (
              <Link
                href="/admin/season"
                className="mt-3 block rounded-xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white"
              >
                {t.dashboard.createSeason}
              </Link>
            ) : null}
          </AppCard>
        )
      ) : null}

      {!isSeasonClosed && !isSeasonUpcoming ? (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label={t.dashboard.leader}
            value={hasMeaningfulResults && leader ? leader.displayName : "-"}
            helper={
              hasMeaningfulResults && leader
                ? `${leader.points} ${t.common.pointsShort} · ${
                    leader.gamesDiff > 0 ? "+" : ""
                  }${leader.gamesDiff} ${t.ranking.diff.toLowerCase()}`
                : "Sin resultados"
            }
          />

          <StatCard
            label={t.dashboard.rounds}
            value={dashboardRound ? `Jornada ${dashboardRound.round}` : "-"}
            helper={
              dashboardRound
                ? dashboardRound.status === "active"
                  ? "Activa"
                  : "Próxima"
                : t.dashboard.regularLeague
            }
          />
        </div>
      ) : null}

      {!isSeasonClosed && !isSeasonUpcoming ? (
        <DashboardMvpCard
          leagueId={activeLeague.id}
          seasonId={activeSeason.id}
          isSeasonClosed={isSeasonClosed}
          canManage={canManageSeason}
          players={players}
          matches={matches}
        />
      ) : null}

      {!isSeasonUpcoming ? (
        <section>
          <SectionHeader
            title={t.dashboard.rankingTitle}
            action={
              <Link
                href="/ranking"
                className="text-sm font-semibold text-neutral-600"
              >
                {t.dashboard.viewAll}
              </Link>
            }
          />

          <AppCard>
            <div className="space-y-3">
              {rankingPreviewPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between gap-3 rounded-xl py-1.5 pl-2 pr-3 ${
                    player.id === currentUserId ? "bg-neutral-100" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold">
                      {rankingPreviewStart + index + 1}
                    </div>

                    <div>
                      <p className="font-semibold">{player.displayName}</p>
                      <p className="text-xs text-neutral-500">
                        {t.ranking.gamesDiff}: {player.gamesDiff > 0 ? "+" : ""}
                        {player.gamesDiff}
                      </p>
                    </div>
                  </div>

                  <p className="min-w-6 text-right text-lg font-black">
                    {player.points}
                  </p>
                </div>
              ))}
            </div>
          </AppCard>
        </section>
      ) : null}

      {!isSeasonClosed && !isSeasonUpcoming && nextMatch ? (
        <section>
          <SectionHeader title="Mi próximo partido" />

          <Link href={`/match/${nextMatch.id}`} className="block">
            <AppCard className="relative border-neutral-300 bg-white p-2.5 transition active:scale-[0.99]">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="min-w-0 text-xs font-black uppercase tracking-wide text-neutral-500">
                  {t.matches.round} {nextMatch.round}
                </p>

                <MatchStatusBadge status={nextMatch.status} />
              </div>

              <ClickableChevron className="absolute right-3 top-1/2 -translate-y-1/2" />

              <div className="space-y-1 pr-11">
                <TeamPlayers
                  playerIds={nextMatch.teamA}
                  players={players}
                  highlightedPlayerIds={nextMatchHighlightedPlayerIds}
                  className="flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
                />
                <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
                  {t.common.versus}
                </p>
                <TeamPlayers
                  playerIds={nextMatch.teamB}
                  players={players}
                  highlightedPlayerIds={nextMatchHighlightedPlayerIds}
                  className="flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
                />
              </div>

              <div className="mt-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-2.5 py-2 pr-11">
                <p className="text-xs font-black text-neutral-800">
                  {nextMatch.dateLabel ??
                    (nextMatch.status === "postponed"
                      ? t.matches.pendingReschedule
                      : t.dashboard.addSchedule)}
                </p>

                <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
                  {nextMatchLocation
                    ? getLeagueLocationCompactText(nextMatchLocation)
                    : (getScheduleLocationFallbackText(nextMatch.location) ??
                      (nextMatch.status === "postponed"
                        ? t.matches.needsReschedule
                        : t.dashboard.playersCanSchedule))}
                </p>
              </div>
            </AppCard>
          </Link>
        </section>
      ) : null}
      {lastMatch && !isSeasonClosed && !isSeasonUpcoming ? (
        <section>
          <SectionHeader title="Mi último partido" />

          <Link href={`/match/${lastMatch.id}`} className="block">
            <AppCard className="relative border-neutral-300 bg-white p-2.5 transition active:scale-[0.99]">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="min-w-0 text-xs font-black uppercase tracking-wide text-neutral-500">
                  {t.matches.round} {lastMatch.round}
                </p>

                <MatchStatusBadge status={lastMatch.status} />
              </div>

              <ClickableChevron className="absolute right-3 top-1/2 -translate-y-1/2" />

              <div className="space-y-1 pr-11">
                <div className="flex items-center justify-between gap-3">
                  <TeamPlayers
                    playerIds={lastMatch.teamA}
                    players={players}
                    highlightedPlayerIds={lastMatchHighlightedPlayerIds}
                    className="flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
                  />
                  <p className="min-w-6 text-right text-lg font-black">
                    {lastMatch.pointsA}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <TeamPlayers
                    playerIds={lastMatch.teamB}
                    players={players}
                    highlightedPlayerIds={lastMatchHighlightedPlayerIds}
                    className="flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
                  />
                  <p className="min-w-6 text-right text-lg font-black">
                    {lastMatch.pointsB}
                  </p>
                </div>
              </div>

              <div className="mt-2 flex gap-1.5 pr-11 text-xs font-bold text-neutral-600">
                {lastMatch.sets.map((set, index) => (
                  <span
                    key={index}
                    className="rounded-md bg-neutral-100 px-1.5 py-0.5"
                  >
                    {set.a}-{set.b}
                  </span>
                ))}
              </div>

              <p className="mt-1.5 truncate pr-11 text-[11px] font-semibold text-neutral-500">
                {lastMatch.dateLabel} ·{" "}
                {lastMatchLocation
                  ? getLeagueLocationCompactText(lastMatchLocation)
                  : getScheduleLocationFallbackText(lastMatch.location)}
              </p>
            </AppCard>
          </Link>
        </section>
      ) : null}

    </div>
  );
}
