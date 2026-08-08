import { access, readFile } from "node:fs/promises"

const read = (path) => readFile(path, "utf8")
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}
const mustNotExist = async (path, message) => {
  try {
    await access(path)
  } catch {
    return
  }
  throw new Error(message)
}

const [
  packageJson,
  layout,
  hub,
  settings,
  settingsSearch,
  boundary,
  bigSmileEditor,
  notionEditor,
  notionRoute,
  bigSmileRoute,
  appUrl,
  serverAvatarLabAccess,
  serverImageValidation,
  accountProfile,
] = await Promise.all([
  read("package.json"),
  read("src/app/experimental/avatar-lab/layout.tsx"),
  read("src/features/avatar-lab/components/AvatarLabClient.tsx"),
  read("src/app/settings/page.tsx"),
  read("src/lib/settingsSearch.ts"),
  read("src/components/layout/AppRouteBoundary.tsx"),
  read("src/features/avatar-lab/components/BigSmileEditorClient.tsx"),
  read("src/features/avatar-lab/components/NotionAvatarEditorClient.tsx"),
  read("src/app/api/experimental/avatar-lab/notion-avatar/route.ts"),
  read("src/app/api/experimental/avatar-lab/dicebear-big-smile/route.ts"),
  read("src/lib/appUrl.ts"),
  read("src/lib/serverAvatarLabAccess.ts"),
  read("src/lib/serverImageValidation.ts"),
  read("src/components/settings/AccountProfileSettings.tsx"),
])

const pkg = JSON.parse(packageJson)
const dependencies = pkg.dependencies ?? {}

assert(pkg.version === "1.4.11", "La entrega debe usar la version 1.4.11")
assert(!dependencies["@avatune/react"], "@avatune/react debe eliminarse")
assert(!dependencies["@avatune/pacovqzz-theme"], "El tema Pacovqzz debe eliminarse")
assert(!dependencies["react-notion-avatar"], "react-notion-avatar no debe arrastrar su arbol obsoleto")

assert(layout.includes("isAvatarLabRequestContext()"), "Avatar Lab debe validar el host real de PRE")
assert(layout.includes("notFound()"), "Avatar Lab debe devolver 404 fuera de PRE")
assert(layout.includes("index: false") && layout.includes("follow: false"), "Avatar Lab no debe indexarse")
assert(!boundary.includes('pathname.startsWith("/experimental/avatar-lab")'), "Avatar Lab debe usar el acceso autenticado normal")
assert(boundary.includes("<AppShell>{children}</AppShell>"), "Avatar Lab debe renderizarse dentro del AppShell")

