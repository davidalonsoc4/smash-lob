"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { LeagueLogo } from "@/components/league/LeagueLogo";
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge";
import { DashboardMvpCard } from "@/components/mvp/DashboardMvpCard";
import { PlayerAvatar } from "@/components/player/PlayerAvatar";
import { TeamPlayers } from "@/components/player/TeamPlayers";
import { SeasonRegistrationPanel } from "@/components/season/SeasonRegistrationPanel";
import { AppCard } from "@/components/ui/AppCard";
import { ClickableChevron } from "@/components/ui/ClickableChevron";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useCurrentUser } from "@/context/CurrentUserProvider";
import { useSeasonSettings } from "@/context/SeasonSettingsProvider";
import { useLeagueAccess } from "@/context/LeagueAccessProvider";
import { useMvp } from "@/context/MvpProvider";
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData";
import type { MatchData } from "@/context/MatchDataProvider";
import { useI18n } from "@/i18n/I18nProvider";
import {
  getMatchMvpSelection,
  getRoundMvpPlayerIds,
  getSeasonMvpSelection,
  getPlayersByIds,
} from "@/lib/mvp";
import { recordActivityEvent } from "@/lib/activity";
import { formatMoney } from "@/lib/courtBooking";
import {
  findLeagueLocationByScheduleLocation,
  getLeagueLocationCompactText,
  getScheduleLocationFallbackText,
} from "@/lib/leagueLocations";
import { getNextMatch } from "@/lib/leagues";
import { getMatchDisplayStatus } from "@/lib/matchLifecycle";
import { parseMatchScheduleDate } from "@/lib/matchScheduleTime";
import { getSeasonStatusBadgeClassName } from "@/lib/statusStyles";
import {
  ensureSeasonRegistrationPlayers,
  getSeasonRegistrationPendingPayments,
  isSeasonRegistrationSettled,
  setSeasonRegistrationPaymentPaidStatus,
} from "@/lib/seasonRegistration";
import {
  startSupabaseExistingSeason,
  updateSupabaseSeasonRoundSettings,
} from "@/lib/supabaseSeasons";

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



function capitalizeFirstLetter(value: string | null | undefined) {
  if (!value) {
    return value
  }

  return value.charAt(0).toLocaleUpperCase("es-ES") + value.slice(1)
}

function areStringArraysEqual(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  )
}

function isSameMatch(left?: MatchData, right?: MatchData) {
  if (!left || !right) {
    return false
  }

  return (
    left.id === right.id ||
    (left.round === right.round &&
      areStringArraysEqual(left.teamA, right.teamA) &&
      areStringArraysEqual(left.teamB, right.teamB))
  )
}

function getMatchRelevantTime(match: MatchData) {
  const scheduledDate = parseMatchScheduleDate(match.scheduledAt);

  if (scheduledDate) {
    return scheduledDate.getTime();
  }

  if (match.resultRecordedAt) {
    const resultTime = new Date(match.resultRecordedAt).getTime();

    if (!Number.isNaN(resultTime)) {
      return resultTime;
    }
  }

  return Number.NEGATIVE_INFINITY;
}

function isPlayedOrPendingResult(match: MatchData, now: Date) {
  const displayStatus = getMatchDisplayStatus({
    status: match.status,
    scheduledAt: match.scheduledAt,
    resultRecordedAt: match.resultRecordedAt,
    now,
  });

  return displayStatus === "finished" || displayStatus === "result_pending";
}

function getLastPlayedOrPendingMatch(matches: MatchData[], now = new Date()) {
  return [...matches]
    .filter((match) => isPlayedOrPendingResult(match, now))
    .sort((a, b) => {
      const timeDiff = getMatchRelevantTime(b) - getMatchRelevantTime(a);

      if (timeDiff !== 0) {
        return timeDiff;
      }

      return b.round - a.round;
    })[0];
}

function buildMatchMetaText({
  match,
  locationText,
}: {
  match: MatchData;
  locationText?: string | null;
}) {
  return [match.dateLabel, locationText].filter(Boolean).join(" · ");
}

