import { readFile } from "node:fs/promises"

const read = (file) => readFile(file, "utf8")
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const [
  baseMigration,
  extensionMigration,
  listRoute,
  detailRoute,
  peopleRoute,
  serverHelper,
  leaguesPage,
  personalPage,
  newPage,
  detailPage,
  card,
  schedulePanel,
  appShell,
  leagueGate,
  settingsPage,
  tours,
  matchEventMeta,
  personalNav,
  personalMatchesLib,
  personalProfilePage,
  personalProfileStats,
  detailPairingPanel,
  personalProfileView,
] = await Promise.all([
  read("supabase/migrations/20260808110500_add_personal_matches.sql"),
  read("supabase/migrations/20260808124000_extend_personal_matches_schedule.sql"),
  read("src/app/api/personal-matches/route.ts"),
  read("src/app/api/personal-matches/[id]/route.ts"),
  read("src/app/api/personal-matches/people/route.ts"),
  read("src/lib/serverPersonalMatches.ts"),
  read("src/app/leagues/page.tsx"),
  read("src/app/personal-matches/page.tsx"),
  read("src/app/personal-matches/new/page.tsx"),
  read("src/app/personal-matches/[id]/page.tsx"),
  read("src/components/personal/PersonalMatchCard.tsx"),
  read("src/components/personal/PersonalMatchSchedulePanel.tsx"),
  read("src/components/layout/AppShell.tsx"),
  read("src/components/auth/LeagueEntryGate.tsx"),
  read("src/app/settings/page.tsx"),
  read("src/features/onboarding/tours.ts"),
  read("src/components/matches/MatchEventMeta.tsx"),
  read("src/components/personal/PersonalMatchesNav.tsx"),
  read("src/lib/personalMatches.ts"),
  read("src/app/personal-matches/profile/page.tsx"),
  read("src/lib/personalProfileStats.ts"),
  read("src/components/match/MatchDetailPairingPanel.tsx"),
  read("src/components/personal/PersonalProfileStatistics.tsx"),
])

for (const table of ["personal_matches", "personal_match_participants"]) {
  assert(baseMigration.includes(`public.${table}`), `Falta la tabla ${table}`)
}
assert(baseMigration.includes("server_create_personal_match"), "Falta la creación transaccional del amistoso")
assert(baseMigration.includes("enable row level security"), "Las tablas personales deben tener RLS")
assert(baseMigration.includes("from public, anon, authenticated"), "Las tablas personales no deben ser accesibles desde navegador")
assert(baseMigration.includes("to service_role"), "service_role debe poder operar con partidos personales")

for (const snippet of [
  "status text not null default 'finished'",
  "server_list_user_match_history",
  "server_next_user_matches",
  "from public.matches m",
  "from public.personal_matches pm",
  "five-argument RPC as a compatibility wrapper",
]) {
  assert(extensionMigration.includes(snippet), `Falta extensión personal: ${snippet}`)
}
assert(extensionMigration.includes("from public, anon, authenticated"), "Los nuevos RPC deben seguir cerrados al navegador")
assert(extensionMigration.includes("to service_role"), "Los nuevos RPC deben ser service-role only")

for (const route of [listRoute, detailRoute, peopleRoute]) {
  assert(route.includes("requireAuthenticatedAppUser"), "Todas las APIs personales deben requerir autenticación")
}
assert(listRoute.includes("enforceRequestRateLimit"), "La creación de amistosos debe tener rate limit")
assert(detailRoute.includes("enforceRequestRateLimit"), "La edición y borrado de amistosos deben tener rate limit")
assert(detailRoute.includes("export async function PATCH"), "El amistoso debe admitir programación y resultado posterior")
assert(listRoute.includes("personal_match_requires_current_user"), "El creador debe formar parte del partido")
assert(listRoute.includes("p_status: status"), "La creación debe persistir el estado programado/finalizado")

