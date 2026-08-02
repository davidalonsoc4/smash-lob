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
            __html: `(function(){try{var l=localStorage.getItem('smash-lob-theme');var m=localStorage.getItem('smash-lob-theme-mode');var s=localStorage.getItem('smash-lob-visual-style');var p=localStorage.getItem('smash-lob-colorful-palette')||'indigo';var tm=['light','dark','system'];var vs=['plain','colorful'];var ps=['indigo','midnight','sage','burgundy','terracotta','graphite'];var pm={ocean:'midnight',emerald:'sage',coral:'burgundy',sunset:'terracotta'};if(tm.indexOf(m)<0)m=tm.indexOf(l)>=0?l:'light';if(vs.indexOf(s)<0)s=l==='colorful'?'colorful':'plain';if(ps.indexOf(p)<0)p=pm[p]||'indigo';var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var c=s==='colorful';var r=d?'dark':'light';var h={indigo:{light:'#5b5ce2',dark:'#17172e'},midnight:{light:'#365f9d',dark:'#0d1726'},sage:{light:'#55765f',dark:'#101b15'},burgundy:{light:'#8b3f57',dark:'#241219'},terracotta:{light:'#a95640',dark:'#251713'},graphite:{light:'#4f6379',dark:'#121820'}};var e=document.documentElement;e.classList.toggle('dark',d);e.classList.toggle('colorful',c);e.dataset.theme=r;e.dataset.style=s;e.dataset.colorfulPalette=p;e.style.colorScheme=r;var mt=document.querySelector('meta[name="theme-color"]');if(mt)mt.setAttribute('content',c?h[p][r]:d?'#0b1119':'#0a0a0a')}catch(e){}})();`,
          }}
        />
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
