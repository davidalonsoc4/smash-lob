"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { AuthGate } from "@/components/auth/AuthGate"
import { LeagueEntryGate } from "@/components/auth/LeagueEntryGate"
import { ProfileCompletionGate } from "@/components/auth/ProfileCompletionGate"
import { AppShell } from "@/components/layout/AppShell"
import { OfflineGate } from "@/components/layout/OfflineGate"
import { PwaInstallPrompt } from "@/components/layout/PwaInstallPrompt"
import { PwaUpdatePrompt } from "@/components/layout/PwaUpdatePrompt"
import { AutoPushRegistration } from "@/components/notifications/AutoPushRegistration"
import { AccountProfileProvider } from "@/context/AccountProfileProvider"
import { ActiveLeagueProvider } from "@/context/ActiveLeagueProvider"
import { CurrentUserProvider } from "@/context/CurrentUserProvider"
import { LeagueAccessProvider } from "@/context/LeagueAccessProvider"
import { MatchDataProvider } from "@/context/MatchDataProvider"
import { MvpProvider } from "@/context/MvpProvider"
import { SeasonSettingsProvider } from "@/context/SeasonSettingsProvider"

const publicRoutes = new Set(["/about", "/privacy", "/terms", "/auth/error", "/offline"])

export function AppRouteBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  if (publicRoutes.has(pathname)) {
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
            <ProfileCompletionGate>
              <SeasonSettingsProvider>
                <MatchDataProvider>
                  <LeagueAccessProvider>
                    <MvpProvider>
                      <ActiveLeagueProvider>
                        <CurrentUserProvider>
                          <LeagueEntryGate>
                            <AutoPushRegistration />
                            <AppShell>{children}</AppShell>
                          </LeagueEntryGate>
                        </CurrentUserProvider>
                      </ActiveLeagueProvider>
                    </MvpProvider>
                  </LeagueAccessProvider>
                </MatchDataProvider>
              </SeasonSettingsProvider>
            </ProfileCompletionGate>
          </AccountProfileProvider>
        </AuthGate>
      </OfflineGate>
    </>
  )
}
