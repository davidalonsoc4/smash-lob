"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useMatchData } from "@/context/MatchDataProvider"
import {
  RoundWindowMode,
  SeasonRoundSettings,
  useSeasonSettings,
} from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import {
  deleteSupabaseRoundMatches,
  deleteSupabaseSeason,
  finishSupabaseActiveSeason,
  startSupabaseExistingSeason,
  startSupabaseSeason,
  updateSupabaseSeasonRoundSettings,
} from "@/lib/supabaseSeasons"
import {
  generateManualCalendar,
  getNewPlayerToken,
  resolveManualCalendarDraft,
  type ManualCalendarMatchDraft,
} from "@/lib/calendar"
import { getEmptyCourtBooking } from "@/lib/courtBooking"
import { recordActivityEvent } from "@/lib/activity"
import { getPublicInviteUrl } from "@/lib/inviteUrls"

const allowedPlayerCounts = [4, 8, 12, 16]
const lastSupabaseErrorStorageKey = "smash-lob-last-supabase-error"
const supabaseUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type CalendarMode = "balanced" | "manual"

type SeasonPlayerSummary = {
  id: string
  displayName: string
  avatarInitials?: string | null
  avatarUrl?: string | null
}

type ManualCalendarTeamKey = "teamA" | "teamB"

type ManualCalendarRoundDraft = {
  round: number
  matches: {
    teamA: string[]
    teamB: string[]
  }[]
}

function getTotalRoundCount(playerCount: number) {
  return Math.max(playerCount - 1, 1)
}

function getMatchesPerRound(playerCount: number) {
  return Math.max(playerCount / 4, 1)
}

function createEmptyManualCalendar(playerCount: number): ManualCalendarRoundDraft[] {
  return Array.from({ length: getTotalRoundCount(playerCount) }, (_, roundIndex) => ({
    round: roundIndex + 1,
    matches: Array.from({ length: getMatchesPerRound(playerCount) }, () => ({
      teamA: ["", ""],
      teamB: ["", ""],
    })),
  }))
}

function getManualCalendarMatches(
  manualCalendar: ManualCalendarRoundDraft[]
): ManualCalendarMatchDraft[] {
  return manualCalendar.flatMap((round) =>
    round.matches.map((match) => ({
      round: round.round,
      teamA: match.teamA,
      teamB: match.teamB,
    }))
  )
}

function isManualCalendarComplete({
  manualCalendar,
  validPlayerValues,
}: {
  manualCalendar: ManualCalendarRoundDraft[]
  validPlayerValues: Set<string>
}) {
  return manualCalendar.every((round) => {
    const roundPlayerIds = round.matches.flatMap((match) => [
      ...match.teamA,
      ...match.teamB,
    ])

    return (
      roundPlayerIds.length > 0 &&
      roundPlayerIds.every(
        (playerId) => playerId.length > 0 && validPlayerValues.has(playerId)
      ) &&
      new Set(roundPlayerIds).size === roundPlayerIds.length
    )
  })
}

function updateManualCalendarSlot({
  manualCalendar,
  roundIndex,
  matchIndex,
  teamKey,
  playerIndex,
  value,
}: {
  manualCalendar: ManualCalendarRoundDraft[]
  roundIndex: number
  matchIndex: number
  teamKey: ManualCalendarTeamKey
  playerIndex: number
  value: string
}) {
  return manualCalendar.map((round, currentRoundIndex) => {
    if (currentRoundIndex !== roundIndex) {
      return round
    }

    return {
      ...round,
      matches: round.matches.map((match, currentMatchIndex) => {
        if (currentMatchIndex !== matchIndex) {
          return match
        }

        return {
          ...match,
          [teamKey]: match[teamKey].map((playerId, currentPlayerIndex) =>
            currentPlayerIndex === playerIndex ? value : playerId
          ),
        }
      }),
    }
  })
}

function isSupabaseBackedId(id: string) {
  return supabaseUuidPattern.test(id)
}

function recordSupabaseError(action: string, error: unknown) {
  const details =
    typeof error === "object" && error !== null
      ? error
      : { message: String(error) }

  window.localStorage.setItem(
    lastSupabaseErrorStorageKey,
    JSON.stringify({
      action,
      ...details,
      createdAt: new Date().toISOString(),
    })
  )
}

function resizePlayerNames(currentNames: string[], nextCount: number) {
  return Array.from({ length: nextCount }, (_, index) => currentNames[index] ?? "")
}

function getNextPlayerCount(currentCount: number) {
  return (
    allowedPlayerCounts.find((count) => count >= Math.max(currentCount, 4)) ??
    allowedPlayerCounts[allowedPlayerCounts.length - 1]
  )
}

function getDefaultNewSeasonName({
  seasonCount,
}: {
  seasonCount: number
}) {
  return `Temporada ${seasonCount + 1}`
}

function getActorFromSession(session: ReturnType<typeof useSession>["data"]) {
  return {
    actorEmail: session?.user?.email ?? "system@smash-lob.local",
    actorDisplayName: session?.user?.name ?? null,
  }
}

