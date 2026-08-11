import { readFile } from "node:fs/promises"

const requiredSnippets = new Map([
  [
    "src/components/layout/AppRouteBoundary.tsx",
    ["<OnboardingProvider>", "<GuidedTourOverlay />"],
  ],
  [
    "src/components/layout/AppShell.tsx",
    [
      "<FloatingHelpButton",
      'data-tour="floating-settings"',
      'data-tour="floating-notifications"',
    ],
  ],
  [
    "src/features/onboarding/OnboardingProvider.tsx",
    [
      'fetch("/api/onboarding/progress"',
      "readLocalOnboardingProgress",
      "hasCompletedCurrentTour",
      "readRequestedTourKey",
      "getTourStepsForLaunch",
      "hasSeenWelcome",
    ],
  ],
  [
    "src/features/onboarding/tours.ts",
    [
      'key: "home"',
      'key: "matches"',
      'key: "ranking"',
      'key: "statistics"',
      'key: "season-admin"',
      'key: "settings"',
      "[data-tour='floating-invite-players']",
      "[data-tour='floating-share-spectators']",
      "firstRunOnly: true",
      "wide: true",
      "es:",
      "en:",
      "eu:",
    ],
  ],
  [
    "src/app/api/onboarding/progress/route.ts",
    ["requireAuthenticatedAppUser", "enforceRequestRateLimit", 'from("user_onboarding_progress")'],
  ],
  [
    "supabase/migrations/20260806221500_add_guided_onboarding_progress.sql",
    [
      "CREATE TABLE IF NOT EXISTS public.user_onboarding_progress",
      "ENABLE ROW LEVEL SECURITY",
      "REVOKE ALL ON TABLE public.user_onboarding_progress FROM PUBLIC, anon, authenticated",
      "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_onboarding_progress TO service_role",
    ],
  ],
  ["src/app/page.tsx", ['data-tour="home-header"', 'data-tour="home-league-switcher"', 'data-tour="home-next-match"']],
  ["src/app/matches/page.tsx", ['data-tour="matches-round-list"']],
  ["src/app/ranking/page.tsx", ['data-tour="ranking-table"']],
  ["src/app/statistics/page.tsx", ['data-tour="statistics-navigation"']],
  ["src/app/admin/season/page.tsx", ['data-tour="season-admin-navigation"']],
  [
    "src/app/settings/page.tsx",
    [
      'tour="settings-profile"',
      'tour="settings-appearance"',
      'tour="settings-notifications"',
      'tour="settings-context-switcher"',
      'tour="settings-suggestions"',
    ],
  ],
  ["src/components/settings/GlobalSettingsSearch.tsx", ['data-tour="settings-search"']],
  ["src/components/invite/FloatingInviteShareButton.tsx", ['data-tour="floating-invite-players"']],
  ["src/components/spectator/FloatingSpectatorShareButton.tsx", ['data-tour="floating-share-spectators"']],
])

const failures = []
for (const [file, snippets] of requiredSnippets) {
  const source = await readFile(file, "utf8")
  for (const snippet of snippets) {
    if (!source.includes(snippet)) failures.push(`${file}: falta ${JSON.stringify(snippet)}`)
  }
}

const toursSource = await readFile("src/features/onboarding/tours.ts", "utf8")
const structureSource = toursSource.slice(toursSource.indexOf("const tourStructure"))
if (structureSource.includes('key: "app-introduction"')) {
  failures.push("Bienvenida no debe existir como recorrido independiente")
}
if (!structureSource.includes("[data-tour='home-league-switcher']")) failures.push("La guía de Inicio debe explicar el selector de liga")
const floatingOrder = [
  "[data-tour='floating-settings']",
  "[data-tour='floating-notifications']",
  "[data-tour='floating-share-spectators']",
  "[data-tour='floating-invite-players']",
  "[data-tour='floating-help']",
]
let previousIndex = -1
for (const selector of floatingOrder) {
  const currentIndex = structureSource.indexOf(selector)
  if (currentIndex <= previousIndex) {
    failures.push(`Orden incorrecto de controles flotantes en Inicio: ${selector}`)
  }
  previousIndex = currentIndex
}

