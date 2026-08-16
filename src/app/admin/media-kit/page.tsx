"use client"

import { useState } from "react"
import { BackButton } from "@/components/ui/BackButton"
import { AppCard } from "@/components/ui/AppCard"
import { SeasonStartCountdown } from "@/components/season/SeasonStartCountdown"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { getSeasonCountdown, formatScheduledSeasonStart } from "@/lib/seasonScheduling"
import { formatShortDate } from "@/lib/rounds"
import {
  createLeagueMediaKitImage,
  downloadLeagueMediaKitImage,
  type LeagueMediaKitImageData,
  type LeagueMediaKitKind,
} from "@/lib/leagueMediaKitImage"

const titles: Record<LeagueMediaKitKind, string> = {
  rules: "Reglas de la liga",
  registration: "Inscripciones",
  calendar: "Calendario",
  start: "Inicio de liga",
  countdown: "Cuenta atrás",
}

function slug(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() }

export default function MediaKitPage() {
  const { isLeagueAdmin } = useLeagueAccess()
  const { activeLeague, activeSeason, roundSettings, rounds, matches, players } = useCurrentLeagueData()
  const [busy, setBusy] = useState<LeagueMediaKitKind | null>(null)
  const canManage = isLeagueAdmin(activeLeague.id)
  const scheduledLabel = formatScheduledSeasonStart(roundSettings.scheduledStartAt)
  const countdown = getSeasonCountdown(roundSettings.scheduledStartAt)

  const base = { leagueName: activeLeague.name, seasonName: activeSeason.name, leagueLogoUrl: activeLeague.logoUrl }
  const pieces: Array<{ kind: LeagueMediaKitKind; data: LeagueMediaKitImageData; disabled?: boolean }> = [
      { kind: "rules", data: { ...base, kind: "rules", eyebrow: "Información oficial", title: "Reglas de la liga", subtitle: "Una pieza compacta con las reglas competitivas principales.", rows: [
        { label: "Formato", value: roundSettings.requiresThreeSets ? "3 sets obligatorios" : "Resultado flexible" },
        { label: "MVP", value: roundSettings.mvpSystem === "voting" ? "Votación" : roundSettings.mvpSystem === "none" ? "Sin MVP" : "Automático" },
        { label: "Confirmación", value: roundSettings.resultConfirmationMode === "required" ? "Obligatoria" : roundSettings.resultConfirmationMode === "none" ? "Sin confirmación" : "Opcional" },
        { label: "Plazo", value: roundSettings.roundWindowMode === "fixed-days" ? `${roundSettings.roundWindowDays ?? "—"} días / jornada` : "Sin plazo fijo" },
      ], bullets: ["Consulta el detalle completo de la temporada dentro de Smash & Lob."] } },
      { kind: "registration", data: { ...base, kind: "registration", eyebrow: "Únete a la competición", title: "Inscripciones", subtitle: roundSettings.rosterMode === "self_registration" ? "Plantilla abierta a autoinscripción desde la aplicación." : "Plantilla gestionada por la organización.", heroLabel: "Código de invitación", heroValue: activeLeague.inviteCode || "Desde la app", rows: [
        { label: "Jugadores", value: `${players.length}${roundSettings.playerCapacity ? ` / ${roundSettings.playerCapacity}` : ""}` },
        { label: "Estado", value: roundSettings.registrationOpen ? "Abiertas" : "Cerradas" },
        { label: "Inscripción", value: roundSettings.registrationFee.enabled ? `${roundSettings.registrationFee.amount} €` : "Sin cuota" },
      ] } },
      { kind: "calendar", data: { ...base, kind: "calendar", eyebrow: "Temporada", title: "Calendario", subtitle: "Resumen del calendario competitivo de la temporada.", rows: [
        { label: "Jornadas", value: String(activeSeason.totalRounds) },
        { label: "Completadas", value: `${activeSeason.completedRounds} / ${activeSeason.totalRounds}` },
        { label: "Partidos", value: String(matches.length) },
        { label: "Formato", value: roundSettings.scheduleMode === "double" ? "Ida y vuelta" : roundSettings.scheduleMode === "extended" ? "Extendido" : "Una vuelta" },
      ], bullets: rounds.slice(0, 4).map((round) => {
        const windowText = round.startsAt && round.endsAt
          ? `${formatShortDate(round.startsAt)}–${formatShortDate(round.endsAt)}`
          : null
        const status = round.status === "completed"
          ? "completada"
          : round.status === "active"
            ? "en curso"
            : round.status === "overdue"
              ? "fuera de plazo"
              : "pendiente"
        return `Jornada ${round.round}${windowText ? ` · ${windowText}` : ""} · ${status}`
      }) } },
      { kind: "start", data: { ...base, kind: "start", eyebrow: "Reserva la fecha", title: "Inicio de liga", subtitle: scheduledLabel ? "La temporada se activará automáticamente en la fecha programada." : "La fecha de inicio se confirmará desde la administración.", heroLabel: scheduledLabel ? "Comienza" : "Estado", heroValue: scheduledLabel ?? "Inicio pendiente", rows: [
        { label: "Temporada", value: activeSeason.name },
        { label: "Jugadores", value: String(players.length) },
        { label: "Jornadas", value: String(activeSeason.totalRounds) },
      ] } },
      { kind: "countdown", disabled: !roundSettings.scheduledStartAt, data: { ...base, kind: "countdown", eyebrow: "Cuenta atrás", title: "Empieza la competición", subtitle: scheduledLabel ?? "Configura una fecha de inicio programada para generar esta pieza.", heroLabel: countdown && !countdown.isDue ? "Falta" : "Estado", heroValue: countdown && !countdown.isDue ? `${countdown.days}d ${String(countdown.hours).padStart(2, "0")}h ${String(countdown.minutes).padStart(2, "0")}m` : roundSettings.scheduledStartAt ? "Arrancando" : "Sin fecha", rows: scheduledLabel ? [{ label: "Inicio", value: scheduledLabel }] : [] } },
  ]

  async function sharePiece(kind: LeagueMediaKitKind, data: LeagueMediaKitImageData) {
    if (busy) return
    setBusy(kind)
    try {
      const liveCountdown = kind === "countdown"
        ? getSeasonCountdown(roundSettings.scheduledStartAt)
        : null
      const exportData = kind === "countdown" && liveCountdown
        ? {
            ...data,
            heroValue: liveCountdown.isDue
              ? "Arrancando"
              : `${liveCountdown.days}d ${String(liveCountdown.hours).padStart(2, "0")}h ${String(liveCountdown.minutes).padStart(2, "0")}m`,
          }
        : data
      const blob = await createLeagueMediaKitImage(exportData)
      const filename = `${slug(activeLeague.name)}-${slug(activeSeason.name)}-${kind}.png`
      const file = new File([blob], filename, { type: "image/png" })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `${activeLeague.name} · ${titles[kind]}`, text: `${titles[kind]} · Smash & Lob`, files: [file] })
      } else downloadLeagueMediaKitImage(blob, filename)
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) window.alert("No se ha podido generar la imagen.")
    } finally { setBusy(null) }
  }

  if (!canManage) return <div className="space-y-4"><BackButton fallbackHref="/" label="Volver" /><AppCard><p className="font-black">Acceso restringido</p></AppCard></div>

  return (
    <div className="space-y-4">
      <header className="app-page-header"><BackButton fallbackHref="/admin" label="Volver" /><h1 className="type-page-title">Centro de difusión</h1></header>
      {roundSettings.scheduledStartAt ? <SeasonStartCountdown scheduledStartAt={roundSettings.scheduledStartAt} compact /> : null}
      <div className="grid gap-3">
        {pieces.map(({ kind, data, disabled }) => (
          <AppCard key={kind}>
            <div className="flex items-start justify-between gap-3"><div><p className="font-black text-neutral-950">{titles[kind]}</p><p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{data.subtitle}</p></div><span className="rounded-full bg-neutral-100 px-2 py-1 type-caption font-black uppercase text-neutral-500">PNG 4:5</span></div>
            <button type="button" disabled={Boolean(disabled || busy)} onClick={() => void sharePiece(kind, data)} className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-neutral-950 px-3 py-2.5 text-center text-xs font-black text-white disabled:bg-neutral-300">{busy === kind ? "Generando…" : disabled ? "Configura fecha de inicio" : "Compartir imagen"}</button>
          </AppCard>
        ))}
      </div>
    </div>
  )
}
