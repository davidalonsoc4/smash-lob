"use client"

import { FormEvent, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import {
  SeasonRoundSettings,
  useSeasonSettings,
} from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { isCurrentUserLeagueAdmin } from "@/lib/permissions"

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

export default function AdminSeasonPage() {
  const { t } = useI18n()
  const { activeLeague, activeSeason, roundSettings } =
    useCurrentLeagueData()
  const canAccessAdmin = isCurrentUserLeagueAdmin(activeLeague.id)

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
    </div>
  )
}
