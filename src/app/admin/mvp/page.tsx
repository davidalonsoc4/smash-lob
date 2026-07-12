"use client"

import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useMvp } from "@/context/MvpProvider"
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
    <div className="mt-3 flex items-center gap-3 rounded-2xl bg-neutral-100 p-3">
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
  const { hasLeagueAdminRole } = useLeagueAccess()
  const { votes } = useMvp()
  const { activeLeague, activeSeason, roundSettings, players, matches } =
    useCurrentLeagueData()
  const canAccessAdmin = hasLeagueAdminRole(activeLeague.id)
  const completedRounds = getCompletedRoundNumbers(
    matches,
    activeLeague.id,
    activeSeason.id,
  )
  const isSeasonClosed = activeSeason.status === "finished"
  const seasonMvp = isSeasonClosed
    ? getSeasonMvpSelection({
        votes,
        leagueId: activeLeague.id,
        seasonId: activeSeason.id,
        matches,
        mvpSystem: roundSettings.mvpSystem,
      })
    : null
  const seasonMvpPlayers = getPlayersByIds(players, seasonMvp?.playerIds ?? [])

  if (!canAccessAdmin) {
    return (
      <div className="compact-page space-y-3">
        <header className="pt-2">
          <BackButton fallbackHref="/admin" label={t.common.back} />
          <h1 className="mt-1 text-xl font-black tracking-tight">
            {t.adminPanel.accessDeniedTitle}
          </h1>
        </header>

        <AppCard>
          <p className="font-bold">{t.adminPanel.accessDeniedCardTitle}</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            {t.adminPanel.accessDeniedDescription}
          </p>
        </AppCard>
      </div>
    )
  }

  if (roundSettings.mvpSystem === "none") {
    return (
      <div className="compact-page space-y-3">
        <header className="pt-2">
          <BackButton fallbackHref="/admin" label={t.common.back} />
          <h1 className="mt-1 text-xl font-black tracking-tight">
            Administrar MVP
          </h1>
        </header>
        <AppCard>
          <p className="font-bold">Sistema MVP desactivado</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
            Puedes activarlo o cambiar su metodología desde Administración de
            temporada.
          </p>
        </AppCard>
      </div>
    )
  }

  const isVoting = roundSettings.mvpSystem === "voting"

  return (
    <div className="compact-page space-y-3">
      <header className="pt-2">
        <BackButton fallbackHref="/admin" label={t.common.back} />
        <p className="mt-1 text-xs font-bold text-neutral-500">
          {activeLeague.name} · {activeSeason.name}
        </p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Administrar MVP
        </h1>
        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          {isVoting
            ? "Consulta los MVP elegidos por votación y las jornadas todavía pendientes de votos."
            : "Consulta los MVP automáticos de cada jornada."}
        </p>
      </header>

      {isSeasonClosed ? (
        <AppCard>
          <p className="font-bold">MVP final de temporada</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            Se asigna al jugador que más MVP de jornada acumula. Los empates se
            mantienen como MVP compartidos.
          </p>
          <MvpPlayerLine
            label={seasonMvp?.tied ? "Empate final" : "Resultado final"}
            players={seasonMvpPlayers}
            helper={
              seasonMvp
                ? `${seasonMvp.votes} MVP de jornada acumulados${seasonMvp.tied ? " · compartido" : ""}`
                : "No hay MVP final disponible"
            }
          />
        </AppCard>
      ) : null}

      <AppCard>
        <p className="font-bold">MVP por jornada</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          {isVoting
            ? "Cada partido se cierra cuando alguien alcanza 3 votos o, si no ocurre, al votar los cuatro jugadores. La jornada se decide cuando todos sus partidos tienen MVP."
            : "Gana la pareja vencedora con mejor diferencia de juegos cuando todos los partidos tienen resultado."}
        </p>

        {completedRounds.length > 0 ? (
          <div className="mt-3 space-y-4">
            {completedRounds.map((round) => {
              const roundMvp = getRoundMvpSelection({
                votes,
                leagueId: activeLeague.id,
                seasonId: activeSeason.id,
                round,
                matches,
                mvpSystem: roundSettings.mvpSystem,
              })
              const roundMvpPlayers = getPlayersByIds(
                players,
                roundMvp?.playerIds ?? [],
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
                      {isVoting ? "Votación" : "Auto"}
                    </span>
                  </div>

                  <MvpPlayerLine
                    label="MVP de jornada"
                    players={roundMvpPlayers}
                    helper={
                      roundMvp
                        ? isVoting
                          ? `${roundMvp.votes} votos${roundMvp.tied ? " · empate compartido" : ""}`
                          : `${roundMvp.setsFor}-${roundMvp.setsAgainst} sets · ${roundMvp.gamesFor}-${roundMvp.gamesAgainst} juegos · ${roundMvp.gamesDiff} dif.`
                        : isVoting
                          ? "Pendiente de completar todas las votaciones"
                          : "Pendiente"
                    }
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <p className="mt-3 rounded-2xl bg-neutral-100 p-3 text-sm font-semibold text-neutral-500">
            No hay jornadas completas todavía.
          </p>
        )}
      </AppCard>
    </div>
  )
}
