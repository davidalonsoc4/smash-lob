"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"
import {
  buildWelcomePackStickerPrintHtml,
  getMaxWelcomePackStickerWidthMm,
  getWelcomePackStickerLayout,
  WELCOME_PACK_STICKER_ARTWORKS,
  type WelcomePackStickerId,
} from "@/lib/welcomePackStickers"

export function WelcomePackStickers({ logoUrl, leagueName }: { logoUrl: string | null; leagueName: string }) {
  const { tx } = useI18n()
  const [selectedIds, setSelectedIds] = useState<WelcomePackStickerId[]>(WELCOME_PACK_STICKER_ARTWORKS.map(({ id }) => id))
  const [copiesPerDesign, setCopiesPerDesign] = useState(1), [ink, setInk] = useState<"light-gray" | "white">("light-gray")
  const maxWidth = useMemo(() => getMaxWelcomePackStickerWidthMm(selectedIds, copiesPerDesign), [copiesPerDesign, selectedIds])
  const [requestedWidthMm, setRequestedWidthMm] = useState(() => getMaxWelcomePackStickerWidthMm(WELCOME_PACK_STICKER_ARTWORKS.map(({ id }) => id)))
  const widthMm = Math.min(requestedWidthMm, maxWidth)
  const [logoAspectRatio, setLogoAspectRatio] = useState(1)
  const [printError, setPrintError] = useState<string | null>(null)

  useEffect(() => {
    if (!logoUrl) return
    const image = new window.Image()
    image.onload = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) setLogoAspectRatio(image.naturalWidth / image.naturalHeight)
    }
    image.src = logoUrl
  }, [logoUrl])

  const layout = useMemo(() => getWelcomePackStickerLayout({
    ids: selectedIds,
    stickerWidthMm: widthMm,
    copiesPerDesign,
    logoUrl,
    leagueName,
    logoAspectRatio,
    ink,
  }), [copiesPerDesign, ink, leagueName, logoAspectRatio, logoUrl, selectedIds, widthMm])

  function toggle(id: WelcomePackStickerId) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function printPdf() {
    if (!layout) return
    const popup = window.open("", "_blank", "width=1100,height=900")
    if (!popup) {
      setPrintError(tx("El navegador ha bloqueado la ventana de impresión. Permite ventanas emergentes para imprimir las pegatinas."))
      return
    }
    setPrintError(null)
    popup.opener = null
    popup.document.open()
    popup.document.write(buildWelcomePackStickerPrintHtml({ layout, leagueName }))
    popup.document.close()
  }

  const sheetWidth = layout?.page.widthMm ?? 210
  const sheetHeight = layout?.page.heightMm ?? 297

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] lg:items-start">
      <AppCard>
        <p className="type-caption font-black uppercase tracking-[.16em] text-neutral-500">{tx("Pegatinas")}</p>
        <h2 className="mt-1 text-base font-black text-neutral-950">{tx("Selecciona los diseños y el tamaño")}</h2>
        <p className="mt-1 text-xs font-medium leading-5 text-neutral-500">{tx("Se conserva la transparencia. Los diseños se colocan sin hueco interior y los huecos restantes se completan con el logo de la liga.")}</p>

        <fieldset className="mt-4">
          <legend className="text-xs font-black text-neutral-700">{tx("Color de impresión")}</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {([
              { id: "light-gray", label: "Gris claro", sampleClass: "bg-[#D6D6D6]" },
              { id: "white", label: "Blanco", sampleClass: "bg-white" },
            ] as const).map((option) => (
              <button key={option.id} type="button" aria-pressed={ink === option.id} onClick={() => setInk(option.id)} className={`flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-black transition ${ink === option.id ? "border-neutral-950 bg-neutral-50 ring-2 ring-neutral-950/10" : "border-neutral-200 bg-white hover:border-neutral-400"}`}>
                <span aria-hidden="true" className={`h-4 w-4 rounded-full border border-neutral-400 ${option.sampleClass}`} />
                {tx(option.label)}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {WELCOME_PACK_STICKER_ARTWORKS.map((artwork) => {
            const selected = selectedIds.includes(artwork.id)
            return (
              <button key={artwork.id} type="button" aria-pressed={selected} onClick={() => toggle(artwork.id)} className={`group overflow-hidden rounded-xl border text-left transition ${selected ? "border-neutral-950 bg-neutral-50 ring-2 ring-neutral-950/10" : "border-neutral-200 bg-white opacity-65 hover:opacity-100"}`}>
                <span className="relative block h-24 bg-neutral-900">
                <Image unoptimized src={ink === "white" ? artwork.whiteSrc : artwork.src} alt={artwork.label} fill sizes="(max-width: 640px) 45vw, 180px" className="object-contain p-2" />
                  <span className={`absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full text-[0.625rem] font-black ${selected ? "bg-lime-300 text-neutral-950" : "bg-white/80 text-neutral-500"}`}>{selected ? "✓" : "+"}</span>
                </span>
                <span className="block truncate px-2.5 py-2 text-[0.6875rem] font-black text-neutral-800">{artwork.label}</span>
              </button>
            )
          })}
        </div>

        <label htmlFor="welcome-pack-sticker-copies" className="mt-4 block text-xs font-black text-neutral-700">{tx("Copias de cada diseño")}
          <select id="welcome-pack-sticker-copies" value={copiesPerDesign} onChange={(event) => setCopiesPerDesign(Number(event.target.value))} className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-950">
            {Array.from({ length: 20 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} {count === 1 ? tx("copia") : tx("copias")}</option>)}
          </select>
        </label>

        <div className="mt-4 rounded-2xl bg-neutral-50 p-3 ring-1 ring-neutral-200">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="welcome-pack-sticker-width" className="text-xs font-black text-neutral-700">{tx("Ancho de cada pegatina")}</label>
            <span className="rounded-lg bg-white px-2.5 py-1 text-sm font-black text-neutral-950 ring-1 ring-neutral-200">{widthMm} mm</span>
          </div>
          <input id="welcome-pack-sticker-width" type="range" min={maxWidth ? 10 : 1} max={Math.max(10, maxWidth)} step={1} value={Math.min(widthMm, Math.max(10, maxWidth))} disabled={!layout} onChange={(event) => setRequestedWidthMm(Number(event.target.value))} className="mt-3 w-full accent-lime-500" />
          <p className="mt-1 text-[0.6875rem] font-semibold leading-4 text-neutral-500">{tx("Tamaño máximo para que todos los diseños seleccionados quepan en una sola hoja A4.")} <strong className="text-neutral-800">{maxWidth} mm</strong></p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-neutral-50 p-2"><p className="text-[0.5625rem] font-black uppercase tracking-[.1em] text-neutral-400">{tx("Diseños")}</p><p className="mt-1 text-xs font-black">{layout?.artworkCount ?? 0}</p></div>
          <div className="rounded-xl bg-neutral-50 p-2"><p className="text-[0.5625rem] font-black uppercase tracking-[.1em] text-neutral-400">{tx("Logo de relleno")}</p><p className="mt-1 text-xs font-black">{layout?.logoCount ?? 0}</p></div>
          <div className="rounded-xl bg-neutral-50 p-2"><p className="text-[0.5625rem] font-black uppercase tracking-[.1em] text-neutral-400">{tx("Orientación")}</p><p className="mt-1 text-xs font-black">{layout?.orientation === "landscape" ? tx("Horizontal") : tx("Vertical")}</p></div>
        </div>
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[0.6875rem] font-bold leading-4 text-amber-900 ring-1 ring-amber-200">{tx("Separación entre diseños: 0 mm. Margen exterior de seguridad: 5 mm; imprime al 100 %.")}</p>
        {!logoUrl ? <p className="mt-2 text-xs font-semibold text-neutral-500">{tx("Esta liga no tiene logo; se omite el relleno de los huecos.")}</p> : null}
        <button type="button" disabled={!layout} onClick={printPdf} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-neutral-950 px-4 text-center text-xs font-black text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400">{tx("Generar PDF A4 · una hoja")}</button>
        {printError ? <p role="alert" className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{printError}</p> : null}
      </AppCard>

      <AppCard className="lg:sticky lg:top-3">
        <div className="flex items-center justify-between gap-2">
          <div><p className="type-caption font-black uppercase tracking-[.16em] text-neutral-500">{tx("Vista previa")}</p><h2 className="mt-1 text-base font-black">{layout?.orientationLabel ?? "A4"}</h2></div>
          <span className="rounded-full bg-lime-100 px-2.5 py-1 text-[0.625rem] font-black text-lime-900">{widthMm} mm</span>
        </div>
        <div className="mt-4 flex justify-center rounded-2xl bg-neutral-100 p-4">
          <div className="relative w-full overflow-hidden bg-white shadow-lg" style={{ aspectRatio: `${sheetWidth} / ${sheetHeight}`, maxWidth: layout?.orientation === "landscape" ? 420 : 300 }}>
            {layout?.placements.map((placement) => (
              <div key={placement.id} className="absolute" style={{ left: `${placement.xMm / sheetWidth * 100}%`, top: `${placement.yMm / sheetHeight * 100}%`, width: `${placement.widthMm / sheetWidth * 100}%`, height: `${placement.heightMm / sheetHeight * 100}%` }}>
                <Image unoptimized src={placement.src} alt={placement.label} fill sizes="300px" className="object-fill" />
              </div>
            ))}
            {!layout ? <div className="absolute inset-0 grid place-items-center p-4 text-center text-xs font-bold text-neutral-400">{tx("Selecciona al menos un diseño")}</div> : null}
            <div className="pointer-events-none absolute inset-0 border border-neutral-300" />
          </div>
        </div>
        <p className="mt-3 text-center text-[0.6875rem] font-semibold leading-4 text-neutral-500">{layout ? `${selectedIds.length} ${tx("diseños")}, ${copiesPerDesign} ${copiesPerDesign === 1 ? tx("copia por diseño") : tx("copias por diseño")} · ${layout.artworkCount} ${tx("pegatinas")}${layout.logoCount ? ` · ${layout.logoCount} ${tx("logos de relleno automáticos")}` : ""}` : tx("Activa una o más pegatinas para preparar la hoja.")}</p>
      </AppCard>
    </div>
  )
}
