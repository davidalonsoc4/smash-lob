import { readFile } from "node:fs/promises"

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8")
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const [
  migration,
  serverCatalog,
  locationsApi,
  leagueCreateApi,
  leagueUpdateApi,
  personalCreateApi,
  personalDetailApi,
  matchScheduleRoute,
  leagueEditor,
  personalEditor,
  personalSchedulePanel,
  matchScheduleForm,
  newLeaguePage,
  seasonAdminPage,
  matchEventMeta,
] = await Promise.all([
  read("supabase/migrations/20260808183000_add_global_padel_locations.sql"),
  read("src/lib/serverGlobalLocations.ts"),
  read("src/app/api/locations/route.ts"),
  read("src/app/api/leagues/route.ts"),
  read("src/app/api/leagues/[id]/route.ts"),
  read("src/app/api/personal-matches/route.ts"),
  read("src/app/api/personal-matches/[id]/route.ts"),
  read("src/app/api/matches/[matchId]/schedule/route.ts"),
  read("src/components/league/LeagueLocationsEditor.tsx"),
  read("src/app/personal-matches/new/page.tsx"),
  read("src/components/personal/PersonalMatchSchedulePanel.tsx"),
  read("src/components/match/MatchScheduleForm.tsx"),
  read("src/app/league/new/page.tsx"),
  read("src/app/admin/season/page.tsx"),
  read("src/components/matches/MatchEventMeta.tsx"),
])

assert(migration.includes("create table if not exists public.padel_locations"), "Falta padel_locations")
assert(migration.includes("enable row level security"), "padel_locations debe tener RLS")
assert(migration.includes("revoke all on table public.padel_locations from public, anon, authenticated"), "El catálogo no debe exponerse al navegador")
assert(migration.includes("grant all on table public.padel_locations to service_role"), "service_role debe gestionar el catálogo")
assert(serverCatalog.includes('.from("padel_locations")'), "El servidor debe usar el catálogo global")
assert(serverCatalog.includes('.from("leagues").select("locations")'), "Se deben importar ubicaciones históricas de ligas")
assert(serverCatalog.includes('.from("personal_matches")'), "Se deben importar ubicaciones históricas de amistosos")
assert(serverCatalog.includes("onConflict: \"canonical_key\""), "Las ubicaciones globales deben deduplicarse")
assert(locationsApi.includes("requireAuthenticatedAppUser"), "La API global debe exigir autenticación")
assert(locationsApi.includes("global_location_create"), "El alta global debe tener rate limit")
assert(leagueCreateApi.includes("saveGlobalLocations"), "Crear liga debe alimentar el catálogo global")
assert(leagueUpdateApi.includes("saveGlobalLocations"), "Editar liga debe alimentar el catálogo global")
assert(personalCreateApi.includes("saveGlobalLocation"), "Crear amistoso debe alimentar el catálogo global")
assert(personalDetailApi.includes("saveGlobalLocation"), "Editar un amistoso debe alimentar el catálogo global")
assert(leagueEditor.includes('fetch("/api/locations"'), "El editor de liga debe listar ubicaciones globales")
assert(leagueEditor.includes("Ubicaciones de la app"), "El editor de liga debe permitir seleccionar ubicaciones existentes")
assert(leagueEditor.includes("Buscar por nombre, localidad o dirección..."), "El catálogo global de liga debe tener buscador")
assert(!newLeaguePage.includes("<LeagueLocationsEditor"), "La identidad inicial de la liga no debe pedir ubicaciones")
assert(seasonAdminPage.includes("<LeagueLocationsEditor") && seasonAdminPage.includes("Cancelar creación de la liga"), "La primera temporada debe configurar ubicaciones y permitir cancelar la liga")
assert(
  matchScheduleForm.includes('fetch("/api/locations", { cache: "no-store" })'),
  "Programar partido debe cargar el catálogo global de ubicaciones",
)
assert(
  matchScheduleForm.includes("Recomendadas por la liga") &&
    matchScheduleForm.includes("Todas las ubicaciones") &&
    matchScheduleForm.includes("recommendedIdentityKeys"),
  "Programar partido debe priorizar recomendaciones de liga sin limitar el catálogo global",
)
assert(
  matchScheduleForm.includes("recommendedLocations.length === 0") &&
    matchScheduleForm.includes("filteredAvailableLocations.map(renderLocationOption)"),
  "Sin recomendaciones de liga, Programar partido debe buscar directamente en todo el catálogo global",
)
assert(
  matchScheduleForm.includes("getLeagueLocationTownNameLabel") &&
    (await readFile("src/lib/leagueLocations.ts", "utf8")).includes("getLeagueLocationTownNameLabel"),
  "Los selectores de ubicación deben mostrar Localidad - Nombre corto",
)
assert(matchScheduleForm.includes("+ Añadir nueva ubicación"), "Programar partido debe permitir crear una ubicación")
assert(matchScheduleForm.includes("shrink-0 border-t border-neutral-100 bg-white p-2"), "Añadir nueva ubicación debe permanecer fijo fuera del scroll")
assert(matchScheduleForm.includes("isAddingLeagueLocation ? <div") && matchScheduleForm.includes(": <>"), "Al crear ubicación deben ocultarse las recomendaciones y mostrarse solo el formulario")
assert(matchScheduleForm.includes('fetch("/api/locations"'), "Una ubicación nueva de partido debe guardarse en el catálogo global")
assert(matchEventMeta.includes("getScheduleLocationDisplayText"), "Los metadatos de partido deben normalizar ubicaciones antes de mostrarlas")
assert(personalEditor.includes('fetch("/api/locations"'), "Los amistosos deben listar ubicaciones globales")
assert(personalEditor.includes('fetch("/api/locations", {'), "Los amistosos deben poder guardar una ubicación nueva")
assert(personalSchedulePanel.includes("<MatchScheduleForm"), "Editar un amistoso debe reutilizar MatchScheduleForm")
assert(matchScheduleForm.includes('fetch("/api/locations"'), "Editar un amistoso debe listar ubicaciones globales mediante MatchScheduleForm")
assert(matchScheduleForm.includes("+ Añadir nueva ubicación"), "Editar un amistoso debe poder crear ubicación global mediante MatchScheduleForm")

assert(matchScheduleRoute.includes("saveGlobalLocation"), "Una ubicación libre introducida al programar un partido de liga debe guardarse globalmente")
assert(matchScheduleRoute.includes('update({ locations: nextLeagueLocations })'), "Programar con una ubicación nueva debe añadirla a la liga desde el endpoint autorizado del partido")

console.log("Ubicaciones globales v1.6.0 correctas:")
console.log("- catálogo único service-role con deduplicación y compatibilidad histórica")
console.log("- la primera temporada y la administración buscan ubicaciones existentes o añaden nuevas")
console.log("- partidos de liga priorizan recomendaciones y fijan Añadir nueva ubicación fuera del scroll; amistosos reutilizan el catálogo global")
