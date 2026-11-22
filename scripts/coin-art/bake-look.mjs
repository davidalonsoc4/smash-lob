// Bakes the final look of the coin (aged gold with silver in the relief) into flat pictures for the small coin of the panel, which is made
// of CSS and has no lights: public/coin/smash-c.webp and lob-c.webp. It paints the pictures the same way the 3D coin does (see
// paintLive in src/lib/coin3d.ts, with field 0, relief 0.95, age 0.7) and adds a soft light from the top left taken from the height maps,
// so the relief still reads without lighting.
//   node scripts/coin-art/bake-look.mjs [dir]     (default: public/coin; needs sharp)
import path from "node:path"
import sharp from "sharp"

const dir = path.resolve(process.argv[2] ?? "public/coin")
const SIZE = 640
const MIX = { relief: 0.95, age: 0.7 }
/** How much the light from the top left shows in the relief. */
const SHADE = 2.2

const smoothstep = (t) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x) }

async function bake(name) {
  const picture = await sharp(path.join(dir, `${name}.webp`)).resize(SIZE, SIZE).ensureAlpha().raw().toBuffer()
  const height = await sharp(path.join(dir, `${name}-height.webp`)).resize(SIZE, SIZE).greyscale().raw().toBuffer()
  const out = Buffer.from(picture)
  const k = MIX.age * 0.55
  const dark = 1 - 0.18 * MIX.age
  const h = (x, y) => height[Math.min(SIZE - 1, Math.max(0, y)) * SIZE + Math.min(SIZE - 1, Math.max(0, x))] / 255
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4
      const R = picture[i], G = picture[i + 1], B = picture[i + 2]
      const lum = 0.2126 * R + 0.7152 * G + 0.0722 * B
      const grey = Math.min(255, lum * 1.28)
      const aged = [(R + (lum - R) * k) * dark, (G + (lum - G) * k) * dark, (B + (lum - B) * k) * dark]
      const mask = smoothstep((h(x, y) - 0.45) / 0.3)
      const silver = [grey, grey * 0.965, grey * 0.88]
      // The light: the relief that faces the top left is lighter and the one that faces away is darker.
      const light = 1 + SHADE * ((h(x - 1, y) - h(x + 1, y)) + (h(x, y - 1) - h(x, y + 1))) * 0.5
      for (let c = 0; c < 3; c++) {
        const colour = aged[c] + (silver[c] - aged[c]) * MIX.relief * mask
        out[i + c] = Math.max(0, Math.min(255, colour * light))
      }
    }
  }
  await sharp(out, { raw: { width: SIZE, height: SIZE, channels: 4 } }).webp({ quality: 84, alphaQuality: 90 }).toFile(path.join(dir, `${name}-c.webp`))
  console.log(`${name}-c.webp`)
}

await bake("smash")
await bake("lob")
