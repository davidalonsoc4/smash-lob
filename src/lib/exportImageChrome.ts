import { translateLeagueText } from "@/i18n/leagueText"
import type { Locale } from "@/i18n/translations"

export const SHARED_EXPORT_HEADER_HEIGHT = 254
export const SHARED_EXPORT_APP_ICON_PATH = "/icon-192.png"

const surfaceColor = "#ffffff"
const textColor = "#171817"
const mutedColor = "#676c68"
const accentColor = "#151615"
const inverseTextColor = "#ffffff"
const inverseMutedColor = "#c9ceca"

type TextAlignment = "left" | "center" | "right"

type TextLayout = {
  fontSize: number
  lineHeight: number
  lines: string[]
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
}

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string,
) {
  roundedRect(context, x, y, width, height, radius)
  context.fillStyle = fillStyle
  context.fill()
}

function truncateTextToWidth(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  if (context.measureText(text).width <= maxWidth) return text

  let visible = text
  while (visible.length > 1 && context.measureText(`${visible}…`).width > maxWidth) {
    visible = visible.slice(0, -1)
  }
  return `${visible.trimEnd()}…`
}

function wrapTextLines({
  context,
  text,
  maxWidth,
  maxLines,
}: {
  context: CanvasRenderingContext2D
  text: string
  maxWidth: number
  maxLines: number
}) {
  const normalized = text.trim().replace(/\s+/g, " ")
  if (!normalized) return [""]

  const words = normalized.split(" ")
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (context.measureText(candidate).width <= maxWidth) {
      current = candidate
      continue
    }

    if (current) {
      lines.push(current)
      current = word
    } else {
      lines.push(truncateTextToWidth(context, word, maxWidth))
      current = ""
    }
  }

  if (current) lines.push(current)
  const normalizedLines = lines.map((line) =>
    truncateTextToWidth(context, line, maxWidth),
  )
  if (normalizedLines.length <= maxLines) return normalizedLines

  const visible = normalizedLines.slice(0, maxLines)
  const overflowText = lines.slice(maxLines - 1).join(" ")
  visible[maxLines - 1] = truncateTextToWidth(context, overflowText, maxWidth)
  return visible
}

function fitTextLayout({
  context,
  text,
  maxWidth,
  maxLines,
  maxFontSize,
  minFontSize,
  fontWeight,
  lineHeightRatio = 1.08,
}: {
  context: CanvasRenderingContext2D
  text: string
  maxWidth: number
  maxLines: number
  maxFontSize: number
  minFontSize: number
  fontWeight: number
  lineHeightRatio?: number
}): TextLayout {
  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 2) {
    context.font = `${fontWeight} ${fontSize}px Arial, sans-serif`
    const lines = wrapTextLines({ context, text, maxWidth, maxLines })
    const hasTruncation = lines.some((line) => line.endsWith("…"))
    if (!hasTruncation || fontSize === minFontSize) {
      return {
        fontSize,
        lineHeight: Math.round(fontSize * lineHeightRatio),
        lines,
      }
    }
  }

  context.font = `${fontWeight} ${minFontSize}px Arial, sans-serif`
  return {
    fontSize: minFontSize,
    lineHeight: Math.round(minFontSize * lineHeightRatio),
    lines: wrapTextLines({ context, text, maxWidth, maxLines }),
  }
}

function drawTextLines({
  context,
  lines,
  x,
  y,
  width,
  height,
  lineHeight,
  align = "left",
}: {
  context: CanvasRenderingContext2D
  lines: string[]
  x: number
  y: number
  width: number
  height: number
  lineHeight: number
  align?: TextAlignment
}) {
  const centerY = y + height / 2
  const firstLineY = centerY - ((lines.length - 1) * lineHeight) / 2
  const textX = align === "center" ? x + width / 2 : align === "right" ? x + width : x
  context.save()
  context.textAlign = align
  context.textBaseline = "middle"
  lines.forEach((line, index) => {
    context.fillText(line, textX, firstLineY + index * lineHeight)
  })
  context.restore()
}

function getContainedImagePlacement({
  image,
  x,
  y,
  width,
  height,
}: {
  image: HTMLImageElement
  x: number
  y: number
  width: number
  height: number
}) {
  const sourceRatio = image.width / image.height
  const targetRatio = width / height
  let drawWidth = width
  let drawHeight = height

  if (sourceRatio > targetRatio) {
    drawHeight = width / sourceRatio
  } else {
    drawWidth = height * sourceRatio
  }

  return {
    x: x + (width - drawWidth) / 2,
    y: y + (height - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  }
}

function drawTransparentImageContain({
  context,
  image,
  x,
  y,
  width,
  height,
}: {
  context: CanvasRenderingContext2D
  image: HTMLImageElement
  x: number
  y: number
  width: number
  height: number
}) {
  const placement = getContainedImagePlacement({ image, x, y, width, height })
  context.save()
  context.shadowColor = "rgba(15, 23, 42, 0.14)"
  context.shadowBlur = 8
  context.shadowOffsetY = 2
  context.drawImage(
    image,
    placement.x,
    placement.y,
    placement.width,
    placement.height,
  )
  context.restore()
}

function drawImageCover({
  context,
  image,
  x,
  y,
  width,
  height,
  radius,
}: {
  context: CanvasRenderingContext2D
  image: HTMLImageElement
  x: number
  y: number
  width: number
  height: number
  radius: number
}) {
  fillRoundedRect(context, x, y, width, height, radius, surfaceColor)
  context.save()
  roundedRect(context, x, y, width, height, radius)
  context.clip()
  const sourceRatio = image.width / image.height
  const targetRatio = width / height
  let drawWidth = width
  let drawHeight = height
  let drawX = x
  let drawY = y

  if (sourceRatio > targetRatio) {
    drawWidth = height * sourceRatio
    drawX = x - (drawWidth - width) / 2
  } else {
    drawHeight = width / sourceRatio
    drawY = y - (drawHeight - height) / 2
  }

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight)
  context.restore()
}

