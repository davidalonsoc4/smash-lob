import { readFile } from "node:fs/promises"

const read = (file) => readFile(file, "utf8")
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const [auth, gate, clientHelper, serverHelper, envExample] = await Promise.all([
  read("src/auth.ts"),
  read("src/components/auth/AuthGate.tsx"),
  read("src/lib/localDevAuth.ts"),
  read("src/lib/serverLocalDevAuth.ts"),
  read(".env.example"),
])

assert(auth.includes('Credentials from "next-auth/providers/credentials"'), "Falta provider Credentials")
assert(auth.includes('id: "local-dev"'), "Falta id local-dev")
assert(auth.includes("getLocalDevAuthUser()"), "El provider debe depender del guard de servidor")
assert(serverHelper.includes('environment.NODE_ENV !== "development"'), "El servidor debe bloquear fuera de development")
assert(serverHelper.includes('environment.NEXT_PUBLIC_LOCAL_DEV_AUTO_LOGIN !== "1"'), "Falta flag explícito")
assert(serverHelper.includes("LOCAL_DEV_USER_EMAIL"), "Falta email configurable")
assert(clientHelper.includes('process.env.NODE_ENV === "development"'), "El cliente debe bloquear fuera de development")
assert(clientHelper.includes('normalized === "localhost"'), "Debe admitir localhost")
assert(clientHelper.includes('normalized === "127.0.0.1"'), "Debe admitir 127.0.0.1")
assert(!clientHelper.includes("pre.smashandlob.com"), "PRE nunca debe ser host permitido")
assert(gate.includes('signIn("local-dev", { local: "1", redirect: false })'), "AuthGate debe iniciar la sesión local real")
assert(gate.includes("isLoopbackHostname(window.location.hostname)"), "AuthGate debe verificar loopback")
assert(envExample.includes("NEXT_PUBLIC_LOCAL_DEV_AUTO_LOGIN=0"), "La plantilla debe dejar el acceso local desactivado")
assert(envExample.includes("LOCAL_DEV_USER_EMAIL="), "La plantilla debe documentar el usuario local")

console.log("Autenticación local v1.4.11 correcta:")
console.log("- sesión Auth.js real mediante Credentials solo en NODE_ENV=development")
console.log("- activación explícita y limitada a localhost/loopback")
console.log("- usuario configurable por email sin habilitar bypass en PRE/PROD")
