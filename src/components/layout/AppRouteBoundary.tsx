"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AuthGate } from "@/components/auth/AuthGate"
import { LeagueEntryGate } from "@/components/auth/LeagueEntryGate"
import { ProfileCompletionGate } from "@/components/auth/ProfileCompletionGate"
import { AppShell } from "@/components/layout/AppShell"
import { OfflineGate } from "@/components/layout/OfflineGate"
import { PwaInstallPrompt } from "@/components/layout/PwaInstallPrompt"
import { PwaUpdatePrompt } from "@/components/layout/PwaUpdatePrompt"
import { AutoPushRegistration } from "@/components/notifications/AutoPushRegistration"
import { PushPermissionReminder } from "@/components/notifications/PushPermissionReminder"
import { AccountProfileProvider } from "@/context/AccountProfileProvider"
import { ActiveLeagueProvider } from "@/context/ActiveLeagueProvider"
import { CurrentUserProvider } from "@/context/CurrentUserProvider"
import { OnboardingProvider } from "@/features/onboarding/OnboardingProvider"
import { GuidedTourOverlay } from "@/components/onboarding/GuidedTourOverlay"
import { LeagueAccessProvider } from "@/context/LeagueAccessProvider"
import { MatchDataProvider } from "@/context/MatchDataProvider"
import { MvpProvider } from "@/context/MvpProvider"
import { SeasonSettingsProvider } from "@/context/SeasonSettingsProvider"

const publicRoutes = new Set(["/about", "/privacy", "/terms", "/auth/error", "/offline"])

export function AppRouteBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    const openNotification = (event: MessageEvent) => {
      if (event.source !== navigator.serviceWorker.controller || event.data?.type !== "OPEN_NOTIFICATION" || typeof event.data.url !== "string") return
      const url = new URL(event.data.url, window.location.origin)
      if (url.origin !== window.location.origin || url.pathname.startsWith("//")) return
      router.push(url.pathname + url.search + url.hash)
      event.ports[0]?.postMessage("navigating")
    }
    navigator.serviceWorker.addEventListener("message", openNotification)
    return () => navigator.serviceWorker.removeEventListener("message", openNotification)
  }, [router])

  if (pathname === "/") return children

  if (publicRoutes.has(pathname) || pathname.startsWith("/spectate/")) {
    return (
      <>
        <PwaInstallPrompt />
        <PwaUpdatePrompt />
        {children}
      </>
    )
  }

  return (
    <>
      <PwaInstallPrompt />
      <PwaUpdatePrompt />
      <OfflineGate>
        <AuthGate>
          <AccountProfileProvider>
            <SeasonSettingsProvider>
              <MatchDataProvider>
                <LeagueAccessProvider>
                  <ProfileCompletionGate>
                    <MvpProvider>
                      <ActiveLeagueProvider>
                        <CurrentUserProvider>
                          <LeagueEntryGate>
                            <OnboardingProvider>
                              <AutoPushRegistration />
                              <PushPermissionReminder />
                              <AppShell>{children}</AppShell>
                              <GuidedTourOverlay />
                            </OnboardingProvider>
                          </LeagueEntryGate>
                        </CurrentUserProvider>
                      </ActiveLeagueProvider>
                    </MvpProvider>
                  </ProfileCompletionGate>
                </LeagueAccessProvider>
              </MatchDataProvider>
            </SeasonSettingsProvider>
          </AccountProfileProvider>
        </AuthGate>
      </OfflineGate>
    </>
  )
}