assert(leaguesPage.includes('href="/personal-matches"'), "Mis ligas debe enlazar a Mis partidos")
assert(leaguesPage.includes("partidos de liga") && leaguesPage.includes("amistosos"), "Mis ligas debe explicar el historial agregado")
assert(personalPage.includes("const pageSize = 10"), "El historial debe paginar diez partidos cada vez")
assert(personalPage.includes("Cargar 10 más"), "Debe existir carga incremental de diez partidos")
assert(personalPage.includes("!loading && selectedUpcoming ? ("), "Próximo partido debe ocultarse por completo cuando no existe")
assert(personalPage.includes("Próximo partido"), "Falta el bloque condicional de próximo partido")
assert(!personalPage.includes("Sin partidos programados"), "No debe mostrarse un estado vacío para Próximo partido")
assert(personalPage.includes("hasBothUpcoming"), "El selector Liga/Amistoso debe mostrarse solo cuando existen ambos próximos")
assert(personalPage.includes('scope === "league" ? "Liga" : "Amistoso"'), "Falta selector Liga/Amistoso")
assert(serverHelper.includes("server_list_user_match_history"), "La paginación debe resolverse en base de datos")
assert(serverHelper.includes("safeLimit + 1"), "La API debe detectar si existen más páginas")
assert(serverHelper.includes('origin: "league"') && serverHelper.includes('origin: "friendly"'), "El servidor debe normalizar liga y amistoso sin duplicarlos")

assert(card.includes("getPersonalMatchSetWins"), "Las tarjetas deben mostrar los sets ganados junto a cada pareja")
assert(card.includes("SetGameScore"), "Mis partidos debe reutilizar el marcador por set del Calendario")
assert(card.includes("getPersonalMatchOutcome"), "Las tarjetas deben mostrar Victoria/Derrota para el usuario")
assert(card.includes('aria-label="Juegos por set de la pareja A"') && card.includes('aria-label="Juegos por set de la pareja B"'), "Cada pareja debe mostrar sus juegos por set")
assert(card.includes('rounded-xl bg-neutral-50 px-3 py-2'), "Cada pareja debe conservar el panel visual del Calendario")
assert(card.includes("getPersonalMatchTeamPlayers"), "Los nombres deben renderizarse por participante")
assert(card.includes("ClickableChevron") && card.includes("showPersonalMatchChevron = false"), "El chevron de partido debe conservarse en código pero quedar oculto")
assert(card.includes("getPersonalMatchOriginLabel(match)"), "Liga/Amistoso debe permanecer en la cabecera")
assert(card.includes("MatchEventMeta"), "Fecha, hora y ubicación deben usar el bloque compartido")
assert(card.includes("locationText={match.locationName}"), "La ubicación debe mostrarse debajo de las parejas")
assert(card.includes("locationFallback={null}") && card.includes("hideMissingRows"), "El historial debe ocultar por separado fecha y ubicación ausentes")
assert(card.includes("getPersonalMatchOriginBadgeStyle(match)"), "Cada liga debe aplicar su color estable propio")
assert(matchEventMeta.includes('weekday: "long"') && matchEventMeta.includes('hour: "2-digit"'), "El bloque compartido debe mostrar día, fecha y hora")

