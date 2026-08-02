import nextEnv from "@next/env"

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const required = [
  "AUTH_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]

const missing = required.filter((name) => !process.env[name]?.trim())

if (missing.length > 0) {
  console.error("Configuración obligatoria incompleta:")
  missing.forEach((name) => console.error(`- ${name}: ausente`))
  process.exit(1)
}

const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL)
const allowedAppHosts = new Set([
  "smashandlob.com",
  "pre.smashandlob.com",
  "localhost",
  "127.0.0.1",
])

if (
  !allowedAppHosts.has(appUrl.hostname) ||
  !["http:", "https:"].includes(appUrl.protocol)
) {
  console.error("NEXT_PUBLIC_APP_URL no usa un origen oficial o local permitido.")
  process.exit(1)
}

console.log("Variables obligatorias presentes (valores ocultos):")
required.forEach((name) => console.log(`- ${name}: presente`))