function drawCenteredText({
  context,
  text,
  x,
  y,
}: {
  context: CanvasRenderingContext2D
  text: string
  x: number
  y: number
}) {
  context.save()
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillText(text, x, y)
  context.restore()
}

function drawBrandMark({
  context,
  appIcon,
  x,
  y,
  size,
}: {
  context: CanvasRenderingContext2D
  appIcon: HTMLImageElement | null
  x: number
  y: number
  size: number
}) {
  if (appIcon) {
    drawImageCover({
      context,
      image: appIcon,
      x,
      y,
      width: size,
      height: size,
      radius: Math.round(size * 0.24),
    })
    return
  }

  fillRoundedRect(context, x, y, size, size, Math.round(size * 0.24), surfaceColor)
  context.fillStyle = accentColor
  context.font = `900 ${Math.round(size * 0.28)}px Arial, sans-serif`
  drawCenteredText({ context, text: "S&L", x: x + size / 2, y: y + size / 2 })
}

export async function loadSharedExportImage(src?: string | null) {
  if (!src) return null

  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

export function drawSharedExportHeader({
  context,
  leagueLogo,
  eyebrow,
  leagueName,
  seasonName,
  x,
  y,
  width,
  height = SHARED_EXPORT_HEADER_HEIGHT,
}: {
  context: CanvasRenderingContext2D
  leagueLogo: HTMLImageElement | null
  eyebrow: string
  leagueName: string
  seasonName: string
  x: number
  y: number
  width: number
  height?: number
}) {
  fillRoundedRect(context, x, y, width, height, 38, accentColor)

  context.save()
  roundedRect(context, x, y, width, height, 38)
  context.clip()
  context.strokeStyle = "rgba(255, 255, 255, 0.075)"
  context.lineWidth = 3
  context.beginPath()
  context.arc(x + width - 36, y + height + 10, 248, Math.PI, Math.PI * 1.65)
  context.stroke()
  context.beginPath()
  context.moveTo(x + width * 0.55, y - 20)
  context.lineTo(x + width + 40, y + height * 0.65)
  context.stroke()
  context.restore()

  const logoRightMargin = 18
  const logoTop = y + 18
  const logoBottomMargin = 18
  const logoMaxHeight = leagueLogo ? height - (logoTop - y) - logoBottomMargin : 0
  const logoAspect = leagueLogo
    ? leagueLogo.naturalWidth / Math.max(1, leagueLogo.naturalHeight)
    : 1
  const leagueLogoWidth = leagueLogo ? logoMaxHeight * logoAspect : 0
  const leagueLogoX = x + width - leagueLogoWidth - logoRightMargin

  if (leagueLogo) {
    drawTransparentImageContain({
      context,
      image: leagueLogo,
      x: leagueLogoX,
      y: logoTop,
      width: leagueLogoWidth,
      height: logoMaxHeight,
    })
  }

  const textLeft = x + 30
  const textRight = leagueLogo ? leagueLogoX - 18 : x + width - 30
  const titleWidth = Math.max(240, textRight - textLeft)

  context.fillStyle = inverseMutedColor
  context.font = "900 15px Arial, sans-serif"
  context.save()
  context.textBaseline = "middle"
  context.fillText(eyebrow.toUpperCase(), textLeft, y + 38)
  context.restore()

  const leagueLayout = fitTextLayout({
    context,
    text: leagueName.toUpperCase(),
    maxWidth: titleWidth,
    maxLines: 2,
    maxFontSize: 24,
    minFontSize: 18,
    fontWeight: 900,
  })
  context.fillStyle = inverseMutedColor
  context.font = `900 ${leagueLayout.fontSize}px Arial, sans-serif`
  drawTextLines({
    context,
    lines: leagueLayout.lines,
    x: textLeft,
    y: y + 84,
    width: titleWidth,
    height: 48,
    lineHeight: leagueLayout.lineHeight,
  })

  const seasonLayout = fitTextLayout({
    context,
    text: seasonName,
    maxWidth: titleWidth,
    maxLines: 2,
    maxFontSize: 56,
    minFontSize: 36,
    fontWeight: 900,
  })
  context.fillStyle = inverseTextColor
  context.font = `900 ${seasonLayout.fontSize}px Arial, sans-serif`
  drawTextLines({
    context,
    lines: seasonLayout.lines,
    x: textLeft,
    y: y + 136,
    width: titleWidth,
    height: 84,
    lineHeight: seasonLayout.lineHeight,
  })
}

export function drawSharedExportFooter({
  context,
  appIcon,
  x,
  y,
  width,
  locale,
}: {
  context: CanvasRenderingContext2D
  appIcon: HTMLImageElement | null
  x: number
  y: number
  width: number
  locale: Locale
}) {
  const iconSize = 52
  const textBlockWidth = 132
  const groupWidth = iconSize + 16 + textBlockWidth
  const groupX = x + (width - groupWidth) / 2
  drawBrandMark({ context, appIcon, x: groupX, y: y + 5, size: iconSize })

  context.fillStyle = mutedColor
  context.font = "700 15px Arial, sans-serif"
  context.save()
  context.textBaseline = "middle"
  context.fillText(translateLeagueText(locale, "Creado con"), groupX + iconSize + 16, y + 22)
  context.restore()

  context.fillStyle = textColor
  context.font = "900 21px Arial, sans-serif"
  context.save()
  context.textBaseline = "middle"
  context.fillText("Smash & Lob", groupX + iconSize + 16, y + 44)
  context.restore()
}
