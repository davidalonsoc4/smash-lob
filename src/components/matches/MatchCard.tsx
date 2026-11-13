"use client";

import { MatchOutcomeBadge } from "@/components/matches/MatchOutcomeBadge"

import Link from "next/link";
import { CalendarEventButton } from "@/components/calendar/CalendarEventButton";
import { MatchEventMeta } from "@/components/matches/MatchEventMeta";
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge";
import { MatchTeamsPanel } from "@/components/matches/MatchTeamsPanel";
import { MatchPreviewTeams } from "@/components/matches/MatchPreviewTeams";
import { getPlayerDisplayName } from "@/lib/players";
import { TeamPlayers } from "@/components/player/TeamPlayers";
import { AppCard } from "@/components/ui/AppCard";
import { ClickableChevron } from "@/components/ui/ClickableChevron";
import { useI18n } from "@/i18n/I18nProvider"
import { getIntlLocale } from "@/i18n/localeFormatting";
import {
  findLeagueLocationByScheduleLocation,
  getLeagueLocationCompactText,
  getScheduleLocationFallbackText,
  type LeagueLocation,
} from "@/lib/leagueLocations";
import type { PlayerProfile } from "@/data/fakeData";
import type { MatchSubstitution } from "@/lib/substitutes";
import { getMatchSubstituteLabels } from "@/lib/substitutes";
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
  isCurrentUserBallCustodian?: boolean;
  compactScheduleHint?: boolean;
  homePersonalResult?: boolean;
  featured?: boolean;
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
  isCurrentUserBallCustodian = false,
  compactScheduleHint = false,
  homePersonalResult = false,
  featured = false,
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

  const matchStatusNode = (
    <MatchStatusBadge
      variant="dot"
      status={match.status}
      isParticipant={!!currentUserId && [...match.teamA, ...match.teamB].includes(currentUserId)}
      scheduledAt={match.scheduledAt ?? null}
      resultRecordedAt={match.resultRecordedAt ?? null}
      coordinationStatus={match.coordinationStatus ?? null}
    />
  );
  const outcomeNode = currentUserOutcome ? (
    <MatchOutcomeBadge outcome={currentUserOutcome} />
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
    <div className="block">
      <AppCard className={`relative transition active:scale-[0.99] ${homePersonalResult && isFinished ? "home-personal-result !p-3" : ""} ${featured ? "match-preview-featured" : ""}`} >
        <Link href={`/match/${match.id}`} className="absolute inset-0 z-[1] rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2" aria-label={`${tx("Partido")} · ${tx("Jornada")} ${match.round}`} />
        <div data-match-card-header className="mb-2 flex items-start justify-between gap-3">
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
            {stackTeamPlayers && isFinished ? (
              <MatchPreviewTeams
                accented={featured}
                teamA={match.teamA.map(id => ({ id, name: getPlayerDisplayName(id, players), highlightedLabel: highlightedPlayerIds.includes(id) ? highlightedPlayerLabel : undefined, substituteLabel: substituteLabels[id] }))}
                teamB={match.teamB.map(id => ({ id, name: getPlayerDisplayName(id, players), highlightedLabel: highlightedPlayerIds.includes(id) ? highlightedPlayerLabel : undefined, substituteLabel: substituteLabels[id] }))}
                sets={match.sets}
                scores={{ a: teamScores.teamA, b: teamScores.teamB }}
              />
            ) : stackTeamPlayers ? (
              <MatchTeamsPanel
                teamA={match.teamA}
                teamB={match.teamB}
                players={players}
                substitutions={match.substitutions}
                highlightedPlayerIds={highlightedPlayerIds}
                highlightedPlayerLabel={highlightedPlayerLabel}
                mode={isFinished ? "rows" : "versus"}
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

          {homePersonalResult && isFinished ? null : stackTeamPlayers ? (
            !isFinished && !hasScheduleDetails && showMissingScheduleHint ? (
              <div data-match-schedule-hint className={`mt-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-2.5 py-2 ${compactScheduleHint ? "flex min-h-10 items-center justify-center text-center" : ""}`}>
                <p className="match-schedule-action flex w-full items-center justify-center gap-2 text-xs font-black text-neutral-800"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="h-4 w-4 shrink-0"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-6 4v4m-2-2h4"/></svg><span>{t.dashboard.addSchedule}</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0"><path d="m9 5 7 7-7 7"/></svg></p>
                {!compactScheduleHint ? <p className="mt-0.5 type-caption font-semibold text-neutral-500">
                  {tx("Coordínalo desde el chat")}
                </p> : null}
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
                action={featured && !isFinished && match.scheduledAt ? <CalendarEventButton event={{ description: `Smash & Lob · ${tx("Jornada")} ${match.round}`, uid: `${match.id}@smashandlob.com`, title: `${match.teamA.map(id => getPlayerDisplayName(id, players)).join(" / ")} vs ${match.teamB.map(id => getPlayerDisplayName(id, players)).join(" / ")}`, start: match.scheduledAt, location: metadataLocation }} className="match-preview-calendar relative z-10 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg focus-visible:outline-2" label={tx("Añadir al calendario")}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M8 2v4m8-4v4M3 10h18M14 17h6m-3-3v6M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /></svg></CalendarEventButton> : null}
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
          {isCurrentUserBallCustodian ? (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-900">
              {tx("Eres el encargado de las bolas.")}
            </p>
          ) : null}
        </div>
      </AppCard>
    </div>
  );
}
