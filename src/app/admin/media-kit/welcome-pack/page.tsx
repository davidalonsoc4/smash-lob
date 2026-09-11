"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useMediaKitSettings } from "@/context/MediaKitSettingsProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { isSafeImageUrl, normalizeImageUrl } from "@/lib/imageUrl"
import {
  WELCOME_PACK_BAG_SEAL,
  WELCOME_PACK_OVERGRIP_BAND,
  WELCOME_PACK_FONT_STYLESHEET,
  WELCOME_PACK_GENERAL_FONT_OPTIONS,
  WELCOME_PACK_PLAYER_NAME_FONT_OPTIONS,
  buildWelcomePackBagSealPrintHtml,
  getWelcomePackBagSealSheetCount,
  getWelcomePackGeneralFontFamily,
  getWelcomePackPlayerNameFontFamily,
  normalizeWelcomePackAccentColor,
  type WelcomePackGeneralFont,
  type WelcomePackPlayerNameFont,
} from "@/lib/mediaKitWelcomePack"

const futurePieces = [
  "Faja del bote",
  "Precinto del bote",
  "Sello de temporada",
  "Pegatinas",
  "Carnet oficial",
]

type SealLeague = {
  name: string
  logoUrl?: string | null
}

function SmashAndLobSignature({ accent }: { accent: string }) {
  return (
    <div className="mt-1.5 flex items-center justify-center gap-1">
      <Image src="/icon-192.png" alt="" width={12} height={12} className="h-3 w-3 rounded-[3px] object-cover" />
      <div className="text-left leading-none" style={{ fontFamily: '"Arial Narrow", Arial, sans-serif' }}>
        <p className="text-[4px] font-extrabold uppercase tracking-[.24em]" style={{ color: accent }}>Creado con</p>
        <p className="mt-0.5 text-[5px] font-black uppercase tracking-[.1em] text-[#f4f1ea]">Smash &amp; Lob</p>
      </div>
    </div>
  )
}

function SealLeagueLogo({ league }: { league: SealLeague }) {
  const normalizedLogoUrl = league.logoUrl ? normalizeImageUrl(league.logoUrl) : null

  if (normalizedLogoUrl) {
    return (
      <div className="relative mt-2 flex h-[58px] items-center justify-center">
        <div className="absolute inset-x-7 top-1/2 h-7 -translate-y-1/2 rounded-full bg-white/8 blur-xl" />
        <Image unoptimized src={normalizedLogoUrl} alt={league.name} width={124} height={54} className="relative z-10 h-auto max-h-[54px] w-auto max-w-[124px] object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,.42)]" />
      </div>
    )
  }

  const initials = league.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SL"
  return <div className="mt-2 flex h-[58px] items-center justify-center text-lg font-black tracking-[.22em] text-white">{initials}</div>
}

