"use client"

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useSession } from "next-auth/react"
import { useMatchData } from "@/context/MatchDataProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { upsertAppUser } from "@/lib/supabaseUsers"
import {
  createSupabaseLeague,
  fetchSupabaseLeagueSnapshot,
} from "@/lib/supabaseLeagues"
import { isSuperuserEmail } from "@/lib/superuser"
import {
  defaultUserLeagueMemberships,
  leagueMembers,
  leagues as defaultLeagues,
  type League,
  type LeagueMemberRole,
  type PlayerProfile,
  type UserLeagueMembership,
} from "@/data/fakeData"
import type { RoundWindowMode } from "@/context/SeasonSettingsProvider"

type ClaimResult =
  | { ok: true; membership: UserLeagueMembership }
  | { ok: false; error: "already-in-league" | "player-already-claimed" }

type LeagueAccessContextValue = {
  userId: string | null
  leagues: League[]
  userMemberships: UserLeagueMembership[]
  userLeagues: League[]
  createLeague: (settings: {
    name: string
    description: string
    seasonName: string
    playerNames: string[]
    roundWindowMode: RoundWindowMode
    seasonStartsAt: string | null
    roundWindowDays: number | null
    requiresThreeSets: boolean
  }) => Promise<League | null>
  getMembershipForLeague: (leagueId: string) => UserLeagueMembership | null
  getLeagueInviteCode: (leagueId: string) => string
  isPlayerClaimed: (leagueId: string, playerId: string) => boolean
  regenerateLeagueInviteCode: (leagueId: string) => string
  getLeagueByInviteCode: (code: string) => League | null
  getUnclaimedPlayersForLeague: (leagueId: string) => PlayerProfile[]
  claimPlayer: (leagueId: string, playerId: string) => ClaimResult
  canAccessLeague: (leagueId: string) => boolean
  isLeagueAdmin: (leagueId: string) => boolean
}

type LeagueAccessProviderProps = {
  children: ReactNode
}

const storageKey = "smash-lob-user-league-memberships"
const leaguesStorageKey = "smash-lob-leagues"
const inviteCodesStorageKey = "smash-lob-league-invite-codes"
const adminRoles: LeagueMemberRole[] = ["creator", "admin"]
const LeagueAccessContext = createContext<LeagueAccessContextValue | null>(null)

function normalizeUserId(email: string | null | undefined) {
  return email?.trim().toLowerCase() || null
}

function normalizeInviteCode(code: string) {
  return code.trim().toUpperCase()
}

function readStoredInviteCodes() {
  if (typeof window === "undefined") {
    return {}
  }

  const storedValue = window.localStorage.getItem(inviteCodesStorageKey)

  if (!storedValue) {
    return {}
  }

  try {
    const parsedValue = JSON.parse(storedValue)

    if (typeof parsedValue !== "object" || parsedValue === null) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsedValue).filter(
        ([leagueId, code]) =>
          typeof leagueId === "string" && typeof code === "string"
      )
    ) as Record<string, string>
  } catch {
    return {}
  }
}

function readStoredMemberships() {
  if (typeof window === "undefined") {
    return defaultUserLeagueMemberships
  }

  const storedValue = window.localStorage.getItem(storageKey)

  if (!storedValue) {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(defaultUserLeagueMemberships)
    )
    return defaultUserLeagueMemberships
  }

  try {
    const parsedValue = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return defaultUserLeagueMemberships
    }

    return parsedValue.filter(isValidStoredMembership)
  } catch {
    return defaultUserLeagueMemberships
  }
}

function isValidStoredLeague(league: unknown): league is League {
  if (typeof league !== "object" || league === null) {
    return false
  }

  const item = league as Record<string, unknown>

  return (
    typeof item.id === "string" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.description === "string" &&
    typeof item.activeSeasonId === "string" &&
    typeof item.inviteCode === "string" &&
    (item.joinMode === "closed" || item.joinMode === "open") &&
    Array.isArray(item.locations) &&
    item.locations.every((location) => typeof location === "string")
  )
}

function readStoredLeagues() {
  if (typeof window === "undefined") {
    return defaultLeagues
  }

  const storedValue = window.localStorage.getItem(leaguesStorageKey)

  if (!storedValue) {
    return defaultLeagues
  }

  try {
    const parsedValue = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return defaultLeagues
    }

    const storedLeagues = parsedValue.filter(isValidStoredLeague)
    const storedLeagueIds = new Set(storedLeagues.map((league) => league.id))

    return [
      ...defaultLeagues.filter((league) => !storedLeagueIds.has(league.id)),
      ...storedLeagues,
    ]
  } catch {
    return defaultLeagues
  }
}

