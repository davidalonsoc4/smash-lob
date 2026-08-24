import { formatMoney } from "@/lib/courtBooking"
import { getIntlLocale } from "@/i18n/leagueText"
import type { Locale } from "@/i18n/translations"
import type { SeasonFinanceTransparencyData } from "@/lib/seasonFinanceTransparency"

const WIDTH = 1080
const PAGE_PADDING = 56
const CARD_RADIUS = 30
const HEADER_HEIGHT = 210
const SUMMARY_CARD_HEIGHT = 118
const ROW_HEIGHT = 46
const FOOTER_HEIGHT = 82
const APP_ICON_PATH = "/icon-192.png"

const backgroundColor = "#f5f6f2"
const surfaceColor = "#ffffff"
const borderColor = "#dde3dc"
const mutedTextColor = "#667067"
const headingTextColor = "#101611"
const accentColor = "#19211b"
const softAccentColor = "#ecf2eb"
const positiveColor = "#0f6d37"
const negativeColor = "#9f1239"
const warningColor = "#92400e"
const warningSoftColor = "#fff7e8"

export type SeasonFinanceTransparencyLabels = {
  title: string
  subtitle: string
  generatedLabel: string
  summary: {
    collected: string
    pending: string
    spent: string
    available: string
    paidHelper: (count: number) => string
    pendingHelper: (count: number) => string
    expensesHelper: (count: number) => string
    availableHelper: (value: string) => string
  }
  paymentsTitle: string
  paymentsPendingTitle: string
  paymentsCompleteDetail: string
  paymentsSummary: (
    paidCount: number,
    totalPlayers: number,
    collected: string,
    pending: string,
  ) => string
  expensesTitle: string
  noExpenses: string
  footer: string
  expenseColumns: {
    concept: string
    date: string
    amount: string
  }
}

type TextLayout = {
  fontSize: number
  lineHeight: number
  lines: string[]
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string,
  strokeStyle?: string,
) {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
  context.fillStyle = fillStyle
  context.fill()

  if (strokeStyle) {
    context.strokeStyle = strokeStyle
    context.lineWidth = 1
    context.stroke()
  }
}

function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    font: string
    color: string
    align?: CanvasTextAlign
    baseline?: CanvasTextBaseline
  },
) {
  context.font = options.font
  context.fillStyle = options.color
  context.textAlign = options.align ?? "left"
  context.textBaseline = options.baseline ?? "top"
  context.fillText(text, x, y)
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 99,
) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return [""]

  const lines: string[] = []
  let currentLine = words[0]

  for (let index = 1; index < words.length; index += 1) {
    const candidate = `${currentLine} ${words[index]}`
    if (context.measureText(candidate).width <= maxWidth) {
      currentLine = candidate
    } else {
      lines.push(currentLine)
      currentLine = words[index]
      if (lines.length === maxLines - 1) {
        const last = [currentLine, ...words.slice(index + 1)].join(" ")
        let truncated = last
        while (
          truncated.length > 1 &&
          context.measureText(`${truncated}…`).width > maxWidth
        ) {
          truncated = truncated.slice(0, -1)
        }
        lines.push(`${truncated}…`)
        return lines
      }
    }
  }

  lines.push(currentLine)
  return lines.slice(0, maxLines)
}

function fitTextLayout({
  context,
  text,
  maxWidth,
  maxLines,
  maxFontSize,
  minFontSize,
  fontWeight,
  lineHeightRatio = 1.12,
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
    const lines = wrapText(context, text, maxWidth, maxLines)
    const truncated = lines.some((line) => line.endsWith("…"))
    if (!truncated || fontSize === minFontSize) {
      return {
        fontSize,
        lineHeight: Math.round(fontSize * lineHeightRatio),
        lines,
      }
    }
  }

  return {
    fontSize: minFontSize,
    lineHeight: Math.round(minFontSize * lineHeightRatio),
    lines: [text],
  }
}

function drawTextLines({
  context,
  lines,
  x,
  y,
  width,
  lineHeight,
}: {
  context: CanvasRenderingContext2D
  lines: string[]
  x: number
  y: number
  width: number
  lineHeight: number
}) {
  context.save()
  context.textAlign = "left"
  context.textBaseline = "top"
  lines.forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight, width)
  })
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

