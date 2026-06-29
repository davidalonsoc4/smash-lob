"use client"

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"
import { useSession } from "next-auth/react"
import {
  defaultUserLeagueMemberships,
  leagueMembers,
  leagues,
  playerProfiles,
  type League,
  type LeagueMemberRole,
  type PlayerProfile,
  type UserLeagueMembership,
} from "@/data/fakeData"

type ClaimResult =
  | { ok: true; membership: UserLeagueMembership }
  | { ok: false; error: "already-in-league" | "player-already-claimed" }

type LeagueAccessContextValue = {
  userId: string | null
  userMemberships: UserLeagueMembership[]
  userLeagues: League[]
  getMembershipForLeague: (leagueId: string) => UserLeagueMembership | null
  getLeagueInviteCode: (leagueId: string) => string
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

function getRandomCodeSegment(length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const randomValues = new Uint8Array(length)
  window.crypto.getRandomValues(randomValues)

  return Array.from(randomValues)
    .map((value) => alphabet[value % alphabet.length])
    .join("")
}

function getInvitePrefix(leagueId: string) {
  const league = leagues.find((item) => item.id === leagueId)
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
  const userId = normalizeUserId(session?.user?.email)
  const [memberships, setMemberships] = useState<UserLeagueMembership[]>(
    readStoredMemberships
  )
  const [inviteCodeOverrides, setInviteCodeOverrides] =
    useState<Record<string, string>>(readStoredInviteCodes)

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
    [inviteCodeOverrides]
  )

  const getLeagueWithInviteCode = useCallback(
    (league: League): League => ({
      ...league,
      inviteCode: getLeagueInviteCode(league.id),
    }),
    [getLeagueInviteCode]
  )

  const userLeagues = useMemo(
    () =>
      userMemberships
        .map((membership) =>
          leagues.find((league) => league.id === membership.leagueId)
        )
        .filter((league): league is League => Boolean(league))
        .map(getLeagueWithInviteCode),
    [getLeagueWithInviteCode, userMemberships]
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
    [inviteCodeOverrides]
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
    [getLeagueInviteCode, getLeagueWithInviteCode]
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
    [memberships]
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
    (leagueId: string) => Boolean(getMembershipForLeague(leagueId)),
    [getMembershipForLeague]
  )

  const isLeagueAdmin = useCallback(
    (leagueId: string) => {
      const membership = getMembershipForLeague(leagueId)

      return Boolean(membership && adminRoles.includes(membership.role))
    },
    [getMembershipForLeague]
  )

  const value = useMemo(
    () => ({
      userId,
      userMemberships,
      userLeagues,
      getMembershipForLeague,
      getLeagueInviteCode,
      regenerateLeagueInviteCode,
      getLeagueByInviteCode,
      getUnclaimedPlayersForLeague,
      claimPlayer,
      canAccessLeague,
      isLeagueAdmin,
    }),
    [
      canAccessLeague,
      claimPlayer,
      getLeagueByInviteCode,
      getLeagueInviteCode,
      getMembershipForLeague,
      getUnclaimedPlayersForLeague,
      regenerateLeagueInviteCode,
      isLeagueAdmin,
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
