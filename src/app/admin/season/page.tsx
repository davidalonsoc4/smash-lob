"use client"

import { FormEvent, useState } from "react"
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
  finishSupabaseActiveSeason,
  startSupabaseSeason,
  updateSupabaseSeasonRoundSettings,
} from "@/lib/supabaseSeasons"

const allowedPlayerCounts = [8, 12, 16]
const lastSupabaseErrorStorageKey = "smash-lob-last-supabase-error"
const supabaseUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type SeasonPlayerSummary = {
  id: string
  displayName: string
  avatarInitials?: string
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
  return Array.from({ length: nextCount }, (_, index) => {
    return currentNames[index] ?? `Jugador ${index + 1}`
  })
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
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-neutral-700">
                  {player.avatarInitials ?? player.displayName.slice(0, 2)}
                </div>
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
  const { finishActiveSeason } = useSeasonSettings()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFinishSeason() {
    if (isSaving) {
      return
    }

    setIsSaving(true)
    setFeedback(null)
    setError(null)

    if (isSupabaseBackedId(activeSeasonId)) {
      try {
        await finishSupabaseActiveSeason({
          leagueId: activeLeagueId,
          seasonId: activeSeasonId,
        })
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
    setFeedback(t.adminSeason.seasonFinished)
    setIsSaving(false)
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

function NewSeasonForm({
  activeLeagueId,
  activeSeasonId,
  currentPlayers,
}: {
  activeLeagueId: string
  activeSeasonId: string
  currentPlayers: SeasonPlayerSummary[]
}) {
  const { t } = useI18n()
  const { hydrateSeasonSnapshot, playerProfiles, startNewSeason } =
    useSeasonSettings()
  const { hydrateMatches } = useMatchData()
  const leaguePlayers = playerProfiles.filter(
    (player) => player.leagueId === activeLeagueId
  )
  const [newSeasonName, setNewSeasonName] = useState("")
  const [playerCount, setPlayerCount] = useState(8)
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(
    currentPlayers.map((player) => player.id).slice(0, 8)
  )
  const [newPlayerNames, setNewPlayerNames] = useState<string[]>([])
  const [roundWindowMode, setRoundWindowMode] =
    useState<RoundWindowMode>("fixed-days")
  const [seasonStartsAt, setSeasonStartsAt] = useState("")
  const [roundWindowDays, setRoundWindowDays] = useState("15")
  const [requiresThreeSets, setRequiresThreeSets] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedRoundWindowDays = Number(roundWindowDays)
  const isFixedDaysMode = roundWindowMode === "fixed-days"
  const newPlayerSlotCount = Math.max(playerCount - selectedPlayerIds.length, 0)
  const visibleNewPlayerNames = resizePlayerNames(
    newPlayerNames,
    newPlayerSlotCount
  )
  const cleanNewPlayerNames = visibleNewPlayerNames.map((playerName) =>
    playerName.trim()
  )
  const hasValidPlayers =
    allowedPlayerCounts.includes(playerCount) &&
    selectedPlayerIds.length <= playerCount &&
    selectedPlayerIds.length + cleanNewPlayerNames.length === playerCount &&
    cleanNewPlayerNames.every(Boolean)
  const canStartSeason =
    !isSaving &&
    newSeasonName.trim().length > 0 &&
    hasValidPlayers &&
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
        Math.max(nextCount - selectedPlayerIds.length, 0)
      )
    )
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

    const settings = {
      leagueId: activeLeagueId,
      name: newSeasonName.trim(),
      playerIds: selectedPlayerIds,
      newPlayerNames: cleanNewPlayerNames,
      roundWindowMode,
      seasonStartsAt: isFixedDaysMode ? seasonStartsAt : null,
      roundWindowDays: isFixedDaysMode ? parsedRoundWindowDays : null,
      requiresThreeSets,
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
      startNewSeason(settings)
    }

    setNewSeasonName("")
    setFeedback(t.adminSeason.seasonStarted)
    setIsSaving(false)
  }

  return (
    <form onSubmit={handleStartSeason} className="space-y-5">
      <AppCard>
        <p className="font-bold">{t.adminSeason.newSeasonTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.adminSeason.newSeasonDescription}
        </p>

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

        <div className="mt-5 grid grid-cols-2 gap-2">
          {leaguePlayers.map((player) => {
            const isSelected = selectedPlayerIds.includes(player.id)
            const isDisabled = !isSelected && selectedPlayerIds.length >= playerCount

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => toggleExistingPlayer(player.id)}
                disabled={isDisabled}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-black disabled:opacity-40 ${
                  isSelected
                    ? "bg-neutral-950 text-white"
                    : "bg-neutral-100 text-neutral-800"
                }`}
              >
                {player.displayName}
              </button>
            )
          })}
        </div>

        {newPlayerSlotCount > 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {visibleNewPlayerNames.map((playerName, index) => (
            <label key={index} className="block">
              <span className="text-xs font-semibold text-neutral-500">
                {t.adminSeason.newPlayerName} {index + 1}
              </span>
              <input
                value={playerName}
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

        <div className="mt-4 rounded-2xl bg-neutral-100 px-4 py-3">
          <p className="text-sm font-black">{t.adminSeason.balancedCalendar}</p>
          <p className="mt-1 text-xs text-neutral-500">
            {t.adminSeason.balancedCalendarDescription}
          </p>
        </div>
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
        {isSaving ? "Guardando..." : t.adminSeason.startSeason}
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
            : t.adminSeason.newSeasonTitle}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {isActiveSeason
            ? t.adminSeason.description
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
        </>
      ) : (
        <NewSeasonForm
          key={`${activeSeason.id}-new`}
          activeLeagueId={activeLeague.id}
          activeSeasonId={activeSeason.id}
          currentPlayers={players}
        />
      )}
    </div>
  )
}
