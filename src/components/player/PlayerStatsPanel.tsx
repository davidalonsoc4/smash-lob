"use client";

import { formatBestWinStreakRoundRange } from "@/lib/playerStreak"
import Link from "next/link";
import { AppCard } from "@/components/ui/AppCard";
import { useI18n } from "@/i18n/I18nProvider";
import { getPlayerMvpSummary, type MvpSystem, type MvpVote } from "@/lib/mvp";

type PlayerStatsPanelProps = {
  playerId: string;
  leagueId: string;
  seasonId: string;
  seasonIds?: string[];
  scopeLabel?: string;
  players: PlayerStatsPlayer[];
  matches: PlayerStatsMatch[];
  seasonMatches?: PlayerStatsMatch[];
  votes?: MvpVote[];
  mvpSystem?: MvpSystem;
  mvpSystemBySeasonId?: Record<string, MvpSystem>;
};

type PlayerStatsPlayer = {
  id: string;
  slug?: string;
  displayName: string;
};

type PlayerStatsMatch = {
  id: string;
  leagueId: string;
  seasonId: string;
  round: number;
  status: string;
  teamA: string[];
  teamB: string[];
  pointsA: number | null;
  pointsB: number | null;
  sets: { a: number; b: number }[];
  resultCounts?: boolean;
};

type PlayerRelationStats = {
  playerId: string;
  matches: number;
  wins: number;
  setsFor: number;
  setsAgainst: number;
  gamesFor: number;
  gamesAgainst: number;
};

function getTeamSetPoints(match: PlayerStatsMatch, team: "A" | "B") {
  if (team === "A" && match.pointsA !== null) {
    return match.pointsA;
  }

  if (team === "B" && match.pointsB !== null) {
    return match.pointsB;
  }

  return match.sets.filter((set) =>
    team === "A" ? set.a > set.b : set.b > set.a,
  ).length;
}

function getTeamGames(match: PlayerStatsMatch, team: "A" | "B") {
  return match.sets.reduce(
    (total, set) => total + (team === "A" ? set.a : set.b),
    0,
  );
}

function isValidStatisticsMatch(match: PlayerStatsMatch) {
  if (
    match.status !== "finished" ||
    match.resultCounts === false ||
    match.sets.length === 0
  ) {
    return false;
  }

  return getTeamSetPoints(match, "A") !== getTeamSetPoints(match, "B");
}

function getStrongestTeammate(
  relationStats: Map<string, PlayerRelationStats>,
) {
  return Array.from(relationStats.values()).sort((a, b) => {
    const setsDiffA = a.setsFor - a.setsAgainst;
    const setsDiffB = b.setsFor - b.setsAgainst;
    const gamesDiffA = a.gamesFor - a.gamesAgainst;
    const gamesDiffB = b.gamesFor - b.gamesAgainst;

    if (setsDiffB !== setsDiffA) return setsDiffB - setsDiffA;
    if (gamesDiffB !== gamesDiffA) return gamesDiffB - gamesDiffA;
    return a.playerId.localeCompare(b.playerId);
  })[0];
}

function getToughestRival(relationStats: Map<string, PlayerRelationStats>) {
  return Array.from(relationStats.values()).sort((a, b) => {
    const diffA = a.gamesFor - a.gamesAgainst;
    const diffB = b.gamesFor - b.gamesAgainst;

    if (diffA !== diffB) return diffA - diffB;
    if (b.gamesAgainst !== a.gamesAgainst)
      return b.gamesAgainst - a.gamesAgainst;
    if (b.matches !== a.matches) return b.matches - a.matches;
    return a.playerId.localeCompare(b.playerId);
  })[0];
}

function getMostBeatenRival(relationStats: Map<string, PlayerRelationStats>) {
  return Array.from(relationStats.values())
    .filter((row) => row.wins > 0)
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.matches !== a.matches) return b.matches - a.matches;
      return b.gamesFor - b.gamesAgainst - (a.gamesFor - a.gamesAgainst);
    })[0];
}

function getMostLostRival(relationStats: Map<string, PlayerRelationStats>) {
  return Array.from(relationStats.values())
    .filter((row) => row.matches - row.wins > 0)
    .sort((a, b) => {
      const lossesA = a.matches - a.wins;
      const lossesB = b.matches - b.wins;
      if (lossesB !== lossesA) return lossesB - lossesA;
      if (b.matches !== a.matches) return b.matches - a.matches;
      return a.gamesFor - a.gamesAgainst - (b.gamesFor - b.gamesAgainst);
    })[0];
}

