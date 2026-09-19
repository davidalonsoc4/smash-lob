import type { Metadata, Viewport } from "next"
import { AuthSessionProvider } from "@/context/AuthSessionProvider"
import { AppRouteBoundary } from "@/components/layout/AppRouteBoundary"
import { I18nProvider } from "@/i18n/I18nProvider"
import { ThemeProvider } from "@/context/ThemeProvider"
import "./globals.css"
import { getAppBranding } from "@/lib/appVariant"
import { getPublicAppBaseUrl } from "@/lib/appUrl"

const branding = getAppBranding()

export const metadata: Metadata = {
  metadataBase: new URL(getPublicAppBaseUrl()),
  applicationName: branding.applicationName,
  title: {
    default: branding.browserTitle,
    template: branding.titleTemplate,
  },
  description: "Ligas privadas de pádel con calendario, ranking y resultados.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: branding.appleWebAppTitle,
  },
  icons: {
    icon: [
      { url: branding.favicon, rel: "icon" },
      { url: branding.favicon16, sizes: "16x16", type: "image/png" },
      { url: branding.favicon32, sizes: "32x32", type: "image/png" },
      { url: branding.icon192, sizes: "192x192", type: "image/png" },
      { url: branding.icon512, sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: branding.appleTouchIcon, sizes: "180x180", type: "image/png" },
    ],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: branding.themeColor,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href={branding.favicon} />
        <link rel="icon" href={branding.favicon16} sizes="16x16" type="image/png" />
        <link rel="icon" href={branding.favicon32} sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href={branding.appleTouchIcon} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem('smash-lob-theme'),m=localStorage.getItem('smash-lob-theme-mode'),s=localStorage.getItem('smash-lob-visual-style'),p=localStorage.getItem('smash-lob-palette')||localStorage.getItem('smash-lob-colorful-palette'),tm=['light','dark','system'],ps=['classic','indigo','midnight','sage','burgundy','graphite','league'],host=window.location.hostname,isLocal=host==='localhost'||host==='127.0.0.1'||host.indexOf('192.168.')===0,competition=s==='competition'&&isLocal&&'${process.env.NEXT_PUBLIC_COMPETITION_STYLE_ENABLED ?? ""}'!=='false';if(tm.indexOf(m)<0)m=tm.indexOf(l)>=0?l:'light';if(s==='plain'||s==='colorful')s='classic';if(s!=='classic'&&s!=='competition')s='classic';if(!competition)s='classic';if(ps.indexOf(p)<0||p==='terracotta'||p==='league')p=p==='terracotta'?'graphite':'classic';var d=s==='competition'||m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches),r=d?'dark':'light',e=document.documentElement;e.classList.toggle('dark',d);e.classList.toggle('colorful',false);e.classList.toggle('competition',s==='competition');e.dataset.theme=r;e.dataset.baseTheme=s==='competition'?'dark':m;e.dataset.style=s;e.dataset.visualStyle=s;e.dataset.palette=s==='competition'?'league':p;e.dataset.colorfulPalette=s==='competition'?'league':p;e.style.colorScheme=r;var mt=document.querySelector('meta[name="theme-color"]');if(mt)mt.setAttribute('content',s==='competition'?'#D7A544':d?'#0b1119':'#0a0a0a')}catch(e){}})();`,
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var n=navigator,s=window.screen,m=window.matchMedia('(display-mode: standalone)').matches||n.standalone===true,h=Math.max(s.width,s.height);if(m&&/iPhone/i.test(n.userAgent)&&h>=812)document.documentElement.style.setProperty('--app-safe-top-fallback',h>=852?'59px':'47px')}catch(e){}})();` }} />
      </head>
      <body>
        <ThemeProvider>
        <I18nProvider>
          <AuthSessionProvider>
            <AppRouteBoundary>{children}</AppRouteBoundary>
          </AuthSessionProvider>
        </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
