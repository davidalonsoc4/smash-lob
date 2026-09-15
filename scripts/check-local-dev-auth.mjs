import { readFile } from "node:fs/promises"

const read = (file) => readFile(file, "utf8")
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const [auth, gate, clientHelper, serverHelper, envExample, nextConfig] = await Promise.all([
  read("src/auth.ts"),
  read("src/components/auth/AuthGate.tsx"),
  read("src/lib/localDevAuth.ts"),
  read("src/lib/serverLocalDevAuth.ts"),
  read(".env.example"),
  read("next.config.ts"),
])

assert(auth.includes('Credentials from "next-auth/providers/credentials"'), "Falta provider Credentials")
assert(auth.includes('id: "local-dev"'), "Falta id local-dev")
assert(auth.includes("getLocalDevAuthUser()"), "El provider debe depender del guard de servidor")
assert(serverHelper.includes('environment.NODE_ENV !== "development"'), "El servidor debe bloquear fuera de development")
assert(serverHelper.includes('environment.NEXT_PUBLIC_LOCAL_DEV_AUTO_LOGIN !== "1"'), "Falta flag explícito")
assert(serverHelper.includes("LOCAL_DEV_USER_EMAIL"), "Falta email configurable")
assert(clientHelper.includes('process.env.NODE_ENV === "development"'), "El cliente debe bloquear fuera de development")
assert(clientHelper.includes('normalized === "localhost"'), "Debe admitir localhost")
assert(clientHelper.includes("isPrivateLanIpv4(normalized)"), "Debe admitir IP privadas de la LAN local")
assert(clientHelper.includes("first === 10"), "Debe admitir el rango privado 10.0.0.0/8")
assert(clientHelper.includes("first === 172 && second >= 16 && second <= 31"), "Debe admitir el rango privado 172.16.0.0/12")
assert(clientHelper.includes("first === 192 && second === 168"), "Debe admitir el rango privado 192.168.0.0/16")
assert(nextConfig.includes("DEV_ALLOWED_ORIGINS"), "Next debe leer los orígenes LAN configurables")
assert(nextConfig.includes("...extraDevOrigins"), "Next debe añadir los orígenes LAN configurados")
assert(!clientHelper.includes("pre.smashandlob.com"), "PRE nunca debe ser host permitido")
assert(gate.includes('signIn("local-dev", { local: "1", redirect: false })'), "AuthGate debe iniciar la sesión local real")
assert(gate.includes("isLoopbackHostname(window.location.hostname)"), "AuthGate debe verificar host local/LAN")
assert(envExample.includes("NEXT_PUBLIC_LOCAL_DEV_AUTO_LOGIN=0"), "La plantilla debe dejar el acceso local desactivado")
assert(envExample.includes("LOCAL_DEV_USER_EMAIL="), "La plantilla debe documentar el usuario local")

console.log("Autenticación local correcta:")
console.log("- sesión Auth.js real mediante Credentials solo en NODE_ENV=development")
console.log("- activación explícita limitada a localhost/loopback e IP privadas de la LAN")
console.log("- usuario configurable por email sin habilitar bypass en PRE/PROD")
