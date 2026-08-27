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
import { extractLogoAccentPalette } from "@/lib/logoAccentPalette"
import { buildMediaKitWelcomeLetter } from "@/lib/mediaKitWelcomeLetter"
import {
  createLeagueMediaKitImage,
  downloadLeagueMediaKitImage,
  WELCOME_LETTER_FONT_OPTIONS,
  WELCOME_LOGO_STYLE_OPTIONS,
  WELCOME_SIGNATURE_FONT_OPTIONS,
  type LeagueMediaKitImageData,
  type LeagueMediaKitHeadlineFont,
  type LeagueMediaKitKind,
  type LeagueMediaKitWelcomeLetterFont,
  type LeagueMediaKitWelcomeLogoStyle,
  type LeagueMediaKitWelcomeSignatureFont,
} from "@/lib/leagueMediaKitImage"
import { useI18n } from "@/i18n/I18nProvider"
import { getIntlLocale, translateLeagueText } from "@/i18n/leagueText"
import type { Locale } from "@/i18n/translations"

const titles: Record<LeagueMediaKitKind, string> = {
  welcome: "Carta de bienvenida",
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
  welcome: "Bienvenida",
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

const presetOrder: LeagueMediaKitKind[] = [
  "welcome",
  "format",
  "rules",
  "gameplay",
  "registration",
  "start",
  "countdown",
  "opening",
  "calendar",
  "next_round",
  "matchday",
  "results",
  "standings",
  "mvp",
  "season_final",
]

const openingAccentOptions = ["#d7a544", "#53B401", "#bb9448", "#d4643c", "#3d9d86", "#477bd1", "#8b5fc0"]
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

function openingDateLabels(value: string | null | undefined, locale: Locale = "es") {
  if (!value) return { date: translateLeagueText(locale, "26 DE SEPTIEMBRE"), time: "10:00" }
  const instant = new Date(value)
  if (Number.isNaN(instant.getTime())) return { date: translateLeagueText(locale, "26 DE SEPTIEMBRE"), time: "10:00" }
  return {
    date: new Intl.DateTimeFormat(getIntlLocale(locale), { day: "numeric", month: "long", timeZone: SCHEDULED_SEASON_TIME_ZONE }).format(instant).toLocaleUpperCase(getIntlLocale(locale)),
    time: new Intl.DateTimeFormat(getIntlLocale(locale), { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: SCHEDULED_SEASON_TIME_ZONE }).format(instant),
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

function matchdayDateLabels(value: string | null | undefined, locale: Locale = "es") {
  if (!value) return { date: translateLeagueText(locale, "FECHA POR CONFIRMAR"), time: "--:--" }
  const instant = new Date(value)
  if (Number.isNaN(instant.getTime())) return { date: translateLeagueText(locale, "FECHA POR CONFIRMAR"), time: "--:--" }
  return {
    date: new Intl.DateTimeFormat(getIntlLocale(locale), { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: SCHEDULED_SEASON_TIME_ZONE }).format(instant).toLocaleUpperCase(getIntlLocale(locale)),
    time: new Intl.DateTimeFormat(getIntlLocale(locale), { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: SCHEDULED_SEASON_TIME_ZONE }).format(instant),
  }
}

function playerDisplayName(players: PlayerProfile[], playerId: string | undefined, locale: Locale = "es") {
  if (!playerId) return translateLeagueText(locale, "Jugador por confirmar")
  return players.find((player) => player.id === playerId)?.displayName ?? playerId
}

type ResultCard = NonNullable<LeagueMediaKitImageData["results"]>[number]

function emptyResultCard(locale: Locale = "es"): ResultCard {
  return {
    teamA: [translateLeagueText(locale, "Jugador 1"), translateLeagueText(locale, "Jugador 2")],
    teamB: [translateLeagueText(locale, "Jugador 3"), translateLeagueText(locale, "Jugador 4")],
    pointsA: 0,
    pointsB: 0,
    sets: [{ a: 0, b: 0 }, { a: 0, b: 0 }, { a: 0, b: 0 }],
  }
}

function resultCardFromMatch(match: Match, players: PlayerProfile[], locale: Locale = "es"): ResultCard {
  const sets = match.sets.slice(0, 3)
  return {
    teamA: [playerDisplayName(players, match.teamA[0], locale), playerDisplayName(players, match.teamA[1], locale)],
    teamB: [playerDisplayName(players, match.teamB[0], locale), playerDisplayName(players, match.teamB[1], locale)],
    pointsA: match.pointsA ?? sets.filter((set) => set.a > set.b).length,
    pointsB: match.pointsB ?? sets.filter((set) => set.b > set.a).length,
    sets: sets.length > 0 ? sets : emptyResultCard(locale).sets,
  }
}

function ensureResultCardCount(cards: ResultCard[], locale: Locale = "es") {
  const next = cards.slice(0, 4)
  while (next.length < 2) next.push(emptyResultCard(locale))
  return next
}

function mediaKitLocationLabel(value: string | null | undefined, locations: LeagueLocation[], separator = " · ") {
  const location = findLeagueLocationByScheduleLocation({ locations, scheduleLocation: value })
  if (!location) return getScheduleLocationFallbackText(value)
  const town = location.town?.trim()
  const name = location.name.trim()
  if (town && town.toLowerCase() !== name.toLowerCase()) return `${town}${separator}${name}`
  return name || town || getScheduleLocationFallbackText(value)
}

function createMatchdayDraft(match: Match | undefined, players: PlayerProfile[], locations: LeagueLocation[], roundMatches: Match[] = [], locale: Locale = "es"): MatchdayDraft {
  const labels = matchdayDateLabels(match?.scheduledAt, locale)
  const matchIndex = match ? Math.max(0, roundMatches.findIndex((item) => item.id === match.id)) : 0
  return {
    round: match?.round ?? 1,
    roundLabel: `Jornada ${match?.round ?? 1}`,
    matchLabel: `Partido ${matchIndex + 1}`,
    date: labels.date,
    time: labels.time,
    venue: mediaKitLocationLabel(match?.location, locations) ?? translateLeagueText(locale, "Lugar por confirmar"),
    teamA: [playerDisplayName(players, match?.teamA[0], locale), playerDisplayName(players, match?.teamA[1], locale)],
    teamB: [playerDisplayName(players, match?.teamB[0], locale), playerDisplayName(players, match?.teamB[1], locale)],
  }
}

function MediaKitPosterPreview({ data }: { data: LeagueMediaKitImageData }) {
  const { tx } = useI18n()

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
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 type-caption font-black uppercase tracking-[.18em] text-neutral-400"><span>{tx("Vista previa")}</span><span>1080 × 1350</span></div>
      <div className="relative aspect-[4/5] bg-[radial-gradient(circle_at_50%_30%,#28231a,#050505_62%)]">
        {previewUrl ? <Image unoptimized src={previewUrl} width={1080} height={1350} alt={tx("Vista previa del cartel activo")} className="h-full w-full object-cover" /> : null}
        {!previewUrl && !previewError ? <div className="absolute inset-0 grid place-items-center text-xs font-black uppercase tracking-[.2em] text-neutral-500">{tx("Componiendo cartel…")}</div> : null}
        {previewError ? <div className="absolute inset-0 grid place-items-center px-6 text-center text-xs font-bold text-red-200">{tx("No se ha podido construir la vista previa.")}</div> : null}
      </div>
    </div>
  )
}

export default function MediaKitPage() {
  const { tx, locale } = useI18n()
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
  const openingSubtitleDefault = tx(`Un día, ${openingMatchCount} ${openingMatchCount === 1 ? "partido" : "partidos"}, el mejor comienzo`)
  const initialOpeningLabels = openingDateLabels(firstOpeningMatch?.scheduledAt ?? roundSettings.scheduledStartAt, locale)
  const initialOpeningVenue = mediaKitLocationLabel(firstOpeningMatch?.location, activeLeague.locations, " ") ?? tx("Lugar por confirmar")
  const sortedMatchdayMatches = useMemo(() => [...matches].sort((a, b) => a.round - b.round || (a.scheduledAt ?? "9999").localeCompare(b.scheduledAt ?? "9999") || a.id.localeCompare(b.id)), [matches])
  const preferredMatchdayRound = rounds.find((round) => round.status === "active")?.round
  const initialMatchdayMatch = sortedMatchdayMatches.find((match) => match.round === preferredMatchdayRound) ?? sortedMatchdayMatches.find((match) => match.status !== "finished") ?? sortedMatchdayMatches[0]
  const initialMatchdayRoundMatches = sortedMatchdayMatches.filter((match) => match.round === initialMatchdayMatch?.round)
  const defaultMatchdayDraft = createMatchdayDraft(initialMatchdayMatch, players, activeLeague.locations, initialMatchdayRoundMatches, locale)
  const [openingSeasonHeader, setOpeningSeasonHeader] = useState(activeSeason.name)
  const [openingTitle, setOpeningTitle] = useState(() => tx("Jornada de apertura"))
  const [openingSubtitle, setOpeningSubtitle] = useState(openingSubtitleDefault)
  const [openingDate, setOpeningDate] = useState(initialOpeningLabels.date)
  const [openingTime, setOpeningTime] = useState(initialOpeningLabels.time)
  const [openingVenue, setOpeningVenue] = useState(initialOpeningVenue)
  const [openingRound, setOpeningRound] = useState(() => tx("Jornada 1"))
  const [openingAccent, setOpeningAccent] = useState("#d7a544")
  const [customAccentDraft, setCustomAccentDraft] = useState("#d7a544")
  const [showCustomAccent, setShowCustomAccent] = useState(false)
  const [openingHeadlineFont, setOpeningHeadlineFont] = useState<LeagueMediaKitHeadlineFont>("editorial")
  const [welcomeLetterFont, setWelcomeLetterFont] = useState<LeagueMediaKitWelcomeLetterFont>("club_classic")
  const [welcomeLogoStyle, setWelcomeLogoStyle] = useState<LeagueMediaKitWelcomeLogoStyle>("clean_stamp")
  const [welcomeSignatureFont, setWelcomeSignatureFont] = useState<LeagueMediaKitWelcomeSignatureFont>("allura")
  const [welcomeRecipientName, setWelcomeRecipientName] = useState("")
  const [welcomeRecipientGender, setWelcomeRecipientGender] = useState<"masculine" | "feminine">("masculine")
  const [openingLogoOverride, setOpeningLogoOverride] = useState<string | null>(null)
  const [logoAccentResult, setLogoAccentResult] = useState<{ source: string; colors: string[]; failed: boolean } | null>(null)
  const [spotlightImageUrl, setSpotlightImageUrl] = useState<string | null>(null)
  const [formatRows, setFormatRows] = useState<LeagueMediaKitImageData["rows"]>(() => [
    { label: tx("Clasificación individual"), value: tx("Cada jugador compite por su propia posición y suma sus resultados jornada a jornada."), icon: mediaKitIconToken("chart") },
    { label: tx("Parejas diferentes"), value: tx("El calendario busca que compartas pista con una pareja distinta en cada jornada."), icon: mediaKitIconToken("users") },
    { label: tx("Rivales equilibrados"), value: tx("Las repeticiones de rivales se reducen al mínimo posible durante la temporada."), icon: mediaKitIconToken("bolt") },
    { label: tx("Calendario automático"), value: tx("Smash & Lob organiza las combinaciones para que solo tengas que jugar y competir."), icon: mediaKitIconToken("calendar") },
  ])
  const [openIconPickerIndex, setOpenIconPickerIndex] = useState<number | null>(null)
  const [formatClosing, setFormatClosing] = useState(() => tx("Una liga. Nuevas parejas. Un ranking individual."))
  const [selectedMatchdayId, setSelectedMatchdayId] = useState(initialMatchdayMatch?.id ?? "")
  const [matchdayDraft, setMatchdayDraft] = useState<MatchdayDraft>(() => defaultMatchdayDraft)
  const [activePresetKind, setActivePresetKind] = useState<LeagueMediaKitKind>("opening")
  const [workspaceView, setWorkspaceView] = useState<"preview" | "customize">("preview")
  const hasCalendarByes = useMemo(() => {
    if (players.length === 0) return false
    const roundsWithMatches = [...new Set(matches.map((match) => match.round))]
    if (roundsWithMatches.length === 0) return players.length % 4 !== 0
    return roundsWithMatches.some((round) => {
      const participants = new Set(
        matches
          .filter((match) => match.round === round)
          .flatMap((match) => [...match.teamA, ...match.teamB])
          .filter(Boolean),
      )
      return participants.size < players.length
    })
  }, [matches, players.length])
  const welcomeInputBase = useMemo(() => ({
    locale,
    leagueName: activeLeague.name,
    seasonName: activeSeason.name,
    playerCount: players.length,
    totalRounds: activeSeason.totalRounds,
    hasByes: hasCalendarByes,
    registrationFee: roundSettings.registrationFee,
    scheduledStartAt: roundSettings.scheduledStartAt,
    openingRoundEnabled: roundSettings.openingRoundEnabled,
    openingRoundAt: roundSettings.openingRoundAt,
    openingRoundLocation: mediaKitLocationLabel(roundSettings.openingRoundLocation, activeLeague.locations, " · "),
  }), [activeLeague.locations, activeLeague.name, activeSeason.name, activeSeason.totalRounds, hasCalendarByes, locale, players.length, roundSettings.openingRoundAt, roundSettings.openingRoundEnabled, roundSettings.openingRoundLocation, roundSettings.registrationFee, roundSettings.scheduledStartAt])
  const welcomeDefaults = useMemo(() => buildMediaKitWelcomeLetter({
    ...welcomeInputBase,
    recipientName: welcomeRecipientName,
    recipientGender: welcomeRecipientGender,
  }), [welcomeInputBase, welcomeRecipientGender, welcomeRecipientName])
  const [welcomeBody, setWelcomeBody] = useState(() => welcomeDefaults.bodyText)
  const [welcomeSignoff, setWelcomeSignoff] = useState(() => welcomeDefaults.signoff)
  const [welcomeSignature, setWelcomeSignature] = useState(() => welcomeDefaults.signature)
  const applyWelcomeAutomaticText = (recipientName = welcomeRecipientName, recipientGender = welcomeRecipientGender) => {
    const letter = buildMediaKitWelcomeLetter({ ...welcomeInputBase, recipientName, recipientGender })
    setOpeningTitle(letter.title)
    setWelcomeBody(letter.bodyText)
    setWelcomeSignoff(letter.signoff)
    setWelcomeSignature(letter.signature)
  }
  const canManage = isLeagueAdmin(activeLeague.id)
  const accentLogoUrl = openingLogoOverride ?? activeLeague.logoUrl
  const logoAccentSuggestions = logoAccentResult && logoAccentResult.source === accentLogoUrl ? logoAccentResult.colors : []
  const logoAccentStatus = !accentLogoUrl
    ? "idle"
    : logoAccentResult?.source !== accentLogoUrl
      ? "loading"
      : logoAccentResult.failed || logoAccentResult.colors.length === 0
        ? "error"
        : "ready"
  const scheduledLabel = formatScheduledSeasonStart(roundSettings.scheduledStartAt, locale)
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
  const loadedResultCards = ensureResultCardCount(latestResultMatches.map((match) => resultCardFromMatch(match, players, locale)), locale)
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
  const nextRoundLabels = matchdayDateLabels(nextRoundFirstMatch?.scheduledAt ?? nextRound?.startsAt, locale)
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
  const isWelcomePreset = activePresetKind === "welcome"
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
    template: isWelcomePreset ? "welcome_letter_premium_07" : isResultsPreset ? "results_premium_06" : isSpotlightPreset ? "spotlight_premium_05" : isScoreboardPreset ? "scoreboard_premium_04" : isInformationalPreset ? "informational_premium_02" : activePresetKind === "matchday" ? "matchday_premium_03" : "opening_day_premium_01",
    leagueName: activeLeague.name,
    seasonName: openingSeasonHeader,
    leagueLogoUrl: openingLogoOverride ?? activeLeague.logoUrl,
    locale,
    eyebrow: isWelcomePreset ? welcomeDefaults.eyebrow : activePresetKind === "format" ? "Cómo funciona" : activePresetKind === "rules" ? "Reglamento" : activePresetKind === "gameplay" ? "Guía de juego" : activePresetKind === "results" ? "Jornada completada" : activePresetKind === "standings" ? "Ranking oficial" : activePresetKind === "mvp" ? "Jugador destacado" : activePresetKind === "season_final" ? "Cierre oficial" : activePresetKind === "matchday" ? "Enfrentamiento oficial" : "Evento oficial",
    title: activePresetKind === "matchday" ? matchdayDraft.roundLabel : openingTitle,
    subtitle: isWelcomePreset ? undefined : activePresetKind === "matchday" ? matchdayDraft.matchLabel : openingSubtitle,
    bodyText: isWelcomePreset ? welcomeBody : undefined,
    signoff: isWelcomePreset ? welcomeSignoff : undefined,
    signature: isWelcomePreset ? welcomeSignature : undefined,
    rows: isInformationalPreset ? formatRows : [],
    heroValue: isInformationalPreset ? formatClosing : undefined,
    accentColor: openingAccent,
    eventDateLabel: activePresetKind === "matchday" ? matchdayDraft.date : openingDate,
    eventTimeLabel: activePresetKind === "matchday" ? matchdayDraft.time : openingTime,
    venue: activePresetKind === "matchday" ? matchdayDraft.venue : openingVenue,
    roundLabel: activePresetKind === "matchday" ? matchdayDraft.roundLabel : openingRound,
    headlineFont: openingHeadlineFont,
    welcomeLetterFont: isWelcomePreset ? welcomeLetterFont : undefined,
    welcomeLogoStyle: isWelcomePreset ? welcomeLogoStyle : undefined,
    welcomeSignatureFont: isWelcomePreset ? welcomeSignatureFont : undefined,
    matchup: activePresetKind === "matchday" ? { teamA: matchdayDraft.teamA, teamB: matchdayDraft.teamB } : undefined,
    spotlightImageUrl: isSpotlightPreset ? spotlightImageUrl : undefined,
    resultRound: isResultsPreset ? selectedResultRound : undefined,
    results: isResultsPreset ? resultCards : undefined,
  }), [activeLeague.logoUrl, activeLeague.name, activePresetKind, formatClosing, formatRows, isInformationalPreset, isResultsPreset, isScoreboardPreset, isSpotlightPreset, isWelcomePreset, matchdayDraft, openingAccent, openingDate, openingHeadlineFont, openingLogoOverride, openingRound, openingSeasonHeader, openingSubtitle, openingTime, openingTitle, openingVenue, resultCards, selectedResultRound, spotlightImageUrl, welcomeBody, welcomeDefaults.eyebrow, welcomeLetterFont, welcomeLogoStyle, welcomeSignatureFont, welcomeSignoff, welcomeSignature])

  const base = { leagueName: activeLeague.name, seasonName: openingSeasonHeader, leagueLogoUrl: activeLeague.logoUrl, locale, template: "opening_day_premium_01" as const, accentColor: openingAccent, headlineFont: openingHeadlineFont }
  const pieces: Array<{ kind: LeagueMediaKitKind; data: LeagueMediaKitImageData; disabled?: boolean }> = [
    { kind: "welcome", data: { ...base, kind: "welcome", template: "welcome_letter_premium_07", eyebrow: welcomeDefaults.eyebrow, title: welcomeDefaults.title, bodyText: welcomeDefaults.bodyText, signoff: welcomeDefaults.signoff, signature: welcomeDefaults.signature, welcomeLetterFont: "club_classic", welcomeLogoStyle: "clean_stamp", welcomeSignatureFont: "allura", rows: [] } },
    { kind: "matchday", disabled: sortedMatchdayMatches.length === 0, data: { ...base, kind: "matchday", template: "matchday_premium_03", eyebrow: "Enfrentamiento oficial", title: defaultMatchdayDraft.roundLabel, subtitle: defaultMatchdayDraft.matchLabel, eventDateLabel: defaultMatchdayDraft.date, eventTimeLabel: defaultMatchdayDraft.time, venue: defaultMatchdayDraft.venue, roundLabel: defaultMatchdayDraft.roundLabel, matchup: { teamA: defaultMatchdayDraft.teamA, teamB: defaultMatchdayDraft.teamB }, rows: [] } },
    { kind: "results", data: { ...base, kind: "results", template: "results_premium_06", eyebrow: "Jornada completada", title: "Resultados de la jornada", subtitle: latestCompletedRound ? tx(`Jornada ${latestCompletedRound} · Marcadores oficiales`) : "Los marcadores aparecerán al cerrar la jornada", rows: [], resultRound: latestCompletedRound, results: loadedResultCards } },
    { kind: "standings", data: { ...base, kind: "standings", template: "scoreboard_premium_04", eyebrow: "Ranking oficial", title: "Clasificación actualizada", subtitle: latestCompletedRound ? tx(`Después de la jornada ${latestCompletedRound}`) : "Así arranca la competición", heroValue: "Top 5 · Puntos y diferencia de juegos", rows: standingsRows.length > 0 ? standingsRows : [{ label: "Clasificación pendiente", value: "—" }] } },
    { kind: "mvp", data: { ...base, kind: "mvp", template: "spotlight_premium_05", eyebrow: "Jugador destacado", title: "MVP de la jornada", subtitle: latestCompletedRound ? tx(`Jornada ${latestCompletedRound} · ${latestRoundMvp?.tied ? "Reconocimiento compartido" : "Actuación destacada"}`) : "Reconocimiento de la jornada", heroValue: latestRoundMvpName || "MVP por confirmar", spotlightImageUrl: latestRoundMvpPlayers[0]?.avatarUrl, rows: [
      { label: "Jornada", value: latestCompletedRound ? tx(`Jornada ${latestCompletedRound}`) : "Pendiente" },
      { label: "Sistema", value: roundSettings.mvpSystem === "voting" ? `${latestRoundMvp?.votes ?? 0} votos` : roundSettings.mvpSystem === "automatic_advanced" ? "Rendimiento avanzado" : roundSettings.mvpSystem === "none" ? "Desactivado" : "Rendimiento automático" },
      { label: "Distinción", value: latestRoundMvp?.tied ? "MVP compartido" : latestRoundMvp ? "MVP de jornada" : "Por decidir" },
    ] } },
    { kind: "next_round", data: { ...base, kind: "next_round", eyebrow: "Próximo reto", title: "Próxima jornada", subtitle: "Todo preparado para volver a competir", eventDateLabel: nextRound ? nextRoundLabels.date : "FECHA POR CONFIRMAR", eventTimeLabel: nextRound ? nextRoundLabels.time : "--:--", roundLabel: nextRound ? tx(`Jornada ${nextRound.round}`) : "Próximamente", venue: nextRoundVenue, rows: [] } },
    { kind: "season_final", data: { ...base, kind: "season_final", template: "spotlight_premium_05", eyebrow: "Cierre oficial", title: "Final de temporada", subtitle: seasonMvpNames ? tx(`Campeón y MVP: ${seasonMvpNames}`) : tx(`${activeSeason.name} · Clasificación final`), heroValue: leader?.displayName ?? "Campeón por decidir", spotlightImageUrl: leader?.avatarUrl, rows: championRows.length > 0 ? championRows : [{ label: "Campeón", value: "Por decidir" }] } },
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
    { kind: "calendar", data: { ...base, kind: "calendar", eyebrow: "Temporada", title: "Próxima jornada", subtitle: "Calendario oficial", eventDateLabel: rounds[0]?.startsAt ? formatShortDate(rounds[0].startsAt, locale).toLocaleUpperCase(getIntlLocale(locale)) : tx(`${activeSeason.totalRounds} JORNADAS`), roundLabel: tx(`JORNADA ${rounds.find((round) => round.status === "active")?.round ?? 1}`), eventTimeLabel: `${activeSeason.completedRounds}/${activeSeason.totalRounds}`, venue: tx(`${matches.length} PARTIDOS`), rows: [
      { label: "Jornadas", value: String(activeSeason.totalRounds) },
      { label: "Completadas", value: `${activeSeason.completedRounds} / ${activeSeason.totalRounds}` },
      { label: "Partidos", value: String(matches.length) },
      { label: "Formato", value: roundSettings.scheduleMode === "double" ? "Ida y vuelta" : roundSettings.scheduleMode === "extended" ? "Extendido" : "Una vuelta" },
    ], bullets: rounds.slice(0, 4).map((round) => {
      const windowText = round.startsAt && round.endsAt ? `${formatShortDate(round.startsAt, locale)}–${formatShortDate(round.endsAt, locale)}` : null
      const status = round.status === "completed" ? "completada" : round.status === "active" ? "en curso" : round.status === "overdue" ? "fuera de plazo" : "pendiente"
      return tx(`Jornada ${round.round}${windowText ? ` · ${windowText}` : ""} · ${status}`)
    }) } },
    { kind: "start", data: { ...base, kind: "start", eyebrow: "Reserva la fecha", title: "Inicio de temporada", subtitle: "Volvemos con más ganas", eventDateLabel: scheduledLabel?.split(" · ")[0] ?? "FECHA POR CONFIRMAR", roundLabel: tx(`${players.length} jugadores`), eventTimeLabel: "1 campeón", venue: tx(`${activeSeason.totalRounds} jornadas`), heroLabel: scheduledLabel ? "Comienza" : "Estado", heroValue: scheduledLabel ?? "Inicio pendiente", rows: [
      { label: "Temporada", value: activeSeason.name },
      { label: "Jugadores", value: String(players.length) },
      { label: "Jornadas", value: String(activeSeason.totalRounds) },
    ] } },
    { kind: "countdown", disabled: !roundSettings.scheduledStartAt, data: { ...base, kind: "countdown", eyebrow: "Cuenta atrás", title: "Empieza la competición", subtitle: scheduledLabel ?? "Configura una fecha de inicio", eventDateLabel: countdown && !countdown.isDue ? tx(`${countdown.days} DÍAS`) : roundSettings.scheduledStartAt ? "ARRANCANDO" : "SIN FECHA", roundLabel: "FALTAN", eventTimeLabel: countdown && !countdown.isDue ? `${String(countdown.hours).padStart(2, "0")}H` : "—", venue: countdown && !countdown.isDue ? `${String(countdown.minutes).padStart(2, "0")} MIN` : "—", heroLabel: countdown && !countdown.isDue ? "Falta" : "Estado", heroValue: countdown && !countdown.isDue ? `${countdown.days}d ${String(countdown.hours).padStart(2, "0")}h ${String(countdown.minutes).padStart(2, "0")}m` : roundSettings.scheduledStartAt ? "Arrancando" : "Sin fecha", rows: scheduledLabel ? [{ label: "Inicio", value: scheduledLabel }] : [] } },
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
    .sort((first, second) => presetOrder.indexOf(first.kind) - presetOrder.indexOf(second.kind))

  function applyPresetData(kind: LeagueMediaKitKind, data: LeagueMediaKitImageData) {
    setOpeningTitle(kind === "welcome" ? data.title : tx(data.title))
    setOpeningSubtitle(data.subtitle ? tx(data.subtitle) : "")
    if (kind === "welcome") {
      setWelcomeBody(data.bodyText ?? welcomeDefaults.bodyText)
      setWelcomeSignoff(data.signoff ?? welcomeDefaults.signoff)
      setWelcomeSignature(data.signature ?? welcomeDefaults.signature)
      setWelcomeLetterFont(data.welcomeLetterFont ?? "club_classic")
      setWelcomeLogoStyle(data.welcomeLogoStyle ?? "clean_stamp")
      setWelcomeSignatureFont(data.welcomeSignatureFont ?? "allura")
    }
    setOpeningDate(data.eventDateLabel ?? "")
    setOpeningTime(data.eventTimeLabel ?? "")
    setOpeningRound(data.roundLabel ? tx(data.roundLabel) : "")
    setOpeningVenue(data.venue ?? "")
    if (kind === "format" || kind === "rules" || kind === "gameplay" || kind === "standings" || kind === "mvp" || kind === "season_final") {
      setFormatRows(data.rows.slice(0, 5).map((row) => ({ ...row, label: tx(row.label), value: tx(row.value), icon: row.icon ?? null })))
      setFormatClosing(data.heroValue ? tx(data.heroValue) : "")
    }
    if (kind === "results") {
      setSelectedResultRound(data.resultRound ?? latestCompletedRound ?? 1)
      setResultCards(ensureResultCardCount(data.results ?? [], locale))
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

  useEffect(() => {
    let active = true
    if (!accentLogoUrl) return () => { active = false }
    void extractLogoAccentPalette(accentLogoUrl)
      .then((colors) => {
        if (!active) return
        setLogoAccentResult({ source: accentLogoUrl, colors, failed: false })
      })
      .catch(() => {
        if (!active) return
        setLogoAccentResult({ source: accentLogoUrl, colors: [], failed: true })
      })
    return () => { active = false }
  }, [accentLogoUrl])

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
    setMatchdayDraft(createMatchdayDraft(match, players, activeLeague.locations, roundMatches, locale))
  }

  function loadMatchdayRound(round: number) {
    const firstMatch = sortedMatchdayMatches.find((match) => match.round === round)
    if (firstMatch) loadMatchdayMatch(firstMatch.id)
  }

  function loadResultRound(round: number) {
    const roundMatches = sortedMatchdayMatches.filter((match) => match.round === round && match.status === "finished")
    setSelectedResultRound(round)
    setResultCards(ensureResultCardCount(roundMatches.map((match) => resultCardFromMatch(match, players, locale)), locale))
    setOpeningSubtitle(tx(`Jornada ${round} · Marcadores oficiales`))
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
    setResultCards((current) => current.length >= 4 ? current : [...current, emptyResultCard(locale)])
  }

  function removeResultCard(index: number) {
    setResultCards((current) => current.length <= 2 ? current : current.filter((_, matchIndex) => matchIndex !== index))
  }

  function updateFormatRow(index: number, field: "label" | "value", value: string) {
    setFormatRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row))
  }

  function addFormatRow() {
    setFormatRows((current) => current.length >= 5 ? current : [...current, { label: tx("Nuevo bloque"), value: tx("Añade aquí una explicación breve."), icon: null }])
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
      const exportData = kind === "countdown" && liveCountdown ? { ...data, heroValue: liveCountdown.isDue ? "Arrancando" : `${liveCountdown.days}d ${String(liveCountdown.hours).padStart(2, "0")}h ${String(liveCountdown.minutes).padStart(2, "0")}m`, eventDateLabel: liveCountdown.isDue ? "ARRANCANDO" : tx(`${liveCountdown.days} DÍAS`), eventTimeLabel: `${String(liveCountdown.hours).padStart(2, "0")}H`, venue: `${String(liveCountdown.minutes).padStart(2, "0")} MIN` } : data
      const blob = await createLeagueMediaKitImage(exportData)
      const filename = mediaKitFilename(kind, exportData)
      const file = new File([blob], filename, { type: "image/png" })
      if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ title: `${activeLeague.name} · ${titles[kind]}`, text: `${titles[kind]} · Smash & Lob`, files: [file] })
      else downloadLeagueMediaKitImage(blob, filename)
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) window.alert(tx("No se ha podido generar la imagen."))
    } finally { setBusy(null) }
  }

  async function downloadPiece(kind: LeagueMediaKitKind, data: LeagueMediaKitImageData) {
    if (busy) return
    setBusy(kind)
    try {
      const blob = await createLeagueMediaKitImage(data)
      downloadLeagueMediaKitImage(blob, mediaKitFilename(kind, data))
    } catch {
      window.alert(tx("No se ha podido generar la imagen."))
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

  if (!canManage) return <div className="space-y-4"><BackButton fallbackHref="/" label={tx("Volver")} /><AppCard><p className="font-black">{tx("Acceso restringido")}</p></AppCard></div>

  return (
    <div className="space-y-3">
      <header className="app-page-header"><BackButton fallbackHref="/admin" label={tx("Volver")} /><h1 className="type-page-title">{tx("Centro de difusión")}</h1></header>
      {roundSettings.scheduledStartAt ? <SeasonStartCountdown scheduledStartAt={roundSettings.scheduledStartAt} compact /> : null}

      <AppCard className="overflow-hidden rounded-[28px] border-neutral-200 p-0 shadow-[0_20px_60px_rgba(15,23,42,.08)]">
        <section className="bg-neutral-950 px-4 pb-4 pt-3.5 text-white">
          <div className="mb-3 flex items-end justify-between gap-3"><div><p className="type-caption font-black uppercase tracking-[.2em] text-amber-300">{tx("Biblioteca")}</p><h2 className="mt-0.5 text-base font-black">{tx("Elige un preset")}</h2></div><span className="rounded-full border border-white/15 px-2.5 py-1 type-caption font-black uppercase tracking-wide text-neutral-300">{presets.length} {tx("presets")}</span></div>
          <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {presets.map(({ kind, data, disabled }) => {
              const isActive = activePresetKind === kind
              return <button key={kind} type="button" title={disabled ? tx("Configura fecha de inicio") : data.subtitle ? tx(data.subtitle) : tx(titles[kind])} aria-pressed={isActive} disabled={Boolean(disabled || busy)} onClick={() => loadPreset(kind, data)} className={`min-h-[58px] min-w-[104px] snap-start rounded-2xl border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/5 disabled:text-neutral-600 ${isActive ? "border-amber-300 bg-amber-300 text-neutral-950 shadow-lg shadow-amber-300/10" : "border-white/10 bg-white/[.06] text-white"}`}><span className="block whitespace-nowrap type-micro font-black uppercase tracking-[.1em] opacity-60">{disabled ? tx("Sin fecha") : kind === "welcome" ? tx("Carta") : kind === "format" || kind === "rules" || kind === "gameplay" ? tx("Informativo") : tx("Preset")}</span><span className="mt-1 block text-xs font-black">{tx(compactPresetTitles[kind])}</span></button>
            })}
          </div>
        </section>

        <div id="media-kit-customizer" className="scroll-mt-4 bg-white p-3">
          <div role="tablist" aria-label={tx("Modo de trabajo")} className="grid grid-cols-2 gap-1 rounded-2xl bg-neutral-100 p-1">
            <button type="button" role="tab" aria-selected={workspaceView === "preview"} onClick={() => setWorkspaceView("preview")} className={`min-h-10 rounded-xl px-3 text-xs font-black transition ${workspaceView === "preview" ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500"}`}>{tx("Vista previa")}</button>
            <button type="button" role="tab" aria-selected={workspaceView === "customize"} onClick={() => setWorkspaceView("customize")} className={`min-h-10 rounded-xl px-3 text-xs font-black transition ${workspaceView === "customize" ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500"}`}>{tx("Personalizar")}</button>
          </div>

          {workspaceView === "preview" ? (
            <section role="tabpanel" aria-label={tx("Vista previa")} className="mt-3 overflow-hidden rounded-[24px] bg-neutral-950 p-3 text-white">
              <div className="mb-3 flex items-center justify-between gap-3"><div><p className="type-caption font-black uppercase tracking-[.18em] text-amber-300">{tx("Composición activa")}</p><h3 className="mt-0.5 text-sm font-black">{tx(titles[activePresetKind])}</h3></div><span className="rounded-full bg-white/10 px-2.5 py-1 type-caption font-black text-neutral-300">4:5 · PNG</span></div>
              <div className="mx-auto w-full max-w-[326px]"><MediaKitPosterPreview data={openingData} /></div>
              <div className="mx-auto mt-3 grid w-full max-w-[326px] grid-cols-[1fr_auto] gap-2">
                <button type="button" disabled={Boolean(busy)} onClick={() => void sharePiece(activePresetKind, openingData)} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-center text-xs font-black text-neutral-950 disabled:bg-neutral-500">{busy === activePresetKind ? tx("Generando…") : tx("Compartir imagen")}</button>
                <button type="button" aria-label={tx("Descargar PNG")} disabled={Boolean(busy)} onClick={() => void downloadPiece(activePresetKind, openingData)} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-4 text-center text-xs font-black text-white disabled:text-neutral-500">PNG</button>
              </div>
              <button type="button" onClick={() => setWorkspaceView("customize")} className="mx-auto mt-2 block type-caption font-black text-neutral-400 underline decoration-neutral-700 underline-offset-4">{tx("Personalizar esta pieza")}</button>
            </section>
          ) : (
            <section role="tabpanel" aria-label={tx("Personalización")} className="mt-3 space-y-3">
              <div className="flex items-start justify-between gap-3 px-1"><div><p className="type-caption font-black uppercase tracking-[.18em] text-neutral-400">{tx("Contenido")}</p><h3 className="mt-0.5 text-base font-black text-neutral-950">{tx("Edita la pieza")}</h3></div><span className="rounded-full bg-neutral-950 px-2.5 py-1 type-caption font-black uppercase text-white">{tx(compactPresetTitles[activePresetKind])}</span></div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block type-caption font-black text-neutral-700">{tx("Temporada origen")}<select aria-label={tx("Temporada para los datos del cartel")} value={activeSeason.id} onChange={(event) => setSelectedMediaKitSeasonId(event.target.value)} className={fieldClass}>{leagueSeasons.map((season) => <option key={season.id} value={season.id}>{season.name}{season.id === activeLeague.activeSeasonId ? tx(" · Activa") : ""}</option>)}</select></label>
                  <label className="block type-caption font-black text-neutral-700">{tx("Cabecera de temporada")}<input className={fieldClass} value={openingSeasonHeader} onChange={(event) => setOpeningSeasonHeader(event.target.value)} maxLength={28} placeholder={tx("TEMPORADA 2")} /></label>
                </div>
                <p className="mt-1.5 type-caption font-semibold text-neutral-500">{tx("La temporada origen recarga los datos reales. La cabecera superior puede retocarse sin cambiarla.")}</p>
              </div>

              {isWelcomePreset ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="type-caption font-black uppercase tracking-[.14em] text-amber-800">{tx("Carta contextual")}</p><p className="mt-1 type-caption font-semibold leading-4 text-amber-900/70">{tx("La carta se construye con los datos reales de la temporada. Inscripción, Jornada de Apertura, inicio programado y descansos solo aparecen cuando corresponden.")}</p></div>
                      <button type="button" onClick={() => applyWelcomeAutomaticText()} className="inline-flex shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-3 py-2 text-center type-caption font-black text-amber-900">{tx("Restaurar texto automático")}</button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                    <div className="space-y-3">
                      <div>
                        <p className="type-caption font-black text-neutral-700">{tx("Destinatario")}</p>
                        <p className="mt-0.5 type-caption font-semibold text-neutral-500">{tx("Personaliza el saludo y cualquier palabra con género sin tocar manualmente el texto de la carta.")}</p>
                        <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_180px]">
                          <label className="block type-caption font-black text-neutral-700">{tx("Nombre")}<input className={fieldClass} value={welcomeRecipientName} onChange={(event) => { const nextName = event.target.value; setWelcomeRecipientName(nextName); applyWelcomeAutomaticText(nextName, welcomeRecipientGender) }} maxLength={50} placeholder={tx("Nombre del destinatario")} /></label>
                          <label className="block type-caption font-black text-neutral-700">{tx("Género")}<select className={fieldClass} value={welcomeRecipientGender} onChange={(event) => { const nextGender = event.target.value as "masculine" | "feminine"; setWelcomeRecipientGender(nextGender); applyWelcomeAutomaticText(welcomeRecipientName, nextGender) }}><option value="masculine">{tx("Masculino")}</option><option value="feminine">{tx("Femenino")}</option></select></label>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="type-caption font-black text-neutral-700">{tx("Tipografía de la carta")}</p>
                            <p className="mt-0.5 type-caption font-semibold text-neutral-500">{tx("Elige un estilo editorial. Si las fuentes web no están disponibles, la exportación usa una serifa segura como alternativa.")}</p>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {WELCOME_LETTER_FONT_OPTIONS.map((option) => {
                            const selected = welcomeLetterFont === option.id
                            return (
                              <button
                                key={option.id}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setWelcomeLetterFont(option.id)}
                                className={`min-h-[76px] rounded-xl border px-3 py-2 text-left transition ${selected ? "border-amber-400 bg-amber-50 ring-1 ring-amber-300" : "border-neutral-200 bg-white hover:border-neutral-300"}`}
                              >
                                <span className="block text-base text-neutral-950" style={{ fontFamily: option.previewFamily }}>{tx(option.label)}</span>
                                <span className="mt-1 block type-caption font-semibold text-neutral-500">{tx(option.detail)}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="type-caption font-black text-neutral-700">{tx("Sello institucional")}</p>
                          <p className="mt-0.5 type-caption font-semibold text-neutral-500">{tx("El logo original permanece en la cabecera. El sello es un remate opcional junto a la firma.")}</p>
                          <div className="mt-2 grid gap-2">
                            {WELCOME_LOGO_STYLE_OPTIONS.map((option) => {
                              const selected = welcomeLogoStyle === option.id
                              return (
                                <button key={option.id} type="button" aria-pressed={selected} onClick={() => setWelcomeLogoStyle(option.id)} className={`min-h-[58px] rounded-xl border px-3 py-2 text-left transition ${selected ? "border-sky-700 bg-sky-50 ring-1 ring-sky-200" : "border-neutral-200 bg-white hover:border-neutral-300"}`}>
                                  <span className="block text-sm font-black text-neutral-950">{tx(option.label)}</span>
                                  <span className="mt-0.5 block type-caption font-semibold text-neutral-500">{tx(option.detail)}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="type-caption font-black text-neutral-700">{tx("Estilo de firma")}</p>
                          <p className="mt-0.5 type-caption font-semibold text-neutral-500">{tx("La firma puede usar una caligrafía manuscrita sin alterar el cuerpo formal de la carta.")}</p>
                          <div className="mt-2 grid gap-2">
                            {WELCOME_SIGNATURE_FONT_OPTIONS.map((option) => {
                              const selected = welcomeSignatureFont === option.id
                              return (
                                <button key={option.id} type="button" aria-pressed={selected} onClick={() => setWelcomeSignatureFont(option.id)} className={`min-h-[58px] rounded-xl border px-3 py-2 text-left transition ${selected ? "border-amber-400 bg-amber-50 ring-1 ring-amber-300" : "border-neutral-200 bg-white hover:border-neutral-300"}`}>
                                  <span className="block text-lg text-neutral-950" style={{ fontFamily: option.previewFamily }}>{tx(option.label)}</span>
                                  <span className="mt-0.5 block type-caption font-semibold text-neutral-500">{tx(option.detail)}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                      <label className="block type-caption font-black text-neutral-700">{tx("Título de la carta")}<input className={fieldClass} value={openingTitle} onChange={(event) => setOpeningTitle(event.target.value)} maxLength={60} /></label>
                      <label className="block type-caption font-black text-neutral-700">{tx("Texto de la carta")}<textarea className="mt-1 min-h-72 w-full resize-y rounded-xl border border-neutral-200 bg-white px-3 py-3 text-xs font-semibold leading-5 text-neutral-950 outline-none focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10" value={welcomeBody} onChange={(event) => setWelcomeBody(event.target.value)} maxLength={1600} /></label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block type-caption font-black text-neutral-700">{tx("Despedida")}<input className={fieldClass} value={welcomeSignoff} onChange={(event) => setWelcomeSignoff(event.target.value)} maxLength={40} /></label>
                        <label className="block type-caption font-black text-neutral-700">{tx("Firma")}<input className={fieldClass} value={welcomeSignature} onChange={(event) => setWelcomeSignature(event.target.value)} maxLength={60} /></label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isResultsPreset ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                    <p className="type-caption font-black uppercase tracking-[.14em] text-amber-800">{tx("Cargar jornada")}</p>
                    <label className="mt-2 block type-caption font-black text-neutral-700">{tx("Jornada completa")}<select aria-label={tx("Jornada de resultados")} value={selectedResultRound} disabled={completedResultRoundNumbers.length === 0} onChange={(event) => loadResultRound(Number(event.target.value))} className={fieldClass}>{completedResultRoundNumbers.length > 0 ? completedResultRoundNumbers.map((round) => <option key={round} value={round}>{tx("Jornada")}{" "}{round}{round === latestCompletedRound ? tx(" · Última completa") : ""}</option>) : <option value={1}>{tx("Sin jornadas completas")}</option>}</select></label>
                    <p className="mt-2 type-caption font-semibold leading-4 text-amber-900/70">{tx("Al cambiar de jornada se precargan sus parejas, juegos y sets. Después puedes editar cualquier dato para esta imagen.")}</p>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                    <div className="space-y-3">
                      <label className="block type-caption font-black text-neutral-700">{tx("Titular")}<input className={fieldClass} value={openingTitle} onChange={(event) => setOpeningTitle(event.target.value)} maxLength={48} /></label>
                      <label className="block type-caption font-black text-neutral-700">{tx("Jornada y descripción")}<input className={fieldClass} value={openingSubtitle} onChange={(event) => setOpeningSubtitle(event.target.value)} maxLength={80} /></label>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 p-3">
                    <div className="flex items-center justify-between gap-3"><div><p className="type-caption font-black text-neutral-800">{tx("Resultados")}</p><p className="mt-0.5 type-caption font-semibold text-neutral-500">{tx("Entre 2 y 4 partidos ·")}{" "}{resultCards.length} {tx("activos")}</p></div><button type="button" disabled={resultCards.length >= 4} onClick={addResultCard} className="inline-flex items-center justify-center rounded-xl bg-neutral-950 px-3 py-2 text-center type-caption font-black text-white disabled:bg-neutral-200 disabled:text-neutral-400">{tx("+ Partido")}</button></div>
                    <div className="mt-3 space-y-3">
                      {resultCards.map((result, matchIndex) => (
                        <div key={matchIndex} className="rounded-xl bg-neutral-50 p-2.5">
                          <div className="flex items-center justify-between gap-2"><p className="type-caption font-black uppercase tracking-[.12em] text-neutral-500">{tx("Partido")}{" "}{matchIndex + 1}</p><button type="button" disabled={resultCards.length <= 2} onClick={() => removeResultCard(matchIndex)} className="inline-flex items-center justify-center rounded-lg border border-red-100 bg-white px-2 py-1 text-center type-caption font-black text-red-600 disabled:text-neutral-300">{tx("Eliminar")}</button></div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <input aria-label={tx(`Primer jugador de la pareja 1 del partido ${matchIndex + 1}`)} value={result.teamA[0]} onChange={(event) => updateResultPlayer(matchIndex, "teamA", 0, event.target.value)} maxLength={30} className="h-9 rounded-lg border border-neutral-200 bg-white px-2.5 type-caption font-black text-neutral-900 outline-none focus:border-neutral-950" />
                            <input aria-label={tx(`Segundo jugador de la pareja 1 del partido ${matchIndex + 1}`)} value={result.teamA[1]} onChange={(event) => updateResultPlayer(matchIndex, "teamA", 1, event.target.value)} maxLength={30} className="h-9 rounded-lg border border-neutral-200 bg-white px-2.5 type-caption font-black text-neutral-900 outline-none focus:border-neutral-950" />
                            <input aria-label={tx(`Primer jugador de la pareja 2 del partido ${matchIndex + 1}`)} value={result.teamB[0]} onChange={(event) => updateResultPlayer(matchIndex, "teamB", 0, event.target.value)} maxLength={30} className="h-9 rounded-lg border border-neutral-200 bg-white px-2.5 type-caption font-black text-neutral-900 outline-none focus:border-neutral-950" />
                            <input aria-label={tx(`Segundo jugador de la pareja 2 del partido ${matchIndex + 1}`)} value={result.teamB[1]} onChange={(event) => updateResultPlayer(matchIndex, "teamB", 1, event.target.value)} maxLength={30} className="h-9 rounded-lg border border-neutral-200 bg-white px-2.5 type-caption font-black text-neutral-900 outline-none focus:border-neutral-950" />
                          </div>
                          <div className="mt-2 overflow-hidden rounded-lg border border-neutral-200 bg-white">
                            <div className="grid items-center gap-1 bg-neutral-100 px-2 py-1.5 text-center type-caption font-black uppercase text-neutral-500" style={{ gridTemplateColumns: `minmax(54px,1fr) repeat(${result.sets.length},36px) 42px` }}><span className="text-left">{tx("Pareja")}</span>{result.sets.map((_, setIndex) => <span key={setIndex}>{tx("S")}{setIndex + 1}</span>)}<span>{tx("Sets")}</span></div>
                            {(["a", "b"] as const).map((team) => <div key={team} className="grid items-center gap-1 border-t border-neutral-100 px-2 py-1.5" style={{ gridTemplateColumns: `minmax(54px,1fr) repeat(${result.sets.length},36px) 42px` }}><span className="type-caption font-black text-neutral-700">{tx("Pareja")}{" "}{team === "a" ? "1" : "2"}</span>{result.sets.map((set, setIndex) => <input key={setIndex} aria-label={tx(`Juegos set ${setIndex + 1} pareja ${team === "a" ? "1" : "2"} partido ${matchIndex + 1}`)} type="number" min={0} max={99} value={set[team]} onChange={(event) => updateResultSet(matchIndex, setIndex, team, event.target.value)} className="h-8 w-9 rounded-md border border-neutral-200 text-center text-xs font-black text-neutral-900 outline-none focus:border-neutral-950" />)}<span className="text-center text-base font-black text-neutral-950">{team === "a" ? result.pointsA : result.pointsB}</span></div>)}
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
                      <label className="block type-caption font-black text-neutral-700">{tx("Título informativo")}<input className={fieldClass} value={openingTitle} onChange={(event) => setOpeningTitle(event.target.value)} maxLength={48} /></label>
                      <label className="block type-caption font-black text-neutral-700">{tx("Introducción")}<textarea className="mt-1 min-h-20 w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs font-bold text-neutral-950 outline-none focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10" value={openingSubtitle} onChange={(event) => setOpeningSubtitle(event.target.value)} maxLength={150} /></label>
                      <label className="block type-caption font-black text-neutral-700">{tx(isSpotlightPreset ? "Nombre protagonista" : isScoreboardPreset ? "Pie destacado" : "Frase de cierre")}<input className={fieldClass} value={formatClosing} onChange={(event) => setFormatClosing(event.target.value)} maxLength={80} /></label>
                    </div>
                  </div>

                  {isSpotlightPreset ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-3">
                      <div><p className="type-caption font-black text-neutral-800">{tx("Imagen protagonista")}</p><p className="mt-0.5 type-caption font-semibold text-neutral-500">{tx("Foto del MVP o campeón para esta pieza.")}</p></div>
                      <div className="flex gap-2"><label className="cursor-pointer rounded-xl bg-neutral-100 px-3 py-2 type-caption font-black text-neutral-800">{tx("Cambiar")}<input className="sr-only" type="file" accept="image/*" onChange={(event) => handleSpotlightImage(event.target.files?.[0])} /></label>{spotlightImageUrl ? <button type="button" onClick={() => setSpotlightImageUrl(null)} className="inline-flex items-center justify-center rounded-xl border border-neutral-200 px-3 py-2 text-center type-caption font-black text-neutral-700">{tx("Quitar")}</button> : null}</div>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-neutral-200 p-3">
                    <div className="flex items-center justify-between gap-3"><div><p className="type-caption font-black text-neutral-800">{tx(isScoreboardPreset ? "Filas de datos" : isSpotlightPreset ? "Datos destacados" : "Filas informativas")}</p><p className="mt-0.5 type-caption font-semibold text-neutral-500">{tx(isScoreboardPreset || isSpotlightPreset ? "Hasta 5 bloques" : "Entre 3 y 5 bloques")} · {formatRows.length} {tx("activos")}</p></div><button type="button" disabled={formatRows.length >= 5} onClick={addFormatRow} className="inline-flex items-center justify-center rounded-xl bg-neutral-950 px-3 py-2 text-center type-caption font-black text-white disabled:bg-neutral-200 disabled:text-neutral-400">{tx("+ Añadir")}</button></div>
                    <div className="mt-3 space-y-2.5">
                      {formatRows.map((row, index) => (
                        <div key={index} className="rounded-xl bg-neutral-50 p-2.5">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            {isScoreboardPreset || isSpotlightPreset ? <span className="type-caption font-black uppercase tracking-wide text-neutral-400">{tx("Fila")} {index + 1}</span> : <div className="flex min-w-0 items-center gap-1.5">
                              {row.icon ? <Image unoptimized src={mediaKitIconDataUrl(row.icon, openingAccent) ?? row.icon} width={28} height={28} alt="" className="h-7 w-7 rounded-lg object-contain" /> : <span className="type-caption font-black uppercase tracking-wide text-neutral-400">{tx("Fila")}</span>}
                              <button type="button" aria-expanded={openIconPickerIndex === index} onClick={() => setOpenIconPickerIndex((current) => current === index ? null : index)} className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-center type-caption font-black text-neutral-700">{tx(row.icon ? "Cambiar icono" : "+ Icono")}</button>
                              {row.icon ? <button type="button" onClick={() => removeFormatRowIcon(index)} className="type-caption font-black text-neutral-400">{tx("Quitar")}</button> : null}
                            </div>}
                            <div className="flex shrink-0 gap-1"><button type="button" aria-label={tx(`Subir fila ${index + 1}`)} disabled={index === 0} onClick={() => moveFormatRow(index, -1)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-center text-xs font-black text-neutral-700 disabled:text-neutral-300">↑</button><button type="button" aria-label={tx(`Bajar fila ${index + 1}`)} disabled={index === formatRows.length - 1} onClick={() => moveFormatRow(index, 1)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-center text-xs font-black text-neutral-700 disabled:text-neutral-300">↓</button><button type="button" aria-label={tx(`Eliminar fila ${index + 1}`)} disabled={formatRows.length <= (isScoreboardPreset || isSpotlightPreset ? 1 : 3)} onClick={() => removeFormatRow(index)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 bg-white text-center text-xs font-black text-red-600 disabled:text-neutral-300">×</button></div>
                          </div>
                          {!isScoreboardPreset && !isSpotlightPreset && openIconPickerIndex === index ? (
                            <div className="mb-2.5 rounded-xl border border-neutral-200 bg-white p-2.5 shadow-sm">
                              <div className="flex items-center justify-between gap-2"><p className="type-caption font-black text-neutral-800">{tx("Elige un icono SVG")}</p><button type="button" onClick={() => setOpenIconPickerIndex(null)} className="type-caption font-black text-neutral-400">{tx("Cerrar")}</button></div>
                              <div className="mt-2 grid grid-cols-5 gap-1.5 sm:grid-cols-8">
                                {MEDIA_KIT_ICON_OPTIONS.map((option) => {
                                  const selected = getMediaKitIconId(row.icon) === option.id
                                  const iconUrl = mediaKitIconDataUrl(option.id, openingAccent)
                                  return <button key={option.id} type="button" title={tx(option.label)} aria-label={tx(`Usar icono ${option.label}`)} aria-pressed={selected} onClick={() => selectFormatRowIcon(index, option.id)} className={`grid aspect-square place-items-center rounded-lg border p-1.5 transition ${selected ? "border-neutral-950 bg-neutral-950" : "border-neutral-200 bg-neutral-50 hover:border-neutral-400"}`}>{iconUrl ? <Image unoptimized src={iconUrl} width={24} height={24} alt="" className="h-6 w-6" /> : null}</button>
                                })}
                              </div>
                              <label className="mt-2.5 flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-3 type-caption font-black text-neutral-700">{tx("Subir imagen personalizada")}<input className="sr-only" type="file" accept="image/*" onChange={(event) => handleFormatRowIcon(index, event.target.files?.[0])} /></label>
                            </div>
                          ) : null}
                          <input aria-label={tx(`Título de la fila ${index + 1}`)} value={row.label} onChange={(event) => updateFormatRow(index, "label", event.target.value)} maxLength={36} className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-2.5 type-caption font-black text-neutral-900 outline-none focus:border-neutral-950" />
                          <textarea aria-label={tx(`Descripción de la fila ${index + 1}`)} value={row.value} onChange={(event) => updateFormatRow(index, "value", event.target.value)} maxLength={140} className="mt-2 min-h-16 w-full resize-none rounded-lg border border-neutral-200 bg-white px-2.5 py-2 type-caption font-semibold leading-4 text-neutral-700 outline-none focus:border-neutral-950" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : activePresetKind === "matchday" ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                    <p className="type-caption font-black uppercase tracking-[.14em] text-amber-800">{tx("Cargar partido")}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <label className="type-caption font-black text-neutral-700">{tx("Jornada")}<select aria-label={tx("Jornada del cartel")} value={matchdayDraft.round} onChange={(event) => loadMatchdayRound(Number(event.target.value))} className={fieldClass}>{matchdayRoundNumbers.map((round) => <option key={round} value={round}>{tx("Jornada")}{" "}{round}</option>)}</select></label>
                      <label className="type-caption font-black text-neutral-700">{tx("Partido")}<select aria-label={tx("Partido del cartel")} value={selectedMatchdayId} onChange={(event) => loadMatchdayMatch(event.target.value)} className={fieldClass}>{selectedRoundMatches.map((match, index) => <option key={match.id} value={match.id}>{tx("Partido")}{" "}{index + 1}</option>)}</select></label>
                    </div>
                    <p className="mt-2 type-caption font-semibold leading-4 text-amber-900/70">{tx("Al elegir un partido se cargan sus jugadores, fecha, hora y sede. Después puedes retocarlos para esta imagen.")}</p>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="type-caption font-black text-neutral-700">{tx("Texto de jornada")}<input className={fieldClass} value={matchdayDraft.roundLabel} onChange={(event) => setMatchdayDraft((current) => ({ ...current, roundLabel: event.target.value }))} maxLength={24} /></label>
                      <label className="type-caption font-black text-neutral-700">{tx("Etiqueta de partido")}<input className={fieldClass} value={matchdayDraft.matchLabel} onChange={(event) => setMatchdayDraft((current) => ({ ...current, matchLabel: event.target.value }))} maxLength={20} /></label>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-neutral-200 p-3">
                      <p className="type-caption font-black uppercase tracking-[.12em] text-neutral-500">{tx("Pareja 1")}</p>
                      <input aria-label={tx("Primer jugador de la pareja 1")} className={fieldClass} value={matchdayDraft.teamA[0]} onChange={(event) => updateMatchdayPlayer("teamA", 0, event.target.value)} maxLength={32} />
                      <input aria-label={tx("Segundo jugador de la pareja 1")} className={fieldClass} value={matchdayDraft.teamA[1]} onChange={(event) => updateMatchdayPlayer("teamA", 1, event.target.value)} maxLength={32} />
                    </div>
                    <div className="rounded-2xl border border-neutral-200 p-3">
                      <p className="type-caption font-black uppercase tracking-[.12em] text-neutral-500">{tx("Pareja 2")}</p>
                      <input aria-label={tx("Primer jugador de la pareja 2")} className={fieldClass} value={matchdayDraft.teamB[0]} onChange={(event) => updateMatchdayPlayer("teamB", 0, event.target.value)} maxLength={32} />
                      <input aria-label={tx("Segundo jugador de la pareja 2")} className={fieldClass} value={matchdayDraft.teamB[1]} onChange={(event) => updateMatchdayPlayer("teamB", 1, event.target.value)} maxLength={32} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="type-caption font-black text-neutral-700">{tx("Fecha")}<input className={fieldClass} value={matchdayDraft.date} onChange={(event) => setMatchdayDraft((current) => ({ ...current, date: event.target.value }))} maxLength={36} /></label>
                      <label className="type-caption font-black text-neutral-700">{tx("Hora")}<input className={fieldClass} value={matchdayDraft.time} onChange={(event) => setMatchdayDraft((current) => ({ ...current, time: event.target.value }))} maxLength={12} /></label>
                      <label className="col-span-2 type-caption font-black text-neutral-700">{tx("Sede")}<input className={fieldClass} value={matchdayDraft.venue} onChange={(event) => setMatchdayDraft((current) => ({ ...current, venue: event.target.value }))} maxLength={42} /></label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="col-span-2 type-caption font-black text-neutral-700">{tx("Titular principal")}<input className={fieldClass} value={openingTitle} onChange={(event) => setOpeningTitle(event.target.value)} maxLength={34} /></label>
                    <label className="col-span-2 type-caption font-black text-neutral-700">{tx("Subtítulo")}<input className={fieldClass} value={openingSubtitle} onChange={(event) => setOpeningSubtitle(event.target.value)} maxLength={44} placeholder={tx("Opcional")} /></label>
                    <label className="type-caption font-black text-neutral-700">{tx("Bloque destacado")}<input className={fieldClass} value={openingDate} onChange={(event) => setOpeningDate(event.target.value)} maxLength={28} /></label>
                    <label className="type-caption font-black text-neutral-700">{tx("Dato central")}<input className={fieldClass} value={openingTime} onChange={(event) => setOpeningTime(event.target.value)} maxLength={12} /></label>
                    <label className="type-caption font-black text-neutral-700">{tx("Etiqueta izquierda")}<input className={fieldClass} value={openingRound} onChange={(event) => setOpeningRound(event.target.value)} maxLength={22} /></label>
                    <label className="type-caption font-black text-neutral-700">{tx("Etiqueta derecha")}<input className={fieldClass} value={openingVenue} onChange={(event) => setOpeningVenue(event.target.value)} maxLength={24} /></label>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-neutral-200 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {isWelcomePreset ? <div className="rounded-xl bg-neutral-50 px-3 py-2"><p className="type-caption font-black text-neutral-700">{tx("Diseño de carta")}</p><p className="mt-1 type-caption font-semibold leading-4 text-neutral-500">{tx("Tipografía editorial fija para mantener el carácter institucional del documento.")}</p></div> : <label className="type-caption font-black text-neutral-700">{tx("Tipografía del titular")}<select aria-label={tx("Diseño del titular")} value={openingHeadlineFont} onChange={(event) => setOpeningHeadlineFont(event.target.value as LeagueMediaKitHeadlineFont)} className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-black text-neutral-900 outline-none focus:border-neutral-950">{openingHeadlineFontOptions.map((option) => <option key={option.id} value={option.id}>{tx(option.label)} · {tx(option.detail)}</option>)}</select></label>}
                  <div><p className="type-caption font-black text-neutral-700">{tx("Color de acento")}</p><div className="mt-2 flex flex-wrap items-center gap-2">{openingAccentOptions.map((color) => <button key={color} type="button" aria-label={tx(`Usar color ${color}`)} onClick={() => selectPresetAccent(color)} className={`h-8 w-8 rounded-full border-2 ${!showCustomAccent && openingAccent === color ? "border-neutral-950 ring-2 ring-neutral-200" : "border-white shadow-sm"}`} style={{ backgroundColor: color }} />)}<button type="button" aria-label={tx("Color personalizado")} aria-expanded={showCustomAccent} onClick={() => { setShowCustomAccent((current) => !current); setCustomAccentDraft(openingAccent) }} className={`min-h-8 rounded-full border px-3 type-caption font-black ${showCustomAccent ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-neutral-50 text-neutral-700"}`}>{tx("+ Propio")}</button></div>{accentLogoUrl ? <div className="mt-2 rounded-xl bg-neutral-50 px-2.5 py-2"><div className="flex items-center justify-between gap-2"><p className="type-caption font-black text-neutral-600">{tx("Sugeridos por el logo")}</p>{logoAccentStatus === "loading" ? <span className="type-caption font-bold text-neutral-400">{tx("Analizando…")}</span> : null}</div>{logoAccentStatus === "ready" ? <div className="mt-1.5 flex flex-wrap gap-2">{logoAccentSuggestions.map((color) => <button key={color} type="button" aria-label={tx(`Usar color del logo ${color}`)} title={color} onClick={() => selectPresetAccent(color)} className={`h-8 w-8 rounded-full border-2 ${!showCustomAccent && openingAccent === color ? "border-neutral-950 ring-2 ring-neutral-200" : "border-white shadow-sm"}`} style={{ backgroundColor: color }} />)}</div> : null}{logoAccentStatus === "error" ? <p className="mt-1 type-caption font-semibold text-neutral-400">{tx("No se han podido extraer colores útiles de este logo.")}</p> : null}</div> : null}</div>
                </div>
                {showCustomAccent ? <div className="mt-3 grid grid-cols-[48px_1fr] gap-2 rounded-xl bg-neutral-50 p-2"><input aria-label={tx("Selector de color personalizado")} type="color" value={openingAccent} onChange={(event) => { setOpeningAccent(event.target.value); setCustomAccentDraft(event.target.value) }} className="h-10 w-12 cursor-pointer rounded-lg border border-neutral-200 bg-white p-1" /><input aria-label={tx("Código hexadecimal personalizado")} value={customAccentDraft} onChange={(event) => updateCustomAccent(event.target.value)} maxLength={7} placeholder="#D7A544" className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-black uppercase text-neutral-900 outline-none focus:border-neutral-950" /></div> : null}
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-neutral-200 pt-3"><div><p className="type-caption font-black text-neutral-800">{tx("Logo de la liga")}</p><p className="mt-0.5 type-caption font-semibold text-neutral-500">{tx("Cambio temporal para esta imagen.")}</p></div><div className="flex gap-2"><label className="cursor-pointer rounded-xl bg-neutral-100 px-3 py-2 type-caption font-black text-neutral-800">{tx("Cambiar")}<input className="sr-only" type="file" accept="image/*" onChange={(event) => handleLogoOverride(event.target.files?.[0])} /></label>{openingLogoOverride ? <button type="button" onClick={() => setOpeningLogoOverride(null)} className="inline-flex items-center justify-center rounded-xl border border-neutral-200 px-3 py-2 text-center type-caption font-black text-neutral-700">{tx("Restaurar")}</button> : null}</div></div>
              </div>

              <button type="button" onClick={() => setWorkspaceView("preview")} className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-neutral-950 px-4 text-center text-xs font-black text-white">{tx("Ver vista previa")}</button>
            </section>
          )}
        </div>
      </AppCard>

    </div>
  )
}
