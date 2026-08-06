import nextEnv from "@next/env"
import process from "node:process"

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const checks = [
  {
    name: "Rate limiting distribuido",
    ready: Boolean(
      process.env.UPSTASH_REDIS_REST_URL?.trim() &&
        process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
    ),
    missing: "UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN",
  },
  {
    name: "Observabilidad centralizada",
    ready: Boolean(process.env.OBSERVABILITY_WEBHOOK_URL?.trim()),
    missing: "OBSERVABILITY_WEBHOOK_URL",
  },
  {
    name: "E2E autenticado de PRE",
    ready: Boolean(process.env.QA_PRE_STORAGE_STATE_B64?.trim()),
    missing: "QA_PRE_STORAGE_STATE_B64",
  },
  {
    name: "Backup programado de Supabase",
    ready: Boolean(
      process.env.SUPABASE_ACCESS_TOKEN?.trim() &&
        process.env.SUPABASE_DB_PASSWORD?.trim() &&
        process.env.SUPABASE_PROJECT_REF?.trim() &&
        process.env.BACKUP_ENCRYPTION_PASSPHRASE?.trim(),
    ),
    missing:
      "SUPABASE_ACCESS_TOKEN + SUPABASE_DB_PASSWORD + SUPABASE_PROJECT_REF + BACKUP_ENCRYPTION_PASSPHRASE",
  },
]

for (const check of checks) {
  console.log(`${check.ready ? "LISTO" : "PENDIENTE"} · ${check.name}`)
  if (!check.ready) console.log(`  Falta: ${check.missing}`)
}

const pending = checks.filter((check) => !check.ready)
if (process.argv.includes("--strict") && pending.length > 0) {
  process.exit(1)
}
