"use client"

import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useMvp } from "@/context/MvpProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import {
  getFinishedRoundNumbers,
  getPlayerById,
  getRoundMvpSelection,
  getRoundPlayerIds,
  getRoundVoteRows,
  getSeasonMvpSelection,
  type MvpPlayer,
} from "@/lib/mvp"

function PlayerSelect({
  value,
  players,
  placeholder,
  onChange,
}: {
  value: string
  players: MvpPlayer[]
  placeholder: string
  onChange: (playerId: string | null) => void
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value || null)}
      className="mt-3 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-neutral-950"
    >
      <option value="">{placeholder}</option>
      {players.map((player) => (
        <option key={player.id} value={player.id}>
          {player.displayName}
        </option>
      ))}
    </select>
  )
}

function SelectedMvpLine({
  label,
  player,
  helper,
}: {
  label: string
  player: MvpPlayer | null
  helper: string
}) {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-neutral-100 p-3">
      <PlayerAvatar player={player} size="md" />
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-neutral-500">
          {label}
        </p>
        <p className="truncate text-base font-black text-neutral-950">
          {player?.displayName ?? "Pendiente"}
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
  const { votes, manualSelections, setManualMvpSelection } = useMvp()
  const canAccessAdmin = isLeagueAdmin(activeLeague.id)
  const finishedRounds = getFinishedRoundNumbers(matches)
  const seasonManualSelection = manualSelections.find(
    (selection) =>
      selection.leagueId === activeLeague.id &&
      selection.seasonId === activeSeason.id &&
      selection.scope === "season" &&
      selection.round === null
  )
  const seasonMvp = getSeasonMvpSelection({
    votes,
    manualSelections,
    leagueId: activeLeague.id,
    seasonId: activeSeason.id,
    matches,
  })
  const seasonMvpPlayer = getPlayerById(players, seasonMvp?.playerId ?? null)

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
          Gestiona el MVP por jornada, el MVP final y las votaciones de los jugadores.
        </p>
      </header>

      <AppCard>
        <p className="font-bold">MVP final de temporada</p>
        <p className="mt-2 text-sm text-neutral-500">
          Puedes dejarlo en automático para que salga del histórico de MVPs de jornada o fijarlo manualmente.
        </p>

        <SelectedMvpLine
          label="Resultado actual"
          player={seasonMvpPlayer}
          helper={
            seasonMvp
              ? seasonMvp.source === "manual"
                ? "Selección manual del admin"
                : `${seasonMvp.votes} MVPs de jornada acumulados`
              : "Todavía no hay datos suficientes"
          }
        />

        <PlayerSelect
          value={seasonManualSelection?.selectedPlayerId ?? ""}
          players={players}
          placeholder="Automático por MVPs de jornada"
          onChange={(selectedPlayerId) =>
            setManualMvpSelection({
              leagueId: activeLeague.id,
              seasonId: activeSeason.id,
              scope: "season",
              round: null,
              selectedPlayerId,
            })
          }
        />
      </AppCard>

      <AppCard>
        <p className="font-bold">MVPs por jornada</p>
        <p className="mt-2 text-sm text-neutral-500">
          Revisa las votaciones y fuerza un MVP manual si el admin quiere corregir o cerrar la jornada.
        </p>

        {finishedRounds.length > 0 ? (
          <div className="mt-4 space-y-4">
            {finishedRounds.map((round) => {
              const candidateIds = getRoundPlayerIds(matches, round)
              const candidates = candidateIds
                .map((playerId) => getPlayerById(players, playerId))
                .filter((player): player is MvpPlayer => Boolean(player))
              const manualSelection = manualSelections.find(
                (selection) =>
                  selection.leagueId === activeLeague.id &&
                  selection.seasonId === activeSeason.id &&
                  selection.scope === "round" &&
                  selection.round === round
              )
              const roundMvp = getRoundMvpSelection({
                votes,
                manualSelections,
                leagueId: activeLeague.id,
                seasonId: activeSeason.id,
                round,
              })
              const roundMvpPlayer = getPlayerById(
                players,
                roundMvp?.playerId ?? null
              )
              const voteRows = getRoundVoteRows({
                votes,
                leagueId: activeLeague.id,
                seasonId: activeSeason.id,
                round,
              })

              return (
                <div
                  key={round}
                  className="rounded-2xl border border-neutral-200 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black">Jornada {round}</p>
                      <p className="mt-1 text-xs font-semibold text-neutral-500">
                        {voteRows.length} jugadores con votos
                      </p>
                    </div>

                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700">
                      {roundMvp?.source === "manual" ? "Admin" : "Auto"}
                    </span>
                  </div>

                  <SelectedMvpLine
                    label="MVP actual"
                    player={roundMvpPlayer}
                    helper={
                      roundMvp
                        ? `${roundMvp.votes} votos · ${
                            roundMvp.source === "manual" ? "manual" : "votación"
                          }`
                        : "Pendiente de votos o selección manual"
                    }
                  />

                  <PlayerSelect
                    value={manualSelection?.selectedPlayerId ?? ""}
                    players={candidates}
                    placeholder="Automático por votos"
                    onChange={(selectedPlayerId) =>
                      setManualMvpSelection({
                        leagueId: activeLeague.id,
                        seasonId: activeSeason.id,
                        scope: "round",
                        round,
                        selectedPlayerId,
                      })
                    }
                  />

                  {voteRows.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {voteRows.map((row) => {
                        const player = getPlayerById(players, row.playerId)

                        return (
                          <span
                            key={row.playerId}
                            className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700"
                          >
                            {player?.displayName ?? row.playerId}: {row.votes}
                          </span>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl bg-neutral-100 p-3 text-sm font-semibold text-neutral-500">
            No hay jornadas finalizadas todavía.
          </p>
        )}
      </AppCard>

      <AppCard>
        <p className="font-bold">Histórico de MVPs</p>
        <p className="mt-2 text-sm text-neutral-500">
          Este bloque queda preparado como histórico de la temporada actual. Cuando cambies de temporada, cada una conservará sus MVPs por separado.
        </p>
      </AppCard>
    </div>
  )
}