function mergeLeagues(current: League[], incoming: League[]) {
  const items = new Map(current.map((league) => [league.id, league]))

  incoming.forEach((league) => {
    items.set(league.id, league)
  })

  return Array.from(items.values())
}

function mergeMemberships(
  current: UserLeagueMembership[],
  incoming: UserLeagueMembership[]
) {
  const items = new Map(
    current.map((membership) => [
      `${membership.userId}:${membership.leagueId}:${membership.playerId}`,
      membership,
    ])
  )

  incoming.forEach((membership) => {
    items.set(
      `${membership.userId}:${membership.leagueId}:${membership.playerId}`,
      membership
    )
  })

  return Array.from(items.values())
}

function isValidStoredMembership(
  membership: unknown
): membership is UserLeagueMembership {
  if (typeof membership !== "object" || membership === null) {
    return false
  }

  const item = membership as Record<string, unknown>

  return (
    typeof item.userId === "string" &&
    typeof item.leagueId === "string" &&
    typeof item.playerId === "string" &&
    (item.role === "creator" || item.role === "admin" || item.role === "player")
  )
}

function getBaseRole(leagueId: string, playerId: string): LeagueMemberRole {
  return (
    leagueMembers.find(
      (member) => member.leagueId === leagueId && member.playerId === playerId
    )?.role ?? "player"
  )
}

function slugifyLeagueName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "liga"
  )
}

function getRandomCodeSegment(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const randomValues = new Uint8Array(length)
  window.crypto.getRandomValues(randomValues)

  return Array.from(randomValues)
    .map((value) => alphabet[value % alphabet.length])
    .join("")
}

function getInvitePrefix(leagueId: string) {
  const league = defaultLeagues.find((item) => item.id === leagueId)
  const source = league?.slug ?? leagueId
  const prefix = source
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase()

  return prefix.padEnd(2, "X")
}

function generateInviteCode(leagueId: string, existingCodes: string[]) {
  const normalizedExistingCodes = new Set(existingCodes.map(normalizeInviteCode))

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = [
      getInvitePrefix(leagueId),
      getRandomCodeSegment(4),
      getRandomCodeSegment(4),
      getRandomCodeSegment(4),
    ].join("-")

    if (!normalizedExistingCodes.has(normalizeInviteCode(code))) {
      return code
    }
  }

  return [
    getInvitePrefix(leagueId),
    getRandomCodeSegment(6),
    getRandomCodeSegment(6),
    getRandomCodeSegment(6),
  ].join("-")
}

