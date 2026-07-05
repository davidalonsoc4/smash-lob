"use client"

import { useParams } from "next/navigation"
import { MatchCard } from "@/components/matches/MatchCard"
import { BackButton } from "@/components/ui/BackButton"
import { AppCard } from "@/components/ui/AppCard"
import { useMatchData } from "@/context/MatchDataProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { getRoundMvpPlayerIds } from "@/lib/mvp"

export default function RoundDetailPage() {
  const params = useParams<{ id: string }>()
  const round = Number(params.id)
  const { matches } = useMatchData()
  const { activeLeague, activeSeason, players: leaguePlayers } = useCurrentLeagueData()
  const roundMatches = matches
    .filter(
      (match) =>
        match.leagueId === activeLeague.id &&
        match.seasonId === activeSeason.id &&
        match.round === round
    )
    .sort((firstMatch, secondMatch) => {
      return firstMatch.id.localeCompare(secondMatch.id)
    })

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <BackButton fallbackHref="/matches" label="Volver" />

        <p className="mt-3 text-sm font-medium text-neutral-500">
          {activeLeague.name}
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">
          Jornada {Number.isFinite(round) ? round : "—"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Partidos y resultados de la jornada seleccionada.
        </p>
      </header>

      {roundMatches.length === 0 ? (
        <AppCard>
          <p className="text-sm font-semibold text-neutral-500">
            No hay partidos para esta jornada.
          </p>
        </AppCard>
      ) : null}

      <div className="space-y-3">
        {roundMatches.map((match) => {
          const highlightedPlayerIds = getRoundMvpPlayerIds({
            leagueId: activeLeague.id,
            seasonId: activeSeason.id,
            round: match.round,
            matches,
          })

          return (
            <MatchCard
              key={match.id}
              match={match}
              players={leaguePlayers}
              roundStartsAt={null}
              roundEndsAt={null}
              highlightedPlayerIds={highlightedPlayerIds}
              leagueLocations={activeLeague.locations}
            />
          )
        })}
      </div>
    </div>
  )
}
