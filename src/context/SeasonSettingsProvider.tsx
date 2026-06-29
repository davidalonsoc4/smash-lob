"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  leagues,
  seasonPlayers as defaultSeasonPlayers,
  seasonRoundSettings,
  seasons as defaultSeasons,
  type Season,
  type SeasonPlayer,
} from "@/data/fakeData"

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
  seasons: Season[]
  seasonPlayers: SeasonPlayer[]
  seasonSettings: SeasonRoundSettings[]
  getActiveSeasonByLeagueId: (leagueId: string) => Season
  getSeasonPlayers: (seasonId: string) => SeasonPlayer[]
  getSeasonRoundSettings: (seasonId: string) => SeasonRoundSettings
  updateSeasonRoundSettings: (settings: SeasonRoundSettings) => void
  finishActiveSeason: (leagueId: string) => void
  startNewSeason: (settings: {
    leagueId: string
    name: string
    totalRounds: number
    playerIds: string[]
  }) => Season
}

type SeasonSettingsProviderProps = {
  children: React.ReactNode
}

const SeasonSettingsContext =
  createContext<SeasonSettingsContextValue | null>(null)

const storageKey = "smash-lob-season-round-settings"
const seasonDataStorageKey = "smash-lob-season-data"

type SeasonDataState = {
  seasons: Season[]
  seasonPlayers: SeasonPlayer[]
  activeSeasonIds: Record<string, string>
}

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

function getDefaultSeasonData(): SeasonDataState {
  return {
    seasons: defaultSeasons,
    seasonPlayers: defaultSeasonPlayers,
    activeSeasonIds: Object.fromEntries(
      leagues.map((league) => [league.id, league.activeSeasonId])
    ),
  }
}

function isValidSeason(value: unknown): value is Season {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const item = value as Record<string, unknown>

  return (
    typeof item.id === "string" &&
    typeof item.leagueId === "string" &&
    typeof item.name === "string" &&
    (item.status === "active" || item.status === "finished") &&
    typeof item.totalRounds === "number" &&
    typeof item.completedRounds === "number"
  )
}

function isValidSeasonPlayer(value: unknown): value is SeasonPlayer {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const item = value as Record<string, unknown>

  return typeof item.seasonId === "string" && typeof item.playerId === "string"
}

function readSeasonData(): SeasonDataState {
  if (typeof window === "undefined") {
    return getDefaultSeasonData()
  }

  const storedValue = window.localStorage.getItem(seasonDataStorageKey)

  if (!storedValue) {
    return getDefaultSeasonData()
  }

  try {
    const parsedValue = JSON.parse(storedValue)

    if (typeof parsedValue !== "object" || parsedValue === null) {
      return getDefaultSeasonData()
    }

    const item = parsedValue as Record<string, unknown>
    const seasons = Array.isArray(item.seasons)
      ? item.seasons.filter(isValidSeason)
      : defaultSeasons
    const seasonPlayers = Array.isArray(item.seasonPlayers)
      ? item.seasonPlayers.filter(isValidSeasonPlayer)
      : defaultSeasonPlayers
    const activeSeasonIds =
      typeof item.activeSeasonIds === "object" && item.activeSeasonIds !== null
        ? Object.fromEntries(
            Object.entries(item.activeSeasonIds).filter(
              ([leagueId, seasonId]) =>
                typeof leagueId === "string" && typeof seasonId === "string"
            )
          )
        : getDefaultSeasonData().activeSeasonIds

    return {
      seasons: seasons.length > 0 ? seasons : defaultSeasons,
      seasonPlayers,
      activeSeasonIds: activeSeasonIds as Record<string, string>,
    }
  } catch {
    return getDefaultSeasonData()
  }
}

function persistSeasonData(seasonData: SeasonDataState) {
  window.localStorage.setItem(seasonDataStorageKey, JSON.stringify(seasonData))
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
  const [seasonData, setSeasonData] = useState<SeasonDataState>(readSeasonData)

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

  function getActiveSeasonByLeagueId(leagueId: string) {
    const activeSeasonId = seasonData.activeSeasonIds[leagueId]
    const activeSeason = seasonData.seasons.find(
      (season) => season.id === activeSeasonId && season.leagueId === leagueId
    )

    if (activeSeason) {
      return activeSeason
    }

    const fallbackSeason = seasonData.seasons.find(
      (season) => season.leagueId === leagueId
    )

    if (!fallbackSeason) {
      throw new Error(`Active season not found for league: ${leagueId}`)
    }

    return fallbackSeason
  }

  function getSeasonPlayers(seasonId: string) {
    return seasonData.seasonPlayers.filter(
      (seasonPlayer) => seasonPlayer.seasonId === seasonId
    )
  }

  function finishActiveSeason(leagueId: string) {
    setSeasonData((currentSeasonData) => {
      const activeSeasonId = currentSeasonData.activeSeasonIds[leagueId]
      const nextSeasonData = {
        ...currentSeasonData,
        seasons: currentSeasonData.seasons.map((season) =>
          season.id === activeSeasonId
            ? {
                ...season,
                status: "finished" as const,
              }
            : season
        ),
      }

      persistSeasonData(nextSeasonData)

      return nextSeasonData
    })
  }

  function startNewSeason({
    leagueId,
    name,
    totalRounds,
    playerIds,
  }: {
    leagueId: string
    name: string
    totalRounds: number
    playerIds: string[]
  }) {
    const seasonId = `${leagueId}-season-${Date.now()}`
    const newSeason: Season = {
      id: seasonId,
      leagueId,
      name,
      status: "active",
      totalRounds,
      completedRounds: 0,
    }

    setSeasonData((currentSeasonData) => {
      const activeSeasonId = currentSeasonData.activeSeasonIds[leagueId]
      const uniquePlayerIds = Array.from(new Set(playerIds))
      const nextSeasonData = {
        seasons: [
          ...currentSeasonData.seasons.map((season) =>
            season.id === activeSeasonId
              ? {
                  ...season,
                  status: "finished" as const,
                }
              : season
          ),
          newSeason,
        ],
        seasonPlayers: [
          ...currentSeasonData.seasonPlayers,
          ...uniquePlayerIds.map((playerId) => ({
            seasonId,
            playerId,
          })),
        ],
        activeSeasonIds: {
          ...currentSeasonData.activeSeasonIds,
          [leagueId]: seasonId,
        },
      }

      persistSeasonData(nextSeasonData)

      return nextSeasonData
    })

    return newSeason
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
      seasons: seasonData.seasons,
      seasonPlayers: seasonData.seasonPlayers,
      seasonSettings,
      getActiveSeasonByLeagueId,
      getSeasonPlayers,
      getSeasonRoundSettings,
      updateSeasonRoundSettings,
      finishActiveSeason,
      startNewSeason,
    }),
    [seasonData, seasonSettings]
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
