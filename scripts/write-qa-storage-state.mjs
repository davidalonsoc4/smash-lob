import { chmod, mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const encoded = process.env.QA_PRE_STORAGE_STATE_B64?.trim()
if (!encoded) {
  throw new Error("Falta QA_PRE_STORAGE_STATE_B64.")
}

let state
try {
  state = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"))
} catch {
  throw new Error("QA_PRE_STORAGE_STATE_B64 no contiene un storage state válido.")
}

if (!Array.isArray(state.cookies) || !Array.isArray(state.origins)) {
  throw new Error("El storage state debe incluir cookies y origins.")
}

const output = path.resolve(".quality-artifacts/qa/pre-storage-state.json")
await mkdir(path.dirname(output), { recursive: true })
await writeFile(output, `${JSON.stringify(state, null, 2)}\n`, "utf8")
await chmod(output, 0o600).catch(() => undefined)
console.log(`Storage state preparado: ${path.relative(process.cwd(), output)}`)
