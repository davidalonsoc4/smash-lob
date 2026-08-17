import { normalizeImageUrl } from "@/lib/imageUrl"

export type LeagueMediaKitKind = "opening" | "rules" | "registration" | "calendar" | "start" | "countdown"
export type LeagueMediaKitTemplate = "opening_day_premium_01"
export type LeagueMediaKitHeadlineFont = "impact" | "condensed" | "editorial" | "athletic"

export type LeagueMediaKitImageData = {
  kind: LeagueMediaKitKind
  template?: LeagueMediaKitTemplate
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
  accentColor?: string | null
  eventDateLabel?: string | null
  eventTimeLabel?: string | null
  venue?: string | null
  roundLabel?: string | null
  headlineFont?: LeagueMediaKitHeadlineFont
}

const WIDTH = 1080
const HEIGHT = 1350
const PADDING = 58
const DEFAULT_ACCENT = "#d7a544"
const APP_ICON_PATH = "/icon-192.png"
const OPENING_BASE_ASSET = "/media-kit/opening-day-premium-01-base.webp"
const OPENING_ACCENT_MASK_ASSET = "/media-kit/opening-day-premium-01-accent.png"

const HEADLINE_FONT_PROFILES: Record<LeagueMediaKitHeadlineFont, { family: string; widthScale: number; sizeScale: number; slant: number; strokeScale: number }> = {
  impact: { family: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif', widthScale: 1, sizeScale: 1, slant: 0, strokeScale: 1 },
  condensed: { family: '"Arial Narrow", "Roboto Condensed", Arial, sans-serif', widthScale: 0.78, sizeScale: 1.08, slant: 0, strokeScale: 0.9 },
  editorial: { family: 'Georgia, "Times New Roman", serif', widthScale: 0.92, sizeScale: 0.84, slant: 0, strokeScale: 0.75 },
  athletic: { family: '"Arial Black", Arial, sans-serif', widthScale: 0.9, sizeScale: 0.9, slant: -0.08, strokeScale: 1.25 },
}

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
  const raw = value?.trim()
  const normalized = raw && /^(data:|blob:)/i.test(raw) ? raw : normalizeImageUrl(raw)
  if (!normalized) return null
  try { return await loadImage(normalized) } catch { return null }
}

function normalizeAccent(value: string | null | undefined) {
  return /^#[0-9a-f]{6}$/i.test(value ?? "") ? value! : DEFAULT_ACCENT
}

function hexRgb(value: string) {
  const clean = normalizeAccent(value).slice(1)
  return { r: Number.parseInt(clean.slice(0, 2), 16), g: Number.parseInt(clean.slice(2, 4), 16), b: Number.parseInt(clean.slice(4, 6), 16) }
}

function rgba(value: string, alpha: number) {
  const { r, g, b } = hexRgb(value)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function mix(value: string, target: number, amount: number) {
  const { r, g, b } = hexRgb(value)
  const channel = (source: number) => Math.round(source + (target - source) * amount).toString(16).padStart(2, "0")
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

function drawImageCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement | HTMLCanvasElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.width, height / image.height)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  ctx.drawImage(image, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2, sourceWidth, sourceHeight, x, y, width, height)
}

function drawImageContain(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.min(width / image.width, height / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight)
}

function tintMask(mask: HTMLImageElement, accent: string) {
  const canvas = document.createElement("canvas")
  canvas.width = mask.naturalWidth || mask.width
  canvas.height = mask.naturalHeight || mask.height
  const ctx = canvas.getContext("2d")
  if (!ctx) return canvas
  ctx.drawImage(mask, 0, 0, canvas.width, canvas.height)
  ctx.globalCompositeOperation = "source-in"
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  return canvas
}

function trackedText(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, options: { size: number; weight?: number; color: string | CanvasGradient; spacing?: number; align?: "left" | "center" | "right"; font?: string }) {
  const { size, color, spacing = 0, weight = 800, align = "left", font = "Arial, sans-serif" } = options
  ctx.save()
  ctx.font = `${weight} ${size}px ${font}`
  ctx.textBaseline = "middle"
  ctx.fillStyle = color
  const widths = [...value].map((character) => ctx.measureText(character).width)
  const totalWidth = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, value.length - 1) * spacing
  let cursor = align === "center" ? x - totalWidth / 2 : align === "right" ? x - totalWidth : x
  ;[...value].forEach((character, index) => { ctx.fillText(character, cursor, y); cursor += widths[index] + spacing })
  ctx.restore()
}

