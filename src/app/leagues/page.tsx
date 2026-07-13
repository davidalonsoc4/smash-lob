"use client";

import Link from "next/link";
import { LeagueLogo } from "@/components/league/LeagueLogo";
import { AppCard } from "@/components/ui/AppCard";
import { BackButton } from "@/components/ui/BackButton";
import { useActiveLeague } from "@/context/ActiveLeagueProvider";
import { useLeagueAccess } from "@/context/LeagueAccessProvider";
import { useMatchData } from "@/context/MatchDataProvider";
import { useSeasonSettings } from "@/context/SeasonSettingsProvider";
import { calculateSeasonRanking } from "@/lib/ranking";
import { getMatchResultConfirmationState } from "@/lib/resultConfirmations";
import { getSeasonStatusBadgeClassName } from "@/lib/statusStyles";

function getSeasonStatusLabel(season: {
  status: "upcoming" | "active" | "finished";
  totalRounds: number;
}) {
  if (season.totalRounds === 0) return "Sin temporada";
  if (season.status === "active") return "Activa";
  if (season.status === "upcoming") return "Próximamente";
  return "Terminada";
}

export default function LeaguesPage() {
  const { activeLeagueId, changeActiveLeague } = useActiveLeague();
  const {
    canCreateLeagues,
    isAdminViewEnabled,
    isLeagueAdmin,
    isLeagueSpectator,
    userLeagues,
  } = useLeagueAccess();
  const canCreateLeaguesInCurrentView = canCreateLeagues && isAdminViewEnabled;
  const { matches, resultConfirmations } = useMatchData();
  const {
    getActiveSeasonByLeagueId,
    getSeasonRoundSettings,
    playerProfiles,
    seasonPlayers,
  } = useSeasonSettings();

  const countedMatches = matches.map((match) => ({
    ...match,
    resultCounts: getMatchResultConfirmationState({
      matchId: match.id,
      participantIds: [...match.teamA, ...match.teamB],
      reporterPlayerId: match.resultReportedByPlayerId,
      resultRecordedAt: match.resultRecordedAt,
      resultLocked: match.resultLocked,
      confirmations: resultConfirmations,
      mode: getSeasonRoundSettings(match.seasonId).resultConfirmationMode,
    }).countsForRanking,
  }));

  function handleEnterLeague(leagueId: string) {
    changeActiveLeague(leagueId);
  }

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <BackButton fallbackHref="/settings" label="Volver" />

        <h1 className="mt-3 text-2xl font-black tracking-tight">Mis ligas</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Selecciona la liga en la que quieres entrar.
        </p>
      </header>

      <div className="space-y-3">
        {userLeagues.map((league) => {
          const season = getActiveSeasonByLeagueId(league.id);
          const seasonMatches = countedMatches.filter(
            (match) =>
              match.leagueId === league.id && match.seasonId === season.id,
          );
          const finishedMatches = seasonMatches.filter(
            (match) =>
              match.status === "finished" && match.resultCounts !== false,
          ).length;
          const seasonPlayerIds = seasonPlayers
            .filter((seasonPlayer) => seasonPlayer.seasonId === season.id)
            .map((seasonPlayer) => seasonPlayer.playerId);
          const seasonPlayerCount = seasonPlayerIds.length;
          const ranking = calculateSeasonRanking({
            seasonId: season.id,
            playerProfiles,
            seasonPlayers,
            matches: countedMatches,
          });
          const leader = ranking.find((player) => player.points > 0) ?? null;
          const isActive = activeLeagueId === league.id;
          const isAdmin = isLeagueAdmin(league.id);
          const isSpectator = isLeagueSpectator(league.id);

          return (
            <article
              key={league.id}
              role="button"
              tabIndex={0}
              aria-label={`Entrar en ${league.name}`}
              onClick={() => handleEnterLeague(league.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleEnterLeague(league.id);
                }
              }}
              className={`cursor-pointer rounded-2xl border bg-white p-3 text-left shadow-[0_2px_12px_rgba(15,23,42,0.06)] transition active:scale-[0.99] ${
                isActive
                  ? "border-neutral-950 ring-2 ring-neutral-950"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <LeagueLogo league={league} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-lg font-black text-neutral-950">
                      {league.name}
                    </p>
                    {isActive ? (
                      <span className="shrink-0 rounded-full bg-neutral-950 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                        Actual
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs font-semibold text-neutral-500">
                    {league.description || "Sin descripción"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={getSeasonStatusBadgeClassName(
                        season.status,
                        season.totalRounds,
                      )}
                    >
                      {getSeasonStatusLabel(season)}
                    </span>
                    {isAdmin ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-800">
                        Admin
                      </span>
                    ) : isSpectator ? (
                      <span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-neutral-600">
                        Espectador
                      </span>
                    ) : null}
                    <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                      Toca para entrar
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-neutral-100 px-2 py-2">
                  <p className="text-[9px] font-black uppercase tracking-wide text-neutral-500">
                    Jugadores
                  </p>
                  <p className="mt-0.5 text-base font-black text-neutral-950">
                    {seasonPlayerCount || "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-neutral-100 px-2 py-2">
                  <p className="text-[9px] font-black uppercase tracking-wide text-neutral-500">
                    Partidos
                  </p>
                  <p className="mt-0.5 text-base font-black text-neutral-950">
                    {finishedMatches}/{seasonMatches.length || 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-neutral-100 px-2 py-2">
                  <p className="text-[9px] font-black uppercase tracking-wide text-neutral-500">
                    Líder
                  </p>
                  <p className="mt-0.5 truncate text-xs font-black text-neutral-950">
                    {leader?.displayName ?? "-"}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <AppCard>
        <div className="grid gap-2">
          <Link
            href="/invite"
            className="block rounded-2xl bg-neutral-100 px-3 py-2.5 text-center text-sm font-black text-neutral-800"
          >
            Unirme con invitación
          </Link>
          {canCreateLeaguesInCurrentView ? (
            <Link
              href="/league/new"
              className="block rounded-2xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white"
            >
              Crear nueva liga
            </Link>
          ) : null}
        </div>
      </AppCard>
    </div>
  );
}
