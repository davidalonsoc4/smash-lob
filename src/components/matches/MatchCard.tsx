"use client";

import Link from "next/link";
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge";
import { TeamPlayers } from "@/components/player/TeamPlayers";
import { AppCard } from "@/components/ui/AppCard";
import { ClickableChevron } from "@/components/ui/ClickableChevron";
import { useI18n } from "@/i18n/I18nProvider";
import {
  findLeagueLocationByScheduleLocation,
  getLeagueLocationCompactText,
  getScheduleLocationFallbackText,
  type LeagueLocation,
} from "@/lib/leagueLocations";
import type { PlayerProfile } from "@/data/fakeData";

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
    dateLabel: string | null;
    location: string | null;
  };
  players?: PlayerProfile[];
  roundStartsAt: string | null;
  roundEndsAt: string | null;
  headerMode?: "round" | "match-date";
  highlightedPlayerIds?: string[];
  leagueLocations?: LeagueLocation[];
};

export function MatchCard({
  match,
  players = [],
  roundStartsAt,
  roundEndsAt,
  headerMode = "round",
  highlightedPlayerIds = [],
  leagueLocations = [],
}: MatchCardProps) {
  const { t } = useI18n();
  const isFinished = match.status === "finished";
  const isPostponed = match.status === "postponed";
  const hasRoundWindow = Boolean(roundStartsAt && roundEndsAt);

  const leagueLocation = findLeagueLocationByScheduleLocation({
    locations: leagueLocations,
    scheduleLocation: match.location,
  });
  const scheduleTitle = isPostponed
    ? t.matches.pendingReschedule
    : (match.dateLabel ?? t.matches.pendingDate);

  const scheduleDescription = isPostponed
    ? t.matches.needsReschedule
    : leagueLocation
      ? getLeagueLocationCompactText(leagueLocation)
      : (getScheduleLocationFallbackText(match.location) ??
        t.matches.missingSchedule);

  function getPlayedDateLabel() {
    if (!match.scheduledAt) {
      return match.dateLabel ?? t.matches.played;
    }

    const playedAt = new Date(match.scheduledAt);

    if (Number.isNaN(playedAt.getTime())) {
      return match.dateLabel ?? t.matches.played;
    }

    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
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

  return (
    <Link href={`/match/${match.id}`} className="block">
      <AppCard className="relative transition active:scale-[0.99]">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="min-w-0 text-sm font-semibold text-neutral-500">
            {headerText}
          </p>

          <MatchStatusBadge status={match.status} />
        </div>

        <ClickableChevron className="absolute right-3 top-1/2 -translate-y-1/2" />

        <div className="pr-11">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <TeamPlayers
                playerIds={match.teamA}
                players={players}
                highlightedPlayerIds={highlightedPlayerIds}
                className="flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
              />

              {isFinished ? (
                <p className="min-w-6 text-right text-lg font-black">
                  {match.pointsA}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3">
              <TeamPlayers
                playerIds={match.teamB}
                players={players}
                highlightedPlayerIds={highlightedPlayerIds}
                className="flex min-w-0 flex-wrap gap-x-1 gap-y-0.5 text-sm font-black"
              />

              {isFinished ? (
                <p className="min-w-6 text-right text-lg font-black">
                  {match.pointsB}
                </p>
              ) : null}
            </div>
          </div>

          {isFinished ? (
            <div className="mt-2 flex gap-1.5 text-xs font-bold text-neutral-600">
              {match.sets.map((set, index) => (
                <span
                  key={index}
                  className="rounded-md bg-neutral-100 px-1.5 py-0.5"
                >
                  {set.a}-{set.b}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-2.5 py-2">
              <p className="text-xs font-black text-neutral-800">
                {scheduleTitle}
              </p>

              <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
                {scheduleDescription}
              </p>
            </div>
          )}

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
