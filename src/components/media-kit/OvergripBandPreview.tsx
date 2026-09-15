"use client"

import { useI18n } from "@/i18n/I18nProvider"

import { useRef, useState } from "react"
import Image from "next/image"
import { normalizeImageUrl } from "@/lib/imageUrl"
import {
  WELCOME_PACK_OVERGRIP_BAND,
  getWelcomePackGeneralFontFamily,
  type WelcomePackGeneralFont,
  type WelcomePackPlayerNameFont,
} from "@/lib/mediaKitWelcomePack"

type League = { name: string; logoUrl?: string | null }

type Props = {
  league: League
  seasonName: string
  playerName: string
  accent: string
  playerFont: WelcomePackPlayerNameFont
  generalFont: WelcomePackGeneralFont
}

const OVERGRIP_BLEED_MM = 2
const PRINTED_WIDTH_MM = WELCOME_PACK_OVERGRIP_BAND.widthMm + OVERGRIP_BLEED_MM * 2
const PRINTED_HEIGHT_MM = WELCOME_PACK_OVERGRIP_BAND.heightMm + OVERGRIP_BLEED_MM * 2
const A4_LANDSCAPE_WIDTH_MM = 297
const A4_LANDSCAPE_HEIGHT_MM = 210
const COLUMNS_PER_A4 = Math.floor(A4_LANDSCAPE_WIDTH_MM / PRINTED_WIDTH_MM)
const ROWS_PER_A4 = Math.floor(A4_LANDSCAPE_HEIGHT_MM / PRINTED_HEIGHT_MM)
const ITEMS_PER_A4 = COLUMNS_PER_A4 * ROWS_PER_A4

