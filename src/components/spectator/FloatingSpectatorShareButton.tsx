"use client"

import { useEffect, useRef, useState } from "react"
import { GeneratedImagePreviewModal } from "@/components/images/GeneratedImagePreviewModal"
import { createOrGetSpectatorInvite } from "@/lib/spectatorInvites"
import { useI18n } from "@/i18n/I18nProvider"
import { useTheme } from "@/context/ThemeProvider"
import { getCompetitionAccentColor } from "@/lib/visualStyle"
import type { SpectatorInviteAppearance } from "@/lib/spectatorTheme"

type FloatingSpectatorShareButtonProps = {
  leagueId: string
  leagueName: string
  leagueAccent?: string | null
}

const QR_CELL_SIZE = 12
const QR_QUIET_ZONE = QR_CELL_SIZE * 4
const QR_BRAND_COLOR = "#171719"
const QR_ROUNDED_MODULE_INSET = 1.25
const QR_ROUNDED_MODULE_RADIUS = 2.5

type QrMatrix = {
  getModuleCount: () => number
  isDark: (row: number, column: number) => boolean
}

async function loadBrandMarkDataUrl() {
  try {
    const response = await fetch(new URL("/icon-192.png", window.location.origin), { cache: "force-cache" })
    if (!response.ok) return null

    const blob = await response.blob()
    const reader = new FileReader()
    return await new Promise<string | null>((resolve) => {
      reader.onerror = () => resolve(null)
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function isAlignmentPatternAt(qrCode: QrMatrix, centerRow: number, centerColumn: number) {
  for (let rowOffset = -2; rowOffset <= 2; rowOffset += 1) {
    for (let columnOffset = -2; columnOffset <= 2; columnOffset += 1) {
      const isDarkModule = Math.abs(rowOffset) === 2 || Math.abs(columnOffset) === 2 || (rowOffset === 0 && columnOffset === 0)
      if (qrCode.isDark(centerRow + rowOffset, centerColumn + columnOffset) !== isDarkModule) return false
    }
  }

  return true
}

function findAlignmentPatterns(qrCode: QrMatrix) {
  const moduleCount = qrCode.getModuleCount()
  const cells = new Set<string>()
  const centers: Array<{ row: number; column: number }> = []

  for (let row = 8; row < moduleCount - 8; row += 1) {
    for (let column = 8; column < moduleCount - 8; column += 1) {
      if (!isAlignmentPatternAt(qrCode, row, column)) continue
      centers.push({ row, column })
      for (let rowOffset = -2; rowOffset <= 2; rowOffset += 1) {
        for (let columnOffset = -2; columnOffset <= 2; columnOffset += 1) {
          cells.add(`${row + rowOffset},${column + columnOffset}`)
        }
      }
    }
  }

  return { cells, centers }
}

function isQrFunctionModule(row: number, column: number, moduleCount: number, version: number, alignmentCells: Set<string>) {
  const inFinderAndFormatArea = (row < 9 && column < 9)
    || (row < 9 && column >= moduleCount - 8)
    || (row >= moduleCount - 8 && column < 9)
  const inVersionInfoArea = version >= 7 && (
    (row < 6 && column >= moduleCount - 11 && column < moduleCount - 8)
    || (row >= moduleCount - 11 && row < moduleCount - 8 && column < 6)
  )

  return inFinderAndFormatArea
    || inVersionInfoArea
    || row === 6
    || column === 6
    || alignmentCells.has(`${row},${column}`)
}

function createDesignedQrSvg(qrCode: QrMatrix, logoDataUrl: string | null) {
  const moduleCount = qrCode.getModuleCount()
  const version = (moduleCount - 17) / 4
  const svgSize = moduleCount * QR_CELL_SIZE + QR_QUIET_ZONE * 2
  const alignmentPatterns = findAlignmentPatterns(qrCode)
  const squareModules: string[] = []
  const roundedModules: string[] = []

  for (let row = 0; row < moduleCount; row += 1) {
    for (let column = 0; column < moduleCount; column += 1) {
      if (!qrCode.isDark(row, column)) continue

      const x = QR_QUIET_ZONE + column * QR_CELL_SIZE
      const y = QR_QUIET_ZONE + row * QR_CELL_SIZE
      if (isQrFunctionModule(row, column, moduleCount, version, alignmentPatterns.cells)) {
        squareModules.push(`M${x},${y}l${QR_CELL_SIZE},0 0,${QR_CELL_SIZE} -${QR_CELL_SIZE},0 0,-${QR_CELL_SIZE}z `)
      } else {
        const moduleSize = QR_CELL_SIZE - QR_ROUNDED_MODULE_INSET * 2
        roundedModules.push(`<rect x="${x + QR_ROUNDED_MODULE_INSET}" y="${y + QR_ROUNDED_MODULE_INSET}" width="${moduleSize}" height="${moduleSize}" rx="${QR_ROUNDED_MODULE_RADIUS}"/>`)
      }
    }
  }

  const qrMark = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${svgSize}px" height="${svgSize}px" viewBox="0 0 ${svgSize} ${svgSize}" preserveAspectRatio="xMidYMid meet"><rect width="100%" height="100%" fill="#fff"/><path d="${squareModules.join("")}" fill="${QR_BRAND_COLOR}"/><g fill="${QR_BRAND_COLOR}">${roundedModules.join("")}</g>`
  const qrCenter = (moduleCount - 1) / 2
  const logoCoversAlignmentPattern = alignmentPatterns.centers.some(({ row, column }) => (
    Math.abs(row - qrCenter) <= 6 && Math.abs(column - qrCenter) <= 6
  ))
  if (!logoDataUrl || logoCoversAlignmentPattern) return `${qrMark}</svg>`

  const badgeSize = QR_CELL_SIZE * 8
  const logoSize = QR_CELL_SIZE * 6
  const badgePosition = (svgSize - badgeSize) / 2
  const logoPosition = (svgSize - logoSize) / 2
  const brandMark = `<g aria-label="Smash &amp; Lob"><rect x="${badgePosition}" y="${badgePosition}" width="${badgeSize}" height="${badgeSize}" rx="16" fill="#fff" stroke="#e5e5e5" stroke-width="2"/><image href="${logoDataUrl}" x="${logoPosition}" y="${logoPosition}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/></g>`

  return `${qrMark}${brandMark}</svg>`
}

function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[15px] w-[15px]"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51 15.42 17.49" />
      <path d="M15.41 6.51 8.59 10.49" />
    </svg>
  )
}

export function FloatingSpectatorShareButton(props: FloatingSpectatorShareButtonProps) {
  return <FloatingSpectatorShareButtonForLeague key={props.leagueId} {...props} />
}

function FloatingSpectatorShareButtonForLeague({
  leagueId,
  leagueName,
  leagueAccent,
}: FloatingSpectatorShareButtonProps) {
  const { tx } = useI18n()
  const { themeMode, visualStyle, palette, competitionAccent, leagueAccent: storedLeagueAccent } = useTheme()
  const qrRequestIdRef = useRef(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => () => {
    qrRequestIdRef.current += 1
  }, [])

  async function handleOpen() {
    if (isGenerating || qrSvg) {
      setIsOpen(true)
      return
    }

    setIsOpen(true)
    setIsGenerating(true)
    setError(false)
    setStatusMessage(null)
    const requestId = ++qrRequestIdRef.current

    try {
      const resolvedLeagueAccent = leagueAccent ?? storedLeagueAccent
      const appearance: SpectatorInviteAppearance = {
        visualStyle,
        baseTheme: visualStyle === "competition"
          ? "dark"
          : themeMode === "system"
            ? (document.documentElement.classList.contains("dark") ? "dark" : "light")
            : themeMode,
        palette,
        competitionAccent,
        accentColor: visualStyle === "competition"
          ? getCompetitionAccentColor(competitionAccent, resolvedLeagueAccent)
          : resolvedLeagueAccent,
      }
      const invite = await createOrGetSpectatorInvite(leagueId, appearance)
      const { default: createQrCode } = await import("qrcode-generator")
      const qrCode = createQrCode(0, "H")
      qrCode.addData(invite.url, "Byte")
      qrCode.make()
      const logoDataUrl = await loadBrandMarkDataUrl()
      if (qrRequestIdRef.current !== requestId) return
      setQrSvg(createDesignedQrSvg(qrCode, logoDataUrl))
      setInviteUrl(invite.url)
    } catch {
      if (qrRequestIdRef.current === requestId) setError(true)
    } finally {
      if (qrRequestIdRef.current === requestId) setIsGenerating(false)
    }
  }

  function downloadQr() {
    if (!qrSvg) return

    const blobUrl = URL.createObjectURL(
      new Blob([qrSvg], { type: "image/svg+xml;charset=utf-8" }),
    )
    const link = document.createElement("a")
    const leagueSlug = leagueName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    link.href = blobUrl
    link.download = `smash-lob-${leagueSlug || "liga"}-qr-espectador.svg`
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1_000)
  }

  async function shareInvite() {
    if (!inviteUrl) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${tx("Código QR de espectadores")} · ${leagueName}`,
          text: tx("Comparte el enlace de esta liga para que cualquiera pueda verla como espectador."),
          url: inviteUrl,
        })
        setStatusMessage("Enlace de espectador compartido.")
        return
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === "AbortError") return
      }
    }

    try {
      await navigator.clipboard.writeText(inviteUrl)
      setStatusMessage("Enlace de espectador copiado")
    } catch {
      setStatusMessage("No se ha podido compartir el enlace.")
    }
  }

  return (
    <div className="relative z-50 shrink-0">
      <button
        type="button"
        data-tour="floating-share-spectators"
        onClick={() => void handleOpen()}
        disabled={isGenerating}
        aria-label={tx("Compartir enlace de espectador")}
        title={tx("Compartir con espectadores")}
        aria-busy={isGenerating}
        className="app-floating-control flex h-[34px] w-[34px] items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-600 shadow-sm backdrop-blur transition active:scale-[0.96] active:bg-neutral-100 disabled:cursor-wait disabled:opacity-60"
      >
        <ShareIcon />
      </button>

      <GeneratedImagePreviewModal
        open={isOpen}
        title={leagueName}
        description={tx("Escanea el código para entrar como espectador y seguir la liga.")}
        previewUrl={qrSvg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}` : null}
        loading={isGenerating}
        error={error}
        errorMessage={tx("No se ha podido generar el código QR.")}
        statusMessage={statusMessage}
        previewAlt={`${tx("Código QR de espectadores")} · ${leagueName}`}
        variant="spectator-qr"
        portalToBody
        busyAction={null}
        onClose={() => {
          setIsOpen(false)
          setStatusMessage(null)
        }}
        onDownload={downloadQr}
        onShare={shareInvite}
      />
    </div>
  )
}
