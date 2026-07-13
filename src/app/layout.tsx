import type { Metadata, Viewport } from "next"
import { AuthGate } from "@/components/auth/AuthGate"
import { LeagueEntryGate } from "@/components/auth/LeagueEntryGate"
import { ActiveLeagueProvider } from "@/context/ActiveLeagueProvider"
import { AuthSessionProvider } from "@/context/AuthSessionProvider"
import { CurrentUserProvider } from "@/context/CurrentUserProvider"
import { LeagueAccessProvider } from "@/context/LeagueAccessProvider"
import { MatchDataProvider } from "@/context/MatchDataProvider"
import { MvpProvider } from "@/context/MvpProvider"
import { SeasonSettingsProvider } from "@/context/SeasonSettingsProvider"
import { AppShell } from "@/components/layout/AppShell"
import { AutoPushRegistration } from "@/components/notifications/AutoPushRegistration"
import { I18nProvider } from "@/i18n/I18nProvider"
import { ThemeProvider } from "@/context/ThemeProvider"
import "./globals.css"

export const metadata: Metadata = {
  applicationName: "Smash & Lob Padel",
  title: {
    default: "Smash & Lob",
    template: "%s · Smash & Lob",
  },
  description: "Ligas privadas de pádel con calendario, ranking y resultados.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Smash & Lob",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('smash-lob-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
        <I18nProvider>
          <AuthSessionProvider>
            <AuthGate>
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
            </AuthGate>
          </AuthSessionProvider>
        </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