for (const route of ["/experimental/avatar-lab/big-smile", "/experimental/avatar-lab/notion-avatar"]) {
  assert(hub.includes(route), `Falta el acceso ${route}`)
}
for (const removed of ["ready-player-me", "Pacovqzz", "pacovqzz"]) {
  assert(!hub.includes(removed), `${removed} no debe aparecer en el hub`)
}
assert((settings.match(/href="\/experimental\/avatar-lab"/g) ?? []).length === 2, "Ajustes debe conservar los dos accesos por tipo de usuario")
assert((settings.match(/isAvatarLabEnabled\(\) \? \(/g) ?? []).length >= 2, "Ajustes debe ocultar el laboratorio fuera de PRE")
assert(settingsSearch.includes("avatarLabEnabled"), "La busqueda de Ajustes debe filtrar Avatar Lab por entorno")
assert(settingsSearch.includes('avatarLab: "/experimental/avatar-lab"'), "El laboratorio debe conservar su ruta de busqueda en PRE")
for (const route of [bigSmileRoute, notionRoute]) {
  assert(route.includes("isAvatarLabRequest(request)"), "Las API de Avatar Lab deben devolver 404 fuera de PRE")
  assert(route.includes("requireAuthenticatedAppUser()"), "Las API de Avatar Lab deben exigir sesion")
  assert(route.includes("enforceRequestRateLimit"), "Las API de Avatar Lab deben limitar abuso")
  assert(route.includes("private, max-age"), "Las respuestas autenticadas no deben usar cache publica")
}
assert(appUrl.includes("official configured domain wins"), "El dominio oficial debe prevalecer ante una variante contradictoria")
assert(serverAvatarLabAccess.includes("isProductionHost(host) || isProductionHost(forwardedHost)"), "El layout debe denegar PROD aunque el proxy presente otro host")
assert(serverImageValidation.includes("ACCOUNT_AVATAR_MAX_BYTES = 160 * 1024"), "La imagen global debe tener un presupuesto de 160 KB")
assert(accountProfile.includes("outputSize={256}"), "La imagen global debe generarse a 256 x 256")
assert(accountProfile.includes("maxOutputBytes={160 * 1024}"), "El recorte debe respetar el presupuesto de 160 KB")

for (const client of [bigSmileEditor, notionEditor]) {
  assert(client.includes("compact-page"), "Los editores deben usar la maqueta movil de la app")
  assert(client.includes("env(safe-area-inset-bottom)"), "Los editores deben respetar la zona segura inferior")
  assert(!client.toLowerCase().includes("supabase"), "Los editores no deben escribir en Supabase")
  assert(!client.includes("fetch("), "Los editores no deben enviar datos desde el navegador")
}
assert(!bigSmileEditor.includes('setPreviewState("loading")'), "Big Smile no debe reiniciar la vista previa desde un efecto")
assert(!notionEditor.includes('setPreviewState("loading")'), "Notion no debe reiniciar la vista previa desde un efecto")
assert(!notionEditor.includes("setPage(0)\n  }, [selectedPart]"), "Notion debe reiniciar el paginado desde la accion del usuario")
assert(bigSmileEditor.includes("previewResult?.url === avatarUrl"), "Big Smile debe derivar la carga desde la URL activa")
assert(notionEditor.includes("previewResult?.key === previewKey"), "Notion debe derivar la carga desde la receta activa")
assert(notionEditor.includes("smash-lob-avatar-lab-notion-v3"), "Notion debe reiniciar el almacenamiento experimental para aplicar los nuevos valores iniciales")

assert(notionEditor.includes("h-[calc(100dvh-8rem)]"), "Notion debe concentrar preview y controles en la altura movil")
assert(notionEditor.includes("grid-rows-[minmax(180px,1fr)_auto]"), "Notion debe reservar una preview flexible siempre visible")
for (const label of ["Categoría anterior", "Categoría siguiente", "Estilo anterior", "Estilo siguiente", "Seleccionar categoría"]) {
  assert(notionEditor.includes(`aria-label="${label}"`), `Falta el control movil ${label}`)
}
for (const removed of ["NOTION_AVATAR_PRESETS", "Forma", "Fondo", "backgroundColor", "setShape"]) {
  assert(!notionEditor.includes(removed), `${removed} debe eliminarse del editor Notion`)
}
assert(notionRoute.includes("raw.githubusercontent.com/Mayandev/notion-avatar"), "Notion debe usar los recursos SVG oficiales")
assert(notionRoute.includes("sanitizeSvg"), "Los SVG remotos deben sanearse")
assert(!notionRoute.includes("/is,"), "Notion no debe usar el flag dotAll incompatible con ES2017")
assert(notionRoute.includes("[\\s\\S]*?<svg"), "Notion debe conservar el tratamiento SVG multilínea compatible")
assert(notionRoute.includes('fill="#ffffff"'), "Notion debe renderizar siempre un fondo blanco")
assert(notionRoute.includes("next: { revalidate:"), "El renderer Notion debe cachear los recursos")

await Promise.all([
  mustNotExist("docs/avatars", "La documentacion Pixel Chibi debe eliminarse"),
  mustNotExist("public/avatars", "Los assets Pixel Chibi deben eliminarse"),
  mustNotExist("public/experimental", "Los recursos experimentales descartados deben eliminarse"),
  mustNotExist("src/app/experimental/avatar-lab/pacovqzz", "La ruta Pacovqzz debe eliminarse"),
  mustNotExist("src/app/experimental/avatar-lab/ready-player-me", "La ruta Ready Player Me debe eliminarse"),
  mustNotExist("src/app/api/experimental/avatar-lab/avatune", "El endpoint Avatune debe eliminarse"),
  mustNotExist("src/app/api/experimental/avatar-lab/ready-player-me-status", "El endpoint Ready Player Me debe eliminarse"),
])

console.log("Avatar Lab v1.4.11 correcto:")
console.log("- acceso autenticado y con rate limit para jugador y espectador")
console.log("- interfaz, busqueda y API limitadas al host real de PRE")
console.log("- solo DiceBear Big Smile y Notion Avatar")
console.log("- editor Notion compacto con preview y controles simultaneos")
console.log("- recetas locales sin Supabase ni cambios de perfil")
console.log("- dependencias y recursos descartados eliminados")
