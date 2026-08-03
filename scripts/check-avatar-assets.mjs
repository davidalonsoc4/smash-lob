import { access, readFile, readdir } from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const manifestPath = path.join(root, "public/avatars/shared/manifest.json")
const palettesPath = path.join(root, "public/avatars/shared/palettes.json")
const rendererPath = path.join(root, "src/features/avatar-lab/renderers/PixelChibiAvatarRenderer.tsx")
const renderedRoot = path.join(root, "public/avatars/pixel-chibi/rendered")
const referencePath = path.join(root, "docs/avatars/reference/pixel-chibi-canonical.png")

const manifest = JSON.parse(await readFile(manifestPath, "utf8"))
const palettes = JSON.parse(await readFile(palettesPath, "utf8"))

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function readPngMetadata(buffer, label) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  assert(buffer.length >= 33, `${label} no contiene una cabecera PNG valida`)
  assert(buffer.subarray(0, 8).equals(signature), `${label} no es un PNG valido`)
  assert(buffer.toString("ascii", 12, 16) === "IHDR", `${label} no contiene IHDR`)
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
  }
}

assert(manifest.manifestVersion === 1, "manifestVersion debe ser 1")
assert(manifest.recipeSchemaVersion === 1, "recipeSchemaVersion debe ser 1")
assert(manifest.demoVersion === "Avatar Lab DEMO 0.2", "Version experimental inesperada")
assert(manifest.masterTemplate?.viewBox?.join(" ") === "0 0 192 240", "ViewBox maestro invalido")
assert(manifest.masterTemplate?.centerAxisX === 96, "Eje central maestro invalido")
assert(manifest.masterTemplate?.groundLineY === 232, "Linea de suelo maestra invalida")

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
  assert(categories.has(category), `Falta la categoria modular ${category}`)
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
assert(palettes.lightingDirection === "top_left", "La iluminacion debe ser top_left")

const requiredRasterAssets = [
  "canonical-base.png",
  "canonical-base-left.png",
  "overlay-skin-light.png",
  "overlay-hair-black.png",
  "overlay-beard-black.png",
  "overlay-eyes-blue.png",
  "overlay-cap-black.png",
  "overlay-shirt-green.png",
  "overlay-shorts-navy.png",
  "overlay-sleeve-white.png",
  "overlay-wristband-black.png",
  "overlay-socks-black.png",
  "overlay-shoes-light-blue.png",
]

const renderedEntries = await readdir(renderedRoot)
const unexpectedRenderedEntries = renderedEntries.filter((name) => !requiredRasterAssets.includes(name))
assert(unexpectedRenderedEntries.length === 0, `Assets raster inesperados: ${unexpectedRenderedEntries.join(", ")}`)

for (const assetName of requiredRasterAssets) {
  const assetPath = path.join(renderedRoot, assetName)
  const buffer = await readFile(assetPath)
  const metadata = readPngMetadata(buffer, assetName)
  assert(metadata.width === 192 && metadata.height === 240, `${assetName} debe medir 192x240`)
  assert(metadata.bitDepth === 8, `${assetName} debe usar profundidad de 8 bits`)
  assert(metadata.colorType === 6, `${assetName} debe ser PNG RGBA con transparencia`)
  assert(buffer.length > 250, `${assetName} parece vacio o corrupto`)
}

const renderer = await readFile(rendererPath, "utf8")
assert(renderer.includes('shapeRendering="crispEdges"'), "El SVG contenedor debe usar crispEdges")
assert(renderer.includes('imageRendering: "pixelated"'), "El SVG debe declarar image-rendering pixelated")
assert(renderer.includes("<image"), "El renderer DEMO 0.2 debe componer capas raster")
assert(renderer.includes('data-avatar-layer="canonical-base"'), "El renderer debe declarar la capa canónica")
assert(renderer.includes('data-logo-orientation="unmirrored"'), "El renderer debe declarar la orientación correcta de letras y logos")
assert(!renderer.includes("docs/avatars/reference"), "La imagen de referencia documental no puede renderizarse directamente")
assert(!/https?:\/\//.test(renderer), "El renderer no puede cargar assets remotos")
assert(!/data:image\//.test(renderer), "El renderer no puede incrustar assets data URI")

for (const assetName of requiredRasterAssets) {
  const publicPath = `/avatars/pixel-chibi/rendered/${assetName}`
  assert(renderer.includes(publicPath), `El renderer no declara la capa ${publicPath}`)
}

await access(referencePath)
const illustratedEntries = await readdir(path.join(root, "public/avatars/chibi-illustrated"))
assert(illustratedEntries.every((name) => name.toLowerCase() === "readme.md"), "Chibi ilustrado no debe contener assets visuales en la DEMO")

console.log("Avatar assets correctos:")
console.log(`- ${manifest.assets.length} entradas modulares declaradas`)
console.log(`- ${requiredRasterAssets.length} capas raster PNG RGBA validadas a 192x240`)
console.log("- renderer local con crispEdges e image-rendering pixelated")
console.log("- referencia documental separada del renderer")
console.log("- Chibi ilustrado reservado sin recursos provisionales")
