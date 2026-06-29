"use client"

import { FormEvent, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import {
  SeasonRoundSettings,
  useSeasonSettings,
} from "@/context/SeasonSettingsProvider"
import { playerProfiles } from "@/data/fakeData"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"

function AdminSeasonForm({
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
  const [requiresThreeSets, setRequiresThreeSets] = useState(
    roundSettings.requiresThreeSets
  )
  const [saved, setSaved] = useState(false)

  const parsedRoundWindowDays = Number(roundWindowDays)
  const isFixedDaysMode = roundWindowMode === "fixed-days"

  const canSave =
    roundWindowMode === "none" ||
    (seasonStartsAt.length > 0 &&
      Number.isFinite(parsedRoundWindowDays) &&
      parsedRoundWindowDays >= 1)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSave) {
      return
    }

    updateSeasonRoundSettings({
      leagueId: activeLeagueId,
      seasonId: activeSeasonId,
      roundWindowMode,
      seasonStartsAt: isFixedDaysMode ? seasonStartsAt : null,
      roundWindowDays: isFixedDaysMode ? parsedRoundWindowDays : null,
      requiresThreeSets,
    })

    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AppCard>
        <p className="font-bold">{t.adminSeason.roundWindowTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.adminSeason.roundWindowDescription}
        </p>

        <div className="mt-5 space-y-3">
          <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 p-4">
            <input
              type="radio"
              name="roundWindowMode"
              value="none"
              checked={roundWindowMode === "none"}
              onChange={() => {
                setRoundWindowMode("none")
                setSaved(false)
              }}
              className="mt-1"
            />

            <span>
              <span className="block text-sm font-black">
                {t.adminSeason.noWindowTitle}
              </span>
              <span className="mt-1 block text-xs text-neutral-500">
                {t.adminSeason.noWindowDescription}
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 p-4">
            <input
              type="radio"
              name="roundWindowMode"
              value="fixed-days"
              checked={roundWindowMode === "fixed-days"}
              onChange={() => {
                setRoundWindowMode("fixed-days")
                setSaved(false)
              }}
              className="mt-1"
            />

            <span>
              <span className="block text-sm font-black">
                {t.adminSeason.fixedDaysTitle}
              </span>
              <span className="mt-1 block text-xs text-neutral-500">
                {t.adminSeason.fixedDaysDescription}
              </span>
            </span>
          </label>
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
              setSaved(false)
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

      <button
        type="submit"
        disabled={!canSave}
        className="w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
      >
        {t.adminSeason.save}
      </button>

      {saved ? (
        <p className="text-center text-sm font-semibold text-neutral-600">
          {t.adminSeason.saved}
        </p>
      ) : null}
    </form>
  )
}

function SeasonLifecycleForm({
  activeLeagueId,
  activeSeasonName,
  activeSeasonStatus,
  activeSeasonTotalRounds,
  activeSeasonPlayerIds,
}: {
  activeLeagueId: string
  activeSeasonName: string
  activeSeasonStatus: "active" | "finished"
  activeSeasonTotalRounds: number
  activeSeasonPlayerIds: string[]
}) {
  const { t } = useI18n()
  const { finishActiveSeason, startNewSeason } = useSeasonSettings()
  const leaguePlayers = playerProfiles.filter(
    (player) => player.leagueId === activeLeagueId
  )
  const [newSeasonName, setNewSeasonName] = useState("")
  const [newSeasonRounds, setNewSeasonRounds] = useState(
    String(activeSeasonTotalRounds)
  )
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(
    activeSeasonPlayerIds.length > 0
      ? activeSeasonPlayerIds
      : leaguePlayers.map((player) => player.id)
  )
  const [feedback, setFeedback] = useState<string | null>(null)

  const parsedRounds = Number(newSeasonRounds)
  const canStartSeason =
    newSeasonName.trim().length > 0 &&
    Number.isFinite(parsedRounds) &&
    parsedRounds >= 1 &&
    selectedPlayerIds.length > 0

  function togglePlayer(playerId: string) {
    setSelectedPlayerIds((currentPlayerIds) =>
      currentPlayerIds.includes(playerId)
        ? currentPlayerIds.filter((currentPlayerId) => currentPlayerId !== playerId)
        : [...currentPlayerIds, playerId]
    )
    setFeedback(null)
  }

  function handleFinishSeason() {
    finishActiveSeason(activeLeagueId)
    setFeedback(t.adminSeason.seasonFinished)
  }

  function handleStartSeason(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canStartSeason) {
      return
    }

    startNewSeason({
      leagueId: activeLeagueId,
      name: newSeasonName.trim(),
      totalRounds: parsedRounds,
      playerIds: selectedPlayerIds,
    })

    setNewSeasonName("")
    setFeedback(t.adminSeason.seasonStarted)
  }

  return (
    <div className="space-y-5">
      <AppCard>
        <p className="font-bold">{t.adminSeason.lifecycleTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.adminSeason.lifecycleDescription}
        </p>

        <div className="mt-4 rounded-2xl bg-neutral-100 p-4">
          <p className="text-xs font-semibold text-neutral-500">
            {t.adminSeason.currentSeason}
          </p>
          <p className="mt-1 text-lg font-black">{activeSeasonName}</p>
          <p className="mt-1 text-sm font-semibold text-neutral-600">
            {activeSeasonStatus === "active"
              ? t.adminSeason.statusActive
              : t.adminSeason.statusFinished}
          </p>
        </div>

        <button
          type="button"
          onClick={handleFinishSeason}
          disabled={activeSeasonStatus === "finished"}
          className="mt-4 w-full rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          {t.adminSeason.finishSeason}
        </button>
      </AppCard>

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

            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">
                {t.adminSeason.newSeasonRounds}
              </span>

              <input
                type="number"
                min={1}
                value={newSeasonRounds}
                onChange={(event) => {
                  setNewSeasonRounds(event.target.value)
                  setFeedback(null)
                }}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
              />
            </label>
          </div>
        </AppCard>

        <AppCard>
          <p className="font-bold">{t.adminSeason.seasonPlayersTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.adminSeason.seasonPlayersDescription}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {leaguePlayers.map((player) => {
              const isSelected = selectedPlayerIds.includes(player.id)

              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => togglePlayer(player.id)}
                  className={`rounded-2xl px-4 py-3 text-left text-sm font-black ${
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
        </AppCard>

        <button
          type="submit"
          disabled={!canStartSeason}
          className="w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
        >
          {t.adminSeason.startSeason}
        </button>

        {feedback ? (
          <p className="text-center text-sm font-semibold text-neutral-600">
            {feedback}
          </p>
        ) : null}
      </form>
    </div>
  )
}

export default function AdminSeasonPage() {
  const { t } = useI18n()
  const { isLeagueAdmin } = useLeagueAccess()
  const { activeLeague, activeSeason, roundSettings, players } =
    useCurrentLeagueData()
  const canAccessAdmin = isLeagueAdmin(activeLeague.id)

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
          {t.adminSeason.title}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {t.adminSeason.description}
        </p>
      </header>

      <AdminSeasonForm
        key={activeSeason.id}
        activeLeagueId={activeLeague.id}
        activeSeasonId={activeSeason.id}
        roundSettings={roundSettings}
      />

      <SeasonLifecycleForm
        key={`${activeSeason.id}-lifecycle`}
        activeLeagueId={activeLeague.id}
        activeSeasonName={activeSeason.name}
        activeSeasonStatus={activeSeason.status}
        activeSeasonTotalRounds={activeSeason.totalRounds}
        activeSeasonPlayerIds={players.map((player) => player.id)}
      />
    </div>
  )
}
