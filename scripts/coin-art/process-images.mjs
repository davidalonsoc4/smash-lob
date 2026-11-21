// Prepares the artwork of the coin toss (public/coin/): from a picture of each face on a black background it finds the coin and
// cuts it out as a circle with transparent background (smash.webp, lob.webp). From the grayscale height map of each face (white
// is the highest part of the relief) it makes the maps the 3D coin uses to light the relief (smash-height.webp, lob-height.webp).
//   node scripts/coin-art/process-images.mjs <smash.png> <lob.png> <smash-height.png> <lob-height.png> [outputDir]
//   (default output: public/coin; needs sharp)
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const [smashSource, lobSource, smashHeight, lobHeight, outArg] = process.argv.slice(2)
if (!smashSource || !lobSource || !smashHeight || !lobHeight) {
  console.error("Usage: node scripts/coin-art/process-images.mjs <smash.png> <lob.png> <smash-height.png> <lob-height.png> [outputDir]")
  process.exit(1)
}
const outDir = path.resolve(outArg ?? "public/coin")
const SIZE = 640
/** Pixels darker than this are the black background around the coin. */
const BACKGROUND_LEVEL = 38
/** In the height maps the field of the coin is a mid gray and only the outside is black. */
const HEIGHT_BACKGROUND_LEVEL = 14
/** The cut goes a little inside the rim, so no dark fringe of the background stays. */
const INSET = 3

async function findCoin(source, level) {
  const { data, info } = await sharp(source).removeAlpha().greyscale().raw().toBuffer({ resolveWithObject: true })
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[y * info.width + x] <= level) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

const circleMask = (width, height) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><ellipse cx="${width / 2}" cy="${height / 2}" rx="${width / 2 - INSET}" ry="${height / 2 - INSET}" fill="#fff"/></svg>`)

/** The picture of a face: the coin as a circle with transparent background. */
async function cutCoin(source) {
  const area = await findCoin(source, BACKGROUND_LEVEL)
  const cropped = await sharp(source).removeAlpha().extract(area).png().toBuffer()
  const cut = await sharp(cropped).ensureAlpha().composite([{ input: circleMask(area.width, area.height), blend: "dest-in" }]).png().toBuffer()
  // The coin is almost round: this makes it exactly round.
  return sharp(cut).resize(SIZE, SIZE, { fit: "fill" }).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toBuffer()
}

/** The height map of a face, in the same frame as its picture so both match on the coin. */
async function cutHeight(source) {
  const area = await findCoin(source, HEIGHT_BACKGROUND_LEVEL)
  return sharp(source).removeAlpha().greyscale().extract(area).resize(SIZE, SIZE, { fit: "fill" }).webp({ quality: 90, effort: 6 }).toBuffer()
}

await mkdir(outDir, { recursive: true })
for (const [name, source, height] of [["smash", smashSource, smashHeight], ["lob", lobSource, lobHeight]]) {
  const picture = await cutCoin(source)
  const relief = await cutHeight(height)
  await writeFile(path.join(outDir, `${name}.webp`), picture)
  await writeFile(path.join(outDir, `${name}-height.webp`), relief)
  console.log(name, `${(picture.length / 1024).toFixed(0)} KB`, `height ${(relief.length / 1024).toFixed(0)} KB`)
}
