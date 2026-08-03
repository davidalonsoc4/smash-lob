import { access, readFile, readdir } from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const manifestPath = path.join(root, "public/avatars/shared/manifest.json")
const palettesPath = path.join(root, "public/avatars/shared/palettes.json")
const rendererPath = path.join(root, "src/features/avatar-lab/renderers/PixelChibiAvatarRenderer.tsx")
const layersRoot = path.join(root, "src/features/avatar-lab/renderers/pixelChibi")
const referencePath = path.join(root, "docs/avatars/reference/pixel-chibi-canonical.png")

const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
const palettes = JSON.parse(await readFile(palettesPath, "utf8"))

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(manifest.manifestVersion === 1, "manifestVersion debe ser 1")
assert(manifest.recipeSchemaVersion === 1, "recipeSchemaVersion debe ser 1")
assert(manifest.demoVersion === "Avatar Lab DEMO 0.1", "Versión experimental inesperada")
assert(manifest.masterTemplate?.viewBox?.join(" ") === "0 0 192 240", "ViewBox maestro inválido")
assert(manifest.masterTemplate?.centerAxisX === 96, "Eje central maestro inválido")
assert(manifest.masterTemplate?.groundLineY === 232, "Línea de suelo maestra inválida")

const worldMap = new Map(manifest.worlds.map((world) => [world.id, world]))
assert(worldMap.get("pixel_chibi")?.available === true, "Pixel Chibi debe estar disponible")
assert(worldMap.get("chibi_illustrated")?.available === false, "Chibi ilustrado debe seguir desactivado")
assert(worldMap.get("chibi_illustrated")?.rendererId === null, "No debe existir renderer ilustrado provisional")

const requiredCategories = [
  "body", "head", "hair", "beard", "eyes", "eyebrows", "cap", "headband",
  "shirt", "shorts", "sleeve", "wristband", "socks", "shoes", "racket",
]
const categories = new Set(manifest.assets.map((asset) => asset.category))
for (const category of requiredCategories) {
  assert(categories.has(category), `Falta la categoría modular ${category}`)
}

const ids = manifest.assets.map((asset) => `${asset.category}.${asset.id}`)
assert(new Set(ids).size === ids.length, "Existen IDs de asset duplicados")
for (const asset of manifest.assets) {
  assert(asset.worldVariants?.pixel_chibi, `Falta variante Pixel Chibi para ${asset.category}.${asset.id}`)
  assert(asset.worldVariants?.chibi_illustrated === null, `Chibi ilustrado no puede reutilizar Pixel Chibi: ${asset.category}.${asset.id}`)
}

const requiredPaletteTokens = [
  "skin_light_warm", "skin_medium_warm", "dark_brown", "black", "charcoal", "navy",
  "white", "light_blue", "light_blue_shadow", "green", "green_shadow", "red", "blue", "grey",
]
for (const token of requiredPaletteTokens) {
  const values = palettes.tokens?.[token]
  assert(Array.isArray(values) && values.length === 3, `La paleta ${token} debe tener principal, sombra y luz`)
}
assert(palettes.lightingDirection === "top_left", "La iluminación debe ser top_left")

const renderer = await readFile(rendererPath, "utf8")
assert(renderer.includes('shapeRendering="crispEdges"'), "El SVG debe usar crispEdges")
assert(renderer.includes('imageRendering: "pixelated"'), "El SVG debe declarar image-rendering pixelated")
assert(!renderer.includes("<image"), "La referencia no puede usarse como imagen plana")

const layerFiles = await readdir(layersRoot)
for (const expected of ["background.tsx", "body.tsx", "head.tsx", "racket.tsx", "CharacterLayers.tsx", "shared.ts"]) {
  assert(layerFiles.includes(expected), `Falta el módulo de capas ${expected}`)
}
const layerSource = (await Promise.all(layerFiles.filter((name) => name.endsWith(".tsx")).map((name) => readFile(path.join(layersRoot, name), "utf8")))).join("\n")
assert(!/<(?:linearGradient|radialGradient|filter|image)\b/.test(layerSource), "Las capas Pixel Chibi no pueden usar degradados, filtros ni imágenes")
const pathData = [...layerSource.matchAll(/\bd="([^"]+)"/g)].map((match) => match[1]).join(" ")
assert(!/[CQAScqas]/.test(pathData), "Las capas no deben usar curvas SVG")

await access(referencePath)
const illustratedEntries = await readdir(path.join(root, "public/avatars/chibi-illustrated"))
assert(illustratedEntries.every((name) => name.toLowerCase() === "readme.md"), "Chibi ilustrado no debe contener assets visuales en la DEMO")

console.log("Avatar assets correctos:")
console.log(`- ${manifest.assets.length} primitivas modulares declaradas`)
console.log("- receta/manifiesto v1 y dos mundos separados")
console.log("- Pixel Chibi nítido, sin imagen plana, filtros ni degradados")
console.log("- Chibi ilustrado reservado sin recursos provisionales")
