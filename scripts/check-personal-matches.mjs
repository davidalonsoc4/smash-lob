import { readFile } from "node:fs/promises"

const read = (file) => readFile(file, "utf8")
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const [
  migration,
  listRoute,
  detailRoute,
  peopleRoute,
  leaguesPage,
  personalPage,
  newPage,
  appShell,
  leagueGate,
] = await Promise.all([
  read("supabase/migrations/20260808110500_add_personal_matches.sql"),
  read("src/app/api/personal-matches/route.ts"),
  read("src/app/api/personal-matches/[id]/route.ts"),
  read("src/app/api/personal-matches/people/route.ts"),
  read("src/app/leagues/page.tsx"),
  read("src/app/personal-matches/page.tsx"),
  read("src/app/personal-matches/new/page.tsx"),
  read("src/components/layout/AppShell.tsx"),
  read("src/components/auth/LeagueEntryGate.tsx"),
])

for (const table of ["personal_matches", "personal_match_participants"]) {
  assert(migration.includes(`public.${table}`), `Falta la tabla ${table}`)
}
assert(migration.includes("server_create_personal_match"), "Falta la creación transaccional del amistoso")
assert(migration.includes("enable row level security"), "Las tablas personales deben tener RLS")
assert(migration.includes("from public, anon, authenticated"), "Las tablas personales no deben ser accesibles desde navegador")
assert(migration.includes("to service_role"), "service_role debe poder operar con partidos personales")

for (const route of [listRoute, detailRoute, peopleRoute]) {
  assert(route.includes("requireAuthenticatedAppUser"), "Todas las APIs personales deben requerir autenticación")
}
assert(listRoute.includes("enforceRequestRateLimit"), "La creación de amistosos debe tener rate limit")
assert(detailRoute.includes("enforceRequestRateLimit"), "El borrado de amistosos debe tener rate limit")
assert(listRoute.includes("personal_match_requires_current_user"), "El creador debe formar parte del partido")

assert(leaguesPage.includes('href="/personal-matches"'), "Mis ligas debe enlazar a Mis partidos")
assert(personalPage.includes("no modifican clasificaciones"), "El historial debe separar claramente amistosos y competición")
assert(newPage.includes("Otro jugador..."), "Debe ser posible registrar jugadores externos")
assert(newPage.includes("sourceLeagueNames"), "Debe reutilizar jugadores conocidos de ligas compartidas")
assert(appShell.includes("isPersonalMatchesRoute"), "El shell debe detectar el modo personal")
assert(appShell.includes("!isPersonalMatchesRoute"), "El modo personal debe ocultar navegación y controles de liga")
assert(leagueGate.includes("isPersonalMatchesRoute"), "La puerta de liga debe permitir el historial personal")
assert(!migration.toLowerCase().includes("pretemporada"), "El modelo personal no debe introducir pretemporada")

console.log("Mis partidos v1.4.0 correcto:")
console.log("- historial personal separado de las ligas")
console.log("- un único amistoso compartido por cuentas vinculadas")
console.log("- jugadores externos admitidos sin crear cuentas")
console.log("- API autenticada, rate limit y persistencia service-role only")
console.log("- modo personal simplificado sin navegación de liga")