function SealFace({
  league,
  seasonName,
  playerName,
  accent,
  playerFont,
  generalFont,
  showSignature,
  reversed = false,
}: {
  league: SealLeague
  seasonName: string
  playerName: string
  accent: string
  playerFont: WelcomePackPlayerNameFont
  generalFont: WelcomePackGeneralFont
  showSignature: boolean
  reversed?: boolean
}) {
  return (
    <div
      className={`relative flex h-1/2 overflow-hidden ${reversed ? "rotate-180" : ""}`}
      style={{
        backgroundImage: [
          `radial-gradient(circle at 18% 12%, ${accent}55 0%, transparent 28%)`,
          `radial-gradient(circle at 82% 16%, rgba(255,255,255,.18) 0%, transparent 18%)`,
          `radial-gradient(circle at 50% 76%, ${accent}22 0%, transparent 34%)`,
          "linear-gradient(145deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,0) 28%)",
          "linear-gradient(160deg, #191919 0%, #0A0A0A 48%, #020202 100%)",
        ].join(", "),
      }}
    >
      <div className="absolute inset-[6px] rounded-[10px] border border-white/12" />
      <div className="absolute inset-y-3 left-4 w-px bg-white/6" />
      <div className="absolute inset-y-3 right-4 w-px bg-white/6" />
      <div className="absolute left-[-22px] top-[38px] h-[72px] w-[72px] rounded-full border border-white/7" />
      <div className="absolute right-[-26px] top-[8px] h-[88px] w-[88px] rounded-full border border-white/6" />
      <div className="absolute right-4 top-4 h-[46px] w-[46px] rounded-full border border-white/8 bg-white/[0.03] blur-[1px]" />
      <div className="absolute inset-x-6 top-0 h-[1px] bg-white/10" />
      <div className="absolute inset-x-9 top-[17px] h-[1px] bg-white/6" />
      <div className="relative z-10 flex w-full flex-col items-center justify-center px-5 pb-4 pt-5 text-center" style={{ fontFamily: getWelcomePackGeneralFontFamily(generalFont) }}>
        <p className="mb-2 text-[8px] font-black uppercase tracking-[.28em]" style={{ color: accent }}>
          Welcome Pack
        </p>
        <SealLeagueLogo league={league} />
        <p className="mt-2 max-w-[148px] truncate text-[8px] font-black uppercase tracking-[.12em] text-white/52">{league.name}</p>
        <p
          className="mt-3 max-w-[155px] text-balance text-[18px] font-semibold leading-[.96] text-white drop-shadow-[0_6px_14px_rgba(0,0,0,.4)]"
          style={{ fontFamily: getWelcomePackPlayerNameFontFamily(playerFont) }}
        >
          {playerName}
        </p>
        <div className="mt-3 grid grid-cols-[34px_8px_34px] items-center gap-2">
          <span className="h-px bg-white/20" />
          <span className="h-[7px] w-[7px] rotate-45 rounded-[1px] shadow-[0_0_12px_rgba(255,255,255,.24)]" style={{ backgroundColor: accent }} />
          <span className="h-px bg-white/20" />
        </div>
        <p className="mt-2 text-[8px] font-black uppercase tracking-[.13em] text-white/74">{seasonName}</p>
        {showSignature ? <div className="mt-3.5"><SmashAndLobSignature accent={accent} /></div> : null}
      </div>
    </div>
  )
}

function SealPreview(props: {
  league: SealLeague
  seasonName: string
  playerName: string
  accent: string
  playerFont: WelcomePackPlayerNameFont
  generalFont: WelcomePackGeneralFont
  showSignature: boolean
}) {
  return (
    <div className="mx-auto w-full max-w-[260px]">
      <div className="mb-2 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[.12em] text-neutral-500">
        <span>Vista previa</span>
        <span>
          {WELCOME_PACK_BAG_SEAL.trimWidthMm} × {WELCOME_PACK_BAG_SEAL.trimHeightMm} mm · provisional
        </span>
      </div>
      <div className="relative mx-auto aspect-[45/120] w-[188px] overflow-hidden rounded-[16px] bg-neutral-950 shadow-[0_28px_70px_rgba(0,0,0,.34)] ring-1 ring-neutral-800">
        <SealFace {...props} reversed />
        <SealFace {...props} />
        <div className="pointer-events-none absolute inset-x-[-18px] top-1/2 z-20 flex -translate-y-1/2 items-center gap-1">
          <span className="h-px flex-1 border-t border-dashed border-amber-400/55" />
          <span className="rounded-full bg-amber-200/90 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[.1em] text-neutral-950">pliegue</span>
          <span className="h-px flex-1 border-t border-dashed border-amber-400/55" />
        </div>
      </div>
      <p className="mt-3 text-center text-[10px] font-bold leading-4 text-neutral-500">
        La línea de pliegue es solo una guía de la preview; el diseño impreso no lleva una franja sólida en el centro.
      </p>
    </div>
  )
}


