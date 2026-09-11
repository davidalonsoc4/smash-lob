"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"
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
  WELCOME_PACK_BAG_SEAL_DESIGNS,
  buildWelcomePackBagSealPrintHtml,
  getWelcomePackBagSealSheetCount,
  normalizeWelcomePackAccentColor,
  type WelcomePackBagSealDesign,
} from "@/lib/mediaKitWelcomePack"

type BagSealFaceProps = {
  league: { name: string; logoUrl?: string | null }
  seasonName: string
  playerName: string
  accentColor: string
  design: WelcomePackBagSealDesign
  reversed?: boolean
}

function BagSealFace({
  league,
  seasonName,
  playerName,
  accentColor,
  design,
  reversed = false,
}: BagSealFaceProps) {
  return (
    <div
      className={`relative flex h-1/2 overflow-hidden bg-neutral-950 ${reversed ? "rotate-180" : ""}`}
      style={{ "--bag-accent": accentColor } as CSSProperties}
    >
      {design === "frame" ? (
        <div
          className="pointer-events-none absolute inset-2 rounded-[10px] border-[5px]"
          style={{ borderColor: accentColor }}
          aria-hidden="true"
        />
      ) : null}
      {design === "stripe" ? (
        <>
          <div className="absolute inset-y-0 left-0 w-[10%]" style={{ backgroundColor: accentColor }} aria-hidden="true" />
          <div className="absolute inset-y-0 right-0 w-[2%] opacity-45" style={{ backgroundColor: accentColor }} aria-hidden="true" />
        </>
      ) : null}
      {design === "split" ? (
        <div className="absolute inset-x-0 top-0 h-[19%]" style={{ backgroundColor: accentColor }} aria-hidden="true" />
      ) : null}

      <div className={`relative z-10 flex w-full flex-col items-center justify-center px-5 text-center ${design === "split" ? "pt-5" : ""}`}>
        <div className="mb-2 flex max-w-full items-center justify-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/95 p-1 shadow-sm">
            <LeagueLogo league={league} size="sm" className="!h-6 !w-6 !rounded-md" />
          </span>
          <span className="max-w-[120px] truncate text-[8px] font-black uppercase tracking-[.08em] text-white/65">
            {league.name}
          </span>
        </div>
        <p className="text-[8px] font-black uppercase tracking-[.24em]" style={{ color: design === "split" ? "white" : accentColor }}>
          Welcome Pack
        </p>
        <p className="mt-1.5 max-w-[150px] text-balance text-[15px] font-black leading-[.96] text-white">
          {playerName}
        </p>
        <p className="mt-1.5 text-[7px] font-bold uppercase tracking-[.16em] text-white/45">
          {seasonName}
        </p>
      </div>
    </div>
  )
}

function BagSealPreview({
  league,
  seasonName,
  playerName,
  accentColor,
  design,
}: Omit<BagSealFaceProps, "reversed">) {
  return (
    <div className="mx-auto w-full max-w-[250px]">
      <div className="mb-2 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[.12em] text-neutral-500">
        <span>Vista previa</span>
        <span>{WELCOME_PACK_BAG_SEAL.trimWidthMm} × {WELCOME_PACK_BAG_SEAL.trimHeightMm} mm · provisional</span>
      </div>
      <div className="relative mx-auto aspect-[45/120] w-[180px] bg-neutral-950 shadow-[0_22px_50px_rgba(0,0,0,.28)] ring-1 ring-neutral-800">
        <BagSealFace
          league={league}
          seasonName={seasonName}
          playerName={playerName}
          accentColor={accentColor}
          design={design}
        />
        <BagSealFace
          league={league}
          seasonName={seasonName}
          playerName={playerName}
          accentColor={accentColor}
          design={design}
          reversed
        />
        <div className="pointer-events-none absolute inset-x-[-18px] top-1/2 z-20 flex -translate-y-1/2 items-center gap-1" aria-hidden="true">
          <span className="h-px flex-1 border-t border-dashed border-amber-400/80" />
          <span className="rounded-full bg-amber-300 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[.1em] text-neutral-950">pliegue</span>
          <span className="h-px flex-1 border-t border-dashed border-amber-400/80" />
        </div>
      </div>
      <p className="mt-3 text-center text-[10px] font-bold leading-4 text-neutral-500">
        La mitad inferior va girada 180° para que las dos caras queden legibles al doblar el precinto sobre la bolsa.
      </p>
    </div>
  )
}

const futurePieces = [
  "Faja del bote",
  "Precinto del bote",
  "Fajín del overgrip",
  "Sello de temporada",
  "Pegatinas",
  "Carnet oficial",
]

