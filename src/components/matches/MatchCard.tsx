"use client";

import Link from "next/link";
import { MatchEventMeta } from "@/components/matches/MatchEventMeta";
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge";
import { MatchTeamsPanel } from "@/components/matches/MatchTeamsPanel";
import { SetGameScore } from "@/components/matches/SetGameScore";
import { TeamPlayers } from "@/components/player/TeamPlayers";
import { AppCard } from "@/components/ui/AppCard";
import { ClickableChevron } from "@/components/ui/ClickableChevron";
import { useI18n } from "@/i18n/I18nProvider"
import { getIntlLocale } from "@/i18n/leagueText";
import {
  findLeagueLocationByScheduleLocation,
  getLeagueLocationCompactText,
  getScheduleLocationFallbackText,
  type LeagueLocation,
} from "@/lib/leagueLocations";
import type { PlayerProfile } from "@/data/fakeData";
import type { MatchSubstitution } from "@/lib/substitutes";
import { getMatchSubstituteLabels } from "@/lib/substitutes";
import { getBadgeClassName } from "@/lib/statusStyles";
import {
  getCurrentUserMatchOutcome,
  getMatchTeamScores,
} from "@/lib/matchPresentation";

type MatchCardProps = {
  match: {
    id: string;
    round: number;
    status: string;
    teamA: string[];
    teamB: string[];
    pointsA: number | null;
    pointsB: number | null;
    sets: { a: number; b: number }[];
    scheduledAt?: string | null;
    resultRecordedAt?: string | null;
    coordinationStatus?: "coordinating" | "awaiting_booking" | null;
    dateLabel: string | null;
    location: string | null;
    substitutions?: MatchSubstitution[];
  };
  players?: PlayerProfile[];
  roundStartsAt: string | null;
  roundEndsAt: string | null;
  headerMode?: "round" | "match-date";
  highlightedPlayerIds?: string[];
  highlightedPlayerLabel?: string;
  leagueLocations?: LeagueLocation[];
  showMissingScheduleHint?: boolean;
  stackTeamPlayers?: boolean;
  currentUserId?: string | null;
  headerLeftLabel?: string | null;
  headerRightLabel?: string | null;
  showChevron?: boolean;
  statusPosition?: "auto" | "left" | "right";
  hideMissingScheduleMeta?: boolean;
};
export function MatchCard({
  match,
  players = [],
  roundStartsAt,
  roundEndsAt,
  headerMode = "round",
  highlightedPlayerIds = [],
  highlightedPlayerLabel = "MVP de jornada",
  leagueLocations = [],
  showMissingScheduleHint = true,
  stackTeamPlayers = false,
  currentUserId = null,
  headerLeftLabel = null,
  headerRightLabel = null,
  showChevron = false,
  statusPosition = "auto",
  hideMissingScheduleMeta = false,
}: MatchCardProps) {
  const { tx, t, locale } = useI18n();
  const substituteLabels = getMatchSubstituteLabels({
    substitutions: match.substitutions,
    players,
  });
  const isFinished = match.status === "finished";
  const isPostponed = match.status === "postponed";
  const hasRoundWindow = Boolean(roundStartsAt && roundEndsAt);
  const teamScores = getMatchTeamScores(match);
  const currentUserOutcome = getCurrentUserMatchOutcome(match, currentUserId);

  const leagueLocation = findLeagueLocationByScheduleLocation({
    locations: leagueLocations,
    scheduleLocation: match.location,
  });
  const hasScheduleDetails = Boolean(
    match.scheduledAt || match.dateLabel || match.location,
  );
  const shouldShowScheduleDetails = Boolean(
    !isFinished && (isPostponed || hasScheduleDetails || showMissingScheduleHint),
  );
  const scheduleTitle = isPostponed
    ? t.matches.pendingReschedule
    : match.dateLabel
      ? match.dateLabel
      : showMissingScheduleHint
        ? t.dashboard.addSchedule
        : t.matches.pendingDate;

  const scheduleDescription = isPostponed
    ? t.matches.needsReschedule
    : leagueLocation
      ? getLeagueLocationCompactText(leagueLocation)
      : (getScheduleLocationFallbackText(match.location) ??
        (showMissingScheduleHint
          ? t.dashboard.playersCanSchedule
          : t.matches.missingSchedule));

  const metadataLocation = leagueLocation
    ? getLeagueLocationCompactText(leagueLocation)
    : getScheduleLocationFallbackText(match.location);
  const metadataDateFallback = isPostponed
    ? t.matches.pendingReschedule
    : match.dateLabel ?? t.matches.pendingDate;
  const metadataLocationFallback = isPostponed
    ? t.matches.needsReschedule
    : t.matches.missingSchedule;

  function getPlayedDateLabel() {
    if (!match.scheduledAt) {
      return match.dateLabel ?? t.matches.played;
    }

    const playedAt = new Date(match.scheduledAt);

    if (Number.isNaN(playedAt.getTime())) {
      return match.dateLabel ?? t.matches.played;
    }

    return new Intl.DateTimeFormat(getIntlLocale(locale), {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(playedAt);
  }

  const headerText =
    headerMode === "round"
      ? `${t.matches.round} ${match.round}`
      : isFinished
        ? getPlayedDateLabel()
        : t.matches.pendingPlay;

  const teamATrailing = isFinished ? (
    <div className="flex shrink-0 items-center gap-1 self-center">
      <div className="flex items-center gap-1" aria-label={tx("Juegos por set de la pareja A")}>
        {match.sets.map((set, index) => (
          <SetGameScore key={index} value={set.a} won={set.a > set.b} />
        ))}
      </div>
      <span className="ml-1 flex min-w-8 items-center justify-center rounded-md border border-neutral-200 bg-white px-2 py-1 text-base font-black text-neutral-900 shadow-sm">
        {teamScores.teamA}
      </span>
    </div>
  ) : null;

  const teamBTrailing = isFinished ? (
    <div className="flex shrink-0 items-center gap-1 self-center">
      <div className="flex items-center gap-1" aria-label={tx("Juegos por set de la pareja B")}>
        {match.sets.map((set, index) => (
          <SetGameScore key={index} value={set.b} won={set.b > set.a} />
        ))}
      </div>
      <span className="ml-1 flex min-w-8 items-center justify-center rounded-md border border-neutral-200 bg-white px-2 py-1 text-base font-black text-neutral-900 shadow-sm">
        {teamScores.teamB}
      </span>
    </div>
  ) : null;

  const matchStatusNode = (
    <MatchStatusBadge
      status={match.status}
      scheduledAt={match.scheduledAt ?? null}
      resultRecordedAt={match.resultRecordedAt ?? null}
      coordinationStatus={match.coordinationStatus ?? null}
    />
  );
  const outcomeNode = currentUserOutcome ? (
    <p
      className={getBadgeClassName(
        currentUserOutcome === "victory" ? "green" : "red",
        "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 type-caption font-medium uppercase tracking-wide leading-none",
      )}
    >
      {currentUserOutcome === "victory" ? t.matches.victory : t.matches.defeat}
    </p>
  ) : null;
  const statusNode = outcomeNode ?? matchStatusNode;

  const effectiveHeaderLeft =
    headerLeftLabel ??
    (headerRightLabel
      ? null
      : stackTeamPlayers
        ? null
        : headerText);


  return (
    <Link href={`/match/${match.id}`} className="block">
      <AppCard className="relative transition active:scale-[0.99]">
        <div className="mb-2 flex items-center justify-between gap-3">
          {statusPosition === "left" ? (
            <div>{matchStatusNode}</div>
          ) : effectiveHeaderLeft ? (
            <p className="min-w-0 truncate type-caption font-black uppercase tracking-[0.12em] text-neutral-500">
              {effectiveHeaderLeft}
            </p>
          ) : headerRightLabel ? (
            <div>{statusNode}</div>
          ) : (
            <span />
          )}

          {statusPosition === "left" ? (
            outcomeNode ? <div className="ml-auto text-right">{outcomeNode}</div> : <span />
          ) : statusPosition === "right" ? (
            <div className="ml-auto text-right">{statusNode}</div>
          ) : headerRightLabel ? (
            <p className="shrink-0 type-caption font-black uppercase tracking-[0.12em] text-neutral-500">
              {headerRightLabel}
            </p>
          ) : headerLeftLabel && !currentUserOutcome ? (
            <span />
          ) : (
            <div className="ml-auto text-right">{statusNode}</div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-3">
            {stackTeamPlayers ? (
              <MatchTeamsPanel
                teamA={match.teamA}
                teamB={match.teamB}
                players={players}
                substitutions={match.substitutions}
                highlightedPlayerIds={highlightedPlayerIds}
                highlightedPlayerLabel={highlightedPlayerLabel}
                mode={isFinished ? "rows" : "versus"}
                teamATrailing={teamATrailing}
                teamBTrailing={teamBTrailing}
                linkPlayers={false}
              />
            ) : (
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <TeamPlayers
                    playerIds={match.teamA}
                    players={players}
                    highlightedPlayerIds={highlightedPlayerIds}
                    highlightedPlayerLabel={highlightedPlayerLabel}
                    substituteLabels={substituteLabels}
                    linkPlayers={false}
                    className="type-player-name flex min-w-0 flex-wrap gap-x-1 gap-y-0.5"
                  />
                  {isFinished ? (
                    <p className="min-w-6 self-center text-right text-lg font-black">
                      {match.pointsA}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <TeamPlayers
                    playerIds={match.teamB}
                    players={players}
                    highlightedPlayerIds={highlightedPlayerIds}
                    highlightedPlayerLabel={highlightedPlayerLabel}
                    substituteLabels={substituteLabels}
                    linkPlayers={false}
                    className="type-player-name flex min-w-0 flex-wrap gap-x-1 gap-y-0.5"
                  />
                  {isFinished ? (
                    <p className="min-w-6 self-center text-right text-lg font-black">
                      {match.pointsB}
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            {showChevron ? <ClickableChevron className="shrink-0" /> : null}
          </div>

          {stackTeamPlayers ? (
            !isFinished && !hasScheduleDetails && showMissingScheduleHint ? (
              <div className="mt-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-2.5 py-2">
                <p className="text-xs font-black text-neutral-800">{t.dashboard.addSchedule}</p>
                <p className="mt-0.5 type-caption font-semibold text-neutral-500">
                  {t.dashboard.playersCanSchedule}
                </p>
              </div>
            ) : (
              <MatchEventMeta
                eventAt={match.scheduledAt ?? null}
                dateFallback={
                  hideMissingScheduleMeta && !isPostponed
                    ? match.dateLabel
                    : metadataDateFallback
                }
                locationText={metadataLocation}
                locationFallback={
                  hideMissingScheduleMeta && !isPostponed
                    ? null
                    : metadataLocationFallback
                }
                hideMissingRows={hideMissingScheduleMeta}
              />
            )
          ) : isFinished ? (
            <div className="mt-2 flex gap-1.5 text-xs font-bold text-neutral-600">
              {match.sets.map((set, index) => (
                <span key={index} className="rounded-md bg-neutral-100 px-1.5 py-0.5">
                  {set.a}-{set.b}
                </span>
              ))}
            </div>
          ) : shouldShowScheduleDetails ? (
            <div className="mt-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-2.5 py-2">
              <p className="text-xs font-black text-neutral-800">{scheduleTitle}</p>
              <p className="mt-0.5 type-caption font-semibold text-neutral-500">
                {scheduleDescription}
              </p>
            </div>
          ) : null}

          {isPostponed && hasRoundWindow ? (
            <div className="mt-2 rounded-lg bg-orange-100 px-2.5 py-2 text-xs font-semibold text-orange-900">
              {t.rounds.postponedWindowWarning}
            </div>
          ) : null}
        </div>
      </AppCard>
    </Link>
  );
}
