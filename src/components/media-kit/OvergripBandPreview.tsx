"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { normalizeImageUrl } from "@/lib/imageUrl"
import {
  WELCOME_PACK_OVERGRIP_BAND,
  getWelcomePackGeneralFontFamily,
  getWelcomePackPlayerNameFontFamily,
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

const CSS_PX_PER_MM = 96 / 25.4

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
        width={112}
        height={62}
        className="relative z-10 h-auto max-h-[58px] w-auto max-w-[112px] object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,.38)]"
      />
    )
  }

  const initials = league.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SL"
  return <span className="text-xl font-black tracking-[.22em] text-white">{initials}</span>
}

export function OvergripBandPreview({ league, seasonName, playerName, accent, playerFont, generalFont }: Props) {
  const designRef = useRef<HTMLDivElement>(null)
  const [printError, setPrintError] = useState<string | null>(null)
  const generalFamily = getWelcomePackGeneralFontFamily(generalFont)
  const playerFamily = getWelcomePackPlayerNameFontFamily(playerFont)
  const [playerFirstName, ...playerSurnameParts] = playerName.trim().split(/\s+/)
  const playerSurname = playerSurnameParts.join(" ")
  const sideReservePercent = (WELCOME_PACK_OVERGRIP_BAND.sideReserveMm / WELCOME_PACK_OVERGRIP_BAND.widthMm) * 100

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
      setPrintError("No se ha podido preparar el fajín para impresión.")
      return
    }

    const bounds = design.getBoundingClientRect()
    if (!bounds.width || !bounds.height) {
      setPrintError("La vista previa todavía no tiene un tamaño válido para impresión.")
      return
    }

    const popup = window.open("", "_blank", "width=1000,height=800")
    if (!popup) {
      setPrintError("El navegador ha bloqueado la ventana de impresión. Permite ventanas emergentes para generar el PDF.")
      return
    }

    setPrintError(null)
    popup.opener = null

    const clone = design.cloneNode(true) as HTMLElement
    const scale = (WELCOME_PACK_OVERGRIP_BAND.widthMm * CSS_PX_PER_MM) / bounds.width
    clone.style.width = `${bounds.width}px`
    clone.style.height = `${bounds.height}px`
    clone.style.minWidth = `${bounds.width}px`
    clone.style.maxWidth = "none"
    clone.style.margin = "0"
    clone.style.borderRadius = "0"
    clone.style.boxShadow = "none"
    clone.style.transform = `scale(${scale})`
    clone.style.transformOrigin = "top left"

    popup.document.open()
    popup.document.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <base href="${window.location.origin}/" />
  <title>Welcome Pack · Fajín overgrip · ${league.name}</title>
  ${documentPrintStyles()}
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 210mm; min-height: 297mm; background: #fff; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sheet { width: 210mm; height: 297mm; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .piece { position: relative; width: ${WELCOME_PACK_OVERGRIP_BAND.widthMm}mm; height: ${WELCOME_PACK_OVERGRIP_BAND.heightMm}mm; overflow: hidden; }
    .piece > * { position: absolute !important; left: 0 !important; top: 0 !important; }
    @media screen { body { display: flex; justify-content: center; padding-top: 12px; background: #ececec; } .sheet { background: white; box-shadow: 0 12px 42px rgba(0,0,0,.18); } }
  </style>
</head>
<body>
  <section class="sheet"><div class="piece">${clone.outerHTML}</div></section>
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
    popup.document.close()
  }

  return (
    <div className="mx-auto w-full max-w-[430px]">
      <div className="mb-3 flex items-center justify-between gap-3 text-[0.625rem] font-black uppercase tracking-[.12em] text-neutral-500">
        <span>Vista previa · fajín completo</span>
        <span>{WELCOME_PACK_OVERGRIP_BAND.widthMm} × {WELCOME_PACK_OVERGRIP_BAND.heightMm} mm · definitivo</span>
      </div>

      <div className="rounded-[22px] border border-neutral-200 bg-[#f4f1ea] p-3 shadow-[0_24px_58px_rgba(0,0,0,.18)]">
        <div
          ref={designRef}
          className="relative mx-auto w-full max-w-[360px] overflow-hidden rounded-[11px] border border-black/40 text-white shadow-[0_16px_30px_rgba(0,0,0,.28)]"
          style={{ aspectRatio: `${WELCOME_PACK_OVERGRIP_BAND.widthMm} / ${WELCOME_PACK_OVERGRIP_BAND.heightMm}`, backgroundImage: premiumBackground, fontFamily: generalFamily }}
        >
          <div className="absolute inset-[4px] rounded-[7px] border border-white/12" />
          <div className="absolute inset-x-0 top-0 h-[2px]" style={{ backgroundColor: accent }} />
          <div className="absolute inset-y-0 left-0 border-r border-dashed border-white/25 bg-black/10" style={{ width: `${sideReservePercent}%` }} />
          <div className="absolute inset-y-0 right-0 border-l border-dashed border-white/25 bg-black/10" style={{ width: `${sideReservePercent}%` }} />
          <div className="absolute inset-y-0 left-[40%] border-l border-dashed border-white/10" />
          <div className="absolute inset-y-0 right-[40%] border-l border-dashed border-white/10" />
          <div className="absolute -left-8 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full border border-white/7" />
          <div className="absolute right-[-25px] top-[-20px] h-24 w-24 rounded-full border border-white/7" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.07),transparent_27%,rgba(255,255,255,.03)_60%,transparent)] mix-blend-screen" />

          <div className="relative z-10 h-full">
            <div className="absolute left-[10%] top-0 flex h-full w-[28%] min-w-0 items-center gap-0 px-1">
              <div className="relative -mr-1 flex h-[24px] w-[34px] shrink-0 items-center justify-center">
                <div className="absolute inset-x-1 top-1/2 h-3 -translate-y-1/2 rounded-full bg-white/8 blur-md" />
                <div className="relative scale-[.42]"><LeagueLogo league={league} /></div>
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 whitespace-normal text-[0.3125rem] font-black uppercase leading-[1.05] tracking-[.03em] text-white">{league.name}</p>
                <p className="mt-px truncate text-[0.21875rem] font-bold uppercase tracking-[.06em] text-white/58">{seasonName}</p>
              </div>
            </div>

            <div className="absolute left-1/2 top-[52%] flex w-[20%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center">
              <p className="text-[0.21875rem] font-black uppercase tracking-[.14em]" style={{ color: accent }}>Smash &amp; Lob</p>
              <p className="mt-px text-[0.46875rem] font-black uppercase tracking-[.05em] text-white">Welcome Pack</p>
              <div className="mt-px grid grid-cols-[12px_3px_12px] items-center gap-1">
                <span className="h-px bg-white/20" /><span className="h-[2px] w-[2px] rotate-45 rounded-[1px]" style={{ backgroundColor: accent }} /><span className="h-px bg-white/20" />
              </div>
            </div>

            <div className="absolute right-[10%] top-0 flex h-full w-[24%] min-w-0 items-center justify-start pl-1 text-left">
              <p className="flex min-w-0 flex-col text-[0.46875rem] leading-[1.02] text-white" style={{ fontFamily: playerFamily }}>
                <span className="block truncate">{playerFirstName || playerName}</span>
                {playerSurname ? <span className="block truncate">{playerSurname}</span> : null}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-[0.625rem] font-semibold leading-4 text-neutral-600 ring-1 ring-neutral-200">
        <strong className="text-neutral-900">Material:</strong> {WELCOME_PACK_OVERGRIP_BAND.material} {WELCOME_PACK_OVERGRIP_BAND.minGsm}–{WELCOME_PACK_OVERGRIP_BAND.maxGsm} g/m². Medida definitiva: {WELCOME_PACK_OVERGRIP_BAND.widthMm} × {WELCOME_PACK_OVERGRIP_BAND.heightMm} mm.
      </div>

      <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.12em] text-neutral-900">PDF de impresión · papel</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">A4 · fajín a tamaño real · misma composición que la preview.</p>
          </div>
          <button type="button" onClick={printPdf} className="shrink-0 rounded-xl bg-neutral-950 px-4 py-2.5 text-xs font-black uppercase tracking-[.08em] text-white shadow-sm transition hover:bg-neutral-800">Generar PDF / imprimir</button>
        </div>
        {printError ? <p className="mt-2 text-xs font-bold text-red-600">{printError}</p> : null}
      </div>
    </div>
  )
}
