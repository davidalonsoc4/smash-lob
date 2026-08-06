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

const optionalPairs = [
  ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
]

for (const [left, right] of optionalPairs) {
  const hasLeft = Boolean(process.env[left]?.trim())
  const hasRight = Boolean(process.env[right]?.trim())
  if (hasLeft !== hasRight) {
    console.error(`${left} y ${right} deben configurarse juntos.`)
    process.exit(1)
  }
}

const observabilityUrl = process.env.OBSERVABILITY_WEBHOOK_URL?.trim() ?? ""
const observabilityToken = process.env.OBSERVABILITY_WEBHOOK_TOKEN?.trim() ?? ""
const observabilityLevel = (
  process.env.OBSERVABILITY_MIN_LEVEL?.trim().toLowerCase() || "error"
)

if (observabilityToken && !observabilityUrl) {
  console.error("OBSERVABILITY_WEBHOOK_TOKEN requiere OBSERVABILITY_WEBHOOK_URL.")
  process.exit(1)
}

if (observabilityUrl) {
  let webhookUrl
  try {
    webhookUrl = new URL(observabilityUrl)
  } catch {
    console.error("OBSERVABILITY_WEBHOOK_URL no es una URL válida.")
    process.exit(1)
  }
  const localWebhook = new Set(["localhost", "127.0.0.1"]).has(webhookUrl.hostname)
  if (webhookUrl.protocol !== "https:" && !localWebhook) {
    console.error("OBSERVABILITY_WEBHOOK_URL debe usar HTTPS salvo en localhost.")
    process.exit(1)
  }
}

if (!["info", "warn", "error"].includes(observabilityLevel)) {
  console.error("OBSERVABILITY_MIN_LEVEL debe ser info, warn o error.")
  process.exit(1)
}

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

const variant = (process.env.NEXT_PUBLIC_APP_VARIANT ?? "").trim().toLowerCase()
const allowedVariants = new Set(["", "pre", "staging", "prod", "production"])

if (!allowedVariants.has(variant)) {
  console.error("NEXT_PUBLIC_APP_VARIANT contiene un valor no permitido.")
  process.exit(1)
}

const preVariants = new Set(["pre", "staging"])
const productionVariants = new Set(["prod", "production"])
const isPreHost = appUrl.hostname === "pre.smashandlob.com"
const isProductionHost =
  appUrl.hostname === "smashandlob.com" || appUrl.hostname === "www.smashandlob.com"

if (
  (isPreHost && productionVariants.has(variant)) ||
  (isProductionHost && preVariants.has(variant))
) {
  console.error(
    "NEXT_PUBLIC_APP_URL y NEXT_PUBLIC_APP_VARIANT describen entornos distintos.",
  )
  process.exit(1)
}

if (
  process.env.VERCEL_ENV === "production" &&
  appUrl.hostname !== "smashandlob.com"
) {
  console.error("Un despliegue Production de Vercel debe usar https://smashandlob.com.")
  process.exit(1)
}

console.log("Variables obligatorias presentes (valores ocultos):")
required.forEach((name) => console.log(`- ${name}: presente`))
