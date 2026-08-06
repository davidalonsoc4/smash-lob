import { gzipSync } from "node:zlib"
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const config = JSON.parse(await readFile("quality/build-budgets.json", "utf8"))

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const resolved = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(resolved)))
    if (entry.isFile()) files.push(resolved)
  }
  return files
}

const nextStatic = ".next/static"
await stat(nextStatic).catch(() => {
  throw new Error("No existe .next/static. Ejecuta npm run build antes del presupuesto.")
})

const staticFiles = await walk(nextStatic)
const javascript = staticFiles.filter((file) => file.endsWith(".js"))
let totalRaw = 0
let totalGzip = 0
let largestRaw = { file: "", bytes: 0 }
let largestGzip = { file: "", bytes: 0 }
let largestAsset = { file: "", bytes: 0 }

for (const file of staticFiles) {
  const buffer = await readFile(file)
  if (buffer.length > largestAsset.bytes) largestAsset = { file, bytes: buffer.length }
  if (!file.endsWith(".js")) continue
  const gzip = gzipSync(buffer).length
  totalRaw += buffer.length
  totalGzip += gzip
  if (buffer.length > largestRaw.bytes) largestRaw = { file, bytes: buffer.length }
  if (gzip > largestGzip.bytes) largestGzip = { file, bytes: gzip }
}

const failures = []
if (totalRaw > config.maxTotalJavaScriptRawBytes) failures.push(`JS raw total ${totalRaw}`)
if (totalGzip > config.maxTotalJavaScriptGzipBytes) failures.push(`JS gzip total ${totalGzip}`)
if (largestRaw.bytes > config.maxChunkRawBytes) failures.push(`chunk raw ${largestRaw.file}: ${largestRaw.bytes}`)
if (largestGzip.bytes > config.maxChunkGzipBytes) failures.push(`chunk gzip ${largestGzip.file}: ${largestGzip.bytes}`)
if (largestAsset.bytes > config.maxStaticAssetBytes) failures.push(`asset ${largestAsset.file}: ${largestAsset.bytes}`)

const report = {
  javascriptFiles: javascript.length,
  totalRaw,
  totalGzip,
  largestRaw,
  largestGzip,
  largestAsset,
  budgets: config,
}
await mkdir(".quality-artifacts/performance", { recursive: true })
await writeFile(
  ".quality-artifacts/performance/build-budgets.json",
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
)

if (failures.length > 0) {
  console.error("Presupuestos de build superados:")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`Build dentro de presupuesto: ${totalGzip} bytes gzip en ${javascript.length} chunks JS.`)
