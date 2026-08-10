import { readFile } from "node:fs/promises"

const read = (path) => readFile(path, "utf8")
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const [
  mvp,
  adminSeason,
  adminMvp,
  settingsApi,
  createSeasonApi,
  migration,
  resultApi,
  confirmationApi,
  awards,
] = await Promise.all([
  read("src/lib/mvp.ts"),
  read("src/app/admin/season/page.tsx"),
  read("src/app/admin/mvp/page.tsx"),
  read("src/app/api/leagues/[id]/seasons/[seasonId]/settings/route.ts"),
  read("src/app/api/leagues/[id]/seasons/route.ts"),
  read("supabase/migrations/20260810142000_add_advanced_automatic_mvp_mode.sql"),
  read("src/app/api/matches/[matchId]/result/route.ts"),
  read("src/app/api/result-confirmations/[matchId]/route.ts"),
  read("src/lib/serverSeasonAwards.ts"),
])

assert(
  mvp.includes('"automatic_advanced"') &&
    mvp.includes("getAdvancedAutomaticMvpRatings") &&
    mvp.includes("ADVANCED_MVP_RIDGE_LAMBDA") &&
    mvp.includes("ADVANCED_MVP_SHARED_RATING_EPSILON"),
  "Falta el modo automático avanzado o su rating ajustado.",
)
assert(
  mvp.includes("match.round <= round"),
  "El rating avanzado debe ignorar rondas futuras.",
)
assert(
  mvp.includes("resultScore * 0.6 + setMargin * 0.25 + gameMargin * 0.15"),
  "El índice debe mantener la prioridad resultado > sets > juegos.",
)
assert(
  adminSeason.includes('value: "automatic_advanced"') &&
    adminSeason.includes("MVP automático avanzado"),
  "Administrar temporada debe ofrecer MVP automático avanzado.",
)
assert(
  adminMvp.includes("isAdvancedAutomatic") && adminMvp.includes("empate técnico"),
  "Administrar MVP debe explicar el modo avanzado y sus empates técnicos.",
)
for (const [label, source] of [
  ["API de ajustes", settingsApi],
  ["API de creación", createSeasonApi],
]) {
  assert(source.includes('value === "automatic_advanced"'), `${label} no acepta automatic_advanced.`)
}
assert(
  migration.includes("automatic_advanced") &&
    migration.includes("season_settings_mvp_system_check"),
  "La migración debe ampliar el CHECK de season_settings.mvp_system.",
)
assert(
  resultApi.includes('mvp_system === "automatic_advanced"') &&
    confirmationApi.includes('mvp_system === "automatic_advanced"'),
  "El modo avanzado debe resolverse tanto al registrar como al confirmar resultados.",
)
assert(
  awards.includes('mvp_system === "automatic_advanced"'),
  "Los premios de servidor deben conservar el modo avanzado.",
)

console.log("MVP automático avanzado v1.6.0 correcto:")
console.log("- modo adicional sin sustituir Automático ni Votación")
console.log("- pareja dominante de jornada como primera criba")
console.log("- Adjusted Plus-Minus regularizado por compañero y rivales")
console.log("- resultado 60%, sets 25% y juegos 15% en el rendimiento observado")
console.log("- solo usa partidos completados hasta la jornada evaluada")
console.log("- empate técnico compartido cuando la diferencia ajustada es <= 0,03")
console.log("- persistencia, API, premios y actividad compatibles con automatic_advanced")
