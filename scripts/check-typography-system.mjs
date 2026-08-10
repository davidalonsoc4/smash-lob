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
  "activeSeason.name",
  "player.displayName",
  "Cuenta de espectador · acceso de solo lectura.",
  "Superusuario",
  "Actividad personal",
  "Amistoso",
  "Smash & Lob",
  "t.settings.accountSettingsTitle",
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



const inconsistentPageHeaders = []
for (const file of appFiles.filter((file) => file.endsWith(".tsx"))) {
  const source = await readFile(file, "utf8")
  for (const match of source.matchAll(/<header\b[^>]*>[\s\S]*?<\/header>/g)) {
    const header = match[0]
    if (!header.includes("type-page-title")) continue
    if (!header.includes("app-page-header")) inconsistentPageHeaders.push(file)
  }
}
assert(
  inconsistentPageHeaders.length === 0,
  `Hay cabeceras de pantalla fuera de la geometría global:\n${[...new Set(inconsistentPageHeaders)].join("\n")}`,
)

const preTitleContextViolations = []
for (const file of files.filter((file) => file.endsWith(".tsx"))) {
  const source = await readFile(file, "utf8")
  for (const match of source.matchAll(/<header\b[^>]*app-page-header[^>]*>[\s\S]*?<\/header>/g)) {
    const header = match[0]
    if (!header.includes("type-page-title")) continue
    const titleStart = header.indexOf("<h1")
    if (titleStart < 0) continue
    const beforeTitle = header.slice(0, titleStart)
    if (/<p\b/.test(beforeTitle) || beforeTitle.includes("<LeagueSeasonEyebrow")) {
      preTitleContextViolations.push(file)
    }
  }
}
assert(
  preTitleContextViolations.length === 0,
  `Hay contexto textual por encima del título en cabeceras globales:\n${[...new Set(preTitleContextViolations)].join("\n")}`,
)
assert(globals.includes(".app-page-header") && globals.includes("padding-top: 0.5rem !important"), "La cabecera global debe conservar 8 px de aire bajo la fila funcional")
assert(globals.includes("font-size: 1.5rem !important") && globals.includes("line-height: 1.15 !important"), "type-page-title debe imponer el mismo tamaño y altura en todas las cabeceras")
assert(globals.includes(".app-page-header > :has(.type-page-title)"), "Los wrappers de cabecera no deben desplazar la línea base del título")

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

const backButton = await readFile("src/components/ui/BackButton.tsx", "utf8")
assert(
  appShell.includes('max(54px, calc(env(safe-area-inset-top, 0px) + 52px))'),
  "Las pantallas con acciones flotantes deben reservar 54 px de entrada superior antes de la cabecera",
)
assert(
  appShell.includes('max(20px, calc(env(safe-area-inset-top, 0px) + 20px))'),
  "Las pantallas sin acciones flotantes deben ampliar también su margen superior",
)
assert(
  !appShell.includes("--app-floating-top-reserved-width"),
  "Las acciones flotantes no deben volver a reducir horizontalmente las cabeceras",
)
assert(
  globals.includes('.app-main[data-has-floating-top-controls="true"] .app-top-back-control'),
  "Volver debe poder ocupar la izquierda de la fila funcional superior",
)
assert(
  globals.includes('top: max(10px, calc(env(safe-area-inset-top, 0px) + 8px))'),
  "La fila funcional superior debe respetar el safe area del dispositivo",
)
assert(
  globals.includes(".app-home-top-logo") && globals.includes("position: absolute") && globals.includes("top: -52px") && globals.includes("left: 0") && globals.includes("width: 6.25rem !important") && globals.includes("height: 6.25rem !important"),
  "Inicio debe ampliar el logo a 100 px y alinear su borde superior con los controles flotantes",
)
const [topHomePage, topRankingPage, topMatchesPage, topProfilePage] = await Promise.all([
  readFile("src/app/page.tsx", "utf8"),
  readFile("src/app/ranking/page.tsx", "utf8"),
  readFile("src/app/matches/page.tsx", "utf8"),
  readFile("src/components/player/PlayerProfileScreen.tsx", "utf8"),
])
assert(
  topHomePage.includes('size="xl"') && topHomePage.includes('className="app-home-top-logo"'),
  "Inicio debe mostrar el logo de liga ampliado en la izquierda de la fila superior",
)
for (const [label, source] of [
  ["Clasificación", topRankingPage],
  ["Partidos", topMatchesPage],
]) {
  assert(
    source.includes('<BackButton fallbackHref="/" label={t.common.back} />'),
    `${label} debe usar Volver en la izquierda de la fila funcional`,
  )
}
assert(
  topProfilePage.includes('<BackButton fallbackHref={isSelf ? "/" : "/ranking"} label={t.common.back} />'),
  "El perfil compartido debe mantener Volver contextual en la fila funcional",
)
assert(
  !globals.includes("max-width: calc(100% - var(--app-floating-top-reserved-width"),
  "Las cabeceras no deben perder ancho por las acciones flotantes",
)
assert(backButton.includes("app-top-back-control"), "BackButton debe integrarse en la fila funcional superior")
assert(
  appShell.includes('top: "max(4px, calc(env(safe-area-inset-top, 0px) + 4px))"') &&
    appShell.includes("left: getPreproductionBadgeLeft()") &&
    appShell.includes("zIndex: 80"),
  "PRE debe fijar su badge arriba a la izquierda con prioridad visual independiente de la cabecera",
)
assert(
  !globals.includes(".app-shell-frame:has(.app-top-back-control) .app-preproduction-badge") &&
    !globals.includes('.app-shell-frame[data-home-route="true"] .app-preproduction-badge'),
  "El badge PRE no debe volver a recolocarse según la pantalla o la presencia de Volver",
)