assert(newPage.includes("Otro jugador..."), "Debe ser posible registrar jugadores externos")
assert(newPage.includes("sourceLeagueNames"), "Debe reutilizar jugadores conocidos de ligas compartidas")
assert(newPage.includes("Programar") && newPage.includes("Ya jugado"), "El alta debe permitir programar o registrar un partido ya jugado")
assert(detailPage.includes("<MatchDetailPairingPanel"), "El detalle personal debe usar el panel de emparejamiento propio")
assert(!detailPage.includes("<MatchScoreboard"), "El detalle personal no debe reutilizar el marcador compacto")
assert(detailPage.includes('className="mt-3 flex min-w-0 w-full items-start justify-between gap-3"'), "El detalle amistoso debe reservar la esquina derecha exclusivamente para el estado")
assert(!detailPage.includes('tracking-[0.12em] text-slate-700'), "El detalle amistoso no debe mostrar una etiqueta Amistoso separada")
assert(detailPage.includes("avatarUrl: participant.avatarUrl ?? null"), "El amistoso debe trasladar los avatares al panel de emparejamiento")
assert(detailPairingPanel.includes("Emparejamiento") && detailPairingPanel.includes("Pareja A") && detailPairingPanel.includes("Pareja B"), "El panel propio debe identificar Pareja A y Pareja B")
assert(detailPairingPanel.includes("const pairPlayers = playerIds.map") && detailPairingPanel.includes("<PlayerAvatar") && detailPairingPanel.includes("#{position} en liga"), "El panel propio debe separar los avatares de los paneles de nombre y admitir posición en liga")
assert(detailPairingPanel.includes("const showAvatars = [...teamA, ...teamB].some") && detailPairingPanel.includes("isSafeImageUrl(getPlayerById(playerId, players)?.avatarUrl)"), "El panel propio debe ocultar las fotos cuando ninguno de los cuatro jugadores tiene imagen real")
assert(detailPairingPanel.includes('alignment="left"') && detailPairingPanel.includes('alignment="right"') && detailPairingPanel.includes('alignment === "right" ? "text-right" : "text-left"'), "Pareja B debe alinear a la derecha todo el contenido textual de cada jugador")
assert(detailPairingPanel.includes("text-[10px] font-bold uppercase leading-none tracking-wide") && detailPairingPanel.includes('alignment === "right" ? "text-right" : "text-left"') && !detailPairingPanel.includes("truncate text-center text-[12px]"), "Los títulos Pareja A y Pareja B deben ser pequeños y alinearse con los nombres de sus jugadores")
assert(detailPairingPanel.includes('relative grid grid-cols-2 items-start gap-2') && !detailPairingPanel.includes('grid-cols-[minmax(0,1fr)_42px_minmax(0,1fr)]'), "El detalle debe usar dos columnas completas sin reservar ancho fijo para VS")
assert(detailPairingPanel.includes('pointer-events-none absolute left-1/2 top-1/2') && detailPairingPanel.includes('>\n            VS\n          </span>'), "El panel de detalle debe recuperar un VS flotante sin robar ancho a las parejas")
assert(detailPairingPanel.includes('className="min-w-0"') && detailPairingPanel.includes('rounded-lg bg-neutral-50 px-2 py-2'), "Las parejas deben evitar paneles anidados pesados y conservar solo bloques ligeros por jugador")
assert(serverHelper.includes('.select("id,avatar_url")') && serverHelper.includes("avatarUrlByUserId"), "El servidor debe recuperar avatares de participantes vinculados")
assert(detailPage.includes("<PersonalMatchSchedulePanel"), "El detalle debe incluir fecha, ubicación y acciones")
assert(detailPage.includes("<PersonalMatchResultForm"), "El detalle debe permitir registrar/corregir resultado")
assert(schedulePanel.includes("Cómo llegar"), "El detalle debe permitir abrir la ubicación")
assert(schedulePanel.includes("PersonalAddToCalendarButton"), "El detalle debe permitir añadir al calendario")

