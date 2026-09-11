"use client"

import { useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { isSafeImageUrl, normalizeImageUrl } from "@/lib/imageUrl"
import { extractLogoAccentPalette } from "@/lib/logoAccentPalette"
import {
  WELCOME_PACK_BAG_SEAL,
  buildWelcomePackBagSealPrintHtml,
  getWelcomePackBagSealSheetCount,
  normalizeWelcomePackAccentColor,
} from "@/lib/mediaKitWelcomePack"

const futurePieces = ["Faja del bote", "Precinto del bote", "Fajín del overgrip", "Sello de temporada", "Pegatinas", "Carnet oficial"]

function SealFace({ league, seasonName, playerName, accent, reversed = false }: {
  league: { name: string; logoUrl?: string | null }
  seasonName: string
  playerName: string
  accent: string
  reversed?: boolean
}) {
  return (
    <div
      className={`relative flex h-1/2 overflow-hidden bg-[linear-gradient(160deg,#151515_0%,#080808_48%,#030303_100%)] ${reversed ? "rotate-180" : ""}`}
    >
      <div className="absolute inset-[6px] border border-white/15" />
      <div className="absolute inset-x-0 top-0 h-[5px]" style={{ backgroundColor: accent }} />
      <div className="absolute right-3 top-3 h-8 w-8 border-r-2 border-t-2" style={{ borderColor: accent }} />
      <div className="absolute bottom-3 left-3 h-8 w-8 border-b border-l border-white/30" />
      <div className="relative z-10 flex w-full flex-col items-center justify-center px-5 pb-4 pt-5 text-center">
        <p className="mb-2 text-[8px] font-black uppercase tracking-[.28em]" style={{ color: accent }}>Welcome Pack</p>
        <div className="grid h-12 w-12 place-items-center rounded-full border p-1 shadow-[0_0_0_1px_rgba(255,255,255,.08)]" style={{ borderColor: accent }}>
          <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-white p-1">
            <LeagueLogo league={league} size="sm" className="!h-8 !w-8 !rounded-full" />
          </span>
        </div>
        <p className="mt-2 max-w-[140px] truncate text-[8px] font-black uppercase tracking-[.09em] text-white/55">{league.name}</p>
        <p className="mt-2 max-w-[150px] text-balance font-serif text-[17px] font-bold leading-[.95] text-white">{playerName}</p>
        <div className="mt-3 grid grid-cols-[32px_7px_32px] items-center gap-2">
          <span className="h-px bg-white/25" /><span className="h-[6px] w-[6px] rotate-45" style={{ backgroundColor: accent }} /><span className="h-px bg-white/25" />
        </div>
        <p className="mt-2 text-[8px] font-black uppercase tracking-[.13em] text-white/75">{seasonName}</p>
        <p className="mt-1 text-[6px] font-black uppercase tracking-[.25em] text-white/25">Smash &amp; Lob</p>
      </div>
    </div>
  )
}

function SealPreview(props: { league: { name: string; logoUrl?: string | null }; seasonName: string; playerName: string; accent: string }) {
  return (
    <div className="mx-auto w-full max-w-[250px]">
      <div className="mb-2 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[.12em] text-neutral-500">
        <span>Vista previa</span><span>{WELCOME_PACK_BAG_SEAL.trimWidthMm} × {WELCOME_PACK_BAG_SEAL.trimHeightMm} mm · provisional</span>
      </div>
      <div className="relative mx-auto aspect-[45/120] w-[180px] overflow-hidden bg-neutral-950 shadow-[0_24px_55px_rgba(0,0,0,.32)] ring-1 ring-neutral-800">
        <SealFace {...props} /><SealFace {...props} reversed />
        <div className="pointer-events-none absolute inset-x-[-18px] top-1/2 z-20 flex -translate-y-1/2 items-center gap-1">
          <span className="h-px flex-1 border-t border-dashed border-amber-400/80" /><span className="rounded-full bg-amber-300 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[.1em] text-neutral-950">pliegue</span><span className="h-px flex-1 border-t border-dashed border-amber-400/80" />
        </div>
      </div>
      <p className="mt-3 text-center text-[10px] font-bold leading-4 text-neutral-500">Diseño único. La cara inferior se gira 180° para cerrar la bolsa con ambas caras legibles.</p>
    </div>
  )
}

export default function WelcomePackMediaKitPage() {
  const { tx } = useI18n()
  const { isLeagueAdmin } = useLeagueAccess()
  const { seasons } = useSeasonSettings()
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)
  const { activeLeague, activeSeason, players } = useCurrentLeagueData(selectedSeasonId)
  const leagueSeasons = seasons.filter((season) => season.leagueId === activeLeague.id)
  const sortedPlayers = useMemo(() => [...players].sort((a, b) => a.displayName.localeCompare(b.displayName, "es", { sensitivity: "base" })), [players])
  const [selectedPlayerId, setSelectedPlayerId] = useState("")
  const [accentColor, setAccentColor] = useState("#D7A544")
  const [palette, setPalette] = useState<string[]>([])
  const [printError, setPrintError] = useState<string | null>(null)
  const normalizedLogoUrl = isSafeImageUrl(activeLeague.logoUrl) ? normalizeImageUrl(activeLeague.logoUrl) : null

  useEffect(() => {
    if (!sortedPlayers.some((player) => player.id === selectedPlayerId)) setSelectedPlayerId(sortedPlayers[0]?.id ?? "")
  }, [selectedPlayerId, sortedPlayers])

  useEffect(() => {
    let active = true
    setPalette([])
    setAccentColor("#D7A544")
    if (normalizedLogoUrl) void extractLogoAccentPalette(normalizedLogoUrl).then((colors) => {
      if (!active) return
      setPalette(colors)
      if (colors[0]) setAccentColor(colors[0])
    }).catch(() => { if (active) setPalette([]) })
    return () => { active = false }
  }, [activeLeague.id, normalizedLogoUrl])

  if (!isLeagueAdmin(activeLeague.id)) return <div className="space-y-4"><BackButton fallbackHref="/" label={tx("Volver")} /><AppCard><p className="font-black">{tx("Acceso restringido")}</p></AppCard></div>

  const selectedPlayer = sortedPlayers.find((player) => player.id === selectedPlayerId) ?? sortedPlayers[0]
  const playerName = selectedPlayer?.displayName ?? tx("Jugador")
  const seasonName = activeSeason.name || tx("Temporada")
  const accent = normalizeWelcomePackAccentColor(accentColor)
  const sheetCount = getWelcomePackBagSealSheetCount(sortedPlayers.length)

  function printAll() {
    if (!sortedPlayers.length) return
    const popup = window.open("", "_blank", "width=1100,height=900")
    if (!popup) return setPrintError(tx("El navegador ha bloqueado la ventana de impresión. Permite ventanas emergentes para imprimir el Welcome Pack."))
    setPrintError(null)
    popup.opener = null
    popup.document.open()
    popup.document.write(buildWelcomePackBagSealPrintHtml({ players: sortedPlayers.map((p) => ({ id: p.id, displayName: p.displayName })), leagueName: activeLeague.name, seasonName, logoUrl: normalizedLogoUrl, accentColor: accent }))
    popup.document.close()
  }

  return (
    <div className="space-y-4">
      <header className="app-page-header"><BackButton fallbackHref="/admin/media-kit" label={tx("Volver")} /><div><p className="type-caption font-black uppercase tracking-[.16em] text-neutral-500">Media Kit</p><h1 className="type-page-title">Welcome Pack</h1></div></header>

      <AppCard className="overflow-hidden !p-0">
        <div className="bg-neutral-950 px-4 py-4 text-white"><p className="type-caption font-black uppercase tracking-[.18em] text-amber-300">Producción física</p><h2 className="mt-1 text-lg font-black">Welcome Pack · {activeLeague.name}</h2><p className="mt-1 text-xs font-medium leading-5 text-neutral-300">Previsualiza cada pieza, ajusta su identidad y prepara la impresión conjunta de toda la temporada.</p></div>
        <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-end"><label className="text-xs font-black text-neutral-700">{tx("Temporada")}<select value={activeSeason.id} onChange={(e) => setSelectedSeasonId(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-950 outline-none focus:border-neutral-950">{leagueSeasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}</select></label><div className="rounded-xl bg-amber-50 px-3 py-2 text-[10px] font-bold leading-4 text-amber-900 ring-1 ring-amber-200">Medidas provisionales hasta medir y probar la bolsa real a escala 100 %.</div></div>
      </AppCard>

      <section className="space-y-2"><div className="flex items-end justify-between gap-3"><div><p className="type-caption font-black uppercase tracking-[.16em] text-neutral-500">Piezas</p><h2 className="text-base font-black text-neutral-950">Diseños del Welcome Pack</h2></div><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black text-neutral-600">1 disponible</span></div><AppCard className="!border-neutral-950 !bg-neutral-950 text-white"><p className="type-caption font-black uppercase tracking-[.16em] text-amber-300">Activo</p><div className="mt-1 flex items-start justify-between gap-3"><div><h3 className="text-base font-black">Precinto de bolsa</h3><p className="mt-1 text-xs font-medium leading-5 text-neutral-300">Personalizado por jugador · adhesivo · doble cara espejo.</p></div><span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.08em]">Diseño único</span></div></AppCard><div className="flex gap-2 overflow-x-auto pb-1">{futurePieces.map((piece) => <div key={piece} className="min-w-[128px] rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-400"><p className="text-[10px] font-black leading-4">{piece}</p><p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.08em]">Próximamente</p></div>)}</div></section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
        <div className="space-y-4">
          <AppCard><p className="type-caption font-black uppercase tracking-[.16em] text-neutral-500">Personalización</p><h2 className="mt-1 text-base font-black">Precinto de bolsa</h2><p className="mt-1 text-xs font-medium leading-5 text-neutral-500">Una sola composición final: negro mate, acento de liga, logo en medallón y nombre con tratamiento editorial.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-xs font-black text-neutral-700">Jugador de la vista previa<select value={selectedPlayer?.id ?? ""} onChange={(e) => setSelectedPlayerId(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-950">{sortedPlayers.map((player) => <option key={player.id} value={player.id}>{player.displayName}</option>)}</select></label><label className="text-xs font-black text-neutral-700">Color de la liga<span className="mt-1 flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-2"><input type="color" value={accent} onChange={(e) => setAccentColor(e.target.value.toUpperCase())} className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0" /><span className="text-xs font-black text-neutral-950">{accent}</span></span></label></div>{palette.length ? <div className="mt-3 flex flex-wrap items-center gap-2"><span className="mr-1 text-[10px] font-black uppercase tracking-[.1em] text-neutral-500">Desde el logo</span>{palette.map((color) => <button key={color} type="button" onClick={() => setAccentColor(color)} className={`h-7 w-7 rounded-full border-2 shadow-sm ${accent === color ? "border-neutral-950" : "border-white"}`} style={{ backgroundColor: color }} aria-label={`Usar color ${color}`} />)}</div> : null}<div className="mt-5 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-neutral-50 p-2.5"><p className="text-[9px] font-black uppercase tracking-[.1em] text-neutral-400">Corte</p><p className="mt-1 text-xs font-black">45 × 120 mm</p></div><div className="rounded-xl bg-neutral-50 p-2.5"><p className="text-[9px] font-black uppercase tracking-[.1em] text-neutral-400">Sangrado</p><p className="mt-1 text-xs font-black">2 mm</p></div><div className="rounded-xl bg-neutral-50 p-2.5"><p className="text-[9px] font-black uppercase tracking-[.1em] text-neutral-400">Pliegue</p><p className="mt-1 text-xs font-black">60 / 60 mm</p></div></div></AppCard>
          <AppCard><p className="type-caption font-black uppercase tracking-[.16em] text-neutral-500">Impresión eficiente</p><h2 className="mt-1 text-base font-black">Plancha A4</h2><p className="mt-2 text-xs font-medium leading-5 text-neutral-600">Hasta 8 precintos por A4: 4 columnas × 2 filas, con sangrado y marcas provisionales de corte/pliegue.</p><div className="mt-3 flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2.5"><span className="text-xs font-bold text-neutral-600">{sortedPlayers.length} jugadores</span><span className="text-xs font-black text-neutral-950">{sheetCount} A4</span></div></AppCard>
        </div>
        <AppCard className="lg:sticky lg:top-3"><SealPreview league={{ name: activeLeague.name, logoUrl: normalizedLogoUrl }} seasonName={seasonName} playerName={playerName} accent={accent} /></AppCard>
      </div>

      <section className="rounded-[24px] bg-neutral-950 p-4 text-white shadow-[0_18px_45px_rgba(0,0,0,.2)]"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="type-caption font-black uppercase tracking-[.18em] text-amber-300">Producción</p><h2 className="mt-1 text-base font-black">Imprimir todo</h2><p className="mt-1 text-xs font-medium leading-5 text-neutral-300">Incluye el precinto de bolsa para todos los jugadores de {seasonName}.</p></div><button type="button" onClick={printAll} disabled={!sortedPlayers.length} className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-white px-5 text-xs font-black text-neutral-950 hover:bg-amber-100 disabled:bg-neutral-700 disabled:text-neutral-400">Imprimir todo · {sortedPlayers.length}</button></div>{printError ? <p className="mt-3 rounded-xl bg-red-950/70 px-3 py-2 text-xs font-bold text-red-100">{printError}</p> : null}</section>
    </div>
  )
}
