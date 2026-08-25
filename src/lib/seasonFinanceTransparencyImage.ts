import { formatMoney } from "@/lib/courtBooking"
import { getIntlLocale } from "@/i18n/leagueText"
import type { Locale } from "@/i18n/translations"
import type { SeasonFinanceTransparencyData } from "@/lib/seasonFinanceTransparency"
import {
  SHARED_EXPORT_APP_ICON_PATH,
  SHARED_EXPORT_HEADER_HEIGHT,
  drawSharedExportFooter,
  drawSharedExportHeader,
  loadSharedExportImage,
} from "@/lib/exportImageChrome"

const WIDTH = 1080
const PAGE_PADDING = 56
const SUMMARY_CARD_HEIGHT = 118
const ROW_HEIGHT = 46
const FOOTER_HEIGHT = 82

const backgroundColor = "#f5f6f2"
const surfaceColor = "#ffffff"
const borderColor = "#dde3dc"
const mutedTextColor = "#667067"
const headingTextColor = "#101611"
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
    SHARED_EXPORT_HEADER_HEIGHT +
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
    loadSharedExportImage(SHARED_EXPORT_APP_ICON_PATH),
    loadSharedExportImage(data.leagueLogoUrl ?? null),
  ])
  drawCanvasBackground({ context, width: WIDTH, height })

  let y = PAGE_PADDING
  drawSharedExportHeader({
    context,
    leagueLogo,
    eyebrow: labels.title,
    leagueName: data.leagueName,
    seasonName: data.seasonName,
    x: PAGE_PADDING,
    y,
    width: WIDTH - PAGE_PADDING * 2,
    height: SHARED_EXPORT_HEADER_HEIGHT,
  })

  y += SHARED_EXPORT_HEADER_HEIGHT + 24
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
  drawSharedExportFooter({
    context,
    appIcon: appIconImage,
    x: PAGE_PADDING,
    y: y + 4,
    width: WIDTH - PAGE_PADDING * 2,
    locale,
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
