"use client"

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react"
import {
  leagues,
  playerProfiles as defaultPlayerProfiles,
  seasonPlayers as defaultSeasonPlayers,
  seasonRoundSettings,
  seasons as defaultSeasons,
  type PlayerProfile,
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
  playerProfiles: PlayerProfile[]
  seasonPlayers: SeasonPlayer[]
  seasonSettings: SeasonRoundSettings[]
  getActiveSeasonByLeagueId: (leagueId: string) => Season
  getSeasonPlayers: (seasonId: string) => SeasonPlayer[]
  getSeasonRoundSettings: (seasonId: string) => SeasonRoundSettings
  updateSeasonRoundSettings: (settings: SeasonRoundSettings) => void
  updatePlayerProfile: (player: {
    playerId: string
    displayName: string
    avatarInitials: string
    avatarUrl?: string | null
  }) => void
  hydrateSeasonSnapshot: (snapshot: SeasonSnapshot) => void
  finishActiveSeason: (leagueId: string) => void
  createInitialSeasonForLeague: (settings: {
    leagueId: string
    seasonName: string
    playerNames: string[]
    roundWindowMode: RoundWindowMode
    seasonStartsAt: string | null
    roundWindowDays: number | null
    requiresThreeSets: boolean
  }) => { seasonId: string; playerIds: string[] }
  startNewSeason: (settings: {
    leagueId: string
    name: string
    playerIds: string[]
    newPlayerNames: string[]
    roundWindowMode: RoundWindowMode
    seasonStartsAt: string | null
    roundWindowDays: number | null
    requiresThreeSets: boolean
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
  playerProfiles: PlayerProfile[]
  seasonPlayers: SeasonPlayer[]
  activeSeasonIds: Record<string, string>
}

export type SeasonSnapshot = {
  seasons: Season[]
  playerProfiles: PlayerProfile[]
  seasonPlayers: SeasonPlayer[]
  seasonSettings: SeasonRoundSettings[]
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
    playerProfiles: defaultPlayerProfiles,
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

function isValidPlayerProfile(value: unknown): value is PlayerProfile {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const item = value as Record<string, unknown>

  return (
    typeof item.id === "string" &&
    typeof item.leagueId === "string" &&
    typeof item.slug === "string" &&
    typeof item.displayName === "string" &&
    typeof item.avatarInitials === "string" &&
    (typeof item.avatarUrl === "undefined" ||
      item.avatarUrl === null ||
      typeof item.avatarUrl === "string")
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
    const playerProfiles = Array.isArray(item.playerProfiles)
      ? item.playerProfiles.filter(isValidPlayerProfile)
      : defaultPlayerProfiles
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
      playerProfiles:
        playerProfiles.length > 0 ? playerProfiles : defaultPlayerProfiles,
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

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
  const items = new Map(current.map((item) => [item.id, item]))

  incoming.forEach((item) => {
    items.set(item.id, item)
  })

  return Array.from(items.values())
}

function mergeSeasonPlayers(
  current: SeasonPlayer[],
  incoming: SeasonPlayer[]
) {
  const items = new Map(
    current.map((item) => [`${item.seasonId}:${item.playerId}`, item])
  )

  incoming.forEach((item) => {
    items.set(`${item.seasonId}:${item.playerId}`, item)
  })

  return Array.from(items.values())
}

function mergeSettings(
  current: SeasonRoundSettings[],
  incoming: SeasonRoundSettings[]
) {
  const items = new Map(current.map((item) => [item.seasonId, item]))

  incoming.forEach((item) => {
    items.set(item.seasonId, item)
  })

  return Array.from(items.values())
}

function slugifyName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "jugador"
  )
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return initials || "JG"
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

  function createInitialSeasonForLeague({
    leagueId,
    seasonName,
    playerNames,
    roundWindowMode,
    seasonStartsAt,
    roundWindowDays,
    requiresThreeSets,
  }: {
    leagueId: string
    seasonName: string
    playerNames: string[]
    roundWindowMode: RoundWindowMode
    seasonStartsAt: string | null
    roundWindowDays: number | null
    requiresThreeSets: boolean
  }) {
    const seasonId = `${leagueId}-season-${Date.now()}`
    const cleanPlayerNames = playerNames
      .map((playerName) => playerName.trim())
      .filter(Boolean)
    const newSeason: Season = {
      id: seasonId,
      leagueId,
      name: seasonName,
      status: "active",
      totalRounds: Math.max(cleanPlayerNames.length - 1, 1),
      completedRounds: 0,
    }
    const existingPlayerIds = new Set(
      seasonData.playerProfiles.map((player) => player.id)
    )
    const existingSlugs = new Set(
      seasonData.playerProfiles.map((player) => player.slug)
    )
    const newPlayers = cleanPlayerNames.map((playerName, index) => {
      const baseId = `${leagueId}-player-${index + 1}`
      const baseSlug = slugifyName(playerName)
      let id = baseId
      let slug = baseSlug
      let suffix = 2

      while (existingPlayerIds.has(id)) {
        id = `${baseId}-${suffix}`
        suffix += 1
      }

      suffix = 2
      while (existingSlugs.has(slug)) {
        slug = `${baseSlug}-${suffix}`
        suffix += 1
      }

      existingPlayerIds.add(id)
      existingSlugs.add(slug)

      return {
        id,
        leagueId,
        slug,
        displayName: playerName,
        avatarInitials: getInitials(playerName),
      }
    })
    const playerIds = newPlayers.map((player) => player.id)

    setSeasonData((currentSeasonData) => {
      const nextSeasonData = {
        seasons: [...currentSeasonData.seasons, newSeason],
        playerProfiles: [...currentSeasonData.playerProfiles, ...newPlayers],
        seasonPlayers: [
          ...currentSeasonData.seasonPlayers,
          ...newPlayers.map((player) => ({
            seasonId,
            playerId: player.id,
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

    updateSeasonRoundSettings({
      leagueId,
      seasonId,
      roundWindowMode,
      seasonStartsAt,
      roundWindowDays,
      requiresThreeSets,
    })

    return { seasonId, playerIds }
  }

  function startNewSeason({
    leagueId,
    name,
    playerIds,
    newPlayerNames,
    roundWindowMode,
    seasonStartsAt,
    roundWindowDays,
    requiresThreeSets,
  }: {
    leagueId: string
    name: string
    playerIds: string[]
    newPlayerNames: string[]
    roundWindowMode: RoundWindowMode
    seasonStartsAt: string | null
    roundWindowDays: number | null
    requiresThreeSets: boolean
  }) {
    const seasonId = `${leagueId}-season-${Date.now()}`
    const uniquePlayerIds = Array.from(new Set(playerIds))
    const cleanNewPlayerNames = newPlayerNames
      .map((playerName) => playerName.trim())
      .filter(Boolean)
    const totalPlayers = uniquePlayerIds.length + cleanNewPlayerNames.length
    const newSeason: Season = {
      id: seasonId,
      leagueId,
      name,
      status: "active",
      totalRounds: Math.max(totalPlayers - 1, 1),
      completedRounds: 0,
    }

    setSeasonData((currentSeasonData) => {
      const activeSeasonId = currentSeasonData.activeSeasonIds[leagueId]
      const existingPlayerIds = new Set(
        currentSeasonData.playerProfiles.map((player) => player.id)
      )
      const existingSlugs = new Set(
        currentSeasonData.playerProfiles.map((player) => player.slug)
      )
      const newPlayers = cleanNewPlayerNames.map((playerName, index) => {
        const baseId = `${seasonId}-player-${index + 1}`
        const baseSlug = slugifyName(playerName)
        let id = baseId
        let slug = baseSlug
        let suffix = 2

        while (existingPlayerIds.has(id)) {
          id = `${baseId}-${suffix}`
          suffix += 1
        }

        suffix = 2
        while (existingSlugs.has(slug)) {
          slug = `${baseSlug}-${suffix}`
          suffix += 1
        }

        existingPlayerIds.add(id)
        existingSlugs.add(slug)

        return {
          id,
          leagueId,
          slug,
          displayName: playerName,
          avatarInitials: getInitials(playerName),
        }
      })
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
        playerProfiles: [...currentSeasonData.playerProfiles, ...newPlayers],
        seasonPlayers: [
          ...currentSeasonData.seasonPlayers,
          ...uniquePlayerIds.map((playerId) => ({
            seasonId,
            playerId,
          })),
          ...newPlayers.map((player) => ({
            seasonId,
            playerId: player.id,
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

    updateSeasonRoundSettings({
      leagueId,
      seasonId,
      roundWindowMode,
      seasonStartsAt,
      roundWindowDays,
      requiresThreeSets,
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

  const updatePlayerProfile = useCallback(
    ({
      playerId,
      displayName,
      avatarInitials,
      avatarUrl,
    }: {
      playerId: string
      displayName: string
      avatarInitials: string
      avatarUrl?: string | null
    }) => {
      setSeasonData((currentSeasonData) => {
        const nextSeasonData = {
          ...currentSeasonData,
          playerProfiles: currentSeasonData.playerProfiles.map((player) =>
            player.id === playerId
              ? {
                  ...player,
                  displayName,
                  avatarInitials,
                  avatarUrl: typeof avatarUrl === "undefined" ? player.avatarUrl ?? null : avatarUrl,
                }
              : player
          ),
        }

        persistSeasonData(nextSeasonData)

        return nextSeasonData
      })
    },
    []
  )

  const hydrateSeasonSnapshot = useCallback((snapshot: SeasonSnapshot) => {
    setSeasonData((currentSeasonData) => {
      const nextSeasonData = {
        seasons: mergeById(currentSeasonData.seasons, snapshot.seasons),
        playerProfiles: mergeById(
          currentSeasonData.playerProfiles,
          snapshot.playerProfiles
        ),
        seasonPlayers: mergeSeasonPlayers(
          currentSeasonData.seasonPlayers,
          snapshot.seasonPlayers
        ),
        activeSeasonIds: {
          ...currentSeasonData.activeSeasonIds,
          ...snapshot.activeSeasonIds,
        },
      }

      persistSeasonData(nextSeasonData)

      return nextSeasonData
    })

    setSeasonSettings((currentSettings) => {
      const nextSettings = mergeSettings(
        currentSettings,
        snapshot.seasonSettings
      )

      window.localStorage.setItem(storageKey, JSON.stringify(nextSettings))

      return nextSettings
    })
  }, [])

  const value = {
    seasons: seasonData.seasons,
    playerProfiles: seasonData.playerProfiles,
    seasonPlayers: seasonData.seasonPlayers,
    seasonSettings,
    getActiveSeasonByLeagueId,
    getSeasonPlayers,
    getSeasonRoundSettings,
    updateSeasonRoundSettings,
    updatePlayerProfile,
    hydrateSeasonSnapshot,
    finishActiveSeason,
    createInitialSeasonForLeague,
    startNewSeason,
  }

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
