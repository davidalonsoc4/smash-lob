"use client"

import { useI18n } from "@/i18n/I18nProvider"

import Image from "next/image"

export type BallCanSealPrintProps = {
  leagueName: string
  leagueLogoUrl?: string | null
  accent: string
}

export const BALL_CAN_SEAL_PRINT = {
  trimWidthMm: 50,
  trimHeightMm: 15,
  bleedMm: 2,
  printWidthMm: 54,
  printHeightMm: 19,
} as const

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

export function buildBallCanSealPrintStyles(accent: string) {
  return `
    .sl-ball-can-seal-piece {
      position: relative;
      width: ${BALL_CAN_SEAL_PRINT.printWidthMm}mm;
      height: ${BALL_CAN_SEAL_PRINT.printHeightMm}mm;
      overflow: visible;
      font-family: Arial, Helvetica, sans-serif;
    }
    .sl-ball-can-seal-art {
      position: absolute;
      inset: 0;
      overflow: hidden;
      background:
        radial-gradient(circle at 18% 20%, ${accent}55 0%, transparent 28%),
        radial-gradient(circle at 84% 80%, ${accent}22 0%, transparent 32%),
        linear-gradient(155deg, #1a1a1a 0%, #080808 52%, #020202 100%);
    }
    .sl-ball-can-seal-art::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,.07), transparent 32%, rgba(255,255,255,.02) 68%, transparent);
    }
    .sl-ball-can-seal-accent-top,
    .sl-ball-can-seal-accent-bottom {
      position: absolute;
      left: 0;
      right: 0;
      height: .55mm;
      background: ${accent};
    }
    .sl-ball-can-seal-accent-top { top: 0; }
    .sl-ball-can-seal-accent-bottom { bottom: 0; opacity: .72; }
    .sl-ball-can-seal-content {
      position: absolute;
      left: ${BALL_CAN_SEAL_PRINT.bleedMm}mm;
      top: ${BALL_CAN_SEAL_PRINT.bleedMm}mm;
      width: ${BALL_CAN_SEAL_PRINT.trimWidthMm}mm;
      height: ${BALL_CAN_SEAL_PRINT.trimHeightMm}mm;
      display: grid;
      grid-template-columns: 9mm minmax(0, 1fr);
      align-items: center;
      gap: .8mm;
      padding: 1.5mm 1.4mm;
      color: white;
    }
    .sl-ball-can-seal-logo {
      height: 8mm;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .sl-ball-can-seal-logo img {
      display: block;
      max-width: 8.5mm;
      max-height: 7.5mm;
      object-fit: contain;
      filter: drop-shadow(0 1mm 1.6mm rgba(0,0,0,.35));
    }
    .sl-ball-can-seal-fallback {
      font-weight: 900;
      font-size: 3mm;
      letter-spacing: .3mm;
    }
    .sl-ball-can-seal-name {
      min-width: 0;
      text-align: center;
      font-size: 2.8mm;
      line-height: 1;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .03mm;
      white-space: nowrap;
    }
    .sl-ball-can-seal-crop { position: absolute; background: #111; }
    .sl-ball-can-seal-crop.v { width: .2mm; height: 3mm; }
    .sl-ball-can-seal-crop.h { width: 3mm; height: .2mm; }
    .sl-ball-can-seal-tl-v { left: ${BALL_CAN_SEAL_PRINT.bleedMm}mm; top: -4mm; }
    .sl-ball-can-seal-tl-h { left: -4mm; top: ${BALL_CAN_SEAL_PRINT.bleedMm}mm; }
    .sl-ball-can-seal-tr-v { right: ${BALL_CAN_SEAL_PRINT.bleedMm}mm; top: -4mm; }
    .sl-ball-can-seal-tr-h { right: -4mm; top: ${BALL_CAN_SEAL_PRINT.bleedMm}mm; }
    .sl-ball-can-seal-bl-v { left: ${BALL_CAN_SEAL_PRINT.bleedMm}mm; bottom: -4mm; }
    .sl-ball-can-seal-bl-h { left: -4mm; bottom: ${BALL_CAN_SEAL_PRINT.bleedMm}mm; }
    .sl-ball-can-seal-br-v { right: ${BALL_CAN_SEAL_PRINT.bleedMm}mm; bottom: -4mm; }
    .sl-ball-can-seal-br-h { right: -4mm; bottom: ${BALL_CAN_SEAL_PRINT.bleedMm}mm; }
  `
}

