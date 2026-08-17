import { normalizeImageUrl } from "@/lib/imageUrl"
import { mediaKitIconDataUrl } from "@/lib/mediaKitIcons"

export type LeagueMediaKitKind =
  | "opening"
  | "matchday"
  | "format"
  | "rules"
  | "gameplay"
  | "registration"
  | "calendar"
  | "start"
  | "countdown"
  | "results"
  | "standings"
  | "mvp"
  | "next_round"
  | "season_final"
export type LeagueMediaKitTemplate =
  | "opening_day_premium_01"
  | "informational_premium_02"
  | "matchday_premium_03"
  | "scoreboard_premium_04"
  | "spotlight_premium_05"
  | "results_premium_06"
export type LeagueMediaKitHeadlineFont =
  | "impact"
  | "condensed"
  | "editorial"
  | "athletic"
  | "monumental"
  | "geometric"
  | "didone"
  | "technical"

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
  rows: Array<{ label: string; value: string; icon?: string | null }>
  bullets?: string[]
  accentColor?: string | null
  eventDateLabel?: string | null
  eventTimeLabel?: string | null
  venue?: string | null
  roundLabel?: string | null
  headlineFont?: LeagueMediaKitHeadlineFont
  matchup?: { teamA: [string, string]; teamB: [string, string] } | null
  spotlightImageUrl?: string | null
  resultRound?: number | null
  results?: Array<{
    teamA: [string, string]
    teamB: [string, string]
    pointsA: number
    pointsB: number
    sets: Array<{ a: number; b: number }>
  }>
}

const WIDTH = 1080
const HEIGHT = 1350
const PADDING = 58
const DEFAULT_ACCENT = "#d7a544"
const APP_ICON_PATH = "/icon-192.png"
const OPENING_BASE_ASSET = "/media-kit/opening-day-premium-01-base-v2.webp"
const OPENING_ACCENT_MASK_ASSET = "/media-kit/opening-day-premium-01-accent-v2.png"

