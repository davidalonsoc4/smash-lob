"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import type { AccountProfile, DominantHand, PreferredPlayerSide } from "@/lib/accountProfile"
import type { WeeklyAvailability } from "@/lib/playerAvailability"
import { LEAGUE_MEMBERSHIP_CHANGED_EVENT, MATCH_DASHBOARD_REFRESH_EVENT, PAYMENT_LEDGER_REFRESH_EVENT, PERSONAL_PROFILE_HISTORY_REFRESH_EVENT, TOURNAMENT_LIST_REFRESH_EVENT } from "@/lib/appRefreshEvents"
import { createPaymentLedger } from "@/lib/paymentLedger"
import { createPersonalMatchesDashboard } from "@/lib/personalMatchesDashboard"
import { createTournamentList } from "@/lib/tournamentList"
import { createPersonalProfileHistory } from "@/lib/personalProfileHistory"

type AccountProfileContextValue = {
  account: string
  history: ReturnType<typeof createPersonalProfileHistory>
  matchDashboard: ReturnType<typeof createPersonalMatchesDashboard>
  tournamentList: ReturnType<typeof createTournamentList>
  ledger: ReturnType<typeof createPaymentLedger>
  profile: AccountProfile | null
  isLoading: boolean
  error: string | null
  refreshProfile: () => Promise<AccountProfile | null>
  saveProfile: (
    firstName: string,
    lastName: string,
    availability?: {
      timezone: string
      weeklySlots: WeeklyAvailability
    },
    preferredSide?: PreferredPlayerSide | null,
    dominantHand?: DominantHand | null,
  ) => Promise<AccountProfile | null>
  saveAvatar: (avatarUrl: string | null) => Promise<AccountProfile | null>
}

const AccountProfileContext = createContext<AccountProfileContextValue | null>(null)

async function readProfileResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as {
    profile?: AccountProfile
    error?: string
  } | null

  if (!response.ok || !payload?.profile) {
    throw new Error(payload?.error ?? `profile-api-${response.status}`)
  }

  return payload.profile
}

export function AccountProfileProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const account = session?.user?.email ?? ""
  const [history] = useState(() => createPersonalProfileHistory(account))
  const [ledger] = useState(() => createPaymentLedger(account))
  const [matchDashboard] = useState(() => createPersonalMatchesDashboard(account))
  const [tournamentList] = useState(() => createTournamentList(account))
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const nextProfile = await readProfileResponse(
        await fetch("/api/account/profile", { cache: "no-store" }),
      )
      setProfile(nextProfile)
      return nextProfile
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "profile_load_failed")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveProfile = useCallback(
    async (
      firstName: string,
      lastName: string,
      availability?: {
        timezone: string
        weeklySlots: WeeklyAvailability
      },
      preferredSide?: PreferredPlayerSide | null,
      dominantHand?: DominantHand | null,
    ) => {
      setError(null)

      try {
        const nextProfile = await readProfileResponse(
          await fetch("/api/account/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName,
              lastName,
              timezone: availability?.timezone,
              weeklySlots: availability?.weeklySlots,
              preferredSide,
              dominantHand,
            }),
            cache: "no-store",
          }),
        )
        setProfile(nextProfile)
        return nextProfile
      } catch (profileError) {
        setError(profileError instanceof Error ? profileError.message : "profile_save_failed")
        return null
      }
    },
    [],
  )

  const saveAvatar = useCallback(async (avatarUrl: string | null) => {
    setError(null)

    try {
      const nextProfile = await readProfileResponse(
        await fetch("/api/account/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl }),
          cache: "no-store",
        }),
      )
      setProfile(nextProfile)
      return nextProfile
    } catch (profileError) {
      setError(
        profileError instanceof Error
          ? profileError.message
          : "profile_avatar_save_failed",
      )
      return null
    }
  }, [])

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()

    void fetch("/api/account/profile", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(readProfileResponse)
      .then((nextProfile) => {
        if (!isActive) return
        setProfile(nextProfile)
      })
      .catch((profileError: unknown) => {
        if (!isActive || controller.signal.aborted) return
        setError(
          profileError instanceof Error ? profileError.message : "profile_load_failed",
        )
      })
      .finally(() => {
        if (!isActive) return
        setIsLoading(false)
      })

    return () => {
      isActive = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    const historyChanged = () => {
      history.invalidate()
      matchDashboard.invalidate()
    }
    const membershipChanged = () => {
      history.discard()
      matchDashboard.discard()
      ledger.discard()
    }
    window.addEventListener(LEAGUE_MEMBERSHIP_CHANGED_EVENT, membershipChanged)
    window.addEventListener(PERSONAL_PROFILE_HISTORY_REFRESH_EVENT, historyChanged)
    window.addEventListener(MATCH_DASHBOARD_REFRESH_EVENT, matchDashboard.invalidate)
    window.addEventListener(TOURNAMENT_LIST_REFRESH_EVENT, tournamentList.invalidate)
    window.addEventListener(PAYMENT_LEDGER_REFRESH_EVENT, ledger.invalidate)
    return () => {
      window.removeEventListener(LEAGUE_MEMBERSHIP_CHANGED_EVENT, membershipChanged)
      window.removeEventListener(PERSONAL_PROFILE_HISTORY_REFRESH_EVENT, historyChanged)
      window.removeEventListener(MATCH_DASHBOARD_REFRESH_EVENT, matchDashboard.invalidate)
      window.removeEventListener(TOURNAMENT_LIST_REFRESH_EVENT, tournamentList.invalidate)
      matchDashboard.cancel()
      tournamentList.cancel()
      window.removeEventListener(PAYMENT_LEDGER_REFRESH_EVENT, ledger.invalidate)
      history.cancel()
      ledger.cancel()
    }
  }, [history, ledger, matchDashboard, tournamentList])

  const value = useMemo(
    () => ({ account, history, ledger, matchDashboard, tournamentList, profile, isLoading, error, refreshProfile, saveProfile, saveAvatar }),
    [account, error, history, isLoading, ledger, matchDashboard, profile, refreshProfile, saveAvatar, saveProfile, tournamentList],
  )

  return (
    <AccountProfileContext.Provider value={value}>
      {children}
    </AccountProfileContext.Provider>
  )
}

export function useAccountProfile() {
  const context = useContext(AccountProfileContext)

  if (!context) {
    throw new Error("useAccountProfile must be used inside AccountProfileProvider")
  }

  return context
}
