import { readFile } from "node:fs/promises"
import process from "node:process"

const lockfilePath = new URL("../package-lock.json", import.meta.url)
const lockfile = JSON.parse(await readFile(lockfilePath, "utf8"))
const packages = Object.entries(lockfile.packages ?? {})
const failures = []
const notes = []

function parseNumericVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version)
  if (!match) return null
  return match.slice(1).map(Number)
}

function compareNumericVersions(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index]
  }
  return 0
}

function isAtLeast(version, minimum) {
  const parsedVersion = parseNumericVersion(version)
  const parsedMinimum = parseNumericVersion(minimum)
  return Boolean(
    parsedVersion &&
      parsedMinimum &&
      compareNumericVersions(parsedVersion, parsedMinimum) >= 0,
  )
}

function packageEntries(packageName) {
  const suffix = `/node_modules/${packageName}`
  return packages.filter(([packagePath]) =>
    packagePath === `node_modules/${packageName}` || packagePath.endsWith(suffix),
  )
}

const authCoreEntries = packageEntries("@auth/core")
if (authCoreEntries.length === 0) {
  failures.push("No se ha encontrado @auth/core en package-lock.json.")
}
for (const [packagePath, metadata] of authCoreEntries) {
  const version = metadata.version ?? "desconocida"
  if (!isAtLeast(version, "0.41.3")) {
    failures.push(`${packagePath} resuelve @auth/core ${version}; se requiere 0.41.3 o superior.`)
  } else {
    notes.push(`@auth/core ${version}`)
  }
}

const nextAuthEntries = packageEntries("next-auth")
if (nextAuthEntries.length === 0) {
  failures.push("No se ha encontrado next-auth en package-lock.json.")
}
for (const [packagePath, metadata] of nextAuthEntries) {
  const version = metadata.version ?? "desconocida"
  const betaMatch = /^5\.0\.0-beta\.(\d+)$/.exec(version)
  const safeBeta = betaMatch ? Number(betaMatch[1]) >= 32 : false
  const stableMajor = parseNumericVersion(version)?.[0] ?? 0
  const safeStable =
    stableMajor >= 5 || (stableMajor === 4 && isAtLeast(version, "4.24.15"))

  if (!safeBeta && !safeStable) {
    failures.push(
      `${packagePath} resuelve next-auth ${version}; se requiere 5.0.0-beta.32+, 4.24.15+ o una versión estable posterior.`,
    )
  } else {
    notes.push(`next-auth ${version}`)
  }
}

const legacyBraceExpansionAllowlist = [
  /^node_modules\/@eslint\/[^/]+\/node_modules\/brace-expansion$/,
  /^node_modules\/eslint\/node_modules\/brace-expansion$/,
  /^node_modules\/eslint-config-next\/node_modules\/brace-expansion$/,
]

const braceEntries = packageEntries("brace-expansion")
if (braceEntries.length === 0) {
  failures.push("No se ha encontrado brace-expansion en package-lock.json.")
}

let runtimeBraceVersion = null
let allowedLegacyCopies = 0
for (const [packagePath, metadata] of braceEntries) {
  const version = metadata.version ?? "desconocida"
  const major = parseNumericVersion(version)?.[0]

  if (packagePath === "node_modules/brace-expansion") {
    runtimeBraceVersion = version
    if (major !== 5 || !isAtLeast(version, "5.0.8")) {
      failures.push(
        `La copia principal de brace-expansion es ${version}; se requiere 5.0.8 o superior.`,
      )
    }
    continue
  }

  if (major === 1 && isAtLeast(version, "1.1.17")) {
    const allowed = legacyBraceExpansionAllowlist.some((pattern) => pattern.test(packagePath))
    if (allowed) {
      allowedLegacyCopies += 1
      continue
    }
  }

  failures.push(
    `${packagePath} resuelve brace-expansion ${version} fuera de la línea base autorizada.`,
  )
}

if (runtimeBraceVersion) notes.push(`brace-expansion runtime ${runtimeBraceVersion}`)
if (allowedLegacyCopies > 0) {
  notes.push(`${allowedLegacyCopies} copias 1.1.17+ limitadas a herramientas de lint`)
}

if (failures.length > 0) {
  console.error("\nLínea base de seguridad NO válida:\n")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exitCode = 1
} else {
  console.log("Línea base de seguridad correcta:")
  for (const note of [...new Set(notes)]) console.log(`- ${note}`)
}
