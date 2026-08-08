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
assert(personalPage.includes("Próximo partido"), "Falta el bloque de próximo partido")
assert(personalPage.includes("hasBothUpcoming"), "El selector Liga/Amistoso debe mostrarse solo cuando existen ambos próximos")
assert(personalPage.includes('scope === "league" ? "Liga" : "Amistoso"'), "Falta selector Liga/Amistoso")
assert(serverHelper.includes("server_list_user_match_history"), "La paginación debe resolverse en base de datos")
assert(serverHelper.includes("safeLimit + 1"), "La API debe detectar si existen más páginas")
assert(serverHelper.includes('origin: "league"') && serverHelper.includes('origin: "friendly"'), "El servidor debe normalizar liga y amistoso sin duplicarlos")

assert(card.includes("getPersonalMatchOverallScore"), "Las tarjetas deben mostrar marcador general por sets")
assert(card.includes("getPersonalMatchTeamPlayers"), "Los nombres deben renderizarse por participante")
assert(card.includes("ClickableChevron"), "Las tarjetas deben incluir chevron")
assert(card.includes("match.locationName"), "Hora y ubicación deben aparecer en la tarjeta")

assert(newPage.includes("Otro jugador..."), "Debe ser posible registrar jugadores externos")
assert(newPage.includes("sourceLeagueNames"), "Debe reutilizar jugadores conocidos de ligas compartidas")
assert(newPage.includes("Programar") && newPage.includes("Ya jugado"), "El alta debe permitir programar o registrar un partido ya jugado")
assert(detailPage.includes("<MatchScoreboard"), "El detalle personal debe reutilizar el marcador del partido de liga")
assert(detailPage.includes("<PersonalMatchSchedulePanel"), "El detalle debe incluir fecha, ubicación y acciones")
assert(detailPage.includes("<PersonalMatchResultForm"), "El detalle debe permitir registrar/corregir resultado")
assert(schedulePanel.includes("Cómo llegar"), "El detalle debe permitir abrir la ubicación")
assert(schedulePanel.includes("PersonalAddToCalendarButton"), "El detalle debe permitir añadir al calendario")

assert(appShell.includes("isPersonalMatchesRoute"), "El shell debe detectar el modo personal")
assert(appShell.includes("const shouldShowSettingsButton"), "El modo personal debe conservar Ajustes")
assert(appShell.includes("!isPersonalMatchesRoute"), "El modo personal debe ocultar navegación y controles de liga")
assert(leagueGate.includes("isPersonalMatchesRoute"), "La puerta de liga debe permitir el historial personal")
assert(settingsPage.includes('tour="settings-context-switcher"'), "Ajustes debe señalar el acceso Mis ligas/Mis partidos")
assert(tours.includes("Tus ligas y Mis partidos"), "El tutorial de Ajustes debe explicar ambos contextos")
assert(tours.includes("version: 3"), "La guía de Ajustes debe incrementar versión para volver a mostrarse")
assert(!(baseMigration + extensionMigration).toLowerCase().includes("pretemporada"), "El modelo personal no debe introducir pretemporada")

console.log("Mis partidos v1.4.6 correcto:")
console.log("- historial agregado de liga + amistosos sin duplicar datos competitivos")
console.log("- historial paginado de 10 en 10 y próximo partido Liga/Amistoso")
console.log("- amistosos programables con detalle alineado con Partido de liga")
console.log("- tarjetas compactas con origen, marcador general, hora, ubicación y chevron")
console.log("- un único amistoso compartido por cuentas vinculadas y externos permitidos")
console.log("- modo personal con Ajustes, sin navegación inferior ni controles de liga")
console.log("- API autenticada, rate limit y persistencia service-role only")
