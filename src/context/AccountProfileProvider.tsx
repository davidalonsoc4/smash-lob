"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { AccountProfile } from "@/lib/accountProfile"

type AccountProfileContextValue = {
  profile: AccountProfile | null
  isLoading: boolean
  error: string | null
  refreshProfile: () => Promise<AccountProfile | null>
  saveProfile: (firstName: string, lastName: string) => Promise<AccountProfile | null>
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

  const saveProfile = useCallback(async (firstName: string, lastName: string) => {
    setError(null)

    try {
      const nextProfile = await readProfileResponse(
        await fetch("/api/account/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName, lastName }),
          cache: "no-store",
        }),
      )
      setProfile(nextProfile)
      return nextProfile
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "profile_save_failed")
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

  const value = useMemo(
    () => ({ profile, isLoading, error, refreshProfile, saveProfile }),
    [error, isLoading, profile, refreshProfile, saveProfile],
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
