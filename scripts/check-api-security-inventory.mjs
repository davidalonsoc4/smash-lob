import { readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const API_ROOT = path.resolve("src/app/api")
const OUTPUT = path.resolve("docs/security/API_SECURITY_INVENTORY.md")
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"]

const publicMethods = new Map([
  ["/api/access-intent", new Set(["GET", "DELETE"])],
  ["/api/auth/[...nextauth]", new Set(["GET", "POST"])],
  ["/api/health", new Set(["GET"])],
  ["/api/observability/client-error", new Set(["POST"])],
  ["/api/invites/[code]", new Set(["GET"])],
  ["/api/spectator-invites/[code]", new Set(["GET"])],
])

const guardDetectors = [
  {
    level: "application-admin",
    evidence: "requireAuthenticatedAppUser + isSuperuser",
    test: (source, route) =>
      route.startsWith("/api/application-admin/") &&
      source.includes("requireAuthenticatedAppUser") &&
      source.includes("isSuperuser"),
  },
  {
    level: "cron-secret",
    evidence: "CRON_SECRET",
    test: (source) => source.includes("CRON_SECRET"),
  },
  {
    level: "season-admin",
    evidence: "getServerSeasonAdmin / requireSeasonAdmin",
    test: (source) =>
      source.includes("getServerSeasonAdmin") ||
      source.includes("requireSeasonAdmin"),
  },
  {
    level: "match-policy",
    evidence: "getServerMatchActor",
    test: (source) => source.includes("getServerMatchActor"),
  },
  {
    level: "league-policy",
    evidence: "getServerLeagueActor / getServerLeagueViewer",
    test: (source) =>
      source.includes("getServerLeagueActor") ||
      source.includes("getServerLeagueViewer"),
  },
  {
    level: "authenticated",
    evidence: "requireAuthenticatedAppUser",
    test: (source) => source.includes("requireAuthenticatedAppUser"),
  },
]

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const resolved = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(resolved)))
    if (entry.isFile() && entry.name === "route.ts") files.push(resolved)
  }

  return files
}

function routeFromFile(file) {
  const relative = path.relative(path.resolve("src/app"), file)
  return `/${relative.replaceAll(path.sep, "/").replace(/\/route\.ts$/, "")}`
}

function extractMethods(source) {
  const methods = new Set()
  const patterns = [
    /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g,
    /export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\b/g,
    /export\s+const\s+\{([^}]+)\}\s*=/g,
  ]

  for (const match of source.matchAll(patterns[0])) methods.add(match[1])
  for (const match of source.matchAll(patterns[1])) methods.add(match[1])
  for (const match of source.matchAll(patterns[2])) {
    for (const method of HTTP_METHODS) {
      if (new RegExp(`\\b${method}\\b`).test(match[1])) methods.add(method)
    }
  }

  return [...methods].sort(
    (left, right) => HTTP_METHODS.indexOf(left) - HTTP_METHODS.indexOf(right),
  )
}

function detectGuard(source, route) {
  return guardDetectors.find((detector) => detector.test(source, route)) ?? null
}

function renderInventory(rows) {
  const lines = [
    "# Inventario de seguridad de API",
    "",
    "Generado por `npm run api-security:check`. Cualquier ruta o método nuevo debe quedar inventariado como público o protegido por uno de los guardas compartidos.",
    "",
    "| Ruta | Método | Exposición | Guarda detectada |",
    "| --- | --- | --- | --- |",
  ]

  for (const row of rows) {
    for (const method of row.methods) {
      const isPublic = publicMethods.get(row.route)?.has(method) === true
      lines.push(
        `| \`${row.route}\` | ${method} | ${isPublic ? "Público explícito" : "Protegido"} | ${isPublic ? "Allowlist revisada" : row.guard?.evidence ?? "**FALTA**"} |`,
      )
    }
  }

  lines.push(
    "",
    "## Reglas",
    "",
    "- Solo las combinaciones ruta/método de la allowlist pueden ser públicas.",
    "- Las demás deben utilizar autenticación, política de liga/partido/temporada, superusuario o secreto de cron.",
    "- La validación es deliberadamente conservadora: además de esta comprobación estática, la matriz de autorización y las pruebas E2E validan comportamiento.",
    "",
  )

  return `${lines.join("\n")}\n`
}

const rows = []
const failures = []

for (const file of (await walk(API_ROOT)).sort()) {
  const source = await readFile(file, "utf8")
  const route = routeFromFile(file)
  const methods = extractMethods(source)
  const guard = detectGuard(source, route)

  if (methods.length === 0) {
    failures.push(`${route}: no se han detectado métodos HTTP exportados`)
    continue
  }

  for (const method of methods) {
    const isPublic = publicMethods.get(route)?.has(method) === true
    if (!isPublic && !guard) {
      failures.push(`${route} ${method}: no tiene guarda reconocido`)
    }
  }

  rows.push({ route, methods, guard })
}

rows.sort((left, right) =>
  left.route < right.route ? -1 : left.route > right.route ? 1 : 0,
)

for (const [route, methods] of publicMethods) {
  const row = rows.find((candidate) => candidate.route === route)
  if (!row) {
    failures.push(`${route}: la allowlist pública apunta a una ruta inexistente`)
    continue
  }
  for (const method of methods) {
    if (!row.methods.includes(method)) {
      failures.push(`${route} ${method}: la allowlist pública apunta a un método inexistente`)
    }
  }
}

if (failures.length > 0) {
  console.error("Inventario de seguridad de API incorrecto:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

const rendered = renderInventory(rows)

if (process.argv.includes("--write")) {
  await writeFile(OUTPUT, rendered, "utf8")
  console.log(`Inventario actualizado: ${path.relative(process.cwd(), OUTPUT)}`)
} else {
  const current = await readFile(OUTPUT, "utf8").catch(() => "")
  if (current !== rendered) {
    console.error(
      "El inventario de API no está actualizado. Ejecuta npm run api-security:update.",
    )
    process.exit(1)
  }
  console.log(
    `Inventario de API correcto: ${rows.length} rutas y ${rows.reduce((sum, row) => sum + row.methods.length, 0)} métodos.`,
  )
}
