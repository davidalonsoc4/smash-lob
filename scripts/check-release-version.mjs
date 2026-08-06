import { readFile } from "node:fs/promises"

const packageJson = JSON.parse(await readFile("package.json", "utf8"))
const packageLock = JSON.parse(await readFile("package-lock.json", "utf8"))
const appVersion = await readFile("src/lib/appVersion.ts", "utf8")
const changelog = await readFile("src/lib/changelog.ts", "utf8")
const serviceWorker = await readFile("public/sw.js", "utf8")

const version = packageJson.version
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

assert(/^\d+\.\d+\.\d+$/.test(version), "package.json no contiene una versión semántica válida.")
assert(packageLock.version === version, "package-lock.json no coincide con package.json.")
assert(packageLock.packages?.[""]?.version === version, "La raíz de package-lock.json no coincide con package.json.")
assert(appVersion.includes(`APP_VERSION = "${version}"`), "src/lib/appVersion.ts no coincide con package.json.")
assert(appVersion.includes(`APP_VERSION_LABEL = "v${version}"`), "La etiqueta visible no coincide con package.json.")
assert(changelog.includes(`version: "v${version}"`), "El changelog no contiene la versión actual.")
assert(serviceWorker.includes(`smash-lob-v${version}`), "La caché del service worker no coincide con la versión actual.")
assert(packageJson.scripts?.["smoke:pre"]?.includes(` ${version} pre`), "smoke:pre no comprueba la versión actual.")
assert(packageJson.scripts?.["smoke:prod"]?.includes(` ${version} prod`), "smoke:prod no comprueba la versión actual.")

console.log(`Versión de lanzamiento coherente: v${version}`)
console.log("- package.json y package-lock.json")
console.log("- versión visible y changelog")
console.log("- service worker")
console.log("- smoke tests PRE y PROD")
