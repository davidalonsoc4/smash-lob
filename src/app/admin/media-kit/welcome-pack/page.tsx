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

const futurePieces = [
  "Faja del bote",
  "Precinto del bote",
  "Fajín del overgrip",
  "Sello de temporada",
  "Pegatinas",
  "Carnet oficial",
]

function SealFace({
  league,
  seasonName,
  playerName,
  accent,
  reversed = false,
}: {
  league: { name: string; logoUrl?: string | null }
  seasonName: string
  playerName: string
  accent: string
  reversed?: boolean
}) {
  const background = [
    `radial-gradient(circle at 50% 32%, color-mix(in srgb, ${accent} 28%, transparent) 0%, transparent 34%)`,
    `radial-gradient(circle at 12% 18%, color-mix(in srgb, ${accent} 14%, transparent) 0%, transparent 28%)`,
    "radial-gradient(circle at 88% 8%, rgba(255,255,255,.10) 0%, transparent 24%)",
    "linear-gradient(158deg,#181818 0%,#080808 52%,#020202 100%)",
  ].join(",")

  return (
    <div
      className={`relative flex h-1/2 overflow-hidden ${reversed ? "rotate-180" : ""}`}
      style={{ background }}
    >
      <div
        className="absolute -left-10 top-4 h-28 w-28 rounded-full border opacity-35"
        style={{ borderColor: accent, boxShadow: `0 0 38px color-mix(in srgb, ${accent} 20%, transparent)` }}
        aria-hidden="true"
      />
      <div
        className="absolute -right-12 bottom-0 h-32 w-32 rounded-full border opacity-20"
        style={{ borderColor: accent }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 opacity-[.11]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(118deg,transparent 0,transparent 12px,rgba(255,255,255,.34) 13px,transparent 14px)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute left-1/2 top-[27%] h-24 w-24 -translate-x-1/2 rounded-full blur-2xl opacity-45"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />
      <div className="absolute inset-[6px] border border-white/15" aria-hidden="true" />
      <div
        className="absolute inset-x-6 top-0 h-[4px]"
        style={{ background: `linear-gradient(90deg,transparent,${accent},transparent)` }}
        aria-hidden="true"
      />
      <div
        className="absolute right-3 top-3 h-8 w-8 border-r-2 border-t-2"
        style={{ borderColor: accent }}
        aria-hidden="true"
      />
      <div className="absolute bottom-3 left-3 h-7 w-7 border-b border-l border-white/30" aria-hidden="true" />
      <span
        className="absolute left-4 top-5 h-1 w-1 rounded-full"
        style={{ backgroundColor: accent, boxShadow: `12px 7px 0 color-mix(in srgb, ${accent} 55%, transparent), 4px 19px 0 rgba(255,255,255,.22)` }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full flex-col items-center justify-center px-5 pb-4 pt-5 text-center">
        <p className="mb-2 text-[8px] font-black uppercase tracking-[.34em]" style={{ color: accent }}>
          Welcome Pack
        </p>

        <div
          className="relative grid h-[54px] w-[54px] place-items-center rounded-full border p-[3px]"
          style={{
            borderColor: accent,
            boxShadow: `0 0 24px color-mix(in srgb, ${accent} 28%, transparent), inset 0 0 0 1px rgba(255,255,255,.12)`,
          }}
        >
          <span className="absolute inset-[4px] rounded-full border border-white/20" aria-hidden="true" />
          <span className="relative grid h-full w-full place-items-center overflow-hidden rounded-full bg-white/95 p-1.5 shadow-inner">
            <LeagueLogo league={league} size="sm" className="!h-9 !w-9 !rounded-full" />
          </span>
        </div>

        <p className="mt-2 max-w-[145px] truncate text-[8px] font-black uppercase tracking-[.12em] text-white/55">
          {league.name}
        </p>
        <p className="mt-2 max-w-[155px] text-balance font-serif text-[18px] font-bold leading-[.92] text-white drop-shadow-[0_2px_14px_rgba(0,0,0,.65)]">
          {playerName}
        </p>

        <div className="mt-3 grid grid-cols-[34px_8px_34px] items-center gap-2">
          <span className="h-px bg-gradient-to-r from-transparent to-white/35" />
          <span
            className="h-[7px] w-[7px] rotate-45 border"
            style={{ borderColor: accent, boxShadow: `0 0 10px color-mix(in srgb, ${accent} 45%, transparent)` }}
          />
          <span className="h-px bg-gradient-to-l from-transparent to-white/35" />
        </div>

        <p className="mt-2 text-[8px] font-black uppercase tracking-[.15em] text-white/80">{seasonName}</p>
        <p className="mt-1 text-[6px] font-black uppercase tracking-[.28em] text-white/30">Smash &amp; Lob</p>
      </div>
    </div>
  )
}

function SealPreview(props: {
  league: { name: string; logoUrl?: string | null }
  seasonName: string
  playerName: string
  accent: string
}) {
  return (
    <div className="mx-auto w-full max-w-[250px]">
      <div className="mb-2 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[.12em] text-neutral-500">
        <span>Vista previa</span>
        <span>{WELCOME_PACK_BAG_SEAL.trimWidthMm} × {WELCOME_PACK_BAG_SEAL.trimHeightMm} mm · provisional</span>
      </div>
      <div className="relative mx-auto aspect-[45/120] w-[180px] overflow-hidden bg-neutral-950 shadow-[0_26px_60px_rgba(0,0,0,.38)] ring-1 ring-neutral-800">
        <SealFace {...props} reversed />
        <SealFace {...props} />
        <div className="pointer-events-none absolute inset-x-[-18px] top-1/2 z-20 flex -translate-y-1/2 items-center gap-1">
          <span className="h-px flex-1 border-t border-dashed border-amber-400/80" />
          <span className="rounded-full bg-amber-300 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[.1em] text-neutral-950">
            pliegue
          </span>
          <span className="h-px flex-1 border-t border-dashed border-amber-400/80" />
        </div>
      </div>
      <p className="mt-3 text-center text-[10px] font-bold leading-4 text-neutral-500">
        Diseño único. La mitad superior va girada 180°; la inferior queda en lectura normal.
      </p>
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
  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.displayName.localeCompare(b.displayName, "es", { sensitivity: "base" })),
    [players],
  )
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
    if (normalizedLogoUrl) {
      void extractLogoAccentPalette(normalizedLogoUrl)
        .then((colors) => {
          if (!active) return
          setPalette(colors)
          if (colors[0]) setAccentColor(colors[0])
        })
        .catch(() => {
          if (active) setPalette([])
        })
    }
    return () => {
      active = false
    }
  }, [activeLeague.id, normalizedLogoUrl])

  if (!isLeagueAdmin(activeLeague.id)) {
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
  const accent = normalizeWelcomePackAccentColor(accentColor)
  const sheetCount = getWelcomePackBagSealSheetCount(sortedPlayers.length)

  function printAll() {
    if (!sortedPlayers.length) return
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
        accentColor: accent,
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
            Previsualiza cada pieza, ajusta su identidad y prepara la impresión conjunta de toda la temporada.
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
              {leagueSeasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}
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
          <p className="type-caption font-black uppercase tracking-[.16em] text-amber-300">Activo</p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-black">Precinto de bolsa</h3>
              <p className="mt-1 text-xs font-medium leading-5 text-neutral-300">Personalizado por jugador · adhesivo · doble cara espejo.</p>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.08em]">Diseño único</span>
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
            <p className="mt-1 text-xs font-medium leading-5 text-neutral-500">
              Una sola composición premium: negro profundo, halos luminosos del color de liga, textura diagonal sutil, logo en medallón y nombre con tratamiento editorial.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-black text-neutral-700">
                Jugador de la vista previa
                <select
                  value={selectedPlayer?.id ?? ""}
                  onChange={(event) => setSelectedPlayerId(event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-950"
                >
                  {sortedPlayers.map((player) => <option key={player.id} value={player.id}>{player.displayName}</option>)}
                </select>
              </label>
              <label className="text-xs font-black text-neutral-700">
                Color de la liga
                <span className="mt-1 flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-2">
                  <input
                    type="color"
                    value={accent}
                    onChange={(event) => setAccentColor(event.target.value.toUpperCase())}
                    className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="text-xs font-black text-neutral-950">{accent}</span>
                </span>
              </label>
            </div>
            {palette.length ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[10px] font-black uppercase tracking-[.1em] text-neutral-500">Desde el logo</span>
                {palette.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccentColor(color)}
                    className={`h-7 w-7 rounded-full border-2 shadow-sm ${accent === color ? "border-neutral-950" : "border-white"}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Usar color ${color}`}
                  />
                ))}
              </div>
            ) : null}
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
              Hasta 8 precintos por A4: 4 columnas × 2 filas, con sangrado y marcas provisionales de corte/pliegue.
            </p>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2.5">
              <span className="text-xs font-bold text-neutral-600">{sortedPlayers.length} jugadores</span>
              <span className="text-xs font-black text-neutral-950">{sheetCount} A4</span>
            </div>
          </AppCard>
        </div>

        <AppCard className="lg:sticky lg:top-3">
          <SealPreview
            league={{ name: activeLeague.name, logoUrl: normalizedLogoUrl }}
            seasonName={seasonName}
            playerName={playerName}
            accent={accent}
          />
        </AppCard>
      </div>

      <section className="rounded-[24px] bg-neutral-950 p-4 text-white shadow-[0_18px_45px_rgba(0,0,0,.2)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="type-caption font-black uppercase tracking-[.18em] text-amber-300">Producción</p>
            <h2 className="mt-1 text-base font-black">Imprimir todo</h2>
            <p className="mt-1 text-xs font-medium leading-5 text-neutral-300">Incluye el precinto de bolsa para todos los jugadores de {seasonName}.</p>
          </div>
          <button
            type="button"
            onClick={printAll}
            disabled={!sortedPlayers.length}
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-white px-5 text-xs font-black text-neutral-950 hover:bg-amber-100 disabled:bg-neutral-700 disabled:text-neutral-400"
          >
            Imprimir todo · {sortedPlayers.length}
          </button>
        </div>
        {printError ? <p className="mt-3 rounded-xl bg-red-950/70 px-3 py-2 text-xs font-bold text-red-100">{printError}</p> : null}
      </section>
    </div>
  )
}
