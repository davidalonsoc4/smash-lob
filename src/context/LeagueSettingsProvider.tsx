"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { leagues } from "@/data/fakeData"

export type LeagueSettings = {
  leagueId: string
  locations: string[]
}

type LeagueSettingsContextValue = {
  leagueSettings: LeagueSettings[]
  getLeagueSettings: (leagueId: string) => LeagueSettings
  updateLeagueLocations: (leagueId: string, locations: string[]) => void
}

type LeagueSettingsProviderProps = {
  children: React.ReactNode
}

const LeagueSettingsContext =
  createContext<LeagueSettingsContextValue | null>(null)

const storageKey = "smash-lob-league-settings"

function getDefaultSettings(): LeagueSettings[] {
  return leagues.map((league) => ({
    leagueId: league.id,
    locations: [...league.locations],
  }))
}

function parseStoredSettings(value: string | null): LeagueSettings[] | null {
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
        (item: Partial<LeagueSettings>) =>
          item.leagueId === defaultSetting.leagueId
      ) as Partial<LeagueSettings> | undefined

      if (!storedSetting) {
        return defaultSetting
      }

      return {
        ...defaultSetting,
        ...storedSetting,
        locations: Array.isArray(storedSetting.locations)
          ? storedSetting.locations
        : defaultSetting.locations,
      }
    })

    const extraSettings = parsed
      .filter((storedSetting: Partial<LeagueSettings>) => {
        return !mergedSettings.some(
          (settings) => settings.leagueId === storedSetting.leagueId
        )
      })
      .map((storedSetting: Partial<LeagueSettings>) => ({
        leagueId: storedSetting.leagueId ?? "",
        locations: Array.isArray(storedSetting.locations)
          ? storedSetting.locations.filter(
              (location): location is string => typeof location === "string"
            )
          : [],
      }))
      .filter((settings) => settings.leagueId.length > 0)

    return [...mergedSettings, ...extraSettings]
  } catch {
    return null
  }
}

function createFallbackSettings(leagueId: string): LeagueSettings {
  const league = leagues.find((item) => item.id === leagueId)

  return {
    leagueId,
    locations: league ? [...league.locations] : [],
  }
}

function normalizeLocations(locations: string[]) {
  const cleanLocations = locations
    .map((location) => location.trim())
    .filter(Boolean)

  return Array.from(new Set(cleanLocations))
}

export function LeagueSettingsProvider({
  children,
}: LeagueSettingsProviderProps) {
  const [leagueSettings, setLeagueSettings] =
    useState<LeagueSettings[]>(getDefaultSettings)

  useEffect(() => {
    const storedSettings = parseStoredSettings(
      window.localStorage.getItem(storageKey)
    )

    if (storedSettings) {
      window.setTimeout(() => {
        setLeagueSettings(storedSettings)
      }, 0)
    }
  }, [])

  function getLeagueSettings(leagueId: string) {
    return (
      leagueSettings.find((settings) => settings.leagueId === leagueId) ??
      createFallbackSettings(leagueId)
    )
  }

  function updateLeagueLocations(leagueId: string, locations: string[]) {
    setLeagueSettings((currentSettings) => {
      const normalizedLocations = normalizeLocations(locations)
      const exists = currentSettings.some(
        (settings) => settings.leagueId === leagueId
      )

      const nextSettings = exists
        ? currentSettings.map((settings) =>
            settings.leagueId === leagueId
              ? {
                  ...settings,
                  locations: normalizedLocations,
                }
              : settings
          )
        : [
            ...currentSettings,
            {
              leagueId,
              locations: normalizedLocations,
            },
          ]

      window.localStorage.setItem(storageKey, JSON.stringify(nextSettings))

      return nextSettings
    })
  }

  const value = useMemo(
    () => ({
      leagueSettings,
      getLeagueSettings,
      updateLeagueLocations,
    }),
    [leagueSettings]
  )

  return (
    <LeagueSettingsContext.Provider value={value}>
      {children}
    </LeagueSettingsContext.Provider>
  )
}

export function useLeagueSettings() {
  const context = useContext(LeagueSettingsContext)

  if (!context) {
    throw new Error(
      "useLeagueSettings must be used inside LeagueSettingsProvider"
    )
  }

  return context
}
