"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LeagueLogo } from "@/components/league/LeagueLogo";
import { AppCard } from "@/components/ui/AppCard";
import { BackButton } from "@/components/ui/BackButton";
import { useActiveLeague } from "@/context/ActiveLeagueProvider";
import { useLeagueAccess } from "@/context/LeagueAccessProvider";
import { useMatchData } from "@/context/MatchDataProvider";
import { useSeasonSettings } from "@/context/SeasonSettingsProvider";
import { calculateSeasonRanking } from "@/lib/ranking";

function getSeasonStatusLabel(status: "upcoming" | "active" | "finished") {
  if (status === "active") return "Activa";
  if (status === "upcoming") return "Próximamente";
  return "Terminada";
}

export default function LeaguesPage() {
  const router = useRouter();
  const { activeLeagueId, changeActiveLeague } = useActiveLeague();
  const { hasLeagueAdminRole, userLeagues } = useLeagueAccess();
  const { matches } = useMatchData();
  const {
    getActiveSeasonByLeagueId,
    playerProfiles,
    seasonPlayers,
  } = useSeasonSettings();

  function handleEnterLeague(leagueId: string) {
    changeActiveLeague(leagueId);
    router.push("/");
  }

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <BackButton fallbackHref="/settings" label="Volver" />

        <h1 className="mt-4 text-3xl font-black tracking-tight">
          Mis ligas
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Selecciona la liga en la que quieres entrar. Sustituye al antiguo
          desplegable de liga activa en Ajustes.
        </p>
      </header>

      <div className="space-y-3">
        {userLeagues.map((league) => {
          const season = getActiveSeasonByLeagueId(league.id);
          const seasonMatches = matches.filter(
            (match) => match.leagueId === league.id && match.seasonId === season.id,
          );
          const finishedMatches = seasonMatches.filter(
            (match) => match.status === "finished",
          ).length;
          const seasonPlayerIds = seasonPlayers
            .filter((seasonPlayer) => seasonPlayer.seasonId === season.id)
            .map((seasonPlayer) => seasonPlayer.playerId);
          const seasonPlayerCount = seasonPlayerIds.length;
          const ranking = calculateSeasonRanking({
            seasonId: season.id,
            playerProfiles,
            seasonPlayers,
            matches,
          });
          const leader = ranking.find((player) => player.points > 0) ?? null;
          const isActive = activeLeagueId === league.id;
          const isAdmin = hasLeagueAdminRole(league.id);

          return (
            <AppCard key={league.id} className={isActive ? "ring-2 ring-neutral-950" : ""}>
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
                  <p className="mt-1 line-clamp-2 text-xs font-semibold text-neutral-500">
                    {league.description || "Sin descripción"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-neutral-600">
                      {getSeasonStatusLabel(season.status)}
                    </span>
                    {isAdmin ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-800">
                        Admin
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-neutral-100 px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
                    Jugadores
                  </p>
                  <p className="mt-1 text-lg font-black text-neutral-950">
                    {seasonPlayerCount || "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-neutral-100 px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
                    Partidos
                  </p>
                  <p className="mt-1 text-lg font-black text-neutral-950">
                    {finishedMatches}/{seasonMatches.length || 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-neutral-100 px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
                    Líder
                  </p>
                  <p className="mt-1 truncate text-sm font-black text-neutral-950">
                    {leader?.displayName ?? "-"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleEnterLeague(league.id)}
                className="mt-4 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white"
              >
                {isActive ? "Entrar en liga actual" : "Entrar en esta liga"}
              </button>
            </AppCard>
          );
        })}
      </div>

      <AppCard>
        <div className="grid gap-2">
          <Link
            href="/invite"
            className="block rounded-2xl bg-neutral-100 px-4 py-3 text-center text-sm font-black text-neutral-800"
          >
            Unirme con invitación
          </Link>
          <Link
            href="/league/new"
            className="block rounded-2xl bg-neutral-950 px-4 py-3 text-center text-sm font-black text-white"
          >
            Crear nueva liga
          </Link>
        </div>
      </AppCard>
    </div>
  );
}
