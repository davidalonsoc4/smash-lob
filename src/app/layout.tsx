import type { Metadata } from "next"
import { ActiveLeagueProvider } from "@/context/ActiveLeagueProvider"
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
          <ActiveLeagueProvider>
            <LeagueSettingsProvider>
              <SeasonSettingsProvider>
                <MatchDataProvider>
                  <AppShell>{children}</AppShell>
                </MatchDataProvider>
              </SeasonSettingsProvider>
            </LeagueSettingsProvider>
          </ActiveLeagueProvider>
        </I18nProvider>
      </body>
    </html>
  )
}