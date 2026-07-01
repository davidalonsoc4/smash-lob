"use client"

import { useParams } from "next/navigation"
import { MatchCard } from "@/components/matches/MatchCard"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { BackButton } from "@/components/ui/BackButton"
import { AppCard } from "@/components/ui/AppCard"
import { useMatchData } from "@/context/MatchDataProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { getPlayerRoundMvpMatches } from "@/lib/mvp"

export default function PlayerMvpMatchesPage() {
  const params = useParams<{ id: string }>()
  const { matches } = useMatchData()
  const { seasons, playerProfiles } = useSeasonSettings()
  const { activeLeague } = useCurrentLeagueData()

  const player = playerProfiles.find(
    (item) =>
      item.leagueId === activeLeague.id &&
      (item.slug === params.id || item.id === params.id)
  )
  const leagueSeasonIds = seasons
    .filter((season) => season.leagueId === activeLeague.id)
    .map((season) => season.id)
  const mvpMatches = player
    ? getPlayerRoundMvpMatches({
        leagueId: activeLeague.id,
        seasonIds: leagueSeasonIds,
        matches,
        playerId: player.id,
      }).sort((firstItem, secondItem) => {
        if (secondItem.seasonId !== firstItem.seasonId) {
          return secondItem.seasonId.localeCompare(firstItem.seasonId)
        }

        return secondItem.round - firstItem.round
      })
    : []

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <BackButton fallbackHref={player ? `/player/${player.slug}` : "/ranking"} label="Volver" />

        <p className="mt-3 text-sm font-medium text-neutral-500">
          {activeLeague.name}
        </p>

        <div className="mt-3 flex items-center gap-3">
          {player ? <PlayerAvatar player={player} size="lg" /> : null}
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight">
              MVPs de jornada
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {player ? player.displayName : "Jugador no encontrado"}
            </p>
          </div>
        </div>
      </header>

      <AppCard>
        <p className="text-sm font-semibold text-neutral-500">
          Aquí aparecen los partidos en los que este jugador formó parte de la pareja MVP de la jornada.
        </p>
        <p className="mt-2 text-2xl font-black">{mvpMatches.length}</p>
      </AppCard>

      {mvpMatches.length === 0 ? (
        <AppCard>
          <p className="text-sm font-semibold text-neutral-500">
            Todavía no hay partidos MVP para este jugador.
          </p>
        </AppCard>
      ) : null}

      <div className="space-y-3">
        {mvpMatches.map(({ match, mvp }) => (
          <MatchCard
            key={match.id}
            match={{
              ...match,
              id: match.id ?? `${match.seasonId}-${match.round}`,
              dateLabel: null,
              location: null,
            }}
            players={playerProfiles.filter((item) => item.leagueId === activeLeague.id)}
            roundStartsAt={null}
            roundEndsAt={null}
            highlightedPlayerIds={mvp.playerIds}
          />
        ))}
      </div>
    </div>
  )
}
