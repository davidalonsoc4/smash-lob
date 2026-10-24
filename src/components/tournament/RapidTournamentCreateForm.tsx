import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { getLeagueLocationOptionLabel, sortLeagueLocationsByOptionLabel, type LeagueLocation } from "@/lib/leagueLocations"
import { buildRapidRounds, getRapidActiveCourtCount, getRapidBreakOffsetMinutes, validateTournamentParticipants } from "@/lib/rapidTournament"
import { getRecommendedRapidRounds, planRapidTournament } from "@/lib/tournamentConfiguration"
import { DEFAULT_LEAGUE_ACCENT } from "@/lib/visualStyle"
import { ImageCropDialog } from "@/components/images/ImageCropDialog"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import { readFileAsDataUrl, validateImageFile } from "@/lib/clientImages"
import { tournamentAccentStyle } from "@/lib/tournamentStyles"
import { fixedTeamsFromPlayers } from "@/lib/fixedRapidTournament"
import styles from "./Tournament.module.css"
import { tournamentDraftFromCopy, type TournamentDraft } from "@/lib/tournamentDraft"
type TournamentPerson = { userId: string; displayName: string }
type LeagueRosterPerson = { playerId: string; displayName: string; userId: string | null }
type TournamentSource = { leagueId: string; seasonId: string; leagueName?: string; seasonName?: string }
const fieldClass = styles.field
function SelectChevron({ children }: { children: ReactNode }) { return <span className={styles.selectWrap}>{children}<svg aria-hidden="true" viewBox="0 0 20 20" className={styles.selectChevron}><path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg></span> }
function NumberStepper({ label, value, values, onChange, tx, editable = false }: { label: string; value: number; values: readonly number[]; onChange: (value: number) => void; tx: (text: string) => string; editable?: boolean }) {
  const previous = [...values].reverse().find(option => option < value), next = values.find(option => option > value)
  return <div className={styles.stepperRow}><span className={styles.stepperLabel}>{label}</span><div className={styles.stepper}>
    <button type="button" aria-label={`${tx("Disminuir")} ${label}`} disabled={previous === undefined} onClick={() => previous !== undefined && onChange(previous)}>‹</button>
    {editable ? <input type="number" inputMode="numeric" aria-label={`${label}: ${value}`} min={values[0]} max={values.at(-1)} step={1} value={value} onChange={event => { const number = Number(event.target.value); if (Number.isInteger(number) && number >= values[0] && number <= values[values.length - 1]) onChange(number) }} /> : <output aria-label={`${label}: ${value}`} aria-live="polite">{value}</output>}
    <button type="button" aria-label={`${tx("Aumentar")} ${label}`} disabled={next === undefined} onClick={() => next !== undefined && onChange(next)}>›</button>
  </div></div>
}
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
export function RapidTournamentCreateForm({ initialSource = null, duplicateOf }: { initialSource?: TournamentSource | null; duplicateOf?: string }) {
  const { tx, locale } = useI18n()
  const router = useRouter()
  const [initialDraft, setInitialDraft] = useState<TournamentDraft>()
  const [copyLoading, setCopyLoading] = useState(Boolean(duplicateOf))
  const [copyError, setCopyError] = useState(false)
  const [initial] = useState(defaultStart)
  const [name, setName] = useState(() => initialDraft?.name ?? (initialSource?.leagueName ? `TORNEO RÁPIDO DE ${initialSource.leagueName}` : "TORNEO RÁPIDO"))
  const nameEdited = useRef(false)
  const [description, setDescription] = useState(initialDraft?.description ?? "")
  const [format, setFormat] = useState<"balanced_americana" | "dynamic_mexicano">(initialDraft?.format ?? "balanced_americana")
  const [pairing, setPairing] = useState<"rotating" | "fixed">("rotating")
  const [pairNumbers, setPairNumbers] = useState(() => Array.from({ length: 24 },(_,index) => Math.floor(index/2)+1))
  const [roundMinutes, setRoundMinutes] = useState(16), [transitionMinutes, setTransitionMinutes] = useState(3)
  const [breakMinutes,setBreakMinutes]=useState(0), [breakEveryRounds,setBreakEveryRounds]=useState(3)
  const [manualRoundCount, setManualRoundCount] = useState<number | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null), [accentColor, setAccentColor] = useState<string | null>(null)
  const [logoCropSource, setLogoCropSource] = useState<string | null>(null)
  const [date, setDate] = useState(initial.date)
  const [time, setTime] = useState(initial.time)
  const [playerCount, setPlayerCount] = useState(initialDraft?.players.length ?? 12), [courtCount, setCourtCount] = useState(initialDraft?.courtNames.length ?? 2), [reservationMinutes, setReservationMinutes] = useState(initialDraft?.reservationMinutes ?? 120), [preparationMinutes, setPreparationMinutes] = useState(initialDraft?.preparationMinutes ?? 2)
  const [locations, setLocations] = useState<LeagueLocation[]>([])
  const [locationId, setLocationId] = useState("")
  const [locationsLoading, setLocationsLoading] = useState(true)
  const [players, setPlayers] = useState(() => Array.from({ length: 24 }, (_, i) => initialDraft?.players[i] ?? ""))
  const [playerUserIds, setPlayerUserIds] = useState(() => Array.from({ length: 24 }, (_, i) => initialDraft?.playerUserIds[i] ?? null))
  const [people, setPeople] = useState<TournamentPerson[]>([])
  const [peopleLoading, setPeopleLoading] = useState(true)
  const [accountLinkingAvailable, setAccountLinkingAvailable] = useState(false)
  const [peopleQuery, setPeopleQuery] = useState("")
  const [source, setSource] = useState<TournamentSource | null>(initialSource)
  const [sources, setSources] = useState<TournamentSource[]>([])
  const [sourcesError, setSourcesError] = useState(false)
  const [sourcePlayers, setSourcePlayers] = useState<LeagueRosterPerson[]>([]), [selectedSourcePlayerIds, setSelectedSourcePlayerIds] = useState<string[]>([]), [sourceLoading, setSourceLoading] = useState(Boolean(initialSource)), [sourceError, setSourceError] = useState("")
  const [saving, setSaving] = useState(false), [error, setError] = useState("")
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now())
  useEffect(() => {
    if (!duplicateOf) return
    const controller = new AbortController()
    fetch(`/api/tournaments/${encodeURIComponent(duplicateOf)}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("copy_unavailable")
        const data = await response.json()
        if (data.access?.role !== "creator") throw new Error("copy_forbidden")
        if (controller.signal.aborted) return
        const draft = tournamentDraftFromCopy(data)
        setInitialDraft(draft); setName(draft.name); setDescription(draft.description); setFormat(draft.format)
        setPairing(draft.pairing); setPairNumbers(Array.from({ length: 24 },(_,index) => draft.pairNumbers[index] ?? Math.floor(index/2)+1))
        setPlayerCount(draft.players.length); setCourtCount(draft.courtNames.length)
        setReservationMinutes(draft.reservationMinutes); setPreparationMinutes(draft.preparationMinutes)
        setRoundMinutes(draft.roundMinutes); setTransitionMinutes(draft.transitionMinutes); setManualRoundCount(draft.rounds)
        setBreakMinutes(draft.breakMinutes); setBreakEveryRounds(draft.breakEveryRounds||3)
        setLogoUrl(draft.logoUrl); setAccentColor(draft.accentColor)
        setPlayers(Array.from({ length: 24 }, (_, i) => draft.players[i] ?? ""))
        setPlayerUserIds(Array.from({ length: 24 }, (_, i) => draft.playerUserIds[i] ?? null))
      })
      .catch(() => { if (!controller.signal.aborted) setCopyError(true) })
      .finally(() => { if (!controller.signal.aborted) setCopyLoading(false) })
    return () => controller.abort()
  }, [duplicateOf])
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
    if (duplicateOf) return
    const controller = new AbortController()
    fetch("/api/tournaments/sources", { cache: "no-store", signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error("sources_unavailable"); return response.json() })
      .then(payload => { if (!controller.signal.aborted) setSources(payload.sources ?? []) })
      .catch(() => { if (!controller.signal.aborted) setSourcesError(true) })
    return () => controller.abort()
  }, [duplicateOf])
  useEffect(() => {
    if (!source) return
    const controller = new AbortController()
    fetch(`/api/tournaments/people?leagueId=${encodeURIComponent(source.leagueId)}&seasonId=${encodeURIComponent(source.seasonId)}`, { cache: "no-store", signal: controller.signal })
      .then(async response => { const payload = await response.json(); if (!response.ok) throw new Error(payload?.error ?? "tournament_source_lookup_failed"); return payload })
      .then(payload => {
        if (controller.signal.aborted) return
        const items = (payload.players ?? []) as LeagueRosterPerson[]
        if (!nameEdited.current && payload.leagueName) setName(`TORNEO RÁPIDO DE ${String(payload.leagueName).slice(0, 80)}`)
        setSourcePlayers(items); setSelectedSourcePlayerIds(items.slice(0, 24).map(item => item.playerId))
        setPlayerCount(Math.max(4, Math.min(24, items.length))); setSourceError("")
      })
      .catch(() => { if (!controller.signal.aborted) setSourceError("No se han podido cargar los jugadores de esta temporada.") })
      .finally(() => { if (!controller.signal.aborted) setSourceLoading(false) })
    return () => controller.abort()
  }, [source])
  function changeSource(value: string) {
    const nextSource = sources.find(item => item.seasonId === value) ?? null
    setSource(nextSource); setSourcePlayers([]); setSelectedSourcePlayerIds([]); setSourceError(""); setSourceLoading(Boolean(nextSource))
    if (!nameEdited.current) setName(nextSource?.leagueName ? `TORNEO RÁPIDO DE ${nextSource.leagueName}` : "TORNEO RÁPIDO")
  }
  const selectedSourcePlayers = sourcePlayers.filter((player) => selectedSourcePlayerIds.includes(player.playerId)), manualSourceSlots = Math.max(0, playerCount - selectedSourcePlayers.length), formPlayers = source ? [...selectedSourcePlayers.map((player) => player.displayName), ...players.slice(0, manualSourceSlots)] : players.slice(0, playerCount), formPlayerUserIds = source ? [...selectedSourcePlayers.map((player) => player.userId), ...Array<string | null>(manualSourceSlots).fill(null)] : playerUserIds.slice(0, playerCount)
  const participants = validateTournamentParticipants(formPlayers, playerCount)
  let fixedTeamsValid = true
  if (pairing === "fixed") {
    try { fixedTeamsFromPlayers(formPlayers.map((_,index) => ({ id: String(index), pairNumber: pairNumbers[index] }))) }
    catch { fixedTeamsValid = false }
  }
  const selectedPeople = playerUserIds.map((userId) => people.find((person) => person.userId === userId) ?? null).filter((person): person is TournamentPerson => person !== null)
  const emptyPlayerSlot = players.slice(0, playerCount).findIndex((player) => !player.trim())
  const normalizedPeopleQuery = peopleQuery.trim().toLocaleLowerCase(locale === "eu" ? "eu" : locale === "en" ? "en" : "es")
  const filteredPeople = people
    .filter((person) => !playerUserIds.includes(person.userId))
    .filter((person) => !normalizedPeopleQuery || person.displayName.toLocaleLowerCase(locale === "eu" ? "eu" : locale === "en" ? "en" : "es").includes(normalizedPeopleQuery))
    .slice(0, 8)
  const selectedLocation = locations.find((location) => location.id === locationId) ?? null
  const courtNames = Array.from({ length: courtCount }, (_, index) => !selectedLocation && initialDraft?.courtNames[index] ? initialDraft.courtNames[index] : `${selectedLocation ? `${getLeagueLocationOptionLabel(selectedLocation)} · ` : ""}${tx("Pista")} ${index + 1}`)
  const startsAt = localDateTime(date, time)
  const breakSettings={breakMinutes,breakEveryRounds:breakMinutes?breakEveryRounds:0}
  const roundCount = manualRoundCount ?? getRecommendedRapidRounds(reservationMinutes, roundMinutes, transitionMinutes, 0,breakSettings)
  const totalBreakMinutes=getRapidBreakOffsetMinutes(roundCount,breakSettings), breakCount=breakMinutes?Math.floor(Math.max(0,roundCount-1)/breakEveryRounds):0
  const activeCourtCount = getRapidActiveCourtCount(playerCount, courtCount), preparationMax = Math.max(0, reservationMinutes - 2 - roundCount * roundMinutes - Math.max(0, roundCount - 1) * transitionMinutes - totalBreakMinutes), effectivePreparationMinutes = Math.min(preparationMinutes, preparationMax)
  const configurationValidation = planRapidTournament({ players: playerCount, courts: courtCount, reservationMinutes, rounds: roundCount, roundMinutes, transitionMinutes, preparationMinutes: effectivePreparationMinutes, pairing,...breakSettings })
  const rounds = startsAt && Number.isFinite(startsAt.getTime()) ? buildRapidRounds(new Date(startsAt.getTime() + effectivePreparationMinutes * 60_000), { rounds: roundCount, roundMinutes, transitionMinutes,...breakSettings }) : []
  const formatTimeRange = (minimum: number, maximum: number) => `${minimum}${minimum === maximum ? "" : `–${maximum}`}`
  const totalMatches = roundCount * activeCourtCount, totalPlayerMatchSlots = totalMatches * 4, minimumMatches = Math.floor(totalPlayerMatchSlots / playerCount), maximumMatches = Math.ceil(totalPlayerMatchSlots / playerCount), matchesPerPlayer = formatTimeRange(minimumMatches, maximumMatches), restsPerPlayer = formatTimeRange(roundCount - maximumMatches, roundCount - minimumMatches), minutesPerPlayer = formatTimeRange(minimumMatches * roundMinutes, maximumMatches * roundMinutes), plannedTotalMinutes = effectivePreparationMinutes + roundCount * roundMinutes + Math.max(0, roundCount - 1) * transitionMinutes + totalBreakMinutes, safetyMarginMinutes = reservationMinutes - plannedTotalMinutes
  const activeCourtNote = tx("Con {} jugadores se podrán usar {} pistas de forma simultánea.").replace("{}", String(playerCount)).replace("{}", String(activeCourtCount))
  const dateFormat = new Intl.DateTimeFormat(locale === "eu" ? "eu-ES" : locale === "en" ? "en-GB" : "es-ES", { dateStyle: "medium" })
  const timeFormat = new Intl.DateTimeFormat(locale === "eu" ? "eu-ES" : locale === "en" ? "en-GB" : "es-ES", { hour: "2-digit", minute: "2-digit" })
  const duplicateMessage = !participants.ok && participants.error === "duplicate_player_names"
  const ready = Boolean(!copyLoading && !copyError && fixedTeamsValid && name.trim() && startsAt && startsAt.getTime() > nowTimestamp && configurationValidation.ok && participants.ok && (!source || (!sourceLoading && !sourceError && selectedSourcePlayers.length <= playerCount)))
  async function createTournament() {
    if (!ready || !startsAt) return
    setSaving(true); setError("")
    try {
      const response = await fetch("/api/tournaments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description, startsAt: startsAt.toISOString(), courtNames, players: formPlayers, playerUserIds: formPlayerUserIds, playerCount, reservationMinutes, preparationMinutes: effectivePreparationMinutes, roundCount, roundMinutes, transitionMinutes,...breakSettings, logoUrl, accentColor, format, pairing, ...(pairing === "fixed" ? { pairNumbers: pairNumbers.slice(0,playerCount) } : {}), duplicateOf: initialDraft?.duplicateOf, source: source ? { ...source, playerIds: selectedSourcePlayers.map((player) => player.playerId) } : null }) })
      const result = await response.json().catch(() => null)
      if (!response.ok || typeof result?.id !== "string") {
        const message = result?.error === "duplicate_player_names" ? "Hay nombres de jugadores duplicados." : result?.error === "invalid_player_count" ? "Elige entre cuatro y veinticuatro jugadores y completa todos los nombres." : result?.error === "tournament_account_access_not_ready" ? "La configuración de torneos necesita actualizarse. Contacta con el administrador." : "No se ha podido crear el torneo. Revisa los datos e inténtalo de nuevo."
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
  if (copyLoading || copyError) return <div className={`${styles.theme} ${styles.page}`}><Link href="/leagues" className="app-top-back-control">{tx("Competiciones")}</Link><p role={copyError ? "alert" : "status"}>{tx(copyError ? "No se ha podido cargar este torneo o no tienes acceso." : "Cargando ajustes del torneo…")}</p></div>
  return <div className={`${styles.theme} ${styles.page}`} style={tournamentAccentStyle(accentColor)}>
    {initialDraft ? <p role="status" className="rounded-xl bg-neutral-100 p-3 text-sm text-neutral-700">{tx("Revisa la copia y elige una nueva fecha. Los resultados y el progreso empezarán de cero.")}</p> : null}
    <header className={`app-page-header ${styles.header}`}><Link href="/leagues" className="app-top-back-control text-sm font-semibold text-neutral-500"><span aria-hidden="true" className="mr-1 inline-block">←</span>{tx("Competiciones")}</Link><h1 className={`type-page-title font-black ${styles.headerTitle}`}>{tx("Crear torneo rápido")}</h1></header>
    <section aria-labelledby="tournament-mode"><details open className={`${styles.panel} ${styles.section}`}><summary id="tournament-mode"><span className={styles.step} aria-hidden="true">1</span>{tx("Modalidad de torneo")}</summary><div className={styles.sectionBody}>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Modalidad")}</span><SelectChevron><select className={`${fieldClass} ${styles.selectField}`} defaultValue="rapid" aria-describedby="tournament-mode-help"><option value="rapid">{tx("Torneo rápido")} · {tx("Activo")}</option><option value="traditional" disabled>{tx("Torneo tradicional")} · {tx("Disponible próximamente")}</option></select></SelectChevron></label>
      <p id="tournament-mode-help" className={styles.help}>{tx("Competición adaptada a las pistas y al tiempo disponibles.")}</p>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Formato")}</span><SelectChevron><select className={`${fieldClass} ${styles.selectField}`} value={format} onChange={(event) => setFormat(event.target.value as typeof format)} aria-describedby="tournament-format-help"><option value="balanced_americana">{tx("Americana equilibrada")}</option><option value="dynamic_mexicano">{tx("Mexicano dinámico")}</option></select></SelectChevron></label>
      <p id="tournament-format-help" className={styles.help}>{tx(pairing === "fixed" ? format === "dynamic_mexicano" ? "Las parejas se mantienen y los rivales se recalculan según la clasificación." : "Las parejas se mantienen durante todo el calendario, generado antes de empezar." : format === "dynamic_mexicano" ? "Los enfrentamientos se generan después de cada ronda según los resultados, buscando partidos igualados y rotación de parejas." : "Parejas rotativas y calendario fijo generado previamente.")}</p>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Parejas")}</span><SelectChevron><select className={`${fieldClass} ${styles.selectField}`} value={pairing} onChange={event => setPairing(event.target.value as typeof pairing)}><option value="rotating">{tx("Parejas rotativas")}</option><option value="fixed">{tx("Parejas fijas")}</option></select></SelectChevron></label>
      <details className={styles.help}><summary>{tx("Disponible próximamente")}</summary><p>{tx("Torneo tradicional")}: {tx("Eliminatorias, grupos y otras competiciones sin duración limitada.")}</p></details>
    </div></details></section>
    <section aria-labelledby="tournament-general"><details open className={`${styles.panel} ${styles.section}`}><summary id="tournament-general"><span className={styles.step} aria-hidden="true">2</span>{tx("Información general")}</summary><div className={styles.sectionBody}>
      {!duplicateOf ? <label className="block space-y-1"><span className="text-sm font-bold">{tx("Origen de los participantes")}</span><SelectChevron><select className={`${fieldClass} ${styles.selectField}`} value={source?.seasonId ?? ""} onChange={event => changeSource(event.target.value)}>
        <option value="">{tx("Torneo independiente")}</option>
        {source && !sources.some(item => item.seasonId === source.seasonId) ? <option value={source.seasonId}>{source.leagueName ?? tx("Liga")} · {tx("Temporada seleccionada")}</option> : null}
        {sources.map(item => <option key={item.seasonId} value={item.seasonId}>{item.leagueName} · {item.seasonName}</option>)}
      </select></SelectChevron><span className={styles.help}>{tx(sourcesError ? "No se han podido cargar tus temporadas. Puedes crear un torneo independiente o acceder desde la administración de tu liga." : "Importa jugadores de una temporada que administras o completa un torneo independiente.")}</span></label> : null}
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Nombre del torneo")} *</span><input className={fieldClass} maxLength={100} value={name} onChange={(event) => { nameEdited.current = true; setName(event.target.value) }} required /></label>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Descripción (opcional)")}</span><textarea className={`${fieldClass} min-h-20`} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <div className="grid grid-cols-2 gap-3"><label className="block min-w-0 space-y-1"><span className="text-sm font-bold">{tx("Fecha")}</span><input className={fieldClass} type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label className="block min-w-0 space-y-1"><span className="text-sm font-bold">{tx("Hora de inicio")}</span><input className={fieldClass} type="time" value={time} onChange={(event) => setTime(event.target.value)} required /></label></div>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Ubicación")}</span><SelectChevron><select className={`${fieldClass} ${styles.selectField}`} value={locationId} onChange={(event) => setLocationId(event.target.value)} disabled={locationsLoading}><option value="">{locationsLoading ? tx("Cargando ubicaciones...") : tx("Sin ubicación seleccionada")}</option>{locations.map((location) => <option key={location.id} value={location.id}>{getLeagueLocationOptionLabel(location)}</option>)}</select></SelectChevron><span className="block text-xs text-neutral-500">{tx("La ubicación seleccionada se mostrará junto a las pistas del calendario.")}</span></label>
    </div></details></section>
    <details className={`${styles.panel} ${styles.section}`}><summary>{tx("Personalización")}</summary><div className={styles.sectionBody}>
      <div className="flex min-w-0 items-center gap-3"><LeagueLogo league={{ name, logoUrl }} size="md" label={tx("Logo del torneo")} /><p className="min-w-0 truncate text-sm font-bold">{name}</p></div>
      <label className="grid gap-1 text-sm font-bold">{tx("Logo del torneo")}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={async event => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; try { validateImageFile(file); setLogoCropSource(await readFileAsDataUrl(file)) } catch { setError(tx("No se ha podido procesar la imagen.")) } }} /></label>
      {logoUrl ? <button type="button" className={styles.secondary} onClick={() => setLogoUrl(null)}>{tx("Quitar logo")}</button> : null}
      <label className="flex items-center justify-between gap-3 text-sm font-bold">{tx("Color de acento")}<input type="color" value={accentColor ?? DEFAULT_LEAGUE_ACCENT} onChange={event => setAccentColor(event.target.value)} className="h-11 w-14 rounded-lg" /></label>
      {accentColor ? <button type="button" className={styles.secondary} onClick={() => setAccentColor(null)}>{tx("Usar el color de la app")}</button> : null}
    </div></details>
    <section aria-labelledby="tournament-resources"><details open className={`${styles.panel} ${styles.section}`}><summary id="tournament-resources"><span className={styles.step} aria-hidden="true">3</span>{tx("Pistas y reserva")}<span className={styles.chip}>{courtCount} {tx("pistas")} · {reservationMinutes} {tx("minutos")}</span></summary><div className={styles.sectionBody}>
      <NumberStepper label={tx("Número de pistas")} value={courtCount} values={[1, 2, 3, 4]} onChange={setCourtCount} tx={tx} />
      <NumberStepper label={tx("Tiempo de reserva (minutos)")} value={reservationMinutes} values={[30, 60, 90, 120, 180, 240, 360, 480, 720, 1440]} onChange={setReservationMinutes} tx={tx} editable />
      <NumberStepper label={tx("Calentamiento (minutos)")} value={effectivePreparationMinutes} values={Array.from({ length: preparationMax + 1 }, (_, index) => index)} onChange={setPreparationMinutes} tx={tx} />
      <p className={styles.help}>{tx("La preparación empieza al pulsar Iniciar torneo y se descuenta de la reserva antes del margen de seguridad.")}</p>
      <details className={styles.help}><summary>{tx("Ajustes avanzados")}</summary><div className="mt-3 grid gap-3">
        <NumberStepper label={tx("Duración de ronda (minutos)")} value={roundMinutes} values={Array.from({ length: 120 }, (_, i) => i + 1)} onChange={setRoundMinutes} tx={tx} editable />
        <NumberStepper label={tx("Transición entre rondas (minutos)")} value={transitionMinutes} values={Array.from({ length: 31 }, (_, i) => i)} onChange={setTransitionMinutes} tx={tx} editable />
        <label className="flex items-center justify-between gap-3 text-sm font-bold">{tx("Añadir descanso general")}<input type="checkbox" checked={breakMinutes>0} onChange={event=>setBreakMinutes(event.target.checked?5:0)} /></label>
        {breakMinutes>0?<><NumberStepper label={tx("Descanso general (minutos)")} value={breakMinutes} values={Array.from({length:60},(_,i)=>i+1)} onChange={setBreakMinutes} tx={tx} editable /><NumberStepper label={tx("Descanso cada (rondas)")} value={breakEveryRounds} values={Array.from({length:100},(_,i)=>i+1)} onChange={setBreakEveryRounds} tx={tx} editable /><p>{tx("Se añade al tiempo de cambio. Los descansos por jugador se calculan automáticamente.")}</p></>:null}
        <label className="flex items-center justify-between gap-3 text-sm font-bold">{tx("Rondas automáticas")}<input type="checkbox" checked={manualRoundCount === null} onChange={event => setManualRoundCount(event.target.checked ? null : Math.max(1, roundCount))} /></label>
        {manualRoundCount !== null ? <NumberStepper label={tx("Número de rondas en el torneo")} value={manualRoundCount} values={Array.from({ length: 100 }, (_, i) => i + 1)} onChange={setManualRoundCount} tx={tx} editable /> : null}
      </div></details>
    </div></details></section>
    <section aria-labelledby="tournament-participants"><details open className={`${styles.panel} ${styles.section}`}><summary id="tournament-participants"><span className={styles.step} aria-hidden="true">4</span>{tx("Participantes")}<span className={styles.chip}>{filledPlayers}/{playerCount}</span></summary><div className={styles.sectionBody}>
      <NumberStepper label={tx("Número de jugadores")} value={playerCount} values={pairing === "fixed" ? Array.from({ length: 11 },(_,index) => index*2+4) : Array.from({ length: 21 }, (_, index) => index + 4)} onChange={setPlayerCount} tx={tx} />
      <progress className={styles.progress} value={filledPlayers} max={playerCount} aria-label={tx("Participantes")} />
      <p className={styles.help}>{playerCount} {tx("jugadores")} · {tx(pairing === "fixed" ? "Por parejas" : "Individual")}. {tx("Puedes escribir nombres o vincular a personas registradas de tus ligas.")}</p>
      {source ? <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-sm font-black text-neutral-900">{tx("Jugadores de la temporada")}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{tx(manualSourceSlots > 0 ? "Selecciona jugadores de la temporada y completa con nombres manuales hasta alcanzar la cantidad elegida." : "Selecciona los jugadores de la temporada que participarán en el torneo.")}</p>
        {sourcePlayers.length > 24 ? <p className={styles.help}>{tx("Se han seleccionado los primeros 24 jugadores. Puedes cambiar la selección antes de crear el torneo.")}</p> : null}
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
      {pairing === "fixed" ? <details open className={styles.help}><summary>{tx("Formar parejas")}</summary><p>{tx("Asigna dos jugadores a cada pareja. El compañero se mantiene durante todo el torneo.")}</p>
        <div className="mt-2 grid gap-2">{formPlayers.map((player,index) => <label key={index} className={styles.pairChooser}><span className="min-w-0 flex-1 truncate font-bold">{player.trim() || `${tx("Jugador")} ${index+1}`}</span><SelectChevron><select className={`${fieldClass} ${styles.selectField}`} aria-label={`${tx("Pareja de")} ${player.trim() || `${tx("Jugador")} ${index+1}`}`} value={pairNumbers[index]} onChange={event => setPairNumbers(current => current.map((number,i) => i === index ? Number(event.target.value) : number))}>{Array.from({length:Math.floor(playerCount/2)},(_,i) => <option key={i+1} value={i+1}>{tx("Pareja")} {i+1}</option>)}</select></SelectChevron></label>)}</div>
        {!fixedTeamsValid ? <p role="alert" className="mt-2 font-bold text-red-700">{tx("Cada pareja debe tener dos jugadores. Revisa los equipos o restablece las parejas.")}</p> : null}
        <button type="button" className={`${styles.secondary} mt-2`} onClick={() => setPairNumbers(Array.from({length:24},(_,index) => Math.floor(index/2)+1))}>{tx("Restablecer parejas")}</button>
      </details> : null}
      <details className={styles.help}><summary>{tx("Próximamente: más opciones de inscripción")}</summary>{locked(tx("Inscripción abierta mediante invitación"), tx("Desactivada"), tx("Disponible próximamente"))}{locked(tx("Equilibrio por nivel de juego"), tx("Desactivado"), tx("Disponible próximamente"))}</details>
    </div></details></section>
    <section aria-labelledby="tournament-logistics"><details className={`${styles.panel} ${styles.section}`}><summary id="tournament-logistics">{tx("Logística calculada")}<span className={styles.chip}>{roundCount} {tx("rondas")} · {activeCourtCount} {tx("pistas activas")}</span></summary><div className={styles.sectionBody}>
      <div className="grid gap-2 sm:grid-cols-2">{locked(tx("Número de rondas en el torneo"), String(roundCount), tx("Se calcula a partir del tiempo de reserva."))}{locked(tx("Partidos por ronda y pista"), `${roundMinutes} ${tx("minutos")}`, tx("Cada pista juega una ronda a la vez."))}{locked(tx("Juego programado en cada pista"), `${roundCount * roundMinutes} ${tx("minutos")}`, tx("Suma del tiempo de juego de una pista a lo largo de todas las rondas."))}{locked(tx("Transición entre rondas"), `${transitionMinutes} ${tx("minutos")}`, tx("Pausa entre rondas."))}{locked(tx("Partidos programados en el torneo"), String(totalMatches), tx("Suma de todas las pistas y rondas."))}{locked(tx("Margen de seguridad de la reserva"), `${safetyMarginMinutes} ${tx("minutos")}`, tx("Tiempo que queda al final de la reserva."))}</div>{activeCourtCount < courtCount ? <p className={styles.help}>{activeCourtNote}</p> : null}
      {!configurationValidation.ok ? <p role="alert" className="text-sm font-bold text-red-700">{tx(configurationValidation.error === "insufficient_safety_margin" ? "La configuración supera la reserva. Reduce rondas o duración, o amplía la reserva." : "Con esta combinación de jugadores, pistas y tiempo no todos podrían jugar. Añade pistas o elige una reserva más larga.")}</p> : null}
      <div className="rounded-xl bg-neutral-50 p-3"><p className="text-sm font-black">{tx("Planificación automática")} · {tx("Activada")}</p><p className="mt-1 text-xs leading-5 text-neutral-600">{tx("Smash & Lob organiza automáticamente parejas, pistas, rondas y descansos para aprovechar la reserva de manera equilibrada.")}</p></div>
    </div></details></section>
    <section aria-labelledby="tournament-rules"><details className={`${styles.panel} ${styles.section}`}><summary id="tournament-rules">{tx("Reglas de competición")}</summary><div className={styles.sectionBody}>
      {locked(tx(pairing === "fixed" ? "Parejas fijas" : "Parejas cambiantes"), tx("Activado"), tx(pairing === "fixed" ? "Se mantiene el compañero durante todo el torneo." : format === "dynamic_mexicano" ? "Las parejas se recalculan al generar cada ronda." : "Las parejas se asignan según el calendario fijo."))}
      {locked(tx("Equilibrio de participación"), tx("Activado"), tx("El calendario reparte los partidos y descansos de la forma más equilibrada posible."))}
      {pairing === "rotating" ? locked(tx("Minimizar repeticiones de compañeros"), tx("Activado"), "") : null}
      {locked(tx("Minimizar repeticiones de rivales"), tx("Activado"), "")}
      {locked(tx("Final entre mejores clasificados"), tx("Desactivada"), tx(pairing === "fixed" ? "La pareja campeona sale de la clasificación por equipos." : "El campeón sale de la clasificación individual."))}
      {locked(tx("Reordenación dinámica de enfrentamientos"), tx(format === "dynamic_mexicano" ? "Activada" : "Desactivada"), tx(format === "dynamic_mexicano" ? "Cada ronda nueva utiliza los resultados ya registrados." : "Las rondas no dependen de los resultados."))}
    </div></details></section>
    <section aria-labelledby="tournament-scoring"><details className={`${styles.panel} ${styles.section}`}><summary id="tournament-scoring">{tx("Puntuación")}</summary><div className={styles.sectionBody}>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Puntuación")}</span><SelectChevron><select className={`${fieldClass} ${styles.selectField}`} defaultValue="points"><option value="points">{tx("Puntuación por tiempo")}</option><option disabled>{tx("Juegos tradicionales")} · {tx("Disponible próximamente")}</option><option disabled>{tx("Tie-break o super tie-break")} · {tx("Disponible próximamente")}</option></select></SelectChevron></label>
      <label className="block space-y-1"><span className="text-sm font-bold">{tx("Clasificación")}</span><SelectChevron><select className={`${fieldClass} ${styles.selectField}`} value={format === "dynamic_mexicano" ? "rating" : "average"} disabled><option value="average">{tx("Por porcentaje de puntos ganados")}</option><option value="rating">{tx("Por rendimiento normalizado")}</option><option disabled>{tx("Por puntos acumulados")} · {tx("Disponible próximamente")}</option></select></SelectChevron></label>
      <p className={styles.help}>{roundMinutes} {tx("minutos")} · {tx("Empates permitidos")} · {tx("Sí")}</p><p className={styles.help}>{tx(format === "dynamic_mexicano" ? "El rendimiento se calcula con los puntos a favor y en contra: R = 100 × (F + 3) / (F + C + 6). Los nuevos enfrentamientos utilizan esta clasificación." : pairing === "fixed" ? "Cada punto suma para la pareja. La clasificación usa la media de los porcentajes ganados en cada partido; los puntos no se duplican por jugador." : "Se anota cada punto ganado. Al terminar los 16 minutos se completa el punto en juego; no se usan juegos ni sets. Cada jugador suma el porcentaje de puntos ganados por su pareja en cada partido y la clasificación usa la media de sus partidos.").replace("16", String(roundMinutes))}</p>
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
    <section aria-labelledby="tournament-summary" className={`${styles.panel} ${styles.summary}`}><p className={styles.eyebrow}>{tx("Resumen del torneo")}</p><h2 id="tournament-summary" className="mt-2 break-words text-lg font-black">{name.trim() || tx("Nombre del torneo")}</h2>{selectedLocation ? <p className="mt-2 text-sm font-semibold">{getLeagueLocationOptionLabel(selectedLocation)}</p> : null}<p className="mt-1 text-sm font-bold">{startsAt && Number.isFinite(startsAt.getTime()) ? `${dateFormat.format(startsAt)} · ${timeFormat.format(startsAt)}` : tx("Elige fecha y hora")}</p><div className={styles.summaryGrid}><div className={styles.metric}><span>{tx("Modalidad")}</span><strong>{tx("Torneo rápido")} · {tx(format === "dynamic_mexicano" ? "Mexicano dinámico" : "Americana equilibrada")}</strong></div><div className={styles.metric}><span>{tx("Participantes")}</span><strong>{playerCount} {tx("jugadores")}</strong></div><div className={styles.metric}><span>{tx("Pistas (totales · simultáneas)")}</span><strong>{courtCount} · {activeCourtCount}</strong></div><div className={styles.metric}><span>{tx("Tiempo de reserva (minutos)")}</span><strong>{reservationMinutes} {tx("minutos")}</strong></div><div className={styles.metric}><span>{tx("Calentamiento (minutos)")}</span><strong>{effectivePreparationMinutes} {tx("minutos")}</strong></div><div className={styles.metric}><span>{tx("Planificación automática")}</span><strong>{tx("Activada")}</strong></div><div className={styles.metric}><span>{tx("Número de rondas en el torneo")}</span><strong>{roundCount}</strong></div><div className={styles.metric}><span>{tx("Partidos por ronda y pista")}</span><strong>{roundMinutes} {tx("minutos")}</strong></div><div className={styles.metric}><span>{tx("Juego programado en cada pista")}</span><strong>{roundCount * roundMinutes} {tx("minutos")}</strong></div><div className={styles.metric}><span>{tx("Transición entre rondas")}</span><strong>{transitionMinutes} {tx("minutos")}</strong></div><div className={styles.metric}><span>{tx("Datos por jugador")}</span><strong>{matchesPerPlayer} {tx("partidos")} · {restsPerPlayer} {tx("descansos")}</strong></div><div className={styles.metric}><span>{tx("Minutos de juego por jugador")}</span><strong>{minutesPerPlayer} {tx("minutos")}</strong></div><div className={styles.metric}><span>{tx("Partidos programados en el torneo")}</span><strong>{totalMatches} {tx("partidos")}</strong></div><div className={styles.metric}><span>{tx("Margen de seguridad de la reserva")}</span><strong>{safetyMarginMinutes} {tx("minutos")}</strong></div><div className={styles.metric}><span>{tx("Puntuación")}</span><strong>{tx("Puntuación por tiempo")} · {tx(format === "dynamic_mexicano" ? "Por rendimiento normalizado" : "Por porcentaje de puntos ganados")}</strong></div></div><p className={`${styles.help} mt-2`}>{tx("La participación y los tiempos por jugador se calculan con la configuración actual.")}</p>
      <p className={`${styles.help} mt-2`}>{tx(pairing === "fixed" ? "Parejas fijas" : "Parejas rotativas")} · {tx(pairing === "fixed" ? "Clasificación por equipos" : "Clasificación individual")}</p>
      {breakMinutes>0?<p className={`${styles.help} mt-2`}>{tx("Descanso general")}: {breakMinutes} {tx("minutos")} · {tx("Descanso cada (rondas)")}: {breakEveryRounds} · {tx("Pausas programadas")}: {breakCount}</p>:null}
      <details className={`${styles.help} mt-3`}><summary>{tx("Previsualización de horarios")}</summary><ol className={styles.schedulePreview}>{rounds.map((round) => <li key={round.round}><span className="font-black">{tx("Ronda")} {round.round}</span><span className="tabular-nums">{timeFormat.format(new Date(round.startsAt))}–{timeFormat.format(new Date(round.endsAt))}</span></li>)}</ol></details>
    {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
    {startsAt && startsAt.getTime() <= nowTimestamp ? <p className="text-sm font-semibold text-amber-700">{tx("La fecha y hora de inicio deben ser futuras.")}</p> : null}
    {logoCropSource ? <ImageCropDialog src={logoCropSource} title={tx("Recortar logo")} description={tx("Ajusta el encuadre. Los PNG transparentes conservarán el fondo transparente.")} shape="square" outputSize={512} outputType="auto" maxOutputBytes={512 * 1024} onCancel={() => setLogoCropSource(null)} onConfirm={dataUrl => { setLogoUrl(dataUrl); setLogoCropSource(null) }} /> : null}
    <button type="button" onClick={() => void createTournament()} className={`${styles.primary} mt-4 w-full`} disabled={!ready || saving}>{saving ? tx("Creando torneo…") : tx(format === "dynamic_mexicano" ? "Crear torneo" : "Crear y generar calendario")}</button>
    </section>
  </div>
}
