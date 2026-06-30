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
  deleteSupabaseLeague,
  regenerateSupabaseLeagueInviteCode,
  updateSupabaseLeagueDetails,
  updateSupabaseLeagueLocations,
} from "@/lib/supabaseAdminLeagues"
import {
  fetchSupabaseLeagueUsers,
  unlinkSupabaseLeagueMembership,
  updateSupabaseLeagueMembershipRole,
  updateSupabasePlayerDisplayName,
  type LeagueUserManagementPlayer,
} from "@/lib/supabaseAdminUsers"
import {
  createSupabaseLeague,
  fetchSupabaseLeagueSnapshot,
} from "@/lib/supabaseLeagues"
import {
  claimSupabasePlayer,
  fetchSupabaseInviteSnapshot,
} from "@/lib/supabaseInvites"
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
  regenerateLeagueInviteCode: (leagueId: string) => Promise<string | null>
  updateLeagueDetails: (leagueId: string, details: { name: string; description: string }) => Promise<boolean>
  updateLeagueLocations: (leagueId: string, locations: string[]) => Promise<boolean>
  deleteLeague: (leagueId: string) => Promise<boolean>
  fetchLeagueUsers: (leagueId: string) => Promise<LeagueUserManagementPlayer[]>
  updateLeagueUserRole: (
    leagueId: string,
    playerId: string,
    role: Extract<LeagueMemberRole, "admin" | "player">
  ) => Promise<boolean>
  unlinkLeaguePlayerAccount: (leagueId: string, playerId: string) => Promise<boolean>
  updateLeaguePlayerName: (
    leagueId: string,
    playerId: string,
    displayName: string
  ) => Promise<boolean>
  getLeagueByInviteCode: (code: string) => League | null
  resolveLeagueInvite: (code: string) => Promise<League | null>
  getUnclaimedPlayersForLeague: (leagueId: string) => PlayerProfile[]
  claimPlayer: (leagueId: string, playerId: string) => Promise<ClaimResult>
  canAccessLeague: (leagueId: string) => boolean
  isLeagueAdmin: (leagueId: string) => boolean
  isLeagueCreator: (leagueId: string) => boolean
}

type LeagueAccessProviderProps = {
  children: ReactNode
}

const storageKey = "smash-lob-user-league-memberships"
const leaguesStorageKey = "smash-lob-leagues"
const inviteCodesStorageKey = "smash-lob-league-invite-codes"
const adminRoles: LeagueMemberRole[] = ["creator", "admin"]
const LeagueAccessContext = createContext<LeagueAccessContextValue | null>(null)
const supabaseUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isDemoDataEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true"
}

function isPersistentLeagueId(leagueId: string) {
  return isDemoDataEnabled() || supabaseUuidPattern.test(leagueId)
}

function uniqueLeaguesById(items: League[]) {
  const leaguesById = new Map<string, League>()

  items.forEach((league) => {
    leaguesById.set(league.id, league)
  })

  return Array.from(leaguesById.values())
}


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
  const fallbackMemberships = isDemoDataEnabled()
    ? defaultUserLeagueMemberships
    : []

  if (typeof window === "undefined") {
    return fallbackMemberships
  }

  const storedValue = window.localStorage.getItem(storageKey)

  if (!storedValue) {
    return fallbackMemberships
  }

  try {
    const parsedValue = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return fallbackMemberships
    }

    const storedMemberships = parsedValue
      .filter(isValidStoredMembership)
      .filter((membership) => isPersistentLeagueId(membership.leagueId))

    return mergeMemberships(fallbackMemberships, storedMemberships)
  } catch {
    return fallbackMemberships
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
  const fallbackLeagues = isDemoDataEnabled() ? defaultLeagues : []

  if (typeof window === "undefined") {
    return fallbackLeagues
  }

  const storedValue = window.localStorage.getItem(leaguesStorageKey)

  if (!storedValue) {
    return fallbackLeagues
  }

  try {
    const parsedValue = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return fallbackLeagues
    }

    const storedLeagues = uniqueLeaguesById(
      parsedValue
        .filter(isValidStoredLeague)
        .filter((league) => isPersistentLeagueId(league.id))
    )
    const storedLeagueIds = new Set(storedLeagues.map((league) => league.id))

    return uniqueLeaguesById([
      ...fallbackLeagues.filter((league) => !storedLeagueIds.has(league.id)),
      ...storedLeagues,
    ])
  } catch {
    return fallbackLeagues
  }
}