function OvergripLeagueLogo({ league }: { league: SealLeague }) {
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

function OvergripBandPreview({
  league,
  seasonName,
  playerName,
  accent,
  playerFont,
  generalFont,
}: {
  league: SealLeague
  seasonName: string
  playerName: string
  accent: string
  playerFont: WelcomePackPlayerNameFont
  generalFont: WelcomePackGeneralFont
}) {
  const generalFamily = getWelcomePackGeneralFontFamily(generalFont)
  const playerFamily = getWelcomePackPlayerNameFontFamily(playerFont)

  const premiumBackground = [
    `radial-gradient(circle at 16% 12%, ${accent}4A 0%, transparent 27%)`,
    "radial-gradient(circle at 82% 28%, rgba(255,255,255,.15) 0%, transparent 20%)",
    `radial-gradient(circle at 62% 110%, ${accent}2C 0%, transparent 38%)`,
    "linear-gradient(135deg, rgba(255,255,255,.055) 0%, transparent 28%, rgba(255,255,255,.025) 62%, transparent 100%)",
    "linear-gradient(165deg, #1A1A1A 0%, #090909 52%, #020202 100%)",
  ].join(", ")

  return (
    <div className="mx-auto w-full max-w-[470px]">
      <div className="mb-3 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[.12em] text-neutral-500">
        <span>Vista previa · fajín completo</span>
        <span>Sin escala · medidas pendientes</span>
      </div>

      <div className="rounded-[22px] border border-neutral-200 bg-[#f4f1ea] p-3 shadow-[0_24px_58px_rgba(0,0,0,.18)]">
        <div
          className="relative aspect-[5.2/1] overflow-hidden rounded-[14px] border border-black/40 text-white shadow-[0_16px_30px_rgba(0,0,0,.28)]"
          style={{ backgroundImage: premiumBackground, fontFamily: generalFamily }}
        >
          <div className="absolute inset-[6px] rounded-[9px] border border-white/12" />
          <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: accent }} />
          <div className="absolute inset-y-0 left-1/3 border-l border-dashed border-white/10" />
          <div className="absolute inset-y-0 right-1/3 border-l border-dashed border-white/10" />
          <div className="absolute -left-8 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full border border-white/7" />
          <div className="absolute right-[-25px] top-[-20px] h-24 w-24 rounded-full border border-white/7" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.07),transparent_27%,rgba(255,255,255,.03)_60%,transparent)] mix-blend-screen" />

          <div className="relative z-10 grid h-full grid-cols-3 items-stretch">
            <div className="flex min-w-0 flex-col justify-center px-4">
              <div className="relative flex items-center justify-center rounded-[12px] border border-white/8 bg-white/[0.03] px-3 py-2">
                <div className="absolute inset-x-5 top-1/2 h-7 -translate-y-1/2 rounded-full bg-white/8 blur-xl" />
                <OvergripLeagueLogo league={league} />
              </div>
              <p className="mt-2 truncate text-[10px] font-black uppercase tracking-[.08em] text-white">{league.name}</p>
              <p className="mt-1 text-[8px] font-bold uppercase tracking-[.12em] text-white/58">{seasonName}</p>
            </div>

            <div className="flex min-w-0 flex-col items-center justify-center px-4 text-center">
              <p className="text-[7px] font-black uppercase tracking-[.28em]" style={{ color: accent }}>Smash &amp; Lob</p>
              <p className="mt-2 text-[22px] font-black uppercase tracking-[.14em] text-white">Welcome Pack</p>
              <div className="mt-2 grid grid-cols-[36px_7px_36px] items-center gap-2">
                <span className="h-px bg-white/20" />
                <span className="h-[6px] w-[6px] rotate-45 rounded-[1px]" style={{ backgroundColor: accent }} />
                <span className="h-px bg-white/20" />
              </div>
            </div>

            <div className="flex min-w-0 flex-col justify-center px-4 text-right">
              <p className="text-[7px] font-black uppercase tracking-[.2em]" style={{ color: accent }}>Jugador</p>
              <p
                className="mt-1.5 text-balance text-[20px] leading-[.95] text-white"
                style={{ fontFamily: playerFamily }}
              >
                {playerName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-[10px] font-semibold leading-4 text-neutral-600 ring-1 ring-neutral-200">
        <strong className="text-neutral-900">Material:</strong> {WELCOME_PACK_OVERGRIP_BAND.material} {WELCOME_PACK_OVERGRIP_BAND.minGsm}–{WELCOME_PACK_OVERGRIP_BAND.maxGsm} g/m².
        Las medidas finales se fijarán después de medir el overgrip y su envase real.
      </div>
    </div>
  )
}
export default function WelcomePackMediaKitPage() {
  const { tx } = useI18n()
  const { isLeagueAdmin } = useLeagueAccess()
  const { accentColor } = useMediaKitSettings()
  const { seasons } = useSeasonSettings()
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)
  const { activeLeague, activeSeason, players } = useCurrentLeagueData(selectedSeasonId)
  const leagueSeasons = seasons.filter((season) => season.leagueId === activeLeague.id)
  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.displayName.localeCompare(b.displayName, "es", { sensitivity: "base" })),
    [players],
  )
  const [activePiece, setActivePiece] = useState<"bag-seal" | "overgrip-band">("bag-seal")
  const [selectedPlayerId, setSelectedPlayerId] = useState("")
  const [playerFont, setPlayerFont] = useState<WelcomePackPlayerNameFont>("manuscript-elegant")
  const [generalFont, setGeneralFont] = useState<WelcomePackGeneralFont>("narrow-premium")
  const [overgripPlayerFont, setOvergripPlayerFont] = useState<WelcomePackPlayerNameFont>("manuscript-elegant")
  const [overgripGeneralFont, setOvergripGeneralFont] = useState<WelcomePackGeneralFont>("narrow-premium")
  const [showSignature, setShowSignature] = useState(true)
  const [printError, setPrintError] = useState<string | null>(null)
  const normalizedLogoUrl = isSafeImageUrl(activeLeague.logoUrl) ? normalizeImageUrl(activeLeague.logoUrl) : null

  useEffect(() => {
    if (!sortedPlayers.some((player) => player.id === selectedPlayerId)) {
      setSelectedPlayerId(sortedPlayers[0]?.id ?? "")
    }
  }, [selectedPlayerId, sortedPlayers])

  useEffect(() => {
    if (document.querySelector('link[data-smash-welcome-pack-fonts="true"]')) return

    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = WELCOME_PACK_FONT_STYLESHEET
    link.crossOrigin = "anonymous"
    link.dataset.smashWelcomePackFonts = "true"
    document.head.appendChild(link)
  }, [])


  if (!isLeagueAdmin(activeLeague.id)) {
    return (
      <div className="space-y-4">
        <BackButton fallbackHref="/" label={tx("Volver")} />
        <AppCard>
          <p className="font-black">{tx("Acceso restringido")}</p>
        </AppCard>
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
      return setPrintError(
        tx("El navegador ha bloqueado la ventana de impresión. Permite ventanas emergentes para imprimir el Welcome Pack."),
      )
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
        playerNameFont: playerFont,
        generalFont,
        showSignature,
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
            El color de identidad se comparte con todo el Media Kit desde el selector superior.
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
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
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
          <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black text-neutral-600">2 disponibles</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setActivePiece("bag-seal")}
            className={`relative overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition ${activePiece === "bag-seal" ? "border-neutral-950 ring-2 ring-neutral-950/10" : "border-neutral-200 hover:border-neutral-400"}`}
          >
            <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: accent }} />
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 bg-neutral-50/90 px-4 py-2.5 pl-5">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] ${activePiece === "bag-seal" ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${activePiece === "bag-seal" ? "bg-emerald-500" : "bg-neutral-400"}`} />
                {activePiece === "bag-seal" ? "Activo" : "Disponible"}
              </span>
              <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[.08em] text-neutral-700 shadow-sm">Diseño único</span>
            </div>
            <div className="px-4 py-3 pl-5">
              <h3 className="text-base font-black text-neutral-950">Precinto de bolsa</h3>
              <p className="mt-1 text-xs font-semibold leading-5 text-neutral-600">Personalizado · adhesivo · doble cara espejo.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActivePiece("overgrip-band")}
            className={`relative overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition ${activePiece === "overgrip-band" ? "border-neutral-950 ring-2 ring-neutral-950/10" : "border-neutral-200 hover:border-neutral-400"}`}
          >
            <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: accent }} />
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 bg-neutral-50/90 px-4 py-2.5 pl-5">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] ${activePiece === "overgrip-band" ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${activePiece === "overgrip-band" ? "bg-emerald-500" : "bg-neutral-400"}`} />
                {activePiece === "overgrip-band" ? "Activo" : "Disponible"}
              </span>
              <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[.08em] text-neutral-700 shadow-sm">Nuevo</span>
            </div>
            <div className="px-4 py-3 pl-5">
              <h3 className="text-base font-black text-neutral-950">Fajín del overgrip</h3>
              <p className="mt-1 text-xs font-semibold leading-5 text-neutral-600">Personalizado · cartulina mate · anverso y reverso.</p>
            </div>
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {futurePieces.map((piece) => (
            <div key={piece} className="min-w-[128px] rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-400">
              <p className="text-[10px] font-black leading-4">{piece}</p>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.08em]">Próximamente</p>
            </div>
          ))}
        </div>
      </section>

