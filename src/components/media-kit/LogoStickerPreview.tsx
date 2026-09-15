"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"
import {
  buildLogoStickerPrintHtml,
  getLogoStickerLayout,
  LOGO_STICKER_WIDTH_OPTIONS_MM,
} from "@/lib/logoStickerPrint"

export function LogoStickerPreview({ logoUrl, leagueName, playerCount }: { logoUrl: string | null; leagueName: string; playerCount: number }) {
  const { tx } = useI18n()
  const [widthMm, setWidthMm] = useState<number>(50)
  const [aspectRatio, setAspectRatio] = useState(1)
  const [printError, setPrintError] = useState<string | null>(null)

  useEffect(() => {
    if (!logoUrl) return
    const image = new window.Image()
    image.onload = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) setAspectRatio(image.naturalWidth / image.naturalHeight)
    }
    image.src = logoUrl
  }, [logoUrl])

  const layout = useMemo(() => getLogoStickerLayout(widthMm, aspectRatio, playerCount), [aspectRatio, playerCount, widthMm])

  function printPdf() {
    if (!logoUrl || playerCount < 1) return
    const popup = window.open("", "_blank", "width=1100,height=900")
    if (!popup) {
      setPrintError(tx("El navegador ha bloqueado la ventana de impresión. Permite ventanas emergentes para imprimir las pegatinas."))
      return
    }
    setPrintError(null)
    popup.opener = null
    popup.document.open()
    popup.document.write(buildLogoStickerPrintHtml({ logoUrl, leagueName, widthMm, stickerCount: playerCount, aspectRatio }))
    popup.document.close()
  }

  return (
    <AppCard className="lg:sticky lg:top-3">
      <p className="type-caption font-black uppercase tracking-[.16em] text-neutral-500">{tx("Pegatinas de logo")}</p>
      <h2 className="mt-1 text-base font-black text-neutral-950">{tx("Solo logo · prueba de pegatinas")}</h2>
      <p className="mt-1 text-xs font-medium leading-5 text-neutral-500">{tx("Se genera como mínimo una pegatina por jugador. Los huecos restantes se completan con logos de 50 mm.")}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="text-xs font-black text-neutral-700">
          {tx("Ancho del logo")}
          <select value={widthMm} onChange={(event) => setWidthMm(Number(event.target.value))} className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-950">
            {LOGO_STICKER_WIDTH_OPTIONS_MM.map((option) => <option key={option} value={option}>{option} mm</option>)}
          </select>
        </label>
        <div className="rounded-xl bg-amber-50 px-3 py-2 text-right ring-1 ring-amber-200">
          <p className="text-[0.5625rem] font-black uppercase tracking-[.12em] text-amber-700">{tx("Impresión")}</p>
          <p className="mt-0.5 text-sm font-black text-neutral-950">{tx(layout.orientationLabel)}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-neutral-50 p-2"><p className="text-[0.5625rem] font-black uppercase tracking-[.1em] text-neutral-400">{tx("Mínimo")}</p><p className="mt-1 text-xs font-black">{playerCount}</p></div>
        <div className="rounded-xl bg-neutral-50 p-2"><p className="text-[0.5625rem] font-black uppercase tracking-[.1em] text-neutral-400">{tx("Por hoja")}</p><p className="mt-1 text-xs font-black">{layout.itemsPerSheet}</p></div>
        <div className="rounded-xl bg-neutral-50 p-2"><p className="text-[0.5625rem] font-black uppercase tracking-[.1em] text-neutral-400">{tx("Hojas")}</p><p className="mt-1 text-xs font-black">{layout.sheetCount}</p></div>
      </div>

      <div className="mt-4 flex min-h-[180px] items-center justify-center rounded-2xl bg-neutral-950 p-6">
        {logoUrl ? <Image unoptimized src={logoUrl} alt={leagueName} width={220} height={150} style={{ width: `${Math.min(widthMm * 2.2, 220)}px` }} className="h-auto max-h-[150px] object-contain" /> : <span className="text-xs font-bold text-neutral-400">{tx("Esta liga no tiene logo")}</span>}
      </div>

      <button type="button" disabled={!logoUrl || playerCount < 1} onClick={printPdf} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-neutral-950 px-4 text-xs font-black text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400">
        {tx("Generar PDF de pegatinas")}
      </button>
      <p className="mt-2 text-[0.6875rem] font-bold leading-4 text-neutral-500">{tx(`Selecciona ${layout.orientationLabel} y escala 100 % en el diálogo de impresión.`)}</p>
      {printError ? <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{printError}</p> : null}
    </AppCard>
  )
}