function posterGradient(ctx: CanvasRenderingContext2D, accent: string, y: number, height: number) {
  const gradient = ctx.createLinearGradient(0, y, 0, y + height)
  gradient.addColorStop(0, mix(accent, 255, 0.72))
  gradient.addColorStop(0.2, mix(accent, 255, 0.35))
  gradient.addColorStop(0.5, accent)
  gradient.addColorStop(0.78, mix(accent, 0, 0.25))
  gradient.addColorStop(1, mix(accent, 255, 0.18))
  return gradient
}

function metallicPosterText(ctx: CanvasRenderingContext2D, value: string, centerX: number, y: number, maxWidth: number, size: number, accent: string, headlineFont: LeagueMediaKitHeadlineFont) {
  const profile = HEADLINE_FONT_PROFILES[headlineFont]
  const fontSize = Math.round(size * profile.sizeScale)
  ctx.save()
  ctx.font = `900 ${fontSize}px ${profile.family}`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  const measured = Math.max(1, ctx.measureText(value).width)
  const scaleX = Math.min(profile.widthScale, maxWidth / measured)
  ctx.translate(centerX, y)
  if (profile.slant) ctx.transform(1, 0, profile.slant, 1, 0, 0)
  ctx.scale(scaleX, 1)
  ctx.shadowColor = "rgba(0,0,0,.92)"
  ctx.shadowBlur = 15
  ctx.shadowOffsetY = 9
  ctx.lineWidth = (2 * profile.strokeScale) / scaleX
  ctx.strokeStyle = mix(accent, 0, 0.46)
  ctx.strokeText(value, 0, 0)
  ctx.fillStyle = posterGradient(ctx, accent, -size / 2, size)
  ctx.fillText(value, 0, 0)
  ctx.globalAlpha = 0.2
  ctx.fillStyle = "#ffffff"
  ctx.fillText(value, 0, -2)
  ctx.restore()
}

function drawAppBrandFooter(ctx: CanvasRenderingContext2D, appIcon: HTMLImageElement | null, accent: string) {
  const iconSize = 48
  const textWidth = 176
  const gap = 15
  const groupWidth = iconSize + gap + textWidth
  const groupX = (WIDTH - groupWidth) / 2
  const groupY = 1263

  if (appIcon) {
    ctx.save(); roundedRect(ctx, groupX, groupY, iconSize, iconSize, 12); ctx.clip(); ctx.drawImage(appIcon, groupX, groupY, iconSize, iconSize); ctx.restore()
  } else {
    fillRound(ctx, groupX, groupY, iconSize, iconSize, 12, "#f5f2ea")
    trackedText(ctx, "S&L", groupX + iconSize / 2, groupY + iconSize / 2 + 1, { size: 13, weight: 900, color: "#111311", align: "center" })
  }

  trackedText(ctx, "CREADO CON", groupX + iconSize + gap, groupY + 13, { size: 12, weight: 800, color: rgba(accent, 0.82), spacing: 2, font: '"Arial Narrow", Arial, sans-serif' })
  trackedText(ctx, "SMASH & LOB", groupX + iconSize + gap, groupY + 37, { size: 20, weight: 900, color: "#f4f1ea", spacing: 2, font: '"Arial Narrow", Arial, sans-serif' })
}

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, fill: string) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = fill; ctx.fillRect(-size / 2, -size / 2, size, size); ctx.restore()
}

function drawPremiumFrame(ctx: CanvasRenderingContext2D, accent: string) {
  ctx.save()
  ctx.strokeStyle = rgba(accent, 0.48)
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(32, 260); ctx.lineTo(32, 72); ctx.lineTo(210, 72); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(WIDTH - 32, 260); ctx.lineTo(WIDTH - 32, 72); ctx.lineTo(WIDTH - 210, 72); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(32, HEIGHT - 260); ctx.lineTo(32, HEIGHT - 72); ctx.lineTo(210, HEIGHT - 72); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(WIDTH - 32, HEIGHT - 260); ctx.lineTo(WIDTH - 32, HEIGHT - 72); ctx.lineTo(WIDTH - 210, HEIGHT - 72); ctx.stroke()
  ctx.restore()
}

