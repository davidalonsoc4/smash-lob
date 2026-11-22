// Bakes the final look of the coin (aged gold with silver in the relief) from the artwork in public/coin, so nothing has to be painted
// when the coin opens:
//  - smash-3d.webp / lob-3d.webp: the picture of each face for the 3D coin (colour map).
//  - smash-maps.webp / lob-maps.webp: the relief and the finish of each face for the 3D coin, in one picture:
//      red = height (the original height map), green = roughness (the field is satin, the relief polished),
//      blue = metalness (the field is a little less metallic).
//  - smash-c.webp / lob-c.webp: flat pictures for the small coin of the panel, which is made of CSS and has no lights, so they also carry a soft
//    light from the top left taken from the height maps and a richer gold.
// The look: gold aged by 70 %, silver (a little warm) in the high parts of the relief by 95 %.
//   node scripts/coin-art/bake-look.mjs [dir]     (default: public/coin; needs sharp; the sources are smash.webp, lob.webp and the *-height.webp)
import path from "node:path"
import sharp from "sharp"

const dir = path.resolve(process.argv[2] ?? "public/coin")
const MIX = { relief: 0.95, age: 0.7 }
const FINISH = { metalField: 0.92, drop: 0.55 }
/** The CSS coin: how much the light from the top left shows, how rich the gold is and how contrasted. */
const SHADE = 2.6
const RICH = 1.45
const CONTRAST = 1.14

const smoothstep = (t) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x) }

async function read(file, size, channels) {
  const image = sharp(path.join(dir, file)).resize(size, size)
  return (channels === 1 ? image.greyscale() : image.ensureAlpha()).raw().toBuffer()
}

/** The colour of a pixel: [aged gold, warm silver, how much silver (0 to 1)]. */
function colours(picture, i, mask) {
  const R = picture[i], G = picture[i + 1], B = picture[i + 2]
  const lum = 0.2126 * R + 0.7152 * G + 0.0722 * B
  const grey = Math.min(255, lum * 1.28)
  const k = MIX.age * 0.55
  const dark = 1 - 0.18 * MIX.age
  const aged = [(R + (lum - R) * k) * dark, (G + (lum - G) * k) * dark, (B + (lum - B) * k) * dark]
  const silver = [grey, grey * 0.965, grey * 0.88]
  return [0, 1, 2].map((c) => aged[c] + (silver[c] - aged[c]) * MIX.relief * mask)
}

/**
 * The outermost pixels of the picture are the dark shading of the border of the artwork (and, in the height map, a drop to the background), so
 * they came out gold or dark: a line of another colour between the silver ring and the silver edge. Every pixel of the rim takes what the
 * ring has a little further in, along the same radius, so ring and edge look like one piece.
 */
const RIM_FROM = 0.972
const RIM_TAKES = 0.958
function onRim(x, y, size) {
  const c = (size - 1) / 2
  const dx = x - c, dy = y - c
  const radius = Math.hypot(dx, dy) / c
  if (radius <= RIM_FROM) return [x, y]
  const k = RIM_TAKES / radius
  return [Math.round(c + dx * k), Math.round(c + dy * k)]
}

async function save(buffer, size, file, options = {}) {
  await sharp(buffer, { raw: { width: size, height: size, channels: 4 } }).webp({ quality: 86, alphaQuality: 90, ...options }).toFile(path.join(dir, file))
  console.log(file)
}

async function bake(name) {
  // 1. The 3D coin: the picture and the maps.
  const SIZE = 1024
  const picture = await read(`${name}.webp`, SIZE, 4)
  const height = await read(`${name}-height.webp`, SIZE, 1)
  const color = Buffer.from(picture)
  const maps = Buffer.alloc(SIZE * SIZE * 4, 255)
  for (let p = 0; p < SIZE * SIZE; p++) {
    const i = p * 4
    const [sx, sy] = onRim(p % SIZE, Math.floor(p / SIZE), SIZE)
    const q = sy * SIZE + sx
    const h = height[q] / 255
    const mask = smoothstep((h - 0.45) / 0.3)
    const mixed = colours(picture, q * 4, mask)
    for (let c = 0; c < 3; c++) color[i + c] = Math.max(0, Math.min(255, mixed[c]))
    maps[i] = height[p]
    maps[i + 1] = Math.round(255 * (1 - FINISH.drop * mask))
    maps[i + 2] = Math.round(255 * (FINISH.metalField + (1 - FINISH.metalField) * mask))
  }
  await save(color, SIZE, `${name}-3d.webp`)
  await save(maps, SIZE, `${name}-maps.webp`, { quality: 92, alphaQuality: 100, smartSubsample: false })

  // 2. The small coin of the panel (CSS, no lights): smaller, with the light and the richer gold baked in.
  const SMALL = 640
  const small = await read(`${name}.webp`, SMALL, 4)
  const smallHeight = await read(`${name}-height.webp`, SMALL, 1)
  const h = (x, y) => smallHeight[Math.min(SMALL - 1, Math.max(0, y)) * SMALL + Math.min(SMALL - 1, Math.max(0, x))] / 255
  const flat = Buffer.from(small)
  for (let y = 0; y < SMALL; y++) {
    for (let x = 0; x < SMALL; x++) {
      const i = (y * SMALL + x) * 4
      const [sx, sy] = onRim(x, y, SMALL)
      const mask = smoothstep((h(sx, sy) - 0.45) / 0.3)
      const mixed = colours(small, (sy * SMALL + sx) * 4, mask)
      const mixedLum = 0.2126 * mixed[0] + 0.7152 * mixed[1] + 0.0722 * mixed[2]
      const light = 1 + SHADE * ((h(x - 1, y) - h(x + 1, y)) + (h(x, y - 1) - h(x, y + 1))) * 0.5
      for (let c = 0; c < 3; c++) {
        // The gold (the field) gets richer; the silver of the relief stays as it is.
        const rich = mixedLum + (mixed[c] - mixedLum) * (1 + (RICH - 1) * (1 - mask))
        flat[i + c] = Math.max(0, Math.min(255, 128 + (rich * light - 128) * CONTRAST))
      }
    }
  }
  await save(flat, SMALL, `${name}-c.webp`, { quality: 84 })
}

await bake("smash")
await bake("lob")