function isNextMatchCandidate(match: MatchData, now: Date) {
  const displayStatus = getMatchDisplayStatus({
    status: match.status,
    scheduledAt: match.scheduledAt,
    resultRecordedAt: match.resultRecordedAt,
    now,
  });

  return (
    match.status === "scheduling" ||
    match.status === "postponed" ||
    displayStatus === "scheduled" ||
    displayStatus === "in_progress"
  );
}

function shouldShowScopeSwitch({
  leagueMatch,
  personalMatch,
  candidateCount,
}: {
  leagueMatch?: MatchData;
  personalMatch?: MatchData;
  candidateCount: number;
}) {
  return Boolean(
    leagueMatch &&
      personalMatch &&
      !isSameMatch(leagueMatch, personalMatch) &&
      candidateCount > 1,
  );
}

function getCollapsedScope({
  leagueMatch,
}: {
  leagueMatch?: MatchData;
  personalMatch?: MatchData;
  candidateCount: number;
}): "league" | "mine" {
  if (leagueMatch) {
    return "league";
  }

  return "mine";
}

function getPlayerNameById(players: AwardPlayer[], playerId: string) {
  return players.find((player) => player.id === playerId)?.displayName ?? "otro jugador";
}

function getPendingPaymentItems({
  matches,
  currentUserId,
  players,
}: {
  matches: MatchData[];
  currentUserId: string;
  players: AwardPlayer[];
}) {
  return matches
    .flatMap((match) =>
      match.courtBooking.transfers
        .filter(
          (transfer) =>
            transfer.fromPlayerId === currentUserId && !transfer.isPaid,
        )
        .map((transfer) => ({
          match,
          transfer,
          toPlayerName: getPlayerNameById(players, transfer.toPlayerId),
        })),
    )
    .sort((left, right) => {
      const leftTime = getMatchRelevantTime(left.match);
      const rightTime = getMatchRelevantTime(right.match);

      if (leftTime !== rightTime) {
        return rightTime - leftTime;
      }

      return left.match.round - right.match.round;
    });
}

