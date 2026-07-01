"use client"

import { useParams } from "next/navigation"
import { MatchCard } from "@/components/matches/MatchCard"
import { BackButton } from "@/components/ui/BackButton"
import { AppCard } from "@/components/ui/AppCard"
import { useMatchData } from "@/context/MatchDataProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { getRoundMvpPlayerIds } from "@/lib/mvp"

export default function RoundDetailPage() {
  const params = useParams<{ id: string }>()
  const round = Number(params.id)
  const { matches } = useMatchData()
  const { seasons, playerProfiles } = useSeasonSettings()
  const { activeLeague } = useCurrentLeagueData()
  const leaguePlayers = playerProfiles.filter((player) => player.leagueId === activeLeague.id)
  const roundMatches = matches
    .filter(
      (match) =>
        match.leagueId === activeLeague.id &&
        match.round === round
    )
    .sort((firstMatch, secondMatch) => {
      if (firstMatch.seasonId !== secondMatch.seasonId) {
        return secondMatch.seasonId.localeCompare(firstMatch.seasonId)
      }

      return firstMatch.id.localeCompare(secondMatch.id)
    })

  return (
    <div className="space-y-3">
      <header className="pt-2">
        <BackButton fallbackHref="/matches" label="Volver" />

        <p className="mt-4 text-sm font-medium text-stone-500">
          {activeLeague.name}
        </p>
        <h1 className="mt-1 sl-page-title">
          Jornada {Number.isFinite(round) ? round : "—"}
        </h1>
        <p className="mt-1 sl-page-subtitle">
          Partidos y resultados de la jornada seleccionada.
        </p>
      </header>

      {roundMatches.length === 0 ? (
        <AppCard>
          <p className="text-sm font-semibold text-stone-500">
            No hay partidos para esta jornada.
          </p>
        </AppCard>
      ) : null}

      <div className="space-y-3">
        {roundMatches.map((match) => {
          const season = seasons.find((item) => item.id === match.seasonId)
          const highlightedPlayerIds = getRoundMvpPlayerIds({
            leagueId: activeLeague.id,
            seasonId: match.seasonId,
            round: match.round,
            matches,
          })

          return (
            <section key={match.id} className="space-y-2">
              {season ? (
                <p className="px-1 text-xs font-black uppercase tracking-[0.14em] text-stone-400">
                  {season.name}
                </p>
              ) : null}
              <MatchCard
                match={match}
                players={leaguePlayers}
                roundStartsAt={null}
                roundEndsAt={null}
                highlightedPlayerIds={highlightedPlayerIds}
              />
            </section>
          )
        })}
      </div>
    </div>
  )
}