function upsertRelation(
  relationStats: Map<string, PlayerRelationStats>,
  playerId: string,
  won: boolean,
  setsFor: number,
  setsAgainst: number,
  gamesFor: number,
  gamesAgainst: number,
) {
  const current = relationStats.get(playerId) ?? {
    playerId,
    matches: 0,
    wins: 0,
    setsFor: 0,
    setsAgainst: 0,
    gamesFor: 0,
    gamesAgainst: 0,
  };

  current.matches += 1;
  current.setsFor += setsFor;
  current.setsAgainst += setsAgainst;
  current.gamesFor += gamesFor;
  current.gamesAgainst += gamesAgainst;

  if (won) {
    current.wins += 1;
  }

  relationStats.set(playerId, current);
}

function formatPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${Math.round(value)}%`;
}

function formatSignedNumber(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}

function getPlayer(playerId: string, players: PlayerStatsPlayer[]) {
  return players.find((player) => player.id === playerId) ?? null;
}

function getDisplayName(playerId: string, players: PlayerStatsPlayer[]) {
  return getPlayer(playerId, players)?.displayName ?? playerId;
}

function getPlayerHref(playerId: string, players: PlayerStatsPlayer[]) {
  const player = getPlayer(playerId, players);

  return `/player/${player?.slug ?? playerId}`;
}

export function PlayerStatsPanel({
  playerId,
  leagueId,
  seasonId,
  seasonIds,
  scopeLabel,
  players,
  matches,
  seasonMatches = matches,
  votes = [],
  mvpSystem = "automatic",
  mvpSystemBySeasonId,
}: PlayerStatsPanelProps) {
  const { tx } = useI18n()
  const { t } = useI18n();
  const finishedMatches = matches.filter(
    (match) =>
      isValidStatisticsMatch(match) &&
      (match.teamA.includes(playerId) || match.teamB.includes(playerId)),
  );

  const teammateStats = new Map<string, PlayerRelationStats>();
  const rivalStats = new Map<string, PlayerRelationStats>();
  let setsFor = 0;
  let setsAgainst = 0;
  let gamesFor = 0;
  let gamesAgainst = 0;
  let wins = 0;
  let losses = 0;
  let bestMatch: { seasonId: string; round: number; diff: number } | null =
    null;
  let toughestMatch: { seasonId: string; round: number; diff: number } | null =
    null;

  for (const match of finishedMatches) {
    const isTeamA = match.teamA.includes(playerId);
    const ownTeam = isTeamA ? match.teamA : match.teamB;
    const opponentTeam = isTeamA ? match.teamB : match.teamA;
    const ownSets = getTeamSetPoints(match, isTeamA ? "A" : "B");
    const opponentSets = getTeamSetPoints(match, isTeamA ? "B" : "A");
    const ownGames = getTeamGames(match, isTeamA ? "A" : "B");
    const opponentGames = getTeamGames(match, isTeamA ? "B" : "A");
    const won = ownSets > opponentSets;
    const gamesDiff = ownGames - opponentGames;

    setsFor += ownSets;
    setsAgainst += opponentSets;
    gamesFor += ownGames;
    gamesAgainst += opponentGames;

    if (won) {
      wins += 1;
    } else {
      losses += 1;
    }

    ownTeam
      .filter((teammateId) => teammateId !== playerId)
      .forEach((teammateId) =>
        upsertRelation(
          teammateStats,
          teammateId,
          won,
          ownSets,
          opponentSets,
          ownGames,
          opponentGames,
        ),
      );

    opponentTeam.forEach((opponentId) =>
      upsertRelation(
        rivalStats,
        opponentId,
        won,
        ownSets,
        opponentSets,
        ownGames,
        opponentGames,
      ),
    );

    if (!bestMatch || gamesDiff > bestMatch.diff) {
      bestMatch = {
        seasonId: match.seasonId,
        round: match.round,
        diff: gamesDiff,
      };
    }

    if (!toughestMatch || gamesDiff < toughestMatch.diff) {
      toughestMatch = {
        seasonId: match.seasonId,
        round: match.round,
        diff: gamesDiff,
      };
    }
  }

  const matchesPlayed = finishedMatches.length;
  const winRate = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0;
  const strongestTeammate = getStrongestTeammate(teammateStats);
  const strongestTeammateSetsDiff = strongestTeammate
    ? strongestTeammate.setsFor - strongestTeammate.setsAgainst
    : 0;
  const strongestTeammateGamesDiff = strongestTeammate
    ? strongestTeammate.gamesFor - strongestTeammate.gamesAgainst
    : 0;
  const toughestRival = getToughestRival(rivalStats);
  const toughestRivalDiff = toughestRival
    ? toughestRival.gamesFor - toughestRival.gamesAgainst
    : 0;
  const mostBeatenRival = getMostBeatenRival(rivalStats);
  const mostLostRival = getMostLostRival(rivalStats);
  let currentWinStreak = 0;
  let bestWinStreak = 0;
  [...finishedMatches]
    .sort((a, b) => a.round - b.round)
    .forEach((match) => {
      const isTeamA = match.teamA.includes(playerId);
      const won =
        getTeamSetPoints(match, isTeamA ? "A" : "B") >
        getTeamSetPoints(match, isTeamA ? "B" : "A");
      currentWinStreak = won ? currentWinStreak + 1 : 0;
      bestWinStreak = Math.max(bestWinStreak, currentWinStreak);
    });
  const mvpSummary = getPlayerMvpSummary({
    leagueId,
    seasonId,
    seasonIds,
    votes,
    matches: seasonMatches,
    playerId,
    mvpSystem,
    mvpSystemBySeasonId,
  });
  const setsTotal = setsFor + setsAgainst;
  const gamesTotal = gamesFor + gamesAgainst;
  const setsWinRate = setsTotal > 0 ? (setsFor / setsTotal) * 100 : 0;
  const gamesForRate = gamesTotal > 0 ? (gamesFor / gamesTotal) * 100 : 0;
  const emptyValue = "—";
  const mvpHref = getPlayerHref(playerId, players) + "/mvp";

  return (
    <AppCard className="p-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-neutral-500">
            {t.playerStats.title}
          </p>
          <p className="mt-0.5 whitespace-nowrap type-panel-title">
            {t.playerStats.subtitle}
          </p>
          {scopeLabel ? (
            <p className="mt-0.5 text-xs font-semibold text-neutral-500">
              {scopeLabel}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 rounded-xl bg-neutral-950 px-3 py-2 text-right text-white">
          <p className="type-caption font-black uppercase tracking-[0.16em] text-neutral-300">
            {t.playerStats.winRate}
          </p>
          <p className="text-lg font-black leading-none">
            {formatPercentage(winRate)}
          </p>
          <p className="mt-1 type-caption font-semibold text-neutral-300">
            {wins}-{losses} {t.playerStats.record}
          </p>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-xl bg-neutral-100 p-2 text-center">
          <p className="text-xs font-semibold text-neutral-500">
            {t.playerStats.setsBalance}
          </p>
          <p className="mt-0.5 text-base font-black">
            {setsFor}-{setsAgainst}
          </p>
          <p className="mt-0.5 type-caption font-semibold leading-snug text-neutral-500">
            {formatPercentage(setsWinRate)} {t.playerStats.wonPercentage}
          </p>
        </div>

        <div className="rounded-xl bg-neutral-100 p-2 text-center">
          <p className="text-xs font-semibold text-neutral-500">
            {t.playerStats.gamesBalance}
          </p>
          <p className="mt-0.5 text-base font-black">
            {gamesFor}-{gamesAgainst}
          </p>
          <p className="mt-0.5 type-caption font-semibold leading-snug text-neutral-500">
            {formatPercentage(gamesForRate)} {t.playerStats.forPercentage}
          </p>
        </div>

        <Link
          href={mvpHref}
          className="rounded-xl bg-neutral-100 p-2 text-center transition active:scale-[0.99]"
        >
          <p className="text-xs font-semibold text-neutral-500">
            {t.playerStats.mvpWon}
          </p>
          <p className="mt-0.5 text-base font-black">
            {mvpSummary.roundMvpCount}
          </p>
        </Link>
      </div>

      <div className="mt-2 space-y-2">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 p-2.5">
          <div>
            <p className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
              {t.playerStats.strongestTeammate}
            </p>
            {strongestTeammate ? (
              <Link
                href={getPlayerHref(strongestTeammate.playerId, players)}
                className="type-player-name mt-1 block underline-offset-2 active:underline"
              >
                {getDisplayName(strongestTeammate.playerId, players)}
              </Link>
            ) : (
              <p className="mt-1 font-black">{emptyValue}</p>
            )}
          </div>
          <p className="shrink-0 text-sm font-semibold text-neutral-500">
            {strongestTeammate
              ? `${formatSignedNumber(strongestTeammateSetsDiff)} ${t.playerStats.setsShort} · ${formatSignedNumber(strongestTeammateGamesDiff)} ${t.playerStats.gamesShort}`
              : emptyValue}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 p-2.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
              {t.playerStats.toughestRival}
            </p>
            {toughestRival ? (
              <Link
                href={getPlayerHref(toughestRival.playerId, players)}
                className="type-player-name mt-1 block underline-offset-2 active:underline"
              >
                {getDisplayName(toughestRival.playerId, players)}
              </Link>
            ) : (
              <p className="mt-1 font-black">{emptyValue}</p>
            )}
          </div>
          <p className="shrink-0 text-sm font-semibold text-neutral-500">
            {toughestRival
              ? `${formatSignedNumber(toughestRivalDiff)} ${t.ranking.diff}`
              : emptyValue}
          </p>
        </div>
      </div>

      <div className="mt-2">
        <p className="mb-2 type-caption font-black uppercase tracking-[0.16em] text-neutral-400">
          {tx("Récords del periodo")}{" "}</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-neutral-50 p-2.5">
            <p className="text-xs font-semibold text-neutral-500">{tx("Mejor racha")}</p>
            <p className="mt-1 font-black">
              {bestWinStreak > 0 ? `${bestWinStreak} victorias` : emptyValue}
            </p>
            <p
              data-best-streak-round-range
              className="mt-1 text-xs text-neutral-500"
            >
              {formatBestWinStreakRoundRange(matches, playerId) ?? emptyValue}
            </p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-2.5">
            <p className="text-xs font-semibold text-neutral-500">{tx("Rival más vencido")}</p>
            <p className="type-player-name mt-1 truncate">
              {mostBeatenRival
                ? getDisplayName(mostBeatenRival.playerId, players)
                : emptyValue}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {mostBeatenRival ? `${mostBeatenRival.wins} victorias` : emptyValue}
            </p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-2.5">
            <p className="text-xs font-semibold text-neutral-500">{tx("Rival con más derrotas")}</p>
            <p className="type-player-name mt-1 truncate">
              {mostLostRival
                ? getDisplayName(mostLostRival.playerId, players)
                : emptyValue}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {mostLostRival
                ? `${mostLostRival.matches - mostLostRival.wins} derrotas`
                : emptyValue}
            </p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-2.5">
            <p className="text-xs font-semibold text-neutral-500">{tx("Mayor diferencia")}</p>
            <p className="mt-1 font-black">
              {bestMatch ? formatSignedNumber(bestMatch.diff) : emptyValue}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {bestMatch ? `${t.matches.round} ${bestMatch.round}` : emptyValue}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        {bestMatch ? (
          <Link
            href={`/round/${bestMatch.round}?seasonId=${encodeURIComponent(bestMatch.seasonId)}`}
            className="rounded-xl bg-neutral-50 p-2.5 transition active:scale-[0.99]"
          >
            <p className="text-xs font-semibold text-neutral-500">
              {t.playerStats.bestRound}
            </p>
            <p className="mt-1 font-black">
              {`${t.matches.round} ${bestMatch.round}`}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {`${formatSignedNumber(bestMatch.diff)} ${t.ranking.diff}`}
            </p>
          </Link>
        ) : (
          <div className="rounded-xl bg-neutral-50 p-2.5">
            <p className="text-xs font-semibold text-neutral-500">
              {t.playerStats.bestRound}
            </p>
            <p className="mt-1 font-black">{emptyValue}</p>
            <p className="mt-1 text-xs text-neutral-500">{emptyValue}</p>
          </div>
        )}

        {toughestMatch ? (
          <Link
            href={`/round/${toughestMatch.round}?seasonId=${encodeURIComponent(toughestMatch.seasonId)}`}
            className="rounded-xl bg-neutral-50 p-2.5 transition active:scale-[0.99]"
          >
            <p className="text-xs font-semibold text-neutral-500">
              {t.playerStats.toughestRound}
            </p>
            <p className="mt-1 font-black">
              {`${t.matches.round} ${toughestMatch.round}`}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {`${formatSignedNumber(toughestMatch.diff)} ${t.ranking.diff}`}
            </p>
          </Link>
        ) : (
          <div className="rounded-xl bg-neutral-50 p-2.5">
            <p className="text-xs font-semibold text-neutral-500">
              {t.playerStats.toughestRound}
            </p>
            <p className="mt-1 font-black">{emptyValue}</p>
            <p className="mt-1 text-xs text-neutral-500">{emptyValue}</p>
          </div>
        )}
      </div>
    </AppCard>
  );
}
