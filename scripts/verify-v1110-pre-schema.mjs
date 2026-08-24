import fs from "node:fs"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"

const PRE_PROJECT_REF = "miadjotkucgluwbrgeih"

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const values = {}
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const separator = line.indexOf("=")
    if (separator < 1) continue
    const key = line.slice(0, separator).trim()
    let value = line.slice(separator + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    values[key] = value
  }
  return values
}

const fileEnv = loadEnvFile(path.join(process.cwd(), ".env.local"))
const env = { ...fileEnv, ...process.env }
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY ?? ""

if (!supabaseUrl.includes(PRE_PROJECT_REF)) {
  console.error("v1.11.0 PRE schema probe refused: local Supabase URL is not PRE.")
  process.exit(1)
}
if (!serviceRoleKey) {
  console.error("v1.11.0 PRE schema probe refused: SUPABASE_SERVICE_ROLE_KEY is missing.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const checks = [
  [
    "league_memberships.experience_mode",
    supabase.from("league_memberships").select("experience_mode").limit(1),
  ],
  [
    "season_settings.progressive_calendar",
    supabase
      .from("season_settings")
      .select(
        "calendar_visibility_mode,revealed_through_round,opening_round_enabled,opening_round_at,opening_round_location",
      )
      .limit(1),
  ],
]

let failed = false
for (const [name, query] of checks) {
  const { error } = await query
  if (error) {
    failed = true
    console.error(`${name}: FAIL ${error.code ?? "unknown"} ${error.message ?? ""}`.trim())
  } else {
    console.log(`${name}: OK`)
  }
}

if (failed) process.exit(1)
console.log("v1.11.0 PRE schema probe: OK")