function getPendingPaymentGroups({
  matches,
  currentUserId,
  players,
}: {
  matches: MatchData[];
  currentUserId: string;
  players: AwardPlayer[];
}) {
  const groups = new Map<
    string,
    {
      toPlayerId: string;
      toPlayerName: string;
      totalAmount: number;
      count: number;
      latestMatch: MatchData;
    }
  >();

  getPendingPaymentItems({ matches, currentUserId, players }).forEach(
    ({ match, transfer, toPlayerName }) => {
      const currentGroup = groups.get(transfer.toPlayerId);

      if (!currentGroup) {
        groups.set(transfer.toPlayerId, {
          toPlayerId: transfer.toPlayerId,
          toPlayerName,
          totalAmount: transfer.amount,
          count: 1,
          latestMatch: match,
        });
        return;
      }

      currentGroup.totalAmount += transfer.amount;
      currentGroup.count += 1;

      if (getMatchRelevantTime(match) > getMatchRelevantTime(currentGroup.latestMatch)) {
        currentGroup.latestMatch = match;
      }
    },
  );

  return Array.from(groups.values()).sort(
    (left, right) => right.totalAmount - left.totalAmount,
  );
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
  const { hydrateSeasonSnapshot, startSeason, updateSeasonRoundSettings } =
    useSeasonSettings();
  const [isStartingSeason, setIsStartingSeason] = useState(false);
  const [startSeasonError, setStartSeasonError] = useState<string | null>(null);
  const [isSendingRegistrationReminder, setIsSendingRegistrationReminder] = useState(false);
  const [nextMatchScope, setNextMatchScope] = useState<"league" | "mine">("league");
  const [lastMatchScope, setLastMatchScope] = useState<"league" | "mine">("league");
  const { currentUserId, currentUser } = useCurrentUser();
  const { isLeagueAdmin, isLeagueSpectator } = useLeagueAccess();
  const { votes } = useMvp();
  const { activeLeague, activeSeason, roundSettings, players, matches, rounds } =
    useCurrentLeagueData();

  const canManageSeason = isLeagueAdmin(activeLeague.id);
  const spectatorMode = isLeagueSpectator(activeLeague.id);
  const canManageRegistration = canManageSeason;
  const isSeasonClosed = activeSeason.status === "finished";
  const isSeasonUpcoming = activeSeason.status === "upcoming";
  const currentUserMatches = matches.filter(
    (match) =>
      match.teamA.includes(currentUserId) ||
      match.teamB.includes(currentUserId),
  );
  const now = new Date();
  const personalLastMatch = getLastPlayedOrPendingMatch(currentUserMatches, now);
  const leagueLastMatch = getLastPlayedOrPendingMatch(matches, now);
  const nextMatch = getNextMatch(currentUserMatches);
  const leagueNextMatch = getNextMatch(matches);
  const nextMatchCandidateCount = matches.filter((match) =>
    isNextMatchCandidate(match, now),
  ).length;
  const lastMatchCandidateCount = matches.filter((match) =>
    isPlayedOrPendingResult(match, now),
  ).length;
  const shouldShowNextMatchScopeSwitch = shouldShowScopeSwitch({
    leagueMatch: leagueNextMatch,
    personalMatch: nextMatch,
    candidateCount: nextMatchCandidateCount,
  });
  const effectiveNextMatchScope = shouldShowNextMatchScopeSwitch
    ? nextMatchScope
    : getCollapsedScope({
        leagueMatch: leagueNextMatch,
        personalMatch: nextMatch,
        candidateCount: nextMatchCandidateCount,
      });
  const selectedNextMatch =
    effectiveNextMatchScope === "mine" ? nextMatch : leagueNextMatch;
  const shouldShowLastMatchScopeSwitch = shouldShowScopeSwitch({
    leagueMatch: leagueLastMatch,
    personalMatch: personalLastMatch,
    candidateCount: lastMatchCandidateCount,
  });
  const effectiveLastMatchScope = shouldShowLastMatchScopeSwitch
    ? lastMatchScope
    : getCollapsedScope({
        leagueMatch: leagueLastMatch,
        personalMatch: personalLastMatch,
        candidateCount: lastMatchCandidateCount,
      });
  const selectedLastMatch =
    effectiveLastMatchScope === "mine" ? personalLastMatch : leagueLastMatch;
  const selectedLastMatchLocation = selectedLastMatch
    ? findLeagueLocationByScheduleLocation({
        locations: activeLeague.locations,
        scheduleLocation: selectedLastMatch.location,
      })
    : null;
  const selectedNextMatchLocation = selectedNextMatch
    ? findLeagueLocationByScheduleLocation({
        locations: activeLeague.locations,
        scheduleLocation: selectedNextMatch.location,
      })
    : null;
  function getMatchPanelHighlightedPlayerIds(match: MatchData | null) {
    if (!match) {
      return [];
    }

    if (roundSettings.mvpSystem === "voting") {
      return getMatchMvpSelection({ votes, match })?.playerIds ?? [];
    }

    return getRoundMvpPlayerIds({
      leagueId: activeLeague.id,
      seasonId: activeSeason.id,
      round: match.round,
      matches,
      votes,
      mvpSystem: roundSettings.mvpSystem,
    });
  }

  const matchPanelMvpLabel =
    roundSettings.mvpSystem === "voting"
      ? "MVP del partido"
      : "MVP de jornada";
  const selectedLastMatchHighlightedPlayerIds =
    getMatchPanelHighlightedPlayerIds(selectedLastMatch);
  const selectedNextMatchHighlightedPlayerIds =
    getMatchPanelHighlightedPlayerIds(selectedNextMatch);
  const selectedLastMatchFallbackLocation = selectedLastMatch
    ? getScheduleLocationFallbackText(selectedLastMatch.location)
    : null;
  const selectedLastMatchMetaText = selectedLastMatch
    ? buildMatchMetaText({
        match: selectedLastMatch,
        locationText: selectedLastMatchLocation
          ? getLeagueLocationCompactText(selectedLastMatchLocation)
          : selectedLastMatchFallbackLocation,
      })
    : "";
  const selectedLastMatchHasResult =
    selectedLastMatch?.status === "finished" ||
    Boolean(selectedLastMatch?.sets.length);
  const pendingPaymentGroups = getPendingPaymentGroups({
    matches,
    currentUserId,
    players,
  });
  const organizerPlayer = activeLeague.createdByUserId
    ? players.find((player) => player.userId === activeLeague.createdByUserId)
    : null;
  const organizerPlayerId = organizerPlayer?.id ?? null;
  const organizerName = organizerPlayer?.displayName ?? "organizador de la liga";
  const automaticallySettledRegistrationPlayerIds = organizerPlayerId
    ? [organizerPlayerId]
    : [];
  const isCurrentUserLeagueCreator = Boolean(
    activeLeague.createdByUserId &&
      activeLeague.createdByUserId === currentUser.userId,
  );
  const canSendRegistrationReminder =
    canManageRegistration && isCurrentUserLeagueCreator;
  const shouldShowRegistrationPanel =
    isSeasonUpcoming &&
    roundSettings.registrationFee.enabled &&
    roundSettings.registrationFee.amount > 0 &&
    (canManageRegistration ||
      roundSettings.registrationFee.payments.some(
        (payment) => payment.playerId === currentUserId,
      ));

  const isRegistrationSettled = isSeasonRegistrationSettled({
    registrationFee: roundSettings.registrationFee,
    playerIds: players.map((player) => player.id),
    settledPlayerIds: automaticallySettledRegistrationPlayerIds,
  });

  async function handleToggleRegistrationPayment(
    playerId: string,
    isPaid: boolean,
  ) {
    if (playerId === organizerPlayerId) {
      return;
    }

    const nextRegistrationFee = ensureSeasonRegistrationPlayers({
      registrationFee: setSeasonRegistrationPaymentPaidStatus({
        registrationFee: roundSettings.registrationFee,
        playerId,
        isPaid,
      }),
      playerIds: players.map((player) => player.id),
    });
    const nextSettings = {
      ...roundSettings,
      leagueId: activeLeague.id,
      seasonId: activeSeason.id,
      registrationFee: nextRegistrationFee,
    };

    if (isSupabaseBackedId(activeSeason.id)) {
      await updateSupabaseSeasonRoundSettings(nextSettings);
    }

    updateSeasonRoundSettings(nextSettings);
  }

  async function handleSendRegistrationPaymentReminder() {
    if (!canSendRegistrationReminder || isSendingRegistrationReminder) {
      return false;
    }

    const pendingPlayerIds = getSeasonRegistrationPendingPayments({
      registrationFee: roundSettings.registrationFee,
      playerIds: players.map((player) => player.id),
      settledPlayerIds: automaticallySettledRegistrationPlayerIds,
    });

    if (pendingPlayerIds.length === 0) {
      return false;
    }

    setIsSendingRegistrationReminder(true);

    try {
      const actor = getActorFromSession(session);

      await recordActivityEvent({
        leagueId: activeLeague.id,
        seasonId: activeSeason.id,
        actorEmail: actor.actorEmail,
        actorDisplayName: actor.actorDisplayName,
        type: "season_registration_payment_reminder",
        title: "Recordatorio de inscripción",
        description: `Inscripción pendiente · ${formatMoney(roundSettings.registrationFee.amount)}`,
        metadata: {
          amount: roundSettings.registrationFee.amount,
          organizerName,
          pendingPlayerIds,
          pendingCount: pendingPlayerIds.length,
        },
      });

      return true;
    } catch {
      return false;
    } finally {
      setIsSendingRegistrationReminder(false);
    }
  }

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
        votes,
        mvpSystem: roundSettings.mvpSystem,
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
  const overdueRound = rounds.find((round) => round.status === "overdue");
  const nextRound = rounds.find((round) => round.status === "upcoming");
  const dashboardRound = activeRound ?? overdueRound ?? nextRound ?? null;

  async function handleStartUpcomingSeason() {
    if (isStartingSeason || !isSeasonUpcoming || !canManageSeason) {
      return;
    }

    if (!isRegistrationSettled) {
      setStartSeasonError(
        "No se puede comenzar la temporada hasta que todas las inscripciones estén saldadas.",
      );
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
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
            {activeSeason.name}
          </p>
          {isSeasonClosed ? (
            <span className={getSeasonStatusBadgeClassName("finished")}>
              {t.common.finishedSeasonBadge}
            </span>
          ) : null}
        </div>

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

      {spectatorMode ? (
        <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-xs font-semibold text-neutral-600 shadow-sm">
          <span className="font-black text-neutral-950">Vista de espectador</span> · Solo lectura
        </div>
      ) : null}

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
                disabled={isStartingSeason || !isRegistrationSettled}
                className="mt-3 block w-full rounded-xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white disabled:bg-neutral-300"
              >
                {isStartingSeason ? "Comenzando..." : "Comenzar temporada"}
              </button>

              {!isRegistrationSettled ? (
                <p className="mt-3 text-center text-xs font-semibold text-amber-700">
                  La temporada no puede comenzar hasta saldar todas las inscripciones.
                </p>
              ) : null}

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
          <AppCard className="p-3">
            <p className="text-xs font-semibold text-neutral-500">
              {t.dashboard.leader}
            </p>
            {hasMeaningfulResults && leader ? (
              <Link
                href={`/player/${leader.slug ?? leader.id}`}
                className="mt-1 block truncate text-xl font-black tracking-tight text-neutral-950 underline-offset-2 active:underline"
              >
                {leader.displayName}
              </Link>
            ) : (
              <p className="mt-1 truncate text-xl font-black tracking-tight text-neutral-950">
                -
              </p>
            )}
            <p className="mt-1 truncate text-[11px] font-medium text-neutral-500">
              {hasMeaningfulResults && leader
                ? `${leader.points} ${t.common.pointsShort} · ${
                    leader.gamesDiff > 0 ? "+" : ""
                  }${leader.gamesDiff} ${t.ranking.diff.toLowerCase()}`
                : "Sin resultados"}
            </p>
          </AppCard>

          {dashboardRound ? (
            <Link href={`/round/${dashboardRound.round}`} className="block">
              <StatCard
                label={t.dashboard.rounds}
                value={`Jornada ${dashboardRound.round}`}
                helper={
                  dashboardRound.status === "active"
                    ? "Activa"
                    : dashboardRound.status === "overdue"
                      ? "Fuera de plazo"
                      : "Próxima"
                }
              />
            </Link>
          ) : (
            <StatCard
              label={t.dashboard.rounds}
              value="-"
              helper={t.dashboard.regularLeague}
            />
          )}
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
          votes={votes}
          mvpSystem={roundSettings.mvpSystem}
        />
      ) : null}

      {shouldShowRegistrationPanel ? (
        <SeasonRegistrationPanel
          registrationFee={roundSettings.registrationFee}
          players={players}
          currentUserId={currentUserId}
          canManage={canManageRegistration}
          organizerName={organizerName}
          automaticallySettledPlayerIds={
            automaticallySettledRegistrationPlayerIds
          }
          isSeasonUpcoming={isSeasonUpcoming}
          canSendReminder={canSendRegistrationReminder}
          onTogglePayment={handleToggleRegistrationPayment}
          onSendReminder={handleSendRegistrationPaymentReminder}
        />
      ) : null}

      {!isSeasonClosed && !isSeasonUpcoming && pendingPaymentGroups.length > 0 ? (
        <section>
          <SectionHeader title="Pagos pendientes" />

          <AppCard className="border-amber-200 bg-amber-50 p-3">
            <div className="space-y-2">
              {pendingPaymentGroups.map(({ toPlayerId, toPlayerName, totalAmount, count }) => (
                <Link
                  key={toPlayerId}
                  href="/payments"
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-2 transition active:scale-[0.99]"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wide text-amber-900">
                      {toPlayerName}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-amber-800">
                      Debes {formatMoney(totalAmount)} en {count} movimiento{count === 1 ? "" : "s"} pendiente{count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="shrink-0 text-lg font-black text-amber-900">›</span>
                </Link>
              ))}
            </div>
          </AppCard>
        </section>
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
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-black text-neutral-950"
                      aria-hidden="true"
                    >
                      {rankingPreviewStart + index + 1}
                    </div>

                    {activeLeague.showRankingAvatars !== false ? (
                      <PlayerAvatar player={player} size="sm" />
                    ) : null}

                    <Link
                      href={`/player/${player.slug ?? player.id}`}
                      className="min-w-0 font-semibold leading-tight text-neutral-950 underline-offset-2 [overflow-wrap:anywhere] active:underline"
                    >
                      {player.displayName}
                    </Link>
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

      {!isSeasonClosed && !isSeasonUpcoming && (leagueNextMatch || nextMatch) ? (
        <section>
          <SectionHeader
            title={
              effectiveNextMatchScope === "mine"
                ? "Mi próximo partido"
                : "Próximo partido"
            }
            action={
              shouldShowNextMatchScopeSwitch ? (
                <div className="flex rounded-full bg-neutral-100 p-0.5 text-[11px] font-black text-neutral-500">
                  <button
                    type="button"
                    onClick={() => setNextMatchScope("league")}
                    className={`rounded-full px-2.5 py-1 transition ${
                      effectiveNextMatchScope === "league"
                        ? "bg-white text-neutral-950 shadow-sm"
                        : "text-neutral-500"
                    }`}
                  >
                    Liga
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextMatchScope("mine")}
                    className={`rounded-full px-2.5 py-1 transition ${
                      effectiveNextMatchScope === "mine"
                        ? "bg-white text-neutral-950 shadow-sm"
                        : "text-neutral-500"
                    }`}
                  >
                    Mío
                  </button>
                </div>
              ) : null
            }
          />

          {selectedNextMatch ? (
            <Link href={`/match/${selectedNextMatch.id}`} className="block">
              <AppCard className="relative border-neutral-300 bg-white p-2.5 transition active:scale-[0.99]">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="min-w-0 text-xs font-black uppercase tracking-wide text-neutral-500">
                    {t.matches.round} {selectedNextMatch.round}
                  </p>

                  <MatchStatusBadge
                    status={selectedNextMatch.status}
                    scheduledAt={selectedNextMatch.scheduledAt}
                    resultRecordedAt={selectedNextMatch.resultRecordedAt}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <TeamPlayers
                      playerIds={selectedNextMatch.teamA}
                      players={players}
                      highlightedPlayerIds={selectedNextMatchHighlightedPlayerIds}
                      highlightedPlayerLabel={matchPanelMvpLabel}
                      className="flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
                    />
                    <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
                      {t.common.versus}
                    </p>
                    <TeamPlayers
                      playerIds={selectedNextMatch.teamB}
                      players={players}
                      highlightedPlayerIds={selectedNextMatchHighlightedPlayerIds}
                      highlightedPlayerLabel={matchPanelMvpLabel}
                      className="flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
                    />
                  </div>

                  <ClickableChevron className="shrink-0" />
                </div>

                <div className="mt-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-2.5 py-2">
                  <p className="text-xs font-black text-neutral-800">
                    {capitalizeFirstLetter(selectedNextMatch.dateLabel) ??
                      (selectedNextMatch.status === "postponed"
                        ? t.matches.pendingReschedule
                        : t.dashboard.addSchedule)}
                  </p>

                  <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
                    {selectedNextMatchLocation
                      ? getLeagueLocationCompactText(selectedNextMatchLocation)
                      : (getScheduleLocationFallbackText(
                          selectedNextMatch.location,
                        ) ??
                        (selectedNextMatch.status === "postponed"
                          ? t.matches.needsReschedule
                          : t.dashboard.playersCanSchedule))}
                  </p>
                </div>
              </AppCard>
            </Link>
          ) : (
            <AppCard className="border-neutral-200 bg-neutral-50 text-sm font-semibold text-neutral-500">
              No tienes próximo partido pendiente.
            </AppCard>
          )}
        </section>
      ) : null}
      {selectedLastMatch && !isSeasonClosed && !isSeasonUpcoming ? (
        <section>
          <SectionHeader
            title={
              effectiveLastMatchScope === "mine"
                ? "Mi último partido"
                : "Último partido"
            }
            action={
              shouldShowLastMatchScopeSwitch ? (
                <div className="flex rounded-full bg-neutral-100 p-0.5 text-[11px] font-black text-neutral-500">
                  <button
                    type="button"
                    onClick={() => setLastMatchScope("league")}
                    className={`rounded-full px-2.5 py-1 transition ${
                      effectiveLastMatchScope === "league"
                        ? "bg-white text-neutral-950 shadow-sm"
                        : "text-neutral-500"
                    }`}
                  >
                    Liga
                  </button>
                  <button
                    type="button"
                    onClick={() => setLastMatchScope("mine")}
                    className={`rounded-full px-2.5 py-1 transition ${
                      effectiveLastMatchScope === "mine"
                        ? "bg-white text-neutral-950 shadow-sm"
                        : "text-neutral-500"
                    }`}
                  >
                    Mío
                  </button>
                </div>
              ) : null
            }
          />

          <Link href={`/match/${selectedLastMatch.id}`} className="block">
            <AppCard className="relative border-neutral-300 bg-white p-2.5 transition active:scale-[0.99]">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="min-w-0 text-xs font-black uppercase tracking-wide text-neutral-500">
                  {t.matches.round} {selectedLastMatch.round}
                </p>

                <MatchStatusBadge
                  status={selectedLastMatch.status}
                  scheduledAt={selectedLastMatch.scheduledAt}
                  resultRecordedAt={selectedLastMatch.resultRecordedAt}
                />
              </div>

              {selectedLastMatchHasResult ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <TeamPlayers
                          playerIds={selectedLastMatch.teamA}
                          players={players}
                          highlightedPlayerIds={selectedLastMatchHighlightedPlayerIds}
                          highlightedPlayerLabel={matchPanelMvpLabel}
                          className="flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
                        />
                        <p className="min-w-6 text-right text-lg font-black">
                          {selectedLastMatch.pointsA}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <TeamPlayers
                          playerIds={selectedLastMatch.teamB}
                          players={players}
                          highlightedPlayerIds={selectedLastMatchHighlightedPlayerIds}
                          highlightedPlayerLabel={matchPanelMvpLabel}
                          className="flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
                        />
                        <p className="min-w-6 text-right text-lg font-black">
                          {selectedLastMatch.pointsB}
                        </p>
                      </div>
                    </div>

                    <ClickableChevron className="shrink-0" />
                  </div>

                  {selectedLastMatch.sets.length > 0 ? (
                    <div className="mt-2 flex gap-1.5 text-xs font-bold text-neutral-600">
                      {selectedLastMatch.sets.map((set, index) => (
                        <span
                          key={index}
                          className="rounded-md bg-neutral-100 px-1.5 py-0.5"
                        >
                          {set.a}-{set.b}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <TeamPlayers
                      playerIds={selectedLastMatch.teamA}
                      players={players}
                      highlightedPlayerIds={selectedLastMatchHighlightedPlayerIds}
                      highlightedPlayerLabel={matchPanelMvpLabel}
                      className="flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
                    />
                    <p className="text-[10px] font-black uppercase tracking-wide text-neutral-400">
                      {t.common.versus}
                    </p>
                    <TeamPlayers
                      playerIds={selectedLastMatch.teamB}
                      players={players}
                      highlightedPlayerIds={selectedLastMatchHighlightedPlayerIds}
                      highlightedPlayerLabel={matchPanelMvpLabel}
                      className="flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
                    />
                  </div>

                  <ClickableChevron className="shrink-0" />
                </div>
              )}

              {selectedLastMatchMetaText ? (
                <p className="mt-1.5 truncate text-[11px] font-semibold text-neutral-500">
                  {selectedLastMatchMetaText}
                </p>
              ) : null}
            </AppCard>
          </Link>
        </section>
      ) : null}

    </div>
  );
}
