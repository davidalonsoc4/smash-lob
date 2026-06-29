"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { seasonRoundSettings } from "@/data/fakeData"

export type RoundWindowMode = "none" | "fixed-days"

export type SeasonRoundSettings = {
  leagueId: string
  seasonId: string
  roundWindowMode: RoundWindowMode
  seasonStartsAt: string | null
  roundWindowDays: number | null
  requiresThreeSets: boolean
}

type SeasonSettingsContextValue = {
  seasonSettings: SeasonRoundSettings[]
  getSeasonRoundSettings: (seasonId: string) => SeasonRoundSettings
  updateSeasonRoundSettings: (settings: SeasonRoundSettings) => void
}

type SeasonSettingsProviderProps = {
  children: React.ReactNode
}

const SeasonSettingsContext =
  createContext<SeasonSettingsContextValue | null>(null)

const storageKey = "smash-lob-season-round-settings"

function normalizeSettings(
  settings: (typeof seasonRoundSettings)[number]
): SeasonRoundSettings {
  return {
    leagueId: settings.leagueId,
    seasonId: settings.seasonId,
    roundWindowMode: settings.roundWindowMode as RoundWindowMode,
    seasonStartsAt: settings.seasonStartsAt,
    roundWindowDays: settings.roundWindowDays,
    requiresThreeSets: settings.requiresThreeSets ?? true,
  }
}

function getDefaultSettings() {
  return seasonRoundSettings.map(normalizeSettings)
}

function parseStoredSettings(value: string | null): SeasonRoundSettings[] | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value)

    if (!Array.isArray(parsed)) {
      return null
    }

    const defaultSettings = getDefaultSettings()

    const mergedSettings = defaultSettings.map((defaultSetting) => {
      const storedSetting = parsed.find(
        (item: Partial<SeasonRoundSettings>) =>
          item.seasonId === defaultSetting.seasonId
      ) as Partial<SeasonRoundSettings> | undefined

      if (!storedSetting) {
        return defaultSetting
      }

      return {
        ...defaultSetting,
        ...storedSetting,
        requiresThreeSets:
          storedSetting.requiresThreeSets ?? defaultSetting.requiresThreeSets,
      }
    })

    const extraSettings = parsed
      .filter((storedSetting) => {
        return !mergedSettings.some(
          (setting) => setting.seasonId === storedSetting.seasonId
        )
      })
      .map((storedSetting: Partial<SeasonRoundSettings>) => ({
        leagueId: storedSetting.leagueId ?? "",
        seasonId: storedSetting.seasonId ?? "",
        roundWindowMode: storedSetting.roundWindowMode ?? "none",
        seasonStartsAt: storedSetting.seasonStartsAt ?? null,
        roundWindowDays: storedSetting.roundWindowDays ?? null,
        requiresThreeSets: storedSetting.requiresThreeSets ?? true,
      }))

    return [...mergedSettings, ...extraSettings]
  } catch {
    return null
  }
}

function createFallbackSettings(seasonId: string): SeasonRoundSettings {
  return {
    leagueId: "",
    seasonId,
    roundWindowMode: "none",
    seasonStartsAt: null,
    roundWindowDays: null,
    requiresThreeSets: true,
  }
}

export function SeasonSettingsProvider({
  children,
}: SeasonSettingsProviderProps) {
  const [seasonSettings, setSeasonSettings] =
    useState<SeasonRoundSettings[]>(getDefaultSettings)

  useEffect(() => {
    const storedSettings = parseStoredSettings(
      window.localStorage.getItem(storageKey)
    )

    if (storedSettings) {
      window.setTimeout(() => {
        setSeasonSettings(storedSettings)
      }, 0)
    }
  }, [])

  function getSeasonRoundSettings(seasonId: string) {
    return (
      seasonSettings.find((settings) => settings.seasonId === seasonId) ??
      createFallbackSettings(seasonId)
    )
  }

  function updateSeasonRoundSettings(settings: SeasonRoundSettings) {
    setSeasonSettings((currentSettings) => {
      const exists = currentSettings.some(
        (item) => item.seasonId === settings.seasonId
      )

      const nextSettings = exists
        ? currentSettings.map((item) =>
            item.seasonId === settings.seasonId ? settings : item
          )
        : [...currentSettings, settings]

      window.localStorage.setItem(storageKey, JSON.stringify(nextSettings))

      return nextSettings
    })
  }

  const value = useMemo(
    () => ({
      seasonSettings,
      getSeasonRoundSettings,
      updateSeasonRoundSettings,
    }),
    [seasonSettings]
  )

  return (
    <SeasonSettingsContext.Provider value={value}>
      {children}
    </SeasonSettingsContext.Provider>
  )
}

export function useSeasonSettings() {
  const context = useContext(SeasonSettingsContext)

  if (!context) {
    throw new Error(
      "useSeasonSettings must be used inside SeasonSettingsProvider"
    )
  }

  return context
}
