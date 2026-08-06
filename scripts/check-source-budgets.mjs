import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const config = JSON.parse(await readFile("quality/source-budgets.json", "utf8"))

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const resolved = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(resolved)))
    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) files.push(resolved)
  }
  return files
}

function lineCount(source) {
  return source.length === 0 ? 0 : source.split(/\r?\n/).length
}

const files = await walk("src")
let totalLines = 0
let clientFiles = 0
let clientPages = 0
let largestApiRoute = { file: "", lines: 0 }
const failures = []

for (const file of files) {
  const source = await readFile(file, "utf8")
  const lines = lineCount(source)
  totalLines += lines
  const normalized = file.replaceAll(path.sep, "/")
  const isClient = /^(["'])use client\1/.test(source.trimStart())
  if (isClient) clientFiles += 1
  if (isClient && normalized.endsWith("/page.tsx")) clientPages += 1
  if (normalized.includes("/app/api/") && normalized.endsWith("/route.ts")) {
    if (lines > largestApiRoute.lines) largestApiRoute = { file: normalized, lines }
    if (lines > config.maxApiRouteLines) {
      failures.push(`${normalized}: ${lines} líneas > ${config.maxApiRouteLines}`)
    }
  }
}

if (totalLines > config.maxTotalSourceLines) {
  failures.push(`src total: ${totalLines} líneas > ${config.maxTotalSourceLines}`)
}
if (clientFiles > config.maxClientFiles) {
  failures.push(`componentes cliente: ${clientFiles} > ${config.maxClientFiles}`)
}
if (clientPages > config.maxClientPages) {
  failures.push(`páginas cliente: ${clientPages} > ${config.maxClientPages}`)
}

for (const [file, maximum] of Object.entries(config.files)) {
  const source = await readFile(file, "utf8")
  const lines = lineCount(source)
  if (lines > maximum) failures.push(`${file}: ${lines} líneas > ${maximum}`)
}

const report = {
  totalLines,
  clientFiles,
  clientPages,
  largestApiRoute,
  checkedFiles: files.length,
}

await mkdir(".quality-artifacts", { recursive: true })
await writeFile(
  ".quality-artifacts/source-budgets.json",
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
)

if (failures.length > 0) {
  console.error("Presupuestos de código superados:")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(
  `Presupuestos de código correctos: ${totalLines} líneas, ${clientFiles} clientes, ${clientPages} páginas cliente.`,
)