const floatingTitlesByLocale = {
  es: ["Ajustes", "Notificaciones", "Compartir con espectadores", "Invitar jugadores", "Ayuda visual"],
  en: ["Settings", "Notifications", "Share with spectators", "Invite players", "Visual help"],
  eu: ["Ezarpenak", "Jakinarazpenak", "Ikusleekin partekatu", "Jokalariak gonbidatu", "Laguntza bisuala"],
}
for (const [locale, expectedTitles] of Object.entries(floatingTitlesByLocale)) {
  const localeStart = toursSource.indexOf(`${locale}: {`)
  const nextLocaleStart = locale === "es"
    ? toursSource.indexOf("  en: {", localeStart)
    : locale === "en"
      ? toursSource.indexOf("  eu: {", localeStart)
      : toursSource.indexOf("const tourStructure", localeStart)
  const localeSource = toursSource.slice(localeStart, nextLocaleStart)
  const homeStart = localeSource.indexOf("home: {")
  const matchesStart = localeSource.indexOf("matches: {", homeStart)
  const homeSource = localeSource.slice(homeStart, matchesStart)
  const titles = [...homeSource.matchAll(/title:\s*"([^"]+)"/g)].map((match) => match[1])
  const actualFloatingTitles = titles.slice(-5)
  if (JSON.stringify(actualFloatingTitles) !== JSON.stringify(expectedTitles)) {
    failures.push(`Textos incorrectos de controles flotantes en Inicio (${locale}): ${actualFloatingTitles.join(" | ")}`)
  }
}


const settingsOrder = [
  "[data-tour='settings-profile']",
  "[data-tour='settings-appearance']",
  "[data-tour='settings-notifications']",
  "[data-tour='settings-context-switcher']",
  "[data-tour='settings-suggestions']",
  "[data-tour='settings-search']",
]
previousIndex = -1
for (const selector of settingsOrder) {
  const currentIndex = structureSource.indexOf(selector)
  if (currentIndex <= previousIndex) {
    failures.push(`Orden incorrecto de la guía de Ajustes: ${selector}`)
  }
  previousIndex = currentIndex
}

const settingsTitlesByLocale = {
  es: ["Tu perfil", "Apariencia", "Notificaciones", "Tus ligas y Mis partidos", "Buzón de sugerencias", "Buscador de ajustes"],
  en: ["Your profile", "Appearance", "Notifications", "Your leagues and My matches", "Suggestions", "Settings search"],
  eu: ["Zure profila", "Itxura", "Jakinarazpenak", "Zure ligak eta Nire partidak", "Iradokizunak", "Ezarpenen bilatzailea"],
}
for (const [locale, expectedTitles] of Object.entries(settingsTitlesByLocale)) {
  const localeStart = toursSource.indexOf(`${locale}: {`)
  const nextLocaleStart = locale === "es"
    ? toursSource.indexOf("  en: {", localeStart)
    : locale === "en"
      ? toursSource.indexOf("  eu: {", localeStart)
      : toursSource.indexOf("const tourStructure", localeStart)
  const localeSource = toursSource.slice(localeStart, nextLocaleStart)
  const settingsStart = localeSource.indexOf("settings: {")
  const adminStart = localeSource.indexOf('"season-admin": {', settingsStart)
  const settingsSource = localeSource.slice(settingsStart, adminStart)
  const titles = [...settingsSource.matchAll(/title:\s*"([^"]+)"/g)].map((match) => match[1]).slice(1)
  if (JSON.stringify(titles) !== JSON.stringify(expectedTitles)) {
    failures.push(`Textos incorrectos de la guía de Ajustes (${locale}): ${titles.join(" | ")}`)
  }
}

if (failures.length > 0) {
  console.error("La infraestructura de tutoriales guiados está incompleta:")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log("Tutoriales guiados correctos:")
console.log("- seis recorridos contextuales; Bienvenida forma parte de Inicio")
console.log("- controles flotantes de Inicio emparejados por orden y texto en castellano, inglés y euskera")
console.log("- guía de Ajustes con perfil, apariencia, notificaciones, cambio Ligas/Mis partidos, sugerencias y buscador")
console.log("- ayuda flotante y biblioteca para repetir recorridos")
console.log("- progreso por cuenta con respaldo local")
console.log("- API autenticada, rate limit y tabla sin acceso desde navegador")
