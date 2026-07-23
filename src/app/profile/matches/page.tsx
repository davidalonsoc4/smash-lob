"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlayerMatchesList } from "@/components/player/PlayerMatchesList";
import { PlayerSeasonScopeSelector } from "@/components/player/PlayerSeasonScopeSelector";
import { AppCard } from "@/components/ui/AppCard";
import { BackButton } from "@/components/ui/BackButton";
import { useCurrentUser } from "@/context/CurrentUserProvider";
import { useMatchData } from "@/context/MatchDataProvider";
import { useMvp } from "@/context/MvpProvider";
import { useSeasonSettings } from "@/context/SeasonSettingsProvider";
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData";
import { useI18n } from "@/i18n/I18nProvider";
import {
  getPlayerSeasonScopes,
  getPlayersForSeasonScope,
} from "@/lib/playerHistory";
import {
  getVisiblePlayerSeasonScopes,
  shouldShowHistoricalProfileStats,
} from "@/lib/playerProfileVisibility";

type MatchFilter =
  "all" | "finished" | "pending" | "scheduled" | "scheduling" | "postponed";

type MatchSort = "recent" | "roundAsc" | "roundDesc";

const validFilters: MatchFilter[] = [
  "finished",
  "all",
  "pending",
  "scheduled",
  "scheduling",
  "postponed",
];

const validSorts: MatchSort[] = ["recent", "roundAsc", "roundDesc"];
const defaultFilter: MatchFilter = "finished";
const defaultSort: MatchSort = "roundAsc";

function getMatchSortTime(match: {
  resultRecordedAt?: string | null;
  scheduledAt?: string | null;
}) {
  const value = match.resultRecordedAt ?? match.scheduledAt;

  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
}

function sortMatchesByOrder<
  T extends {
    resultRecordedAt?: string | null;
    scheduledAt?: string | null;
    seasonId: string;
    round: number;
  },
>(matches: T[], sort: MatchSort) {
  return [...matches].sort((firstMatch, secondMatch) => {
    if (sort === "roundAsc") {
      return firstMatch.round - secondMatch.round;
    }

    if (sort === "roundDesc") {
      return secondMatch.round - firstMatch.round;
    }

    const timeDiff =
      getMatchSortTime(secondMatch) - getMatchSortTime(firstMatch);

    if (timeDiff !== 0) {
      return timeDiff;
    }

    if (secondMatch.seasonId !== firstMatch.seasonId) {
      return secondMatch.seasonId.localeCompare(firstMatch.seasonId);
    }

    return secondMatch.round - firstMatch.round;
  });
}

