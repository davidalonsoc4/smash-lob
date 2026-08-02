import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const runtimeRoots = ["src", "public"]
const runtimeFiles = ["next.config.ts", "vercel.json"]
const sourceExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".html",
  ".txt",
  ".xml",
  ".webmanifest",
])
const forbiddenLegacyHost = /https?:\/\/[^\s"'`]*\.vercel\.app/gi

async function collectFiles(target) {
  const targetPath = path.join(root, target)
  const targetStat = await stat(targetPath).catch(() => null)

  if (!targetStat) {
    return []
  }

  if (targetStat.isFile()) {
    return [targetPath]
  }

  const entries = await readdir(targetPath, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => collectFiles(path.join(target, entry.name))),
  )

  return files.flat()
}

const files = (
  await Promise.all([
    ...runtimeRoots.map((target) => collectFiles(target)),
    ...runtimeFiles.map((target) => collectFiles(target)),
  ])
)
  .flat()
  .filter((filePath) => sourceExtensions.has(path.extname(filePath)))

const legacyReferences = []

for (const filePath of files) {
  const content = await readFile(filePath, "utf8")
  const matches = content.match(forbiddenLegacyHost)

  if (matches?.length) {
    legacyReferences.push({
      file: path.relative(root, filePath),
      matches: [...new Set(matches)],
    })
  }
}

if (legacyReferences.length > 0) {
  console.error("Se han encontrado dominios antiguos de Vercel en archivos de ejecución:")
  legacyReferences.forEach(({ file, matches }) => {
    console.error(`- ${file}: ${matches.join(", ")}`)
  })
  process.exit(1)
}

const appUrlSource = await readFile(path.join(root, "src/lib/appUrl.ts"), "utf8")
const requiredCanonicalUrls = [
  "https://smashandlob.com",
  "https://pre.smashandlob.com",
]
const missingCanonicalUrls = requiredCanonicalUrls.filter(
  (url) => !appUrlSource.includes(url),
)

if (missingCanonicalUrls.length > 0) {
  console.error(
    `Faltan URLs públicas canónicas en src/lib/appUrl.ts: ${missingCanonicalUrls.join(", ")}`,
  )
  process.exit(1)
}

console.log("URLs públicas correctas:")
console.log("- Producción: https://smashandlob.com")
console.log("- PRE: https://pre.smashandlob.com")
console.log("- Sin dominios .vercel.app en los archivos de ejecución")
