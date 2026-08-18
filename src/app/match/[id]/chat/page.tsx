"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { MatchTeamsPanel } from "@/components/matches/MatchTeamsPanel"
import { AddToCalendarButton } from "@/components/match/AddToCalendarButton"
import { MatchReservationConfirmation } from "@/components/match/MatchReservationConfirmation"
import {
  MatchChatComposer,
  MatchChatFrame,
  MatchChatMessageReceipt,
  MatchChatReadOnlyBar,
  MatchChatTextMessage,
  MatchChatWriteWindowBanner,
  getMatchChatParticipantColorClass,
  resizeMatchChatComposer,
  useMatchChatAutoScroll,
  useMatchChatViewport,
  type MatchChatParticipant,
} from "@/components/match/chat/MatchChatShared"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useMatchData } from "@/context/MatchDataProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { CHAT_UNREAD_LOCAL_REFRESH_EVENT, subscribeChatRealtime } from "@/lib/chatRealtimeClient"
import { readMatchChatCache, writeMatchChatCache } from "@/lib/matchChatCache"
import {
  getLeagueLocationOptionLabel,
  sortLeagueLocationsByOptionLabel,
} from "@/lib/leagueLocations"
import {
  buildAvailabilityRecommendations,
  findStoredPlayerAvailability,
  getRecommendedDefaultDateTimeLocalValue,
  upsertStoredPlayerAvailability,
  type PlayerAvailability,
} from "@/lib/playerAvailability"
import { fetchSupabaseMatchPlayerAvailabilities } from "@/lib/supabasePlayerAvailability"
import { buildMatchChatCoordination, type MatchChatCoordination } from "@/lib/matchChatCoordination"

