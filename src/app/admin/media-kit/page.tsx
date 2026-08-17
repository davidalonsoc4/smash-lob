"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { BackButton } from "@/components/ui/BackButton"
import { AppCard } from "@/components/ui/AppCard"
import { SeasonStartCountdown } from "@/components/season/SeasonStartCountdown"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { getSeasonCountdown, formatScheduledSeasonStart, SCHEDULED_SEASON_TIME_ZONE } from "@/lib/seasonScheduling"
import { formatShortDate } from "@/lib/rounds"
import {
  createLeagueMediaKitImage,
  downloadLeagueMediaKitImage,
  type LeagueMediaKitImageData,
  type LeagueMediaKitHeadlineFont,
  type LeagueMediaKitKind,
} from "@/lib/leagueMediaKitImage"

const titles: Record<LeagueMediaKitKind, string> = {
  opening: "Apertura",
  rules: "Reglas de la liga",
  registration: "Inscripciones",
  calendar: "Calendario",
  start: "Inicio de liga",
  countdown: "Cuenta atrás",
}

const compactPresetTitles: Record<LeagueMediaKitKind, string> = {
  opening: "Apertura",
  rules: "Reglas",
  registration: "Altas",
  calendar: "Agenda",
  start: "Inicio",
  countdown: "Cuenta",
}

const openingAccentOptions = ["#d7a544", "#bb9448", "#d4643c", "#3d9d86", "#477bd1", "#8b5fc0"]
const openingHeadlineFontOptions: Array<{ id: LeagueMediaKitHeadlineFont; label: string; detail: string; sampleClass: string }> = [
  { id: "impact", label: "Impacto", detail: "Cartel deportivo", sampleClass: "font-black tracking-tight" },
  { id: "condensed", label: "Condensada", detail: "Alta y precisa", sampleClass: "font-black tracking-[-.08em]" },
  { id: "editorial", label: "Editorial", detail: "Premium clásica", sampleClass: "font-serif font-black tracking-tight" },
  { id: "athletic", label: "Atlética", detail: "Ancha y dinámica", sampleClass: "font-black italic tracking-[-.04em]" },
]
const fieldClass = "mt-0.5 h-7 w-full rounded-md border border-neutral-200 bg-white px-2 text-[10px] font-bold text-neutral-950 outline-none transition focus:border-neutral-500"

function slug(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() }

function openingDateLabels(value: string | null | undefined) {
  if (!value) return { date: "26 DE SEPTIEMBRE", time: "10:00" }
  const instant = new Date(value)
  if (Number.isNaN(instant.getTime())) return { date: "26 DE SEPTIEMBRE", time: "10:00" }
  return {
    date: new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", timeZone: SCHEDULED_SEASON_TIME_ZONE }).format(instant).toLocaleUpperCase("es-ES"),
    time: new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: SCHEDULED_SEASON_TIME_ZONE }).format(instant),
  }
}

function MediaKitPosterPreview({ data }: { data: LeagueMediaKitImageData }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState(false)

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null
    const timeout = window.setTimeout(() => {
      void createLeagueMediaKitImage(data)
        .then((blob) => {
          if (!active) return
          objectUrl = URL.createObjectURL(blob)
          setPreviewUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return objectUrl })
          setPreviewError(false)
        })
        .catch(() => { if (active) setPreviewError(true) })
    }, 120)
    return () => { active = false; window.clearTimeout(timeout); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [data])

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-[0_22px_55px_rgba(0,0,0,.3)]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[.18em] text-neutral-400"><span>Vista previa</span><span>1080 × 1350</span></div>
      <div className="relative aspect-[4/5] bg-[radial-gradient(circle_at_50%_30%,#28231a,#050505_62%)]">
        {previewUrl ? <Image unoptimized src={previewUrl} width={1080} height={1350} alt="Vista previa del cartel activo" className="h-full w-full object-cover" /> : null}
        {!previewUrl && !previewError ? <div className="absolute inset-0 grid place-items-center text-xs font-black uppercase tracking-[.2em] text-neutral-500">Componiendo cartel…</div> : null}
        {previewError ? <div className="absolute inset-0 grid place-items-center px-6 text-center text-xs font-bold text-red-200">No se ha podido construir la vista previa.</div> : null}
      </div>
    </div>
  )
}

