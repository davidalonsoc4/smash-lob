import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { getLeagueLocationOptionLabel, sortLeagueLocationsByOptionLabel, type LeagueLocation } from "@/lib/leagueLocations"
import { buildRapidRounds, getRapidActiveCourtCount, getRapidPreparationMax, getRapidRoundCount, validateRapidTournamentConfiguration, validateTournamentParticipants } from "@/lib/rapidTournament"
import styles from "./Tournament.module.css"
type TournamentPerson = { userId: string; displayName: string }
type LeagueRosterPerson = { playerId: string; displayName: string; userId: string | null }
const fieldClass = styles.field
function SelectChevron({ children }: { children: ReactNode }) { return <span className={styles.selectWrap}>{children}<svg aria-hidden="true" viewBox="0 0 20 20" className={styles.selectChevron}><path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg></span> }
function NumberStepper({ label, value, values, onChange, tx }: { label: string; value: number; values: readonly number[]; onChange: (value: number) => void; tx: (text: string) => string }) { const index = values.indexOf(value); return <div className={styles.stepperRow}><span className={styles.stepperLabel}>{label}</span><div className={styles.stepper}><button type="button" aria-label={`${tx("Disminuir")} ${label}`} disabled={index <= 0} onClick={() => onChange(values[index - 1])}>‹</button><output aria-label={`${label}: ${value}`} aria-live="polite">{value}</output><button type="button" aria-label={`${tx("Aumentar")} ${label}`} disabled={index < 0 || index >= values.length - 1} onClick={() => onChange(values[index + 1])}>›</button></div></div> }
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
export function RapidTournamentCreateForm({ initialSource = null }: { initialSource?: { leagueId: string; seasonId: string; leagueName?: string } | null }) {
  const { tx, locale } = useI18n()
  const router = useRouter()
  const [initial] = useState(defaultStart)
  const [name, setName] = useState(() => initialSource?.leagueName ? `TORNEO RÁPIDO DE ${initialSource.leagueName}` : "TORNEO RÁPIDO")
  const nameEdited = useRef(false)
  const [description, setDescription] = useState("")
  const [format, setFormat] = useState<"balanced_americana" | "dynamic_mexicano">("balanced_americana")
  const [date, setDate] = useState(initial.date)
  const [time, setTime] = useState(initial.time)
  const [playerCount, setPlayerCount] = useState(12), [courtCount, setCourtCount] = useState(2), [reservationMinutes, setReservationMinutes] = useState(120), [preparationMinutes, setPreparationMinutes] = useState(2)
  const [locations, setLocations] = useState<LeagueLocation[]>([])
  const [locationId, setLocationId] = useState("")
  const [locationsLoading, setLocationsLoading] = useState(true)
  const [players, setPlayers] = useState(Array<string>(16).fill(""))
  const [playerUserIds, setPlayerUserIds] = useState(Array<string | null>(16).fill(null))
  const [people, setPeople] = useState<TournamentPerson[]>([])
  const [peopleLoading, setPeopleLoading] = useState(true)
  const [accountLinkingAvailable, setAccountLinkingAvailable] = useState(false)
  const [peopleQuery, setPeopleQuery] = useState("")
  const source = initialSource
  const [sourcePlayers, setSourcePlayers] = useState<LeagueRosterPerson[]>([]), [selectedSourcePlayerIds, setSelectedSourcePlayerIds] = useState<string[]>([]), [sourceLoading, setSourceLoading] = useState(Boolean(initialSource)), [sourceError, setSourceError] = useState("")
  const [saving, setSaving] = useState(false), [error, setError] = useState("")
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
  useEffect(() => {
    let cancelled = false
    fetch("/api/tournaments/people", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("tournament_people_lookup_failed")
        const payload = (await response.json()) as { people?: TournamentPerson[]; accountLinkingAvailable?: boolean }
        if (!cancelled) setAccountLinkingAvailable(payload.accountLinkingAvailable === true)
        return payload.people ?? []
      })
      .then((items) => { if (!cancelled) setPeople(items) })
      .catch(() => { if (!cancelled) { setPeople([]); setAccountLinkingAvailable(false) } })
      .finally(() => { if (!cancelled) setPeopleLoading(false) })
    return () => { cancelled = true }
  }, [])
  useEffect(() => {
    if (!initialSource) return
    fetch(`/api/tournaments/people?leagueId=${encodeURIComponent(initialSource.leagueId)}&seasonId=${encodeURIComponent(initialSource.seasonId)}`, { cache: "no-store" })
      .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload?.error ?? "tournament_source_lookup_failed"); if (!nameEdited.current && payload.leagueName) setName(`TORNEO RÁPIDO DE ${String(payload.leagueName).slice(0, 80)}`); return (payload.players ?? []) as LeagueRosterPerson[] })
      .then((items) => { setSourcePlayers(items); setSelectedSourcePlayerIds(items.slice(0, 12).map((item) => item.playerId)); setSourceError("") }).catch(() => setSourceError("No se han podido cargar los jugadores de esta temporada.")).finally(() => setSourceLoading(false))
  }, [initialSource])
  const selectedSourcePlayers = sourcePlayers.filter((player) => selectedSourcePlayerIds.includes(player.playerId)), manualSourceSlots = Math.max(0, playerCount - selectedSourcePlayers.length), formPlayers = source ? [...selectedSourcePlayers.map((player) => player.displayName), ...players.slice(0, manualSourceSlots)] : players.slice(0, playerCount), formPlayerUserIds = source ? [...selectedSourcePlayers.map((player) => player.userId), ...Array<string | null>(manualSourceSlots).fill(null)] : playerUserIds.slice(0, playerCount)
  const participants = validateTournamentParticipants(formPlayers, playerCount)
  const selectedPeople = playerUserIds.map((userId) => people.find((person) => person.userId === userId) ?? null).filter((person): person is TournamentPerson => person !== null)
  const emptyPlayerSlot = players.slice(0, playerCount).findIndex((player) => !player.trim())
  const normalizedPeopleQuery = peopleQuery.trim().toLocaleLowerCase(locale === "eu" ? "eu" : locale === "en" ? "en" : "es")
  const filteredPeople = people
    .filter((person) => !playerUserIds.includes(person.userId))
    .filter((person) => !normalizedPeopleQuery || person.displayName.toLocaleLowerCase(locale === "eu" ? "eu" : locale === "en" ? "en" : "es").includes(normalizedPeopleQuery))
    .slice(0, 8)
  const selectedLocation = locations.find((location) => location.id === locationId) ?? null
  const courtNames = Array.from({ length: courtCount }, (_, index) => `${selectedLocation ? `${getLeagueLocationOptionLabel(selectedLocation)} · ` : ""}${tx("Pista")} ${index + 1}`)
  const startsAt = localDateTime(date, time)
  const roundCount = getRapidRoundCount(reservationMinutes), activeCourtCount = getRapidActiveCourtCount(playerCount, courtCount), preparationMax = getRapidPreparationMax(reservationMinutes), effectivePreparationMinutes = Math.min(preparationMinutes, preparationMax), configurationValidation = validateRapidTournamentConfiguration(playerCount, courtCount, reservationMinutes), rounds = startsAt && Number.isFinite(startsAt.getTime()) ? buildRapidRounds(new Date(startsAt.getTime() + effectivePreparationMinutes * 60_000), { rounds: roundCount, roundMinutes: 16, transitionMinutes: 3 }) : []
  const formatTimeRange = (minimum: number, maximum: number) => `${minimum}${minimum === maximum ? "" : `–${maximum}`}`
  const totalMatches = roundCount * activeCourtCount, totalPlayerMatchSlots = totalMatches * 4, minimumMatches = Math.floor(totalPlayerMatchSlots / playerCount), maximumMatches = Math.ceil(totalPlayerMatchSlots / playerCount), matchesPerPlayer = formatTimeRange(minimumMatches, maximumMatches), restsPerPlayer = formatTimeRange(roundCount - maximumMatches, roundCount - minimumMatches), minutesPerPlayer = formatTimeRange(minimumMatches * 16, maximumMatches * 16), plannedTotalMinutes = effectivePreparationMinutes + roundCount * 16 + Math.max(0, roundCount - 1) * 3, safetyMarginMinutes = reservationMinutes - plannedTotalMinutes
  const activeCourtNote = tx("Con {} jugadores se podrán usar {} pistas de forma simultánea.").replace("{}", String(playerCount)).replace("{}", String(activeCourtCount))
  const dateFormat = new Intl.DateTimeFormat(locale === "eu" ? "eu-ES" : locale === "en" ? "en-GB" : "es-ES", { dateStyle: "medium" })
  const timeFormat = new Intl.DateTimeFormat(locale === "eu" ? "eu-ES" : locale === "en" ? "en-GB" : "es-ES", { hour: "2-digit", minute: "2-digit" })
  const duplicateMessage = !participants.ok && participants.error === "duplicate_player_names"
  const ready = Boolean(name.trim() && startsAt && startsAt.getTime() > nowTimestamp && configurationValidation.ok && participants.ok && (!source || (!sourceLoading && !sourceError && selectedSourcePlayers.length <= playerCount)))
  async function createTournament() {
    if (!ready || !startsAt) return
    setSaving(true); setError("")
    try {
      const response = await fetch("/api/tournaments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description, startsAt: startsAt.toISOString(), courtNames, players: formPlayers, playerUserIds: formPlayerUserIds, playerCount, reservationMinutes, preparationMinutes: effectivePreparationMinutes, format, source: source ? { ...source, playerIds: selectedSourcePlayers.map((player) => player.playerId) } : null }) })
      const result = await response.json().catch(() => null)
      if (!response.ok || typeof result?.id !== "string") {
        const message = result?.error === "duplicate_player_names" ? "Hay nombres de jugadores duplicados." : result?.error === "invalid_player_count" ? "Elige entre ocho y dieciséis jugadores y completa todos los nombres." : result?.error === "tournament_account_access_not_ready" ? "La selección de cuentas todavía no está activada. Puedes completar las plazas escribiendo los nombres manualmente." : "No se ha podido crear el torneo. Revisa los datos e inténtalo de nuevo."
        setError(tx(message)); return
      }
      router.push(`/tournaments/${result.id}/calendar`)
    } catch {
      setError(tx("No se ha podido crear el torneo. Revisa los datos e inténtalo de nuevo."))
    } finally { setSaving(false) }
  }
  function addPerson(person: TournamentPerson) {
    if (emptyPlayerSlot < 0 || playerUserIds.includes(person.userId)) return
    setPlayers((current) => current.map((value, index) => index === emptyPlayerSlot ? person.displayName : value))
    setPlayerUserIds((current) => current.map((value, index) => index === emptyPlayerSlot ? person.userId : value))
    setPeopleQuery("")
  }
  function removePerson(userId: string) {
    const index = playerUserIds.indexOf(userId)
    if (index < 0) return
    setPlayers((current) => current.map((value, playerIndex) => playerIndex === index ? "" : value))
    setPlayerUserIds((current) => current.map((value, playerIndex) => playerIndex === index ? null : value))
  }
  const locked = (label: string, value: string, explanation: string) => <div className={styles.optionRow} aria-disabled="true"><p>{label}</p><p className={styles.value}>{value}</p>{explanation ? <small>{explanation}</small> : null}</div>
  const filledPlayers = formPlayers.filter((player) => player.trim()).length
  return <div className={`${styles.theme} ${styles.page}`}>
    <header className={`app-page-header ${styles.header}`}><Link href="/leagues" className="app-top-back-control text-sm font-semibold text-neutral-500">‹ {tx("Competiciones")}</Link><h1 className={`type-page-title font-black ${styles.headerTitle}`}>{tx("Crear torneo rápido")}</h1></header>
    <section aria-labelledby="tournament-mode"><details open className={`${styles.panel} ${styles.section}`}><summary id="tournament-mode"><span className={styles.step} aria-hidden="true">1</span>{tx("Modalidad de torneo")}</summary><div className={styles.sectionBody}>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Modalidad")}</span><SelectChevron><select className={`${fieldClass} ${styles.selectField}`} defaultValue="rapid" aria-describedby="tournament-mode-help"><option value="rapid">{tx("Torneo rápido")} · {tx("Activo")}</option><option value="traditional" disabled>{tx("Torneo tradicional")} · {tx("Disponible próximamente")}</option></select></SelectChevron></label>
      <p id="tournament-mode-help" className={styles.help}>{tx("Competición adaptada a las pistas y al tiempo disponibles.")}</p>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Formato")}</span><SelectChevron><select className={`${fieldClass} ${styles.selectField}`} value={format} onChange={(event) => setFormat(event.target.value as typeof format)} aria-describedby="tournament-format-help"><option value="balanced_americana">{tx("Americana equilibrada")}</option><option value="dynamic_mexicano">{tx("Mexicano dinámico")}</option><option value="fixed-pairs" disabled>{tx("Parejas fijas")} · {tx("Disponible próximamente")}</option></select></SelectChevron></label>
      <p id="tournament-format-help" className={styles.help}>{tx(format === "dynamic_mexicano" ? "Los enfrentamientos se generan después de cada ronda según los resultados, buscando partidos igualados y rotación de parejas." : "Parejas rotativas y calendario fijo generado previamente.")}</p>
      <details className={styles.help}><summary>{tx("Disponible próximamente")}</summary><p>{tx("Torneo tradicional")}: {tx("Eliminatorias, grupos y otras competiciones sin duración limitada.")}</p><p className="mt-2">{tx("Parejas fijas")}: {tx("Se mantiene el compañero durante todo el torneo.")}</p></details>
    </div></details></section>
    <section aria-labelledby="tournament-general"><details open className={`${styles.panel} ${styles.section}`}><summary id="tournament-general"><span className={styles.step} aria-hidden="true">2</span>{tx("Información general")}</summary><div className={styles.sectionBody}>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Nombre del torneo")} *</span><input className={fieldClass} maxLength={100} value={name} onChange={(event) => { nameEdited.current = true; setName(event.target.value) }} required /></label>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Descripción (opcional)")}</span><textarea className={`${fieldClass} min-h-20`} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <div className="grid grid-cols-2 gap-3"><label className="block min-w-0 space-y-1"><span className="text-sm font-bold">{tx("Fecha")}</span><input className={fieldClass} type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label className="block min-w-0 space-y-1"><span className="text-sm font-bold">{tx("Hora de inicio")}</span><input className={fieldClass} type="time" value={time} onChange={(event) => setTime(event.target.value)} required /></label></div>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Ubicación")}</span><SelectChevron><select className={`${fieldClass} ${styles.selectField}`} value={locationId} onChange={(event) => setLocationId(event.target.value)} disabled={locationsLoading}><option value="">{locationsLoading ? tx("Cargando ubicaciones...") : tx("Sin ubicación seleccionada")}</option>{locations.map((location) => <option key={location.id} value={location.id}>{getLeagueLocationOptionLabel(location)}</option>)}</select></SelectChevron><span className="block text-xs text-neutral-500">{tx("La ubicación seleccionada se mostrará junto a las pistas del calendario.")}</span></label>
    </div></details></section>
    <section aria-labelledby="tournament-resources"><details open className={`${styles.panel} ${styles.section}`}><summary id="tournament-resources"><span className={styles.step} aria-hidden="true">3</span>{tx("Pistas y reserva")}<span className={styles.chip}>{courtCount} {tx("pistas")} · {reservationMinutes} {tx("minutos")}</span></summary><div className={styles.sectionBody}>
      <NumberStepper label={tx("Número de pistas")} value={courtCount} values={[1, 2, 3, 4]} onChange={setCourtCount} tx={tx} />
      <NumberStepper label={tx("Tiempo de reserva (minutos)")} value={reservationMinutes} values={[60, 90, 120]} onChange={setReservationMinutes} tx={tx} />
      <NumberStepper label={tx("Calentamiento (minutos)")} value={effectivePreparationMinutes} values={Array.from({ length: preparationMax + 1 }, (_, index) => index)} onChange={setPreparationMinutes} tx={tx} />
      <p className={styles.help}>{tx("La preparación empieza al pulsar Iniciar torneo y se descuenta de la reserva antes del margen de seguridad.")}</p>
    </div></details></section>
    <section aria-labelledby="tournament-participants"><details open className={`${styles.panel} ${styles.section}`}><summary id="tournament-participants"><span className={styles.step} aria-hidden="true">4</span>{tx("Participantes")}<span className={styles.chip}>{filledPlayers}/{playerCount}</span></summary><div className={styles.sectionBody}>
      <NumberStepper label={tx("Número de jugadores")} value={playerCount} values={Array.from({ length: 9 }, (_, index) => index + 8)} onChange={setPlayerCount} tx={tx} />
      <progress className={styles.progress} value={filledPlayers} max={playerCount} aria-label={tx("Participantes")} />
      <p className={styles.help}>{playerCount} {tx("jugadores")} · {tx("Individual")}. {tx("Puedes escribir nombres o vincular a personas registradas de tus ligas.")}</p>
      {source ? <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-sm font-black text-neutral-900">{tx("Jugadores de la temporada")}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{tx(manualSourceSlots > 0 ? "Selecciona jugadores de la temporada y completa con nombres manuales hasta alcanzar la cantidad elegida." : "Selecciona los jugadores de la temporada que participarán en el torneo.")}</p>
        {sourceLoading ? <p className="mt-3 text-xs text-neutral-500">{tx("Cargando jugadores…")}</p> : sourceError ? <p role="alert" className="mt-3 text-sm font-bold text-red-700">{tx(sourceError)}</p> : sourcePlayers.length === 0 ? <p className="mt-3 text-sm font-semibold text-neutral-600">{tx("Esta temporada no tiene jugadores inscritos.")}</p> : <div className="mt-3 space-y-2">{sourcePlayers.map((person) => <label key={person.playerId} className="flex items-center gap-3 rounded-xl bg-white p-2.5 ring-1 ring-neutral-200"><input type="checkbox" checked={selectedSourcePlayerIds.includes(person.playerId)} onChange={(event) => setSelectedSourcePlayerIds((ids) => event.target.checked ? [...ids, person.playerId] : ids.filter((id) => id !== person.playerId))} /><span className="min-w-0 flex-1 truncate text-sm font-bold">{person.displayName}</span>{person.userId ? <span className="type-caption font-black uppercase text-emerald-700">{tx("Cuenta vinculada")}</span> : null}</label>)}</div>}
        {selectedSourcePlayers.length > playerCount ? <p className="mt-3 text-xs font-semibold text-amber-800">{tx("Desmarca participantes hasta igualar el número de jugadores elegido.")}</p> : manualSourceSlots > 0 ? <p className="mt-3 text-xs font-semibold text-neutral-600">{tx("Completa con nombres manuales las plazas restantes.")}</p> : null}
      </div> : peopleLoading || accountLinkingAvailable ? <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-sm font-black text-neutral-900">{tx("Seleccionar jugador de Smash & Lob")}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{tx("Busca usuarios registrados y añádelos a las plazas disponibles.")}</p>
        {selectedPeople.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{selectedPeople.map((person) => <span key={person.userId} className="inline-flex max-w-full items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-black text-neutral-900 ring-1 ring-neutral-200"><span className="truncate">{person.displayName}</span><button type="button" onClick={() => removePerson(person.userId)} aria-label={`${tx("Quitar")} ${person.displayName}`} className="ml-1 shrink-0 rounded-full px-1.5 py-0.5 text-red-600 hover:bg-red-50">×</button></span>)}</div> : null}
        {emptyPlayerSlot >= 0 ? <>
          <input value={peopleQuery} onChange={(event) => setPeopleQuery(event.target.value)} placeholder={tx("Buscar jugador por nombre")} aria-label={tx("Buscar jugador por nombre")} className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 outline-none focus:border-neutral-400" />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">{peopleLoading ? <p className="text-xs font-semibold text-neutral-500">{tx("Cargando jugadores…")}</p> : filteredPeople.length > 0 ? filteredPeople.map((person) => <button key={person.userId} type="button" onClick={() => addPerson(person)} className="flex min-w-0 items-center gap-2 rounded-xl bg-white px-2.5 py-2 text-left ring-1 ring-neutral-200 hover:ring-neutral-400"><span className="min-w-0 flex-1 truncate text-xs font-black text-neutral-900">{person.displayName}</span><span aria-hidden="true" className="text-xs font-black text-neutral-500">+</span></button>) : peopleQuery.trim() ? <p className="text-xs font-semibold text-neutral-500">{tx("No hay usuarios registrados que coincidan con la búsqueda.")}</p> : null}</div>
        </> : <p className="mt-3 text-xs font-semibold text-neutral-500">{tx("Todas las plazas están ocupadas.")}</p>}
      </div> : <p className={styles.help}>{tx("La selección de cuentas todavía no está activada. Puedes completar las plazas escribiendo los nombres manualmente.")}</p>}
      {!source ? <div className="space-y-2">{players.slice(0, playerCount).map((player, index) => <label key={index} className={`${styles.playerField} rounded-xl border border-neutral-200 p-2`}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><input className={fieldClass} autoComplete="off" placeholder={tx("Nombre")} maxLength={80} value={player} onChange={(event) => { setPlayers((value) => value.map((item, itemIndex) => itemIndex === index ? event.target.value : item)); if (playerUserIds[index]) setPlayerUserIds((value) => value.map((id, itemIndex) => itemIndex === index ? null : id)) }} aria-label={`${tx("Jugador")} ${index + 1}`} /></label>)}</div> : null}
      {source && manualSourceSlots ? <div className="space-y-2">{players.slice(0, manualSourceSlots).map((player, index) => <label key={`manual-${index}`} className={`${styles.playerField} rounded-xl border border-neutral-200 p-2`}><span aria-hidden="true">{String(selectedSourcePlayers.length + index + 1).padStart(2, "0")}</span><input className={fieldClass} autoComplete="off" placeholder={tx("Nombre")} maxLength={80} value={player} onChange={(event) => setPlayers((value) => value.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} aria-label={`${tx("Jugador")} ${selectedSourcePlayers.length + index + 1}`} /></label>)}</div> : null}
      {duplicateMessage ? <p role="alert" className="text-sm font-bold text-red-700">{tx("Hay nombres de jugadores duplicados.")}</p> : !participants.ok && participants.error === "all_player_names_required" ? <p className="text-xs font-semibold text-neutral-500">{tx("Completa todos los nombres. Se ignoran mayúsculas y espacios sobrantes al comprobar duplicados.")}</p> : null}
      <details className={styles.help}><summary>{tx("Próximamente: más opciones de inscripción")}</summary>{locked(tx("Inscripción abierta mediante invitación"), tx("Desactivada"), tx("Disponible próximamente"))}{locked(tx("Equilibrio por nivel de juego"), tx("Desactivado"), tx("Disponible próximamente"))}</details>
    </div></details></section>
    <section aria-labelledby="tournament-logistics"><details className={`${styles.panel} ${styles.section}`}><summary id="tournament-logistics">{tx("Logística calculada")}<span className={styles.chip}>{roundCount} {tx("rondas")} · {activeCourtCount} {tx("pistas activas")}</span></summary><div className={styles.sectionBody}>
      <div className="grid gap-2 sm:grid-cols-2">{locked(tx("Número de rondas en el torneo"), String(roundCount), tx("Se calcula a partir del tiempo de reserva."))}{locked(tx("Partidos por ronda y pista"), `16 ${tx("minutos")}`, tx("Cada pista juega una ronda a la vez."))}{locked(tx("Juego programado en cada pista"), `${roundCount * 16} ${tx("minutos")}`, tx("Suma del tiempo de juego de una pista a lo largo de todas las rondas."))}{locked(tx("Transición entre rondas"), `3 ${tx("minutos")}`, tx("Pausa entre rondas."))}{locked(tx("Partidos programados en el torneo"), String(totalMatches), tx("Suma de todas las pistas y rondas."))}{locked(tx("Margen de seguridad de la reserva"), `${safetyMarginMinutes} ${tx("minutos")}`, tx("Tiempo que queda al final de la reserva."))}</div>{activeCourtCount < courtCount ? <p className={styles.help}>{activeCourtNote}</p> : null}
      {!configurationValidation.ok ? <p role="alert" className="text-sm font-bold text-red-700">{tx("Con esta combinación de jugadores, pistas y tiempo no todos podrían jugar. Añade pistas o elige una reserva más larga.")}</p> : null}
      <div className="rounded-xl bg-neutral-50 p-3"><p className="text-sm font-black">{tx("Planificación automática")} · {tx("Activada")}</p><p className="mt-1 text-xs leading-5 text-neutral-600">{tx("Smash & Lob organiza automáticamente parejas, pistas, rondas y descansos para aprovechar la reserva de manera equilibrada.")}</p></div>
    </div></details></section>
    <section aria-labelledby="tournament-rules"><details className={`${styles.panel} ${styles.section}`}><summary id="tournament-rules">{tx("Reglas de competición")}</summary><div className={styles.sectionBody}>
      {locked(tx("Parejas cambiantes"), tx("Activado"), tx(format === "dynamic_mexicano" ? "Las parejas se recalculan al generar cada ronda." : "Las parejas se asignan según el calendario fijo."))}
      {locked(tx("Equilibrio de participación"), tx("Activado"), tx("El calendario reparte los partidos y descansos de la forma más equilibrada posible."))}
      {locked(tx("Minimizar repeticiones de compañeros"), tx("Activado"), "")}
      {locked(tx("Minimizar repeticiones de rivales"), tx("Activado"), "")}
      {locked(tx("Final entre mejores clasificados"), tx("Desactivada"), tx("El campeón sale de la clasificación individual."))}
      {locked(tx("Reordenación dinámica de enfrentamientos"), tx(format === "dynamic_mexicano" ? "Activada" : "Desactivada"), tx(format === "dynamic_mexicano" ? "Cada ronda nueva utiliza los resultados ya registrados." : "Las rondas no dependen de los resultados."))}
    </div></details></section>
    <section aria-labelledby="tournament-scoring"><details className={`${styles.panel} ${styles.section}`}><summary id="tournament-scoring">{tx("Puntuación")}</summary><div className={styles.sectionBody}>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Puntuación")}</span><SelectChevron><select className={`${fieldClass} ${styles.selectField}`} defaultValue="points"><option value="points">{tx("Puntuación por tiempo")}</option><option disabled>{tx("Juegos tradicionales")} · {tx("Disponible próximamente")}</option><option disabled>{tx("Tie-break o super tie-break")} · {tx("Disponible próximamente")}</option></select></SelectChevron></label>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Clasificación")}</span><SelectChevron><select className={`${fieldClass} ${styles.selectField}`} value={format === "dynamic_mexicano" ? "rating" : "average"} disabled><option value="average">{tx("Por porcentaje de puntos ganados")}</option><option value="rating">{tx("Por rendimiento normalizado")}</option><option disabled>{tx("Por puntos acumulados")} · {tx("Disponible próximamente")}</option></select></SelectChevron></label>
      <p className={styles.help}>16 {tx("minutos")} · {tx("Empates permitidos")} · {tx("Sí")}</p><p className={styles.help}>{tx(format === "dynamic_mexicano" ? "El rendimiento se calcula con los puntos a favor y en contra: R = 100 × (F + 3) / (F + C + 6). Los nuevos enfrentamientos utilizan esta clasificación." : "Se anota cada punto ganado. Al terminar los 16 minutos se completa el punto en juego; no se usan juegos ni sets. Cada jugador suma el porcentaje de puntos ganados por su pareja en cada partido y la clasificación usa la media de sus partidos.")}</p>
    </div></details></section>
    <section aria-labelledby="tournament-visibility"><details className={`${styles.panel} ${styles.section}`}><summary id="tournament-visibility">{tx("Visibilidad y administración")}</summary><div className={styles.sectionBody}>
      {locked(tx("Torneo privado"), tx("Activo"), tx("Solo tú, desde la cuenta organizadora, puedes consultar y gestionar este torneo."))}
      {locked(tx("Organizador: usuario creador"), tx("Activo"), tx("Consulta y gestión desde la cuenta del organizador"))}
      {locked(tx("Acceso público y espectadores"), tx("Desactivado"), tx("Disponible próximamente"))}
      {locked(tx("Inscripciones abiertas"), tx("Desactivadas"), tx("Disponible próximamente"))}
      {locked(tx("Roles administrativos adicionales"), tx("No hay"), tx("Disponible próximamente"))}
      {locked(tx("Cuenta atrás previa al torneo"), tx("Desactivada"), tx("Disponible próximamente"))}
      {locked(tx("Ocultar calendario a los jugadores antes de empezar"), tx("Desactivado"), tx("Disponible próximamente"))}
    </div></details></section>
    <section aria-labelledby="tournament-summary" className={`${styles.panel} ${styles.summary}`}><p className={styles.eyebrow}>{tx("Resumen del torneo")}</p><h2 id="tournament-summary" className="mt-2 break-words text-lg font-black">{name.trim() || tx("Nombre del torneo")}</h2>{selectedLocation ? <p className="mt-2 text-sm font-semibold">{getLeagueLocationOptionLabel(selectedLocation)}</p> : null}<p className="mt-1 text-sm font-bold">{startsAt && Number.isFinite(startsAt.getTime()) ? `${dateFormat.format(startsAt)} · ${timeFormat.format(startsAt)}` : tx("Elige fecha y hora")}</p><div className={styles.summaryGrid}><div className={styles.metric}><span>{tx("Modalidad")}</span><strong>{tx("Torneo rápido")} · {tx(format === "dynamic_mexicano" ? "Mexicano dinámico" : "Americana equilibrada")}</strong></div><div className={styles.metric}><span>{tx("Participantes")}</span><strong>{playerCount} {tx("jugadores")}</strong></div><div className={styles.metric}><span>{tx("Pistas (totales · simultáneas)")}</span><strong>{courtCount} · {activeCourtCount}</strong></div><div className={styles.metric}><span>{tx("Tiempo de reserva (minutos)")}</span><strong>{reservationMinutes} {tx("minutos")}</strong></div><div className={styles.metric}><span>{tx("Calentamiento (minutos)")}</span><strong>{effectivePreparationMinutes} {tx("minutos")}</strong></div><div className={styles.metric}><span>{tx("Planificación automática")}</span><strong>{tx("Activada")}</strong></div><div className={styles.metric}><span>{tx("Número de rondas en el torneo")}</span><strong>{roundCount}</strong></div><div className={styles.metric}><span>{tx("Partidos por ronda y pista")}</span><strong>16 {tx("minutos")}</strong></div><div className={styles.metric}><span>{tx("Juego programado en cada pista")}</span><strong>{roundCount * 16} {tx("minutos")}</strong></div><div className={styles.metric}><span>{tx("Transición entre rondas")}</span><strong>3 {tx("minutos")}</strong></div><div className={styles.metric}><span>{tx("Datos por jugador")}</span><strong>{matchesPerPlayer} {tx("partidos")} · {restsPerPlayer} {tx("descansos")}</strong></div><div className={styles.metric}><span>{tx("Minutos de juego por jugador")}</span><strong>{minutesPerPlayer} {tx("minutos")}</strong></div><div className={styles.metric}><span>{tx("Partidos programados en el torneo")}</span><strong>{totalMatches} {tx("partidos")}</strong></div><div className={styles.metric}><span>{tx("Margen de seguridad de la reserva")}</span><strong>{safetyMarginMinutes} {tx("minutos")}</strong></div><div className={styles.metric}><span>{tx("Puntuación")}</span><strong>{tx("Puntuación por tiempo")} · {tx(format === "dynamic_mexicano" ? "Por rendimiento normalizado" : "Por porcentaje de puntos ganados")}</strong></div></div><p className={`${styles.help} mt-2`}>{tx("La participación y los tiempos por jugador se calculan con la configuración actual.")}</p>
      <details className={`${styles.help} mt-3`}><summary>{tx("Previsualización de horarios")}</summary><ol className={styles.schedulePreview}>{rounds.map((round) => <li key={round.round}><span className="font-black">{tx("Ronda")} {round.round}</span><span className="tabular-nums">{timeFormat.format(new Date(round.startsAt))}–{timeFormat.format(new Date(round.endsAt))}</span></li>)}</ol></details>
    {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
    {startsAt && startsAt.getTime() <= nowTimestamp ? <p className="text-sm font-semibold text-amber-700">{tx("La fecha y hora de inicio deben ser futuras.")}</p> : null}
    <button type="button" onClick={() => void createTournament()} className={`${styles.primary} mt-4 w-full`} disabled={!ready || saving}>{saving ? tx("Creando torneo…") : tx(format === "dynamic_mexicano" ? "Crear torneo" : "Crear y generar calendario")}</button>
    </section>
  </div>
}
