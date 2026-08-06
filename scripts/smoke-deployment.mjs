const [rawBaseUrl, expectedVersion, expectedEnvironment] = process.argv.slice(2)

if (!rawBaseUrl || !expectedVersion || !expectedEnvironment) {
  console.error(
    "Uso: node scripts/smoke-deployment.mjs <base-url> <version> <pre|prod>",
  )
  process.exit(1)
}

if (!["pre", "prod"].includes(expectedEnvironment)) {
  console.error("El entorno esperado debe ser pre o prod.")
  process.exit(1)
}

const baseUrl = new URL(rawBaseUrl).origin

async function request(path, options = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
    ...options,
  })

  return response
}

const healthResponse = await request("/api/health")

if (!healthResponse.ok) {
  throw new Error(`/api/health ha respondido ${healthResponse.status}.`)
}

const health = await healthResponse.json()

if (health.status !== "ok") {
  throw new Error("/api/health no informa estado ok.")
}

if (health.version !== expectedVersion) {
  throw new Error(
    `Versión desplegada ${health.version}; se esperaba ${expectedVersion}.`,
  )
}

if (health.environment !== expectedEnvironment) {
  throw new Error(
    `Entorno desplegado ${health.environment}; se esperaba ${expectedEnvironment}.`,
  )
}

const homeResponse = await request("/")

if (homeResponse.status < 200 || homeResponse.status >= 400) {
  throw new Error(`La portada ha respondido ${homeResponse.status}.`)
}

const avatarPageResponse = await request("/experimental/avatar-lab")
const avatarApiResponse = await request(
  "/api/experimental/avatar-lab/dicebear-big-smile?seed=release-smoke",
)

if (expectedEnvironment === "prod") {
  if (avatarPageResponse.status !== 404) {
    throw new Error(
      `Avatar Lab debe devolver 404 en PROD; página=${avatarPageResponse.status}.`,
    )
  }

  if (avatarApiResponse.status !== 404) {
    throw new Error(
      `Avatar Lab debe devolver 404 en PROD; API=${avatarApiResponse.status}.`,
    )
  }
} else {
  if (avatarPageResponse.status === 404) {
    throw new Error("Avatar Lab no está disponible en PRE.")
  }

  if (avatarApiResponse.status !== 401) {
    throw new Error(
      `La API de Avatar Lab debe exigir sesión en PRE; estado=${avatarApiResponse.status}.`,
    )
  }
}

console.log(`Smoke ${expectedEnvironment.toUpperCase()} correcto:`)
console.log(`- ${baseUrl}`)
console.log(`- versión ${expectedVersion}`)
console.log("- portada disponible")
console.log(
  expectedEnvironment === "pre"
    ? "- Avatar Lab disponible y autenticado"
    : "- Avatar Lab oculto y bloqueado",
)
