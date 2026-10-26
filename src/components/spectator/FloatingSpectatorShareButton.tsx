"use client"

import { useEffect, useRef, useState } from "react"
import { GeneratedImagePreviewModal } from "@/components/images/GeneratedImagePreviewModal"
import { createOrGetSpectatorInvite } from "@/lib/spectatorInvites"
import { useI18n } from "@/i18n/I18nProvider"
import { DEFAULT_SPECTATOR_INVITE_APPEARANCE } from "@/lib/spectatorTheme"
import { getPublicAppBaseUrl, getPublicInviteUrl } from "@/lib/inviteUrls"

type FloatingSpectatorShareButtonProps = {
  leagueId: string
  leagueName: string
  canShareLeague?: boolean
  onGeneratePlayerInvite?: () => Promise<string | null>
  tournamentId?: string
  tournamentName?: string
  inline?: boolean
}

type ShareType = "spectator" | "player" | "app"

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
  canShareLeague = true,
  onGeneratePlayerInvite,
  tournamentId,
  tournamentName,
  inline = false,
}: FloatingSpectatorShareButtonProps) {
  const { tx } = useI18n()
  const qrRequestIdRef = useRef(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [shareType, setShareType] = useState<ShareType | "">("")
  const urls = useRef<Partial<Record<ShareType, string>>>({})
  const isTournament = Boolean(tournamentId)
  const entityName = isTournament ? (tournamentName ?? leagueName) : leagueName
  const heading = shareType === "spectator" ? (isTournament ? "Seguir este torneo" : "Sigue nuestra liga") : shareType === "player" ? (isTournament ? "Participar en este torneo" : "Únete a nuestra liga") : "Descubre Smash & Lob"
  const description = shareType === "spectator" ? (isTournament ? "Disponible próximamente para seguir este torneo." : "Escanea el QR para seguir los partidos y la clasificación de esta liga.") : shareType === "player" ? (isTournament ? "Escanea el QR, entra con tu cuenta y elige tu perfil de jugador." : "Escanea el QR y entra con tu cuenta para unirte a esta liga como jugador.") : "Escanea el QR para descubrir Smash & Lob y crear tu cuenta."
  const options = ([
    { type: "spectator", label: tx(isTournament ? "Invitar a seguir el torneo" : "Invitar a seguir la liga"), description: tx(isTournament ? "Disponible próximamente." : "Para seguir los partidos y la clasificación como espectador."), available: canShareLeague, disabled: isTournament },
    { type: "player", label: tx(isTournament ? "Invitar a jugar en el torneo" : "Invitar a jugar en la liga"), description: tx(isTournament ? "Para entrar con una cuenta y elegir el perfil correspondiente." : "Para unirse a la liga como jugador."), available: canShareLeague && Boolean(onGeneratePlayerInvite), disabled: false },
    { type: "app", label: tx("Compartir Smash & Lob"), description: tx("Para conocer la app y crear una cuenta."), available: true, disabled: false },
  ] as const).filter(option => option.available || (isTournament && option.type === "spectator"))

  useEffect(() => () => {
    qrRequestIdRef.current += 1
  }, [])

  async function selectShareType(type: ShareType | "") {
    const requestId = ++qrRequestIdRef.current
    setShareType(type)
    setQrSvg(null)
    setInviteUrl(null)
    setIsGenerating(false)
    setError(false)
    setStatusMessage(null)
    if (!type || (type !== "app" && !canShareLeague) || (type === "player" && !onGeneratePlayerInvite)) return
    setIsGenerating(true)

    try {
      let url = urls.current[type]
      if (!url) {
        if (type === "app") url = getPublicAppBaseUrl()
        else if (type === "spectator") url = (await createOrGetSpectatorInvite(leagueId, DEFAULT_SPECTATOR_INVITE_APPEARANCE)).url
        else {
          const code = await onGeneratePlayerInvite!()
          if (!code) throw new Error("invite_failed")
          url = code.startsWith("http") ? code : getPublicInviteUrl(code)
        }
        urls.current[type] = url
      }
      if (qrRequestIdRef.current !== requestId) return
      const { default: createQrCode } = await import("qrcode-generator")
      const qrCode = createQrCode(0, "H")
      qrCode.addData(url, "Byte")
      qrCode.make()
      const logoDataUrl = await loadBrandMarkDataUrl()
      if (qrRequestIdRef.current !== requestId) return
      setQrSvg(createDesignedQrSvg(qrCode, logoDataUrl))
      setInviteUrl(url)
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
    link.download = `smash-lob-${shareType === "app" ? "app" : leagueSlug || "liga"}-qr-${shareType}.svg`
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
          title: tx(shareType === "app" ? "Compartir Smash & Lob" : heading),
          text: tx(description),
          url: inviteUrl,
        })
        setStatusMessage("Enlace compartido")
        return
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === "AbortError") return
      }
    }

    try {
      await navigator.clipboard.writeText(inviteUrl)
      setStatusMessage("Enlace copiado")
    } catch {
      setStatusMessage("No se ha podido compartir el enlace.")
    }
  }

  return (
    <div className="relative z-50 shrink-0">
      <button
        type="button"
        data-tour="floating-share-spectators"
        onClick={() => { setIsOpen(true); if (options.length === 1) void selectShareType(options[0].type) }}
        disabled={isGenerating}
        aria-label={tx("Compartir invitación")}
        title={tx("Compartir invitación")}
        aria-busy={isGenerating}
        className={`${inline ? "inline-flex min-h-10 w-full rounded-xl px-3 text-sm font-black" : "app-floating-control h-[34px] w-[34px] rounded-full"} flex items-center justify-center gap-2 border border-neutral-200 bg-white/90 text-neutral-600 shadow-sm backdrop-blur transition active:scale-[0.96] active:bg-neutral-100 disabled:cursor-wait disabled:opacity-60`}
      >
        <ShareIcon />
        {inline ? tx("Compartir invitación") : null}
      </button>

      <GeneratedImagePreviewModal
        open={isOpen}
        title={shareType === "app" || !canShareLeague ? "Smash & Lob" : entityName}
        description={shareType ? tx(description) : tx("Elige cómo quieres invitar a alguien.")}
        qrHeading={shareType ? tx(heading) : tx("Compartir invitación")}
        qrCaption={tx(shareType === "app" ? "Escanea para abrir Smash & Lob" : isTournament ? "Escanea para abrir el torneo" : "Escanea para abrir la liga")}
        qrFooter={tx(shareType === "app" ? "Crea tu cuenta en Smash & Lob" : isTournament ? "Un enlace para todo el torneo" : "Un enlace para toda la liga")}
        showActions={Boolean(shareType)}
        beforePreview={!shareType ? <div className="space-y-3" role="group" aria-label={tx("Qué quieres compartir")}>
          {options.map((option) => (
            <button key={option.type} type="button" aria-label={option.label} aria-describedby={`share-${option.type}-description`} disabled={option.disabled} onClick={() => void selectShareType(option.type)} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-3 text-left text-sm text-neutral-950 transition active:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50">
              <span><span className="block font-black">{option.label}</span><span id={`share-${option.type}-description`} className="mt-1 block text-xs leading-5 text-neutral-500">{option.description}</span></span><span aria-hidden="true">›</span>
            </button>
          ))}
        </div> : shareType === "player" ? <p className="mb-3 text-xs text-neutral-500">{tx("Se renueva el enlace de jugadores; las invitaciones anteriores dejan de ser válidas.")}</p> : null}
        previewUrl={qrSvg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}` : null}
        loading={isGenerating}
        error={error}
        errorMessage={tx("No se ha podido generar el código QR.")}
        statusMessage={statusMessage}
        previewAlt={`${tx(heading)} · ${shareType === "app" ? "Smash & Lob" : entityName}`}
        variant="spectator-qr"
        portalToBody
        busyAction={null}
        onClose={() => {
          setIsOpen(false)
          qrRequestIdRef.current += 1
          setShareType("")
          setQrSvg(null)
          setInviteUrl(null)
          setError(false)
          setIsGenerating(false)
          setStatusMessage(null)
        }}
        onDownload={downloadQr}
        onShare={shareInvite}
      />
    </div>
  )
}
