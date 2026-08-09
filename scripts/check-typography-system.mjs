import { readFile, readdir } from "node:fs/promises"
import path from "node:path"

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const resolved = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(resolved)))
    if (entry.isFile() && /\.(ts|tsx|css)$/.test(entry.name)) files.push(resolved)
  }
  return files
}

const files = await walk("src")
const arbitrary = []
for (const file of files) {
  const source = await readFile(file, "utf8")
  for (const match of source.matchAll(/text-\[(\d+)px\]/g)) {
    arbitrary.push(`${file}: ${match[0]}`)
  }
}
assert(arbitrary.length === 0, `Quedan tamaños tipográficos fijos en px:\n${arbitrary.join("\n")}`)

const globals = await readFile("src/app/globals.css", "utf8")
for (const token of [
  "--app-font-size-adjust: 0px",
  "font-size: calc(16px + var(--app-font-size-adjust))",
  ".type-caption",
  ".type-small",
  ".type-page-title",
  ".type-section-title",
  ".type-panel-title",
  ".type-player-name",
  ".type-player-name-prominent",
  ".type-player-name-hero",
]) {
  assert(globals.includes(token), `Falta el token tipográfico semántico: ${token}`)
}

const appFiles = await walk("src/app")
const missingPageTitles = []
for (const file of appFiles.filter((file) => file.endsWith(".tsx"))) {
  const source = await readFile(file, "utf8")
  for (const match of source.matchAll(/<h1 className="([^"]*)"/g)) {
    if (!match[1].includes("type-page-title") && !match[1].includes("type-player-name-hero")) {
      missingPageTitles.push(file)
    }
  }
}
assert(missingPageTitles.length === 0, `Hay títulos de pantalla fuera del rol común:\n${missingPageTitles.join("\n")}`)

const allowedHeaderContextTokens = [
  "activeLeague.description",
  "player.displayName",
  "Cuenta de espectador · acceso de solo lectura.",
]
const pageHeaderDescriptionViolations = []
for (const file of appFiles.filter((file) => file.endsWith(".tsx"))) {
  const source = await readFile(file, "utf8")
  for (const match of source.matchAll(/<header\b[^>]*>[\s\S]*?<\/header>/g)) {
    const header = match[0]
    const titleEnd = header.indexOf("</h1>")
    if (titleEnd < 0) continue
    const afterTitle = header.slice(titleEnd + "</h1>".length)
    if (!/<p\b/.test(afterTitle)) continue
    if (allowedHeaderContextTokens.some((token) => afterTitle.includes(token))) continue
    pageHeaderDescriptionViolations.push(file)
  }
}
assert(
  pageHeaderDescriptionViolations.length === 0,
  `Quedan descripciones genéricas bajo títulos de pantalla:\n${pageHeaderDescriptionViolations.join("\n")}`,
)


const panelTitleSizeOverrides = []
for (const file of files.filter((file) => file.endsWith(".tsx"))) {
  const source = await readFile(file, "utf8")
  for (const match of source.matchAll(/className="([^"]*type-panel-title[^"]*)"/g)) {
    if (/\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/.test(match[1])) {
      panelTitleSizeOverrides.push(`${file}: ${match[1]}`)
    }
  }
}
assert(
  panelTitleSizeOverrides.length === 0,
  `Hay títulos de panel con un tamaño que pisa type-panel-title:\n${panelTitleSizeOverrides.join("\n")}`,
)

const [ranking, matchCard, teams, personalStats, playerStats, pairing] = await Promise.all([
  readFile("src/components/ranking/RankingTable.tsx", "utf8"),
  readFile("src/components/matches/MatchCard.tsx", "utf8"),
  readFile("src/components/matches/MatchTeamsPanel.tsx", "utf8"),
  readFile("src/components/personal/PersonalProfileStatistics.tsx", "utf8"),
  readFile("src/components/player/PlayerStatsPanel.tsx", "utf8"),
  readFile("src/components/match/MatchDetailPairingPanel.tsx", "utf8"),
])
assert(ranking.includes("type-player-name"), "Ranking Individual debe usar el nombre de jugador semántico")
assert(matchCard.includes("type-player-name") || teams.includes("type-player-name"), "Calendario debe usar el nombre de jugador semántico")
assert(personalStats.includes("type-player-name"), "Perfil debe usar el nombre de jugador semántico en listados")
assert(playerStats.includes("type-player-name"), "Las estadísticas de jugador deben usar el nombre de jugador semántico")
assert(pairing.includes("type-player-name-prominent"), "PARTIDO debe conservar un nombre protagonista explícito")