function drawImageCover({
  context,
  image,
  x,
  y,
  width,
  height,
  radius,
  background,
}: {
  context: CanvasRenderingContext2D
  image: HTMLImageElement
  x: number
  y: number
  width: number
  height: number
  radius: number
  background: string
}) {
  const sourceRatio = image.width / Math.max(1, image.height)
  const targetRatio = width / Math.max(1, height)
  let cropWidth = image.width
  let cropHeight = image.height
  let cropX = 0
  let cropY = 0

  if (sourceRatio > targetRatio) {
    cropWidth = image.height * targetRatio
    cropX = (image.width - cropWidth) / 2
  } else {
    cropHeight = image.width / targetRatio
    cropY = (image.height - cropHeight) / 2
  }

  context.save()
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
  context.clip()
  context.fillStyle = background
  context.fillRect(x, y, width, height)
  context.drawImage(image, cropX, cropY, cropWidth, cropHeight, x, y, width, height)
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
      background: surfaceColor,
    })
    return
  }

  drawRoundedRect(context, x, y, size, size, Math.round(size * 0.24), surfaceColor)
  context.fillStyle = accentColor
  context.font = `900 ${Math.round(size * 0.28)}px Arial, sans-serif`
  drawCenteredText({ context, text: "S&L", x: x + size / 2, y: y + size / 2 })
}

async function loadOptionalImage(src?: string | null) {
  if (!src) return null

  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
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
  const sourceRatio = image.width / Math.max(1, image.height)
  const targetRatio = width / height
  let drawWidth = width
  let drawHeight = height

  if (sourceRatio > targetRatio) {
    drawHeight = width / sourceRatio
  } else {
    drawWidth = height * sourceRatio
  }

  const drawX = x + (width - drawWidth) / 2
  const drawY = y + (height - drawHeight) / 2

  context.save()
  context.shadowColor = "rgba(0, 0, 0, 0.18)"
  context.shadowBlur = 18
  context.shadowOffsetY = 8
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight)
  context.restore()
}

function dateLabel(value: string | null, locale: Locale) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(date)
}

function generatedLabel(value: string, locale: Locale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(date)
}


function drawExportHeader({
  context,
  data,
  leagueLogo,
  labels,
  x,
  y,
  width,
  height,
}: {
  context: CanvasRenderingContext2D
  data: SeasonFinanceTransparencyData
  leagueLogo: HTMLImageElement | null
  labels: SeasonFinanceTransparencyLabels
  x: number
  y: number
  width: number
  height: number
}) {
  drawRoundedRect(context, x, y, width, height, 38, accentColor)

  context.save()
  context.beginPath()
  context.roundRect(x, y, width, height, 38)
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

  context.fillStyle = "#c9ceca"
  context.font = "900 15px Arial, sans-serif"
  context.save()
  context.textBaseline = "middle"
  context.fillText(labels.title.toUpperCase(), textLeft, y + 38)
  context.restore()

  const leagueLayout = fitTextLayout({
    context,
    text: data.leagueName.toUpperCase(),
    maxWidth: titleWidth,
    maxLines: 2,
    maxFontSize: 24,
    minFontSize: 18,
    fontWeight: 900,
  })
  context.fillStyle = "#c9ceca"
  context.font = `900 ${leagueLayout.fontSize}px Arial, sans-serif`
  drawTextLines({
    context,
    lines: leagueLayout.lines,
    x: textLeft,
    y: y + 84,
    width: titleWidth,
    lineHeight: leagueLayout.lineHeight,
  })

  const seasonLayout = fitTextLayout({
    context,
    text: data.seasonName,
    maxWidth: titleWidth,
    maxLines: 2,
    maxFontSize: 56,
    minFontSize: 36,
    fontWeight: 900,
  })
  context.fillStyle = "#ffffff"
  context.font = `900 ${seasonLayout.fontSize}px Arial, sans-serif`
  drawTextLines({
    context,
    lines: seasonLayout.lines,
    x: textLeft,
    y: y + 136,
    width: titleWidth,
    lineHeight: seasonLayout.lineHeight,
  })
}

function drawCanvasBackground({
  context,
  width,
  height,
}: {
  context: CanvasRenderingContext2D
  width: number
  height: number
}) {
  context.fillStyle = backgroundColor
  context.fillRect(0, 0, width, height)

  context.save()
  context.strokeStyle = "rgba(112, 119, 113, 0.08)"
  context.lineWidth = 2
  context.beginPath()
  context.roundRect(28, 28, width - 56, height - 56, 48)
  context.stroke()
  context.setLineDash([10, 16])
  context.beginPath()
  context.moveTo(width / 2, 28)
  context.lineTo(width / 2, height - 28)
  context.stroke()
  context.restore()
}

function drawFooter({
  context,
  appIcon,
  x,
  y,
  width,
}: {
  context: CanvasRenderingContext2D
  appIcon: HTMLImageElement | null
  x: number
  y: number
  width: number
}) {
  const iconSize = 52
  const textBlockWidth = 132
  const groupWidth = iconSize + 16 + textBlockWidth
  const groupX = x + (width - groupWidth) / 2
  drawBrandMark({ context, appIcon, x: groupX, y: y + 5, size: iconSize })

  context.fillStyle = mutedTextColor
  context.font = "700 15px Arial, sans-serif"
  context.save()
  context.textBaseline = "middle"
  context.fillText("Creado con", groupX + iconSize + 16, y + 22)
  context.restore()

  context.fillStyle = headingTextColor
  context.font = "900 21px Arial, sans-serif"
  context.save()
  context.textBaseline = "middle"
  context.fillText("Smash & Lob", groupX + iconSize + 16, y + 44)
  context.restore()
}