export default function MediaKitPage() {
  const { isLeagueAdmin } = useLeagueAccess()
  const { activeLeague, activeSeason, roundSettings, rounds, matches, players } = useCurrentLeagueData()
  const [busy, setBusy] = useState<LeagueMediaKitKind | null>(null)
  const firstOpeningMatch = [...matches].filter((match) => match.round === 1).sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""))[0]
  const initialOpeningLabels = openingDateLabels(firstOpeningMatch?.scheduledAt ?? roundSettings.scheduledStartAt)
  const [openingTitle, setOpeningTitle] = useState("Apertura")
  const [openingSubtitle, setOpeningSubtitle] = useState("")
  const [openingDate, setOpeningDate] = useState(initialOpeningLabels.date)
  const [openingTime, setOpeningTime] = useState(initialOpeningLabels.time)
  const [openingVenue, setOpeningVenue] = useState(firstOpeningMatch?.location ?? "El Pando")
  const [openingRound, setOpeningRound] = useState("Jornada 1")
  const [openingAccent, setOpeningAccent] = useState("#d7a544")
  const [customAccentDraft, setCustomAccentDraft] = useState("#d7a544")
  const [showCustomAccent, setShowCustomAccent] = useState(false)
  const [openingHeadlineFont, setOpeningHeadlineFont] = useState<LeagueMediaKitHeadlineFont>("impact")
  const [openingLogoOverride, setOpeningLogoOverride] = useState<string | null>(null)
  const [activePresetKind, setActivePresetKind] = useState<LeagueMediaKitKind>("opening")
  const canManage = isLeagueAdmin(activeLeague.id)
  const scheduledLabel = formatScheduledSeasonStart(roundSettings.scheduledStartAt)
  const countdown = getSeasonCountdown(roundSettings.scheduledStartAt)

  const openingData = useMemo<LeagueMediaKitImageData>(() => ({
    kind: activePresetKind,
    template: "opening_day_premium_01",
    leagueName: activeLeague.name,
    seasonName: activeSeason.name,
    leagueLogoUrl: openingLogoOverride ?? activeLeague.logoUrl,
    eyebrow: "Evento oficial",
    title: openingTitle,
    subtitle: openingSubtitle,
    rows: [],
    accentColor: openingAccent,
    eventDateLabel: openingDate,
    eventTimeLabel: openingTime,
    venue: openingVenue,
    roundLabel: openingRound,
    headlineFont: openingHeadlineFont,
  }), [activeLeague.logoUrl, activeLeague.name, activePresetKind, activeSeason.name, openingAccent, openingDate, openingHeadlineFont, openingLogoOverride, openingRound, openingSubtitle, openingTime, openingTitle, openingVenue])

  const base = { leagueName: activeLeague.name, seasonName: activeSeason.name, leagueLogoUrl: activeLeague.logoUrl, template: "opening_day_premium_01" as const, accentColor: openingAccent, headlineFont: openingHeadlineFont }
  const pieces: Array<{ kind: LeagueMediaKitKind; data: LeagueMediaKitImageData; disabled?: boolean }> = [
    { kind: "rules", data: { ...base, kind: "rules", eyebrow: "Información oficial", title: "Reglas de la liga", subtitle: "Todo listo para competir", eventDateLabel: roundSettings.requiresThreeSets ? "3 SETS OBLIGATORIOS" : "RESULTADO FLEXIBLE", roundLabel: "REGLAS", eventTimeLabel: roundSettings.mvpSystem === "none" ? "SIN MVP" : "CON MVP", venue: "EN LA APP", rows: [
      { label: "Formato", value: roundSettings.requiresThreeSets ? "3 sets obligatorios" : "Resultado flexible" },
      { label: "MVP", value: roundSettings.mvpSystem === "voting" ? "Votación" : roundSettings.mvpSystem === "none" ? "Sin MVP" : "Automático" },
      { label: "Confirmación", value: roundSettings.resultConfirmationMode === "required" ? "Obligatoria" : roundSettings.resultConfirmationMode === "none" ? "Sin confirmación" : "Opcional" },
      { label: "Plazo", value: roundSettings.roundWindowMode === "fixed-days" ? `${roundSettings.roundWindowDays ?? "—"} días / jornada` : "Sin plazo fijo" },
    ], bullets: ["Consulta el detalle completo de la temporada dentro de Smash & Lob."] } },
    { kind: "registration", data: { ...base, kind: "registration", eyebrow: "Únete a la competición", title: "Inscripciones", subtitle: roundSettings.rosterMode === "self_registration" ? "Plantilla abierta" : "Plazas gestionadas por la organización", eventDateLabel: roundSettings.registrationOpen ? "INSCRIPCIONES ABIERTAS" : "INSCRIPCIONES CERRADAS", roundLabel: `${players.length}${roundSettings.playerCapacity ? ` / ${roundSettings.playerCapacity}` : ""} JUGADORES`, eventTimeLabel: activeLeague.inviteCode || "APP", venue: roundSettings.registrationFee.enabled ? `${roundSettings.registrationFee.amount} €` : "SIN CUOTA", heroLabel: "Código de invitación", heroValue: activeLeague.inviteCode || "Desde la app", rows: [
      { label: "Jugadores", value: `${players.length}${roundSettings.playerCapacity ? ` / ${roundSettings.playerCapacity}` : ""}` },
      { label: "Estado", value: roundSettings.registrationOpen ? "Abiertas" : "Cerradas" },
      { label: "Inscripción", value: roundSettings.registrationFee.enabled ? `${roundSettings.registrationFee.amount} €` : "Sin cuota" },
    ] } },
    { kind: "calendar", data: { ...base, kind: "calendar", eyebrow: "Temporada", title: "Próxima jornada", subtitle: "Calendario oficial", eventDateLabel: rounds[0]?.startsAt ? formatShortDate(rounds[0].startsAt).toLocaleUpperCase("es-ES") : `${activeSeason.totalRounds} JORNADAS`, roundLabel: `JORNADA ${rounds.find((round) => round.status === "active")?.round ?? 1}`, eventTimeLabel: `${activeSeason.completedRounds}/${activeSeason.totalRounds}`, venue: `${matches.length} PARTIDOS`, rows: [
      { label: "Jornadas", value: String(activeSeason.totalRounds) },
      { label: "Completadas", value: `${activeSeason.completedRounds} / ${activeSeason.totalRounds}` },
      { label: "Partidos", value: String(matches.length) },
      { label: "Formato", value: roundSettings.scheduleMode === "double" ? "Ida y vuelta" : roundSettings.scheduleMode === "extended" ? "Extendido" : "Una vuelta" },
    ], bullets: rounds.slice(0, 4).map((round) => {
      const windowText = round.startsAt && round.endsAt ? `${formatShortDate(round.startsAt)}–${formatShortDate(round.endsAt)}` : null
      const status = round.status === "completed" ? "completada" : round.status === "active" ? "en curso" : round.status === "overdue" ? "fuera de plazo" : "pendiente"
      return `Jornada ${round.round}${windowText ? ` · ${windowText}` : ""} · ${status}`
    }) } },
    { kind: "start", data: { ...base, kind: "start", eyebrow: "Reserva la fecha", title: "Inicio de temporada", subtitle: activeSeason.name, eventDateLabel: scheduledLabel?.split(" · ")[0] ?? "FECHA POR CONFIRMAR", roundLabel: "TEMPORADA", eventTimeLabel: scheduledLabel?.split(" · ")[1] ?? "PRÓXIMAMENTE", venue: `${players.length} JUGADORES`, heroLabel: scheduledLabel ? "Comienza" : "Estado", heroValue: scheduledLabel ?? "Inicio pendiente", rows: [
      { label: "Temporada", value: activeSeason.name },
      { label: "Jugadores", value: String(players.length) },
      { label: "Jornadas", value: String(activeSeason.totalRounds) },
    ] } },
    { kind: "countdown", disabled: !roundSettings.scheduledStartAt, data: { ...base, kind: "countdown", eyebrow: "Cuenta atrás", title: "Empieza la competición", subtitle: scheduledLabel ?? "Configura una fecha de inicio", eventDateLabel: countdown && !countdown.isDue ? `${countdown.days} DÍAS` : roundSettings.scheduledStartAt ? "ARRANCANDO" : "SIN FECHA", roundLabel: "FALTAN", eventTimeLabel: countdown && !countdown.isDue ? `${String(countdown.hours).padStart(2, "0")}H` : "—", venue: countdown && !countdown.isDue ? `${String(countdown.minutes).padStart(2, "0")} MIN` : "—", heroLabel: countdown && !countdown.isDue ? "Falta" : "Estado", heroValue: countdown && !countdown.isDue ? `${countdown.days}d ${String(countdown.hours).padStart(2, "0")}h ${String(countdown.minutes).padStart(2, "0")}m` : roundSettings.scheduledStartAt ? "Arrancando" : "Sin fecha", rows: scheduledLabel ? [{ label: "Inicio", value: scheduledLabel }] : [] } },
  ]

  const openingPresetData: LeagueMediaKitImageData = {
    ...base,
    kind: "opening",
    eyebrow: "Evento oficial",
    title: "Apertura",
    subtitle: "",
    eventDateLabel: initialOpeningLabels.date,
    eventTimeLabel: initialOpeningLabels.time,
    venue: firstOpeningMatch?.location ?? "El Pando",
    roundLabel: "Jornada 1",
    rows: [],
  }
  const presets = [{ kind: "opening" as const, data: openingPresetData, disabled: false }, ...pieces]

  function loadPreset(kind: LeagueMediaKitKind, data: LeagueMediaKitImageData) {
    setActivePresetKind(kind)
    setOpeningTitle(data.title)
    setOpeningSubtitle(data.subtitle ?? "")
    setOpeningDate(data.eventDateLabel ?? "")
    setOpeningTime(data.eventTimeLabel ?? "")
    setOpeningRound(data.roundLabel ?? "")
    setOpeningVenue(data.venue ?? "")
    window.requestAnimationFrame(() => document.getElementById("media-kit-customizer")?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }

  function selectPresetAccent(color: string) {
    setOpeningAccent(color)
    setCustomAccentDraft(color)
    setShowCustomAccent(false)
  }

  function updateCustomAccent(value: string) {
    setCustomAccentDraft(value)
    if (/^#[0-9a-f]{6}$/i.test(value)) setOpeningAccent(value)
  }

  async function sharePiece(kind: LeagueMediaKitKind, data: LeagueMediaKitImageData) {
    if (busy) return
    setBusy(kind)
    try {
      const liveCountdown = kind === "countdown" ? getSeasonCountdown(roundSettings.scheduledStartAt) : null
      const exportData = kind === "countdown" && liveCountdown ? { ...data, heroValue: liveCountdown.isDue ? "Arrancando" : `${liveCountdown.days}d ${String(liveCountdown.hours).padStart(2, "0")}h ${String(liveCountdown.minutes).padStart(2, "0")}m`, eventDateLabel: liveCountdown.isDue ? "ARRANCANDO" : `${liveCountdown.days} DÍAS`, eventTimeLabel: `${String(liveCountdown.hours).padStart(2, "0")}H`, venue: `${String(liveCountdown.minutes).padStart(2, "0")} MIN` } : data
      const blob = await createLeagueMediaKitImage(exportData)
      const filename = `${slug(activeLeague.name)}-${slug(activeSeason.name)}-${kind}.png`
      const file = new File([blob], filename, { type: "image/png" })
      if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ title: `${activeLeague.name} · ${titles[kind]}`, text: `${titles[kind]} · Smash & Lob`, files: [file] })
      else downloadLeagueMediaKitImage(blob, filename)
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) window.alert("No se ha podido generar la imagen.")
    } finally { setBusy(null) }
  }

  async function downloadPiece(kind: LeagueMediaKitKind, data: LeagueMediaKitImageData) {
    if (busy) return
    setBusy(kind)
    try {
      const blob = await createLeagueMediaKitImage(data)
      downloadLeagueMediaKitImage(blob, `${slug(activeLeague.name)}-${slug(activeSeason.name)}-${kind}.png`)
    } catch {
      window.alert("No se ha podido generar la imagen.")
    } finally { setBusy(null) }
  }

  function handleLogoOverride(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { if (typeof reader.result === "string") setOpeningLogoOverride(reader.result) }
    reader.readAsDataURL(file)
  }

  if (!canManage) return <div className="space-y-4"><BackButton fallbackHref="/" label="Volver" /><AppCard><p className="font-black">Acceso restringido</p></AppCard></div>

  return (
    <div className="space-y-3">
      <header className="app-page-header"><BackButton fallbackHref="/admin" label="Volver" /><div><h1 className="type-page-title">Centro de difusión</h1><p className="mt-1 text-xs font-semibold text-neutral-500">Carteles 4:5 con logo y datos reales de esta liga.</p></div></header>
      {roundSettings.scheduledStartAt ? <SeasonStartCountdown scheduledStartAt={roundSettings.scheduledStartAt} compact /> : null}

      <AppCard className="overflow-hidden p-0">
        <section className="border-b border-neutral-200 bg-neutral-50 px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between gap-3"><div><h2 className="text-xs font-black uppercase tracking-[.14em] text-neutral-900">Presets</h2><p className="text-[10px] font-semibold text-neutral-500">Carga una base y edítala en la misma vista.</p></div><span className="text-[10px] font-black text-neutral-400">Premium 01 · 4:5</span></div>
          <div className="grid grid-cols-6 gap-1">
            {presets.map(({ kind, data, disabled }) => {
              const isActive = activePresetKind === kind
              return <button key={kind} type="button" title={disabled ? "Configura fecha de inicio" : data.subtitle || titles[kind]} aria-pressed={isActive} disabled={Boolean(disabled || busy)} onClick={() => loadPreset(kind, data)} className={`min-h-7 min-w-0 rounded-lg border px-0.5 py-1 text-[8px] font-black leading-tight tracking-[-.03em] transition disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 ${isActive ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"}`}>{disabled ? "Espera" : compactPresetTitles[kind]}</button>
            })}
          </div>
        </section>

        <div id="media-kit-customizer" className="grid scroll-mt-4 grid-cols-[158px_minmax(0,1fr)] items-start gap-2.5 p-2.5">
          <section className="rounded-xl bg-neutral-950 p-2 text-white">
            <div className="mb-1.5 flex items-center gap-1.5"><p className="text-[9px] font-black uppercase tracking-[.14em] text-amber-300">Vista previa</p><span className="text-[9px] font-bold text-neutral-400">· {titles[activePresetKind]}</span></div>
            <div className="mx-auto w-full max-w-[155px]"><MediaKitPosterPreview data={openingData} /></div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button type="button" disabled={Boolean(busy)} onClick={() => void sharePiece(activePresetKind, openingData)} className="inline-flex min-h-8 items-center justify-center rounded-lg bg-white px-2 py-1.5 text-center text-[10px] font-black text-neutral-950 disabled:bg-neutral-500">{busy === activePresetKind ? "Generando…" : "Compartir"}</button>
              <button type="button" aria-label="Descargar PNG" disabled={Boolean(busy)} onClick={() => void downloadPiece(activePresetKind, openingData)} className="inline-flex min-h-8 items-center justify-center rounded-lg border border-white/20 px-2 py-1.5 text-center text-[10px] font-black text-white disabled:text-neutral-500">PNG</button>
            </div>
          </section>

          <section className="min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2"><h2 className="text-xs font-black leading-tight text-neutral-950">Personalización y vista previa</h2><span className="shrink-0 rounded-full bg-neutral-100 px-1.5 py-1 text-[8px] font-black uppercase text-neutral-500">{compactPresetTitles[activePresetKind]}</span></div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-[9px] font-black text-neutral-700">Titular<input className={fieldClass} value={openingTitle} onChange={(event) => setOpeningTitle(event.target.value)} maxLength={34} /></label>
              <label className="text-[9px] font-black text-neutral-700">Subtítulo<input className={fieldClass} value={openingSubtitle} onChange={(event) => setOpeningSubtitle(event.target.value)} maxLength={44} placeholder="Opcional" /></label>
              <label className="text-[9px] font-black leading-tight text-neutral-700">Destacado<input className={fieldClass} value={openingDate} onChange={(event) => setOpeningDate(event.target.value)} maxLength={28} /></label>
              <label className="text-[9px] font-black leading-tight text-neutral-700">Dato central<input className={fieldClass} value={openingTime} onChange={(event) => setOpeningTime(event.target.value)} maxLength={12} /></label>
              <label className="text-[9px] font-black leading-tight text-neutral-700">Etiqueta izq.<input className={fieldClass} value={openingRound} onChange={(event) => setOpeningRound(event.target.value)} maxLength={22} /></label>
              <label className="text-[9px] font-black leading-tight text-neutral-700">Etiqueta dcha.<input className={fieldClass} value={openingVenue} onChange={(event) => setOpeningVenue(event.target.value)} maxLength={24} /></label>
            </div>

            <div className="grid gap-2">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                <p className="text-[10px] font-black text-neutral-800">Diseño del titular</p>
                <select aria-label="Diseño del titular" value={openingHeadlineFont} onChange={(event) => setOpeningHeadlineFont(event.target.value as LeagueMediaKitHeadlineFont)} className="mt-1 h-7 w-full rounded-md border border-neutral-200 bg-white px-2 text-[9px] font-black text-neutral-800 outline-none focus:border-neutral-500">{openingHeadlineFontOptions.map((option) => <option key={option.id} value={option.id}>{option.label} · {option.detail}</option>)}</select>
              </div>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                <p className="text-[10px] font-black text-neutral-800">Color de acento</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-0.5">
                  {openingAccentOptions.map((color) => <button key={color} type="button" aria-label={`Usar color ${color}`} onClick={() => selectPresetAccent(color)} className={`h-4 w-4 rounded-full border-2 ${!showCustomAccent && openingAccent === color ? "border-neutral-950 ring-1 ring-neutral-300" : "border-white"}`} style={{ backgroundColor: color }} />)}
                  <button type="button" aria-label="Color personalizado" aria-expanded={showCustomAccent} onClick={() => { setShowCustomAccent((current) => !current); setCustomAccentDraft(openingAccent) }} className={`inline-flex min-h-6 items-center gap-1 rounded-full border px-2 text-[9px] font-black ${showCustomAccent ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300 bg-white text-neutral-700"}`}><span aria-hidden="true">+</span> Propio</button>
                </div>
                {showCustomAccent ? <div className="mt-2 grid grid-cols-[36px_1fr] gap-1.5"><input aria-label="Selector de color personalizado" type="color" value={openingAccent} onChange={(event) => { setOpeningAccent(event.target.value); setCustomAccentDraft(event.target.value) }} className="h-8 w-9 cursor-pointer rounded-md border border-neutral-200 bg-white p-0.5" /><input aria-label="Código hexadecimal personalizado" value={customAccentDraft} onChange={(event) => updateCustomAccent(event.target.value)} maxLength={7} placeholder="#D7A544" className="h-8 rounded-md border border-neutral-200 px-2 text-[10px] font-black uppercase text-neutral-900 outline-none focus:border-neutral-500" /></div> : null}
                <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-neutral-200 pt-1.5"><span className="text-[9px] font-black text-neutral-600">Logo de liga</span><div className="flex gap-1"><label className="cursor-pointer rounded-md bg-white px-2 py-1 text-[9px] font-black text-neutral-700">Cambiar<input className="sr-only" type="file" accept="image/*" onChange={(event) => handleLogoOverride(event.target.files?.[0])} /></label>{openingLogoOverride ? <button type="button" onClick={() => setOpeningLogoOverride(null)} className="rounded-md border border-neutral-200 px-2 py-1 text-[9px] font-black text-neutral-700">Restaurar</button> : null}</div></div>
              </div>
            </div>
          </section>
        </div>
      </AppCard>

    </div>
  )
}