async function drawOpeningDayBackground(ctx: CanvasRenderingContext2D, accent: string) {
  const [base, mask] = await Promise.all([loadImage(OPENING_BASE_ASSET), loadImage(OPENING_ACCENT_MASK_ASSET)])
  drawImageCover(ctx, base, 0, 0, WIDTH, HEIGHT)
  ctx.save()
  ctx.globalCompositeOperation="screen"
  ctx.globalAlpha = 0.7
  drawImageCover(ctx, tintMask(mask, accent), 0, 0, WIDTH, HEIGHT)
  ctx.restore()

  const topShade = ctx.createLinearGradient(0, 0, 0, HEIGHT)
  topShade.addColorStop(0, "rgba(0,0,0,.2)")
  topShade.addColorStop(0.42, "rgba(0,0,0,.05)")
  topShade.addColorStop(0.76, "rgba(0,0,0,.15)")
  topShade.addColorStop(1, "rgba(0,0,0,.72)")
  ctx.fillStyle = topShade; ctx.fillRect(0, 0, WIDTH, HEIGHT)
  const focus = ctx.createRadialGradient(WIDTH / 2, 600, 80, WIDTH / 2, 600, 570)
  focus.addColorStop(0, rgba(accent, 0.12)); focus.addColorStop(0.45, "rgba(0,0,0,.04)"); focus.addColorStop(1, "rgba(0,0,0,.6)")
  ctx.fillStyle = focus; ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.save()
  ctx.strokeStyle = rgba(accent, 0.2); ctx.lineWidth = 2
  for (let index = 0; index < 6; index += 1) {
    const offset = index * 42
    ctx.beginPath(); ctx.moveTo(-40, 80 + offset); ctx.lineTo(250 + offset, 0); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(WIDTH + 40, 180 + offset); ctx.lineTo(WIDTH - 240 + offset * 0.25, 0); ctx.stroke()
  }
  for (let index = 0; index < 70; index += 1) {
    const x = (index * 137) % WIDTH
    const y = 90 + ((index * 83) % 1050)
    const radius = index % 9 === 0 ? 2.4 : 1.1
    ctx.globalAlpha = 0.12 + (index % 5) * 0.06
    ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
  drawPremiumFrame(ctx, accent)
}

function openingHeadlineLines(value: string) {
  const words = value.trim().toLocaleUpperCase("es-ES").split(/\s+/).filter(Boolean)
  if (words.length <= 2) return [words.join(" ")]
  const preferredBreak = words.findIndex((word, index) => index > 0 && ["DE", "DEL", "LA", "EL"].includes(word))
  const breakAt = preferredBreak > 0 ? preferredBreak : Math.ceil(words.length / 2)
  return [words.slice(0, breakAt).join(" "), words.slice(breakAt).join(" ")]
}

async function drawOpeningDayPoster(ctx: CanvasRenderingContext2D, data: LeagueMediaKitImageData) {
  const accent = normalizeAccent(data.accentColor)
  await drawOpeningDayBackground(ctx,accent)
  const [logo, appIcon] = await Promise.all([safeImage(data.leagueLogoUrl), safeImage(APP_ICON_PATH)])
  const headlineFont = data.headlineFont ?? "impact"

  if (logo) {
    ctx.save(); ctx.shadowColor = rgba(accent, 0.42); ctx.shadowBlur = 24
    drawImageContain(ctx, logo, WIDTH / 2 - 74, 70, 148, 96)
    ctx.restore()
  } else {
    ctx.save(); ctx.strokeStyle = mix(accent, 255, 0.36); ctx.lineWidth = 7
    ctx.beginPath(); ctx.arc(WIDTH / 2 + 26, 110, 31, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(WIDTH / 2 + 11, 82); ctx.quadraticCurveTo(WIDTH / 2 - 3, 110, WIDTH / 2 + 9, 140); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(WIDTH / 2 - 90, 132); ctx.lineTo(WIDTH / 2 - 4, 103); ctx.moveTo(WIDTH / 2 - 73, 147); ctx.lineTo(WIDTH / 2 + 3, 122); ctx.stroke()
    ctx.restore()
  }

  trackedText(ctx, data.leagueName.toLocaleUpperCase("es-ES"), WIDTH / 2, 202, { size: 28, weight: 800, color: mix(accent, 255, 0.3), spacing: 10, align: "center", font: '"Arial Narrow", Arial, sans-serif' })
  ctx.save(); ctx.strokeStyle = rgba(accent, 0.65); ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(250, 286); ctx.lineTo(370, 286); ctx.moveTo(710, 286); ctx.lineTo(830, 286); ctx.stroke(); ctx.restore()
  trackedText(ctx, data.seasonName.toLocaleUpperCase("es-ES"), WIDTH / 2, 286, { size: 25, weight: 700, color: "#f2eee5", spacing: 8, align: "center", font: '"Arial Narrow", Arial, sans-serif' })

  const headline = openingHeadlineLines(data.title)
  const firstY = headline.length === 1 ? 520 : 445
  headline.slice(0, 2).forEach((line, index) => metallicPosterText(ctx, line, WIDTH / 2, firstY + index * 170, 900, index === 0 ? 184 : 168, accent, headlineFont))
  if (data.subtitle) trackedText(ctx, data.subtitle.toLocaleUpperCase("es-ES"), WIDTH / 2, headline.length === 1 ? 650 : 675, { size: 20, weight: 700, color: "rgba(255,255,255,.82)", spacing: 5, align: "center", font: '"Arial Narrow", Arial, sans-serif' })

  const dateTop = 735
  ctx.save()
  ctx.fillStyle = "rgba(4,5,5,.76)"; ctx.strokeStyle = rgba(accent, 0.78); ctx.lineWidth = 2
  roundedRect(ctx, 128, dateTop, 824, 154, 12); ctx.fill(); ctx.stroke()
  const glow = ctx.createLinearGradient(150, 0, 930, 0); glow.addColorStop(0, "rgba(0,0,0,0)"); glow.addColorStop(0.5, rgba(accent, 0.8)); glow.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = glow; ctx.fillRect(180, dateTop - 2, 720, 3); ctx.restore()
  drawDiamond(ctx, WIDTH / 2, dateTop - 1, 14, mix(accent, 255, 0.25))
  trackedText(ctx, (data.eventDateLabel || "FECHA POR CONFIRMAR").toLocaleUpperCase("es-ES"), WIDTH / 2, dateTop + 82, { size: 58, weight: 900, color: "#f4f2ee", spacing: 3, align: "center", font: 'Impact, "Arial Narrow Bold", sans-serif' })

  const metaTop = 910
  ctx.save(); ctx.fillStyle = "rgba(5,6,6,.84)"; ctx.strokeStyle = rgba(accent, 0.36); ctx.lineWidth = 1.5; roundedRect(ctx, 110, metaTop, 860, 112, 8); ctx.fill(); ctx.stroke(); ctx.restore()
  const meta = [data.roundLabel || "JORNADA 1", data.eventTimeLabel || "HORA"]
  const centers = [270, 540]
  meta.forEach((value, index) => trackedText(ctx, value.toLocaleUpperCase("es-ES"), centers[index], metaTop + 58, { size: index === 1 ? 34 : 26, weight: 800, color: index === 1 ? mix(accent, 255, 0.2) : "#eeeae3", spacing: index === 1 ? 4 : 3, align: "center", font: '"Arial Narrow", Arial, sans-serif' }))
  const venueLines = wrap(ctx, data.venue || "LUGAR", 230, 26, 800).slice(0, 2)
  venueLines.forEach((line, index) => trackedText(ctx, line.toLocaleUpperCase("es-ES"), 810, metaTop + 58 + (index - (venueLines.length - 1) / 2) * 29, { size: venueLines.length > 1 ? 21 : 26, weight: 800, color: "#eeeae3", spacing: 2, align: "center", font: '"Arial Narrow", Arial, sans-serif' }))
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(402, metaTop + 56, 6, 0, Math.PI * 2); ctx.arc(678, metaTop + 56, 6, 0, Math.PI * 2); ctx.fill()

  ctx.save()
  const floorGlow = ctx.createLinearGradient(0, 1080, 0, 1260); floorGlow.addColorStop(0, "rgba(0,0,0,0)"); floorGlow.addColorStop(1, rgba(accent, 0.1)); ctx.fillStyle = floorGlow; ctx.fillRect(0, 1050, WIDTH, 210)
  ctx.strokeStyle = rgba(accent, 0.45); ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(WIDTH / 2, 1040); ctx.lineTo(WIDTH / 2, 1275); ctx.moveTo(160, 1235); ctx.lineTo(920, 1235); ctx.stroke(); ctx.restore()

  ctx.save(); ctx.fillStyle = "rgba(5,6,6,.82)"; ctx.strokeStyle = rgba(accent, 0.48); ctx.lineWidth = 2
  roundedRect(ctx, 315, 1248, 450, 82, 14); ctx.fill(); ctx.stroke(); ctx.restore()
  drawAppBrandFooter(ctx, appIcon, accent)
}

async function drawClassicMediaKit(ctx: CanvasRenderingContext2D, data: LeagueMediaKitImageData) {
  ctx.fillStyle = "#f3f4f1"; ctx.fillRect(0, 0, WIDTH, HEIGHT)
  fillRound(ctx, PADDING, 46, WIDTH - PADDING * 2, 330, 34, "#151c17")
  const logo = await safeImage(data.leagueLogoUrl)
  if (logo) { ctx.save(); roundedRect(ctx, PADDING + 30, 78, 88, 88, 24); ctx.clip(); ctx.drawImage(logo, PADDING + 30, 78, 88, 88); ctx.restore() }
  else { fillRound(ctx, PADDING + 30, 78, 88, 88, 24, "#ffffff"); text(ctx, data.leagueName.slice(0, 2).toUpperCase(), PADDING + 74, 135, 26, 900, "#151c17", "center") }
  text(ctx, data.leagueName, PADDING + 138, 112, 27, 900, "#ffffff")
  text(ctx, data.seasonName, PADDING + 138, 148, 21, 700, "#bfc8c1")
  text(ctx, data.eyebrow.toUpperCase(), PADDING + 30, 220, 19, 900, "#aeb9b1")
  const titleLines = wrap(ctx, data.title, WIDTH - PADDING * 2 - 60, 52, 900).slice(0, 2)
  titleLines.forEach((line, index) => text(ctx, line, PADDING + 30, 280 + index * 58, 52, 900, "#ffffff"))
  let y = 410
  if (data.subtitle) { const lines = wrap(ctx, data.subtitle, WIDTH - PADDING * 2 - 40, 24, 700).slice(0, 3); lines.forEach((line, index) => text(ctx, line, PADDING + 8, y + index * 33, 24, 700, "#626b64")); y += lines.length * 33 + 24 }
  if (data.heroValue) { fillRound(ctx, PADDING, y, WIDTH - PADDING * 2, 150, 28, "#ffffff"); text(ctx, data.heroLabel ?? "", PADDING + 30, y + 44, 18, 900, "#737b75"); text(ctx, data.heroValue, PADDING + 30, y + 108, 46, 900, "#152019"); y += 174 }
  for (const row of data.rows.slice(0, 6)) { fillRound(ctx, PADDING, y, WIDTH - PADDING * 2, 86, 22, "#ffffff"); text(ctx, row.label.toUpperCase(), PADDING + 26, y + 36, 16, 900, "#7a827c"); text(ctx, row.value, WIDTH - PADDING - 26, y + 55, 27, 900, "#152019", "right"); y += 98 }
  if (data.bullets?.length && y < 1180) {
    const bullets = data.bullets.slice(0, 4); fillRound(ctx, PADDING, y, WIDTH - PADDING * 2, Math.min(220, 54 + bullets.length * 42), 24, "#e7ece7")
    bullets.forEach((bullet, index) => { text(ctx, "•", PADDING + 24, y + 38 + index * 42, 24, 900, "#152019"); const line = wrap(ctx, bullet, WIDTH - PADDING * 2 - 80, 20, 700)[0] ?? bullet; text(ctx, line, PADDING + 52, y + 37 + index * 42, 20, 700, "#374139") })
  }
  ctx.fillStyle = "#d8ded8"; ctx.fillRect(PADDING, HEIGHT - 92, WIDTH - PADDING * 2, 2)
  text(ctx, "Creado con Smash & Lob", PADDING, HEIGHT - 48, 19, 900, "#606961")
  text(ctx, "smashandlob.com", WIDTH - PADDING, HEIGHT - 48, 18, 700, "#7a827c", "right")
}

export async function createLeagueMediaKitImage(data: LeagueMediaKitImageData) {
  const canvas = document.createElement("canvas")
  canvas.width = WIDTH; canvas.height = HEIGHT
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("canvas_unavailable")
  if (data.template === "opening_day_premium_01") await drawOpeningDayPoster(ctx, data)
  else await drawClassicMediaKit(ctx, data)
  return new Promise<Blob>((resolve, reject) => { canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("png_export_failed")), "image/png") })
}

export function downloadLeagueMediaKitImage(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 500)
}
