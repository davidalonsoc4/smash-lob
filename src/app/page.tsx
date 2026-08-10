"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { LeagueLogo } from "@/components/league/LeagueLogo";
import { SeasonContextLine } from "@/components/layout/SeasonContextLine";
import { LeagueAnnouncementsCard } from "@/components/announcements/LeagueAnnouncementsCard";
import { MatchCard } from "@/components/matches/MatchCard";
import { DashboardMvpCard } from "@/components/mvp/DashboardMvpCard";
import { PlayerAvatar } from "@/components/player/PlayerAvatar";
import { SeasonRegistrationPanel } from "@/components/season/SeasonRegistrationPanel";
import { SeasonRosterWaitingRoom } from "@/components/season/SeasonRosterWaitingRoom";
import { AppCard } from "@/components/ui/AppCard";
import { ClickableChevron } from "@/components/ui/ClickableChevron";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useCurrentUser } from "@/context/CurrentUserProvider";
import { useSeasonSettings } from "@/context/SeasonSettingsProvider";
import { useLeagueAccess } from "@/context/LeagueAccessProvider";
import { useMvp } from "@/context/MvpProvider";
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData";
import { useMatchData, type MatchData } from "@/context/MatchDataProvider";
import { useI18n } from "@/i18n/I18nProvider";
import {
  getMatchMvpSelection,
  getRoundMvpPlayerIds,
  getSeasonMvpSelection,
  getPlayersByIds,
} from "@/lib/mvp";
import { recordActivityEvent } from "@/lib/activity";
import { formatMoney } from "@/lib/courtBooking";
import { getNextMatch } from "@/lib/leagues";
import { getMatchDisplayStatus } from "@/lib/matchLifecycle";
import { parseMatchScheduleDate } from "@/lib/matchScheduleTime";
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

function CrownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="m4 7 4.2 4L12 5l3.8 6L20 7l-1.2 10H5.2L4 7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 20h12"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <rect
        x="3.5"
        y="5.5"
        width="17"
        height="15"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 3.5v4M16 3.5v4M3.5 10h17"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
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

