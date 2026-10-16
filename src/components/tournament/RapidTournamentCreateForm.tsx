import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { getLeagueLocationOptionLabel, sortLeagueLocationsByOptionLabel, type LeagueLocation } from "@/lib/leagueLocations"
import { buildRapidRounds, RAPID_TOURNAMENT, validateTournamentParticipants } from "@/lib/rapidTournament"
import styles from "./Tournament.module.css"
import { PREPARATION_MS } from "@/lib/rapidTournamentTiming"

const fieldClass = styles.field

function defaultStart() {
  const date = new Date()
  date.setHours(date.getHours() + 1, 0, 0, 0)
  return { date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`, time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}` }
}

function localDateTime(date: string, time: string) {
  return date && time ? new Date(`${date}T${time}`) : null
}

function uniqueLocationOptions(locations: LeagueLocation[]) {
  const seen = new Set<string>()
  return sortLeagueLocationsByOptionLabel(locations).filter((location) => {
    const label = getLeagueLocationOptionLabel(location)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLocaleLowerCase("es-ES")
    if (seen.has(label)) return false
    seen.add(label)
    return true
  })
}

export function RapidTournamentCreateForm() {
  const { tx, locale } = useI18n()
  const router = useRouter()
  const [initial] = useState(defaultStart)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(initial.date)
  const [time, setTime] = useState(initial.time)
  const [locations, setLocations] = useState<LeagueLocation[]>([])
  const [locationId, setLocationId] = useState("")
  const [locationsLoading, setLocationsLoading] = useState(true)
  const [players, setPlayers] = useState(Array<string>(12).fill(""))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNowTimestamp(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    let cancelled = false
    fetch("/api/locations", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { locations?: LeagueLocation[] }
        if (!response.ok) throw new Error("global_locations_lookup_failed")
        return uniqueLocationOptions(payload.locations ?? [])
      })
      .then((items) => { if (!cancelled) setLocations(items) })
      .catch(() => { if (!cancelled) setLocations([]) })
      .finally(() => { if (!cancelled) setLocationsLoading(false) })
    return () => { cancelled = true }
  }, [])
  const participants = validateTournamentParticipants(players)
  const selectedLocation = locations.find((location) => location.id === locationId) ?? null
  const courtNames = selectedLocation
    ? [`${getLeagueLocationOptionLabel(selectedLocation)} · Pista 1`, `${getLeagueLocationOptionLabel(selectedLocation)} · Pista 2`]
    : ["Pista 1", "Pista 2"]
  const startsAt = localDateTime(date, time)
  const rounds = startsAt && Number.isFinite(startsAt.getTime()) ? buildRapidRounds(new Date(startsAt.getTime() + PREPARATION_MS)) : []
  const dateFormat = new Intl.DateTimeFormat(locale === "eu" ? "eu-ES" : locale === "en" ? "en-GB" : "es-ES", { dateStyle: "medium" })
  const timeFormat = new Intl.DateTimeFormat(locale === "eu" ? "eu-ES" : locale === "en" ? "en-GB" : "es-ES", { hour: "2-digit", minute: "2-digit" })
  const duplicateMessage = !participants.ok && participants.error === "duplicate_player_names"
  const ready = Boolean(name.trim() && startsAt && startsAt.getTime() > nowTimestamp && participants.ok)

  async function createTournament() {
    if (!ready || !startsAt) return
    setSaving(true); setError("")
    try {
      const response = await fetch("/api/tournaments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description, startsAt: startsAt.toISOString(), courtNames, players }) })
      const result = await response.json().catch(() => null)
      if (!response.ok || typeof result?.id !== "string") {
        const message = result?.error === "duplicate_player_names" ? "Hay nombres de jugadores duplicados." : result?.error === "all_player_names_required" ? "Introduce los doce nombres para continuar." : "No se ha podido crear el torneo. Revisa los datos e inténtalo de nuevo."
        setError(tx(message)); return
      }
      router.push(`/tournaments/${result.id}/calendar`)
    } catch {
      setError(tx("No se ha podido crear el torneo. Revisa los datos e inténtalo de nuevo."))
    } finally { setSaving(false) }
  }

  const locked = (label: string, value: string, explanation: string) => <div className={styles.optionRow} aria-disabled="true"><p>{label}</p><p className={styles.value}>{value}</p>{explanation ? <small>{explanation}</small> : null}</div>
  const filledPlayers = players.filter((player) => player.trim()).length

  return <div className={`${styles.theme} ${styles.page}`}>
    <header className={`app-page-header ${styles.header}`}><Link href="/leagues" className="app-top-back-control text-sm font-semibold text-neutral-500">‹ {tx("Mis Competiciones")}</Link><h1 className={`type-page-title font-black ${styles.headerTitle}`}>{tx("Crear torneo rápido")}</h1></header>

    <section aria-labelledby="tournament-mode"><details open className={`${styles.panel} ${styles.section}`}><summary id="tournament-mode"><span className={styles.step} aria-hidden="true">1</span>{tx("Modalidad de torneo")}</summary><div className={styles.sectionBody}>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Modalidad")}</span><select className={fieldClass} defaultValue="rapid" aria-describedby="tournament-mode-help"><option value="rapid">{tx("Torneo rápido")} · {tx("Activo")}</option><option value="traditional" disabled>{tx("Torneo tradicional")} · {tx("Disponible próximamente")}</option></select></label>
      <p id="tournament-mode-help" className={styles.help}>{tx("Competición adaptada a las pistas y al tiempo disponibles.")}</p>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Formato")}</span><select className={fieldClass} defaultValue="balanced-americana" aria-describedby="tournament-format-help"><option value="balanced-americana">{tx("Americana equilibrada")} · {tx("Activa")}</option><option value="mexicana" disabled>{tx("Mexicana")} · {tx("Disponible próximamente")}</option><option value="fixed-pairs" disabled>{tx("Parejas fijas")} · {tx("Disponible próximamente")}</option></select></label>
      <p id="tournament-format-help" className={styles.help}>{tx("Parejas rotativas y calendario fijo generado previamente.")}</p>
      <details className={styles.help}><summary>{tx("Disponible próximamente")}</summary><p>{tx("Torneo tradicional")}: {tx("Eliminatorias, grupos y otras competiciones sin duración limitada.")}</p><p className="mt-2">{tx("Mexicana")}: {tx("Parejas y cruces recalculados según la clasificación.")}</p><p className="mt-2">{tx("Parejas fijas")}: {tx("Se mantiene el compañero durante todo el torneo.")}</p></details>
    </div></details></section>

    <section aria-labelledby="tournament-general"><details open className={`${styles.panel} ${styles.section}`}><summary id="tournament-general"><span className={styles.step} aria-hidden="true">2</span>{tx("Información general")}</summary><div className={styles.sectionBody}>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Nombre del torneo")} *</span><input className={fieldClass} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} required /></label>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Descripción (opcional)")}</span><textarea className={`${fieldClass} min-h-20`} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <div className="grid grid-cols-2 gap-3"><label className="block min-w-0 space-y-1"><span className="text-sm font-bold">{tx("Fecha")}</span><input className={fieldClass} type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label className="block min-w-0 space-y-1"><span className="text-sm font-bold">{tx("Hora de inicio")}</span><input className={fieldClass} type="time" value={time} onChange={(event) => setTime(event.target.value)} required /></label></div>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Ubicación")}</span><select className={fieldClass} value={locationId} onChange={(event) => setLocationId(event.target.value)} disabled={locationsLoading}><option value="">{locationsLoading ? tx("Cargando ubicaciones...") : tx("Sin ubicación seleccionada")}</option>{locations.map((location) => <option key={location.id} value={location.id}>{getLeagueLocationOptionLabel(location)}</option>)}</select><span className="block text-xs text-neutral-500">{tx("La ubicación seleccionada se mostrará junto a las pistas del calendario.")}</span></label>
      <div className="grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-3"><div><label htmlFor="court-count" className="text-sm font-bold">{tx("Número de pistas")}</label><p id="court-count-help" className={styles.help}>{tx("Configuración fija en esta versión.")}</p></div><input id="court-count" className={`${fieldClass} text-center`} type="number" min={1} max={3} value={2} disabled aria-describedby="court-count-help" /></div>
    </div></details></section>

    <section aria-labelledby="tournament-participants"><details open className={`${styles.panel} ${styles.section}`}><summary id="tournament-participants"><span className={styles.step} aria-hidden="true">3</span>{tx("Participantes")}<span className={styles.chip}>{filledPlayers}/12</span></summary><div className={styles.sectionBody}>
      <progress className={styles.progress} value={filledPlayers} max={12} aria-label={tx("Participantes")} />
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Tipo de inscripción")}</span><select className={fieldClass} defaultValue="manual"><option value="manual">{tx("Añadir participantes manualmente")}</option><option value="registered" disabled>{tx("Seleccionar usuarios registrados")} · {tx("Disponible próximamente")}</option><option value="invitation" disabled>{tx("Inscripción mediante invitación")} · {tx("Disponible próximamente")}</option></select></label>
      <p className={styles.help}>{tx("12 jugadores")} · {tx("Individual")}. {tx("No necesitan tener una cuenta de Smash & Lob.")}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">{players.map((player, index) => <label key={index} className={styles.playerField}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><input className={fieldClass} autoComplete="off" placeholder={tx("Nombre")} maxLength={80} value={player} onChange={(event) => setPlayers((value) => value.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} aria-label={`${tx("Jugador")} ${index + 1}`} /></label>)}</div>
      {duplicateMessage ? <p role="alert" className="text-sm font-bold text-red-700">{tx("Hay nombres de jugadores duplicados.")}</p> : !participants.ok && participants.error === "all_player_names_required" ? <p className="text-xs font-semibold text-neutral-500">{tx("Completa los doce nombres. Se ignoran mayúsculas y espacios sobrantes al comprobar duplicados.")}</p> : null}
      <details className={styles.help}><summary>{tx("Disponible próximamente")}</summary>{locked(tx("Seleccionar usuarios registrados"), tx("Solo se pueden añadir nombres manuales."), tx("Disponible próximamente"))}{locked(tx("Inscripción mediante invitación"), tx("Cerrada"), tx("Disponible próximamente"))}{locked(tx("Equilibrio por nivel de juego"), tx("Desactivado"), tx("Disponible próximamente"))}</details>
    </div></details></section>

    <section aria-labelledby="tournament-logistics"><details className={`${styles.panel} ${styles.section}`}><summary id="tournament-logistics">{tx("Logística")}<span className={styles.chip}>{tx("2 pistas · 120 min")}</span></summary><div className={styles.sectionBody}>
      <div className="grid gap-2 sm:grid-cols-2">{locked(tx("Número de pistas"), tx("2"), tx("Configuración fija en esta versión."))}{locked(tx("Tiempo disponible"), tx("120 minutos"), tx("Configuración fija en esta versión."))}{locked(tx("Preparación"), tx("2 minutos"), tx("Desde que pulsas Iniciar torneo."))}{locked(tx("Duración de ronda"), tx("16 minutos"), tx("Puntos corridos durante el tiempo asignado."))}{locked(tx("Tiempo de transición"), tx("3 minutos"), tx("Entre el final de una ronda y el inicio de la siguiente."))}{locked(tx("Número de rondas"), tx("6"), tx("Calendario fijo para doce participantes."))}{locked(tx("Margen de seguridad"), tx("7 minutos"), tx("Margen disponible al final de la reserva."))}</div>
      <div className="rounded-xl bg-neutral-50 p-3"><p className="text-sm font-black">{tx("Planificación automática")} · {tx("Activada")}</p><p className="mt-1 text-xs leading-5 text-neutral-600">{tx("Smash & Lob organiza automáticamente parejas, pistas, rondas y descansos para aprovechar la reserva de manera equilibrada.")}</p></div>
    </div></details></section>

    <section aria-labelledby="tournament-rules"><details className={`${styles.panel} ${styles.section}`}><summary id="tournament-rules">{tx("Reglas de competición")}</summary><div className={styles.sectionBody}>
      {locked(tx("Parejas cambiantes"), tx("Activado"), tx("Las parejas se asignan según el calendario fijo."))}
      {locked(tx("Equilibrio de participación"), tx("Activado"), tx("4 partidos y 2 descansos por participante."))}
      {locked(tx("Minimizar repeticiones de compañeros"), tx("Activado"), "")}
      {locked(tx("Minimizar repeticiones de rivales"), tx("Activado"), "")}
      {locked(tx("Final entre mejores clasificados"), tx("Desactivada"), tx("El campeón sale de la clasificación individual."))}
      {locked(tx("Reordenación dinámica de enfrentamientos"), tx("Desactivada"), tx("Las rondas no dependen de los resultados."))}
    </div></details></section>

    <section aria-labelledby="tournament-scoring"><details className={`${styles.panel} ${styles.section}`}><summary id="tournament-scoring">{tx("Puntuación")}</summary><div className={styles.sectionBody}>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Puntuación")}</span><select className={fieldClass} defaultValue="points"><option value="points">{tx("Puntos corridos")}</option><option disabled>{tx("Juegos tradicionales")} · {tx("Disponible próximamente")}</option><option disabled>{tx("Tie-break o super tie-break")} · {tx("Disponible próximamente")}</option></select></label>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Clasificación")}</span><select className={fieldClass} defaultValue="average"><option value="average">{tx("Clasificación por porcentaje medio")}</option><option disabled>{tx("Clasificación por puntos acumulados")} · {tx("Disponible próximamente")}</option></select></label>
      <p className={styles.help}>16 {tx("minutos")} · {tx("Empates permitidos")} · {tx("Sí")}</p><p className={styles.help}>{tx("Se anota cada punto ganado. Al terminar los 16 minutos se completa el punto en juego; no se usan juegos ni sets. Cada jugador suma el porcentaje de puntos ganados por su pareja en cada partido y la clasificación usa la media de sus partidos.")}</p>
    </div></details></section>

    <section aria-labelledby="tournament-visibility"><details className={`${styles.panel} ${styles.section}`}><summary id="tournament-visibility">{tx("Visibilidad y administración")}</summary><div className={styles.sectionBody}>
      {locked(tx("Torneo privado"), tx("Activo"), tx("Solo tú, desde la cuenta organizadora, puedes consultar y gestionar este torneo."))}
      {locked(tx("Organizador: usuario creador"), tx("Activo"), tx("Consulta y gestión desde la cuenta del organizador"))}
      {locked(tx("Acceso público y espectadores"), tx("Desactivado"), tx("Disponible próximamente"))}
      {locked(tx("Inscripciones abiertas"), tx("Desactivadas"), tx("Disponible próximamente"))}
      {locked(tx("Roles administrativos adicionales"), tx("No hay"), tx("Disponible próximamente"))}
    </div></details></section>

    <section aria-labelledby="tournament-summary" className={`${styles.panel} ${styles.summary}`}><p className={styles.eyebrow}>{tx("Resumen del torneo")}</p><h2 id="tournament-summary" className="mt-2 break-words text-lg font-black">{name.trim() || tx("Nombre del torneo")}</h2><div className="mt-3 flex flex-wrap gap-2"><span className={styles.chip}>{tx("12 jugadores")}</span><span className={styles.chip}>2 {tx("pistas")}</span><span className={styles.chip}>{RAPID_TOURNAMENT.rounds} {tx("rondas")}</span></div>{selectedLocation ? <p className="mt-3 text-sm font-semibold">{getLeagueLocationOptionLabel(selectedLocation)}</p> : null}<p className="mt-2 text-sm font-bold">{startsAt && Number.isFinite(startsAt.getTime()) ? `${dateFormat.format(startsAt)} · ${timeFormat.format(startsAt)}` : tx("Elige fecha y hora")}</p><p className={`${styles.help} mt-1`}>{tx("2 min de preparación · 6 rondas · 16 min · 3 min de transición · 7 min de margen · 120 min de reserva")}</p>
      <details className={`${styles.help} mt-3`}><summary>{tx("Previsualización de horarios")}</summary><ol className={styles.schedulePreview}>{rounds.map((round) => <li key={round.round}><span className="font-black">{tx("Ronda")} {round.round}</span><span className="tabular-nums">{timeFormat.format(new Date(round.startsAt))}–{timeFormat.format(new Date(round.endsAt))}</span></li>)}</ol></details>
    {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
    {startsAt && startsAt.getTime() <= nowTimestamp ? <p className="text-sm font-semibold text-amber-700">{tx("La fecha y hora de inicio deben ser futuras.")}</p> : null}
    <button type="button" onClick={() => void createTournament()} className={`${styles.primary} mt-4 w-full`} disabled={!ready || saving}>{saving ? tx("Creando torneo…") : tx("Crear y generar calendario")}</button>
    </section>
  </div>
}