export function LeagueAccessProvider({ children }: LeagueAccessProviderProps) {
  const { data: session } = useSession()
  const { hydrateMatches } = useMatchData()
  const { createInitialSeasonForLeague, hydrateSeasonSnapshot, playerProfiles } =
    useSeasonSettings()
  const userId = normalizeUserId(session?.user?.email)
  const isSuperuser = isSuperuserEmail(userId)
  const [leagues, setLeagues] = useState<League[]>(readStoredLeagues)
  const [memberships, setMemberships] = useState<UserLeagueMembership[]>(
    readStoredMemberships
  )

  function persistLeagues(nextLeagues: League[]) {
    setLeagues(nextLeagues)
    const customLeagues = nextLeagues.filter(
      (league) =>
        !defaultLeagues.some((defaultLeague) => defaultLeague.id === league.id)
    )
    window.localStorage.setItem(leaguesStorageKey, JSON.stringify(customLeagues))
  }
  const [inviteCodeOverrides, setInviteCodeOverrides] =
    useState<Record<string, string>>(readStoredInviteCodes)

  useEffect(() => {
    if (!userId) {
      return
    }

    upsertAppUser({
      email: userId,
      displayName: session?.user?.name,
    }).catch(() => undefined)
  }, [session?.user?.name, userId])

  useEffect(() => {
    if (!userId) {
      return
    }

    fetchSupabaseLeagueSnapshot(userId)
      .then((snapshot) => {
        setLeagues((currentLeagues) =>
          mergeLeagues(currentLeagues, snapshot.leagues)
        )
        setMemberships((currentMemberships) =>
          mergeMemberships(currentMemberships, snapshot.memberships)
        )
        hydrateMatches(snapshot.matches)
        hydrateSeasonSnapshot(snapshot.seasonSnapshot)
      })
      .catch((error) => {
        const details =
          typeof error === "object" && error !== null
            ? error
            : { message: String(error) }
        window.localStorage.setItem(
          "smash-lob-last-supabase-error",
          JSON.stringify({
            ...details,
            createdAt: new Date().toISOString(),
          })
        )
      })
  }, [hydrateMatches, hydrateSeasonSnapshot, userId])

  const persistMemberships = useCallback(
    (nextMemberships: UserLeagueMembership[]) => {
      setMemberships(nextMemberships)
      window.localStorage.setItem(storageKey, JSON.stringify(nextMemberships))
    },
    []
  )

  const userMemberships = useMemo(() => {
    if (!userId) {
      return []
    }

    return memberships.filter((membership) => membership.userId === userId)
  }, [memberships, userId])

  const getLeagueInviteCode = useCallback(
    (leagueId: string) => {
      const league = leagues.find((item) => item.id === leagueId)

      return inviteCodeOverrides[leagueId] ?? league?.inviteCode ?? ""
    },
    [inviteCodeOverrides, leagues]
  )

  const createLeague = useCallback(
    ({
      name,
      description,
      seasonName,
      playerNames,
      roundWindowMode,
      seasonStartsAt,
      roundWindowDays,
      requiresThreeSets,
    }: {
      name: string
      description: string
      seasonName: string
      playerNames: string[]
      roundWindowMode: RoundWindowMode
      seasonStartsAt: string | null
      roundWindowDays: number | null
      requiresThreeSets: boolean
    }) => {
      if (!userId) {
        return null
      }

      const baseSlug = slugifyLeagueName(name)
      const existingLeagueIds = new Set(leagues.map((league) => league.id))
      const existingSlugs = new Set(leagues.map((league) => league.slug))
      let slug = baseSlug
      let suffix = 2

      while (existingSlugs.has(slug)) {
        slug = `${baseSlug}-${suffix}`
        suffix += 1
      }

      let leagueId = `league-${slug}`
      suffix = 2
      while (existingLeagueIds.has(leagueId)) {
        leagueId = `league-${slug}-${suffix}`
        suffix += 1
      }

      const { seasonId, playerIds } = createInitialSeasonForLeague({
        leagueId,
        seasonName,
        playerNames,
        roundWindowMode,
        seasonStartsAt,
        roundWindowDays,
        requiresThreeSets,
      })
      createSeasonMatches({
        leagueId,
        seasonId,
        playerIds,
      })
      const inviteCode = generateInviteCode(
        leagueId,
        leagues.map((league) => getLeagueInviteCode(league.id))
      )
      const league: League = {
        id: leagueId,
        slug,
        name,
        description,
        activeSeasonId: seasonId,
        inviteCode,
        joinMode: "closed",
        locations: [],
      }
      const nextLeagues = [...leagues, league]
      const creatorMembership: UserLeagueMembership = {
        userId,
        leagueId,
        playerId: playerIds[0],
        role: "creator",
      }

      persistLeagues(nextLeagues)
      persistMemberships([...memberships, creatorMembership])
      createSupabaseLeague({
        creatorEmail: userId,
        creatorName: session?.user?.name,
        leagueName: name,
        leagueDescription: description,
        leagueSlug: slug,
        inviteCode,
        seasonName,
        playerNames,
        roundWindowMode,
        seasonStartsAt,
        roundWindowDays,
        requiresThreeSets,
      }).catch((error) => {
        const details =
          typeof error === "object" && error !== null
            ? error
            : { message: String(error) }
        window.localStorage.setItem(
          "smash-lob-last-supabase-error",
          JSON.stringify({
            ...details,
            createdAt: new Date().toISOString(),
          })
        )
      })

      return league
    },
    [
      createInitialSeasonForLeague,
      createSeasonMatches,
      getLeagueInviteCode,
      leagues,
      memberships,
      persistMemberships,
      session?.user?.name,
      userId,
    ]
  )

  const isPlayerClaimed = useCallback(
    (leagueId: string, playerId: string) =>
      memberships.some(
        (membership) =>
          membership.leagueId === leagueId && membership.playerId === playerId
      ),
    [memberships]
  )

  const getLeagueWithInviteCode = useCallback(
    (league: League): League => ({
      ...league,
      inviteCode: getLeagueInviteCode(league.id),
    }),
    [getLeagueInviteCode]
  )

  const userLeagues = useMemo(
    () => {
      if (isSuperuser) {
        return leagues.map(getLeagueWithInviteCode)
      }

      return userMemberships
        .map((membership) =>
          leagues.find((league) => league.id === membership.leagueId)
        )
        .filter((league): league is League => Boolean(league))
        .map(getLeagueWithInviteCode)
    },
    [getLeagueWithInviteCode, isSuperuser, leagues, userMemberships]
  )

  const getMembershipForLeague = useCallback(
    (leagueId: string) =>
      userMemberships.find((membership) => membership.leagueId === leagueId) ??
      null,
    [userMemberships]
  )

  const regenerateLeagueInviteCode = useCallback(
    (leagueId: string) => {
      const existingCodes = leagues.map((league) =>
        league.id === leagueId
          ? ""
          : inviteCodeOverrides[league.id] ?? league.inviteCode
      )
      const code = generateInviteCode(leagueId, existingCodes)
      const nextInviteCodeOverrides = {
        ...inviteCodeOverrides,
        [leagueId]: code,
      }

      setInviteCodeOverrides(nextInviteCodeOverrides)
      window.localStorage.setItem(
        inviteCodesStorageKey,
        JSON.stringify(nextInviteCodeOverrides)
      )

      return code
    },
    [inviteCodeOverrides, leagues]
  )

  const getLeagueByInviteCode = useCallback(
    (code: string) => {
      const normalizedCode = normalizeInviteCode(code)

      const league = leagues.find(
        (item) =>
          normalizeInviteCode(getLeagueInviteCode(item.id)) === normalizedCode
      )

      return league ? getLeagueWithInviteCode(league) : null
    },
    [getLeagueInviteCode, getLeagueWithInviteCode, leagues]
  )

  const getUnclaimedPlayersForLeague = useCallback(
    (leagueId: string) => {
      const claimedPlayerIds = new Set(
        memberships
          .filter((membership) => membership.leagueId === leagueId)
          .map((membership) => membership.playerId)
      )

      return playerProfiles.filter(
        (player) =>
          player.leagueId === leagueId && !claimedPlayerIds.has(player.id)
      )
    },
    [memberships, playerProfiles]
  )

  const claimPlayer = useCallback(
    (leagueId: string, playerId: string): ClaimResult => {
      if (!userId) {
        return { ok: false, error: "already-in-league" }
      }

      const alreadyInLeague = memberships.some(
        (membership) =>
          membership.userId === userId && membership.leagueId === leagueId
      )

      if (alreadyInLeague) {
        return { ok: false, error: "already-in-league" }
      }

      const playerAlreadyClaimed = memberships.some(
        (membership) =>
          membership.leagueId === leagueId && membership.playerId === playerId
      )

      if (playerAlreadyClaimed) {
        return { ok: false, error: "player-already-claimed" }
      }

      const membership = {
        userId,
        leagueId,
        playerId,
        role: getBaseRole(leagueId, playerId),
      }

      persistMemberships([...memberships, membership])

      return { ok: true, membership }
    },
    [memberships, persistMemberships, userId]
  )

  const canAccessLeague = useCallback(
    (leagueId: string) =>
      isSuperuser || Boolean(getMembershipForLeague(leagueId)),
    [getMembershipForLeague, isSuperuser]
  )

  const isLeagueAdmin = useCallback(
    (leagueId: string) => {
      if (isSuperuser) {
        return true
      }

      const membership = getMembershipForLeague(leagueId)

      return Boolean(membership && adminRoles.includes(membership.role))
    },
    [getMembershipForLeague, isSuperuser]
  )

  const value = useMemo(
    () => ({
      userId,
      leagues,
      userMemberships,
      userLeagues,
      createLeague,
      getMembershipForLeague,
      getLeagueInviteCode,
      isPlayerClaimed,
      regenerateLeagueInviteCode,
      getLeagueByInviteCode,
      getUnclaimedPlayersForLeague,
      claimPlayer,
      canAccessLeague,
      isLeagueAdmin,
    }),
    [
      canAccessLeague,
      createLeague,
      claimPlayer,
      getLeagueByInviteCode,
      getLeagueInviteCode,
      getMembershipForLeague,
      getUnclaimedPlayersForLeague,
      isPlayerClaimed,
      regenerateLeagueInviteCode,
      isLeagueAdmin,
      leagues,
      userId,
      userLeagues,
      userMemberships,
    ]
  )

  return (
    <LeagueAccessContext.Provider value={value}>
      {children}
    </LeagueAccessContext.Provider>
  )
}

export function useLeagueAccess() {
  const context = useContext(LeagueAccessContext)

  if (!context) {
    throw new Error("useLeagueAccess must be used inside LeagueAccessProvider")
  }

  return context
}
