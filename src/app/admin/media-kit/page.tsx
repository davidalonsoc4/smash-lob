"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { BackButton } from "@/components/ui/BackButton"
import { AppCard } from "@/components/ui/AppCard"
import { SeasonStartCountdown } from "@/components/season/SeasonStartCountdown"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useMvp } from "@/context/MvpProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import type { Match, PlayerProfile } from "@/data/fakeData"
import {
  findLeagueLocationByScheduleLocation,
  getScheduleLocationFallbackText,
  type LeagueLocation,
} from "@/lib/leagueLocations"
import {
  MEDIA_KIT_ICON_OPTIONS,
  getMediaKitIconId,
  mediaKitIconDataUrl,
  mediaKitIconToken,
  type MediaKitIconId,
} from "@/lib/mediaKitIcons"
import { getSeasonCountdown, formatScheduledSeasonStart, SCHEDULED_SEASON_TIME_ZONE } from "@/lib/seasonScheduling"
import { formatShortDate } from "@/lib/rounds"
import { getRoundMvpSelection, getSeasonMvpSelection } from "@/lib/mvp"
import {
  createLeagueMediaKitImage,
  downloadLeagueMediaKitImage,
  type LeagueMediaKitImageData,
  type LeagueMediaKitHeadlineFont,
  type LeagueMediaKitKind,
} from "@/lib/leagueMediaKitImage"

const titles: Record<LeagueMediaKitKind, string> = {
  opening: "Apertura",
  matchday: "Jornada",
  format: "Formato de la liga",
  rules: "Reglas de la liga",
  gameplay: "Cómo se juega",
  registration: "Inscripciones",
  calendar: "Calendario",
  start: "Inicio de liga",
  countdown: "Cuenta atrás",
  results: "Resultados de la jornada",
  standings: "Clasificación actualizada",
  mvp: "MVP de la jornada",
  next_round: "Próxima jornada",
  season_final: "Final de temporada",
}

const compactPresetTitles: Record<LeagueMediaKitKind, string> = {
  opening: "Apertura",
  matchday: "Jornada",
  format: "Formato",
  rules: "Reglas",
  gameplay: "En pista",
  registration: "Cuota",
  calendar: "Agenda",
  start: "Inicio",
  countdown: "Cuenta",
  results: "Resultados",
  standings: "Clasificación",
  mvp: "MVP",
  next_round: "Próxima",
  season_final: "Final",
}

const openingAccentOptions = ["#d7a544", "#bb9448", "#d4643c", "#3d9d86", "#477bd1", "#8b5fc0"]
const openingHeadlineFontOptions: Array<{ id: LeagueMediaKitHeadlineFont; label: string; detail: string; sampleClass: string }> = [
  { id: "impact", label: "Impacto", detail: "Cartel deportivo", sampleClass: "font-black tracking-tight" },
  { id: "condensed", label: "Condensada", detail: "Alta y precisa", sampleClass: "font-black tracking-[-.08em]" },
  { id: "editorial", label: "Editorial", detail: "Premium clásica", sampleClass: "font-serif font-black tracking-tight" },
  { id: "athletic", label: "Atlética", detail: "Ancha y dinámica", sampleClass: "font-black italic tracking-[-.04em]" },
  { id: "monumental", label: "Monumental", detail: "Serifa sólida", sampleClass: "font-serif font-black tracking-tight" },
  { id: "geometric", label: "Geométrica", detail: "Limpia y moderna", sampleClass: "font-sans font-black tracking-tight" },
  { id: "didone", label: "Didona", detail: "Lujo y contraste", sampleClass: "font-serif font-black tracking-tight" },
  { id: "technical", label: "Técnica", detail: "Marcador digital", sampleClass: "font-mono font-black tracking-tight" },
]
const fieldClass = "mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-950 outline-none transition focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
const gameplayRows: LeagueMediaKitImageData["rows"] = [
  { label: "Calentamiento · 10/15 minutos", value: "Pelotea en paralelo desde el fondo; continúa con red y defensa, globos, bandejas y remates. Termina probando varios saques.", icon: mediaKitIconToken("racket") },
  { label: "STAR Point", value: "En los dos primeros 40-40 se mantienen las ventajas. Si hay un tercer 40-40, la pareja restadora elige lado y se juega un punto decisivo.", icon: mediaKitIconToken("star") },
  { label: "Tie-break · cuándo y cómo ganar", value: "Con 6-6 se juega tie-break. Gana la primera pareja que llega a 7 con dos de ventaja; si sigue igualado, continúa hasta abrir dos puntos.", icon: mediaKitIconToken("target") },
  { label: "Tie-break · orden de saque", value: "Saca un punto quien tiene el turno normal, desde la derecha. Después cada jugador saca dos: primero izquierda y luego derecha.", icon: mediaKitIconToken("repeat") },
]

function slug(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() }

function openingDateLabels(value: string | null | undefined) {
  if (!value) return { date: "26 DE SEPTIEMBRE", time: "10:00" }
  const instant = new Date(value)
  if (Number.isNaN(instant.getTime())) return { date: "26 DE SEPTIEMBRE", time: "10:00" }
  return {
    date: new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: SCHEDULED_SEASON_TIME_ZONE }).format(instant).toLocaleUpperCase("es-ES"),
    time: new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: SCHEDULED_SEASON_TIME_ZONE }).format(instant),
  }
}

type MatchdayDraft = {
  round: number
  roundLabel: string
  matchLabel: string
  date: string
  time: string
  venue: string
  teamA: [string, string]
  teamB: [string, string]
}

function matchdayDateLabels(value: string | null | undefined) {
  if (!value) return { date: "FECHA POR CONFIRMAR", time: "--:--" }
  const instant = new Date(value)
  if (Number.isNaN(instant.getTime())) return { date: "FECHA POR CONFIRMAR", time: "--:--" }
  return {
    date: new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: SCHEDULED_SEASON_TIME_ZONE }).format(instant).toLocaleUpperCase("es-ES"),
    time: new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: SCHEDULED_SEASON_TIME_ZONE }).format(instant),
  }
}

function playerDisplayName(players: PlayerProfile[], playerId: string | undefined) {
  if (!playerId) return "Jugador por confirmar"
  return players.find((player) => player.id === playerId)?.displayName ?? playerId
}

type ResultCard = NonNullable<LeagueMediaKitImageData["results"]>[number]

function emptyResultCard(): ResultCard {
  return {
    teamA: ["Jugador 1", "Jugador 2"],
    teamB: ["Jugador 3", "Jugador 4"],
    pointsA: 0,
    pointsB: 0,
    sets: [{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }],
  }
}

function resultCardFromMatch(match: Match, players: PlayerProfile[]): ResultCard {
  const sets = match.sets.slice(0, 3)
  return {
    teamA: [playerDisplayName(players, match.teamA[0]), playerDisplayName(players, match.teamA[1])],
    teamB: [playerDisplayName(players, match.teamB[0]), playerDisplayName(players, match.teamB[1])],
    pointsA: match.pointsA ?? sets.filter((set) => set.a > set.b).length,
    pointsB: match.pointsB ?? sets.filter((set) => set.b > set.a).length,
    sets: sets.length > 0 ? sets : emptyResultCard().sets,
  }
}

function ensureResultCardCount(cards: ResultCard[]) {
  const next = cards.slice(0, 4)
  while (next.length < 2) next.push(emptyResultCard())
  return next
}

function mediaKitLocationLabel(value: string | null | undefined, locations: LeagueLocation[], separator = " · ") {
  const location = findLeagueLocationByScheduleLocation({ locations, scheduleLocation: value })
  if (!location) return getScheduleLocationFallbackText(value)
  const town = location.town?.trim()
  const name = location.name.trim()
  if (town && town.toLocaleLowerCase("es-ES") !== name.toLocaleLowerCase("es-ES")) return `${town}${separator}${name}`
  return name || town || getScheduleLocationFallbackText(value)
}