function documentPrintStyles() {
  return Array.from(document.querySelectorAll<HTMLStyleElement | HTMLLinkElement>('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join("\n")
}

function LeagueLogo({ league }: { league: League }) {
  const normalizedLogoUrl = league.logoUrl ? normalizeImageUrl(league.logoUrl) : null

  if (normalizedLogoUrl) {
    return (
      <Image
        unoptimized
        src={normalizedLogoUrl}
        alt={league.name}
        width={160}
        height={90}
        className="h-auto max-h-[42px] w-auto max-w-[72px] object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,.34)]"
      />
    )
  }

  const initials = league.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SL"
  return <span className="text-[1.2rem] font-black tracking-[.16em] text-white">{initials}</span>
}

function cropMarksMarkup() {
  return `<span class="crop crop-tl-h"></span><span class="crop crop-tl-v"></span>
    <span class="crop crop-tr-h"></span><span class="crop crop-tr-v"></span>
    <span class="crop crop-bl-h"></span><span class="crop crop-bl-v"></span>
    <span class="crop crop-br-h"></span><span class="crop crop-br-v"></span>`
}

export function OvergripBandPreview(props: Props) {
  const { tx } = useI18n()
  const { league, accent, generalFont } = props
  const designRef = useRef<HTMLDivElement>(null)
  const [printError, setPrintError] = useState<string | null>(null)
  const generalFamily = getWelcomePackGeneralFontFamily(generalFont)

  const premiumBackground = [
    `radial-gradient(circle at 16% 12%, ${accent}4A 0%, transparent 27%)`,
    "radial-gradient(circle at 82% 28%, rgba(255,255,255,.15) 0%, transparent 20%)",
    `radial-gradient(circle at 62% 110%, ${accent}2C 0%, transparent 38%)`,
    "linear-gradient(135deg, rgba(255,255,255,.055) 0%, transparent 28%, rgba(255,255,255,.025) 62%, transparent 100%)",
    "linear-gradient(165deg, #1A1A1A 0%, #090909 52%, #020202 100%)",
  ].join(", ")

  function printPdf() {
    const design = designRef.current
    if (!design) {
      setPrintError(tx("No se ha podido preparar el fajín para impresión."))
      return
    }

    const popup = window.open("", "_blank", "width=1200,height=900")
    if (!popup) {
      setPrintError(tx("El navegador ha bloqueado la ventana de impresión. Permite ventanas emergentes para generar el PDF."))
      return
    }

    setPrintError(null)
    popup.opener = null

    const copies = Array.from({ length: ITEMS_PER_A4 }, () => {
      const clone = design.cloneNode(true) as HTMLElement
      clone.style.width = `${PRINTED_WIDTH_MM}mm`
      clone.style.height = `${PRINTED_HEIGHT_MM}mm`
      clone.style.maxWidth = "none"
      clone.style.margin = "0"
      clone.style.padding = `${OVERGRIP_BLEED_MM}mm`
      clone.style.borderRadius = "0"
      clone.style.boxShadow = "none"
      clone.style.borderWidth = "0"
      clone.style.aspectRatio = "auto"
      return `<div class="slot">${clone.outerHTML}${cropMarksMarkup()}</div>`
    }).join("")

    popup.document.open()
    popup.document.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <base href="${window.location.origin}/" />
  <title>Welcome Pack</title>
  ${documentPrintStyles()}
  <style>
    @page sl-overgrip-landscape { size: A4 landscape; margin: 0; }
    @page { size: A4 landscape; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 297mm; height: 210mm; background: #fff; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sheet {
      page: sl-overgrip-landscape;
      width: 297mm;
      height: 210mm;
      display: grid;
      grid-template-columns: repeat(${COLUMNS_PER_A4}, ${PRINTED_WIDTH_MM}mm);
      grid-template-rows: repeat(${ROWS_PER_A4}, ${PRINTED_HEIGHT_MM}mm);
      place-content: center;
      overflow: hidden;
    }
    .slot {
      position: relative;
      width: ${PRINTED_WIDTH_MM}mm;
      height: ${PRINTED_HEIGHT_MM}mm;
      overflow: visible;
    }
    .slot > [data-overgrip-band-design="true"] {
      width: ${PRINTED_WIDTH_MM}mm !important;
      height: ${PRINTED_HEIGHT_MM}mm !important;
      max-width: none !important;
      margin: 0 !important;
      padding: ${OVERGRIP_BLEED_MM}mm !important;
      overflow: hidden !important;
    }
    .crop { position: absolute; display: block; background: #111; z-index: 50; }
    .crop-tl-h, .crop-bl-h { left: 0.35mm; width: 1.25mm; height: 0.12mm; }
    .crop-tr-h, .crop-br-h { right: 0.35mm; width: 1.25mm; height: 0.12mm; }
    .crop-tl-v, .crop-tr-v { top: 0.35mm; width: 0.12mm; height: 1.25mm; }
    .crop-bl-v, .crop-br-v { bottom: 0.35mm; width: 0.12mm; height: 1.25mm; }
    .crop-tl-h, .crop-tr-h { top: ${OVERGRIP_BLEED_MM}mm; }
    .crop-bl-h, .crop-br-h { bottom: ${OVERGRIP_BLEED_MM}mm; }
    .crop-tl-v, .crop-bl-v { left: ${OVERGRIP_BLEED_MM}mm; }
    .crop-tr-v, .crop-br-v { right: ${OVERGRIP_BLEED_MM}mm; }
    @media screen {
      body { display: flex; justify-content: center; background: #ececec; }
      .sheet { background: white; box-shadow: 0 12px 42px rgba(0,0,0,.18); }
    }
  </style>
</head>
<body>
  <section class="sheet">${copies}</section>
  <script>
    (async () => {
      try {
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        await Promise.all(Array.from(document.images).map((img) => img.complete ? Promise.resolve() : new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        })));
      } finally {
        setTimeout(() => { window.focus(); window.print(); }, 150);
      }
    })();
  <\/script>
</body>
</html>`)
    popup.document.title = `${tx("Fajín del overgrip")} · ${league.name} · ${ITEMS_PER_A4}`
    popup.document.close()
  }

  return (
    <div className="mx-auto w-full max-w-[430px]">
      <div className="mb-3 flex items-center justify-between gap-3 text-[0.625rem] font-black uppercase tracking-[.12em] text-neutral-500">
        <span>{tx("Vista previa · fajín completo")}</span>
        <span>{WELCOME_PACK_OVERGRIP_BAND.widthMm} × {WELCOME_PACK_OVERGRIP_BAND.heightMm} {tx("mm · definitivo")}</span>
      </div>

      <div className="rounded-[22px] border border-neutral-200 bg-[#f4f1ea] p-3 shadow-[0_24px_58px_rgba(0,0,0,.18)]">
        <div
          ref={designRef}
          data-overgrip-band-design="true"
          className="relative mx-auto w-full max-w-[360px] overflow-hidden rounded-[11px] border border-black/40 text-white shadow-[0_16px_30px_rgba(0,0,0,.28)]"
          style={{
            aspectRatio: `${WELCOME_PACK_OVERGRIP_BAND.widthMm} / ${WELCOME_PACK_OVERGRIP_BAND.heightMm}`,
            backgroundImage: premiumBackground,
            fontFamily: generalFamily,
          }}
        >
          <div className="absolute inset-x-0 top-0 h-[2px]" style={{ backgroundColor: accent }} />
          <div className="absolute inset-x-0 bottom-0 h-px opacity-35" style={{ backgroundColor: accent }} />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.07),transparent_27%,rgba(255,255,255,.03)_60%,transparent)] mix-blend-screen" />

          <div className="relative z-10 flex h-full items-center justify-center gap-3 px-[8.333%] text-center">
            <div className="flex h-[42px] w-[72px] shrink-0 items-center justify-center">
              <LeagueLogo league={league} />
            </div>
            <p className="min-w-0 max-w-[64%] text-balance text-[0.92rem] font-black uppercase leading-[0.96] tracking-[.015em] text-white">
              {league.name}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-[0.625rem] font-semibold leading-4 text-neutral-600 ring-1 ring-neutral-200">
        <strong className="text-neutral-900">{tx("Material:")}</strong> {tx(WELCOME_PACK_OVERGRIP_BAND.material)} {WELCOME_PACK_OVERGRIP_BAND.minGsm}–{WELCOME_PACK_OVERGRIP_BAND.maxGsm} {tx("g/m². Medida final:")} {WELCOME_PACK_OVERGRIP_BAND.widthMm} × {WELCOME_PACK_OVERGRIP_BAND.heightMm} {tx("mm · sangrado:")} {OVERGRIP_BLEED_MM} {tx("mm por lado.")} </div>

      <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.12em] text-neutral-900">{tx("PDF de impresión · papel")}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{tx("A4 apaisado ·")} {ITEMS_PER_A4} {tx("fajines · tamaño real · sangrado y marcas de corte.")}</p>
          </div>
          <button type="button" onClick={printPdf} className="inline-flex shrink-0 items-center justify-center rounded-xl bg-neutral-950 px-4 py-2.5 text-center text-xs font-black uppercase tracking-[.08em] text-white shadow-sm transition hover:bg-neutral-800">{tx("Generar PDF / imprimir")}</button>
        </div>
        {printError ? <p className="mt-2 text-xs font-bold text-red-600">{printError}</p> : null}
      </div>
    </div>
  )
}
