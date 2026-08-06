import { readFile } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import path from "node:path"
import process from "node:process"

const APPLY = process.argv.includes("--apply")
const RULESET_FILE = path.resolve("quality/github/release-branches-ruleset.json")
const API_VERSION = "2026-03-10"

function repositoryFromRemote() {
  const result = spawnSync("git", ["remote", "get-url", "origin"], {
    encoding: "utf8",
  })
  if (result.status !== 0) return ""
  const remote = result.stdout.trim().replace(/\.git$/, "")
  const match = remote.match(/github\.com[/:]([^/]+\/[^/]+)$/i)
  return match?.[1] ?? ""
}

function getRepository() {
  return process.env.GITHUB_REPOSITORY?.trim() || repositoryFromRemote()
}

async function githubRequest(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "smash-lob-quality-automation",
      "X-GitHub-Api-Version": API_VERSION,
      ...options.headers,
    },
  })

  const body = await response.text()
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 500)}`)
  }
  return body ? JSON.parse(body) : null
}

const repository = getRepository()
if (!repository || !/^[^/]+\/[^/]+$/.test(repository)) {
  throw new Error("No se ha podido determinar owner/repository de GitHub.")
}

const payload = JSON.parse(await readFile(RULESET_FILE, "utf8"))
console.log(`Repositorio: ${repository}`)
console.log(`Ruleset: ${payload.name}`)
console.log("Ramas: main, staging")
console.log("Reglas: bloquear borrado y force-push; los merges directos siguen permitidos.")

if (!APPLY) {
  console.log("Modo revisión: no se ha realizado ningún cambio remoto.")
  console.log("Para aplicarlo: npm run github:rulesets:apply")
  process.exit(0)
}

const token = process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim()
if (!token) {
  throw new Error("Configura GITHUB_TOKEN o GH_TOKEN con permiso Administration: write.")
}

const baseUrl = `https://api.github.com/repos/${repository}/rulesets`
const existing = await githubRequest(baseUrl, token)
const current = Array.isArray(existing)
  ? existing.find((ruleset) => ruleset.name === payload.name)
  : null

if (current?.id) {
  await githubRequest(`${baseUrl}/${current.id}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
  console.log(`Ruleset actualizado: ${current.id}`)
} else {
  const created = await githubRequest(baseUrl, token, {
    method: "POST",
    body: JSON.stringify(payload),
  })
  console.log(`Ruleset creado: ${created.id}`)
}
