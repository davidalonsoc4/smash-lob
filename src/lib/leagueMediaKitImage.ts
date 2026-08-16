import { normalizeImageUrl } from "@/lib/imageUrl"

export type LeagueMediaKitKind = "rules" | "registration" | "calendar" | "start" | "countdown"

export type LeagueMediaKitImageData = {
  kind: LeagueMediaKitKind
  leagueName: string
  seasonName: string
  leagueLogoUrl?: string | null
  eyebrow: string
  title: string
  subtitle?: string | null
  heroValue?: string | null
  heroLabel?: string | null
  rows: Array<{ label: string; value: string }>
  bullets?: string[]
}

const WIDTH = 1080
const HEIGHT = 1350
const PADDING = 58

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function fillRound(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: string) {
  ctx.save(); roundedRect(ctx, x, y, width, height, radius); ctx.fillStyle = fill; ctx.fill(); ctx.restore()
}

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, weight = 700, color = "#152019", align: CanvasTextAlign = "left") {
  ctx.save(); ctx.font = `${weight} ${size}px Arial, sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "alphabetic"; ctx.fillText(value, x, y); ctx.restore()
}

function wrap(ctx: CanvasRenderingContext2D, value: string, maxWidth: number, size: number, weight = 700) {
  ctx.save(); ctx.font = `${weight} ${size}px Arial, sans-serif`
  const words = value.trim().split(/\s+/); const lines: string[] = []; let current = ""
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (current && ctx.measureText(next).width > maxWidth) { lines.push(current); current = word } else current = next
  }
  if (current) lines.push(current); ctx.restore(); return lines
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image(); image.crossOrigin = "anonymous"; image.onload = () => resolve(image); image.onerror = () => reject(new Error("image_load_failed")); image.src = src
  })
}

async function safeImage(value: string | null | undefined) {
  const normalized = normalizeImageUrl(value)
  if (!normalized) return null
  try { return await loadImage(normalized) } catch { return null }
}

export async function createLeagueMediaKitImage(data: LeagueMediaKitImageData) {
  const canvas = document.createElement("canvas")
  canvas.width = WIDTH; canvas.height = HEIGHT
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("canvas_unavailable")

  ctx.fillStyle = "#f3f4f1"; ctx.fillRect(0, 0, WIDTH, HEIGHT)
  fillRound(ctx, PADDING, 46, WIDTH - PADDING * 2, 330, 34, "#151c17")

  const logo = await safeImage(data.leagueLogoUrl)
  if (logo) {
    ctx.save(); roundedRect(ctx, PADDING + 30, 78, 88, 88, 24); ctx.clip(); ctx.drawImage(logo, PADDING + 30, 78, 88, 88); ctx.restore()
  } else {
    fillRound(ctx, PADDING + 30, 78, 88, 88, 24, "#ffffff")
    text(ctx, data.leagueName.slice(0, 2).toUpperCase(), PADDING + 74, 135, 26, 900, "#151c17", "center")
  }
  text(ctx, data.leagueName, PADDING + 138, 112, 27, 900, "#ffffff")
  text(ctx, data.seasonName, PADDING + 138, 148, 21, 700, "#bfc8c1")
  text(ctx, data.eyebrow.toUpperCase(), PADDING + 30, 220, 19, 900, "#aeb9b1")
  const titleLines = wrap(ctx, data.title, WIDTH - PADDING * 2 - 60, 52, 900).slice(0, 2)
  titleLines.forEach((line, index) => text(ctx, line, PADDING + 30, 280 + index * 58, 52, 900, "#ffffff"))

  let y = 410
  if (data.subtitle) {
    const lines = wrap(ctx, data.subtitle, WIDTH - PADDING * 2 - 40, 24, 700).slice(0, 3)
    lines.forEach((line, index) => text(ctx, line, PADDING + 8, y + index * 33, 24, 700, "#626b64"))
    y += lines.length * 33 + 24
  }

  if (data.heroValue) {
    fillRound(ctx, PADDING, y, WIDTH - PADDING * 2, 150, 28, "#ffffff")
    text(ctx, data.heroLabel ?? "", PADDING + 30, y + 44, 18, 900, "#737b75")
    text(ctx, data.heroValue, PADDING + 30, y + 108, 46, 900, "#152019")
    y += 174
  }

  for (const row of data.rows.slice(0, 6)) {
    fillRound(ctx, PADDING, y, WIDTH - PADDING * 2, 86, 22, "#ffffff")
    text(ctx, row.label.toUpperCase(), PADDING + 26, y + 36, 16, 900, "#7a827c")
    text(ctx, row.value, WIDTH - PADDING - 26, y + 55, 27, 900, "#152019", "right")
    y += 98
  }

  if (data.bullets?.length && y < 1180) {
    const bullets = data.bullets.slice(0, 4)
    fillRound(ctx, PADDING, y, WIDTH - PADDING * 2, Math.min(220, 54 + bullets.length * 42), 24, "#e7ece7")
    bullets.forEach((bullet, index) => {
      text(ctx, "•", PADDING + 24, y + 38 + index * 42, 24, 900, "#152019")
      const line = wrap(ctx, bullet, WIDTH - PADDING * 2 - 80, 20, 700)[0] ?? bullet
      text(ctx, line, PADDING + 52, y + 37 + index * 42, 20, 700, "#374139")
    })
  }

  ctx.fillStyle = "#d8ded8"; ctx.fillRect(PADDING, HEIGHT - 92, WIDTH - PADDING * 2, 2)
  text(ctx, "Creado con Smash & Lob", PADDING, HEIGHT - 48, 19, 900, "#606961")
  text(ctx, "smashandlob.com", WIDTH - PADDING, HEIGHT - 48, 18, 700, "#7a827c", "right")

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("png_export_failed")), "image/png")
  })
}

export function downloadLeagueMediaKitImage(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 500)
}
