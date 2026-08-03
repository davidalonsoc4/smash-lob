import { execFileSync } from "node:child_process"
import { readFile } from "node:fs/promises"
import path from "node:path"

const trackedFiles = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean)

const failures = []
const forbiddenEnvironmentFiles = trackedFiles.filter(
  (file) => /^\.env(?:\.|$)/.test(file) && file !== ".env.example",
)

for (const file of forbiddenEnvironmentFiles) {
  failures.push(`archivo de entorno versionado: ${file}`)
}

const textExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".sql",
  ".txt",
])
const secretPatterns = [
  { label: "clave privada", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { label: "token de GitHub", pattern: /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/ },
  { label: "secreto OAuth de Google", pattern: /\bGOCSPX-[A-Za-z0-9_-]{20,}\b/ },
]

for (const file of trackedFiles) {
  if (!textExtensions.has(path.extname(file))) continue
  const source = await readFile(file, "utf8").catch(() => "")

  for (const { label, pattern } of secretPatterns) {
    if (pattern.test(source)) {
      failures.push(`${label} detectado en ${file}`)
    }
  }
}

if (failures.length > 0) {
  console.error("Comprobación de secretos fallida:")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log("Comprobación de secretos correcta: no hay credenciales conocidas versionadas.")