function InviteLinkCard({
  inviteCode,
  leagueName,
}: {
  inviteCode: string
  leagueName: string
}) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inviteUrl = getPublicInviteUrl(inviteCode)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setError(null)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError(t.adminSeason.inviteCopyError)
    }
  }

  if (!inviteCode) {
    return null
  }

  return (
    <AppCard>
      <p className="font-bold">{t.adminSeason.inviteTitle}</p>
      <p className="mt-2 text-sm text-neutral-500">
        {t.adminSeason.inviteDescription.replace("{leagueName}", leagueName)}
      </p>

      <div className="mt-4 rounded-2xl bg-neutral-100 px-4 py-3 text-xs font-semibold text-neutral-600 break-all">
        {inviteUrl}
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="mt-3 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white"
      >
        {copied ? t.adminSeason.inviteCopied : t.adminSeason.copyInviteLink}
      </button>

      {error ? (
        <p className="mt-3 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}
    </AppCard>
  )
}

function ActiveSeasonSettingsForm({
  activeLeagueId,
  activeSeasonId,
  roundSettings,
}: {
  activeLeagueId: string
  activeSeasonId: string
  roundSettings: SeasonRoundSettings
}) {
  const { t } = useI18n()
  const { updateSeasonRoundSettings } = useSeasonSettings()

  const [roundWindowMode, setRoundWindowMode] = useState(
    roundSettings.roundWindowMode
  )
  const [seasonStartsAt, setSeasonStartsAt] = useState(
    roundSettings.seasonStartsAt ?? ""
  )
  const [roundWindowDays, setRoundWindowDays] = useState(
    String(roundSettings.roundWindowDays ?? 15)
  )
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedRoundWindowDays = Number(roundWindowDays)
  const isFixedDaysMode = roundWindowMode === "fixed-days"
  const canSave =
    !isSaving &&
    (roundWindowMode === "none" ||
      (seasonStartsAt.length > 0 &&
        Number.isFinite(parsedRoundWindowDays) &&
        parsedRoundWindowDays >= 1))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSave) {
      return
    }

    const nextSettings = {
      leagueId: activeLeagueId,
      seasonId: activeSeasonId,
      roundWindowMode,
      seasonStartsAt: isFixedDaysMode ? seasonStartsAt : null,
      roundWindowDays: isFixedDaysMode ? parsedRoundWindowDays : null,
      requiresThreeSets: roundSettings.requiresThreeSets,
    }

    setIsSaving(true)
    setError(null)

    if (isSupabaseBackedId(activeSeasonId)) {
      try {
        await updateSupabaseSeasonRoundSettings(nextSettings)
      } catch (supabaseError) {
        recordSupabaseError("update-season-round-settings", supabaseError)
        setError(
          "No se han podido guardar los ajustes en Supabase. Revisa smash-lob-last-supabase-error."
        )
        setIsSaving(false)
        return
      }
    }

    updateSeasonRoundSettings(nextSettings)
    setSaved(true)
    setIsSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AppCard>
        <p className="font-bold">{t.adminSeason.roundWindowTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.adminSeason.roundWindowDescription}
        </p>

        <div className="mt-5 grid gap-3">
          {(["none", "fixed-days"] as RoundWindowMode[]).map((mode) => (
            <label
              key={mode}
              className="flex items-start gap-3 rounded-2xl border border-neutral-200 p-4"
            >
              <input
                type="radio"
                name="roundWindowMode"
                value={mode}
                checked={roundWindowMode === mode}
                onChange={() => {
                  setRoundWindowMode(mode)
                  setSaved(false)
                  setError(null)
                }}
                className="mt-1"
              />

              <span>
                <span className="block text-sm font-black">
                  {mode === "none"
                    ? t.adminSeason.noWindowTitle
                    : t.adminSeason.fixedDaysTitle}
                </span>
                <span className="mt-1 block text-xs text-neutral-500">
                  {mode === "none"
                    ? t.adminSeason.noWindowDescription
                    : t.adminSeason.fixedDaysDescription}
                </span>
              </span>
            </label>
          ))}
        </div>
      </AppCard>

      {isFixedDaysMode ? (
        <AppCard>
          <p className="font-bold">{t.adminSeason.fixedDaysSettings}</p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">
                {t.adminSeason.seasonStartDate}
              </span>

              <input
                type="date"
                value={seasonStartsAt}
                onChange={(event) => {
                  setSeasonStartsAt(event.target.value)
                  setSaved(false)
                }}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">
                {t.adminSeason.daysPerRound}
              </span>

              <input
                type="number"
                min={1}
                value={roundWindowDays}
                onChange={(event) => {
                  setRoundWindowDays(event.target.value)
                  setSaved(false)
                }}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
              />
            </label>
          </div>
        </AppCard>
      ) : null}

      <button
        type="submit"
        disabled={!canSave}
        className="w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
      >
        {isSaving ? "Guardando..." : t.adminSeason.save}
      </button>

      {error ? (
        <p className="text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      {saved ? (
        <p className="text-center text-sm font-semibold text-neutral-600">
          {t.adminSeason.saved}
        </p>
      ) : null}
    </form>
  )
}

