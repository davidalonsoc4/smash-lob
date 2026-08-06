import { readFile } from "node:fs/promises"

const addMigration = await readFile(
  "supabase/migrations/20260803160000_add_league_avatars_and_restore_unlinked_identity.sql",
  "utf8",
)
const correctionMigration = await readFile(
  "supabase/migrations/20260803203000_remove_league_avatars_and_keep_account_identity.sql",
  "utf8",
)
const auditSql = await readFile(
  "docs/prepublication/identity-audit.sql",
  "utf8",
)

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

assert(
  addMigration.includes("ADD COLUMN IF NOT EXISTS link_identity_snapshot"),
  "La migración inicial debe crear la instantánea histórica.",
)
assert(
  correctionMigration.includes("DROP COLUMN IF EXISTS league_avatar_url"),
  "La corrección debe retirar el avatar por liga.",
)
assert(
  correctionMigration.includes("SET avatar_url = NULL"),
  "Los jugadores históricos no deben conservar imágenes de cuenta.",
)
assert(
  correctionMigration.includes("link_identity_snapshot = COALESCE("),
  "La vinculación debe conservar la primera identidad histórica disponible.",
)
assert(
  correctionMigration.includes("REVOKE ALL ON FUNCTION public.server_sync_linked_player_identity()"),
  "La función de identidad debe permanecer cerrada a roles de navegador.",
)
for (const requiredQuery of [
  "linked_players",
  "snapshot_matches_account_name",
  "missing_snapshot",
  "league_avatar_column_still_present",
]) {
  assert(auditSql.includes(requiredQuery), `Falta la comprobación ${requiredQuery}.`)
}

console.log("Migraciones de identidad correctas:")
console.log("- modelo global de imagen de cuenta")
console.log("- nombre e iniciales históricas preservadas al desvincular")
console.log("- avatar por liga retirado")
console.log("- auditoría SQL de datos preparada para PRE y PROD")