export default function WelcomePackMediaKitPage() {
  const { tx } = useI18n()
  const { isLeagueAdmin } = useLeagueAccess()
  const { seasons } = useSeasonSettings()
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)
  const { activeLeague, activeSeason, players } = useCurrentLeagueData(selectedSeasonId)
  const leagueSeasons = seasons.filter((season) => season.leagueId === activeLeague.id)
  const canManage = isLeagueAdmin(activeLeague.id)
  const sortedPlayers = useMemo(
    () => [...players].sort((left, right) => left.displayName.localeCompare(right.displayName, "es", { sensitivity: "base" })),
    [players],
  )
  const [selectedPlayerId, setSelectedPlayerId] = useState("")
  const [design, setDesign] = useState<WelcomePackBagSealDesign>("frame")
  const [accentColor, setAccentColor] = useState("#D7A544")
  const [palette, setPalette] = useState<string[]>([])
  const [printError, setPrintError] = useState<string | null>(null)

  const normalizedLogoUrl = isSafeImageUrl(activeLeague.logoUrl)
    ? normalizeImageUrl(activeLeague.logoUrl)
    : null

  useEffect(() => {
    if (sortedPlayers.some((player) => player.id === selectedPlayerId)) return
    setSelectedPlayerId(sortedPlayers[0]?.id ?? "")
  }, [selectedPlayerId, sortedPlayers])

  useEffect(() => {
    let active = true
    setPalette([])
    setAccentColor("#D7A544")

    if (!normalizedLogoUrl) return () => { active = false }

    void extractLogoAccentPalette(normalizedLogoUrl)
      .then((colors) => {
        if (!active) return
        setPalette(colors)
        if (colors[0]) setAccentColor(colors[0])
      })
      .catch(() => {
        if (active) setPalette([])
      })

    return () => { active = false }
  }, [activeLeague.id, normalizedLogoUrl])

  if (!canManage) {
    return (
      <div className="space-y-4">
        <BackButton fallbackHref="/" label={tx("Volver")} />
        <AppCard><p className="font-black">{tx("Acceso restringido")}</p></AppCard>
      </div>
    )
  }

  const selectedPlayer = sortedPlayers.find((player) => player.id === selectedPlayerId) ?? sortedPlayers[0]
  const playerName = selectedPlayer?.displayName ?? tx("Jugador")
  const seasonName = activeSeason.name || tx("Temporada")
  const sheetCount = getWelcomePackBagSealSheetCount(sortedPlayers.length)

  function printAll() {
    if (sortedPlayers.length === 0) return

    const popup = window.open("", "_blank", "width=1100,height=900")
    if (!popup) {
      setPrintError(tx("El navegador ha bloqueado la ventana de impresión. Permite ventanas emergentes para imprimir el Welcome Pack."))
      return
    }

    setPrintError(null)
    popup.opener = null
    popup.document.open()
    popup.document.write(
      buildWelcomePackBagSealPrintHtml({
        players: sortedPlayers.map((player) => ({ id: player.id, displayName: player.displayName })),
        leagueName: activeLeague.name,
        seasonName,
        logoUrl: normalizedLogoUrl,
        accentColor,
        design,
      }),
    )
    popup.document.close()
  }

  return (
    <div className="space-y-4">
      <header className="app-page-header">
        <BackButton fallbackHref="/admin/media-kit" label={tx("Volver")} />
        <div>
          <p className="type-caption font-black uppercase tracking-[.16em] text-neutral-500">Media Kit</p>
          <h1 className="type-page-title">Welcome Pack</h1>
        </div>
      </header>

      <AppCard className="overflow-hidden !p-0">
        <div className="bg-neutral-950 px-4 py-4 text-white">
          <p className="type-caption font-black uppercase tracking-[.18em] text-amber-300">Producción física</p>
          <h2 className="mt-1 text-lg font-black">Welcome Pack · {activeLeague.name}</h2>
          <p className="mt-1 text-xs font-medium leading-5 text-neutral-300">
            Previsualiza cada pieza, cambia su diseño y prepara la impresión conjunta de toda la temporada.
          </p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="text-xs font-black text-neutral-700">
            {tx("Temporada")}
            <select
              value={activeSeason.id}
              onChange={(event) => setSelectedSeasonId(event.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-950 outline-none focus:border-neutral-950"
            >
              {leagueSeasons.map((season) => (
                <option key={season.id} value={season.id}>{season.name}</option>
              ))}
            </select>
          </label>
          <div className="rounded-xl bg-amber-50 px-3 py-2 text-[10px] font-bold leading-4 text-amber-900 ring-1 ring-amber-200">
            Medidas provisionales hasta medir y probar la bolsa real a escala 100 %.
          </div>
        </div>
      </AppCard>

      <section className="space-y-2">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="type-caption font-black uppercase tracking-[.16em] text-neutral-500">Piezas</p>
            <h2 className="text-base font-black text-neutral-950">Diseños del Welcome Pack</h2>
          </div>
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black text-neutral-600">1 disponible</span>
        </div>

        <AppCard className="!border-neutral-950 !bg-neutral-950 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="type-caption font-black uppercase tracking-[.16em] text-amber-300">Activo</p>
              <h3 className="mt-1 text-base font-black">Precinto de bolsa</h3>
              <p className="mt-1 text-xs font-medium leading-5 text-neutral-300">Personalizado por jugador · adhesivo · doble cara espejo.</p>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black text-white">v1</span>
          </div>
        </AppCard>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {futurePieces.map((piece) => (
            <div key={piece} className="min-w-[128px] rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-400">
              <p className="text-[10px] font-black leading-4">{piece}</p>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.08em]">Próximamente</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
        <div className="space-y-4">
          <AppCard>
            <p className="type-caption font-black uppercase tracking-[.16em] text-neutral-500">Personalización</p>
            <h2 className="mt-1 text-base font-black">Precinto de bolsa</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-black text-neutral-700">
                Jugador de la vista previa
                <select
                  value={selectedPlayer?.id ?? ""}
                  onChange={(event) => setSelectedPlayerId(event.target.value)}
                  disabled={sortedPlayers.length === 0}
                  className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-950 outline-none focus:border-neutral-950 disabled:bg-neutral-100"
                >
                  {sortedPlayers.map((player) => (
                    <option key={player.id} value={player.id}>{player.displayName}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-black text-neutral-700">
                Color de la liga
                <span className="mt-1 flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-2">
                  <input
                    type="color"
                    value={normalizeWelcomePackAccentColor(accentColor)}
                    onChange={(event) => setAccentColor(event.target.value.toUpperCase())}
                    className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                    aria-label="Color del Welcome Pack"
                  />
                  <span className="text-xs font-black text-neutral-950">{normalizeWelcomePackAccentColor(accentColor)}</span>
                </span>
              </label>
            </div>

            {palette.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[10px] font-black uppercase tracking-[.1em] text-neutral-500">Desde el logo</span>
                {palette.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccentColor(color)}
                    className={`h-7 w-7 rounded-full border-2 shadow-sm ${normalizeWelcomePackAccentColor(accentColor) === color ? "border-neutral-950" : "border-white"}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Usar color ${color}`}
                    title={color}
                  />
                ))}
              </div>
            ) : null}

            <div className="mt-5">
              <p className="text-xs font-black text-neutral-700">Diseño</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {WELCOME_PACK_BAG_SEAL_DESIGNS.map((option) => {
                  const selected = design === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setDesign(option.id)}
                      className={`rounded-xl border px-2 py-3 text-left transition ${selected ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-950 hover:border-neutral-400"}`}
                    >
                      <span className="block text-[11px] font-black">{option.label}</span>
                      <span className={`mt-0.5 block text-[9px] font-bold leading-3 ${selected ? "text-neutral-400" : "text-neutral-500"}`}>{option.detail}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-neutral-50 p-2.5"><p className="text-[9px] font-black uppercase tracking-[.1em] text-neutral-400">Corte</p><p className="mt-1 text-xs font-black">45 × 120 mm</p></div>
              <div className="rounded-xl bg-neutral-50 p-2.5"><p className="text-[9px] font-black uppercase tracking-[.1em] text-neutral-400">Sangrado</p><p className="mt-1 text-xs font-black">2 mm</p></div>
              <div className="rounded-xl bg-neutral-50 p-2.5"><p className="text-[9px] font-black uppercase tracking-[.1em] text-neutral-400">Pliegue</p><p className="mt-1 text-xs font-black">60 / 60 mm</p></div>
            </div>
          </AppCard>

          <AppCard>
            <p className="type-caption font-black uppercase tracking-[.16em] text-neutral-500">Impresión eficiente</p>
            <h2 className="mt-1 text-base font-black">Plancha A4</h2>
            <p className="mt-2 text-xs font-medium leading-5 text-neutral-600">
              La primera versión coloca hasta 8 precintos por A4: 4 columnas × 2 filas, con 2 mm de sangrado por pieza y marcas provisionales de corte/pliegue. No mezcla materiales distintos.
            </p>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2.5">
              <span className="text-xs font-bold text-neutral-600">{sortedPlayers.length} jugadores</span>
              <span className="text-xs font-black text-neutral-950">{sheetCount} {sheetCount === 1 ? "A4" : "A4"}</span>
            </div>
          </AppCard>
        </div>

        <AppCard className="lg:sticky lg:top-3">
          <BagSealPreview
            league={{ name: activeLeague.name, logoUrl: normalizedLogoUrl }}
            seasonName={seasonName}
            playerName={playerName}
            accentColor={normalizeWelcomePackAccentColor(accentColor)}
            design={design}
          />
        </AppCard>
      </div>

      <section className="rounded-[24px] bg-neutral-950 p-4 text-white shadow-[0_18px_45px_rgba(0,0,0,.2)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="type-caption font-black uppercase tracking-[.18em] text-amber-300">Producción</p>
            <h2 className="mt-1 text-base font-black">Imprimir todo</h2>
            <p className="mt-1 text-xs font-medium leading-5 text-neutral-300">
              Por ahora incluye el precinto de bolsa para todos los jugadores de {seasonName}. Las próximas piezas se incorporarán a este mismo flujo.
            </p>
          </div>
          <button
            type="button"
            onClick={printAll}
            disabled={sortedPlayers.length === 0}
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-white px-5 text-xs font-black text-neutral-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
          >
            Imprimir todo · {sortedPlayers.length}
          </button>
        </div>
        {printError ? <p className="mt-3 rounded-xl bg-red-950/70 px-3 py-2 text-xs font-bold text-red-100">{printError}</p> : null}
      </section>
    </div>
  )
}