function SeasonPlayersStatus({
  activeLeagueId,
  players,
}: {
  activeLeagueId: string
  players: SeasonPlayerSummary[]
}) {
  const { t } = useI18n()
  const { isPlayerClaimed } = useLeagueAccess()

  return (
    <AppCard>
      <p className="font-bold">{t.adminSeason.activePlayersTitle}</p>
      <p className="mt-2 text-sm text-neutral-500">
        {t.adminSeason.activePlayersDescription}
      </p>

      <div className="mt-4 space-y-2">
        {players.map((player) => {
          const isClaimed = isPlayerClaimed(activeLeagueId, player.id)

          return (
            <div
              key={player.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-100 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <PlayerAvatar player={player} size="sm" className="bg-white text-neutral-700" />
                <p className="truncate text-sm font-black">
                  {player.displayName}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                  isClaimed
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {isClaimed
                  ? t.adminSeason.playerLinked
                  : t.adminSeason.playerPending}
              </span>
            </div>
          )
        })}
      </div>
    </AppCard>
  )
}

function FinishSeasonPanel({
  activeLeagueId,
  activeSeasonId,
}: {
  activeLeagueId: string
  activeSeasonId: string
}) {
  const { t } = useI18n()
  const router = useRouter()
  const { data: session } = useSession()
  const { finishActiveSeason, hydrateSeasonSnapshot } = useSeasonSettings()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFinishSeason() {
    if (isSaving) {
      return
    }

    const confirmed = window.confirm(t.adminSeason.finishConfirmMessage)

    if (!confirmed) {
      return
    }

    setIsSaving(true)
    setFeedback(null)
    setError(null)

    if (isSupabaseBackedId(activeSeasonId)) {
      try {
        const seasonSnapshot = await finishSupabaseActiveSeason({
          leagueId: activeLeagueId,
          seasonId: activeSeasonId,
        })

        hydrateSeasonSnapshot(seasonSnapshot)
      } catch (supabaseError) {
        recordSupabaseError("finish-active-season", supabaseError)
        setError(
          "No se ha podido finalizar la temporada en Supabase. Revisa smash-lob-last-supabase-error."
        )
        setIsSaving(false)
        return
      }
    }

    finishActiveSeason(activeLeagueId)

    try {
      await recordActivityEvent({
        leagueId: activeLeagueId,
        seasonId: activeSeasonId,
        ...getActorFromSession(session),
        type: "season_finished",
        title: "Temporada cerrada",
        description:
          "La temporada se ha cerrado. La liga queda pendiente de crear una nueva temporada activa.",
      })
    } catch {
      // El cierre no debe fallar si el registro de actividad no entra.
    }

    setFeedback(t.adminSeason.seasonFinished)
    setIsSaving(false)
    router.push("/")
  }

  return (
    <AppCard>
      <p className="font-bold">{t.adminSeason.finishTitle}</p>
      <p className="mt-2 text-sm text-neutral-500">
        {t.adminSeason.finishDescription}
      </p>

      <button
        type="button"
        onClick={handleFinishSeason}
        disabled={isSaving}
        className="mt-4 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
      >
        {isSaving ? "Guardando..." : t.adminSeason.finishSeason}
      </button>

      {error ? (
        <p className="mt-4 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      {feedback ? (
        <p className="mt-4 text-center text-sm font-semibold text-neutral-600">
          {feedback}
        </p>
      ) : null}
    </AppCard>
  )
}


function StartSeasonPanel({
  activeLeagueId,
  activeSeasonId,
}: {
  activeLeagueId: string
  activeSeasonId: string
}) {
  const router = useRouter()
  const { data: session } = useSession()
  const { hydrateSeasonSnapshot, startSeason } = useSeasonSettings()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStartSeason() {
    if (isSaving) {
      return
    }

    const confirmed = window.confirm(
      "¿Comenzar la temporada? A partir de ese momento se podrán programar partidos y registrar resultados."
    )

    if (!confirmed) {
      return
    }

    setIsSaving(true)
    setError(null)

    if (isSupabaseBackedId(activeSeasonId)) {
      try {
        const snapshot = await startSupabaseExistingSeason({
          leagueId: activeLeagueId,
          seasonId: activeSeasonId,
        })

        hydrateSeasonSnapshot(snapshot)
      } catch (supabaseError) {
        recordSupabaseError("start-existing-season", supabaseError)
        setError(
          "No se ha podido comenzar la temporada en Supabase. Revisa smash-lob-last-supabase-error."
        )
        setIsSaving(false)
        return
      }
    }

    startSeason(activeLeagueId, activeSeasonId)

    try {
      await recordActivityEvent({
        leagueId: activeLeagueId,
        seasonId: activeSeasonId,
        ...getActorFromSession(session),
        type: "season_created",
        title: "Temporada comenzada",
        description: "La temporada ha pasado de próximamente a activa.",
      })
    } catch {
      // La temporada ya ha comenzado; la actividad es auxiliar.
    }

    setIsSaving(false)
    router.push("/")
  }

  return (
    <AppCard>
      <p className="font-bold">Comenzar temporada</p>
      <p className="mt-2 text-sm text-neutral-500">
        La temporada está creada, pero todavía no está activa. Al comenzar se desbloquean la programación de partidos y el registro de resultados.
      </p>

      <button
        type="button"
        onClick={handleStartSeason}
        disabled={isSaving}
        className="mt-4 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
      >
        {isSaving ? "Guardando..." : "Comenzar temporada"}
      </button>

      {error ? (
        <p className="mt-4 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}
    </AppCard>
  )
}

function SeasonDangerZone({
  activeLeagueId,
  activeSeasonId,
  totalRounds,
}: {
  activeLeagueId: string
  activeSeasonId: string
  totalRounds: number
}) {
  const router = useRouter()
  const { deleteSeason, hydrateSeasonSnapshot } = useSeasonSettings()
  const { deleteRoundMatches, deleteSeasonMatches } = useMatchData()
  const [selectedRound, setSelectedRound] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function handleDeleteRound() {
    if (isSaving) {
      return
    }

    const confirmed = window.confirm(
      `¿Eliminar la Jornada ${selectedRound}? Se borrarán sus partidos y resultados.`
    )

    if (!confirmed) {
      return
    }

    setIsSaving(true)
    setError(null)
    setFeedback(null)

    if (isSupabaseBackedId(activeSeasonId)) {
      try {
        await deleteSupabaseRoundMatches({
          seasonId: activeSeasonId,
          round: selectedRound,
        })
      } catch (supabaseError) {
        recordSupabaseError("delete-round-matches", supabaseError)
        setError(
          "No se ha podido eliminar la jornada en Supabase. Revisa smash-lob-last-supabase-error."
        )
        setIsSaving(false)
        return
      }
    }

    deleteRoundMatches(activeSeasonId, selectedRound)
    setFeedback(`Jornada ${selectedRound} eliminada.`)
    setIsSaving(false)
  }

  async function handleDeleteSeason() {
    if (isSaving) {
      return
    }

    const confirmed = window.confirm(
      "¿Eliminar la temporada completa? Se borrarán sus jornadas, partidos y resultados."
    )

    if (!confirmed) {
      return
    }

    setIsSaving(true)
    setError(null)
    setFeedback(null)

    if (isSupabaseBackedId(activeSeasonId)) {
      try {
        const snapshot = await deleteSupabaseSeason({
          leagueId: activeLeagueId,
          seasonId: activeSeasonId,
        })

        hydrateSeasonSnapshot(snapshot)
      } catch (supabaseError) {
        recordSupabaseError("delete-season", supabaseError)
        setError(
          "No se ha podido eliminar la temporada en Supabase. Revisa smash-lob-last-supabase-error."
        )
        setIsSaving(false)
        return
      }
    }

    deleteSeason(activeLeagueId, activeSeasonId)
    deleteSeasonMatches(activeSeasonId)
    setIsSaving(false)
    router.push("/")
  }

  return (
    <AppCard>
      <p className="font-bold">Zona de eliminación</p>
      <p className="mt-2 text-sm text-neutral-500">
        Permite borrar jornadas o temporadas completas si el calendario se creó mal. Es una acción destructiva.
      </p>

      <div className="mt-4 rounded-2xl bg-neutral-100 p-3">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
            Jornada a eliminar
          </span>
          <select
            value={selectedRound}
            onChange={(event) => setSelectedRound(Number(event.target.value))}
            disabled={isSaving}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-black text-neutral-950 outline-none"
          >
            {Array.from({ length: totalRounds }, (_, index) => index + 1).map(
              (round) => (
                <option key={round} value={round}>
                  Jornada {round}
                </option>
              )
            )}
          </select>
        </label>

        <button
          type="button"
          onClick={handleDeleteRound}
          disabled={isSaving}
          className="mt-3 w-full rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700 disabled:text-red-300"
        >
          Eliminar jornada
        </button>
      </div>

      <button
        type="button"
        onClick={handleDeleteSeason}
        disabled={isSaving}
        className="mt-3 w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white disabled:bg-red-200"
      >
        Eliminar temporada completa
      </button>

      {error ? (
        <p className="mt-4 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      {feedback ? (
        <p className="mt-4 text-center text-sm font-semibold text-neutral-600">
          {feedback}
        </p>
      ) : null}
    </AppCard>
  )
}

function NewSeasonForm({
  activeLeagueId,
  activeLeagueName,
  activeSeasonId,
  currentPlayers,
}: {
  activeLeagueId: string
  activeLeagueName: string
  activeSeasonId: string
  currentPlayers: SeasonPlayerSummary[]
}) {
  const { t } = useI18n()
  const { data: session } = useSession()
  const { hydrateSeasonSnapshot, playerProfiles, seasons, startNewSeason } =
    useSeasonSettings()
  const { createSeasonMatches, hydrateMatches } = useMatchData()
  const { getLeagueInviteCode } = useLeagueAccess()
  const leaguePlayers = playerProfiles.filter(
    (player) => player.leagueId === activeLeagueId
  )
  const leagueSeasonCount = seasons.filter(
    (season) => season.leagueId === activeLeagueId
  ).length
  const defaultPlayerCount = getNextPlayerCount(currentPlayers.length)
  const [newSeasonName, setNewSeasonName] = useState(
    getDefaultNewSeasonName({ seasonCount: leagueSeasonCount })
  )
  const [playerCount, setPlayerCount] = useState(defaultPlayerCount)
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(
    currentPlayers.map((player) => player.id).slice(0, defaultPlayerCount)
  )
  const [newPlayerNames, setNewPlayerNames] = useState<string[]>([])
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("balanced")
  const [manualCalendar, setManualCalendar] = useState<ManualCalendarRoundDraft[]>(
    () => createEmptyManualCalendar(defaultPlayerCount)
  )
  const [roundWindowMode, setRoundWindowMode] =
    useState<RoundWindowMode>("none")
  const [seasonStartsAt, setSeasonStartsAt] = useState("")
  const [roundWindowDays, setRoundWindowDays] = useState("15")
  const [requiresThreeSets, setRequiresThreeSets] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inviteCode = getLeagueInviteCode(activeLeagueId)

  const parsedRoundWindowDays = Number(roundWindowDays)
  const isFixedDaysMode = roundWindowMode === "fixed-days"
  const selectedPlayerIdSet = useMemo(
    () => new Set(selectedPlayerIds),
    [selectedPlayerIds]
  )
  const continuingPlayers = leaguePlayers.filter((player) =>
    selectedPlayerIdSet.has(player.id)
  )
  const removedPlayers = currentPlayers.filter(
    (player) => !selectedPlayerIdSet.has(player.id)
  )
  const newPlayerSlotCount = Math.max(playerCount - selectedPlayerIds.length, 0)
  const visibleNewPlayerNames = resizePlayerNames(
    newPlayerNames,
    newPlayerSlotCount
  )
  const cleanNewPlayerNames = visibleNewPlayerNames.map((playerName) =>
    playerName.trim()
  )
  const manualPlayerOptions = [
    ...selectedPlayerIds.map((playerId) => {
      const player = leaguePlayers.find((item) => item.id === playerId)

      return {
        value: playerId,
        label: player?.displayName ?? playerId,
      }
    }),
    ...visibleNewPlayerNames.map((playerName, index) => ({
      value: getNewPlayerToken(index),
      label: playerName.trim() || `Sustituto ${index + 1}`,
    })),
  ]
  const validManualPlayerValues = new Set(
    manualPlayerOptions.map((option) => option.value)
  )
  const manualCalendarMatches = getManualCalendarMatches(manualCalendar)
  const isManualCalendarReady =
    calendarMode !== "manual" ||
    isManualCalendarComplete({
      manualCalendar,
      validPlayerValues: validManualPlayerValues,
    })
  const hasValidPlayers =
    allowedPlayerCounts.includes(playerCount) &&
    selectedPlayerIds.length <= playerCount &&
    selectedPlayerIds.length + cleanNewPlayerNames.length === playerCount &&
    cleanNewPlayerNames.every(Boolean)
  const canStartSeason =
    !isSaving &&
    newSeasonName.trim().length > 0 &&
    hasValidPlayers &&
    isManualCalendarReady &&
    (roundWindowMode === "none" ||
      (seasonStartsAt.length > 0 &&
        Number.isFinite(parsedRoundWindowDays) &&
        parsedRoundWindowDays >= 1))

  function handlePlayerCountChange(nextCount: number) {
    setPlayerCount(nextCount)
    setSelectedPlayerIds((currentPlayerIds) =>
      currentPlayerIds.slice(0, nextCount)
    )
    setNewPlayerNames((currentNames) =>
      resizePlayerNames(
        currentNames,
        Math.max(nextCount - Math.min(selectedPlayerIds.length, nextCount), 0)
      )
    )
    setManualCalendar(createEmptyManualCalendar(nextCount))
    setFeedback(null)
  }

  function toggleExistingPlayer(playerId: string) {
    setSelectedPlayerIds((currentPlayerIds) => {
      if (currentPlayerIds.includes(playerId)) {
        return currentPlayerIds.filter(
          (currentPlayerId) => currentPlayerId !== playerId
        )
      }

      if (currentPlayerIds.length >= playerCount) {
        return currentPlayerIds
      }

      return [...currentPlayerIds, playerId]
    })
    setFeedback(null)
  }

  async function handleStartSeason(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canStartSeason) {
      return
    }

    const manualMatches =
      calendarMode === "manual" ? manualCalendarMatches : undefined
    const settings = {
      leagueId: activeLeagueId,
      name: newSeasonName.trim(),
      playerIds: selectedPlayerIds,
      newPlayerNames: cleanNewPlayerNames,
      roundWindowMode,
      seasonStartsAt: isFixedDaysMode ? seasonStartsAt : null,
      roundWindowDays: isFixedDaysMode ? parsedRoundWindowDays : null,
      requiresThreeSets,
      manualMatches,
    }

    setIsSaving(true)
    setFeedback(null)
    setError(null)

    if (isSupabaseBackedId(activeLeagueId)) {
      try {
        const result = await startSupabaseSeason({
          ...settings,
          activeSeasonId,
        })

        hydrateSeasonSnapshot(result.seasonSnapshot)
        hydrateMatches(result.matches)
      } catch (supabaseError) {
        recordSupabaseError("start-new-season", supabaseError)
        setError(
          "No se ha podido crear la nueva temporada en Supabase. Revisa smash-lob-last-supabase-error."
        )
        setIsSaving(false)
        return
      }
    } else {
      const result = startNewSeason(settings)

      if (calendarMode === "manual" && manualMatches) {
        const resolvedManualMatches = resolveManualCalendarDraft({
          matches: manualMatches,
          newPlayerIds: result.newPlayerIds,
        })
        const localManualMatches = generateManualCalendar({
          leagueId: activeLeagueId,
          seasonId: result.season.id,
          matches: resolvedManualMatches,
        }).map((match) => ({
          ...match,
          courtBooking: getEmptyCourtBooking(),
        }))

        hydrateMatches(localManualMatches)
      } else {
        createSeasonMatches({
          leagueId: activeLeagueId,
          seasonId: result.season.id,
          playerIds: result.playerIds,
        })
      }
    }

    try {
      await recordActivityEvent({
        leagueId: activeLeagueId,
        seasonId: undefined,
        ...getActorFromSession(session),
        type: "season_created",
        title: "Nueva temporada creada",
        description: `${settings.name} creada en estado próximamente con ${playerCount} jugadores y calendario ${calendarMode === "manual" ? "manual" : "equilibrado"}.`,
        metadata: {
          playerCount,
          existingPlayerIds: selectedPlayerIds,
          newPlayerNames: cleanNewPlayerNames,
          calendarMode,
        },
      })
    } catch {
      // La temporada ya está creada; la actividad es auxiliar.
    }

    setNewSeasonName("")
    setFeedback("Temporada creada. Puedes comenzarla cuando esté todo preparado.")
    setIsSaving(false)
  }

  return (
    <form onSubmit={handleStartSeason} className="space-y-5">
      <AppCard>
        <p className="font-bold">{t.adminSeason.newSeasonTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.adminSeason.newSeasonDescription}
        </p>

        <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-black">No hay temporada activa.</p>
          <p className="mt-1">
            Confirma quién continúa, quita bajas, añade sustitutos y se generarán las jornadas de la nueva temporada, pero quedará en estado próximamente hasta que pulses Comenzar temporada.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">
              {t.adminSeason.newSeasonName}
            </span>

            <input
              value={newSeasonName}
              onChange={(event) => {
                setNewSeasonName(event.target.value)
                setFeedback(null)
              }}
              placeholder={t.adminSeason.newSeasonNamePlaceholder}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
            />
          </label>

          <div>
            <p className="text-sm font-semibold text-neutral-700">
              {t.adminSeason.playerCount}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {allowedPlayerCounts.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => handlePlayerCountChange(count)}
                  className={`rounded-2xl px-4 py-3 text-sm font-black ${
                    playerCount === count
                      ? "bg-neutral-950 text-white"
                      : "bg-neutral-100 text-neutral-800"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <p className="font-bold">{t.adminSeason.seasonPlayersTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.adminSeason.seasonPlayersDescription}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-neutral-100 px-4 py-3">
            <p className="text-xs font-semibold text-neutral-500">Seleccionados</p>
            <p className="text-lg font-black">{selectedPlayerIds.length}/{playerCount}</p>
          </div>
          <div className="rounded-2xl bg-neutral-100 px-4 py-3">
            <p className="text-xs font-semibold text-neutral-500">Sustitutos</p>
            <p className="text-lg font-black">{newPlayerSlotCount}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {leaguePlayers.map((player) => {
            const isSelected = selectedPlayerIds.includes(player.id)
            const wasInPreviousSeason = currentPlayers.some(
              (currentPlayer) => currentPlayer.id === player.id
            )
            const isDisabled = !isSelected && selectedPlayerIds.length >= playerCount

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => toggleExistingPlayer(player.id)}
                disabled={isDisabled}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black disabled:opacity-40 ${
                  isSelected
                    ? "bg-neutral-950 text-white"
                    : "bg-neutral-100 text-neutral-800"
                }`}
              >
                <PlayerAvatar
                  player={player}
                  size="sm"
                  className={isSelected ? "bg-white text-neutral-900" : ""}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{player.displayName}</span>
                  <span className={`mt-0.5 block text-xs ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}>
                    {isSelected
                      ? "Continúa"
                      : wasInPreviousSeason
                        ? "Baja esta temporada"
                        : "Jugador de la liga"}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {continuingPlayers.length > 0 ? (
          <p className="mt-4 text-xs font-semibold text-neutral-500">
            Continúan: {continuingPlayers.map((player) => player.displayName).join(", ")}
          </p>
        ) : null}

        {removedPlayers.length > 0 ? (
          <p className="mt-2 text-xs font-semibold text-amber-700">
            No entran en la nueva temporada: {removedPlayers.map((player) => player.displayName).join(", ")}
          </p>
        ) : null}

        {newPlayerSlotCount > 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {visibleNewPlayerNames.map((playerName, index) => (
              <label key={index} className="block">
                <span className="text-xs font-semibold text-neutral-500">
                  {t.adminSeason.newPlayerName} {index + 1}
                </span>
                <input
                  value={playerName}
                  placeholder={`Sustituto ${index + 1}`}
                  onChange={(event) => {
                    const nextNames = [...visibleNewPlayerNames]
                    nextNames[index] = event.target.value
                    setNewPlayerNames(nextNames)
                    setFeedback(null)
                  }}
                  className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
                />
              </label>
            ))}
          </div>
        ) : null}
      </AppCard>

      <AppCard>
        <p className="font-bold">{t.adminSeason.calendarTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.adminSeason.calendarDescription}
        </p>

        <div className="mt-5 space-y-3">
          {(["balanced", "manual"] as CalendarMode[]).map((mode) => (
            <label
              key={mode}
              className="flex items-start gap-3 rounded-2xl border border-neutral-200 p-4"
            >
              <input
                type="radio"
                name="calendarMode"
                value={mode}
                checked={calendarMode === mode}
                onChange={() => {
                  setCalendarMode(mode)
                  setFeedback(null)
                }}
                className="mt-1"
              />

              <span>
                <span className="block text-sm font-black">
                  {mode === "balanced"
                    ? t.adminSeason.balancedCalendar
                    : t.adminSeason.manualCalendar}
                </span>
                <span className="mt-1 block text-xs text-neutral-500">
                  {mode === "balanced"
                    ? t.adminSeason.balancedCalendarDescription
                    : t.adminSeason.manualCalendarDescription}
                </span>
              </span>
            </label>
          ))}
        </div>

        {calendarMode === "manual" ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
              <p className="font-black">
                {getTotalRoundCount(playerCount)} jornadas · {getMatchesPerRound(playerCount)} {getMatchesPerRound(playerCount) === 1 ? "partido" : "partidos"} por jornada
              </p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                Elige manualmente la Pareja A y la Pareja B de cada partido. Cada desplegable usa los jugadores seleccionados para la nueva temporada.
              </p>
            </div>

            {manualCalendar.map((round, roundIndex) => (
              <div
                key={round.round}
                className="rounded-2xl border border-neutral-200 p-3"
              >
                <p className="font-black">Jornada {round.round}</p>

                <div className="mt-3 space-y-4">
                  {round.matches.map((manualMatch, matchIndex) => {
                    const selectedRoundPlayerIds = [
                      ...manualMatch.teamA,
                      ...manualMatch.teamB,
                    ].filter(Boolean)
                    const hasDuplicatePlayers =
                      new Set(selectedRoundPlayerIds).size !== selectedRoundPlayerIds.length

                    return (
                      <div
                        key={`${round.round}-${matchIndex}`}
                        className="rounded-2xl bg-neutral-100 p-3"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-sm font-black">
                            Partido {matchIndex + 1}
                          </p>
                          {hasDuplicatePlayers ? (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800">
                              Revisa duplicados
                            </span>
                          ) : null}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {(["teamA", "teamB"] as ManualCalendarTeamKey[]).map((teamKey) => (
                            <div key={teamKey} className="rounded-2xl bg-white p-3">
                              <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
                                {teamKey === "teamA" ? "Pareja A" : "Pareja B"}
                              </p>

                              <div className="mt-2 space-y-2">
                                {manualMatch[teamKey].map((playerId, playerIndex) => (
                                  <select
                                    key={`${teamKey}-${playerIndex}`}
                                    value={playerId}
                                    onChange={(event) => {
                                      setManualCalendar((currentCalendar) =>
                                        updateManualCalendarSlot({
                                          manualCalendar: currentCalendar,
                                          roundIndex,
                                          matchIndex,
                                          teamKey,
                                          playerIndex,
                                          value: event.target.value,
                                        })
                                      )
                                      setFeedback(null)
                                    }}
                                    className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm font-bold text-neutral-950 outline-none"
                                  >
                                    <option value="">Jugador {playerIndex + 1}</option>
                                    {manualPlayerOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {!isManualCalendarReady ? (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                Completa todos los desplegables sin repetir jugador dentro de la misma jornada para poder crear la temporada.
              </p>
            ) : null}
          </div>
        ) : null}
      </AppCard>

      <AppCard>
        <p className="font-bold">{t.adminSeason.resultRulesTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.adminSeason.resultRulesDescription}
        </p>

        <label className="mt-5 flex items-start gap-3 rounded-2xl border border-neutral-200 p-4">
          <input
            type="checkbox"
            checked={requiresThreeSets}
            onChange={(event) => {
              setRequiresThreeSets(event.target.checked)
              setFeedback(null)
            }}
            className="mt-1"
          />

          <span>
            <span className="block text-sm font-black">
              {t.adminSeason.requireThreeSetsTitle}
            </span>
            <span className="mt-1 block text-xs text-neutral-500">
              {t.adminSeason.requireThreeSetsDescription}
            </span>
          </span>
        </label>
      </AppCard>

      <AppCard>
        <p className="font-bold">{t.adminSeason.roundWindowTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.adminSeason.newRoundWindowDescription}
        </p>

        <div className="mt-5 space-y-3">
          {(["none", "fixed-days"] as RoundWindowMode[]).map((mode) => (
            <label
              key={mode}
              className="flex items-start gap-3 rounded-2xl border border-neutral-200 p-4"
            >
              <input
                type="radio"
                name="newRoundWindowMode"
                value={mode}
                checked={roundWindowMode === mode}
                onChange={() => {
                  setRoundWindowMode(mode)
                  setFeedback(null)
                }}
                className="mt-1"
              />

              <span>
                <span className="block text-sm font-black">
                  {mode === "none"
                    ? t.adminSeason.noWindowTitle
                    : t.adminSeason.fixedDaysTitle}
                </span>
                <span className="mt-1 block text-xs text-neutral-500">
                  {mode === "none"
                    ? t.adminSeason.noWindowDescription
                    : t.adminSeason.fixedDaysDescription}
                </span>
              </span>
            </label>
          ))}
        </div>

        {isFixedDaysMode ? (
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">
                {t.adminSeason.seasonStartDate}
              </span>

              <input
                type="date"
                value={seasonStartsAt}
                onChange={(event) => {
                  setSeasonStartsAt(event.target.value)
                  setFeedback(null)
                }}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">
                {t.adminSeason.daysPerRound}
              </span>

              <input
                type="number"
                min={1}
                value={roundWindowDays}
                onChange={(event) => {
                  setRoundWindowDays(event.target.value)
                  setFeedback(null)
                }}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
              />
            </label>
          </div>
        ) : null}
      </AppCard>

      <button
        type="submit"
        disabled={!canStartSeason}
        className="w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
      >
        {isSaving ? "Guardando..." : "Crear temporada"}
      </button>

      {error ? (
        <p className="text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      {feedback ? (
        <p className="text-center text-sm font-semibold text-neutral-600">
          {feedback}
        </p>
      ) : null}

      {feedback && inviteCode ? (
        <InviteLinkCard
          inviteCode={inviteCode}
          leagueName={activeLeagueName}
        />
      ) : null}
    </form>
  )
}

export default function AdminSeasonPage() {
  const { t } = useI18n()
  const { isLeagueAdmin } = useLeagueAccess()
  const { activeLeague, activeSeason, roundSettings, players } =
    useCurrentLeagueData()
  const canAccessAdmin = isLeagueAdmin(activeLeague.id)
  const isActiveSeason = activeSeason.status === "active"
  const isUpcomingSeason = activeSeason.status === "upcoming"

  if (!canAccessAdmin) {
    return (
      <div className="space-y-5">
        <header className="pt-2">
          <BackButton fallbackHref="/settings" label={t.common.back} />

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
          {activeLeague.name} - {activeSeason.name}
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
          {isActiveSeason
            ? t.adminSeason.title
            : isUpcomingSeason
              ? "Temporada próximamente"
              : t.adminSeason.newSeasonTitle}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {isActiveSeason
            ? t.adminSeason.description
            : isUpcomingSeason
              ? "La temporada está creada. Comiénzala cuando esté preparada para jugarse."
              : t.adminSeason.finishedDescription}
        </p>
      </header>

      {isActiveSeason ? (
        <>
          <ActiveSeasonSettingsForm
            key={activeSeason.id}
            activeLeagueId={activeLeague.id}
            activeSeasonId={activeSeason.id}
            roundSettings={roundSettings}
          />

          <SeasonPlayersStatus
            activeLeagueId={activeLeague.id}
            players={players}
          />

          <FinishSeasonPanel
            activeLeagueId={activeLeague.id}
            activeSeasonId={activeSeason.id}
          />

          <SeasonDangerZone
            activeLeagueId={activeLeague.id}
            activeSeasonId={activeSeason.id}
            totalRounds={activeSeason.totalRounds}
          />
        </>
      ) : isUpcomingSeason ? (
        <>
          <StartSeasonPanel
            activeLeagueId={activeLeague.id}
            activeSeasonId={activeSeason.id}
          />

          <ActiveSeasonSettingsForm
            key={activeSeason.id}
            activeLeagueId={activeLeague.id}
            activeSeasonId={activeSeason.id}
            roundSettings={roundSettings}
          />

          <SeasonPlayersStatus
            activeLeagueId={activeLeague.id}
            players={players}
          />

          <SeasonDangerZone
            activeLeagueId={activeLeague.id}
            activeSeasonId={activeSeason.id}
            totalRounds={activeSeason.totalRounds}
          />
        </>
      ) : (
        <NewSeasonForm
          key={`${activeSeason.id}-new`}
          activeLeagueId={activeLeague.id}
          activeLeagueName={activeLeague.name}
          activeSeasonId={activeSeason.id}
          currentPlayers={players}
        />
      )}
    </div>
  )
}
