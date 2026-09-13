"use client"

import Image from "next/image"

type Props = {
  leagueName: string
  leagueLogoUrl?: string | null
  accent: string
}

const TRIM_WIDTH_MM = 50
const TRIM_HEIGHT_MM = 15
const BLEED_MM = 2
const PRINT_WIDTH_MM = TRIM_WIDTH_MM + BLEED_MM * 2
const PRINT_HEIGHT_MM = TRIM_HEIGHT_MM + BLEED_MM * 2

function initials(value: string) {
  return value.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SL"
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export function BallCanSealPreview({ leagueName, leagueLogoUrl, accent }: Props) {
  function printTest() {
    const popup = window.open("", "_blank", "width=1000,height=800")
    if (!popup) return

    const safeLeagueName = escapeHtml(leagueName)
    const safeLogoUrl = leagueLogoUrl ? escapeHtml(leagueLogoUrl) : ""
    const leagueMark = safeLogoUrl
      ? `<img src="${safeLogoUrl}" alt="" />`
      : `<span class="fallback">${escapeHtml(initials(leagueName))}</span>`

    popup.opener = null
    popup.document.open()
    popup.document.write(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Precinto del bote · ${safeLeagueName}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 210mm; height: 297mm; background: white; }
  body { font-family: Arial, Helvetica, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { width: 210mm; height: 297mm; display: flex; align-items: center; justify-content: center; }
  .piece-wrap { position: relative; width: ${PRINT_WIDTH_MM}mm; height: ${PRINT_HEIGHT_MM}mm; }
  .art {
    position: absolute; inset: 0; overflow: hidden;
    background:
      radial-gradient(circle at 18% 20%, ${accent}55 0%, transparent 28%),
      radial-gradient(circle at 84% 80%, ${accent}22 0%, transparent 32%),
      linear-gradient(155deg, #1a1a1a 0%, #080808 52%, #020202 100%);
  }
  .art::before { content: ""; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,.07), transparent 32%, rgba(255,255,255,.02) 68%, transparent); }
  .accent-top, .accent-bottom { position: absolute; left: 0; right: 0; height: .55mm; background: ${accent}; }
  .accent-top { top: 0; }
  .accent-bottom { bottom: 0; opacity: .72; }
  .content { position: absolute; left: ${BLEED_MM}mm; top: ${BLEED_MM}mm; width: ${TRIM_WIDTH_MM}mm; height: ${TRIM_HEIGHT_MM}mm; display: grid; grid-template-columns: 10mm .35mm minmax(0, 1fr); align-items: center; gap: 2mm; padding: 1.7mm 2.2mm; color: white; }
  .logo { height: 8mm; display: flex; align-items: center; justify-content: center; }
  .logo img { display: block; max-width: 9mm; max-height: 7.5mm; object-fit: contain; filter: drop-shadow(0 1mm 1.6mm rgba(0,0,0,.35)); }
  .fallback { font-weight: 900; font-size: 3mm; letter-spacing: .45mm; }
  .divider { width: .35mm; height: 6.5mm; background: ${accent}; border-radius: 999px; }
  .name { min-width: 0; text-align: center; font-size: 2.35mm; line-height: 1; font-weight: 900; text-transform: uppercase; letter-spacing: .08mm; white-space: nowrap; }
  .crop { position: absolute; background: #111; }
  .crop.v { width: .2mm; height: 3mm; }
  .crop.h { width: 3mm; height: .2mm; }
  .tl-v { left: ${BLEED_MM}mm; top: -4mm; } .tl-h { left: -4mm; top: ${BLEED_MM}mm; }
  .tr-v { right: ${BLEED_MM}mm; top: -4mm; } .tr-h { right: -4mm; top: ${BLEED_MM}mm; }
  .bl-v { left: ${BLEED_MM}mm; bottom: -4mm; } .bl-h { left: -4mm; bottom: ${BLEED_MM}mm; }
  .br-v { right: ${BLEED_MM}mm; bottom: -4mm; } .br-h { right: -4mm; bottom: ${BLEED_MM}mm; }
  @media screen { body { background: #ececec; } .sheet { margin: auto; background: white; box-shadow: 0 0 30px rgba(0,0,0,.18); } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="piece-wrap">
      <div class="art">
        <div class="accent-top"></div><div class="accent-bottom"></div>
        <div class="content">
          <div class="logo">${leagueMark}</div>
          <div class="divider"></div>
          <div class="name">${safeLeagueName}</div>
        </div>
      </div>
      <span class="crop v tl-v"></span><span class="crop h tl-h"></span>
      <span class="crop v tr-v"></span><span class="crop h tr-h"></span>
      <span class="crop v bl-v"></span><span class="crop h bl-h"></span>
      <span class="crop v br-v"></span><span class="crop h br-h"></span>
    </div>
  </div>
<script>
  window.addEventListener('load', () => setTimeout(() => window.print(), 250));
<\/script>
</body>
</html>`)
    popup.document.close()
  }

  return (
    <div className="mx-auto mt-4 w-full max-w-[430px] rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[.12em] text-neutral-900">Precinto del bote · primera versión</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">Genérico de liga · logo + nombre · reutilizable entre temporadas.</p>
        </div>
        <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[0.5625rem] font-black uppercase tracking-[.08em] text-neutral-700">50 × 15 mm</span>
      </div>

      <div className="rounded-[18px] bg-[#f4f1ea] p-4 ring-1 ring-neutral-200">
        <div
          className="relative mx-auto w-full max-w-[330px] overflow-hidden rounded-[9px] border border-black/40 text-white shadow-[0_16px_30px_rgba(0,0,0,.28)]"
          style={{
            aspectRatio: `${TRIM_WIDTH_MM} / ${TRIM_HEIGHT_MM}`,
            backgroundImage: [
              `radial-gradient(circle at 18% 20%, ${accent}55 0%, transparent 28%)`,
              `radial-gradient(circle at 84% 80%, ${accent}22 0%, transparent 32%)`,
              "linear-gradient(155deg, #1a1a1a 0%, #080808 52%, #020202 100%)",
            ].join(", "),
          }}
        >
          <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: accent }} />
          <div className="absolute inset-x-0 bottom-0 h-[2px] opacity-70" style={{ backgroundColor: accent }} />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.07),transparent_32%,rgba(255,255,255,.02)_68%,transparent)]" />
          <div className="relative z-10 grid h-full grid-cols-[52px_2px_minmax(0,1fr)] items-center gap-2 px-3">
            <div className="flex min-w-0 items-center justify-center">
              {leagueLogoUrl ? (
                <Image unoptimized src={leagueLogoUrl} alt={leagueName} width={70} height={44} className="h-auto max-h-[38px] w-auto max-w-[44px] object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,.38)]" />
              ) : (
                <span className="text-base font-black tracking-[.12em] text-white">{initials(leagueName)}</span>
              )}
            </div>
            <span className="h-[36px] w-[2px] rounded-full" style={{ backgroundColor: accent }} />
            <p className="whitespace-nowrap text-center text-[0.54rem] font-black uppercase tracking-[.025em] text-white">{leagueName}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.625rem] font-semibold leading-4 text-neutral-500">Corte 50 × 15 mm · sangrado 2 mm · impresión 54 × 19 mm · vinilo adhesivo mate.</p>
        <button type="button" onClick={printTest} className="shrink-0 rounded-xl bg-neutral-950 px-4 py-2.5 text-xs font-black uppercase tracking-[.08em] text-white shadow-sm transition hover:bg-neutral-800">Imprimir prueba 100 %</button>
      </div>
    </div>
  )
}