type ChatKind = "text" | "date_proposal" | "location_proposal"
type ProposalResponse = { userId: string; playerId: string | null; displayName: string; optionKey: string; response: "available" | "unavailable"; updatedAt: string }
type Message = { id: string; sender_user_id: string; sender_display_name: string; body: string; kind: ChatKind; payload: unknown; responses: ProposalResponse[]; created_at: string }
type ReplyReference = { messageId: string; senderDisplayName: string; body: string }
type Participant = MatchChatParticipant & { playerId: string; handle: string }
type ActionMode = null | "menu" | "date" | "location"
type ReservationSummary = { scheduledAt: string; locationText: string }
const chatErrorMessage = (error?: string) => error === "match_chat_unavailable" ? "El chat todavía no está disponible en este entorno." : error ?? "No se ha podido cargar el chat."
const record = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
const proposalDate = (value: string) => new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
const reservationSummaryDate = (value: string) => new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value))
const proposalVoteDate = (value: string) => { const formatted = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value)); return formatted.charAt(0).toLocaleUpperCase("es-ES") + formatted.slice(1) }
const localDateValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
const localTimeValue = (date: Date) => `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
const nextFullHourValue = () => { const date = new Date(); date.setHours(date.getHours() + 1, 0, 0, 0); return `${localDateValue(date)}T${localTimeValue(date)}` }
const parseLocalDate = (value: string) => { const [year, month, day] = value.split("-").map(Number); return new Date(year, month - 1, day) }
const hasAvailabilityInfo = (availability: PlayerAvailability) => Object.values(availability.weeklySlots).some((slots) => slots.length > 0) || Object.values(availability.dateOverrides).some((slots) => slots.length > 0)
function buildProposalCalendarDays(startsAt: string | null, endsAt: string | null) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const configuredStart = startsAt ? parseLocalDate(startsAt) : null
  const configuredEnd = endsAt ? parseLocalDate(endsAt) : null
  const start = configuredStart && configuredStart > today ? configuredStart : today
  const days: string[] = []
  const cursor = new Date(start)
  while (days.length < 14 && (!configuredEnd || cursor <= configuredEnd)) { days.push(localDateValue(cursor)); cursor.setDate(cursor.getDate() + 1) }
  return days.length ? days : [localDateValue(today)]
}
const calendarWeekday = (value: string) => new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(parseLocalDate(value)).replace(".", "").toLocaleUpperCase("es-ES")
const calendarDayNumber = (value: string) => String(parseLocalDate(value).getDate())
const messageClientId = (message: Message) => typeof record(message.payload).clientId === "string" ? String(record(message.payload).clientId) : ""
const chatMessageKey = (message: Message) => messageClientId(message) || message.id
function mergePendingMessages(serverMessages: Message[], pendingMessages: Iterable<Message>) { const confirmed = new Set(serverMessages.map(messageClientId).filter(Boolean)); return [...serverMessages, ...Array.from(pendingMessages).filter((message) => !confirmed.has(messageClientId(message)))] }
function createOptimisticClientId() { const values = new Uint32Array(4); globalThis.crypto.getRandomValues(values); return Array.from(values, (value) => value.toString(36)).join("-") }

const messageReplyLabel = (message: Message) => {
  const payload = record(message.payload)
  if (message.kind === "date_proposal") return "Propuesta de fecha"
  if (message.kind === "location_proposal") return "Propuesta de ubicación"
  if (payload.systemType === "reservation_confirmed") return "Partido programado"
  return message.body.trim().slice(0, 240) || "Mensaje"
}
const messageReplyReference = (message: Message): ReplyReference => ({ messageId: message.id, senderDisplayName: message.sender_display_name, body: messageReplyLabel(message) })
const payloadReplyReference = (payload: unknown): ReplyReference | null => { const source = record(record(payload).replyTo), messageId = typeof source.messageId === "string" ? source.messageId : "", senderDisplayName = typeof source.senderDisplayName === "string" ? source.senderDisplayName : "", body = typeof source.body === "string" ? source.body : ""; return messageId && senderDisplayName && body ? { messageId, senderDisplayName, body } : null }
// Conservamos el panel de jugadores listo para reactivarlo si vuelve a aportar valor en el chat.
const SHOW_MATCH_TEAMS_PANEL = false
type LoadedChatSnapshot = {
  messages: Message[]
  participants: Participant[]
  currentUserId: string
  round: number | null
  readOnly: boolean
  writeUntil: string | null
  realtimeTopic: string | null
  coordination: MatchChatCoordination | null
  reservationSummary: ReservationSummary | null
}

async function requestMatchChatSnapshot(id: string) {
  const response = await fetch(`/api/matches/${encodeURIComponent(id)}/chat`, { cache: "no-store" })
  const data = await response.json().catch(() => null)
  return { response, data }
}

function mapLoadedChatSnapshot(data: unknown): LoadedChatSnapshot {
  const source = record(data)
  return {
    messages: Array.isArray(source.messages) ? source.messages as Message[] : [],
    participants: Array.isArray(source.participants) ? source.participants as Participant[] : [],
    currentUserId: typeof source.currentUserId === "string" ? source.currentUserId : "",
    round: typeof source.round === "number" ? source.round : null,
    readOnly: Boolean(source.readOnly),
    writeUntil: typeof source.writeUntil === "string" ? source.writeUntil : null,
    realtimeTopic: typeof source.realtimeTopic === "string" ? source.realtimeTopic : null,
    coordination: (source.coordination ?? null) as MatchChatCoordination | null,
    reservationSummary: typeof record(source.reservationSummary).scheduledAt === "string" ? { scheduledAt: String(record(source.reservationSummary).scheduledAt), locationText: typeof record(source.reservationSummary).locationText === "string" ? String(record(source.reservationSummary).locationText) : "Pista reservada" } : null,
  }
}

function MentionText({ body, participants }: { body: string; participants: Participant[] }) {
  const handles = new Set(participants.filter((item) => item.userId).map((item) => item.handle.toLocaleLowerCase("es-ES")))
  return <>{body.split(/(@[A-Za-z0-9_]+)/g).map((part, index) => handles.has(part.slice(1).toLocaleLowerCase("es-ES")) ? <span key={`${part}-${index}`} className="font-black underline decoration-2 underline-offset-2">{part}</span> : part)}</>
}

export default function MatchChatPage() {
  const id = String(useParams<{ id: string }>().id)
  const { matches, players, activeLeague, activeSeason, rounds } = useCurrentLeagueData()
  const { hydrateMatches } = useMatchData()
  const { isLeagueAdmin } = useLeagueAccess()
  const match = matches.find((item) => item.id === id)
  const [messages, setMessages] = useState<Message[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [me, setMe] = useState("")
  const [round, setRound] = useState<number | null>(null)
  const [body, setBody] = useState("")
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [expandedProposalId, setExpandedProposalId] = useState<string | null>(null)
  const [expandedProposalOptionKey, setExpandedProposalOptionKey] = useState<string | null>(null)
  const [swipingMessage, setSwipingMessage] = useState<{ key: string; offset: number } | null>(null)
  const [error, setError] = useState("")
  const [readOnly, setReadOnly] = useState(false)
  const [writeUntil, setWriteUntil] = useState<string | null>(null)
  const [actionMode, setActionMode] = useState<ActionMode>(null)
  const [dateDraft, setDateDraft] = useState("")
  const [dateOptions, setDateOptions] = useState<string[]>([])
  const [locationDraft, setLocationDraft] = useState("")
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [realtimeTopic, setRealtimeTopic] = useState<string | null>(null)
  const [coordination, setCoordination] = useState<MatchChatCoordination | null>(null)
  const [reservationSummary, setReservationSummary] = useState<ReservationSummary | null>(null)
  const [matchAvailabilities, setMatchAvailabilities] = useState<PlayerAvailability[]>([])
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const playerSeasonReadOnly = activeSeason.status === "upcoming" && !isLeagueAdmin(activeLeague.id)
  const effectiveReadOnly = readOnly || playerSeasonReadOnly
  const matchFinished = Boolean(match?.status === "finished" || match?.resultRecordedAt)
  const [enteringMessageIds, setEnteringMessageIds] = useState<Set<string>>(new Set())
  const viewportRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const dateDraftTouchedRef = useRef(false)
  const pendingMessagesRef = useRef(new Map<string, Message>())
  const knownMessageIdsRef = useRef(new Set<string>())
  const swipeGestureRef = useRef<{ key: string; message: Message; startX: number; startY: number; pointerId: number } | null>(null)
  const matchRound = match?.round ?? round
  const matchPlayerIdsKey = match ? [...new Set([...match.teamA, ...match.teamB])].join("|") : ""
  const matchPlayerIds = matchPlayerIdsKey.split("|").filter(Boolean)
  const matchRoundWindow = rounds.find((item) => item.round === matchRound) ?? null
  const proposalCalendarDays = buildProposalCalendarDays(matchRoundWindow?.startsAt ?? null, matchRoundWindow?.endsAt ?? null)
  const proposalWindowStart = proposalCalendarDays[0] ?? null
  const proposalWindowEnd = proposalCalendarDays.at(-1) ?? null
  const availabilityConfigured = matchAvailabilities.some(hasAvailabilityInfo)
  const availabilityRecommendations = availabilityConfigured ? buildAvailabilityRecommendations({ playerIds: matchPlayerIds, availabilities: matchAvailabilities, startsAt: proposalWindowStart, endsAt: proposalWindowEnd, maxResults: 40 }) : []
  const recommendedDefaultDateDraft = availabilityConfigured ? getRecommendedDefaultDateTimeLocalValue({ playerIds: matchPlayerIds, availabilities: matchAvailabilities, startsAt: proposalWindowStart, endsAt: proposalWindowEnd }) : null
  const locationOptions = sortLeagueLocationsByOptionLabel(activeLeague.locations)
  const selectedProposalDate = dateDraft.slice(0, 10) || proposalCalendarDays[0] || ""
  const selectedProposalTime = dateDraft.includes("T") ? dateDraft.slice(11, 16) : nextFullHourValue().slice(11, 16)
  const selectedDayRecommendedTimes = [...new Set(availabilityRecommendations.filter((item) => item.date === selectedProposalDate).map((item) => item.start))].slice(0, 4)
  const selectedProposalIso = dateDraft ? new Date(dateDraft).toISOString() : ""
  const selectedProposalTimeIsChosen = Boolean(selectedProposalIso && dateOptions.includes(selectedProposalIso))
  const displayedCoordination = participants.length ? buildMatchChatCoordination({ matchStatus: match?.status ?? "scheduling", participants, messages }) : coordination
  const hasConfirmedReservation = Boolean(
    reservationSummary ||
      messages.some(
        (message) =>
          message.kind === "text" &&
          record(message.payload).systemType === "reservation_confirmed",
      ),
  )

  const loadFromServer = useCallback(async (currentMatch: typeof match) => {
    const { response, data } = await requestMatchChatSnapshot(id)
    const source = record(data)
    if (!response.ok) {
      setError(chatErrorMessage(typeof source.error === "string" ? source.error : undefined))
      setInitialLoadComplete(true)
      return
    }
    const snapshot = mapLoadedChatSnapshot(data)
    const mergedMessages = mergePendingMessages(snapshot.messages, pendingMessagesRef.current.values()); knownMessageIdsRef.current = new Set(mergedMessages.map(chatMessageKey)); setMessages(mergedMessages)
    setParticipants(snapshot.participants)
    setMe(snapshot.currentUserId)
    setRound(snapshot.round)
    setReadOnly(snapshot.readOnly)
    setWriteUntil(snapshot.writeUntil)
    setRealtimeTopic(snapshot.realtimeTopic)
    setCoordination(snapshot.coordination)
    setReservationSummary(snapshot.reservationSummary)
    if (currentMatch) hydrateMatches([{ ...currentMatch, coordinationStatus: snapshot.coordination?.status === "coordinating" || snapshot.coordination?.status === "awaiting_booking" ? snapshot.coordination.status : null }])
    setError("")
    setInitialLoadComplete(true)
    writeMatchChatCache(id, { ...source, ...snapshot })
    window.dispatchEvent(new Event(CHAT_UNREAD_LOCAL_REFRESH_EVENT))
  }, [hydrateMatches, id])

  useEffect(() => {
    const cacheTimer = window.setTimeout(() => {
      const cached = readMatchChatCache(id)
      const snapshot = mapLoadedChatSnapshot(cached)
      if (!snapshot.messages.length && !snapshot.participants.length) return
      const mergedMessages = mergePendingMessages(snapshot.messages, pendingMessagesRef.current.values()); knownMessageIdsRef.current = new Set(mergedMessages.map(chatMessageKey)); setMessages(mergedMessages)
      setParticipants(snapshot.participants)
      setMe(snapshot.currentUserId)
      setRound(snapshot.round)
      setReadOnly(snapshot.readOnly)
    setWriteUntil(snapshot.writeUntil)
      setRealtimeTopic(snapshot.realtimeTopic)
      setCoordination(snapshot.coordination)
      setReservationSummary(snapshot.reservationSummary)
      setInitialLoadComplete(true)
    }, 0)
    return () => window.clearTimeout(cacheTimer)
  }, [id])

  useEffect(() => {
    let cancelled = false
    const runLoad = async () => {
      const { response, data } = await requestMatchChatSnapshot(id)
      if (cancelled) return
      const source = record(data)
      if (!response.ok) {
        setError(chatErrorMessage(typeof source.error === "string" ? source.error : undefined))
        setInitialLoadComplete(true)
        return
      }
      const snapshot = mapLoadedChatSnapshot(data)
      const mergedMessages = mergePendingMessages(snapshot.messages, pendingMessagesRef.current.values()); knownMessageIdsRef.current = new Set(mergedMessages.map(chatMessageKey)); setMessages(mergedMessages)
      setParticipants(snapshot.participants)
      setMe(snapshot.currentUserId)
      setRound(snapshot.round)
      setReadOnly(snapshot.readOnly)
    setWriteUntil(snapshot.writeUntil)
      setRealtimeTopic(snapshot.realtimeTopic)
      setCoordination(snapshot.coordination)
      setReservationSummary(snapshot.reservationSummary)
      setError("")
      setInitialLoadComplete(true)
      writeMatchChatCache(id, { ...source, ...snapshot })
      window.dispatchEvent(new Event(CHAT_UNREAD_LOCAL_REFRESH_EVENT))
    }
    const initialTimer = window.setTimeout(() => { void runLoad() }, 0)
    const handleVisibility = () => { if (!document.hidden) void runLoad() }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => { cancelled = true; window.clearTimeout(initialTimer); document.removeEventListener("visibilitychange", handleVisibility) }
  }, [id])

  useEffect(() => subscribeChatRealtime(realtimeTopic, () => {
    if (document.hidden) return
    void (async () => {
      const { response, data } = await requestMatchChatSnapshot(id)
      const source = record(data)
      if (!response.ok) {
        setError(chatErrorMessage(typeof source.error === "string" ? source.error : undefined))
        setInitialLoadComplete(true)
        return
      }
      const snapshot = mapLoadedChatSnapshot(data)
      const mergedMessages = mergePendingMessages(snapshot.messages, pendingMessagesRef.current.values()), newMessageIds = mergedMessages.map(chatMessageKey).filter((messageId) => !knownMessageIdsRef.current.has(messageId)); knownMessageIdsRef.current = new Set(mergedMessages.map(chatMessageKey)); if (newMessageIds.length) setEnteringMessageIds(new Set(newMessageIds)); setMessages(mergedMessages)
      setParticipants(snapshot.participants)
      setMe(snapshot.currentUserId)
      setRound(snapshot.round)
      setReadOnly(snapshot.readOnly)
    setWriteUntil(snapshot.writeUntil)
      setRealtimeTopic(snapshot.realtimeTopic)
      setCoordination(snapshot.coordination)
      setReservationSummary(snapshot.reservationSummary)
      setError("")
      setInitialLoadComplete(true)
      writeMatchChatCache(id, { ...source, ...snapshot })
      window.dispatchEvent(new Event(CHAT_UNREAD_LOCAL_REFRESH_EVENT))
    })()
  }), [id, realtimeTopic])

  useEffect(() => {
    if (!writeUntil || effectiveReadOnly) return
    const cutoff = Date.parse(writeUntil)
    if (!Number.isFinite(cutoff)) return
    const delay = cutoff - Date.now()
    const timeout = Math.max(0, Math.min(delay + 250, 2_147_000_000))
    const timer = window.setTimeout(() => void loadFromServer(match), timeout)
    return () => window.clearTimeout(timer)
  }, [effectiveReadOnly, loadFromServer, match, writeUntil])

  useEffect(() => {
    if (!matchPlayerIdsKey) return
    let cancelled = false
    const playerIds = matchPlayerIdsKey.split("|").filter(Boolean)
    const stored = playerIds.map((playerId) => findStoredPlayerAvailability({ leagueId: activeLeague.id, seasonId: activeSeason.id, playerId })).filter((item): item is PlayerAvailability => Boolean(item))
    const storedTimer = window.setTimeout(() => { if (!cancelled) setMatchAvailabilities(stored) }, 0)
    void fetchSupabaseMatchPlayerAvailabilities({ leagueId: activeLeague.id, matchId: id }).then((items) => {
      if (cancelled) return
      setMatchAvailabilities(items)
      items.forEach((item) => upsertStoredPlayerAvailability(item))
    }).catch(() => null)
    return () => { cancelled = true; window.clearTimeout(storedTimer) }
  }, [activeLeague.id, activeSeason.id, id, matchPlayerIdsKey])

  useMatchChatAutoScroll({ messagesRef, messageCount: messages.length, mode: "always" })
  useMatchChatViewport({ viewportRef, composerRef, messagesRef })

  useEffect(() => {
    if (actionMode !== "date" || !recommendedDefaultDateDraft || dateDraftTouchedRef.current || dateOptions.length) return
    const timer = window.setTimeout(() => setDateDraft(recommendedDefaultDateDraft), 0)
    return () => window.clearTimeout(timer)
  }, [actionMode, dateOptions.length, recommendedDefaultDateDraft])

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return []
    const query = mentionQuery.toLocaleLowerCase("es-ES")
    return participants.filter((item) => item.userId && item.userId !== me && (item.handle.toLocaleLowerCase("es-ES").startsWith(query) || item.displayName.toLocaleLowerCase("es-ES").includes(query))).slice(0, 4)
  }, [me, mentionQuery, participants])

  function focusComposerAfterSend() {
    const input = composerRef.current
    if (!input || effectiveReadOnly) return
    window.requestAnimationFrame(() => { input.focus({ preventScroll: true }); input.setSelectionRange(input.value.length, input.value.length); resizeMatchChatComposer(input) })
  }
  function openProposalMode(mode: Exclude<ActionMode, null>) {
    composerRef.current?.blur()
    setMentionQuery(null)
    setActionMode(mode)
    if (mode === "date" && !dateDraft) { dateDraftTouchedRef.current = false; setDateDraft(recommendedDefaultDateDraft ?? nextFullHourValue()) }
  }
  function toggleProposalMenu() {
    if (actionMode) { setActionMode(null); return }
    openProposalMode("menu")
  }
  function updateMentionQuery(value: string, cursor: number) {
    const matchToken = value.slice(0, cursor).match(/(?:^|\s)@([A-Za-z0-9_]*)$/)
    setMentionQuery(matchToken ? matchToken[1] : null)
  }
  function insertMention(participant: Participant) {
    const input = composerRef.current
    if (!input) return
    const cursor = input.selectionStart ?? body.length
    const before = body.slice(0, cursor)
    const matchToken = before.match(/(?:^|\s)@([A-Za-z0-9_]*)$/)
    if (!matchToken) return
    const tokenStart = cursor - matchToken[1].length - 1
    const next = `${body.slice(0, tokenStart)}@${participant.handle} ${body.slice(cursor)}`
    setBody(next)
    setMentionQuery(null)
  }
  function beginReplySwipe(event: React.PointerEvent<HTMLDivElement>, message: Message, messageKey: string) {
    if (effectiveReadOnly || message.id.startsWith("optimistic-") || (message.kind === "text" && Boolean(record(message.payload).systemType))) return
    swipeGestureRef.current = { key: messageKey, message, startX: event.clientX, startY: event.clientY, pointerId: event.pointerId }
  }
  function moveReplySwipe(event: React.PointerEvent<HTMLDivElement>) {
    const gesture = swipeGestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return
    const dx = event.clientX - gesture.startX, dy = event.clientY - gesture.startY
    if (dx <= 0 || Math.abs(dy) > Math.abs(dx)) { setSwipingMessage(null); return }
    setSwipingMessage({ key: gesture.key, offset: Math.min(56, dx) })
  }
  function endReplySwipe(event: React.PointerEvent<HTMLDivElement>) {
    const gesture = swipeGestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return
    const dx = event.clientX - gesture.startX, dy = event.clientY - gesture.startY
    swipeGestureRef.current = null
    setSwipingMessage(null)
    if (dx >= 44 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      setReplyingTo(gesture.message)
      setActionMode(null)
      window.requestAnimationFrame(() => composerRef.current?.focus({ preventScroll: true }))
    }
  }
  function cancelReplySwipe() { swipeGestureRef.current = null; setSwipingMessage(null) }

  async function post(kind: ChatKind, payload: unknown = {}, text = "", refocusComposer = false) {
    if (effectiveReadOnly) return false
    const source = record(payload), previousBody = body, previousReplyingTo = replyingTo, previousDateDraft = dateDraft, previousDateOptions = dateOptions, previousLocationDraft = locationDraft, clientId = createOptimisticClientId()
    const replyTo = payloadReplyReference({ replyTo: source.replyTo })
    const optimisticPayload = kind === "date_proposal" ? { clientId, options: (Array.isArray(source.options) ? source.options : []).map((startsAt, index) => ({ key: `date-${index + 1}`, startsAt: String(startsAt) })) } : kind === "location_proposal" ? { clientId, key: "location", name: String(source.name ?? ""), locationId: typeof source.locationId === "string" ? source.locationId : null } : { clientId, ...(replyTo ? { replyTo } : {}) }
    const optimisticId = `optimistic-${clientId}`, optimisticMessage: Message = { id: optimisticId, sender_user_id: me, sender_display_name: participants.find((item) => item.userId === me)?.displayName ?? "Tú", body: text, kind, payload: optimisticPayload, responses: [], created_at: new Date().toISOString() }
    pendingMessagesRef.current.set(optimisticId, optimisticMessage); knownMessageIdsRef.current.add(clientId); setEnteringMessageIds(new Set([clientId])); setMessages((current) => [...current, optimisticMessage]); setError(""); setMentionQuery(null); setActionMode(null)
    if (kind === "text") { setBody(""); setReplyingTo(null); if (composerRef.current) composerRef.current.style.height = "auto"; if (refocusComposer) focusComposerAfterSend() }
    if (kind === "date_proposal") { setDateDraft(""); setDateOptions([]) }
    if (kind === "location_proposal") setLocationDraft("")
    const response = await fetch(`/api/matches/${encodeURIComponent(id)}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text, kind, payload, clientId }) })
    const data = await response.json().catch(() => null)
    pendingMessagesRef.current.delete(optimisticId)
    if (response.ok) { const confirmed = data?.message as Message | undefined; setMessages((current) => { if (!confirmed) return current.filter((message) => message.id !== optimisticId); if (current.some((message) => message.id === confirmed.id)) return current.filter((message) => message.id !== optimisticId); return current.some((message) => message.id === optimisticId) ? current.map((message) => message.id === optimisticId ? confirmed : message) : [...current, confirmed] }); void loadFromServer(match) }
    else { setMessages((current) => current.filter((message) => message.id !== optimisticId)); if (kind === "text") { setBody((current) => current || previousBody); setReplyingTo((current) => current ?? previousReplyingTo) }; if (kind === "date_proposal") { setDateDraft(previousDateDraft); setDateOptions(previousDateOptions); setActionMode("date") }; if (kind === "location_proposal") { setLocationDraft(previousLocationDraft); setActionMode("location") }; if (data?.error === "match_chat_read_only" || data?.error === "season_finished_read_only") setReadOnly(true); setError(data?.error === "match_chat_rate_limited" ? "Demasiados mensajes seguidos. Espera unos segundos." : data?.error === "season_finished_read_only" ? "La temporada ha finalizado. El chat queda disponible solo para lectura." : data?.error === "match_chat_read_only" ? "El partido ya tiene resultado. El chat queda disponible solo para lectura." : chatErrorMessage(data?.error)) }
    return response.ok
  }

  function send(event: React.FormEvent) { event.preventDefault(); const text = body.trim(); const replyTo = replyingTo ? messageReplyReference(replyingTo) : null; if (text) void post("text", replyTo ? { replyTo } : {}, text, true) }
  function toggleDateOption(day: string, time: string) {
    dateDraftTouchedRef.current = true
    const localValue = `${day}T${time}`
    const iso = new Date(localValue).toISOString()
    setDateDraft(localValue)
    setDateOptions((current) => current.includes(iso) ? current.filter((item) => item !== iso) : current.length < 4 ? [...current, iso] : current)
  }
  function removeDateOption(iso: string) { setDateOptions((current) => current.filter((item) => item !== iso)) }
  function selectManualDateOption(time: string) {
    if (!time) return
    dateDraftTouchedRef.current = true
    const localValue = `${selectedProposalDate}T${time}`
    const iso = new Date(localValue).toISOString()
    setDateDraft(localValue)
    setDateOptions((current) => current.includes(iso) || current.length >= 4 ? current : [...current, iso])
  }
  function sendDates() { const options = dateOptions; if (options.length) void post("date_proposal", { options }) }
  function sendLocation() { const known = activeLeague.locations.find((item) => item.id === locationDraft); const name = known ? getLeagueLocationOptionLabel(known) : locationDraft.trim(); if (name) void post("location_proposal", { name, locationId: known?.id ?? null }) }
  async function respond(messageId: string, optionKey: string, responseValue: "available" | "unavailable") {
    if (effectiveReadOnly) return
    const original = messages.find((message) => message.id === messageId)?.responses.find((item) => item.userId === me && item.optionKey === optionKey) ?? null
    const removingVote = original?.response === responseValue
    const participant = participants.find((item) => item.userId === me), optimisticResponse: ProposalResponse = { userId: me, playerId: participant?.playerId ?? null, displayName: participant?.displayName ?? "Tú", optionKey, response: responseValue, updatedAt: new Date().toISOString() }
    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, responses: [...message.responses.filter((item) => !(item.userId === me && item.optionKey === optionKey)), ...(removingVote ? [] : [optimisticResponse])] } : message)); setError("")
    const response = await fetch(`/api/matches/${encodeURIComponent(id)}/chat`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId, optionKey, response: responseValue }) })
    const data = await response.json().catch(() => null)
    if (response.ok) void loadFromServer(match)
    else { setMessages((current) => current.map((message) => { if (message.id !== messageId) return message; const mine = message.responses.find((item) => item.userId === me && item.optionKey === optionKey); if (!removingVote && mine?.response !== responseValue) return message; return { ...message, responses: [...message.responses.filter((item) => !(item.userId === me && item.optionKey === optionKey)), ...(original ? [original] : [])] } })); if (data?.error === "match_chat_read_only" || data?.error === "season_finished_read_only") setReadOnly(true); else setError(chatErrorMessage(data?.error)) }
  }

  function optionHasAgreement(message: Message, optionKey: string) { const linked = participants.filter((item) => item.userId).length; const yes = new Set(message.responses.filter((item) => item.optionKey === optionKey && item.response === "available").map((item) => item.userId)).size; return participants.length > 0 && linked === participants.length && yes === linked }

  function participantProfileHref(participant: Participant | null | undefined) {
    if (!participant?.playerId) return null
    const player = players.find((item) => item.id === participant.playerId)
    return `/player/${player?.slug ?? participant.playerId}`
  }

  function participantNameLink(participant: Participant, compact = false) {
    const href = participantProfileHref(participant)
    const label = compact ? participant.displayName.trim().split(/\s+/)[0] || participant.displayName : participant.displayName
    return href ? <Link href={href} onClick={(event) => event.stopPropagation()} className="font-black underline-offset-2 active:underline">{label}</Link> : <span className="font-black">{label}</span>
  }

  function proposalVoteDetail(message: Message, optionKey: string) {
    const responseByUser = new Map(message.responses.filter((item) => item.optionKey === optionKey).map((item) => [item.userId, item.response]))
    const voters = (response: "available" | "unavailable" | null) => participants.filter((item) => item.userId && (response === null ? !responseByUser.has(item.userId) : responseByUser.get(item.userId) === response))
    return { yes: voters("available"), no: voters("unavailable"), pending: voters(null) }
  }

  function participantList(items: Participant[]) {
    return <>{items.map((item, index) => <span key={item.playerId || item.userId || item.displayName}>{index ? ", " : ""}{participantNameLink(item, true)}</span>)}</>
  }

  function proposalVoteDetailRows(message: Message, optionKey: string) {
    const detail = proposalVoteDetail(message, optionKey)
    return <div className="mt-1 space-y-0.5 type-caption font-semibold text-neutral-500">{detail.yes.length ? <p><span className="font-black text-emerald-700">✓</span> {participantList(detail.yes)}</p> : null}{detail.no.length ? <p><span className="font-black text-red-600">✕</span> {participantList(detail.no)}</p> : null}{detail.pending.length ? <p><span className="font-black text-neutral-400">·</span> Pendiente: {participantList(detail.pending)}</p> : null}</div>
  }

  function proposalControls(message: Message, optionKey: string) {
    const optionResponses = message.responses.filter((item) => item.optionKey === optionKey)
    const mine = optionResponses.find((item) => item.userId === me)?.response
    const yes = optionResponses.filter((item) => item.response === "available").length
    const no = optionResponses.filter((item) => item.response === "unavailable").length
    if (effectiveReadOnly) return <div className="shrink-0 type-caption font-black text-neutral-500">✓ {yes} · ✕ {no}</div>
    const idleVoteClass = "border-neutral-200 bg-white text-neutral-500"
    return <div className="flex shrink-0 items-center gap-1.5"><button type="button" aria-pressed={mine === "available"} onClick={(event) => { event.stopPropagation(); void respond(message.id, optionKey, "available") }} aria-label={`${mine === "available" ? "Quitar mi voto favorable" : "Me viene bien"} · ${yes} votos`} title={mine === "available" ? "Quitar voto" : "Me viene bien"} className={`inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full border px-2 transition active:scale-95 ${mine === "available" ? "border-emerald-600 bg-emerald-600 text-white" : idleVoteClass}`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m5 12 4 4L19 6" /></svg><span className="type-caption font-black">{yes}</span></button><button type="button" aria-pressed={mine === "unavailable"} onClick={(event) => { event.stopPropagation(); void respond(message.id, optionKey, "unavailable") }} aria-label={`${mine === "unavailable" ? "Quitar mi voto negativo" : "No puedo"} · ${no} votos`} title={mine === "unavailable" ? "Quitar voto" : "No puedo"} className={`inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full border px-2 transition active:scale-95 ${mine === "unavailable" ? "border-red-600 bg-red-600 text-white" : idleVoteClass}`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-5 w-5"><path d="m6 6 12 12M18 6 6 18" /></svg><span className="type-caption font-black">{no}</span></button></div>
  }

  const replyingParticipant = replyingTo ? participants.find((item) => item.userId === replyingTo.sender_user_id) : null
  const replyingHref = participantProfileHref(replyingParticipant)

  return (
    <MatchChatFrame viewportRef={viewportRef} backHref={`/match/${id}`} title={matchRound ? `Chat · Jornada ${matchRound}` : "Chat del partido"} titleHref={`/match/${id}`}>
      {SHOW_MATCH_TEAMS_PANEL && match ? <div className="shrink-0 px-3 pt-2"><div className="rounded-2xl border border-neutral-200 bg-white p-2.5 shadow-sm"><MatchTeamsPanel teamA={match.teamA} teamB={match.teamB} players={players} mode="versus" linkPlayers={false} /></div></div> : null}
      <div data-tour="chat-messages" className="flex min-h-0 flex-1 flex-col overflow-hidden bg-neutral-100" style={{ visibility: initialLoadComplete ? "visible" : "hidden" }}>{reservationSummary ? <div className="flex shrink-0 items-center gap-1.5 border-b border-blue-100 bg-blue-50 px-3 py-1.5 text-blue-900"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0"><path d="M12 17v5" /><path d="m5 3 14 0" /><path d="m7 3 1.5 8-3 3h13l-3-3L17 3" /></svg><p className="min-w-0 flex-1 truncate type-caption font-black" title={`${reservationSummaryDate(reservationSummary.scheduledAt)} · ${reservationSummary.locationText}`}><span className="uppercase tracking-wide text-blue-700">Reserva</span> · {reservationSummaryDate(reservationSummary.scheduledAt)} · {reservationSummary.locationText}</p></div> : null}{!effectiveReadOnly && !hasConfirmedReservation && displayedCoordination?.status === "awaiting_booking" ? <MatchReservationConfirmation matchId={id} coordination={displayedCoordination} locations={activeLeague.locations} participantIds={participants.map((item) => item.playerId)} players={players} requireReservationPayments currentPlayerId={participants.find((item) => item.userId === me)?.playerId ?? ""} onConfirmed={() => loadFromServer(match)} onInvalidated={async () => { await loadFromServer(match); openProposalMode("date") }} /> : null}<div ref={messagesRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
        {initialLoadComplete && messages.length === 0 && !error ? <p className="py-16 text-center text-sm font-semibold text-neutral-500">Todavía no hay mensajes. Escribe para organizar el partido.</p> : null}
        <div>
          {messages.map((message, index) => {
            const mine = message.sender_user_id === me || message.id.startsWith("optimistic-"), payload = record(message.payload), systemMessage = message.kind === "text" && Boolean(payload.systemType), previous = messages[index - 1]
            const previousSameSender = !systemMessage && previous && !(previous.kind === "text" && record(previous.payload).systemType) && previous.sender_user_id === message.sender_user_id, messageKey = chatMessageKey(message), rowSpacing = index ? previousSameSender ? "mt-px" : "mt-1.5" : "", enterClass = enteringMessageIds.has(messageKey) ? "chat-message-enter" : ""
            const sender = participants.find((item) => item.userId === message.sender_user_id), senderColor = getMatchChatParticipantColorClass(message.sender_user_id, participants), avatarSlot = !mine ? <span className="flex h-7 w-7 shrink-0 items-start">{!previousSameSender ? <PlayerAvatar player={{ displayName: sender?.displayName ?? message.sender_display_name, avatarUrl: sender?.avatarUrl ?? null }} size="sm" /> : null}</span> : null
            const quotedReply = payloadReplyReference(payload), swipeOffset = swipingMessage?.key === messageKey ? swipingMessage.offset : 0, replyGestureProps = systemMessage ? {} : { onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => beginReplySwipe(event, message, messageKey), onPointerMove: moveReplySwipe, onPointerUp: endReplySwipe, onPointerCancel: cancelReplySwipe, style: { touchAction: "pan-y", transform: swipeOffset ? `translateX(${swipeOffset}px)` : undefined, transition: swipeOffset ? "none" : "transform 120ms ease-out" } }
            if (message.kind === "text" && payload.systemType === "reservation_agreement_invalidated") {
              return <div key={messageKey} className={`flex justify-center ${rowSpacing} ${enterClass}`}><div className="w-[96%] rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 text-center"><p className="type-caption font-black text-amber-800">Fecha/hora acordada descartada</p><p className="mt-0.5 type-caption font-semibold text-amber-700">Hay que hacer una nueva propuesta de fecha y hora.</p></div></div>
            }
            if (message.kind === "text" && payload.systemType === "reservation_confirmed") {
              const scheduledAt = typeof payload.scheduledAt === "string" ? payload.scheduledAt : null
              const locationText = typeof payload.locationText === "string" ? payload.locationText : null
              return <div key={messageKey} className={`flex justify-center ${rowSpacing} ${enterClass}`}><div className="w-[96%] rounded-2xl border border-emerald-200 bg-emerald-50 p-2.5 text-neutral-950 shadow-sm"><p className="type-caption font-black uppercase tracking-[0.14em] text-emerald-700">Partido programado</p><p className="mt-1 text-sm font-black">{scheduledAt ? proposalDate(scheduledAt) : String(payload.dateLabel ?? "")}</p><p className="mt-0.5 text-xs font-bold text-neutral-600">{locationText ?? "Pista reservada"}</p>{match && scheduledAt ? <div className="mt-2"><AddToCalendarButton leagueName={activeLeague.name} seasonName={activeSeason.name} round={matchRound ?? match.round} teamA={match.teamA} teamB={match.teamB} players={players} scheduledAt={scheduledAt} location={typeof payload.location === "string" ? payload.location : locationText} /></div> : null}</div></div>
            }
            if (message.kind !== "text") {
              const proposalExpanded = expandedProposalId === message.id
              const locationKey = String(payload.key ?? "location"), locationDetailKey = `${message.id}:${locationKey}`, locationExpanded = proposalExpanded || expandedProposalOptionKey === locationDetailKey, locationAgreed = optionHasAgreement(message, locationKey)
              const senderHref = participantProfileHref(sender)
              return <div key={messageKey} {...replyGestureProps} className={`flex items-start gap-1 ${mine ? "justify-end" : "justify-start"} ${rowSpacing} ${enterClass}`}>{avatarSlot}<div className={`w-[90%] rounded-2xl p-2.5 shadow-sm ${mine ? "border border-transparent bg-clip-padding bg-neutral-950" : "border border-neutral-200 bg-white text-neutral-950"} ${!previousSameSender ? mine ? "rounded-tr-md" : "rounded-tl-md" : ""}`}>{!mine && !previousSameSender ? senderHref ? <Link href={senderHref} onClick={(event) => event.stopPropagation()} className={`block w-fit max-w-full truncate type-caption font-black underline-offset-2 active:underline ${senderColor}`}>{message.sender_display_name}</Link> : <p className={`truncate type-caption font-black ${senderColor}`}>{message.sender_display_name}</p> : null}<button type="button" aria-expanded={proposalExpanded} onClick={(event) => { event.stopPropagation(); setExpandedProposalOptionKey(null); setExpandedProposalId((current) => current === message.id ? null : message.id) }} className={`flex w-full items-start justify-between gap-3 text-left ${mine ? "bg-neutral-950 text-white" : "text-neutral-950"}`}><div className="min-w-0"><p className="text-sm font-black">{message.kind === "date_proposal" ? "Propuesta de fecha" : "Propuesta de ubicación"}</p><p className={`type-caption font-semibold ${mine ? "text-neutral-300" : "text-neutral-400"}`}>Toca para ver quién ha votado</p></div><span className="shrink-0"><span className={`inline-flex whitespace-nowrap leading-none ${mine ? "text-neutral-300" : "text-neutral-400"}`}><span className="origin-right scale-90 type-caption">{new Date(message.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}{mine ? <MatchChatMessageReceipt message={message} me={me} participants={participants} pending={message.id.startsWith("optimistic-")} /> : null}</span></span></span></button>{message.kind === "date_proposal" ? <div className="mt-1.5 space-y-1.5">{(Array.isArray(payload.options) ? payload.options : []).map((raw) => { const option = record(raw); const key = String(option.key ?? ""); const startsAt = String(option.startsAt ?? ""); const invalidated = option.invalidated === true; const detailKey = `${message.id}:${key}`, optionExpanded = proposalExpanded || expandedProposalOptionKey === detailKey; return key && startsAt ? <div key={key} className={`flex items-start gap-2 rounded-xl px-2.5 py-1.5 text-neutral-950 ${invalidated ? "bg-neutral-100 opacity-70" : "bg-neutral-50"}`}><div className="min-w-0 flex-1"><button type="button" aria-expanded={optionExpanded} onClick={(event) => { event.stopPropagation(); setExpandedProposalOptionKey((current) => current === detailKey ? null : detailKey) }} className="block w-full text-left"><span className={`block text-sm font-bold ${invalidated ? "line-through text-neutral-500" : ""}`}>{proposalVoteDate(startsAt)}</span>{invalidated ? <span className="mt-0.5 inline-flex rounded-full bg-neutral-200 px-1.5 py-px type-caption font-black uppercase tracking-wide text-neutral-600">Descartada</span> : optionHasAgreement(message, key) ? <span className="mt-0.5 inline-flex rounded-full bg-emerald-100 px-1.5 py-px type-caption font-black uppercase tracking-wide text-emerald-700">Acuerdo 4/4</span> : null}</button>{optionExpanded ? proposalVoteDetailRows(message, key) : null}</div>{invalidated ? <span className="shrink-0 type-caption font-black text-neutral-500">Nueva propuesta</span> : proposalControls(message, key)}</div> : null })}</div> : <div className="mt-1.5 flex items-start gap-2 rounded-xl bg-neutral-50 px-2.5 py-1.5 text-neutral-950"><div className="min-w-0 flex-1"><button type="button" aria-expanded={locationExpanded} onClick={(event) => { event.stopPropagation(); setExpandedProposalOptionKey((current) => current === locationDetailKey ? null : locationDetailKey) }} className={`flex min-h-10 w-full flex-col text-left ${locationAgreed ? "items-start justify-start" : "justify-center"}`}><span className="block text-sm font-bold">{String(payload.name ?? "Ubicación propuesta")}</span>{locationAgreed ? <span className="mt-0.5 inline-flex rounded-full bg-emerald-100 px-1.5 py-px type-caption font-black uppercase tracking-wide text-emerald-700">Acuerdo 4/4</span> : null}</button>{locationExpanded ? proposalVoteDetailRows(message, locationKey) : null}</div>{proposalControls(message, locationKey)}</div>}</div></div>
            }
            const senderHref = participantProfileHref(sender)
            const quotedOriginal = quotedReply ? messages.find((item) => item.id === quotedReply.messageId) : null
            const quotedParticipant = quotedReply ? (quotedOriginal ? participants.find((item) => item.userId === quotedOriginal.sender_user_id) : participants.find((item) => item.displayName === quotedReply.senderDisplayName)) : null
            const quotedHref = participantProfileHref(quotedParticipant)
            return <MatchChatTextMessage key={messageKey} message={message} me={me} participants={participants} previousSameSender={Boolean(previousSameSender)} senderHref={senderHref} quotedReply={quotedReply ? { senderDisplayName: quotedReply.senderDisplayName, body: quotedReply.body, href: quotedHref } : null} bodyContent={<MentionText body={message.body} participants={participants} />} pending={message.id.startsWith("optimistic-")} rowClassName={`${rowSpacing} ${enterClass}`} gestureProps={replyGestureProps} />
          })}
        </div>
      </div></div>
      {error ? <p className="mx-3 mt-2 shrink-0 rounded-xl bg-red-50 px-3 py-2 type-caption font-bold text-red-700">{error}</p> : null}
      {effectiveReadOnly ? <MatchChatReadOnlyBar>{playerSeasonReadOnly ? "Temporada pendiente · Chat en modo lectura" : "Partido finalizado · Chat en modo lectura"}</MatchChatReadOnlyBar> : <>
        {mentionSuggestions.length ? <div className="mx-3 mt-2 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">{mentionSuggestions.map((item) => <button key={item.playerId} type="button" onClick={() => insertMention(item)} className="flex w-full items-center gap-2 border-b border-neutral-100 px-3 py-2 text-left last:border-b-0"><span className="min-w-0 flex-1 truncate text-sm font-black">{item.displayName}</span><span className="type-caption font-bold text-neutral-400">@{item.handle}</span></button>)}</div> : null}
        {actionMode && !matchFinished ? <div className="mx-3 mt-2 shrink-0 rounded-2xl border border-neutral-200 bg-white p-3 shadow-lg">
          {actionMode === "menu" ? <div><p className="mb-2 type-caption font-black uppercase tracking-[0.14em] text-neutral-400">Adjuntar al chat</p><div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => openProposalMode("date")} className="group flex min-h-20 items-center gap-3 rounded-2xl border border-neutral-200 bg-stone-50 px-3 py-3 text-left transition active:scale-[0.98]"><span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-950 shadow-sm"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M7 2v3M17 2v3M3.5 9h17" /><rect x="3.5" y="4" width="17" height="17" rx="3" /></svg></span><span className="min-w-0"><span className="block text-sm font-black">Fecha</span><span className="mt-0.5 block type-caption font-bold leading-tight text-neutral-500">Propón horarios</span></span></button>
            <button type="button" onClick={() => openProposalMode("location")} className="group flex min-h-20 items-center gap-3 rounded-2xl border border-neutral-200 bg-stone-50 px-3 py-3 text-left transition active:scale-[0.98]"><span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-950 shadow-sm"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg></span><span className="min-w-0"><span className="block text-sm font-black">Ubicación</span><span className="mt-0.5 block type-caption font-bold leading-tight text-neutral-500">Propón una pista</span></span></button>
          </div></div> : null}
          {actionMode === "date" ? <div>
            <div className="flex items-center gap-2"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 text-white"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M7 2v3M17 2v3M3.5 9h17" /><rect x="3.5" y="4" width="17" height="17" rx="3" /></svg></span><div className="min-w-0 flex-1"><p className="text-sm font-black">Proponer fecha</p><p className="type-caption font-semibold text-neutral-500">Selecciona un día de las próximas dos semanas</p></div><button type="button" onClick={() => { setActionMode(null); setDateDraft(""); setDateOptions([]) }} className="flex items-center justify-center rounded-full bg-neutral-100 px-2.5 py-1 text-center type-caption font-black text-neutral-600">Cerrar</button></div>
            <div className="mt-3 grid grid-cols-7 gap-1">{proposalCalendarDays.map((day) => { const selectedCount = dateOptions.filter((item) => localDateValue(new Date(item)) === day).length; return <button key={day} type="button" onClick={() => { dateDraftTouchedRef.current = true; const recommendedTime = availabilityRecommendations.find((item) => item.date === day)?.start; setDateDraft(`${day}T${recommendedTime ?? selectedProposalTime}`) }} className={`relative flex min-h-12 flex-col items-center justify-center rounded-xl border px-1 py-1.5 text-center transition active:scale-[0.98] ${selectedProposalDate === day ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-stone-50 text-neutral-700"}`}><span className="type-caption font-black">{calendarWeekday(day)}</span><span className="text-sm font-black leading-none">{calendarDayNumber(day)}</span>{selectedCount ? <span className={`absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 type-caption font-black leading-none ${selectedProposalDate === day ? "bg-white text-neutral-950" : "bg-neutral-950 text-white"}`}>{selectedCount}</span> : null}</button> })}</div>
            {selectedDayRecommendedTimes.length ? <div className="mt-3"><p className="mb-1 type-caption font-black uppercase tracking-wide text-neutral-400">Horarios compatibles</p><div className="flex flex-wrap gap-1.5">{selectedDayRecommendedTimes.map((time) => { const iso = new Date(`${selectedProposalDate}T${time}`).toISOString(); const chosen = dateOptions.includes(iso); return <button key={time} type="button" aria-pressed={chosen} onClick={() => toggleDateOption(selectedProposalDate, time)} className={`rounded-full border px-2.5 py-1 type-caption font-black transition active:scale-[0.97] ${chosen ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-600"}`}>{chosen ? "✓ " : ""}{time}</button> })}</div></div> : null}
            <div className="mt-3"><label className="block"><span className="mb-1 block type-caption font-black uppercase tracking-wide text-neutral-500">Otra hora</span><input type="time" value={selectedProposalTime} onChange={(event) => selectManualDateOption(event.target.value)} className={`h-10 w-full rounded-xl border px-3 text-sm font-bold outline-none transition ${selectedProposalTimeIsChosen ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-stone-50 focus:border-neutral-400"}`} /></label></div>
            {availabilityConfigured ? <p className="mt-2 type-caption font-semibold text-neutral-500">Toca uno o varios horarios compatibles. También puedes elegir cualquier otra hora.</p> : null}
            {dateOptions.length ? <div className="mt-2 flex flex-wrap gap-1">{dateOptions.map((item) => { const date = new Date(item); const label = `${calendarWeekday(localDateValue(date))} ${date.getDate()} · ${localTimeValue(date)}`; return <button key={item} type="button" onClick={() => removeDateOption(item)} aria-label={`Quitar ${label}`} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 type-caption font-black text-neutral-600">{label}<span aria-hidden="true">×</span></button> })}</div> : null}
            <div className="mt-2 flex items-center justify-between gap-2"><p className="type-caption font-black text-neutral-700">{dateOptions.length ? `${dateOptions.length} fecha${dateOptions.length === 1 ? "" : "s"} seleccionada${dateOptions.length === 1 ? "" : "s"}` : "Selecciona hasta 4 fechas"}</p>{dateOptions.length >= 4 ? <span className="type-caption font-bold text-neutral-400">Máximo 4</span> : null}</div>
            <button type="button" disabled={!dateOptions.length} onClick={() => void sendDates()} className="mt-3 flex w-full items-center justify-center rounded-xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white disabled:opacity-40">{dateOptions.length === 1 ? "Proponer esta fecha" : `Proponer ${dateOptions.length} fechas`}</button>
          </div> : null}
          {actionMode === "location" ? <div>
            <div className="flex items-center gap-2"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 text-white"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg></span><p className="flex-1 text-sm font-black">Proponer ubicación</p><button type="button" onClick={() => { setActionMode(null); setLocationDraft("") }} className="flex items-center justify-center rounded-full bg-neutral-100 px-2.5 py-1 text-center type-caption font-black text-neutral-600">Cerrar</button></div>
            {locationOptions.length ? <div className="mt-3 grid max-h-32 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">{locationOptions.map((location) => <button key={location.id} type="button" onClick={() => setLocationDraft(location.id)} className={`whitespace-normal break-words rounded-xl border px-2.5 py-2 text-left text-xs font-black leading-tight transition ${locationDraft === location.id ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-stone-50 text-neutral-700"}`}>{getLeagueLocationOptionLabel(location)}</button>)}</div> : null}
            <div className="mt-2"><input value={activeLeague.locations.some((item) => item.id === locationDraft) ? "" : locationDraft} onChange={(event) => setLocationDraft(event.target.value)} placeholder="Otra ubicación…" className="w-full rounded-xl border border-neutral-200 bg-stone-50 px-3 py-2 text-sm font-bold outline-none placeholder:text-neutral-400 focus:border-neutral-400" /></div>
            <button type="button" disabled={!locationDraft.trim()} onClick={() => void sendLocation()} className="mt-3 flex w-full items-center justify-center rounded-xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white disabled:opacity-40">Enviar propuesta</button>
          </div> : null}
        </div> : null}
        {matchFinished && !effectiveReadOnly ? <MatchChatWriteWindowBanner writeUntil={writeUntil} /> : null}
        {replyingTo ? <div className="flex shrink-0 items-center gap-2 border-t border-neutral-200 bg-white px-3 py-1.5"><div className="min-w-0 flex-1 border-l-2 border-indigo-400 pl-2"><p className="truncate type-caption font-black text-indigo-600">Responder a {replyingHref ? <Link href={replyingHref} className="underline-offset-2 active:underline">{replyingTo.sender_display_name}</Link> : replyingTo.sender_display_name}</p><p className="truncate type-caption font-semibold text-neutral-500">{messageReplyLabel(replyingTo)}</p></div><button type="button" aria-label="Cancelar respuesta" onClick={() => setReplyingTo(null)} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-center type-small font-black text-neutral-500">×</button></div> : null}
        <MatchChatComposer body={body} composerRef={composerRef} onSubmit={send} onBodyChange={(value, element) => { setBody(value); resizeMatchChatComposer(element); updateMentionQuery(value, element.selectionStart ?? value.length) }} onTextareaClick={(event) => updateMentionQuery(event.currentTarget.value, event.currentTarget.selectionStart ?? event.currentTarget.value.length)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); if (mentionSuggestions[0]) insertMention(mentionSuggestions[0]); else event.currentTarget.form?.requestSubmit() } }} hasTopAttachment={Boolean(replyingTo)} leadingAction={!matchFinished ? <button type="button" data-tour="chat-proposals" aria-label="Adjuntar propuesta" title="Proponer fecha o ubicación" onClick={toggleProposalMenu} className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${actionMode ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-700"}`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m20.5 11.5-8.8 8.8a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" /></svg></button> : null} />
      </>}
    </MatchChatFrame>
  )
}