export function buildBallCanSealPrintPieceHtml({ leagueName, leagueLogoUrl }: BallCanSealPrintProps) {
  const safeLeagueName = escapeHtml(leagueName)
  const safeLogoUrl = leagueLogoUrl ? escapeHtml(leagueLogoUrl) : ""
  const leagueMark = safeLogoUrl
    ? `<img src="${safeLogoUrl}" alt="" />`
    : `<span class="sl-ball-can-seal-fallback">${escapeHtml(initials(leagueName))}</span>`

  return `
    <div class="sl-ball-can-seal-piece">
      <div class="sl-ball-can-seal-art">
        <div class="sl-ball-can-seal-accent-top"></div>
        <div class="sl-ball-can-seal-accent-bottom"></div>
        <div class="sl-ball-can-seal-content">
          <div class="sl-ball-can-seal-logo">${leagueMark}</div>
          <div class="sl-ball-can-seal-name">${safeLeagueName}</div>
        </div>
      </div>
      <span class="sl-ball-can-seal-crop v sl-ball-can-seal-tl-v"></span><span class="sl-ball-can-seal-crop h sl-ball-can-seal-tl-h"></span>
      <span class="sl-ball-can-seal-crop v sl-ball-can-seal-tr-v"></span><span class="sl-ball-can-seal-crop h sl-ball-can-seal-tr-h"></span>
      <span class="sl-ball-can-seal-crop v sl-ball-can-seal-bl-v"></span><span class="sl-ball-can-seal-crop h sl-ball-can-seal-bl-h"></span>
      <span class="sl-ball-can-seal-crop v sl-ball-can-seal-br-v"></span><span class="sl-ball-can-seal-crop h sl-ball-can-seal-br-h"></span>
    </div>
  `
}

export function BallCanSealPreview({ leagueName, leagueLogoUrl, accent }: BallCanSealPrintProps) {
  const { tx } = useI18n()
  return (
    <div className="mx-auto mt-4 w-full max-w-[430px] rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[.12em] text-neutral-900">{tx("Precinto del bote · primera versión")}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{tx("Genérico de liga · logo + nombre · reutilizable entre temporadas.")}</p>
        </div>
        <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[0.5625rem] font-black uppercase tracking-[.08em] text-neutral-700">50 × 15 mm</span>
      </div>

      <div className="rounded-[18px] bg-[#f4f1ea] p-4 ring-1 ring-neutral-200">
        <div
          data-sl-ball-can-seal-design="true"
          className="relative mx-auto w-full max-w-[330px] overflow-hidden rounded-[9px] border border-black/40 text-white shadow-[0_16px_30px_rgba(0,0,0,.28)]"
          style={{
            aspectRatio: `${BALL_CAN_SEAL_PRINT.trimWidthMm} / ${BALL_CAN_SEAL_PRINT.trimHeightMm}`,
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
          <div className="relative z-10 flex h-full items-center justify-center px-2">
            <div className="flex min-w-0 items-center justify-center gap-1.5">
              <div className="flex shrink-0 items-center justify-center">
                {leagueLogoUrl ? (
                  <Image unoptimized src={leagueLogoUrl} alt={leagueName} width={70} height={44} className="h-auto max-h-[38px] w-auto max-w-[40px] object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,.38)]" />
                ) : (
                  <span className="text-base font-black tracking-[.08em] text-white">{initials(leagueName)}</span>
                )}
              </div>
              <p className="whitespace-nowrap text-[0.68rem] font-black uppercase tracking-[.01em] text-white">{leagueName}</p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[0.625rem] font-semibold leading-4 text-neutral-500">
        {tx("Corte 50 × 15 mm · sangrado 2 mm · impresión 54 × 19 mm · vinilo adhesivo mate. Se incluye automáticamente dos veces en el PDF de la faja.")} </p>
    </div>
  )
}
