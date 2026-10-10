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
        <meta name="msapplication-navbutton-color" content={branding.themeColor} />
          <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem('smash-lob-theme'),m=localStorage.getItem('smash-lob-theme-mode'),s=localStorage.getItem('smash-lob-visual-style'),p=localStorage.getItem('smash-lob-palette')||localStorage.getItem('smash-lob-colorful-palette'),ca=localStorage.getItem('smash-lob-competition-accent')||'league',tm=['light','dark','system'],ps=['classic','indigo','midnight','sage','burgundy','graphite','league'],cm={league:'#D7A544',gold:'#D7A544',blue:'#477BD1',green:'#3D9D86',coral:'#D4643C',violet:'#8B5FC0',ice:'#53B4D1'},pm={classic:'#111827',indigo:'#5b5ce2',midnight:'#365f9d',sage:'#55765f',burgundy:'#8b3f57',graphite:'#4f6379'};if(tm.indexOf(m)<0)m=tm.indexOf(l)>=0?l:'light';if(s==='plain'||s==='colorful')s='classic';if(s!=='classic'&&s!=='competition')s='classic';if(ps.indexOf(p)<0||p==='terracotta'||p==='league')p=p==='terracotta'?'graphite':'classic';if(!cm[ca])ca='league';var colorful=s==='classic'&&p!=='classic',d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches),r=d?'dark':'light',e=document.documentElement,a=s==='competition'?cm[ca]:(pm[p]||pm.classic);e.classList.toggle('dark',d);e.classList.toggle('colorful',colorful);e.classList.toggle('competition',s==='competition');e.dataset.theme=r;e.dataset.baseTheme=m;e.dataset.style=s;e.dataset.visualStyle=s;e.dataset.palette=s==='competition'?'league':p;e.dataset.colorfulPalette=s==='competition'?'league':p;e.style.setProperty('--app-accent',a);e.style.setProperty('--competition-accent',a);var at=a;if(!d){for(var f=1;f>=0;f-=.02){var c=[1,3,5].map(function(i){return Math.round(parseInt(a.slice(i,i+2),16)*Math.max(0,f))}),cl=c.map(function(v){return v/255<=.04045?v/255/12.92:Math.pow((v/255+.055)/1.055,2.4)});if(cl[0]*.2126+cl[1]*.7152+cl[2]*.0722<=.12){at='#'+c.map(function(v){return v.toString(16).padStart(2,'0')}).join('');break}}}e.style.setProperty('--competition-accent-text',at);e.style.colorScheme=r;var mt=document.querySelector('meta[name="theme-color"]');if(mt)mt.setAttribute('content',s==='competition'?(d?'#0b0c0e':'#f3f5f8'):a)}catch(e){}})();`,
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var n=navigator,s=window.screen,m=window.matchMedia('(display-mode: standalone)').matches||n.standalone===true,h=Math.max(s.width,s.height);if(m&&/iPhone/i.test(n.userAgent)&&h>=812)document.documentElement.style.setProperty('--app-safe-top-fallback',h>=852?'59px':'47px')}catch(e){}})();` }} />
      </head>
      <body>
        <AuthSessionProvider>
          <ThemeProvider>
          <I18nProvider>
            <AppRouteBoundary>{children}</AppRouteBoundary>
          </I18nProvider>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
