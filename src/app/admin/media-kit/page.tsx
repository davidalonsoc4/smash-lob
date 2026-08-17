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
  type LeagueMediaKitKind,
} from "@/lib/leagueMediaKitImage"

const titles: Record<LeagueMediaKitKind, string> = {
  opening: "Jornada de apertura",
  rules: "Reglas de la liga",
  registration: "Inscripciones",
  calendar: "Calendario",
  start: "Inicio de liga",
  countdown: "Cuenta atrás",
}

const openingAccentOptions = ["#d7a544", "#bb9448", "#d4643c", "#3d9d86", "#477bd1", "#8b5fc0"]
const fieldClass = "mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold text-neutral-950 outline-none transition focus:border-neutral-500"

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
        {previewUrl ? <Image unoptimized src={previewUrl} width={1080} height={1350} alt="Vista previa del cartel Jornada de apertura" className="h-full w-full object-cover" /> : null}
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
  const [openingTitle, setOpeningTitle] = useState("Jornada de apertura")
  const [openingSubtitle, setOpeningSubtitle] = useState("")
  const [openingDate, setOpeningDate] = useState(initialOpeningLabels.date)
  const [openingTime, setOpeningTime] = useState(initialOpeningLabels.time)
  const [openingVenue, setOpeningVenue] = useState(firstOpeningMatch?.location ?? "El Pando")
  const [openingRound, setOpeningRound] = useState("Jornada 1")
  const [openingFooter, setOpeningFooter] = useState("Smash & Lob")
  const [openingAccent, setOpeningAccent] = useState("#d7a544")
  const [openingLogoOverride, setOpeningLogoOverride] = useState<string | null>(null)
  const canManage = isLeagueAdmin(activeLeague.id)
  const scheduledLabel = formatScheduledSeasonStart(roundSettings.scheduledStartAt)
  const countdown = getSeasonCountdown(roundSettings.scheduledStartAt)

  const openingData = useMemo<LeagueMediaKitImageData>(() => ({
    kind: "opening",
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
    footerLabel: openingFooter,
  }), [activeLeague.logoUrl, activeLeague.name, activeSeason.name, openingAccent, openingDate, openingFooter, openingLogoOverride, openingRound, openingSubtitle, openingTime, openingTitle, openingVenue])

  const base = { leagueName: activeLeague.name, seasonName: activeSeason.name, leagueLogoUrl: activeLeague.logoUrl, template: "opening_day_premium_01" as const, accentColor: openingAccent }
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
    <div className="space-y-5">
      <header className="app-page-header"><BackButton fallbackHref="/admin" label="Volver" /><div><h1 className="type-page-title">Centro de difusión</h1><p className="mt-1 text-xs font-semibold text-neutral-500">Carteles 4:5 con logo y datos reales de esta liga.</p></div></header>
      {roundSettings.scheduledStartAt ? <SeasonStartCountdown scheduledStartAt={roundSettings.scheduledStartAt} compact /> : null}

      <AppCard className="overflow-hidden p-0">
        <div className="border-b border-neutral-200 bg-neutral-950 px-4 py-4 text-white">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-amber-300">Plantilla principal</p><h2 className="mt-1 text-xl font-black">Jornada de apertura</h2><p className="mt-1 text-xs font-semibold text-neutral-400">Premium 01 · 4:5</p></div><span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-200">Editable</span></div>
        </div>
        <div className="space-y-5 p-4">
          <div className="mx-auto w-full max-w-[390px]"><MediaKitPosterPreview data={openingData} /></div>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-black text-neutral-700 sm:col-span-2">Título principal<input className={fieldClass} value={openingTitle} onChange={(event) => setOpeningTitle(event.target.value)} maxLength={34} /></label>
              <label className="text-xs font-black text-neutral-700 sm:col-span-2">Texto secundario opcional<input className={fieldClass} value={openingSubtitle} onChange={(event) => setOpeningSubtitle(event.target.value)} maxLength={44} placeholder="El mejor pádel empieza aquí" /></label>
              <label className="text-xs font-black text-neutral-700">Fecha<input className={fieldClass} value={openingDate} onChange={(event) => setOpeningDate(event.target.value)} maxLength={28} /></label>
              <label className="text-xs font-black text-neutral-700">Hora<input className={fieldClass} value={openingTime} onChange={(event) => setOpeningTime(event.target.value)} maxLength={12} /></label>
              <label className="text-xs font-black text-neutral-700">Jornada<input className={fieldClass} value={openingRound} onChange={(event) => setOpeningRound(event.target.value)} maxLength={22} /></label>
              <label className="text-xs font-black text-neutral-700">Lugar<input className={fieldClass} value={openingVenue} onChange={(event) => setOpeningVenue(event.target.value)} maxLength={24} /></label>
              <label className="text-xs font-black text-neutral-700 sm:col-span-2">Firma inferior<input className={fieldClass} value={openingFooter} onChange={(event) => setOpeningFooter(event.target.value)} maxLength={30} /></label>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black text-neutral-800">Color de acento</p><p className="mt-1 text-[11px] font-semibold leading-4 text-neutral-500">Recolorea luces, líneas, titular y detalles del cartel sin alterar la base carbón.</p></div><input aria-label="Color de acento personalizado" type="color" value={openingAccent} onChange={(event) => setOpeningAccent(event.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-neutral-200 bg-white p-1" /></div>
              <div className="mt-3 flex flex-wrap gap-2">{openingAccentOptions.map((color) => <button key={color} type="button" aria-label={`Usar color ${color}`} onClick={() => setOpeningAccent(color)} className={`h-8 w-8 rounded-full border-2 shadow-sm ${openingAccent === color ? "border-neutral-950 ring-2 ring-neutral-300" : "border-white"}`} style={{ backgroundColor: color }} />)}</div>
            </div>

            <div className="rounded-2xl border border-neutral-200 p-3">
              <p className="text-xs font-black text-neutral-800">Logo</p><p className="mt-1 text-[11px] font-semibold text-neutral-500">Se usa el logo de la liga. El cambio solo afecta a esta imagen.</p>
              <div className="mt-3 flex flex-wrap gap-2"><label className="cursor-pointer rounded-xl bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-800">Elegir logo alternativo<input className="sr-only" type="file" accept="image/*" onChange={(event) => handleLogoOverride(event.target.files?.[0])} /></label>{openingLogoOverride ? <button type="button" onClick={() => setOpeningLogoOverride(null)} className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-black text-neutral-700">Restaurar logo liga</button> : null}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled={Boolean(busy)} onClick={() => void sharePiece("opening", openingData)} className="inline-flex items-center justify-center rounded-xl bg-neutral-950 px-3 py-3 text-center text-xs font-black text-white shadow-lg shadow-neutral-950/15 disabled:bg-neutral-400">{busy === "opening" ? "Generando…" : "Compartir / descargar"}</button>
              <button type="button" disabled={Boolean(busy)} onClick={() => void downloadPiece("opening", openingData)} className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-3 py-3 text-center text-xs font-black text-neutral-900 disabled:text-neutral-400">Descargar PNG</button>
            </div>
          </div>
        </div>
      </AppCard>

      <section className="space-y-3"><div><h2 className="text-lg font-black text-neutral-950">Misma familia visual</h2><p className="mt-1 text-xs font-semibold text-neutral-500">Equivalentes de campaña derivados de Premium 01.</p></div><div className="grid gap-3 sm:grid-cols-2">
        {pieces.map(({ kind, data, disabled }) => (
          <AppCard key={kind}>
            <div className="flex items-start justify-between gap-3"><div><p className="font-black text-neutral-950">{titles[kind]}</p><p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{data.subtitle}</p></div><span className="rounded-full bg-neutral-100 px-2 py-1 type-caption font-black uppercase text-neutral-500">Premium 01</span></div>
            <button type="button" disabled={Boolean(disabled || busy)} onClick={() => void sharePiece(kind, data)} className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-neutral-950 px-3 py-2.5 text-center text-xs font-black text-white disabled:bg-neutral-300">{busy === kind ? "Generando…" : disabled ? "Configura fecha de inicio" : "Compartir imagen"}</button>
          </AppCard>
        ))}
      </div></section>
    </div>
  )
}
