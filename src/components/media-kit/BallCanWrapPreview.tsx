"use client"

import { useI18n } from "@/i18n/I18nProvider"

import { useEffect, useRef, useState, type ComponentProps, type CSSProperties } from "react"
import { BallCanWrapPremiumPreview } from "@/components/media-kit/BallCanWrapPremiumPreview"

type BallCanWrapPreviewProps = ComponentProps<typeof BallCanWrapPremiumPreview>

const DESIGN_WIDTH_MM = 240
const TRIM_WIDTH_MM = 230
const TRIM_HEIGHT_MM = 130
const HORIZONTAL_CROP_MM = (DESIGN_WIDTH_MM - TRIM_WIDTH_MM) / 2
const BLEED_MM = 3
const PRINT_WIDTH_MM = TRIM_WIDTH_MM + BLEED_MM * 2
const PRINT_HEIGHT_MM = TRIM_HEIGHT_MM + BLEED_MM * 2
const SEAL_TRIM_WIDTH_MM = 60
const SEAL_TRIM_HEIGHT_MM = 15
const SEAL_BLEED_MM = 2
const SEAL_PRINT_WIDTH_MM = SEAL_TRIM_WIDTH_MM + SEAL_BLEED_MM * 2
const SEAL_PRINT_HEIGHT_MM = SEAL_TRIM_HEIGHT_MM + SEAL_BLEED_MM * 2
const CSS_PX_PER_MM = 96 / 25.4

