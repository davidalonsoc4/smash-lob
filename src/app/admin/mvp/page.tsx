"use client"

import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import {
  getCompletedRoundNumbers,
  getPlayersByIds,
  getRoundMvpSelection,
  getSeasonMvpSelection,
  type MvpPlayer,
} from "@/lib/mvp"

function MvpPlayerLine({
  label,
  players,
  helper,
}: {
  label: string
  players: MvpPlayer[]
  helper: string
}) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-neutral-100 p-3">
      <div className="flex -space-x-2">
        {players.length > 0 ? (
          players.slice(0, 4).map((player) => (
            <PlayerAvatar
              key={player.id}
              player={player}
              size="md"
              className="border-2 border-neutral-100"
            />
          ))
        ) : (
          <PlayerAvatar player={null} size="md" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-neutral-500">
          {label}
        </p>
        <p className="truncate text-base font-black text-neutral-950">
          {players.length > 0
            ? players.map((player) => player.displayName).join(" / ")
            : "Pendiente"}
        </p>
        <p className="text-xs font-semibold text-neutral-500">{helper}</p>
      </div>
    </div>
  )
}

export default function AdminMvpPage() {
  const { t } = useI18n()
  const { isLeagueAdmin } = useLeagueAccess()
  const { activeLeague, activeSeason, players, matches } = useCurrentLeagueData()
  const canAccessAdmin = isLeagueAdmin(activeLeague.id)
  const completedRounds = getCompletedRoundNumbers(
    matches,
    activeLeague.id,
    activeSeason.id
  )
  const seasonMvp = getSeasonMvpSelection({
    leagueId: activeLeague.id,
    seasonId: activeSeason.id,
    matches,
  })
  const seasonMvpPlayers = getPlayersByIds(players, seasonMvp?.playerIds ?? [])

  if (!canAccessAdmin) {
    return (
      <div className="space-y-5">
        <header className="pt-2">
          <BackButton fallbackHref="/admin" label={t.common.back} />
          <h1 className="mt-4 text-3xl font-black tracking-tight">
            {t.adminPanel.accessDeniedTitle}
          </h1>
        </header>

        <AppCard>
          <p className="font-bold">{t.adminPanel.accessDeniedCardTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.adminPanel.accessDeniedDescription}
          </p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <BackButton fallbackHref="/admin" label={t.common.back} />

        <p className="mt-4 text-sm font-medium text-neutral-500">
          {activeLeague.name} · {activeSeason.name}
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
          Administrar MVP
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          Consulta los MVPs automáticos de jornada y el MVP final de temporada.
        </p>
      </header>

      <AppCard>
        <p className="font-bold">MVP final de temporada</p>
        <p className="mt-2 text-sm text-neutral-500">
          Se calcula automáticamente con el jugador que más MVPs de jornada acumula. Si hay empate, la app mantiene co-MVPs en vez de inventar un desempate.
        </p>

        <MvpPlayerLine
          label={seasonMvp?.tied ? "Empate actual" : "Resultado actual"}
          players={seasonMvpPlayers}
          helper={
            seasonMvp
              ? `${seasonMvp.votes} MVPs de jornada acumulados${seasonMvp.tied ? " · co-MVPs" : ""}`
              : "Todavía no hay jornadas completas suficientes"
          }
        />
      </AppCard>

      <AppCard>
        <p className="font-bold">MVPs por jornada</p>
        <p className="mt-2 text-sm text-neutral-500">
          El MVP de jornada se calcula al registrar el último resultado pendiente de esa jornada. Gana la pareja vencedora con mejor diferencia de juegos.
        </p>

        {completedRounds.length > 0 ? (
          <div className="mt-4 space-y-4">
            {completedRounds.map((round) => {
              const roundMvp = getRoundMvpSelection({
                leagueId: activeLeague.id,
                seasonId: activeSeason.id,
                round,
                matches,
              })
              const roundMvpPlayers = getPlayersByIds(
                players,
                roundMvp?.playerIds ?? []
              )

              return (
                <div
                  key={round}
                  className="rounded-2xl border border-neutral-200 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black">Jornada {round}</p>
                      <p className="mt-1 text-xs font-semibold text-neutral-500">
                        Jornada completa
                      </p>
                    </div>

                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700">
                      Auto
                    </span>
                  </div>

                  <MvpPlayerLine
                    label="MVP de jornada"
                    players={roundMvpPlayers}
                    helper={
                      roundMvp
                        ? `${roundMvp.setsFor}-${roundMvp.setsAgainst} sets · ${roundMvp.gamesFor}-${roundMvp.gamesAgainst} juegos · ${roundMvp.gamesDiff} dif.`
                        : "Pendiente"
                    }
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl bg-neutral-100 p-3 text-sm font-semibold text-neutral-500">
            No hay jornadas completas todavía.
          </p>
        )}
      </AppCard>
    </div>
  )
}