const [homePage, rankingPage, matchesPage, profileScreen, seasonContextLine] = await Promise.all([
  readFile("src/app/page.tsx", "utf8"),
  readFile("src/app/ranking/page.tsx", "utf8"),
  readFile("src/app/matches/page.tsx", "utf8"),
  readFile("src/components/player/PlayerProfileScreen.tsx", "utf8"),
  readFile("src/components/layout/SeasonContextLine.tsx", "utf8"),
])
assert(homePage.includes('<header data-tour="home-header" className="app-page-header">'), "Inicio debe usar la misma geometría global de cabecera que el resto de pantallas")
assert(homePage.includes('<LeagueLogo league={activeLeague} size="xl"'), "Inicio debe usar el logo ampliado en su cabecera de identidad")
assert(homePage.includes("<SeasonContextLine"), "Inicio debe integrar temporada y estado en una sola línea")
assert(!homePage.includes("activeLeague.description"), "Inicio no debe repetir la descripción de la liga en la cabecera")
assert(homePage.includes('data-tour="home-season-summary"'), "La temporada cerrada debe usar un resumen compacto")
assert(!homePage.includes("<PlayerAwardCard"), "Inicio no debe recuperar las tarjetas grandes de premios al cerrar temporada")
for (const [name, source] of [["Ranking", rankingPage], ["Calendario", matchesPage], ["Perfil", profileScreen]]) {
  assert(source.includes("<SeasonContextLine"), `${name} debe mostrar la temporada en una línea compacta`)
  assert(!source.includes("<LeagueSeasonEyebrow"), `${name} no debe repetir liga + temporada antes del título`)
  assert(source.indexOf("<SeasonContextLine") > source.indexOf("<h1"), `${name} debe mostrar el título antes del contexto de temporada`)
}
assert(seasonContextLine.includes('<span aria-hidden="true"> · </span>'), "Temporada y estado deben integrarse con un único separador")
assert(rankingPage.includes('data-tour="ranking-header" className="app-page-header"'), "Clasificación debe usar la cabecera global")
assert(matchesPage.includes('data-tour="matches-header" className="app-page-header"'), "Partidos debe usar la cabecera global")
const [ownProfilePage, publicProfilePage, sharedProfileScreen] = await Promise.all([
  readFile("src/app/profile/page.tsx", "utf8"),
  readFile("src/app/player/[id]/page.tsx", "utf8"),
  readFile("src/components/player/PlayerProfileScreen.tsx", "utf8"),
])
assert(ownProfilePage.includes('<PlayerProfileScreen mode="self" />'), "Mi perfil debe delegar en la pantalla de perfil compartida")
assert(!ownProfilePage.trimStart().startsWith('"use client"'), "La ruta Mi perfil debe ser un wrapper servidor; el cliente vive en PlayerProfileScreen")
assert(publicProfilePage.includes('<PlayerProfileScreen playerIdOrSlug={id} mode="public" />'), "Perfil de jugador debe delegar en la pantalla de perfil compartida")
assert(!publicProfilePage.trimStart().startsWith('"use client"'), "La ruta pública de jugador debe ser un wrapper servidor; el cliente vive en PlayerProfileScreen")
assert(sharedProfileScreen.includes('const resolvedPlayerIdOrSlug = isSelf ? currentUserId : playerIdOrSlug'), "PlayerProfileScreen debe resolver el usuario propio dentro de la base compartida")
assert(sharedProfileScreen.includes('<header className="app-page-header">'), "La pantalla compartida de perfil debe usar la cabecera global")
assert(sharedProfileScreen.includes('<PlayerAvatar player={player} size="md" previewable />'), "La pantalla compartida de perfil debe usar el avatar de tamaño normal")
const playerNameIndex = sharedProfileScreen.indexOf("{player.displayName}")
const seasonLineIndex = sharedProfileScreen.indexOf("<SeasonContextLine", playerNameIndex)
assert(playerNameIndex >= 0 && seasonLineIndex > playerNameIndex, "El perfil compartido debe colocar temporada y estado debajo del nombre")