function documentPrintStyles() {
  return Array.from(document.querySelectorAll<HTMLStyleElement | HTMLLinkElement>('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join("\n")
}

function cropMarksMarkup() {
  return `
    <span class="crop crop-tl-h"></span><span class="crop crop-tl-v"></span>
    <span class="crop crop-tr-h"></span><span class="crop crop-tr-v"></span>
    <span class="crop crop-bl-h"></span><span class="crop crop-bl-v"></span>
    <span class="crop crop-br-h"></span><span class="crop crop-br-v"></span>
  `
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function initials(value: string) {
  return value.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SL"
}

export function BallCanWrapPreview(props: BallCanWrapPreviewProps) {
  const { tx } = useI18n()
  const rootRef = useRef<HTMLDivElement>(null)
  const [printError, setPrintError] = useState<string | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const design = root.querySelector('[class~="rounded-[14px]"]') as HTMLElement | null
    const contentLayer = design?.children.item(5) as HTMLElement | null
    const grid = contentLayer?.children.item(2) as HTMLElement | null
    const sections = grid ? Array.from(grid.children).filter((node): node is HTMLElement => node instanceof HTMLElement) : []
    if (sections.length < 3) return

    const [brandSection, leagueSection, playersSection] = sections
    const brandSignature = Array.from(brandSection.children).find((node) => node instanceof HTMLParagraphElement) as HTMLParagraphElement | undefined
    if (brandSignature) brandSignature.style.display = "none"

    leagueSection.querySelector('[data-sl-ball-wrap-signature="true"]')?.remove()

    const signature = document.createElement("div")
    signature.dataset.slBallWrapSignature = "true"
    signature.style.position = "absolute"
    signature.style.left = "0"
    signature.style.right = "0"
    signature.style.bottom = "7px"
    signature.style.display = "flex"
    signature.style.alignItems = "center"
    signature.style.justifyContent = "center"
    signature.style.gap = "2px"
    signature.style.pointerEvents = "none"
    signature.style.opacity = ".72"

    const icon = document.createElement("img")
    icon.src = "/icon-192.png"
    icon.alt = ""
    icon.width = 7
    icon.height = 7
    icon.style.width = "7px"
    icon.style.height = "7px"
    icon.style.borderRadius = "2px"

    const text = document.createElement("div")
    text.style.textAlign = "left"
    text.style.lineHeight = "1"
    text.style.fontFamily = '"Arial Narrow", Arial, sans-serif'

    const overline = document.createElement("div")
    overline.textContent = "CREADO CON"
    overline.style.fontSize = "2.25px"
    overline.style.fontWeight = "800"
    overline.style.letterSpacing = ".24em"
    overline.style.color = props.accent

    const brand = document.createElement("div")
    brand.textContent = "SMASH & LOB"
    brand.style.marginTop = "1px"
    brand.style.fontSize = "2.75px"
    brand.style.fontWeight = "900"
    brand.style.letterSpacing = ".1em"
    brand.style.color = "#f4f1ea"

    text.append(overline, brand)
    signature.append(icon, text)
    leagueSection.style.position = "relative"
    playersSection.style.position = "relative"
    playersSection.style.overflow = "hidden"
    leagueSection.appendChild(signature)

    const welcomeTitle = leagueSection.querySelector(':scope > p:first-child') as HTMLElement | null
    if (welcomeTitle) {
      welcomeTitle.style.position = "absolute"
      welcomeTitle.style.top = "16px"
      welcomeTitle.style.left = "0"
      welcomeTitle.style.right = "0"
      welcomeTitle.style.margin = "0"
    }

    const playersHeader = playersSection.querySelector(':scope > div:first-child') as HTMLElement | null
    if (playersHeader) {
      playersHeader.style.position = "absolute"
      playersHeader.style.top = "16px"
      playersHeader.style.left = "0"
      playersHeader.style.right = "0"
      playersHeader.style.justifyContent = "center"
      const countBadge = playersHeader.querySelector("span") as HTMLElement | null
      if (countBadge) countBadge.style.display = "none"
    }

    const playersList = playersSection.querySelector(':scope > div:last-child') as HTMLElement | null
    if (playersList) {
      playersList.style.marginTop = "26px"
      playersList.style.textAlign = "center"
      playersList.style.overflow = "hidden"
      playersList.querySelectorAll("div").forEach((column) => {
        const element = column as HTMLElement
        element.style.alignItems = "center"
        element.style.textAlign = "center"
        element.style.overflow = "hidden"
        element.style.gap = "3px"
      })
      playersList.querySelectorAll("p").forEach((name) => {
        const element = name as HTMLElement
        element.style.width = "100%"
        element.style.textAlign = "center"
        element.style.fontSize = "0.62rem"
        element.style.lineHeight = "1.08"
        element.style.paddingBottom = "1px"
        element.style.overflow = "visible"
        element.style.textOverflow = "clip"
      })
    }
  }, [props.accent, props.leagueName, props.seasonName, props.players])

  function printPdf() {
    const design = rootRef.current?.querySelector('[class~="rounded-[14px]"]') as HTMLElement | null
    if (!design) {
      setPrintError(tx("No se ha podido preparar la faja para impresión."))
      return
    }

    const bounds = design.getBoundingClientRect()
    if (!bounds.width || !bounds.height) {
      setPrintError(tx("La vista previa todavía no tiene un tamaño válido para impresión."))
      return
    }

    const popup = window.open("", "_blank", "width=1280,height=900")
    if (!popup) {
      setPrintError(tx("El navegador ha bloqueado la ventana de impresión. Permite ventanas emergentes para generar el PDF."))
      return
    }

    setPrintError(null)
    popup.opener = null

    const sourceIsMobile = window.matchMedia("(max-width: 480px)").matches
    const clone = design.cloneNode(true) as HTMLElement
    const scale = (DESIGN_WIDTH_MM * CSS_PX_PER_MM) / bounds.width
    clone.classList.add("sl-ball-wrap-print-design")
    if (sourceIsMobile) clone.classList.add("sl-ball-wrap-print-source-mobile")
    clone.style.setProperty("--ball-wrap-accent", props.accent)
    clone.style.width = `${bounds.width}px`
    clone.style.height = `${bounds.height}px`
    clone.style.minWidth = `${bounds.width}px`
    clone.style.maxWidth = "none"
    clone.style.border = "0"
    clone.style.borderRadius = "0"
    clone.style.boxShadow = "none"
    clone.style.transform = `scale(${scale})`
    clone.style.transformOrigin = "top left"

    const leftGlueGuide = clone.children.item(3) as HTMLElement | null
    const rightGlueGuide = clone.children.item(4) as HTMLElement | null
    leftGlueGuide?.style.setProperty("border-right", "0", "important")
    rightGlueGuide?.style.setProperty("border-left", "0", "important")

    const cloneMarkup = clone.outerHTML
    const safeLeagueName = escapeHtml(props.leagueName)
    const safeLogoUrl = props.leagueLogoUrl ? escapeHtml(props.leagueLogoUrl) : ""
    const leagueMark = safeLogoUrl
      ? `<img src="${safeLogoUrl}" alt="" />`
      : `<span class="seal-fallback">${escapeHtml(initials(props.leagueName))}</span>`

    const sealMarkup = `
      <div class="seal-art">
        <div class="seal-accent-top"></div><div class="seal-accent-bottom"></div>
        <div class="seal-content">
          <div class="seal-logo">${leagueMark}</div>
          <div class="seal-name">${safeLeagueName}</div>
        </div>
      </div>`

    popup.document.open()
    popup.document.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <base href="${window.location.origin}/" />
  <title>Welcome Pack · Adhesivos · ${safeLeagueName}</title>
  ${documentPrintStyles()}
  <style>
    @page sl-ball-can-landscape { size: A4 landscape; margin: 0; }
    @page { size: A4 landscape; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 297mm; min-width: 297mm; max-width: 297mm; height: 210mm; min-height: 210mm; max-height: 210mm; background: #fff; overflow: hidden; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sheet { page: sl-ball-can-landscape; position: relative; width: 297mm; min-width: 297mm; max-width: 297mm; height: 210mm; min-height: 210mm; max-height: 210mm; overflow: hidden; background: #fff; break-after: page; page-break-after: always; }
    .wrap-piece { position: absolute; left: 30.5mm; top: 14mm; width: ${PRINT_WIDTH_MM}mm; height: ${PRINT_HEIGHT_MM}mm; }
    .trim { position: absolute; left: ${BLEED_MM}mm; top: ${BLEED_MM}mm; z-index: 10; width: ${TRIM_WIDTH_MM}mm; height: ${TRIM_HEIGHT_MM}mm; overflow: hidden; }
    .sl-ball-wrap-print-design { position: absolute !important; left: -${HORIZONTAL_CROP_MM}mm !important; top: 0 !important; margin: 0 !important; }
    .bleed-segment { position: absolute; z-index: 1; overflow: hidden; }
    .bleed-copy { position: absolute; width: ${TRIM_WIDTH_MM}mm; height: ${TRIM_HEIGHT_MM}mm; }
    .bleed-copy .sl-ball-wrap-print-design > div:first-child,
    .bleed-copy .sl-ball-wrap-print-design > div:nth-child(n+4) { display: none !important; }
    .bleed-top { left: ${BLEED_MM}mm; top: 0; width: ${TRIM_WIDTH_MM}mm; height: ${BLEED_MM}mm; }
    .bleed-top .bleed-copy { left: 0; top: ${BLEED_MM}mm; transform: scaleY(-1); transform-origin: top center; }
    .bleed-bottom { left: ${BLEED_MM}mm; bottom: 0; width: ${TRIM_WIDTH_MM}mm; height: ${BLEED_MM}mm; }
    .bleed-bottom .bleed-copy { left: 0; bottom: ${BLEED_MM}mm; transform: scaleY(-1); transform-origin: bottom center; }
    .bleed-left { left: 0; top: ${BLEED_MM}mm; width: ${BLEED_MM}mm; height: ${TRIM_HEIGHT_MM}mm; }
    .bleed-left .bleed-copy { left: ${BLEED_MM}mm; top: 0; transform: scaleX(-1); transform-origin: left center; }
    .bleed-right { right: 0; top: ${BLEED_MM}mm; width: ${BLEED_MM}mm; height: ${TRIM_HEIGHT_MM}mm; }
    .bleed-right .bleed-copy { right: ${BLEED_MM}mm; top: 0; transform: scaleX(-1); transform-origin: right center; }
    .bleed-tl { left: 0; top: 0; width: ${BLEED_MM}mm; height: ${BLEED_MM}mm; }
    .bleed-tl .bleed-copy { left: ${BLEED_MM}mm; top: ${BLEED_MM}mm; transform: scale(-1,-1); transform-origin: top left; }
    .bleed-tr { right: 0; top: 0; width: ${BLEED_MM}mm; height: ${BLEED_MM}mm; }
    .bleed-tr .bleed-copy { right: ${BLEED_MM}mm; top: ${BLEED_MM}mm; transform: scale(-1,-1); transform-origin: top right; }
    .bleed-bl { left: 0; bottom: 0; width: ${BLEED_MM}mm; height: ${BLEED_MM}mm; }
    .bleed-bl .bleed-copy { left: ${BLEED_MM}mm; bottom: ${BLEED_MM}mm; transform: scale(-1,-1); transform-origin: bottom left; }
    .bleed-br { right: 0; bottom: 0; width: ${BLEED_MM}mm; height: ${BLEED_MM}mm; }
    .bleed-br .bleed-copy { right: ${BLEED_MM}mm; bottom: ${BLEED_MM}mm; transform: scale(-1,-1); transform-origin: bottom right; }
    .crop { position: absolute; z-index: 50; background: #111; }
    .crop-tl-h, .crop-bl-h { left: -5mm; width: 4mm; height: .18mm; }
    .crop-tr-h, .crop-br-h { right: -5mm; width: 4mm; height: .18mm; }
    .crop-tl-v, .crop-tr-v { top: -5mm; width: .18mm; height: 4mm; }
    .crop-bl-v, .crop-br-v { bottom: -5mm; width: .18mm; height: 4mm; }
    .crop-tl-h, .crop-tr-h { top: ${BLEED_MM}mm; }
    .crop-bl-h, .crop-br-h { bottom: ${BLEED_MM}mm; }
    .crop-tl-v, .crop-bl-v { left: ${BLEED_MM}mm; }
    .crop-tr-v, .crop-br-v { right: ${BLEED_MM}mm; }

    .seals { position: absolute; left: 84.5mm; top: 166mm; display: flex; gap: 0; }
    .seal-piece { position: relative; width: ${SEAL_PRINT_WIDTH_MM}mm; height: ${SEAL_PRINT_HEIGHT_MM}mm; }
    .seal-art { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(circle at 18% 20%, ${props.accent}55 0%, transparent 28%), radial-gradient(circle at 84% 80%, ${props.accent}22 0%, transparent 32%), linear-gradient(155deg,#1a1a1a 0%,#080808 52%,#020202 100%); }
    .seal-art::before { content: ""; position: absolute; inset: 0; background: linear-gradient(135deg,rgba(255,255,255,.07),transparent 32%,rgba(255,255,255,.02) 68%,transparent); }
    .seal-accent-top,.seal-accent-bottom { position:absolute; left:0; right:0; height:.55mm; background:${props.accent}; }
    .seal-accent-top { top:0; } .seal-accent-bottom { bottom:0; opacity:.72; }
    .seal-content { position:absolute; left:${SEAL_BLEED_MM}mm; top:${SEAL_BLEED_MM}mm; width:${SEAL_TRIM_WIDTH_MM}mm; height:${SEAL_TRIM_HEIGHT_MM}mm; display:grid; grid-template-columns:9mm minmax(0,1fr); align-items:center; gap:.8mm; padding:1.5mm 1.4mm; color:white; font-family:Arial,Helvetica,sans-serif; }
    .seal-logo { height:8mm; display:flex; align-items:center; justify-content:center; transform:rotate(90deg); }
    .seal-logo img { display:block; max-width:8.5mm; max-height:7.5mm; object-fit:contain; filter:drop-shadow(0 1mm 1.6mm rgba(0,0,0,.35)); }
    .seal-fallback { font-weight:900; font-size:3mm; letter-spacing:.3mm; }
    .seal-name { min-width:0; text-align:center; font-size:2.8mm; line-height:1; font-weight:900; text-transform:uppercase; letter-spacing:.03mm; white-space:nowrap; }
    .seal-cut-v,.seal-cut-h { position:absolute; background:#111; }
    .seal-cut-v { width:.2mm; height:3mm; } .seal-cut-h { width:3mm; height:.2mm; }
    .seal-tl-v { left:${SEAL_BLEED_MM}mm; top:-4mm; } .seal-tl-h { left:-4mm; top:${SEAL_BLEED_MM}mm; }
    .seal-tr-v { right:${SEAL_BLEED_MM}mm; top:-4mm; } .seal-tr-h { right:-4mm; top:${SEAL_BLEED_MM}mm; }
    .seal-bl-v { left:${SEAL_BLEED_MM}mm; bottom:-4mm; } .seal-bl-h { left:-4mm; bottom:${SEAL_BLEED_MM}mm; }
    .seal-br-v { right:${SEAL_BLEED_MM}mm; bottom:-4mm; } .seal-br-h { right:-4mm; bottom:${SEAL_BLEED_MM}mm; }
    @media print {
      html, body, .sheet { width: 297mm !important; min-width: 297mm !important; max-width: 297mm !important; height: 210mm !important; min-height: 210mm !important; max-height: 210mm !important; }
      .sheet { page: sl-ball-can-landscape; }
    }
    @media screen { body { display:flex; justify-content:center; padding-top:12px; background:#ececec; } .sheet { box-shadow:0 12px 42px rgba(0,0,0,.18); } }
  </style>
</head>
<body>
  <section class="sheet">
    <div class="wrap-piece">
      <div class="bleed-segment bleed-top"><div class="bleed-copy">${cloneMarkup}</div></div>
      <div class="bleed-segment bleed-bottom"><div class="bleed-copy">${cloneMarkup}</div></div>
      <div class="bleed-segment bleed-left"><div class="bleed-copy">${cloneMarkup}</div></div>
      <div class="bleed-segment bleed-right"><div class="bleed-copy">${cloneMarkup}</div></div>
      <div class="bleed-segment bleed-tl"><div class="bleed-copy">${cloneMarkup}</div></div>
      <div class="bleed-segment bleed-tr"><div class="bleed-copy">${cloneMarkup}</div></div>
      <div class="bleed-segment bleed-bl"><div class="bleed-copy">${cloneMarkup}</div></div>
      <div class="bleed-segment bleed-br"><div class="bleed-copy">${cloneMarkup}</div></div>
      <div class="trim">${cloneMarkup}</div>
      ${cropMarksMarkup()}
    </div>
    <div class="seals">
      ${[0, 1].map(() => `<div class="seal-piece">${sealMarkup}<span class="seal-cut-v seal-tl-v"></span><span class="seal-cut-h seal-tl-h"></span><span class="seal-cut-v seal-tr-v"></span><span class="seal-cut-h seal-tr-h"></span><span class="seal-cut-v seal-bl-v"></span><span class="seal-cut-h seal-bl-h"></span><span class="seal-cut-v seal-br-v"></span><span class="seal-cut-h seal-br-h"></span></div>`).join("")}
    </div>
  </section>
  <script>
    (async () => {
      try {
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        await Promise.all(Array.from(document.images).map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        })));
      } finally {
        setTimeout(() => { window.focus(); window.print(); }, 250);
      }
    })();
  <\/script>
</body>
</html>`)
    popup.document.close()
  }

  return (
    <div ref={rootRef} style={{ "--ball-wrap-accent": props.accent } as CSSProperties}>
      <BallCanWrapPremiumPreview {...props} />

      <div className="mx-auto mt-4 w-full max-w-[430px] rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.12em] text-neutral-900">{tx("PDF de impresión · adhesivos")}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{tx("A4 apaisado · 1 faja + 2 precintos · tamaños reales con sangrado y marcas de corte.")}</p>
          </div>
          <button type="button" onClick={printPdf} className="inline-flex shrink-0 items-center justify-center rounded-xl bg-neutral-950 px-4 py-2.5 text-center text-xs font-black uppercase tracking-[.08em] text-white shadow-sm transition hover:bg-neutral-800">{tx("Generar PDF / imprimir")}</button>
        </div>
        {printError ? <p className="mt-2 text-xs font-bold text-red-600">{printError}</p> : null}
      </div>
    </div>
  )
}