export default function ProfileMatchesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUserId } = useCurrentUser();
  const { matches: allMatches } = useMatchData();
  const { votes } = useMvp();
  const { seasons, seasonPlayers, playerProfiles, seasonSettings } =
    useSeasonSettings();
  const { activeLeague, activeSeason } = useCurrentLeagueData();

  const player = playerProfiles.find(
    (item) => item.leagueId === activeLeague.id && item.id === currentUserId,
  );
  const queryFilter = searchParams.get("status");
  const querySort = searchParams.get("sort");
  const activeFilter = validFilters.includes(queryFilter as MatchFilter)
    ? (queryFilter as MatchFilter)
    : defaultFilter;
  const activeSort = validSorts.includes(querySort as MatchSort)
    ? (querySort as MatchSort)
    : defaultSort;
  const queryScopeId = searchParams.get("scope");
  const playerHref = "/profile";
  const matchesHref = "/profile/matches";

  const leagueMatches = useMemo(
    () => allMatches.filter((match) => match.leagueId === activeLeague.id),
    [activeLeague.id, allMatches],
  );

  const seasonScopes = useMemo(() => {
    if (!player) {
      return [];
    }

    return getPlayerSeasonScopes({
      leagueId: activeLeague.id,
      playerId: player.id,
      activeSeasonId: activeSeason.id,
      seasons,
      seasonPlayers,
      matches: leagueMatches,
    });
  }, [
    activeLeague.id,
    activeSeason.id,
    leagueMatches,
    player,
    seasonPlayers,
    seasons,
  ]);

  const showHistoricalStats = shouldShowHistoricalProfileStats({
    league: activeLeague,
    seasons,
  });
  const visibleSeasonScopes = getVisiblePlayerSeasonScopes({
    scopes: seasonScopes,
    activeSeason,
    showHistory: showHistoricalStats,
  });
  const selectedScope =
    visibleSeasonScopes.find((scope) => scope.id === queryScopeId) ??
    visibleSeasonScopes.find((scope) => scope.id === activeSeason.id) ??
    visibleSeasonScopes[0];
  const selectedSeasonIds = selectedScope?.seasonIds ?? [activeSeason.id];
  const selectedMatches = leagueMatches.filter((match) =>
    selectedSeasonIds.includes(match.seasonId),
  );
  const selectedPlayers = getPlayersForSeasonScope({
    leagueId: activeLeague.id,
    seasonIds: selectedSeasonIds,
    playerProfiles,
    seasonPlayers,
    matches: leagueMatches,
  });

  const filterOptions: { value: MatchFilter; label: string }[] = [
    { value: "all", label: t.profile.filterAll },
    { value: "finished", label: t.profile.filterFinished },
    { value: "pending", label: t.profile.filterPending },
    { value: "scheduled", label: t.profile.filterScheduled },
    { value: "scheduling", label: t.profile.filterUnscheduled },
    { value: "postponed", label: t.profile.filterPostponed },
  ];
  const sortOptions: { value: MatchSort; label: string }[] = [
    { value: "roundAsc", label: "Jornada 1 → final" },
    { value: "recent", label: "Más recientes" },
    { value: "roundDesc", label: "Última jornada → primera" },
  ];

  const playerMatches = player
    ? selectedMatches.filter(
        (match) =>
          match.teamA.includes(player.id) || match.teamB.includes(player.id),
      )
    : [];
  const filteredMatches = sortMatchesByOrder(
    playerMatches.filter((match) => {
      if (activeFilter === "all") {
        return true;
      }

      if (activeFilter === "pending") {
        return match.status !== "finished";
      }

      return match.status === activeFilter;
    }),
    activeSort,
  );

  function buildHref({
    filter = activeFilter,
    sort = activeSort,
    scopeId = selectedScope?.id,
  }: {
    filter?: MatchFilter;
    sort?: MatchSort;
    scopeId?: string;
  }) {
    const nextParams = new URLSearchParams();

    if (filter !== defaultFilter) {
      nextParams.set("status", filter);
    }

    if (sort !== defaultSort) {
      nextParams.set("sort", sort);
    }

    if (scopeId) {
      nextParams.set("scope", scopeId);
    }

    const query = nextParams.toString();

    return query ? `${matchesHref}?${query}` : matchesHref;
  }

  function handleFilterChange(filter: MatchFilter) {
    router.push(buildHref({ filter }));
  }

  function handleSortChange(sort: MatchSort) {
    router.push(buildHref({ sort }));
  }

  function handleScopeChange(scopeId: string) {
    router.push(buildHref({ scopeId }));
  }

  if (!player || !selectedScope) {
    return (
      <div className="space-y-4">
        <header className="pt-2">
          <BackButton fallbackHref="/profile" label={t.common.back} />
        </header>

        <AppCard>
          <p className="font-bold">{t.playerProfile.notFound}</p>
        </AppCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <BackButton fallbackHref={playerHref} label={t.common.back} />

        <p className="mt-3 text-sm font-medium text-neutral-500">
          {activeLeague.name}
        </p>

        <h1 className="mt-1 text-2xl font-black tracking-tight">
          {t.profile.matchHistoryTitle}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {t.profile.matchHistoryPageDescription}
        </p>
      </header>

      {showHistoricalStats && visibleSeasonScopes.length > 1 ? (
        <PlayerSeasonScopeSelector
          title={t.playerProfile.scopeSelectorTitle}
          description={t.playerProfile.scopeSelectorDescription}
          value={selectedScope.id}
          scopes={visibleSeasonScopes}
          onChange={handleScopeChange}
        />
      ) : null}

      <div className="flex items-center justify-end gap-1.5">
        <label className="min-w-0">
          <span className="sr-only">Estado</span>
          <select
            value={activeFilter}
            onChange={(event) =>
              handleFilterChange(event.target.value as MatchFilter)
            }
            aria-label="Estado de los partidos"
            className="max-w-28 rounded-full border border-neutral-200 bg-white px-2 py-1 text-[10px] font-black text-neutral-700 shadow-sm outline-none"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-0">
          <span className="sr-only">Orden</span>
          <select
            value={activeSort}
            onChange={(event) =>
              handleSortChange(event.target.value as MatchSort)
            }
            aria-label="Orden de los partidos"
            className="max-w-40 rounded-full border border-neutral-200 bg-white px-2 py-1 text-[10px] font-black text-neutral-700 shadow-sm outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <PlayerMatchesList
        playerId={player.id}
        title={t.profile.filteredMatches}
        matches={filteredMatches}
        players={selectedPlayers}
        seasonMatches={selectedMatches}
        emptyMessage={t.profile.noFilteredMatches}
        leagueLocations={activeLeague.locations}
        votes={votes}
        mvpSystemBySeasonId={Object.fromEntries(
          seasonSettings.map((settings) => [
            settings.seasonId,
            settings.mvpSystem,
          ]),
        )}
      />
    </div>
  );
}
