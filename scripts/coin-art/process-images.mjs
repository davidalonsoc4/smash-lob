// Prepares the two faces of the coin toss (public/coin/smash.webp and lob.webp) from the artwork: a picture of each face on a
// black background. It finds the coin, cuts it out as a circle with transparent background and saves it light (WebP).
//   node scripts/coin-art/process-images.mjs <smash.png> <lob.png> [outputDir]     (default output: public/coin; needs sharp)
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const [smashSource, lobSource, outArg] = process.argv.slice(2)
if (!smashSource || !lobSource) {
  console.error("Usage: node scripts/coin-art/process-images.mjs <smash.png> <lob.png> [outputDir]")
  process.exit(1)
}
const outDir = path.resolve(outArg ?? "public/coin")
const SIZE = 640
/** Pixels darker than this are the black background around the coin. */
const BACKGROUND_LEVEL = 38
/** The cut goes a little inside the rim, so no dark fringe of the background stays. */
const INSET = 3

async function cutCoin(source) {
  const { data, info } = await sharp(source).removeAlpha().greyscale().raw().toBuffer({ resolveWithObject: true })
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[y * info.width + x] <= BACKGROUND_LEVEL) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  const width = maxX - minX + 1, height = maxY - minY + 1
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><ellipse cx="${width / 2}" cy="${height / 2}" rx="${width / 2 - INSET}" ry="${height / 2 - INSET}" fill="#fff"/></svg>`)
  const cropped = await sharp(source).removeAlpha().extract({ left: minX, top: minY, width, height }).png().toBuffer()
  return sharp(cropped).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toBuffer().then((png) => sharp(png)
    // The coin is almost round: this makes it exactly round.
    .resize(SIZE, SIZE, { fit: "fill" }).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toBuffer())
}

await mkdir(outDir, { recursive: true })
for (const [name, source] of [["smash", smashSource], ["lob", lobSource]]) {
  const webp = await cutCoin(source)
  await writeFile(path.join(outDir, `${name}.webp`), webp)
  console.log(name, `${(webp.length / 1024).toFixed(0)} KB`)
}