const HEADLINE_FONT_PROFILES: Record<LeagueMediaKitHeadlineFont, { family: string; widthScale: number; sizeScale: number; slant: number; strokeScale: number }> = {
  impact: { family: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif', widthScale: 1, sizeScale: 1, slant: 0, strokeScale: 1 },
  condensed: { family: '"Arial Narrow", "Roboto Condensed", Arial, sans-serif', widthScale: 0.78, sizeScale: 1.08, slant: 0, strokeScale: 0.9 },
  editorial: { family: 'Georgia, "Times New Roman", serif', widthScale: 0.92, sizeScale: 0.84, slant: 0, strokeScale: 0.75 },
  athletic: { family: '"Arial Black", Arial, sans-serif', widthScale: 0.9, sizeScale: 0.9, slant: -0.08, strokeScale: 1.25 },
  monumental: { family: 'Rockwell, "Roboto Slab", Georgia, serif', widthScale: 0.98, sizeScale: 0.82, slant: 0, strokeScale: 0.92 },
  geometric: { family: '"Century Gothic", Futura, Arial, sans-serif', widthScale: 0.96, sizeScale: 0.82, slant: 0, strokeScale: 0.78 },
  didone: { family: 'Didot, "Bodoni MT", Georgia, serif', widthScale: 0.88, sizeScale: 0.86, slant: 0, strokeScale: 0.66 },
  technical: { family: 'Consolas, "Courier New", monospace', widthScale: 0.84, sizeScale: 0.78, slant: 0, strokeScale: 0.84 },
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

function fittedText(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, maxWidth: number, size: number, weight: number, color: string, align: CanvasTextAlign = "center", minSize = 22) {
  ctx.save()
  ctx.font = `${weight} ${size}px Arial, sans-serif`
  const measured = Math.max(1, ctx.measureText(value).width)
  const fittedSize = Math.max(minSize, Math.min(size, size * maxWidth / measured))
  ctx.font = `${weight} ${fittedSize}px Arial, sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = "middle"
  ctx.fillText(value, x, y)
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

function drawPremiumFrame(ctx: CanvasRenderingContext2D, accent: string, layout: "centeredHeader" | "headerAboveFrame") {
  const topFrameY = layout === "headerAboveFrame" ? 148 : 72
  ctx.save()
  ctx.strokeStyle = rgba(accent, 0.48)
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(32, 260); ctx.lineTo(32, topFrameY); ctx.lineTo(210, topFrameY); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(WIDTH - 32, 260); ctx.lineTo(WIDTH - 32, topFrameY); ctx.lineTo(WIDTH - 210, topFrameY); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(32, HEIGHT - 260); ctx.lineTo(32, HEIGHT - 72); ctx.lineTo(210, HEIGHT - 72); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(WIDTH - 32, HEIGHT - 260); ctx.lineTo(WIDTH - 32, HEIGHT - 72); ctx.lineTo(WIDTH - 210, HEIGHT - 72); ctx.stroke()
  ctx.restore()
}

async function drawOpeningDayBackground(ctx: CanvasRenderingContext2D, accent: string, frameLayout: "centeredHeader" | "headerAboveFrame" = "centeredHeader") {
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

  const floorRecovery = document.createElement("canvas")
  floorRecovery.width = WIDTH
  floorRecovery.height = HEIGHT
  const floorContext = floorRecovery.getContext("2d")
  if (floorContext) {
    drawImageCover(floorContext, base, 0, 0, WIDTH, HEIGHT)
    floorContext.globalCompositeOperation = "destination-in"
    const floorMask = floorContext.createLinearGradient(0, 1040, 0, HEIGHT)
    floorMask.addColorStop(0, "rgba(0,0,0,0)")
    floorMask.addColorStop(0.45, "rgba(0,0,0,.18)")
    floorMask.addColorStop(0.72, "rgba(0,0,0,.56)")
    floorMask.addColorStop(1, "rgba(0,0,0,.9)")
    floorContext.fillStyle = floorMask
    floorContext.fillRect(0, 0, WIDTH, HEIGHT)
    ctx.drawImage(floorRecovery, 0, 0)
  }

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
  drawPremiumFrame(ctx, accent, frameLayout)
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
  const headerLogo = logo ?? appIcon
  const headlineFont = data.headlineFont ?? "editorial"

  if (headerLogo) {
    ctx.save(); ctx.shadowColor = rgba(accent, 0.42); ctx.shadowBlur = 24
    drawImageContain(ctx, headerLogo, WIDTH / 2 - 74, 70, 148, 96)
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
  const hasTwoHeadlineLines = headline.length > 1
  const firstY = hasTwoHeadlineLines ? 410 : 520
  headline.slice(0, 2).forEach((line, index) => metallicPosterText(ctx, line, WIDTH / 2, firstY + index * 145, 900, hasTwoHeadlineLines ? index === 0 ? 150 : 138 : 184, accent, headlineFont))
  if (data.subtitle) trackedText(ctx, data.subtitle.toLocaleUpperCase("es-ES"), WIDTH / 2, hasTwoHeadlineLines ? 680 : 675, { size: 20, weight: 700, color: "rgba(255,255,255,.82)", spacing: 4, align: "center", font: '"Arial Narrow", Arial, sans-serif' })

  const dateTop = 735
  ctx.save()
  ctx.fillStyle = "rgba(4,5,5,.76)"; ctx.strokeStyle = rgba(accent, 0.78); ctx.lineWidth = 2
  roundedRect(ctx, 128, dateTop, 824, 154, 12); ctx.fill(); ctx.stroke()
  const glow = ctx.createLinearGradient(150, 0, 930, 0); glow.addColorStop(0, "rgba(0,0,0,0)"); glow.addColorStop(0.5, rgba(accent, 0.8)); glow.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = glow; ctx.fillRect(180, dateTop - 2, 720, 3); ctx.restore()
  drawDiamond(ctx, WIDTH / 2, dateTop - 1, 14, mix(accent, 255, 0.25))
  trackedText(ctx, (data.eventDateLabel || "FECHA POR CONFIRMAR").toLocaleUpperCase("es-ES"), WIDTH / 2, dateTop + 70, { size: 58, weight: 900, color: "#f4f2ee", spacing: 3, align: "center", font: 'Impact, "Arial Narrow Bold", sans-serif' })

  const metaTop = 910
  ctx.save(); ctx.fillStyle = "rgba(5,6,6,.84)"; ctx.strokeStyle = rgba(accent, 0.36); ctx.lineWidth = 1.5; roundedRect(ctx, 110, metaTop, 860, 112, 8); ctx.fill(); ctx.stroke(); ctx.restore()
  const meta = [data.roundLabel || "JORNADA 1", data.eventTimeLabel || "HORA"]
  const centers = [270, 540]
  meta.forEach((value, index) => trackedText(ctx, value.toLocaleUpperCase("es-ES"), centers[index], metaTop + 58, { size: index === 1 ? 34 : 26, weight: 800, color: index === 1 ? mix(accent, 255, 0.2) : "#eeeae3", spacing: index === 1 ? 4 : 3, align: "center", font: '"Arial Narrow", Arial, sans-serif' }))
  const venueLines = wrap(ctx, data.venue || "LUGAR", 230, 26, 800).slice(0, 2)
  venueLines.forEach((line, index) => trackedText(ctx, line.toLocaleUpperCase("es-ES"), 810, metaTop + 58 + (index - (venueLines.length - 1) / 2) * 29, { size: venueLines.length > 1 ? 21 : 26, weight: 800, color: "#eeeae3", spacing: 2, align: "center", font: '"Arial Narrow", Arial, sans-serif' }))
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(402, metaTop + 56, 6, 0, Math.PI * 2); ctx.arc(678, metaTop + 56, 6, 0, Math.PI * 2); ctx.fill()

  ctx.save()
  const floorGlow = ctx.createLinearGradient(0, 1040, 0, HEIGHT)
  floorGlow.addColorStop(0, "rgba(0,0,0,0)")
  floorGlow.addColorStop(0.56, rgba(accent, 0.1))
  floorGlow.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = floorGlow; ctx.fillRect(0, 1040, WIDTH, HEIGHT - 1040)
  ctx.strokeStyle = rgba(accent, 0.45); ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(WIDTH / 2, 1040); ctx.lineTo(WIDTH / 2, 1275); ctx.moveTo(160, 1235); ctx.lineTo(920, 1235); ctx.stroke(); ctx.restore()

  ctx.save(); ctx.fillStyle = "rgba(5,6,6,.82)"; ctx.strokeStyle = rgba(accent, 0.48); ctx.lineWidth = 2
  roundedRect(ctx, 315, 1248, 450, 82, 14); ctx.fill(); ctx.stroke(); ctx.restore()
  drawAppBrandFooter(ctx, appIcon, accent)
}

async function drawInformationalPremiumPoster(ctx: CanvasRenderingContext2D, data: LeagueMediaKitImageData) {
  const accent = normalizeAccent(data.accentColor)
  await drawOpeningDayBackground(ctx, accent, "headerAboveFrame")
  ctx.fillStyle = "rgba(2,3,3,.58)"; ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const [logo, appIcon] = await Promise.all([safeImage(data.leagueLogoUrl), safeImage(APP_ICON_PATH)])
  const headerLogo = logo ?? appIcon
  if (headerLogo) drawImageContain(ctx, headerLogo, 62, 54, 92, 72)
  else { fillRound(ctx, 62, 58, 68, 68, 18, mix(accent, 255, 0.2)); trackedText(ctx, data.leagueName.slice(0, 2).toUpperCase(), 96, 92, { size: 18, weight: 900, color: "#090a09", align: "center" }) }

  trackedText(ctx, data.leagueName.toLocaleUpperCase("es-ES"), 174, 75, { size: 19, weight: 900, color: mix(accent, 255, 0.38), spacing: 4, font: '"Arial Narrow", Arial, sans-serif' })
  trackedText(ctx, data.seasonName.toLocaleUpperCase("es-ES"), 174, 108, { size: 16, weight: 700, color: "rgba(255,255,255,.62)", spacing: 3, font: '"Arial Narrow", Arial, sans-serif' })
  trackedText(ctx, data.eyebrow.toLocaleUpperCase("es-ES"), 62, 178, { size: 17, weight: 900, color: accent, spacing: 5, font: '"Arial Narrow", Arial, sans-serif' })
  const titleLines = wrap(ctx, data.title.toLocaleUpperCase("es-ES"), 900, 66, 900).slice(0, 2)
  titleLines.forEach((line, index) => text(ctx, line, 62, 285 + index * 70, 66, 900, "#f5f2ea"))
  const introY = 280 + titleLines.length * 70
  const introLines = wrap(ctx, data.subtitle ?? "", 900, 26, 700).slice(0, 3)
  introLines.forEach((line, index) => text(ctx, line, 62, introY + index * 34, 26, 700, "rgba(255,255,255,.72)"))

  const rows = data.rows.filter((row) => row.label.trim() || row.value.trim()).slice(0, 5)
  const rowCount = Math.max(3, rows.length)
  const rowHeight = rowCount === 3 ? 184 : rowCount === 4 ? 146 : 116
  const rowGap = rowCount === 3 ? 18 : 14
  const rowsTop = Math.max(420, introY + introLines.length * 34 + 28)
  const rowIcons = await Promise.all(rows.map((row) => safeImage(mediaKitIconDataUrl(row.icon ?? "", accent) ?? row.icon)))
  rows.forEach((row, index) => {
    const y = rowsTop + index * (rowHeight + rowGap)
    ctx.save(); roundedRect(ctx, 62, y, 956, rowHeight, 22); ctx.fillStyle = index % 2 === 0 ? "rgba(255,255,255,.075)" : "rgba(255,255,255,.045)"; ctx.fill(); ctx.strokeStyle = rgba(accent, 0.28); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()
    const icon = rowIcons[index]
    const textX = icon ? 174 : 118
    if (icon) {
      fillRound(ctx, 82, y + 20, 64, 64, 17, "rgba(255,255,255,.1)")
      ctx.save(); roundedRect(ctx, 88, y + 26, 52, 52, 13); ctx.clip(); drawImageContain(ctx, icon, 88, y + 26, 52, 52); ctx.restore()
    } else fillRound(ctx, 82, y + 24, 8, 56, 4, accent)
    text(ctx, row.label, textX, y + 47, rowCount === 5 ? 23 : 26, 900, "#f7f4ee")
    const descriptionLines = wrap(ctx, row.value, 790, rowCount === 5 ? 19 : 21, 700).slice(0, rowCount === 5 ? 2 : 3)
    descriptionLines.forEach((line, lineIndex) => text(ctx, line, textX, y + (rowCount === 5 ? 79 : 87) + lineIndex * (rowCount === 5 ? 23 : 26), rowCount === 5 ? 19 : 21, 700, "rgba(255,255,255,.66)"))
  })

  if (data.heroValue) {
    const closingY = Math.min(1150, rowsTop + rows.length * (rowHeight + rowGap) + 4)
    fillRound(ctx, 62, closingY, 956, 78, 20, rgba(accent, 0.14))
    const closingLines = wrap(ctx, data.heroValue.toLocaleUpperCase("es-ES"), 860, 20, 900).slice(0, 2)
    closingLines.forEach((line, index) => trackedText(ctx, line, WIDTH / 2, closingY + 36 + index * 25, { size: 20, weight: 900, color: mix(accent, 255, 0.26), spacing: 2, align: "center", font: '"Arial Narrow", Arial, sans-serif' }))
  }

  ctx.save(); ctx.strokeStyle = rgba(accent, 0.35); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(62, 1230); ctx.lineTo(1018, 1230); ctx.stroke(); ctx.restore()
  drawAppBrandFooter(ctx, appIcon, accent)
}

async function drawMatchdayPremiumPoster(ctx: CanvasRenderingContext2D, data: LeagueMediaKitImageData) {
  const accent = normalizeAccent(data.accentColor)
  await drawOpeningDayBackground(ctx, accent, "headerAboveFrame")
  ctx.fillStyle = "rgba(2,3,3,.54)"; ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const [logo, appIcon] = await Promise.all([safeImage(data.leagueLogoUrl), safeImage(APP_ICON_PATH)])
  const headerLogo = logo ?? appIcon
  if (headerLogo) drawImageContain(ctx, headerLogo, 62, 54, 92, 72)
  else { fillRound(ctx, 62, 58, 68, 68, 18, mix(accent, 255, 0.2)); trackedText(ctx, data.leagueName.slice(0, 2).toUpperCase(), 96, 92, { size: 18, weight: 900, color: "#090a09", align: "center" }) }

  trackedText(ctx, data.leagueName.toLocaleUpperCase("es-ES"), 174, 75, { size: 19, weight: 900, color: mix(accent, 255, 0.38), spacing: 4, font: '"Arial Narrow", Arial, sans-serif' })
  trackedText(ctx, data.seasonName.toLocaleUpperCase("es-ES"), 174, 108, { size: 16, weight: 700, color: "rgba(255,255,255,.62)", spacing: 3, font: '"Arial Narrow", Arial, sans-serif' })
  trackedText(ctx, (data.eyebrow || "Enfrentamiento").toLocaleUpperCase("es-ES"), 62, 176, { size: 17, weight: 900, color: accent, spacing: 5, font: '"Arial Narrow", Arial, sans-serif' })

  metallicPosterText(ctx, (data.title || "Jornada").toLocaleUpperCase("es-ES"), WIDTH / 2, 265, 900, 92, accent, data.headlineFont ?? "impact")
  trackedText(ctx, (data.subtitle || "PARTIDO").toLocaleUpperCase("es-ES"), WIDTH / 2, 342, { size: 20, weight: 900, color: "rgba(255,255,255,.74)", spacing: 6, align: "center", font: '"Arial Narrow", Arial, sans-serif' })

  const matchup: { teamA: [string, string]; teamB: [string, string] } = data.matchup ?? { teamA: ["JUGADOR 1", "JUGADOR 2"], teamB: ["JUGADOR 3", "JUGADOR 4"] }
  const drawPair = (top: number, label: string, names: [string, string]) => {
    ctx.save(); roundedRect(ctx, 92, top, 896, 202, 24); ctx.fillStyle = "rgba(3,4,4,.72)"; ctx.fill(); ctx.strokeStyle = rgba(accent, 0.42); ctx.lineWidth = 2; ctx.stroke(); ctx.restore()
    fillRound(ctx, 116, top + 24, 9, 154, 5, accent)
    trackedText(ctx, label, WIDTH / 2, top + 34, { size: 14, weight: 900, color: rgba(accent, 0.95), spacing: 4, align: "center", font: '"Arial Narrow", Arial, sans-serif' })
    fittedText(ctx, (names[0] || "JUGADOR POR CONFIRMAR").toLocaleUpperCase("es-ES"), WIDTH / 2, top + 90, 760, 43, 900, "#f7f3eb")
    fittedText(ctx, (names[1] || "JUGADOR POR CONFIRMAR").toLocaleUpperCase("es-ES"), WIDTH / 2, top + 147, 760, 43, 900, "#f7f3eb")
  }

  drawPair(390, "PAREJA 1", matchup.teamA)
  ctx.save(); ctx.shadowColor = rgba(accent, 0.7); ctx.shadowBlur = 28; fillRound(ctx, WIDTH / 2 - 48, 620, 96, 72, 22, accent); ctx.restore()
  trackedText(ctx, "VS", WIDTH / 2, 657, { size: 28, weight: 900, color: "#080908", spacing: 2, align: "center", font: 'Impact, "Arial Narrow Bold", sans-serif' })
  drawPair(720, "PAREJA 2", matchup.teamB)

  ctx.save(); roundedRect(ctx, 92, 956, 896, 228, 24); ctx.fillStyle = "rgba(3,4,4,.78)"; ctx.fill(); ctx.strokeStyle = rgba(accent, 0.32); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()
  trackedText(ctx, "FECHA", 126, 989, { size: 13, weight: 900, color: rgba(accent, 0.9), spacing: 3, font: '"Arial Narrow", Arial, sans-serif' })
  fittedText(ctx, (data.eventDateLabel || "FECHA POR CONFIRMAR").toLocaleUpperCase("es-ES"), 126, 1032, 610, 29, 900, "#f5f1e9", "left", 19)
  trackedText(ctx, "HORA", 940, 989, { size: 13, weight: 900, color: rgba(accent, 0.9), spacing: 3, align: "right", font: '"Arial Narrow", Arial, sans-serif' })
  fittedText(ctx, (data.eventTimeLabel || "--:--").toLocaleUpperCase("es-ES"), 940, 1032, 190, 34, 900, mix(accent, 255, 0.22), "right", 22)
  ctx.fillStyle = rgba(accent, 0.26); ctx.fillRect(126, 1064, 828, 1)
  trackedText(ctx, "SEDE", 126, 1096, { size: 13, weight: 900, color: rgba(accent, 0.9), spacing: 3, font: '"Arial Narrow", Arial, sans-serif' })
  fittedText(ctx, (data.venue || "LUGAR POR CONFIRMAR").toLocaleUpperCase("es-ES"), 126, 1140, 810, 29, 900, "#f5f1e9", "left", 19)

  ctx.save(); ctx.strokeStyle = rgba(accent, 0.35); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(62, 1230); ctx.lineTo(1018, 1230); ctx.stroke(); ctx.restore()
  drawAppBrandFooter(ctx, appIcon, accent)
}

async function drawScoreboardPremiumPoster(ctx: CanvasRenderingContext2D, data: LeagueMediaKitImageData) {
  const accent = normalizeAccent(data.accentColor)
  await drawOpeningDayBackground(ctx, accent, "headerAboveFrame")
  ctx.fillStyle = "rgba(2,3,3,.56)"; ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const [logo, appIcon] = await Promise.all([safeImage(data.leagueLogoUrl), safeImage(APP_ICON_PATH)])
  const headerLogo = logo ?? appIcon
  if (headerLogo) drawImageContain(ctx, headerLogo, 62, 54, 92, 72)
  else { fillRound(ctx, 62, 58, 68, 68, 18, mix(accent, 255, 0.2)); trackedText(ctx, data.leagueName.slice(0, 2).toUpperCase(), 96, 92, { size: 18, weight: 900, color: "#090a09", align: "center" }) }

  trackedText(ctx, data.leagueName.toLocaleUpperCase("es-ES"), 174, 75, { size: 19, weight: 900, color: mix(accent, 255, 0.38), spacing: 4, font: '"Arial Narrow", Arial, sans-serif' })
  trackedText(ctx, data.seasonName.toLocaleUpperCase("es-ES"), 174, 108, { size: 16, weight: 700, color: "rgba(255,255,255,.62)", spacing: 3, font: '"Arial Narrow", Arial, sans-serif' })
  trackedText(ctx, data.eyebrow.toLocaleUpperCase("es-ES"), 62, 178, { size: 17, weight: 900, color: accent, spacing: 5, font: '"Arial Narrow", Arial, sans-serif' })

  const titleLines = wrap(ctx, data.title.toLocaleUpperCase("es-ES"), 900, 64, 900).slice(0, 2)
  titleLines.forEach((line, index) => text(ctx, line, 62, 272 + index * 68, 64, 900, "#f6f2ea"))
  const subtitleY = 270 + titleLines.length * 68
  const subtitleLines = wrap(ctx, data.subtitle ?? "", 900, 24, 700).slice(0, 2)
  subtitleLines.forEach((line, index) => text(ctx, line, 62, subtitleY + index * 31, 24, 700, "rgba(255,255,255,.68)"))

  const rows = data.rows.filter((row) => row.label.trim() || row.value.trim()).slice(0, 5)
  const rowsTop = Math.max(410, subtitleY + subtitleLines.length * 31 + 30)
  const availableHeight = 1128 - rowsTop
  const rowGap = 14
  const rowHeight = Math.min(132, Math.max(104, (availableHeight - rowGap * Math.max(0, rows.length - 1)) / Math.max(rows.length, 1)))
  rows.forEach((row, index) => {
    const y = rowsTop + index * (rowHeight + rowGap)
    ctx.save(); roundedRect(ctx, 62, y, 956, rowHeight, 22); ctx.fillStyle = index === 0 ? rgba(accent, 0.16) : index % 2 === 0 ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.045)"; ctx.fill(); ctx.strokeStyle = index === 0 ? rgba(accent, 0.58) : rgba(accent, 0.24); ctx.lineWidth = index === 0 ? 2 : 1.5; ctx.stroke(); ctx.restore()
    fillRound(ctx, 82, y + (rowHeight - 58) / 2, 58, 58, 16, index === 0 ? accent : "rgba(255,255,255,.1)")
    trackedText(ctx, data.kind === "standings" || data.kind === "season_final" ? String(index + 1) : `P${index + 1}`, 111, y + rowHeight / 2 + 1, { size: 20, weight: 900, color: index === 0 ? "#080908" : mix(accent, 255, 0.24), spacing: 1, align: "center", font: 'Impact, "Arial Narrow Bold", sans-serif' })
    fittedText(ctx, row.label.toLocaleUpperCase("es-ES"), 164, y + rowHeight / 2 + 2, 575, 29, 900, "#f7f3eb", "left", 18)
    fittedText(ctx, row.value.toLocaleUpperCase("es-ES"), 982, y + rowHeight / 2 + 2, 238, 30, 900, index === 0 ? mix(accent, 255, 0.24) : "rgba(255,255,255,.78)", "right", 17)
  })

  if (data.heroValue) {
    const closingY = Math.min(1158, rowsTop + rows.length * (rowHeight + rowGap) + 4)
    trackedText(ctx, data.heroValue.toLocaleUpperCase("es-ES"), WIDTH / 2, closingY + 24, { size: 18, weight: 900, color: mix(accent, 255, 0.28), spacing: 3, align: "center", font: '"Arial Narrow", Arial, sans-serif' })
  }

  ctx.save(); ctx.strokeStyle = rgba(accent, 0.35); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(62, 1230); ctx.lineTo(1018, 1230); ctx.stroke(); ctx.restore()
  drawAppBrandFooter(ctx, appIcon, accent)
}

async function drawSpotlightPremiumPoster(ctx: CanvasRenderingContext2D, data: LeagueMediaKitImageData) {
  const accent = normalizeAccent(data.accentColor)
  await drawOpeningDayBackground(ctx, accent, "headerAboveFrame")
  ctx.fillStyle = "rgba(2,3,3,.54)"; ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const [logo, appIcon, spotlightImage] = await Promise.all([safeImage(data.leagueLogoUrl), safeImage(APP_ICON_PATH), safeImage(data.spotlightImageUrl)])
  const headerLogo = logo ?? appIcon
  if (headerLogo) drawImageContain(ctx, headerLogo, 62, 54, 92, 72)
  trackedText(ctx, data.leagueName.toLocaleUpperCase("es-ES"), 174, 75, { size: 19, weight: 900, color: mix(accent, 255, 0.38), spacing: 4, font: '"Arial Narrow", Arial, sans-serif' })
  trackedText(ctx, data.seasonName.toLocaleUpperCase("es-ES"), 174, 108, { size: 16, weight: 700, color: "rgba(255,255,255,.62)", spacing: 3, font: '"Arial Narrow", Arial, sans-serif' })
  trackedText(ctx, data.eyebrow.toLocaleUpperCase("es-ES"), 62, 178, { size: 17, weight: 900, color: accent, spacing: 5, font: '"Arial Narrow", Arial, sans-serif' })

  const titleLines = wrap(ctx, data.title.toLocaleUpperCase("es-ES"), 900, 60, 900).slice(0, 2)
  titleLines.forEach((line, index) => text(ctx, line, 62, 266 + index * 64, 60, 900, "#f6f2ea"))
  const portraitTop = titleLines.length > 1 ? 370 : 320
  ctx.save(); ctx.shadowColor = rgba(accent, 0.55); ctx.shadowBlur = 46; fillRound(ctx, WIDTH / 2 - 132, portraitTop, 264, 264, 132, rgba(accent, 0.26)); ctx.restore()
  ctx.save(); ctx.beginPath(); ctx.arc(WIDTH / 2, portraitTop + 132, 121, 0, Math.PI * 2); ctx.clip()
  if (spotlightImage) drawImageCover(ctx, spotlightImage, WIDTH / 2 - 121, portraitTop + 11, 242, 242)
  else if (appIcon) drawImageContain(ctx, appIcon, WIDTH / 2 - 92, portraitTop + 40, 184, 184)
  ctx.restore()
  ctx.save(); ctx.strokeStyle = mix(accent, 255, 0.28); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(WIDTH / 2, portraitTop + 132, 128, 0, Math.PI * 2); ctx.stroke(); ctx.restore()

  const heroY = portraitTop + 322
  fittedText(ctx, (data.heroValue || "PROTAGONISTA").toLocaleUpperCase("es-ES"), WIDTH / 2, heroY, 900, 52, 900, mix(accent, 255, 0.2), "center", 28)
  const subtitleLines = wrap(ctx, data.subtitle ?? "", 840, 23, 700).slice(0, 2)
  subtitleLines.forEach((line, index) => text(ctx, line, WIDTH / 2, heroY + 48 + index * 29, 23, 700, "rgba(255,255,255,.7)", "center"))

  const rows = data.rows.filter((row) => row.label.trim() || row.value.trim()).slice(0, 3)
  const rowsTop = heroY + 104
  rows.forEach((row, index) => {
    const y = rowsTop + index * 92
    ctx.save(); roundedRect(ctx, 92, y, 896, 78, 18); ctx.fillStyle = index === 0 ? rgba(accent, 0.15) : "rgba(255,255,255,.055)"; ctx.fill(); ctx.strokeStyle = rgba(accent, index === 0 ? 0.46 : 0.2); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()
    trackedText(ctx, row.label.toLocaleUpperCase("es-ES"), 122, y + 39, { size: 17, weight: 900, color: "rgba(255,255,255,.72)", spacing: 2, font: '"Arial Narrow", Arial, sans-serif' })
    fittedText(ctx, row.value.toLocaleUpperCase("es-ES"), 958, y + 39, 470, 24, 900, index === 0 ? mix(accent, 255, 0.22) : "#f4f0e8", "right", 15)
  })

  ctx.save(); ctx.strokeStyle = rgba(accent, 0.35); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(62, 1230); ctx.lineTo(1018, 1230); ctx.stroke(); ctx.restore()
  drawAppBrandFooter(ctx, appIcon, accent)
}

async function drawResultsPremiumPoster(ctx: CanvasRenderingContext2D, data: LeagueMediaKitImageData) {
  const accent = normalizeAccent(data.accentColor)
  await drawOpeningDayBackground(ctx, accent, "headerAboveFrame")
  ctx.fillStyle = "rgba(2,3,3,.55)"; ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const [logo, appIcon] = await Promise.all([safeImage(data.leagueLogoUrl), safeImage(APP_ICON_PATH)])
  const headerLogo = logo ?? appIcon
  if (headerLogo) drawImageContain(ctx, headerLogo, 62, 54, 92, 72)
  trackedText(ctx, data.leagueName.toLocaleUpperCase("es-ES"), 174, 75, { size: 19, weight: 900, color: mix(accent, 255, 0.38), spacing: 4, font: '"Arial Narrow", Arial, sans-serif' })
  trackedText(ctx, data.seasonName.toLocaleUpperCase("es-ES"), 174, 108, { size: 16, weight: 700, color: "rgba(255,255,255,.62)", spacing: 3, font: '"Arial Narrow", Arial, sans-serif' })
  trackedText(ctx, data.eyebrow.toLocaleUpperCase("es-ES"), 62, 178, { size: 17, weight: 900, color: accent, spacing: 5, font: '"Arial Narrow", Arial, sans-serif' })

  const titleLines = wrap(ctx, data.title.toLocaleUpperCase("es-ES"), 900, 62, 900).slice(0, 2)
  titleLines.forEach((line, index) => text(ctx, line, 62, 270 + index * 66, 62, 900, "#f6f2ea"))
  const subtitleY = 270 + titleLines.length * 66
  trackedText(ctx, (data.subtitle ?? "").toLocaleUpperCase("es-ES"), 62, subtitleY, { size: 21, weight: 800, color: "rgba(255,255,255,.66)", spacing: 2, font: '"Arial Narrow", Arial, sans-serif' })

  const results = (data.results ?? []).slice(0, 4)
  const matchCount = Math.max(2, results.length)
  const matchesTop = Math.max(400, subtitleY + 38)
  const gap = matchCount === 4 ? 12 : 16
  const availableHeight = 1148 - matchesTop
  const cardHeight = Math.min(282, (availableHeight - gap * (matchCount - 1)) / matchCount)
  const compact = matchCount >= 4

  const drawPairRow = ({
    names,
    scores,
    opponentScores,
    points,
    opponentPoints,
    top,
    height,
  }: {
    names: [string, string]
    scores: number[]
    opponentScores: number[]
    points: number
    opponentPoints: number
    top: number
    height: number
  }) => {
    const isWinner = points > opponentPoints
    ctx.save(); roundedRect(ctx, 82, top, 916, height, compact ? 13 : 17); ctx.fillStyle = isWinner ? rgba(accent, 0.13) : "rgba(255,255,255,.045)"; ctx.fill(); ctx.restore()
    const nameSize = compact ? 17 : 21
    const lineGap = compact ? 18 : 23
    fittedText(ctx, (names[0] || "JUGADOR POR CONFIRMAR").toLocaleUpperCase("es-ES"), 104, top + height / 2 - lineGap / 2, 500, nameSize, 900, isWinner ? "#f8f4ec" : "rgba(255,255,255,.76)", "left", 13)
    fittedText(ctx, (names[1] || "JUGADOR POR CONFIRMAR").toLocaleUpperCase("es-ES"), 104, top + height / 2 + lineGap / 2, 500, nameSize, 900, isWinner ? "#f8f4ec" : "rgba(255,255,255,.76)", "left", 13)
    const scoreCenters = [714, 786, 858]
    scoreCenters.forEach((center, index) => {
      const score = scores[index]
      if (score === undefined) return
      trackedText(ctx, String(score), center, top + height / 2 + 1, { size: compact ? 22 : 27, weight: 900, color: score > (opponentScores[index] ?? score) ? mix(accent, 255, 0.18) : "rgba(255,255,255,.78)", align: "center", font: '"Arial Narrow", Arial, sans-serif' })
    })
    fillRound(ctx, 912, top + (height - (compact ? 48 : 56)) / 2, 64, compact ? 48 : 56, compact ? 12 : 15, isWinner ? accent : "rgba(255,255,255,.1)")
    trackedText(ctx, String(points), 944, top + height / 2 + 1, { size: compact ? 27 : 32, weight: 900, color: isWinner ? "#080908" : "#f3efe7", align: "center", font: 'Impact, "Arial Narrow Bold", sans-serif' })
  }

  Array.from({ length: matchCount }, (_, index) => results[index] ?? null).forEach((result, index) => {
    const y = matchesTop + index * (cardHeight + gap)
    ctx.save(); roundedRect(ctx, 62, y, 956, cardHeight, compact ? 18 : 24); ctx.fillStyle = "rgba(3,4,4,.76)"; ctx.fill(); ctx.strokeStyle = rgba(accent, index === 0 ? 0.46 : 0.25); ctx.lineWidth = index === 0 ? 2 : 1.5; ctx.stroke(); ctx.restore()
    trackedText(ctx, `PARTIDO ${index + 1}`, 86, y + (compact ? 22 : 28), { size: compact ? 12 : 14, weight: 900, color: rgba(accent, 0.95), spacing: 3, font: '"Arial Narrow", Arial, sans-serif' })
    const headerY = y + (compact ? 22 : 28)
    ;["S1", "S2", "S3"].forEach((label, setIndex) => trackedText(ctx, label, [714, 786, 858][setIndex], headerY, { size: 11, weight: 900, color: "rgba(255,255,255,.38)", spacing: 1, align: "center", font: '"Arial Narrow", Arial, sans-serif' }))
    trackedText(ctx, "SETS", 944, headerY, { size: 11, weight: 900, color: rgba(accent, 0.75), spacing: 1, align: "center", font: '"Arial Narrow", Arial, sans-serif' })
    const contentTop = y + (compact ? 34 : 42)
    const contentHeight = cardHeight - (compact ? 42 : 52)
    const pairGap = compact ? 6 : 8
    const pairHeight = (contentHeight - pairGap) / 2
    const safeResult = result ?? { teamA: ["Pareja por confirmar", ""] as [string, string], teamB: ["Pareja por confirmar", ""] as [string, string], pointsA: 0, pointsB: 0, sets: [] }
    drawPairRow({ names: safeResult.teamA, scores: safeResult.sets.map((set) => set.a), opponentScores: safeResult.sets.map((set) => set.b), points: safeResult.pointsA, opponentPoints: safeResult.pointsB, top: contentTop, height: pairHeight })
    drawPairRow({ names: safeResult.teamB, scores: safeResult.sets.map((set) => set.b), opponentScores: safeResult.sets.map((set) => set.a), points: safeResult.pointsB, opponentPoints: safeResult.pointsA, top: contentTop + pairHeight + pairGap, height: pairHeight })
  })

  ctx.save(); ctx.strokeStyle = rgba(accent, 0.35); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(62, 1230); ctx.lineTo(1018, 1230); ctx.stroke(); ctx.restore()
  drawAppBrandFooter(ctx, appIcon, accent)
}

async function drawClassicMediaKit(ctx: CanvasRenderingContext2D, data: LeagueMediaKitImageData) {
  ctx.fillStyle = "#f3f4f1"; ctx.fillRect(0, 0, WIDTH, HEIGHT)
  fillRound(ctx, PADDING, 46, WIDTH - PADDING * 2, 330, 34, "#151c17")
  const [logo, appIcon] = await Promise.all([safeImage(data.leagueLogoUrl), safeImage(APP_ICON_PATH)])
  const headerLogo = logo ?? appIcon
  if (headerLogo) { ctx.save(); roundedRect(ctx, PADDING + 30, 78, 88, 88, 24); ctx.clip(); ctx.drawImage(headerLogo, PADDING + 30, 78, 88, 88); ctx.restore() }
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
  if (data.template === "results_premium_06") await drawResultsPremiumPoster(ctx, data)
  else if (data.template === "spotlight_premium_05") await drawSpotlightPremiumPoster(ctx, data)
  else if (data.template === "scoreboard_premium_04") await drawScoreboardPremiumPoster(ctx, data)
  else if (data.template === "matchday_premium_03") await drawMatchdayPremiumPoster(ctx, data)
  else if (data.template === "informational_premium_02") await drawInformationalPremiumPoster(ctx, data)
  else if (data.template === "opening_day_premium_01") await drawOpeningDayPoster(ctx, data)
  else await drawClassicMediaKit(ctx, data)
  return new Promise<Blob>((resolve, reject) => { canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("png_export_failed")), "image/png") })
}

export function downloadLeagueMediaKitImage(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 500)
}