assert(appShell.includes("isPersonalMatchesRoute"), "El shell debe detectar el modo personal")
assert(appShell.includes("const shouldShowSettingsButton"), "El modo personal debe conservar Ajustes")
assert(appShell.includes("!isPersonalMatchesRoute"), "El modo personal debe ocultar la navegación completa y los controles de liga")
assert(appShell.includes("shouldShowPersonalMatchesNav"), "El shell debe activar la navegación compacta del modo personal")
assert(appShell.includes("<PersonalMatchesNav"), "El shell debe renderizar la navegación compacta de Mis partidos")
assert(personalNav.includes('aria-label="Navegación de Mis partidos"'), "La navegación personal debe ser accesible")
for (const label of ["Mis ligas", "Mis partidos", "Mi perfil"]) {
  assert(personalNav.includes(label), `Falta el destino ${label} en la navegación personal`)
}
assert(!personalNav.includes('label: "+ Partido"'), "La navegación personal no debe incluir + Partido")
assert(personalNav.includes('href: "/leagues"'), "La navegación personal debe enlazar a Mis ligas")
assert(personalNav.includes('href: "/personal-matches/profile"'), "La navegación personal debe enlazar al perfil global")
assert(personalNav.includes("grid-cols-3"), "La navegación personal debe repartir tres destinos")
assert(personalProfilePage.includes("Perfil global"), "Debe existir un perfil global dentro de Mis partidos")
assert(personalProfilePage.includes("Todos los partidos") && personalProfilePage.includes("Partidos de liga"), "El perfil global debe filtrar por origen")
assert(personalProfilePage.includes("Todas las ligas") && personalProfilePage.includes("Todas las temporadas"), "El perfil global debe filtrar por liga y temporada")
assert(personalProfileStats.includes("filterPersonalProfileMatches") && personalProfileStats.includes("getPersonalProfileStats"), "Las estadísticas globales deben calcularse desde el historial personal")
assert(personalProfileStats.includes("getPersonalProfileHeadToHead") && personalProfileStats.includes("bestTeammate") && personalProfileStats.includes("nemesis"), "El perfil global debe incluir parejas, rivales y cara a cara")
assert(personalProfileStats.includes("decidingSetMatches") && personalProfileStats.includes("comebackWins") && personalProfileStats.includes("currentForm"), "El perfil global debe incluir rendimiento avanzado y forma reciente")
assert(personalProfilePage.includes("includeAvatars=1"), "El perfil global debe cargar avatares para relaciones y cara a cara")
assert(personalProfileView.includes("Parejas / rivales") && personalProfileView.includes("Cara a cara") && personalProfileView.includes("Mejor pareja") && personalProfileView.includes("Némesis"), "La UI del perfil debe exponer las nuevas estadísticas")
assert(personalProfileView.includes("Enfrentamientos directos") && personalProfileView.includes("Rendimiento de la pareja"), "Cara a cara debe distinguir rivalidad y partidos como pareja")
assert(personalMatchesLib.includes("personKey?: string | null"), "Los participantes del histórico deben exponer una identidad estable opcional")
assert(serverHelper.includes("getParticipantPersonKey") && serverHelper.includes('`user:${userId}`') && serverHelper.includes('`player:${playerId}`'), "El histórico global debe unificar identidades vinculadas entre ligas")
assert(listRoute.includes('searchParams.get("includeAvatars")'), "La API debe permitir cargar avatares solo cuando el perfil global los necesita")
assert(serverHelper.includes("seasonName"), "El historial de liga debe incluir el nombre de temporada para el filtro global")
assert(!personalPage.includes("<BackButton"), "La raíz de Mis partidos no debe duplicar Volver/Ligas")
assert(newPage.includes("<BackButton") && detailPage.includes("<BackButton"), "Crear y detalle deben conservar el botón Volver")
for (const forbiddenColor of ["red-", "rose-", "green-", "emerald-", "lime-", "teal-"]) {
  assert(!personalMatchesLib.includes(forbiddenColor), `El origen de partido no debe usar ${forbiddenColor}`)
}
assert(personalMatchesLib.includes("friendlyBadgeStyle"), "Amistoso debe tener un color propio estable")
assert(personalMatchesLib.includes("stableStringHash"), "El color de cada liga debe ser estable entre cargas")
assert(leagueGate.includes("isPersonalMatchesRoute"), "La puerta de liga debe permitir el historial personal")
assert(settingsPage.includes('tour="settings-context-switcher"'), "Ajustes debe señalar el acceso Mis ligas/Mis partidos")
assert(tours.includes("Tus ligas y Mis partidos"), "El tutorial de Ajustes debe explicar ambos contextos")
assert(tours.includes("version: 3"), "La guía de Ajustes debe incrementar versión para volver a mostrarse")
assert(!(baseMigration + extensionMigration).toLowerCase().includes("pretemporada"), "El modelo personal no debe introducir pretemporada")

console.log("Mis partidos v1.4.17 correcto:")
console.log("- historial agregado de liga + amistosos sin duplicar datos competitivos")
console.log("- historial paginado de 10 en 10 y Próximo partido oculto cuando no existe")
console.log("- amistosos programables con detalle alineado con Partido de liga")
console.log("- origen por liga con color estable y metadatos ausentes ocultos de forma independiente")
console.log("- un único amistoso compartido por cuentas vinculadas y externos permitidos")
console.log("- perfil global con rendimiento, parejas, rivales, rankings y cara a cara filtrable")
console.log("- API autenticada, rate limit y persistencia service-role only")
