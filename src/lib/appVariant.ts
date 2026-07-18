const productionAppUrl = "https://smash-lob.vercel.app"

function normalizeUrl(value: string | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\/+$/, "")
}

export function getAppUrl() {
  return normalizeUrl(process.env.NEXT_PUBLIC_APP_URL)
}

export function isPreproductionApp() {
  const explicitVariant = (process.env.NEXT_PUBLIC_APP_VARIANT ?? "").trim().toLowerCase()

  if (explicitVariant === "pre" || explicitVariant === "staging") {
    return true
  }

  const appUrl = getAppUrl()

  if (!appUrl) {
    return false
  }

  if (appUrl === normalizeUrl(productionAppUrl)) {
    return false
  }

  return appUrl.includes("staging") || appUrl.includes("preview") || appUrl.includes("pre")
}

export function getAppBranding() {
  const preproduction = isPreproductionApp()

  return {
    preproduction,
    applicationName: preproduction ? "Smash & Lob PRE" : "Smash & Lob Padel",
    siteName: preproduction ? "Smash & Lob PRE" : "Smash & Lob",
    shortName: preproduction ? "S&L PRE" : "Smash & Lob",
    browserTitle: preproduction ? "Smash & Lob PRE" : "Smash & Lob",
    titleTemplate: preproduction ? "%s · Smash & Lob PRE" : "%s · Smash & Lob",
    appleWebAppTitle: preproduction ? "Smash & Lob PRE" : "Smash & Lob",
    installPromptTitle: preproduction ? "Instala Smash & Lob PRE" : "Instala Smash & Lob",
    installPromptMonogram: preproduction ? "PRE" : "S&L",
    internalBadgeText: preproduction ? "PRE" : null,
    internalBadgeAriaLabel: preproduction ? "Entorno de preproducción" : null,
    themeColor: preproduction ? "#b91c1c" : "#0a0a0a",
    backgroundColor: preproduction ? "#fff1f2" : "#f5f5f5",
    variantKey: preproduction ? "pre" : "prod",
  }
}
