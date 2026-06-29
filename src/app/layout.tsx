import type { Metadata } from "next"
import { AuthGate } from "@/components/auth/AuthGate"
import { LeagueEntryGate } from "@/components/auth/LeagueEntryGate"
import { ActiveLeagueProvider } from "@/context/ActiveLeagueProvider"
import { AuthSessionProvider } from "@/context/AuthSessionProvider"
import { CurrentUserProvider } from "@/context/CurrentUserProvider"
import { LeagueAccessProvider } from "@/context/LeagueAccessProvider"
import { LeagueSettingsProvider } from "@/context/LeagueSettingsProvider"
import { MatchDataProvider } from "@/context/MatchDataProvider"
import { SeasonSettingsProvider } from "@/context/SeasonSettingsProvider"
import { AppShell } from "@/components/layout/AppShell"
import { I18nProvider } from "@/i18n/I18nProvider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Smash & Lob",
  description: "Liga privada de pádel",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body>
        <I18nProvider>
          <AuthSessionProvider>
            <AuthGate>
              <LeagueAccessProvider>
                <ActiveLeagueProvider>
                  <CurrentUserProvider>
                    <LeagueSettingsProvider>
                      <SeasonSettingsProvider>
                        <MatchDataProvider>
                          <LeagueEntryGate>
                            <AppShell>{children}</AppShell>
                          </LeagueEntryGate>
                        </MatchDataProvider>
                      </SeasonSettingsProvider>
                    </LeagueSettingsProvider>
                  </CurrentUserProvider>
                </ActiveLeagueProvider>
              </LeagueAccessProvider>
            </AuthGate>
          </AuthSessionProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
