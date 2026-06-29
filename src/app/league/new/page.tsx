"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { RoundWindowMode } from "@/context/SeasonSettingsProvider"
import { useI18n } from "@/i18n/I18nProvider"

const allowedPlayerCounts = [8, 12, 16]

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function getDefaultPlayerName(email: string | null | undefined) {
  const name = email?.split("@")[0]?.replace(/[._-]+/g, " ").trim()

  return name || "Jugador 1"
}

function resizePlayerNames(currentNames: string[], nextCount: number) {
  return Array.from({ length: nextCount }, (_, index) => {
    return currentNames[index] ?? `Jugador ${index + 1}`
  })
}

export default function NewLeaguePage() {
  const { t } = useI18n()
  const router = useRouter()
  const { data: session } = useSession()
  const { setActiveLeagueId } = useActiveLeague()
  const { createLeague } = useLeagueAccess()
  const [leagueName, setLeagueName] = useState("")
  const [leagueDescription, setLeagueDescription] = useState("")
  const [seasonName, setSeasonName] = useState("Temporada 1")
  const [playerCount, setPlayerCount] = useState(8)
  const [playerNames, setPlayerNames] = useState(() =>
    resizePlayerNames([getDefaultPlayerName(session?.user?.email)], 8)
  )
  const [roundWindowMode, setRoundWindowMode] =
    useState<RoundWindowMode>("fixed-days")
  const [seasonStartsAt, setSeasonStartsAt] = useState(getTodayInputValue)
  const [roundWindowDays, setRoundWindowDays] = useState("15")
  const [requiresThreeSets, setRequiresThreeSets] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const parsedRoundWindowDays = Number(roundWindowDays)
  const isFixedDaysMode = roundWindowMode === "fixed-days"
  const cleanPlayerNames = playerNames.map((playerName) => playerName.trim())
  const canCreate =
    leagueName.trim().length > 0 &&
    seasonName.trim().length > 0 &&
    allowedPlayerCounts.includes(playerCount) &&
    cleanPlayerNames.length === playerCount &&
    cleanPlayerNames.every(Boolean) &&
    (roundWindowMode === "none" ||
      (seasonStartsAt.length > 0 &&
        Number.isFinite(parsedRoundWindowDays) &&
        parsedRoundWindowDays >= 1))

  function handlePlayerCountChange(nextCount: number) {
    setPlayerCount(nextCount)
    setPlayerNames((currentNames) => resizePlayerNames(currentNames, nextCount))
    setError(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canCreate) {
      return
    }

    const league = createLeague({
      name: leagueName.trim(),
      description:
        leagueDescription.trim() || t.newLeague.defaultDescription,
      seasonName: seasonName.trim(),
      playerNames: cleanPlayerNames,
      roundWindowMode,
      seasonStartsAt: isFixedDaysMode ? seasonStartsAt : null,
      roundWindowDays: isFixedDaysMode ? parsedRoundWindowDays : null,
      requiresThreeSets,
    })

    if (!league) {
      setError(t.newLeague.createError)
      return
    }

    setActiveLeagueId(league.id)
    router.push("/admin/season")
  }

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <BackButton fallbackHref="/settings" label={t.common.back} />

        <h1 className="mt-4 text-3xl font-black tracking-tight">
          {t.newLeague.title}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {t.newLeague.description}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AppCard>
          <p className="font-bold">{t.newLeague.leagueTitle}</p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">
                {t.newLeague.leagueName}
              </span>
              <input
                value={leagueName}
                onChange={(event) => {
                  setLeagueName(event.target.value)
                  setError(null)
                }}
                placeholder={t.newLeague.leagueNamePlaceholder}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">
                {t.newLeague.leagueDescription}
              </span>
              <textarea
                value={leagueDescription}
                onChange={(event) => setLeagueDescription(event.target.value)}
                placeholder={t.newLeague.leagueDescriptionPlaceholder}
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
              />
            </label>
          </div>
        </AppCard>

        <AppCard>
          <p className="font-bold">{t.newLeague.seasonTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.newLeague.seasonDescription}
          </p>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-neutral-700">
              {t.newLeague.seasonName}
            </span>
            <input
              value={seasonName}
              onChange={(event) => {
                setSeasonName(event.target.value)
                setError(null)
              }}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
            />
          </label>

          <div className="mt-5">
            <p className="text-sm font-semibold text-neutral-700">
              {t.newLeague.playerCount}
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
        </AppCard>

        <AppCard>
          <p className="font-bold">{t.newLeague.playersTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.newLeague.playersDescription}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {playerNames.map((playerName, index) => (
              <label key={index} className="block">
                <span className="text-xs font-semibold text-neutral-500">
                  {t.newLeague.playerName} {index + 1}
                </span>
                <input
                  value={playerName}
                  onChange={(event) => {
                    const nextNames = [...playerNames]
                    nextNames[index] = event.target.value
                    setPlayerNames(nextNames)
                    setError(null)
                  }}
                  className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
                />
              </label>
            ))}
          </div>
        </AppCard>

        <AppCard>
          <p className="font-bold">{t.newLeague.rulesTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.newLeague.rulesDescription}
          </p>

          <label className="mt-5 flex items-start gap-3 rounded-2xl border border-neutral-200 p-4">
            <input
              type="checkbox"
              checked={requiresThreeSets}
              onChange={(event) => setRequiresThreeSets(event.target.checked)}
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
                  name="roundWindowMode"
                  value={mode}
                  checked={roundWindowMode === mode}
                  onChange={() => setRoundWindowMode(mode)}
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
                  onChange={(event) => setSeasonStartsAt(event.target.value)}
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
                  onChange={(event) => setRoundWindowDays(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
                />
              </label>
            </div>
          ) : null}
        </AppCard>

        {error ? (
          <p className="text-center text-sm font-semibold text-red-600">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canCreate}
          className="w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
        >
          {t.newLeague.create}
        </button>
      </form>
    </div>
  )
}
