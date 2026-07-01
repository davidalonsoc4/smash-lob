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
  const { canCreateLeagues, hasLeagueAdminRole, userLeagues } = useLeagueAccess();
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
    <div className="space-y-3">
      <header className="pt-2">
        <BackButton fallbackHref="/settings" label="Volver" />

        <h1 className="mt-4 sl-page-title">
          Mis ligas
        </h1>
        <p className="mt-1 sl-page-subtitle">
          Selecciona la liga en la que quieres entrar.
        </p>
      </header>

      <div className="space-y-2.5">
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
              className={`sl-action-card cursor-pointer rounded-xl border bg-white p-3 pr-8 text-left transition ${
                isActive
                  ? "border-stone-950 ring-2 ring-stone-950"
                  : "border-stone-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <LeagueLogo league={league} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-base font-black text-stone-950">
                      {league.name}
                    </p>
                    {isActive ? (
                      <span className="sl-tiny-label border-stone-950 bg-stone-950 text-white">
                        Actual
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-stone-500">
                    {league.description || "Sin descripción"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="sl-tiny-label">
                      {getSeasonStatusLabel(season.status)}
                    </span>
                    {isAdmin ? (
                      <span className="sl-tiny-label border-amber-200 bg-amber-50 text-amber-800">
                        Admin
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-stone-100 pt-3 text-[11px]">
                <div>
                  <p className="font-black uppercase tracking-[0.1em] text-stone-400">
                    Jugadores
                  </p>
                  <p className="mt-0.5 font-black text-stone-950">
                    {seasonPlayerCount || "-"}
                  </p>
                </div>
                <div>
                  <p className="font-black uppercase tracking-[0.1em] text-stone-400">
                    Partidos
                  </p>
                  <p className="mt-0.5 font-black text-stone-950">
                    {finishedMatches}/{seasonMatches.length || 0}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="font-black uppercase tracking-[0.1em] text-stone-400">
                    Líder
                  </p>
                  <p className="mt-0.5 truncate font-black text-stone-950">
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
            className="sl-secondary-action block rounded-xl px-4 py-2.5 text-center text-sm font-black"
          >
            Unirme con invitación
          </Link>
          {canCreateLeagues ? (
            <Link
              href="/league/new"
              className="sl-primary-action block rounded-xl px-4 py-2.5 text-center text-sm font-black"
            >
              Crear nueva liga
            </Link>
          ) : null}
        </div>
      </AppCard>
    </div>
  );
}