assert(homePage.includes('badge="🏆"') && homePage.includes('tone="winner"') && homePage.includes('tone="mvp"'), "El resumen de temporada debe dar protagonismo visual a Ganador y MVP")
assert(homePage.includes('</AppCard>\n\n          {canManageSeason ? ('), "Crear nueva temporada debe quedar como botón independiente debajo del resumen")
assert(homePage.includes('<AppCard className="overflow-hidden p-0">\n            <div className="px-3 pt-3">\n              <SectionHeader\n                title={t.dashboard.rankingTitle}'), "Clasificación de Inicio debe llevar su título dentro del panel")
assert(ranking.includes('border-b border-neutral-100'), "Ranking Individual debe integrar las cabeceras de columnas dentro del panel con separador")
assert(ranking.includes('border-t border-neutral-100 px-3 py-2.5'), "Ranking Individual debe integrar la leyenda inferior dentro del panel con separador")
assert(!ranking.includes('<div className="space-y-2">'), "Ranking Individual no debe volver a separar cabeceras o leyenda fuera del panel")

const compactStart = globals.indexOf(".compact-page")
assert(compactStart >= 0, "No se encuentra la configuración compact-page")
const compactSlice = globals.slice(compactStart)
assert(!/\.compact-page[^}]*font-size\s*:/s.test(compactSlice), "compact-page no debe cambiar el tamaño tipográfico global")

console.log("Tipografía semántica v1.6.0 correcta:")
console.log("- títulos de pantalla, sección y panel con roles comunes")
console.log("- nombres equivalentes de jugador unificados en Ranking, Calendario y Perfil")
console.log("- nombres protagonistas separados de los nombres de listado")
console.log("- cabeceras sin descripciones genéricas bajo el título")
console.log("- sin tamaños text-[Npx] fijos en la aplicación")
console.log("- títulos de panel sin tamaños competidores y paneles principales de PARTIDO unificados")
console.log("- selector A− / A / A+ persistente sin modificar los botones de la NAVBAR")
console.log("- Inicio y pantallas principales con contexto de temporada compacto y sin identidad repetida")
console.log("- las 50 cabeceras con título usan título primero, contexto después y una geometría vertical común")
console.log("- Mi perfil y perfiles públicos comparten una única base visual y funcional")
console.log("- premios de temporada protagonistas y clasificaciones integradas dentro de sus paneles")
console.log("- margen superior ampliado globalmente y badge PRE fijo en la esquina superior izquierda")