{activePiece === "bag-seal" ? (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
        <div className="space-y-4">
          <AppCard>
            <p className="type-caption font-black uppercase tracking-[.16em] text-neutral-500">Personalización</p>
            <h2 className="mt-1 text-base font-black">Precinto de bolsa</h2>
            <p className="mt-1 text-xs font-medium leading-5 text-neutral-500">
              Diseño premium: logo grande sin fondo añadido, nombre personalizable y firma “Creado con Smash &amp; Lob”.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-black text-neutral-700">
                Jugador de la vista previa
                <select
                  value={selectedPlayer?.id ?? ""}
                  onChange={(event) => setSelectedPlayerId(event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-950"
                >
                  {sortedPlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-black text-neutral-700">
                Tipografía del nombre
                <select
                  value={playerFont}
                  onChange={(event) => setPlayerFont(event.target.value as WelcomePackPlayerNameFont)}
                  className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-950"
                >
                  {WELCOME_PACK_PLAYER_NAME_FONT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-[10px] font-semibold text-neutral-500">
                  {WELCOME_PACK_PLAYER_NAME_FONT_OPTIONS.find((option) => option.id === playerFont)?.description}
                </span>
              </label>
              <label className="text-xs font-black text-neutral-700">
                Tipografía general
                <select
                  value={generalFont}
                  onChange={(event) => setGeneralFont(event.target.value as WelcomePackGeneralFont)}
                  className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-950"
                >
                  {WELCOME_PACK_GENERAL_FONT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>{option.label} · {option.description}</option>
                  ))}
                </select>
              </label>
              <div className="text-xs font-black text-neutral-700">
                Firma Smash &amp; Lob
                <div className="mt-1 grid grid-cols-2 gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1">
                  <button type="button" onClick={() => setShowSignature(true)} className={`h-8 rounded-lg text-[11px] font-black ${showSignature ? "bg-neutral-950 text-white" : "text-neutral-600"}`}>Sí</button>
                  <button type="button" onClick={() => setShowSignature(false)} className={`h-8 rounded-lg text-[11px] font-black ${!showSignature ? "bg-neutral-950 text-white" : "text-neutral-600"}`}>No</button>
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-neutral-50 p-2.5">
                <p className="text-[9px] font-black uppercase tracking-[.1em] text-neutral-400">Corte</p>
                <p className="mt-1 text-xs font-black">45 × 120 mm</p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-2.5">
                <p className="text-[9px] font-black uppercase tracking-[.1em] text-neutral-400">Sangrado</p>
                <p className="mt-1 text-xs font-black">2 mm</p>
              </div>
              <div className="rounded-xl bg-neutral-50 p-2.5">
                <p className="text-[9px] font-black uppercase tracking-[.1em] text-neutral-400">Pliegue</p>
                <p className="mt-1 text-xs font-black">60 / 60 mm</p>
              </div>
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
            playerFont={playerFont}
            generalFont={generalFont}
            showSignature={showSignature}
          />
        </AppCard>
      </div>

      ) : (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-start">
        <div className="space-y-4">
          <AppCard>
            <p className="type-caption font-black uppercase tracking-[.16em] text-neutral-500">Personalización</p>
            <h2 className="mt-1 text-base font-black">Fajín del overgrip</h2>
            <p className="mt-1 text-xs font-medium leading-5 text-neutral-500">
              Vista única del diseño completo a imprimir, organizada en tres zonas: identidad de liga, título Welcome Pack y nombre del jugador.
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
                Tipografía del nombre
                <select
                  value={overgripPlayerFont}
                  onChange={(event) => setOvergripPlayerFont(event.target.value as WelcomePackPlayerNameFont)}
                  className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-950"
                >
                  {WELCOME_PACK_PLAYER_NAME_FONT_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
                <span className="mt-1 block text-[10px] font-semibold text-neutral-500">
                  {WELCOME_PACK_PLAYER_NAME_FONT_OPTIONS.find((option) => option.id === overgripPlayerFont)?.description}
                </span>
              </label>

              <label className="text-xs font-black text-neutral-700">
                Tipografía general
                <select
                  value={overgripGeneralFont}
                  onChange={(event) => setOvergripGeneralFont(event.target.value as WelcomePackGeneralFont)}
                  className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-950"
                >
                  {WELCOME_PACK_GENERAL_FONT_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label} · {option.description}</option>)}
                </select>
              </label>

              <div className="rounded-xl bg-neutral-50 px-3 py-2.5 ring-1 ring-neutral-200">
                <p className="text-[9px] font-black uppercase tracking-[.12em] text-neutral-400">Material previsto</p>
                <p className="mt-1 text-xs font-black text-neutral-950">{WELCOME_PACK_OVERGRIP_BAND.material}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-neutral-500">{WELCOME_PACK_OVERGRIP_BAND.minGsm}–{WELCOME_PACK_OVERGRIP_BAND.maxGsm} g/m²</p>
              </div>
            </div>
          </AppCard>

          <AppCard>
            <p className="type-caption font-black uppercase tracking-[.16em] text-neutral-500">Medidas</p>
            <h2 className="mt-1 text-base font-black">Pendientes de cerrar</h2>
            <p className="mt-2 text-xs font-medium leading-5 text-neutral-600">
              No se fija todavía ninguna medida ni plancha A4: primero mediremos el overgrip real y su envase para que el fajín cierre exactamente y se imprima al 100 %.
            </p>
          </AppCard>
        </div>

        <AppCard className="lg:sticky lg:top-3">
          <OvergripBandPreview
            league={{ name: activeLeague.name, logoUrl: normalizedLogoUrl }}
            seasonName={seasonName}
            playerName={playerName}
            accent={accent}
            playerFont={overgripPlayerFont}
            generalFont={overgripGeneralFont}
          />
        </AppCard>
      </div>

      )}

{activePiece === "bag-seal" ? (
      <section className="rounded-[24px] bg-neutral-950 p-4 text-white shadow-[0_18px_45px_rgba(0,0,0,.2)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="type-caption font-black uppercase tracking-[.18em] text-amber-300">Producción</p>
            <h2 className="mt-1 text-base font-black">Imprimir todo</h2>
            <p className="mt-1 text-xs font-medium leading-5 text-neutral-300">
              Incluye el precinto de bolsa para todos los jugadores de {seasonName}.
            </p>
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
      ) : (
      <section className="rounded-[24px] bg-neutral-950 p-4 text-white shadow-[0_18px_45px_rgba(0,0,0,.2)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="type-caption font-black uppercase tracking-[.18em] text-amber-300">Producción</p>
            <h2 className="mt-1 text-base font-black">Impresión pendiente de medidas</h2>
            <p className="mt-1 text-xs font-medium leading-5 text-neutral-300">
              El diseño del fajín ya puede validarse. La plancha A4 se habilitará cuando midamos el overgrip real para no inventar escala ni dimensiones.
            </p>
          </div>
          <span className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-white/10 px-5 text-xs font-black text-neutral-300 ring-1 ring-white/15">
            Medir antes de imprimir
          </span>
        </div>
      </section>
      )}
    </div>
  )
}