function SeasonSummaryAwardRow({
  label,
  players,
  badge,
  href,
  meta,
  tone,
}: {
  label: string;
  players: AwardPlayer[];
  badge: string;
  href?: string;
  meta?: string;
  tone: "winner" | "mvp";
}) {
  const firstPlayer = players[0];

  if (!firstPlayer) {
    return null;
  }

  const toneClasses =
    tone === "winner"
      ? "border-amber-200 bg-gradient-to-b from-amber-50 to-white"
      : "border-violet-200 bg-gradient-to-b from-violet-50 to-white";
  const badgeClasses =
    tone === "winner"
      ? "bg-amber-100 text-amber-800 ring-amber-200"
      : "bg-violet-100 text-violet-800 ring-violet-200";

  const content = (
    <div className={`flex h-full flex-col items-center rounded-2xl border px-2.5 py-3 text-center shadow-[0_1px_6px_rgba(15,23,42,0.04)] ${toneClasses}`}>
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full text-base font-black ring-1 ${badgeClasses}`}
        aria-hidden="true"
      >
        {badge}
      </div>
      <p className="mt-1.5 type-caption font-black uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </p>
      <div className="mt-2 flex justify-center -space-x-2">
        {players.slice(0, 3).map((player) => (
          <PlayerAvatar
            key={player.id}
            player={player}
            size="lg"
            className="border-2 border-white shadow-sm"
          />
        ))}
      </div>
      <p className="mt-2 type-player-name-prominent font-black text-neutral-950 [overflow-wrap:anywhere]">
        {players.map((player) => player.displayName).join(" / ")}
      </p>
      {meta ? (
        <p className="mt-1 type-caption font-bold text-neutral-500">{meta}</p>
      ) : null}
      {href ? <ClickableChevron className="mt-2" /> : null}
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full transition active:scale-[0.99]">
      {content}
    </Link>
  ) : (
    content
  );
}

export default function Home() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const { hydrateSeasonSnapshot, startSeason, updateSeasonRoundSettings } =
    useSeasonSettings();
  const { replaceSeasonMatches } = useMatchData();
  const [isStartingSeason, setIsStartingSeason] = useState(false);
  const [startSeasonError, setStartSeasonError] = useState<string | null>(null);
  const [isSendingRegistrationReminder, setIsSendingRegistrationReminder] = useState(false);
  const [nextMatchScope, setNextMatchScope] = useState<"league" | "mine">("league");
  const [lastMatchScope, setLastMatchScope] = useState<"league" | "mine">("league");
  const { currentUserId, currentUser } = useCurrentUser();
  const { isLeagueAdmin, isLeagueSpectator } = useLeagueAccess();
  const { votes } = useMvp();
  const {
    activeLeague,
    activeSeason,
    roundSettings,
    players,
    rankingPlayers: seasonRankingPlayers,
    matches,
    rounds,
  } = useCurrentLeagueData();

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
  const selectedNextMatchRound = selectedNextMatch
    ? rounds.find((round) => round.round === selectedNextMatch.round)
    : null;
  const selectedLastMatchRound = selectedLastMatch
    ? rounds.find((round) => round.round === selectedLastMatch.round)
    : null;
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
    playerIds: seasonRankingPlayers.map((player) => player.id),
    settledPlayerIds: automaticallySettledRegistrationPlayerIds,
  });
  const isSelfRegistrationSeason =
    roundSettings.rosterMode === "self_registration";
  const isRosterComplete =
    !isSelfRegistrationSeason ||
    (Boolean(roundSettings.playerCapacity) &&
      seasonRankingPlayers.length === roundSettings.playerCapacity);
  const canStartUpcomingSeason = isRegistrationSettled && isRosterComplete;

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
      playerIds: seasonRankingPlayers.map((player) => player.id),
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
      playerIds: seasonRankingPlayers.map((player) => player.id),
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

  const rankingPlayers = [...seasonRankingPlayers].sort((a, b) => {
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

    if (!isRosterComplete) {
      setStartSeasonError(t.roster.startIncompleteError);
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
        const result = await startSupabaseExistingSeason({
          leagueId: activeLeague.id,
          seasonId: activeSeason.id,
        });

        hydrateSeasonSnapshot(result.snapshot);
        if (result.matches.length > 0) {
          replaceSeasonMatches(activeSeason.id, result.matches);
        }
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
      <header data-tour="home-header">
        <div className="app-home-identity">
          <LeagueLogo league={activeLeague} size="xl" className="app-home-top-logo" previewable />
          <div className="app-home-identity-copy min-w-0 pb-0.5">
            <h1 className="type-page-title text-2xl font-black leading-tight tracking-tight">
              {activeLeague.name}
            </h1>
            <SeasonContextLine
              seasonName={activeSeason.name}
              statusLabel={
                activeSeason.status === "finished"
                  ? t.common.finishedSeasonBadge
                  : activeSeason.status === "upcoming"
                    ? t.rounds.statusUpcoming
                    : t.rounds.statusActive
              }
              className="mt-0.5"
            />
          </div>
        </div>
      </header>

      {spectatorMode ? (
        <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-xs font-semibold text-neutral-600 shadow-sm">
          <span className="font-black text-neutral-950">Vista de espectador</span> · Solo lectura
        </div>
      ) : null}

      <div data-tour="home-announcements"><LeagueAnnouncementsCard leagueId={activeLeague.id} /></div>


      {activeLeague.recommendations?.trim() ? (
        <AppCard>
          <p className="type-caption font-black uppercase tracking-[0.18em] text-neutral-400">
            Recomendaciones de la liga
          </p>
          <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-neutral-700">
            {activeLeague.recommendations.trim()}
          </p>
        </AppCard>
      ) : null}

      {isSeasonUpcoming ? (
        <AppCard className="border border-neutral-200 bg-neutral-50/80 p-3">
          <p className="type-panel-title font-black text-neutral-950">
            Próxima temporada
          </p>
          <p className="mt-0.5 type-caption font-semibold text-neutral-500">
            Inicio pendiente · {seasonRankingPlayers.length} jugadores
          </p>

          {isSelfRegistrationSeason ? (
            <div className="mt-3">
              <SeasonRosterWaitingRoom
                leagueId={activeLeague.id}
                seasonId={activeSeason.id}
              />
            </div>
          ) : null}

          {canManageSeason ? (
            <>
              <button
                type="button"
                onClick={handleStartUpcomingSeason}
                disabled={isStartingSeason || !canStartUpcomingSeason}
                className="mt-3 block w-full rounded-xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white disabled:bg-neutral-300"
              >
                {isStartingSeason ? "Comenzando..." : "Comenzar temporada"}
              </button>

              {!isRosterComplete ? (
                <p className="mt-2 text-center text-xs font-semibold text-amber-700">
                  {t.roster.startIncompleteHint}
                </p>
              ) : !isRegistrationSettled ? (
                <p className="mt-2 text-center text-xs font-semibold text-amber-700">
                  La temporada no puede comenzar hasta saldar todas las inscripciones.
                </p>
              ) : null}

              {startSeasonError ? (
                <p className="mt-2 text-center text-sm font-semibold text-red-600">
                  {startSeasonError}
                </p>
              ) : null}
            </>
          ) : null}
        </AppCard>
      ) : null}

      {isSeasonClosed ? (
        <div className="space-y-2">
          <AppCard data-tour="home-season-summary" className="overflow-hidden p-0">
            <div className="px-3 pt-3">
              <p className="type-panel-title font-black text-neutral-950">
                {t.profile.seasonSummary}
              </p>
            </div>

            {leader ? (
              <div className={`grid gap-2 px-3 pb-3 pt-2 ${seasonMvp ? "grid-cols-2" : "grid-cols-1"}`}>
                <SeasonSummaryAwardRow
                  label={t.dashboard.winner}
                  players={[leader]}
                  badge="🏆"
                  tone="winner"
                  href={`/player/${leader.slug ?? leader.id}`}
                  meta={`${leader.points} ${t.common.pointsShort}`}
                />
                {seasonMvp ? (
                  <SeasonSummaryAwardRow
                    label="MVP"
                    players={seasonMvpPlayers}
                    badge="★"
                    tone="mvp"
                    href={
                      seasonMvpPlayers[0]
                        ? `/player/${seasonMvpPlayers[0].slug ?? seasonMvpPlayers[0].id}/mvp`
                        : undefined
                    }
                    meta={`${seasonMvp.votes} MVPs`}
                  />
                ) : null}
              </div>
            ) : (
              <p className="px-3 pb-3 pt-2 text-sm font-semibold text-neutral-500">
                {t.dashboard.closedSeasonTitle}
              </p>
            )}

            <div data-tour="home-season-actions" className="grid grid-cols-2 gap-2 border-t border-neutral-100 p-3">
              <Link
                href={`/statistics?season=${encodeURIComponent(activeSeason.id)}`}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-center text-xs font-black text-neutral-950 transition active:scale-[0.99]"
              >
                {t.dashboard.historyAndStatistics}
              </Link>
              <Link
                href={`/statistics/season?season=${encodeURIComponent(activeSeason.id)}#compartir-resumen-temporada`}
                className="rounded-xl bg-neutral-950 px-3 py-2.5 text-center text-xs font-black text-white transition active:scale-[0.99]"
              >
                {t.dashboard.shareSeasonSummary}
              </Link>
            </div>
          </AppCard>

          {canManageSeason ? (
            <Link
              href="/admin/season"
              className="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-center text-sm font-black text-neutral-950 shadow-[0_1px_6px_rgba(15,23,42,0.035)] transition active:scale-[0.99]"
            >
              {t.dashboard.createSeason}
            </Link>
          ) : null}
        </div>
      ) : null}

      {!isSeasonClosed && !isSeasonUpcoming ? (
        <div className="grid grid-cols-2 gap-3">
          <AppCard className="p-3">
            <div className="flex items-center gap-1.5 text-neutral-500">
              <span aria-hidden="true">
                <CrownIcon />
              </span>
              <p className="text-xs font-semibold">{t.dashboard.leader}</p>
            </div>
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
            <p className="mt-1 truncate type-caption font-medium text-neutral-500">
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
                icon={<CalendarIcon />}
              />
            </Link>
          ) : (
            <StatCard
              label={t.dashboard.rounds}
              value="-"
              helper={t.dashboard.regularLeague}
              icon={<CalendarIcon />}
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
          players={seasonRankingPlayers}
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
                  <ClickableChevron className="shrink-0 border-amber-200 bg-amber-100 text-amber-900" />
                </Link>
              ))}
            </div>
          </AppCard>
        </section>
      ) : null}

      {!isSeasonUpcoming ? (
        <section>
          <AppCard className="overflow-hidden p-0">
            <div className="px-3 pt-3">
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
            </div>

            <div className="space-y-3 border-t border-neutral-100 px-3 py-2.5">
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
        <section data-tour="home-next-match">
          <SectionHeader
            title={
              effectiveNextMatchScope === "mine"
                ? "Mi próximo partido"
                : "Próximo partido"
            }
            action={
              shouldShowNextMatchScopeSwitch ? (
                <div className="flex rounded-full bg-neutral-100 p-0.5 type-caption font-black text-neutral-600">
                  <button
                    type="button"
                    onClick={() => setNextMatchScope("league")}
                    className={`rounded-full px-2.5 py-1 transition ${
                      effectiveNextMatchScope === "league"
                        ? "bg-white text-neutral-950 shadow-sm"
                        : "text-neutral-600"
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
                        : "text-neutral-600"
                    }`}
                  >
                    Mío
                  </button>
                </div>
              ) : null
            }
          />

          {selectedNextMatch ? (
            <MatchCard
              match={selectedNextMatch}
              players={players}
              roundStartsAt={selectedNextMatchRound?.startsAt ?? null}
              roundEndsAt={selectedNextMatchRound?.endsAt ?? null}
              headerMode="match-date"
              headerLeftLabel={`Jornada ${selectedNextMatch.round}`}
              statusPosition="right"
              stackTeamPlayers
              currentUserId={currentUserId}
              highlightedPlayerIds={selectedNextMatchHighlightedPlayerIds}
              highlightedPlayerLabel={matchPanelMvpLabel}
              leagueLocations={activeLeague.locations}
              showMissingScheduleHint
            />
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
                <div className="flex rounded-full bg-neutral-100 p-0.5 type-caption font-black text-neutral-600">
                  <button
                    type="button"
                    onClick={() => setLastMatchScope("league")}
                    className={`rounded-full px-2.5 py-1 transition ${
                      effectiveLastMatchScope === "league"
                        ? "bg-white text-neutral-950 shadow-sm"
                        : "text-neutral-600"
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
                        : "text-neutral-600"
                    }`}
                  >
                    Mío
                  </button>
                </div>
              ) : null
            }
          />

          <MatchCard
            match={selectedLastMatch}
            players={players}
            roundStartsAt={selectedLastMatchRound?.startsAt ?? null}
            roundEndsAt={selectedLastMatchRound?.endsAt ?? null}
            headerMode="match-date"
            headerLeftLabel={`Jornada ${selectedLastMatch.round}`}
            statusPosition="right"
            stackTeamPlayers
            currentUserId={currentUserId}
            highlightedPlayerIds={selectedLastMatchHighlightedPlayerIds}
            highlightedPlayerLabel={matchPanelMvpLabel}
            leagueLocations={activeLeague.locations}
          />
        </section>
      ) : null}

    </div>
  );
}