function mergeLeagues(current: League[], incoming: League[]) {
  return uniqueLeaguesById([...current, ...incoming])
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

function isSupabaseBackedId(id: string) {
  return supabaseUuidPattern.test(id)
}

function recordSupabaseError(action: string, error: unknown) {
  const details =
    typeof error === "object" && error !== null
      ? error
      : { message: String(error) }

  window.localStorage.setItem(
    "smash-lob-last-supabase-error",
    JSON.stringify({
      action,
      ...details,
      createdAt: new Date().toISOString(),
    })
  )
}

export function LeagueAccessProvider({ children }: LeagueAccessProviderProps) {
  const { data: session } = useSession()
  const { hydrateMatches } = useMatchData()
  const { hydrateSeasonSnapshot, playerProfiles, updatePlayerProfile } = useSeasonSettings()
  const userId = normalizeUserId(session?.user?.email)
  const userDisplayName = session?.user?.name
  const [hasDatabaseSuperuserAccess, setHasDatabaseSuperuserAccess] =
    useState(false)
  const isSuperuser = Boolean(userId) &&
    (isSuperuserEmail(userId) || hasDatabaseSuperuserAccess)
  const [leagues, setLeagues] = useState<League[]>(readStoredLeagues)
  const [memberships, setMemberships] = useState<UserLeagueMembership[]>(
    readStoredMemberships
  )

  function persistLeagues(nextLeaguesInput: League[]) {
    const nextLeagues = uniqueLeaguesById(nextLeaguesInput)

    setLeagues(nextLeagues)
    const customLeagues = nextLeagues.filter(
      (league) =>
        !defaultLeagues.some((defaultLeague) => defaultLeague.id === league.id)
    )
    window.localStorage.setItem(leaguesStorageKey, JSON.stringify(customLeagues))

    return nextLeagues
  }
  const [inviteCodeOverrides, setInviteCodeOverrides] =
    useState<Record<string, string>>(readStoredInviteCodes)


  useEffect(() => {
    if (!userId) {
      return
    }

    upsertAppUser({
      email: userId,
      displayName: userDisplayName,
    }).catch(() => undefined)
  }, [userDisplayName, userId])

  useEffect(() => {
    if (!userId) {
      return
    }

    fetchSupabaseLeagueSnapshot(userId)
      .then((snapshot) => {
        setHasDatabaseSuperuserAccess(snapshot.isSuperuser)
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
        setHasDatabaseSuperuserAccess(false)
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
    async ({
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
      const existingSlugs = new Set(leagues.map((league) => league.slug))
      let slug = baseSlug
      let suffix = 2

      while (existingSlugs.has(slug)) {
        slug = `${baseSlug}-${suffix}`
        suffix += 1
      }

      const inviteCode = generateInviteCode(
        slug,
        leagues.map((league) => getLeagueInviteCode(league.id))
      )

      try {
        const result = await createSupabaseLeague({
          creatorEmail: userId,
          creatorName: userDisplayName,
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
        })

        setLeagues((currentLeagues) => {
          const nextLeagues = mergeLeagues(currentLeagues, [result.league])

          persistLeagues(nextLeagues)

          return nextLeagues
        })
        setMemberships((currentMemberships) => {
          const nextMemberships = mergeMemberships(currentMemberships, [
            result.membership,
          ])

          window.localStorage.setItem(storageKey, JSON.stringify(nextMemberships))

          return nextMemberships
        })
        hydrateMatches(result.matches)
        hydrateSeasonSnapshot(result.seasonSnapshot)

        return result.league
      } catch (error) {
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

        return null
      }
    },
    [
      getLeagueInviteCode,
      hydrateMatches,
      hydrateSeasonSnapshot,
      leagues,
      userDisplayName,
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
        return uniqueLeaguesById(leagues).map(getLeagueWithInviteCode)
      }

      const accessibleLeagues = userMemberships
        .map((membership) =>
          leagues.find((league) => league.id === membership.leagueId)
        )
        .filter((league): league is League => Boolean(league))

      return uniqueLeaguesById(accessibleLeagues).map(getLeagueWithInviteCode)
    },
    [getLeagueWithInviteCode, isSuperuser, leagues, userMemberships]
  )

  const getMembershipForLeague = useCallback(
    (leagueId: string) =>
      userMemberships.find((membership) => membership.leagueId === leagueId) ??
      null,
    [userMemberships]
  )

  const canManageLeague = useCallback(
    (leagueId: string) => {
      if (isSuperuser) {
        return true
      }

      const membership = userMemberships.find(
        (item) => item.leagueId === leagueId
      )

      return Boolean(membership && adminRoles.includes(membership.role))
    },
    [isSuperuser, userMemberships]
  )

  const regenerateLeagueInviteCode = useCallback(
    async (leagueId: string) => {
      if (!userId) {
        return null
      }

      const existingCodes = leagues.map((league) =>
        league.id === leagueId
          ? ""
          : inviteCodeOverrides[league.id] ?? league.inviteCode
      )
      const code = generateInviteCode(leagueId, existingCodes)

      if (isSupabaseBackedId(leagueId)) {
        try {
          const result = await regenerateSupabaseLeagueInviteCode({
            leagueId,
            code,
            email: userId,
            displayName: userDisplayName,
          })

          setLeagues((currentLeagues) => {
            const nextLeagues = currentLeagues.map((league) =>
              league.id === result.leagueId
                ? {
                    ...league,
                    inviteCode: result.inviteCode,
                  }
                : league
            )

            persistLeagues(nextLeagues)

            return nextLeagues
          })

          const nextInviteCodeOverrides = { ...inviteCodeOverrides }
          delete nextInviteCodeOverrides[leagueId]

          setInviteCodeOverrides(nextInviteCodeOverrides)
          window.localStorage.setItem(
            inviteCodesStorageKey,
            JSON.stringify(nextInviteCodeOverrides)
          )

          return result.inviteCode
        } catch (error) {
          recordSupabaseError("regenerate-invite-code", error)
          return null
        }
      }

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
    [inviteCodeOverrides, leagues, userDisplayName, userId]
  )

  const updateLeagueDetails = useCallback(
    async (leagueId: string, details: { name: string; description: string }) => {
      const name = details.name.trim()
      const description = details.description.trim()

      if (!name) {
        return false
      }

      if (isSupabaseBackedId(leagueId)) {
        try {
          const result = await updateSupabaseLeagueDetails({
            leagueId,
            name,
            description,
          })

          setLeagues((currentLeagues) => {
            const nextLeagues = currentLeagues.map((league) =>
              league.id === result.leagueId
                ? {
                    ...league,
                    name: result.name,
                    description: result.description,
                  }
                : league
            )

            persistLeagues(nextLeagues)

            return nextLeagues
          })

          return true
        } catch (error) {
          recordSupabaseError("update-league-details", error)
          return false
        }
      }

      setLeagues((currentLeagues) => {
        const nextLeagues = currentLeagues.map((league) =>
          league.id === leagueId
            ? {
                ...league,
                name,
                description,
              }
            : league
        )

        persistLeagues(nextLeagues)

        return nextLeagues
      })

      return true
    },
    []
  )

  const updateLeagueLocations = useCallback(
    async (leagueId: string, locations: string[]) => {
      const normalizedLocations = Array.from(
        new Set(locations.map((location) => location.trim()).filter(Boolean))
      )

      if (isSupabaseBackedId(leagueId)) {
        try {
          const result = await updateSupabaseLeagueLocations({
            leagueId,
            locations: normalizedLocations,
          })

          setLeagues((currentLeagues) => {
            const nextLeagues = currentLeagues.map((league) =>
              league.id === result.leagueId
                ? {
                    ...league,
                    locations: result.locations,
                  }
                : league
            )

            persistLeagues(nextLeagues)

            return nextLeagues
          })

          return true
        } catch (error) {
          recordSupabaseError("update-league-locations", error)
          return false
        }
      }

      setLeagues((currentLeagues) => {
        const nextLeagues = currentLeagues.map((league) =>
          league.id === leagueId
            ? {
                ...league,
                locations: normalizedLocations,
              }
            : league
        )

        persistLeagues(nextLeagues)

        return nextLeagues
      })

      return true
    },
    []
  )


  const deleteLeague = useCallback(
    async (leagueId: string) => {
      if (!userId) {
        return false
      }

      const membership = memberships.find(
        (item) => item.userId === userId && item.leagueId === leagueId
      )

      if (membership?.role !== "creator") {
        return false
      }

      if (isSupabaseBackedId(leagueId)) {
        try {
          await deleteSupabaseLeague({
            leagueId,
            email: userId,
            displayName: userDisplayName,
          })
        } catch (error) {
          recordSupabaseError("delete-league", error)
          return false
        }
      }

      setLeagues((currentLeagues) => {
        const nextLeagues = currentLeagues.filter(
          (league) => league.id !== leagueId
        )

        persistLeagues(nextLeagues)

        return nextLeagues
      })
      persistMemberships(
        memberships.filter((membership) => membership.leagueId !== leagueId)
      )
      setInviteCodeOverrides((currentInviteCodeOverrides) => {
        const nextInviteCodeOverrides = { ...currentInviteCodeOverrides }
        delete nextInviteCodeOverrides[leagueId]

        window.localStorage.setItem(
          inviteCodesStorageKey,
          JSON.stringify(nextInviteCodeOverrides)
        )

        return nextInviteCodeOverrides
      })
      window.localStorage.removeItem("smash-lob-active-league")

      return true
    },
    [memberships, persistMemberships, userDisplayName, userId]
  )



  const fetchLeagueUsers = useCallback(
    async (leagueId: string) => {
      if (!canManageLeague(leagueId)) {
        return []
      }

      if (!isSupabaseBackedId(leagueId)) {
        return playerProfiles
          .filter((player) => player.leagueId === leagueId)
          .map((player) => {
            const membership = memberships.find(
              (item) =>
                item.leagueId === leagueId && item.playerId === player.id
            )

            return {
              playerId: player.id,
              displayName: player.displayName,
              avatarInitials: player.avatarInitials,
              linkedUserId: membership?.userId ?? null,
              linkedUserEmail:
                membership && !membership.userId.startsWith("__claimed__:")
                  ? membership.userId
                  : null,
              linkedUserDisplayName: null,
              role: membership?.role ?? null,
            }
          })
      }

      try {
        return await fetchSupabaseLeagueUsers(leagueId)
      } catch (error) {
        recordSupabaseError("fetch-league-users", error)
        return []
      }
    },
    [canManageLeague, memberships, playerProfiles]
  )

  const updateLeagueUserRole = useCallback(
    async (
      leagueId: string,
      playerId: string,
      role: Extract<LeagueMemberRole, "admin" | "player">
    ) => {
      if (!canManageLeague(leagueId)) {
        return false
      }

      const membership = memberships.find(
        (item) => item.leagueId === leagueId && item.playerId === playerId
      )

      if (!membership || membership.role === "creator") {
        return false
      }

      if (isSupabaseBackedId(leagueId) && isSupabaseBackedId(playerId)) {
        try {
          const result = await updateSupabaseLeagueMembershipRole({
            leagueId,
            playerId,
            role,
          })

          setMemberships((currentMemberships) => {
            const nextMemberships = currentMemberships.map((item) =>
              item.leagueId === result.leagueId && item.playerId === result.playerId
                ? {
                    ...item,
                    role: result.role,
                  }
                : item
            )

            window.localStorage.setItem(storageKey, JSON.stringify(nextMemberships))

            return nextMemberships
          })

          return true
        } catch (error) {
          recordSupabaseError("update-league-user-role", error)
          return false
        }
      }

      setMemberships((currentMemberships) => {
        const nextMemberships = currentMemberships.map((item) =>
          item.leagueId === leagueId && item.playerId === playerId
            ? {
                ...item,
                role,
              }
            : item
        )

        window.localStorage.setItem(storageKey, JSON.stringify(nextMemberships))

        return nextMemberships
      })

      return true
    },
    [canManageLeague, memberships]
  )

  const unlinkLeaguePlayerAccount = useCallback(
    async (leagueId: string, playerId: string) => {
      if (!canManageLeague(leagueId)) {
        return false
      }

      const membership = memberships.find(
        (item) => item.leagueId === leagueId && item.playerId === playerId
      )

      if (!membership || membership.role === "creator") {
        return false
      }

      if (isSupabaseBackedId(leagueId) && isSupabaseBackedId(playerId)) {
        try {
          await unlinkSupabaseLeagueMembership({ leagueId, playerId })
        } catch (error) {
          recordSupabaseError("unlink-league-player-account", error)
          return false
        }
      }

      setMemberships((currentMemberships) => {
        const nextMemberships = currentMemberships.filter(
          (item) =>
            !(item.leagueId === leagueId && item.playerId === playerId)
        )

        window.localStorage.setItem(storageKey, JSON.stringify(nextMemberships))

        return nextMemberships
      })

      return true
    },
    [canManageLeague, memberships]
  )

  const updateLeaguePlayerName = useCallback(
    async (leagueId: string, playerId: string, displayName: string) => {
      const cleanDisplayName = displayName.trim()

      if (!canManageLeague(leagueId) || !cleanDisplayName) {
        return false
      }

      if (isSupabaseBackedId(leagueId) && isSupabaseBackedId(playerId)) {
        try {
          const result = await updateSupabasePlayerDisplayName({
            leagueId,
            playerId,
            displayName: cleanDisplayName,
          })

          updatePlayerProfile(result)

          return true
        } catch (error) {
          recordSupabaseError("update-league-player-name", error)
          return false
        }
      }

      const avatarInitials = cleanDisplayName
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "JG"

      updatePlayerProfile({
        playerId,
        displayName: cleanDisplayName,
        avatarInitials,
      })

      return true
    },
    [canManageLeague, updatePlayerProfile]
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

  const resolveLeagueInvite = useCallback(
    async (code: string) => {
      const localLeague = getLeagueByInviteCode(code)

      try {
        const snapshot = await fetchSupabaseInviteSnapshot(code)

        if (!snapshot) {
          return localLeague
        }

        setLeagues((currentLeagues) => {
          const nextLeagues = mergeLeagues(currentLeagues, [snapshot.league])

          persistLeagues(nextLeagues)

          return nextLeagues
        })
        setMemberships((currentMemberships) =>
          mergeMemberships(currentMemberships, snapshot.claimedMemberships)
        )
        hydrateMatches(snapshot.matches)
        hydrateSeasonSnapshot(snapshot.seasonSnapshot)

        return snapshot.league
      } catch (error) {
        recordSupabaseError("resolve-league-invite", error)
        return localLeague
      }
    },
    [
      getLeagueByInviteCode,
      hydrateMatches,
      hydrateSeasonSnapshot,
    ]
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
    async (leagueId: string, playerId: string): Promise<ClaimResult> => {
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

      if (isSupabaseBackedId(leagueId) && isSupabaseBackedId(playerId)) {
        try {
          const result = await claimSupabasePlayer({
            email: userId,
            displayName: userDisplayName,
            leagueId,
            playerId,
          })

          if (result.ok) {
            persistMemberships(
              mergeMemberships(memberships, [result.membership])
            )
          }

          return result
        } catch (error) {
          recordSupabaseError("claim-player", error)
          return { ok: false, error: "player-already-claimed" }
        }
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
    [memberships, persistMemberships, userDisplayName, userId]
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


  const isLeagueCreator = useCallback(
    (leagueId: string) => {
      const membership = getMembershipForLeague(leagueId)

      return membership?.role === "creator"
    },
    [getMembershipForLeague]
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
      updateLeagueDetails,
      updateLeagueLocations,
      deleteLeague,
      fetchLeagueUsers,
      updateLeagueUserRole,
      unlinkLeaguePlayerAccount,
      updateLeaguePlayerName,
      getLeagueByInviteCode,
      resolveLeagueInvite,
      getUnclaimedPlayersForLeague,
      claimPlayer,
      canAccessLeague,
      isLeagueAdmin,
      isLeagueCreator,
    }),
    [
      canAccessLeague,
      createLeague,
      claimPlayer,
      deleteLeague,
      fetchLeagueUsers,
      updateLeagueUserRole,
      unlinkLeaguePlayerAccount,
      updateLeaguePlayerName,
      getLeagueByInviteCode,
      getLeagueInviteCode,
      getMembershipForLeague,
      getUnclaimedPlayersForLeague,
      isPlayerClaimed,
      regenerateLeagueInviteCode,
      updateLeagueDetails,
      updateLeagueLocations,
      resolveLeagueInvite,
      isLeagueAdmin,
      isLeagueCreator,
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