function createMatchdayDraft(match: Match | undefined, players: PlayerProfile[], locations: LeagueLocation[], roundMatches: Match[] = []): MatchdayDraft {
  const labels = matchdayDateLabels(match?.scheduledAt)
  const matchIndex = match ? Math.max(0, roundMatches.findIndex((item) => item.id === match.id)) : 0
  return {
    round: match?.round ?? 1,
    roundLabel: `Jornada ${match?.round ?? 1}`,
    matchLabel: `Partido ${matchIndex + 1}`,
    date: labels.date,
    time: labels.time,
    venue: mediaKitLocationLabel(match?.location, locations) ?? "Lugar por confirmar",
    teamA: [playerDisplayName(players, match?.teamA[0]), playerDisplayName(players, match?.teamA[1])],
    teamB: [playerDisplayName(players, match?.teamB[0]), playerDisplayName(players, match?.teamB[1])],
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
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 type-caption font-black uppercase tracking-[.18em] text-neutral-400"><span>Vista previa</span><span>1080 × 1350</span></div>
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
  const { votes } = useMvp()
  const { seasons } = useSeasonSettings()
  const [selectedMediaKitSeasonId, setSelectedMediaKitSeasonId] = useState<string | null>(null)
  const { activeLeague, activeSeason, roundSettings, rounds, matches, players, rankingPlayers } = useCurrentLeagueData(selectedMediaKitSeasonId)
  const leagueSeasons = seasons.filter((season) => season.leagueId === activeLeague.id)
  const [busy, setBusy] = useState<LeagueMediaKitKind | null>(null)
  const openingRoundMatches = [...matches].filter((match) => match.round === 1).sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""))
  const firstOpeningMatch = openingRoundMatches[0]
  const openingMatchCount = openingRoundMatches.length || Math.max(1, Math.floor(players.length / 4))
  const openingSubtitleDefault = `Un día, ${openingMatchCount} ${openingMatchCount === 1 ? "partido" : "partidos"}, el mejor comienzo`
  const initialOpeningLabels = openingDateLabels(firstOpeningMatch?.scheduledAt ?? roundSettings.scheduledStartAt)
  const initialOpeningVenue = mediaKitLocationLabel(firstOpeningMatch?.location, activeLeague.locations, " ") ?? "Lugar por confirmar"
  const sortedMatchdayMatches = useMemo(() => [...matches].sort((a, b) => a.round - b.round || (a.scheduledAt ?? "9999").localeCompare(b.scheduledAt ?? "9999") || a.id.localeCompare(b.id)), [matches])
  const preferredMatchdayRound = rounds.find((round) => round.status === "active")?.round
  const initialMatchdayMatch = sortedMatchdayMatches.find((match) => match.round === preferredMatchdayRound) ?? sortedMatchdayMatches.find((match) => match.status !== "finished") ?? sortedMatchdayMatches[0]
  const initialMatchdayRoundMatches = sortedMatchdayMatches.filter((match) => match.round === initialMatchdayMatch?.round)
  const defaultMatchdayDraft = createMatchdayDraft(initialMatchdayMatch, players, activeLeague.locations, initialMatchdayRoundMatches)
  const [openingSeasonHeader, setOpeningSeasonHeader] = useState(activeSeason.name)
  const [openingTitle, setOpeningTitle] = useState("Jornada de apertura")
  const [openingSubtitle, setOpeningSubtitle] = useState(openingSubtitleDefault)
  const [openingDate, setOpeningDate] = useState(initialOpeningLabels.date)
  const [openingTime, setOpeningTime] = useState(initialOpeningLabels.time)
  const [openingVenue, setOpeningVenue] = useState(initialOpeningVenue)
  const [openingRound, setOpeningRound] = useState("Jornada 1")
  const [openingAccent, setOpeningAccent] = useState("#d7a544")
  const [customAccentDraft, setCustomAccentDraft] = useState("#d7a544")
  const [showCustomAccent, setShowCustomAccent] = useState(false)
  const [openingHeadlineFont, setOpeningHeadlineFont] = useState<LeagueMediaKitHeadlineFont>("editorial")
  const [openingLogoOverride, setOpeningLogoOverride] = useState<string | null>(null)
  const [spotlightImageUrl, setSpotlightImageUrl] = useState<string | null>(null)
  const [formatRows, setFormatRows] = useState<LeagueMediaKitImageData["rows"]>([
    { label: "Clasificación individual", value: "Cada jugador compite por su propia posición y suma sus resultados jornada a jornada.", icon: mediaKitIconToken("chart") },
    { label: "Parejas diferentes", value: "El calendario busca que compartas pista con una pareja distinta en cada jornada.", icon: mediaKitIconToken("users") },
    { label: "Rivales equilibrados", value: "Las repeticiones de rivales se reducen al mínimo posible durante la temporada.", icon: mediaKitIconToken("bolt") },
    { label: "Calendario automático", value: "Smash & Lob organiza las combinaciones para que solo tengas que jugar y competir.", icon: mediaKitIconToken("calendar") },
  ])
  const [openIconPickerIndex, setOpenIconPickerIndex] = useState<number | null>(null)
  const [formatClosing, setFormatClosing] = useState("Una liga. Nuevas parejas. Un ranking individual.")
  const [selectedMatchdayId, setSelectedMatchdayId] = useState(initialMatchdayMatch?.id ?? "")
  const [matchdayDraft, setMatchdayDraft] = useState<MatchdayDraft>(() => defaultMatchdayDraft)
  const [activePresetKind, setActivePresetKind] = useState<LeagueMediaKitKind>("opening")
  const [workspaceView, setWorkspaceView] = useState<"preview" | "customize">("preview")
  const canManage = isLeagueAdmin(activeLeague.id)
  const scheduledLabel = formatScheduledSeasonStart(roundSettings.scheduledStartAt)
  const countdown = getSeasonCountdown(roundSettings.scheduledStartAt)
  const matchdayRoundNumbers = [...new Set(sortedMatchdayMatches.map((match) => match.round))]
  const selectedRoundMatches = sortedMatchdayMatches.filter((match) => match.round === matchdayDraft.round)
  const completedResultRoundNumbers = [...new Set(sortedMatchdayMatches.map((match) => match.round))]
    .filter((round) => {
      const roundMatches = sortedMatchdayMatches.filter((match) => match.round === round)
      return roundMatches.length > 0 && roundMatches.every((match) => match.status === "finished")
    })
    .sort((a, b) => a - b)
  const latestCompletedRound = completedResultRoundNumbers.at(-1)
  const latestResultMatches = latestCompletedRound
    ? sortedMatchdayMatches.filter((match) => match.round === latestCompletedRound && match.status === "finished")
    : []
  const loadedResultCards = ensureResultCardCount(latestResultMatches.map((match) => resultCardFromMatch(match, players)))
  const [selectedResultRound, setSelectedResultRound] = useState(latestCompletedRound ?? 1)
  const [resultCards, setResultCards] = useState<ResultCard[]>(loadedResultCards)
  const standingsRows: LeagueMediaKitImageData["rows"] = rankingPlayers.slice(0, 5).map((player) => ({
    label: player.displayName,
    value: `${player.points} pts · ${player.gamesDiff >= 0 ? "+" : ""}${player.gamesDiff} dif.`,
  }))
  const latestRoundMvp = latestCompletedRound && roundSettings.mvpSystem !== "none"
    ? getRoundMvpSelection({
        votes,
        leagueId: activeLeague.id,
        seasonId: activeSeason.id,
        round: latestCompletedRound,
        matches,
        mvpSystem: roundSettings.mvpSystem,
      })
    : null
  const latestRoundMvpPlayers = players.filter((player) => latestRoundMvp?.playerIds.includes(player.id))
  const latestRoundMvpName = latestRoundMvpPlayers.map((player) => player.displayName).join(" / ")
  const seasonMvp = activeSeason.status === "finished" && roundSettings.mvpSystem !== "none"
    ? getSeasonMvpSelection({
        votes,
        leagueId: activeLeague.id,
        seasonId: activeSeason.id,
        matches,
        mvpSystem: roundSettings.mvpSystem,
      })
    : null
  const seasonMvpNames = players.filter((player) => seasonMvp?.playerIds.includes(player.id)).map((player) => player.displayName).join(" / ")
  const leader = rankingPlayers[0]
  const championRows: LeagueMediaKitImageData["rows"] = rankingPlayers.slice(0, 3).map((player, index) => ({
    label: index === 0 ? "Campeón" : index === 1 ? "Subcampeón" : "Tercer puesto",
    value: `${player.displayName} · ${player.points} pts`,
  }))
  const nextRound = rounds.find((round) => round.status === "active")
    ?? rounds.find((round) => round.status === "upcoming" || round.status === "overdue")
  const nextRoundMatches = nextRound ? sortedMatchdayMatches.filter((match) => match.round === nextRound.round) : []
  const nextRoundFirstMatch = nextRoundMatches[0]
  const nextRoundLabels = matchdayDateLabels(nextRoundFirstMatch?.scheduledAt ?? nextRound?.startsAt)
  const nextRoundVenue = mediaKitLocationLabel(nextRoundFirstMatch?.location, activeLeague.locations, " ") ?? "Lugar por confirmar"
  const rulesRows: LeagueMediaKitImageData["rows"] = [
    {
      label: roundSettings.requiresThreeSets ? "Tres sets obligatorios" : "Sets flexibles",
      value: roundSettings.requiresThreeSets ? "Cada partido debe jugar y registrar los tres sets completos, aunque una pareja gane los dos primeros. Todos cuentan para la clasificación." : "Se registran únicamente los sets que se hayan completado. Cada set guardado cuenta para la puntuación y las estadísticas de ambos equipos.",
      icon: mediaKitIconToken("repeat"),
    },
    {
      label: "Puntuación",
      value: roundSettings.requiresThreeSets ? "Cada set ganado suma 1 punto a cada integrante de la pareja: un 3-0 reparte 3/0 puntos y un 2-1 reparte 2/1." : "Cada set ganado suma 1 punto a cada integrante de la pareja. Solo se añaden al ranking los sets completados y guardados.",
      icon: mediaKitIconToken("chart"),
    },
    {
      label: "Desempates",
      value: "Si hay empate a puntos, decide la diferencia entre juegos ganados y perdidos. Si continúa, queda delante quien tenga más juegos a favor.",
      icon: mediaKitIconToken("balance"),
    },
  ]
  if (roundSettings.mvpSystem !== "none") {
    rulesRows.push({
      label: roundSettings.mvpSystem === "voting" ? "MVP por votación" : roundSettings.mvpSystem === "automatic_advanced" ? "MVP automático avanzado" : "MVP automático",
      value: roundSettings.mvpSystem === "voting" ? "Tras el partido, cada participante vota a otro jugador y no puede elegirse a sí mismo. Los votos de todos los partidos se suman en la jornada." : roundSettings.mvpSystem === "automatic_advanced" ? "La app analiza resultados, sets y juegos, ajustando el rendimiento según compañeros y rivales para elegir al jugador más destacado." : "La app compara los resultados de la jornada y concede el MVP a los dos integrantes de la pareja que logra la victoria más dominante.",
      icon: mediaKitIconToken("trophy"),
    })
  }
  const isResultsPreset = activePresetKind === "results"
  const isScoreboardPreset = activePresetKind === "standings"
  const isSpotlightPreset = activePresetKind === "mvp" || activePresetKind === "season_final"
  const isInformationalPreset = activePresetKind === "format"
    || activePresetKind === "rules"
    || activePresetKind === "gameplay"
    || isScoreboardPreset
    || isSpotlightPreset

  const openingData = useMemo<LeagueMediaKitImageData>(() => ({
    kind: activePresetKind,
    template: isResultsPreset ? "results_premium_06" : isSpotlightPreset ? "spotlight_premium_05" : isScoreboardPreset ? "scoreboard_premium_04" : isInformationalPreset ? "informational_premium_02" : activePresetKind === "matchday" ? "matchday_premium_03" : "opening_day_premium_01",
    leagueName: activeLeague.name,
    seasonName: openingSeasonHeader,
    leagueLogoUrl: openingLogoOverride ?? activeLeague.logoUrl,
    eyebrow: activePresetKind === "format" ? "Cómo funciona" : activePresetKind === "rules" ? "Reglamento" : activePresetKind === "gameplay" ? "Guía de juego" : activePresetKind === "results" ? "Jornada completada" : activePresetKind === "standings" ? "Ranking oficial" : activePresetKind === "mvp" ? "Jugador destacado" : activePresetKind === "season_final" ? "Cierre oficial" : activePresetKind === "matchday" ? "Enfrentamiento oficial" : "Evento oficial",
    title: activePresetKind === "matchday" ? matchdayDraft.roundLabel : openingTitle,
    subtitle: activePresetKind === "matchday" ? matchdayDraft.matchLabel : openingSubtitle,
    rows: isInformationalPreset ? formatRows : [],
    heroValue: isInformationalPreset ? formatClosing : undefined,
    accentColor: openingAccent,
    eventDateLabel: activePresetKind === "matchday" ? matchdayDraft.date : openingDate,
    eventTimeLabel: activePresetKind === "matchday" ? matchdayDraft.time : openingTime,
    venue: activePresetKind === "matchday" ? matchdayDraft.venue : openingVenue,
    roundLabel: activePresetKind === "matchday" ? matchdayDraft.roundLabel : openingRound,
    headlineFont: openingHeadlineFont,
    matchup: activePresetKind === "matchday" ? { teamA: matchdayDraft.teamA, teamB: matchdayDraft.teamB } : undefined,
    spotlightImageUrl: isSpotlightPreset ? spotlightImageUrl : undefined,
    resultRound: isResultsPreset ? selectedResultRound : undefined,
    results: isResultsPreset ? resultCards : undefined,
  }), [activeLeague.logoUrl, activeLeague.name, activePresetKind, formatClosing, formatRows, isInformationalPreset, isResultsPreset, isScoreboardPreset, isSpotlightPreset, matchdayDraft, openingAccent, openingDate, openingHeadlineFont, openingLogoOverride, openingRound, openingSeasonHeader, openingSubtitle, openingTime, openingTitle, openingVenue, resultCards, selectedResultRound, spotlightImageUrl])

  const base = { leagueName: activeLeague.name, seasonName: openingSeasonHeader, leagueLogoUrl: activeLeague.logoUrl, template: "opening_day_premium_01" as const, accentColor: openingAccent, headlineFont: openingHeadlineFont }
  const pieces: Array<{ kind: LeagueMediaKitKind; data: LeagueMediaKitImageData; disabled?: boolean }> = [
    { kind: "matchday", disabled: sortedMatchdayMatches.length === 0, data: { ...base, kind: "matchday", template: "matchday_premium_03", eyebrow: "Enfrentamiento oficial", title: defaultMatchdayDraft.roundLabel, subtitle: defaultMatchdayDraft.matchLabel, eventDateLabel: defaultMatchdayDraft.date, eventTimeLabel: defaultMatchdayDraft.time, venue: defaultMatchdayDraft.venue, roundLabel: defaultMatchdayDraft.roundLabel, matchup: { teamA: defaultMatchdayDraft.teamA, teamB: defaultMatchdayDraft.teamB }, rows: [] } },
    { kind: "results", data: { ...base, kind: "results", template: "results_premium_06", eyebrow: "Jornada completada", title: "Resultados de la jornada", subtitle: latestCompletedRound ? `Jornada ${latestCompletedRound} · Marcadores oficiales` : "Los marcadores aparecerán al cerrar la jornada", rows: [], resultRound: latestCompletedRound, results: loadedResultCards } },
    { kind: "standings", data: { ...base, kind: "standings", template: "scoreboard_premium_04", eyebrow: "Ranking oficial", title: "Clasificación actualizada", subtitle: latestCompletedRound ? `Después de la jornada ${latestCompletedRound}` : "Así arranca la competición", heroValue: "Top 5 · Puntos y diferencia de juegos", rows: standingsRows.length > 0 ? standingsRows : [{ label: "Clasificación pendiente", value: "—" }] } },
    { kind: "mvp", data: { ...base, kind: "mvp", template: "spotlight_premium_05", eyebrow: "Jugador destacado", title: "MVP de la jornada", subtitle: latestCompletedRound ? `Jornada ${latestCompletedRound} · ${latestRoundMvp?.tied ? "Reconocimiento compartido" : "Actuación destacada"}` : "Reconocimiento de la jornada", heroValue: latestRoundMvpName || "MVP por confirmar", spotlightImageUrl: latestRoundMvpPlayers[0]?.avatarUrl, rows: [
      { label: "Jornada", value: latestCompletedRound ? `Jornada ${latestCompletedRound}` : "Pendiente" },
      { label: "Sistema", value: roundSettings.mvpSystem === "voting" ? `${latestRoundMvp?.votes ?? 0} votos` : roundSettings.mvpSystem === "automatic_advanced" ? "Rendimiento avanzado" : roundSettings.mvpSystem === "none" ? "Desactivado" : "Rendimiento automático" },
      { label: "Distinción", value: latestRoundMvp?.tied ? "MVP compartido" : latestRoundMvp ? "MVP de jornada" : "Por decidir" },
    ] } },
    { kind: "next_round", data: { ...base, kind: "next_round", eyebrow: "Próximo reto", title: "Próxima jornada", subtitle: "Todo preparado para volver a competir", eventDateLabel: nextRound ? nextRoundLabels.date : "FECHA POR CONFIRMAR", eventTimeLabel: nextRound ? nextRoundLabels.time : "--:--", roundLabel: nextRound ? `Jornada ${nextRound.round}` : "Próximamente", venue: nextRoundVenue, rows: [] } },
    { kind: "season_final", data: { ...base, kind: "season_final", template: "spotlight_premium_05", eyebrow: "Cierre oficial", title: "Final de temporada", subtitle: seasonMvpNames ? `Campeón y MVP: ${seasonMvpNames}` : `${activeSeason.name} · Clasificación final`, heroValue: leader?.displayName ?? "Campeón por decidir", spotlightImageUrl: leader?.avatarUrl, rows: championRows.length > 0 ? championRows : [{ label: "Campeón", value: "Por decidir" }] } },
    { kind: "format", data: { ...base, kind: "format", template: "informational_premium_02", eyebrow: "Cómo funciona", title: "Así funciona la liga", subtitle: "Compites individualmente, pero cada jornada juegas con una pareja diferente.", heroValue: "Una liga. Nuevas parejas. Un ranking individual.", rows: [
      { label: "Clasificación individual", value: "Cada jugador compite por su propia posición y suma sus resultados jornada a jornada.", icon: mediaKitIconToken("chart") },
      { label: "Parejas diferentes", value: "El calendario busca que compartas pista con una pareja distinta en cada jornada.", icon: mediaKitIconToken("users") },
      { label: "Rivales equilibrados", value: "Las repeticiones de rivales se reducen al mínimo posible durante la temporada.", icon: mediaKitIconToken("bolt") },
      { label: "Calendario automático", value: "Smash & Lob organiza las combinaciones para que solo tengas que jugar y competir.", icon: mediaKitIconToken("calendar") },
    ] } },
    { kind: "rules", data: { ...base, kind: "rules", template: "informational_premium_02", eyebrow: "Reglamento", title: "Reglas de la liga", subtitle: "Cómo se juegan los partidos y cómo se ordena la clasificación.", heroValue: "Cada set cuenta. Cada juego puede decidir la clasificación.", rows: rulesRows } },
    { kind: "gameplay", data: { ...base, kind: "gameplay", template: "informational_premium_02", eyebrow: "Guía de juego", title: "Durante el partido", subtitle: "Calentamiento, STAR Point y tie-break explicados paso a paso.", heroValue: "Entra en ritmo. Conoce la regla. Compite cada punto.", rows: gameplayRows } },
    { kind: "registration", data: { ...base, kind: "registration", eyebrow: "Información de pago", title: "Cuota de inscripción", subtitle: "Para gastos derivados de la liga", eventDateLabel: "20€", roundLabel: "Pago único", eventTimeLabel: "Fianza", venue: "Por jugador", rows: [
      { label: "Concepto", value: "Para gastos derivados de la liga" },
      { label: "Importe", value: "20€ por jugador" },
      { label: "Pago", value: "Fianza" },
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
    title: "Jornada de apertura",
    subtitle: openingSubtitleDefault,
    eventDateLabel: initialOpeningLabels.date,
    eventTimeLabel: initialOpeningLabels.time,
    venue: initialOpeningVenue,
    roundLabel: "Jornada 1",
    rows: [],
  }
  const presets = [{ kind: "opening" as const, data: openingPresetData, disabled: false }, ...pieces]

  function applyPresetData(kind: LeagueMediaKitKind, data: LeagueMediaKitImageData) {
    setOpeningTitle(data.title)
    setOpeningSubtitle(data.subtitle ?? "")
    setOpeningDate(data.eventDateLabel ?? "")
    setOpeningTime(data.eventTimeLabel ?? "")
    setOpeningRound(data.roundLabel ?? "")
    setOpeningVenue(data.venue ?? "")
    if (kind === "format" || kind === "rules" || kind === "gameplay" || kind === "standings" || kind === "mvp" || kind === "season_final") {
      setFormatRows(data.rows.slice(0, 5).map((row) => ({ ...row, icon: row.icon ?? null })))
      setFormatClosing(data.heroValue ?? "")
    }
    if (kind === "results") {
      setSelectedResultRound(data.resultRound ?? latestCompletedRound ?? 1)
      setResultCards(ensureResultCardCount(data.results ?? []))
    }
    setSpotlightImageUrl(data.spotlightImageUrl ?? null)
  }

  useEffect(() => {
    const preset = presets.find((item) => item.kind === activePresetKind)
    if (!preset) return
    const syncId = window.setTimeout(() => {
      setOpeningSeasonHeader(activeSeason.name)
      if (activePresetKind === "matchday") {
        setSelectedMatchdayId(initialMatchdayMatch?.id ?? "")
        setMatchdayDraft(defaultMatchdayDraft)
      }
      applyPresetData(activePresetKind, preset.data)
    }, 0)
    return () => window.clearTimeout(syncId)
    // The season id is the synchronization boundary; preset data is rebuilt for that season.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSeason.id])

  function loadPreset(kind: LeagueMediaKitKind, data: LeagueMediaKitImageData) {
    setActivePresetKind(kind)
    applyPresetData(kind, data)
    setWorkspaceView("preview")
    window.requestAnimationFrame(() => document.getElementById("media-kit-customizer")?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }

  function loadMatchdayMatch(matchId: string) {
    const match = sortedMatchdayMatches.find((item) => item.id === matchId)
    if (!match) return
    const roundMatches = sortedMatchdayMatches.filter((item) => item.round === match.round)
    setSelectedMatchdayId(match.id)
    setMatchdayDraft(createMatchdayDraft(match, players, activeLeague.locations, roundMatches))
  }

  function loadMatchdayRound(round: number) {
    const firstMatch = sortedMatchdayMatches.find((match) => match.round === round)
    if (firstMatch) loadMatchdayMatch(firstMatch.id)
  }

  function loadResultRound(round: number) {
    const roundMatches = sortedMatchdayMatches.filter((match) => match.round === round && match.status === "finished")
    setSelectedResultRound(round)
    setResultCards(ensureResultCardCount(roundMatches.map((match) => resultCardFromMatch(match, players))))
    setOpeningSubtitle(`Jornada ${round} · Marcadores oficiales`)
  }

  function updateMatchdayPlayer(team: "teamA" | "teamB", index: 0 | 1, value: string) {
    setMatchdayDraft((current) => {
      const names: [string, string] = [...current[team]]
      names[index] = value
      return { ...current, [team]: names }
    })
  }

  function updateResultPlayer(matchIndex: number, team: "teamA" | "teamB", playerIndex: 0 | 1, value: string) {
    setResultCards((current) => current.map((result, index) => {
      if (index !== matchIndex) return result
      const names: [string, string] = [...result[team]]
      names[playerIndex] = value
      return { ...result, [team]: names }
    }))
  }

  function updateResultSet(matchIndex: number, setIndex: number, team: "a" | "b", value: string) {
    const parsed = Math.max(0, Math.min(99, Number(value) || 0))
    setResultCards((current) => current.map((result, index) => {
      if (index !== matchIndex) return result
      const sets = result.sets.map((set, indexOfSet) => indexOfSet === setIndex ? { ...set, [team]: parsed } : set)
      return {
        ...result,
        sets,
        pointsA: sets.filter((set) => set.a > set.b).length,
        pointsB: sets.filter((set) => set.b > set.a).length,
      }
    }))
  }

  function addResultCard() {
    setResultCards((current) => current.length >= 4 ? current : [...current, emptyResultCard()])
  }

  function removeResultCard(index: number) {
    setResultCards((current) => current.length <= 2 ? current : current.filter((_, matchIndex) => matchIndex !== index))
  }

  function updateFormatRow(index: number, field: "label" | "value", value: string) {
    setFormatRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row))
  }

  function addFormatRow() {
    setFormatRows((current) => current.length >= 5 ? current : [...current, { label: "Nuevo bloque", value: "Añade aquí una explicación breve.", icon: null }])
    setOpenIconPickerIndex(null)
  }

  function removeFormatRow(index: number) {
    const minimumRows = isScoreboardPreset || isSpotlightPreset ? 1 : 3
    setFormatRows((current) => current.length <= minimumRows ? current : current.filter((_, rowIndex) => rowIndex !== index))
    setOpenIconPickerIndex(null)
  }

  function moveFormatRow(index: number, direction: -1 | 1) {
    setFormatRows((current) => {
      const target = index + direction
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setOpenIconPickerIndex(null)
  }

  function handleFormatRowIcon(index: number, file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== "string") return
      setFormatRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, icon: reader.result as string } : row))
      setOpenIconPickerIndex(null)
    }
    reader.readAsDataURL(file)
  }

  function selectFormatRowIcon(index: number, iconId: MediaKitIconId) {
    setFormatRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, icon: mediaKitIconToken(iconId) } : row))
    setOpenIconPickerIndex(null)
  }

  function removeFormatRowIcon(index: number) {
    setFormatRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, icon: null } : row))
    setOpenIconPickerIndex(null)
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

  function mediaKitFilename(kind: LeagueMediaKitKind, data: LeagueMediaKitImageData) {
    const matchdaySuffix = kind === "matchday" ? `-${slug(data.title)}-${slug(data.subtitle ?? "partido")}` : ""
    return `${slug(activeLeague.name)}-${slug(data.seasonName)}-${kind}${matchdaySuffix}.png`
  }

  async function sharePiece(kind: LeagueMediaKitKind, data: LeagueMediaKitImageData) {
    if (busy) return
    setBusy(kind)
    try {
      const liveCountdown = kind === "countdown" ? getSeasonCountdown(roundSettings.scheduledStartAt) : null
      const exportData = kind === "countdown" && liveCountdown ? { ...data, heroValue: liveCountdown.isDue ? "Arrancando" : `${liveCountdown.days}d ${String(liveCountdown.hours).padStart(2, "0")}h ${String(liveCountdown.minutes).padStart(2, "0")}m`, eventDateLabel: liveCountdown.isDue ? "ARRANCANDO" : `${liveCountdown.days} DÍAS`, eventTimeLabel: `${String(liveCountdown.hours).padStart(2, "0")}H`, venue: `${String(liveCountdown.minutes).padStart(2, "0")} MIN` } : data
      const blob = await createLeagueMediaKitImage(exportData)
      const filename = mediaKitFilename(kind, exportData)
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
      downloadLeagueMediaKitImage(blob, mediaKitFilename(kind, data))
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

  function handleSpotlightImage(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { if (typeof reader.result === "string") setSpotlightImageUrl(reader.result) }
    reader.readAsDataURL(file)
  }

  if (!canManage) return <div className="space-y-4"><BackButton fallbackHref="/" label="Volver" /><AppCard><p className="font-black">Acceso restringido</p></AppCard></div>

  return (
    <div className="space-y-3">
      <header className="app-page-header"><BackButton fallbackHref="/admin" label="Volver" /><h1 className="type-page-title">Centro de difusión</h1></header>
      {roundSettings.scheduledStartAt ? <SeasonStartCountdown scheduledStartAt={roundSettings.scheduledStartAt} compact /> : null}

      <AppCard className="overflow-hidden rounded-[28px] border-neutral-200 p-0 shadow-[0_20px_60px_rgba(15,23,42,.08)]">
        <section className="bg-neutral-950 px-4 pb-4 pt-3.5 text-white">
          <div className="mb-3 flex items-end justify-between gap-3"><div><p className="type-caption font-black uppercase tracking-[.2em] text-amber-300">Biblioteca</p><h2 className="mt-0.5 text-base font-black">Elige un preset</h2></div><span className="rounded-full border border-white/15 px-2.5 py-1 type-caption font-black uppercase tracking-wide text-neutral-300">{presets.length} presets</span></div>
          <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {presets.map(({ kind, data, disabled }) => {
              const isActive = activePresetKind === kind
              return <button key={kind} type="button" title={disabled ? "Configura fecha de inicio" : data.subtitle || titles[kind]} aria-pressed={isActive} disabled={Boolean(disabled || busy)} onClick={() => loadPreset(kind, data)} className={`min-h-[58px] min-w-[104px] snap-start rounded-2xl border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/5 disabled:text-neutral-600 ${isActive ? "border-amber-300 bg-amber-300 text-neutral-950 shadow-lg shadow-amber-300/10" : "border-white/10 bg-white/[.06] text-white"}`}><span className="block type-caption font-black uppercase tracking-[.16em] opacity-60">{disabled ? "Sin fecha" : kind === "format" || kind === "rules" || kind === "gameplay" ? "Informativo" : "Preset"}</span><span className="mt-1 block text-xs font-black">{compactPresetTitles[kind]}</span></button>
            })}
          </div>
        </section>

        <div id="media-kit-customizer" className="scroll-mt-4 bg-white p-3">
          <div role="tablist" aria-label="Modo de trabajo" className="grid grid-cols-2 gap-1 rounded-2xl bg-neutral-100 p-1">
            <button type="button" role="tab" aria-selected={workspaceView === "preview"} onClick={() => setWorkspaceView("preview")} className={`min-h-10 rounded-xl px-3 text-xs font-black transition ${workspaceView === "preview" ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500"}`}>Vista previa</button>
            <button type="button" role="tab" aria-selected={workspaceView === "customize"} onClick={() => setWorkspaceView("customize")} className={`min-h-10 rounded-xl px-3 text-xs font-black transition ${workspaceView === "customize" ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500"}`}>Personalizar</button>
          </div>

          {workspaceView === "preview" ? (
            <section role="tabpanel" aria-label="Vista previa" className="mt-3 overflow-hidden rounded-[24px] bg-neutral-950 p-3 text-white">
              <div className="mb-3 flex items-center justify-between gap-3"><div><p className="type-caption font-black uppercase tracking-[.18em] text-amber-300">Composición activa</p><h3 className="mt-0.5 text-sm font-black">{titles[activePresetKind]}</h3></div><span className="rounded-full bg-white/10 px-2.5 py-1 type-caption font-black text-neutral-300">4:5 · PNG</span></div>
              <div className="mx-auto w-full max-w-[326px]"><MediaKitPosterPreview data={openingData} /></div>
              <div className="mx-auto mt-3 grid w-full max-w-[326px] grid-cols-[1fr_auto] gap-2">
                <button type="button" disabled={Boolean(busy)} onClick={() => void sharePiece(activePresetKind, openingData)} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-center text-xs font-black text-neutral-950 disabled:bg-neutral-500">{busy === activePresetKind ? "Generando…" : "Compartir imagen"}</button>
                <button type="button" aria-label="Descargar PNG" disabled={Boolean(busy)} onClick={() => void downloadPiece(activePresetKind, openingData)} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-4 text-center text-xs font-black text-white disabled:text-neutral-500">PNG</button>
              </div>
              <button type="button" onClick={() => setWorkspaceView("customize")} className="mx-auto mt-2 block type-caption font-black text-neutral-400 underline decoration-neutral-700 underline-offset-4">Personalizar esta pieza</button>
            </section>
          ) : (
            <section role="tabpanel" aria-label="Personalización" className="mt-3 space-y-3">
              <div className="flex items-start justify-between gap-3 px-1"><div><p className="type-caption font-black uppercase tracking-[.18em] text-neutral-400">Contenido</p><h3 className="mt-0.5 text-base font-black text-neutral-950">Edita la pieza</h3></div><span className="rounded-full bg-neutral-950 px-2.5 py-1 type-caption font-black uppercase text-white">{compactPresetTitles[activePresetKind]}</span></div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block type-caption font-black text-neutral-700">Temporada origen<select aria-label="Temporada para los datos del cartel" value={activeSeason.id} onChange={(event) => setSelectedMediaKitSeasonId(event.target.value)} className={fieldClass}>{leagueSeasons.map((season) => <option key={season.id} value={season.id}>{season.name}{season.id === activeLeague.activeSeasonId ? " · Activa" : ""}</option>)}</select></label>
                  <label className="block type-caption font-black text-neutral-700">Cabecera de temporada<input className={fieldClass} value={openingSeasonHeader} onChange={(event) => setOpeningSeasonHeader(event.target.value)} maxLength={28} placeholder="TEMPORADA 2" /></label>
                </div>
                <p className="mt-1.5 type-caption font-semibold text-neutral-500">La temporada origen recarga los datos reales. La cabecera superior puede retocarse sin cambiarla.</p>
              </div>

              {isResultsPreset ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                    <p className="type-caption font-black uppercase tracking-[.14em] text-amber-800">Cargar jornada</p>
                    <label className="mt-2 block type-caption font-black text-neutral-700">Jornada completa<select aria-label="Jornada de resultados" value={selectedResultRound} disabled={completedResultRoundNumbers.length === 0} onChange={(event) => loadResultRound(Number(event.target.value))} className={fieldClass}>{completedResultRoundNumbers.length > 0 ? completedResultRoundNumbers.map((round) => <option key={round} value={round}>Jornada {round}{round === latestCompletedRound ? " · Última completa" : ""}</option>) : <option value={1}>Sin jornadas completas</option>}</select></label>
                    <p className="mt-2 type-caption font-semibold leading-4 text-amber-900/70">Al cambiar de jornada se precargan sus parejas, juegos y sets. Después puedes editar cualquier dato para esta imagen.</p>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                    <div className="space-y-3">
                      <label className="block type-caption font-black text-neutral-700">Titular<input className={fieldClass} value={openingTitle} onChange={(event) => setOpeningTitle(event.target.value)} maxLength={48} /></label>
                      <label className="block type-caption font-black text-neutral-700">Jornada y descripción<input className={fieldClass} value={openingSubtitle} onChange={(event) => setOpeningSubtitle(event.target.value)} maxLength={80} /></label>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 p-3">
                    <div className="flex items-center justify-between gap-3"><div><p className="type-caption font-black text-neutral-800">Resultados</p><p className="mt-0.5 type-caption font-semibold text-neutral-500">Entre 2 y 4 partidos · {resultCards.length} activos</p></div><button type="button" disabled={resultCards.length >= 4} onClick={addResultCard} className="inline-flex items-center justify-center rounded-xl bg-neutral-950 px-3 py-2 text-center type-caption font-black text-white disabled:bg-neutral-200 disabled:text-neutral-400">+ Partido</button></div>
                    <div className="mt-3 space-y-3">
                      {resultCards.map((result, matchIndex) => (
                        <div key={matchIndex} className="rounded-xl bg-neutral-50 p-2.5">
                          <div className="flex items-center justify-between gap-2"><p className="type-caption font-black uppercase tracking-[.12em] text-neutral-500">Partido {matchIndex + 1}</p><button type="button" disabled={resultCards.length <= 2} onClick={() => removeResultCard(matchIndex)} className="inline-flex items-center justify-center rounded-lg border border-red-100 bg-white px-2 py-1 text-center type-caption font-black text-red-600 disabled:text-neutral-300">Eliminar</button></div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <input aria-label={`Primer jugador de la pareja 1 del partido ${matchIndex + 1}`} value={result.teamA[0]} onChange={(event) => updateResultPlayer(matchIndex, "teamA", 0, event.target.value)} maxLength={30} className="h-9 rounded-lg border border-neutral-200 bg-white px-2.5 type-caption font-black text-neutral-900 outline-none focus:border-neutral-950" />
                            <input aria-label={`Segundo jugador de la pareja 1 del partido ${matchIndex + 1}`} value={result.teamA[1]} onChange={(event) => updateResultPlayer(matchIndex, "teamA", 1, event.target.value)} maxLength={30} className="h-9 rounded-lg border border-neutral-200 bg-white px-2.5 type-caption font-black text-neutral-900 outline-none focus:border-neutral-950" />
                            <input aria-label={`Primer jugador de la pareja 2 del partido ${matchIndex + 1}`} value={result.teamB[0]} onChange={(event) => updateResultPlayer(matchIndex, "teamB", 0, event.target.value)} maxLength={30} className="h-9 rounded-lg border border-neutral-200 bg-white px-2.5 type-caption font-black text-neutral-900 outline-none focus:border-neutral-950" />
                            <input aria-label={`Segundo jugador de la pareja 2 del partido ${matchIndex + 1}`} value={result.teamB[1]} onChange={(event) => updateResultPlayer(matchIndex, "teamB", 1, event.target.value)} maxLength={30} className="h-9 rounded-lg border border-neutral-200 bg-white px-2.5 type-caption font-black text-neutral-900 outline-none focus:border-neutral-950" />
                          </div>
                          <div className="mt-2 overflow-hidden rounded-lg border border-neutral-200 bg-white">
                            <div className="grid items-center gap-1 bg-neutral-100 px-2 py-1.5 text-center type-caption font-black uppercase text-neutral-500" style={{ gridTemplateColumns: `minmax(54px,1fr) repeat(${result.sets.length},36px) 42px` }}><span className="text-left">Pareja</span>{result.sets.map((_, setIndex) => <span key={setIndex}>S{setIndex + 1}</span>)}<span>Sets</span></div>
                            {(["a", "b"] as const).map((team) => <div key={team} className="grid items-center gap-1 border-t border-neutral-100 px-2 py-1.5" style={{ gridTemplateColumns: `minmax(54px,1fr) repeat(${result.sets.length},36px) 42px` }}><span className="type-caption font-black text-neutral-700">Pareja {team === "a" ? "1" : "2"}</span>{result.sets.map((set, setIndex) => <input key={setIndex} aria-label={`Juegos set ${setIndex + 1} pareja ${team === "a" ? "1" : "2"} partido ${matchIndex + 1}`} type="number" min={0} max={99} value={set[team]} onChange={(event) => updateResultSet(matchIndex, setIndex, team, event.target.value)} className="h-8 w-9 rounded-md border border-neutral-200 text-center text-xs font-black text-neutral-900 outline-none focus:border-neutral-950" />)}<span className="text-center text-base font-black text-neutral-950">{team === "a" ? result.pointsA : result.pointsB}</span></div>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : isInformationalPreset ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                    <div className="space-y-3">
                      <label className="block type-caption font-black text-neutral-700">Título informativo<input className={fieldClass} value={openingTitle} onChange={(event) => setOpeningTitle(event.target.value)} maxLength={48} /></label>
                      <label className="block type-caption font-black text-neutral-700">Introducción<textarea className="mt-1 min-h-20 w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs font-bold text-neutral-950 outline-none focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10" value={openingSubtitle} onChange={(event) => setOpeningSubtitle(event.target.value)} maxLength={150} /></label>
                      <label className="block type-caption font-black text-neutral-700">{isSpotlightPreset ? "Nombre protagonista" : isScoreboardPreset ? "Pie destacado" : "Frase de cierre"}<input className={fieldClass} value={formatClosing} onChange={(event) => setFormatClosing(event.target.value)} maxLength={80} /></label>
                    </div>
                  </div>

                  {isSpotlightPreset ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-3">
                      <div><p className="type-caption font-black text-neutral-800">Imagen protagonista</p><p className="mt-0.5 type-caption font-semibold text-neutral-500">Foto del MVP o campeón para esta pieza.</p></div>
                      <div className="flex gap-2"><label className="cursor-pointer rounded-xl bg-neutral-100 px-3 py-2 type-caption font-black text-neutral-800">Cambiar<input className="sr-only" type="file" accept="image/*" onChange={(event) => handleSpotlightImage(event.target.files?.[0])} /></label>{spotlightImageUrl ? <button type="button" onClick={() => setSpotlightImageUrl(null)} className="inline-flex items-center justify-center rounded-xl border border-neutral-200 px-3 py-2 text-center type-caption font-black text-neutral-700">Quitar</button> : null}</div>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-neutral-200 p-3">
                    <div className="flex items-center justify-between gap-3"><div><p className="type-caption font-black text-neutral-800">{isScoreboardPreset ? "Filas de datos" : isSpotlightPreset ? "Datos destacados" : "Filas informativas"}</p><p className="mt-0.5 type-caption font-semibold text-neutral-500">{isScoreboardPreset || isSpotlightPreset ? "Hasta 5 bloques" : "Entre 3 y 5 bloques"} · {formatRows.length} activos</p></div><button type="button" disabled={formatRows.length >= 5} onClick={addFormatRow} className="inline-flex items-center justify-center rounded-xl bg-neutral-950 px-3 py-2 text-center type-caption font-black text-white disabled:bg-neutral-200 disabled:text-neutral-400">+ Añadir</button></div>
                    <div className="mt-3 space-y-2.5">
                      {formatRows.map((row, index) => (
                        <div key={index} className="rounded-xl bg-neutral-50 p-2.5">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            {isScoreboardPreset || isSpotlightPreset ? <span className="type-caption font-black uppercase tracking-wide text-neutral-400">Fila {index + 1}</span> : <div className="flex min-w-0 items-center gap-1.5">
                              {row.icon ? <Image unoptimized src={mediaKitIconDataUrl(row.icon, openingAccent) ?? row.icon} width={28} height={28} alt="" className="h-7 w-7 rounded-lg object-contain" /> : <span className="type-caption font-black uppercase tracking-wide text-neutral-400">Fila</span>}
                              <button type="button" aria-expanded={openIconPickerIndex === index} onClick={() => setOpenIconPickerIndex((current) => current === index ? null : index)} className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-center type-caption font-black text-neutral-700">{row.icon ? "Cambiar icono" : "+ Icono"}</button>
                              {row.icon ? <button type="button" onClick={() => removeFormatRowIcon(index)} className="type-caption font-black text-neutral-400">Quitar</button> : null}
                            </div>}
                            <div className="flex shrink-0 gap-1"><button type="button" aria-label={`Subir fila ${index + 1}`} disabled={index === 0} onClick={() => moveFormatRow(index, -1)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-center text-xs font-black text-neutral-700 disabled:text-neutral-300">↑</button><button type="button" aria-label={`Bajar fila ${index + 1}`} disabled={index === formatRows.length - 1} onClick={() => moveFormatRow(index, 1)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-center text-xs font-black text-neutral-700 disabled:text-neutral-300">↓</button><button type="button" aria-label={`Eliminar fila ${index + 1}`} disabled={formatRows.length <= (isScoreboardPreset || isSpotlightPreset ? 1 : 3)} onClick={() => removeFormatRow(index)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 bg-white text-center text-xs font-black text-red-600 disabled:text-neutral-300">×</button></div>
                          </div>
                          {!isScoreboardPreset && !isSpotlightPreset && openIconPickerIndex === index ? (
                            <div className="mb-2.5 rounded-xl border border-neutral-200 bg-white p-2.5 shadow-sm">
                              <div className="flex items-center justify-between gap-2"><p className="type-caption font-black text-neutral-800">Elige un icono SVG</p><button type="button" onClick={() => setOpenIconPickerIndex(null)} className="type-caption font-black text-neutral-400">Cerrar</button></div>
                              <div className="mt-2 grid grid-cols-5 gap-1.5 sm:grid-cols-8">
                                {MEDIA_KIT_ICON_OPTIONS.map((option) => {
                                  const selected = getMediaKitIconId(row.icon) === option.id
                                  const iconUrl = mediaKitIconDataUrl(option.id, openingAccent)
                                  return <button key={option.id} type="button" title={option.label} aria-label={`Usar icono ${option.label}`} aria-pressed={selected} onClick={() => selectFormatRowIcon(index, option.id)} className={`grid aspect-square place-items-center rounded-lg border p-1.5 transition ${selected ? "border-neutral-950 bg-neutral-950" : "border-neutral-200 bg-neutral-50 hover:border-neutral-400"}`}>{iconUrl ? <Image unoptimized src={iconUrl} width={24} height={24} alt="" className="h-6 w-6" /> : null}</button>
                                })}
                              </div>
                              <label className="mt-2.5 flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-3 type-caption font-black text-neutral-700">Subir imagen personalizada<input className="sr-only" type="file" accept="image/*" onChange={(event) => handleFormatRowIcon(index, event.target.files?.[0])} /></label>
                            </div>
                          ) : null}
                          <input aria-label={`Título de la fila ${index + 1}`} value={row.label} onChange={(event) => updateFormatRow(index, "label", event.target.value)} maxLength={36} className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-2.5 type-caption font-black text-neutral-900 outline-none focus:border-neutral-950" />
                          <textarea aria-label={`Descripción de la fila ${index + 1}`} value={row.value} onChange={(event) => updateFormatRow(index, "value", event.target.value)} maxLength={140} className="mt-2 min-h-16 w-full resize-none rounded-lg border border-neutral-200 bg-white px-2.5 py-2 type-caption font-semibold leading-4 text-neutral-700 outline-none focus:border-neutral-950" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : activePresetKind === "matchday" ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                    <p className="type-caption font-black uppercase tracking-[.14em] text-amber-800">Cargar partido</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <label className="type-caption font-black text-neutral-700">Jornada<select aria-label="Jornada del cartel" value={matchdayDraft.round} onChange={(event) => loadMatchdayRound(Number(event.target.value))} className={fieldClass}>{matchdayRoundNumbers.map((round) => <option key={round} value={round}>Jornada {round}</option>)}</select></label>
                      <label className="type-caption font-black text-neutral-700">Partido<select aria-label="Partido del cartel" value={selectedMatchdayId} onChange={(event) => loadMatchdayMatch(event.target.value)} className={fieldClass}>{selectedRoundMatches.map((match, index) => <option key={match.id} value={match.id}>Partido {index + 1}</option>)}</select></label>
                    </div>
                    <p className="mt-2 type-caption font-semibold leading-4 text-amber-900/70">Al elegir un partido se cargan sus jugadores, fecha, hora y sede. Después puedes retocarlos para esta imagen.</p>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="type-caption font-black text-neutral-700">Texto de jornada<input className={fieldClass} value={matchdayDraft.roundLabel} onChange={(event) => setMatchdayDraft((current) => ({ ...current, roundLabel: event.target.value }))} maxLength={24} /></label>
                      <label className="type-caption font-black text-neutral-700">Etiqueta de partido<input className={fieldClass} value={matchdayDraft.matchLabel} onChange={(event) => setMatchdayDraft((current) => ({ ...current, matchLabel: event.target.value }))} maxLength={20} /></label>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-neutral-200 p-3">
                      <p className="type-caption font-black uppercase tracking-[.12em] text-neutral-500">Pareja 1</p>
                      <input aria-label="Primer jugador de la pareja 1" className={fieldClass} value={matchdayDraft.teamA[0]} onChange={(event) => updateMatchdayPlayer("teamA", 0, event.target.value)} maxLength={32} />
                      <input aria-label="Segundo jugador de la pareja 1" className={fieldClass} value={matchdayDraft.teamA[1]} onChange={(event) => updateMatchdayPlayer("teamA", 1, event.target.value)} maxLength={32} />
                    </div>
                    <div className="rounded-2xl border border-neutral-200 p-3">
                      <p className="type-caption font-black uppercase tracking-[.12em] text-neutral-500">Pareja 2</p>
                      <input aria-label="Primer jugador de la pareja 2" className={fieldClass} value={matchdayDraft.teamB[0]} onChange={(event) => updateMatchdayPlayer("teamB", 0, event.target.value)} maxLength={32} />
                      <input aria-label="Segundo jugador de la pareja 2" className={fieldClass} value={matchdayDraft.teamB[1]} onChange={(event) => updateMatchdayPlayer("teamB", 1, event.target.value)} maxLength={32} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="type-caption font-black text-neutral-700">Fecha<input className={fieldClass} value={matchdayDraft.date} onChange={(event) => setMatchdayDraft((current) => ({ ...current, date: event.target.value }))} maxLength={36} /></label>
                      <label className="type-caption font-black text-neutral-700">Hora<input className={fieldClass} value={matchdayDraft.time} onChange={(event) => setMatchdayDraft((current) => ({ ...current, time: event.target.value }))} maxLength={12} /></label>
                      <label className="col-span-2 type-caption font-black text-neutral-700">Sede<input className={fieldClass} value={matchdayDraft.venue} onChange={(event) => setMatchdayDraft((current) => ({ ...current, venue: event.target.value }))} maxLength={42} /></label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="col-span-2 type-caption font-black text-neutral-700">Titular principal<input className={fieldClass} value={openingTitle} onChange={(event) => setOpeningTitle(event.target.value)} maxLength={34} /></label>
                    <label className="col-span-2 type-caption font-black text-neutral-700">Subtítulo<input className={fieldClass} value={openingSubtitle} onChange={(event) => setOpeningSubtitle(event.target.value)} maxLength={44} placeholder="Opcional" /></label>
                    <label className="type-caption font-black text-neutral-700">Bloque destacado<input className={fieldClass} value={openingDate} onChange={(event) => setOpeningDate(event.target.value)} maxLength={28} /></label>
                    <label className="type-caption font-black text-neutral-700">Dato central<input className={fieldClass} value={openingTime} onChange={(event) => setOpeningTime(event.target.value)} maxLength={12} /></label>
                    <label className="type-caption font-black text-neutral-700">Etiqueta izquierda<input className={fieldClass} value={openingRound} onChange={(event) => setOpeningRound(event.target.value)} maxLength={22} /></label>
                    <label className="type-caption font-black text-neutral-700">Etiqueta derecha<input className={fieldClass} value={openingVenue} onChange={(event) => setOpeningVenue(event.target.value)} maxLength={24} /></label>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-neutral-200 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="type-caption font-black text-neutral-700">Tipografía del titular<select aria-label="Diseño del titular" value={openingHeadlineFont} onChange={(event) => setOpeningHeadlineFont(event.target.value as LeagueMediaKitHeadlineFont)} className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-black text-neutral-900 outline-none focus:border-neutral-950">{openingHeadlineFontOptions.map((option) => <option key={option.id} value={option.id}>{option.label} · {option.detail}</option>)}</select></label>
                  <div><p className="type-caption font-black text-neutral-700">Color de acento</p><div className="mt-2 flex flex-wrap items-center gap-2">{openingAccentOptions.map((color) => <button key={color} type="button" aria-label={`Usar color ${color}`} onClick={() => selectPresetAccent(color)} className={`h-8 w-8 rounded-full border-2 ${!showCustomAccent && openingAccent === color ? "border-neutral-950 ring-2 ring-neutral-200" : "border-white shadow-sm"}`} style={{ backgroundColor: color }} />)}<button type="button" aria-label="Color personalizado" aria-expanded={showCustomAccent} onClick={() => { setShowCustomAccent((current) => !current); setCustomAccentDraft(openingAccent) }} className={`min-h-8 rounded-full border px-3 type-caption font-black ${showCustomAccent ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-neutral-50 text-neutral-700"}`}>+ Propio</button></div></div>
                </div>
                {showCustomAccent ? <div className="mt-3 grid grid-cols-[48px_1fr] gap-2 rounded-xl bg-neutral-50 p-2"><input aria-label="Selector de color personalizado" type="color" value={openingAccent} onChange={(event) => { setOpeningAccent(event.target.value); setCustomAccentDraft(event.target.value) }} className="h-10 w-12 cursor-pointer rounded-lg border border-neutral-200 bg-white p-1" /><input aria-label="Código hexadecimal personalizado" value={customAccentDraft} onChange={(event) => updateCustomAccent(event.target.value)} maxLength={7} placeholder="#D7A544" className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-black uppercase text-neutral-900 outline-none focus:border-neutral-950" /></div> : null}
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-neutral-200 pt-3"><div><p className="type-caption font-black text-neutral-800">Logo de la liga</p><p className="mt-0.5 type-caption font-semibold text-neutral-500">Cambio temporal para esta imagen.</p></div><div className="flex gap-2"><label className="cursor-pointer rounded-xl bg-neutral-100 px-3 py-2 type-caption font-black text-neutral-800">Cambiar<input className="sr-only" type="file" accept="image/*" onChange={(event) => handleLogoOverride(event.target.files?.[0])} /></label>{openingLogoOverride ? <button type="button" onClick={() => setOpeningLogoOverride(null)} className="inline-flex items-center justify-center rounded-xl border border-neutral-200 px-3 py-2 text-center type-caption font-black text-neutral-700">Restaurar</button> : null}</div></div>
              </div>

              <button type="button" onClick={() => setWorkspaceView("preview")} className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-neutral-950 px-4 text-center text-xs font-black text-white">Ver vista previa</button>
            </section>
          )}
        </div>
      </AppCard>

    </div>
  )
}