export async function createSeasonFinanceTransparencyImage({
  data,
  locale,
  labels,
}: {
  data: SeasonFinanceTransparencyData
  locale: Locale
  labels: SeasonFinanceTransparencyLabels
}) {
  const expensesRows = Math.max(1, data.expenseRows.length)
  const pendingRows = data.paymentRows.filter((row) => row.status === "pending")
  const hasPendingRows = pendingRows.length > 0
  const paymentsSectionHeight = hasPendingRows
    ? 134 + pendingRows.length * ROW_HEIGHT
    : 154
  const height =
    PAGE_PADDING * 2 +
    HEADER_HEIGHT +
    24 +
    SUMMARY_CARD_HEIGHT * 2 +
    18 +
    paymentsSectionHeight +
    20 +
    76 +
    44 +
    expensesRows * ROW_HEIGHT +
    28 +
    FOOTER_HEIGHT

  const canvas = document.createElement("canvas")
  canvas.width = WIDTH
  canvas.height = height
  const context = canvas.getContext("2d")

  if (!context) throw new Error("canvas_not_available")

  const [appIconImage, leagueLogo] = await Promise.all([
    loadOptionalImage(APP_ICON_PATH),
    loadOptionalImage(data.leagueLogoUrl ?? null),
  ])
  drawCanvasBackground({ context, width: WIDTH, height })

  let y = PAGE_PADDING
  drawExportHeader({
    context,
    data,
    leagueLogo,
    labels,
    x: PAGE_PADDING,
    y,
    width: WIDTH - PAGE_PADDING * 2,
    height: HEADER_HEIGHT,
  })

  y += HEADER_HEIGHT + 24
  const summaryGap = 14
  const summaryWidth = (WIDTH - PAGE_PADDING * 2 - summaryGap) / 2
  const summaryCards = [
    {
      title: labels.summary.collected,
      value: formatMoney(data.collected),
      helper: labels.summary.paidHelper(data.paidCount),
      tone: headingTextColor,
    },
    {
      title: labels.summary.pending,
      value: formatMoney(data.pending),
      helper: labels.summary.pendingHelper(data.pendingCount),
      tone: warningColor,
    },
    {
      title: labels.summary.spent,
      value: formatMoney(data.spent),
      helper: labels.summary.expensesHelper(data.expenseRows.length),
      tone: headingTextColor,
    },
    {
      title: labels.summary.available,
      value: formatMoney(data.available),
      helper: labels.summary.availableHelper(formatMoney(data.availablePerPlayer)),
      tone: data.available < 0 ? negativeColor : positiveColor,
    },
  ]

  summaryCards.forEach((card, index) => {
    const column = index % 2
    const row = Math.floor(index / 2)
    const x = PAGE_PADDING + column * (summaryWidth + summaryGap)
    const cardY = y + row * (SUMMARY_CARD_HEIGHT + 12)
    drawRoundedRect(
      context,
      x,
      cardY,
      summaryWidth,
      SUMMARY_CARD_HEIGHT,
      24,
      surfaceColor,
      borderColor,
    )
    drawText(context, card.title, x + 24, cardY + 18, {
      font: "900 16px Inter, Arial, sans-serif",
      color: mutedTextColor,
    })
    drawText(context, card.value, x + 24, cardY + 44, {
      font: "900 34px Inter, Arial, sans-serif",
      color: card.tone,
    })
    drawText(context, card.helper, x + 24, cardY + 82, {
      font: "700 15px Inter, Arial, sans-serif",
      color: mutedTextColor,
    })
  })

  y += SUMMARY_CARD_HEIGHT * 2 + 28
  drawRoundedRect(
    context,
    PAGE_PADDING,
    y,
    WIDTH - PAGE_PADDING * 2,
    paymentsSectionHeight,
    24,
    surfaceColor,
    borderColor,
  )
  drawText(context, labels.paymentsTitle, PAGE_PADDING + 24, y + 20, {
    font: "900 24px Inter, Arial, sans-serif",
    color: headingTextColor,
  })
  drawText(
    context,
    labels.paymentsSummary(
      data.paidCount,
      data.totalPlayers,
      formatMoney(data.collected),
      formatMoney(data.pending),
    ),
    PAGE_PADDING + 24,
    y + 56,
    {
      font: "700 17px Inter, Arial, sans-serif",
      color: mutedTextColor,
    },
  )

  if (hasPendingRows) {
    drawRoundedRect(
      context,
      PAGE_PADDING + 24,
      y + 88,
      WIDTH - PAGE_PADDING * 2 - 48,
      34,
      16,
      warningSoftColor,
    )
    drawText(context, labels.paymentsPendingTitle, PAGE_PADDING + 40, y + 96, {
      font: "900 14px Inter, Arial, sans-serif",
      color: warningColor,
    })
    pendingRows.forEach((row, index) => {
      const rowY = y + 140 + index * ROW_HEIGHT
      context.strokeStyle = borderColor
      context.beginPath()
      context.moveTo(PAGE_PADDING + 24, rowY - 12)
      context.lineTo(WIDTH - PAGE_PADDING - 24, rowY - 12)
      context.stroke()
      drawText(context, row.playerName, PAGE_PADDING + 24, rowY, {
        font: "800 18px Inter, Arial, sans-serif",
        color: headingTextColor,
      })
      drawText(context, formatMoney(row.expectedAmount), WIDTH - PAGE_PADDING - 24, rowY, {
        font: "900 18px Inter, Arial, sans-serif",
        color: warningColor,
        align: "right",
      })
    })
  } else {
    drawRoundedRect(
      context,
      PAGE_PADDING + 24,
      y + 96,
      WIDTH - PAGE_PADDING * 2 - 48,
      40,
      18,
      softAccentColor,
      "#d2ddd4",
    )
    drawText(context, labels.paymentsCompleteDetail, PAGE_PADDING + 40, y + 107, {
      font: "800 17px Inter, Arial, sans-serif",
      color: positiveColor,
    })
  }

  y += paymentsSectionHeight + 20
  drawRoundedRect(
    context,
    PAGE_PADDING,
    y,
    WIDTH - PAGE_PADDING * 2,
    120 + Math.max(1, data.expenseRows.length) * ROW_HEIGHT,
    24,
    surfaceColor,
    borderColor,
  )
  drawText(context, labels.expensesTitle, PAGE_PADDING + 24, y + 20, {
    font: "900 24px Inter, Arial, sans-serif",
    color: headingTextColor,
  })
  const expensesTableY = y + 58
  drawText(context, labels.expenseColumns.concept, PAGE_PADDING + 24, expensesTableY, {
    font: "900 15px Inter, Arial, sans-serif",
    color: mutedTextColor,
  })
  drawText(context, labels.expenseColumns.date, PAGE_PADDING + 690, expensesTableY, {
    font: "900 15px Inter, Arial, sans-serif",
    color: mutedTextColor,
  })
  drawText(context, labels.expenseColumns.amount, WIDTH - PAGE_PADDING - 24, expensesTableY, {
    font: "900 15px Inter, Arial, sans-serif",
    color: mutedTextColor,
    align: "right",
  })
  if (data.expenseRows.length === 0) {
    drawText(context, labels.noExpenses, PAGE_PADDING + 24, expensesTableY + 34, {
      font: "700 17px Inter, Arial, sans-serif",
      color: mutedTextColor,
    })
  } else {
    data.expenseRows.forEach((expense, index) => {
      const rowY = expensesTableY + 28 + index * ROW_HEIGHT
      context.strokeStyle = borderColor
      context.beginPath()
      context.moveTo(PAGE_PADDING + 24, rowY - 10)
      context.lineTo(WIDTH - PAGE_PADDING - 24, rowY - 10)
      context.stroke()
      drawText(context, expense.title, PAGE_PADDING + 24, rowY, {
        font: "800 17px Inter, Arial, sans-serif",
        color: headingTextColor,
      })
      drawText(context, dateLabel(expense.createdAt, locale), PAGE_PADDING + 690, rowY, {
        font: "700 16px Inter, Arial, sans-serif",
        color: mutedTextColor,
      })
      drawText(context, formatMoney(expense.amount), WIDTH - PAGE_PADDING - 24, rowY, {
        font: "900 17px Inter, Arial, sans-serif",
        color: headingTextColor,
        align: "right",
      })
    })
  }

  y += 120 + Math.max(1, data.expenseRows.length) * ROW_HEIGHT + 28
  drawText(
    context,
    `${labels.generatedLabel}: ${generatedLabel(data.generatedAt, locale)}`,
    PAGE_PADDING,
    y,
    {
      font: "700 14px Arial, sans-serif",
      color: mutedTextColor,
    },
  )
  drawFooter({
    context,
    appIcon: appIconImage,
    x: PAGE_PADDING,
    y: y + 4,
    width: WIDTH - PAGE_PADDING * 2,
  })

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error("png_export_failed"))
    }, "image/png")
  })
}

export function downloadSeasonFinanceTransparencyImage(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