const matchPanelTitleFiles = await Promise.all([
  "src/components/match/MatchScheduleForm.tsx",
  "src/components/match/MatchResultForm.tsx",
  "src/components/match/CourtBookingPanel.tsx",
  "src/components/match/MatchAvailabilitySuggestions.tsx",
  "src/components/match/MatchIncidentPanel.tsx",
  "src/components/match/MatchResultConfirmationCard.tsx",
  "src/components/match/MatchSubstitutionPanel.tsx",
  "src/components/mvp/MvpVotingCard.tsx",
].map((file) => readFile(file, "utf8")))
for (const source of matchPanelTitleFiles) {
  assert(source.includes("type-panel-title"), "Todos los paneles principales de PARTIDO deben usar type-panel-title")
}

const bottomNav = await readFile("src/components/layout/BottomNav.tsx", "utf8")
for (const token of ["app-bottom-nav-grid", "app-bottom-nav-icon", "app-bottom-nav-active", "app-bottom-nav-item"]) {
  assert(bottomNav.includes(token), `La NAVBAR debe conservar geometría fija: ${token}`)
}
assert(!bottomNav.includes("type-caption font-black"), "La NAVBAR no debe heredar el tamaño rem del rol type-caption")
for (const token of ["font-size: 11px", "width: 16px", "height: 16px", "max-width: 448px"]) {
  assert(globals.includes(token), `Falta una dimensión fija de NAVBAR: ${token}`)
}

const [appearancePage, appShell, fontPreference] = await Promise.all([
  readFile("src/app/settings/appearance/page.tsx", "utf8"),
  readFile("src/components/layout/AppShell.tsx", "utf8"),
  readFile("src/lib/fontSizePreference.ts", "utf8"),
])
for (const token of ['glyph: "A−"', 'glyph: "A"', 'glyph: "A+"', "<FontSizeControl"]) {
  assert(appearancePage.includes(token), `Falta el control compacto de tamaño de texto: ${token}`)
}
assert(
  fontPreference.includes('small: "-2px"') &&
    fontPreference.includes('normal: "0px"') &&
    fontPreference.includes('large: "2px"'),
  "El selector debe conservar los tres niveles de escala global",
)
assert(
  fontPreference.includes('APP_FONT_SIZE_STORAGE_KEY = "smash-lob-font-size"'),
  "La preferencia tipográfica debe persistirse con una clave estable",
)
assert(
  appShell.includes("applyAppFontSize(readStoredAppFontSize())"),
  "AppShell debe reaplicar el tamaño guardado al abrir la app",
)

const compactStart = globals.indexOf(".compact-page")
assert(compactStart >= 0, "No se encuentra la configuración compact-page")
const compactSlice = globals.slice(compactStart)
assert(!/\.compact-page[^}]*font-size\s*:/s.test(compactSlice), "compact-page no debe cambiar el tamaño tipográfico global")

console.log("Tipografía semántica v1.5.4 correcta:")
console.log("- títulos de pantalla, sección y panel con roles comunes")
console.log("- nombres equivalentes de jugador unificados en Ranking, Calendario y Perfil")
console.log("- nombres protagonistas separados de los nombres de listado")
console.log("- cabeceras sin descripciones genéricas bajo el título")
console.log("- sin tamaños text-[Npx] fijos en la aplicación")
console.log("- títulos de panel sin tamaños competidores y paneles principales de PARTIDO unificados")
console.log("- selector A− / A / A+ persistente sin modificar los botones de la NAVBAR")
