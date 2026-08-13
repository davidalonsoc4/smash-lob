"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { MatchTeamsPanel } from "@/components/matches/MatchTeamsPanel"
import { BackButton } from "@/components/ui/BackButton"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"

type ChatKind = "text" | "date_proposal" | "location_proposal"
type ProposalResponse = { userId: string; playerId: string | null; displayName: string; optionKey: string; response: "available" | "unavailable"; updatedAt: string }
type Message = { id: string; sender_user_id: string; sender_display_name: string; body: string; kind: ChatKind; payload: unknown; responses: ProposalResponse[]; created_at: string }
type Participant = { playerId: string; userId: string | null; displayName: string; handle: string }
type ActionMode = null | "menu" | "date" | "location"

const chatErrorMessage = (error?: string) => error === "match_chat_unavailable" ? "El chat todavía no está disponible en este entorno." : error ?? "No se ha podido cargar el chat."
const record = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
const proposalDate = (value: string) => new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))

function MentionText({ body, participants }: { body: string; participants: Participant[] }) {
  const handles = new Set(participants.filter((item) => item.userId).map((item) => item.handle.toLocaleLowerCase("es-ES")))
  return <>{body.split(/(@[A-Za-z0-9_]+)/g).map((part, index) => handles.has(part.slice(1).toLocaleLowerCase("es-ES")) ? <span key={`${part}-${index}`} className="font-black underline decoration-2 underline-offset-2">{part}</span> : part)}</>
}

export default function MatchChatPage() {
  const id = String(useParams<{ id: string }>().id)
  const { matches, players, activeLeague } = useCurrentLeagueData()
  const match = matches.find((item) => item.id === id)
  const [messages, setMessages] = useState<Message[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [me, setMe] = useState("")
  const [round, setRound] = useState<number | null>(null)
  const [body, setBody] = useState("")
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const [responding, setResponding] = useState("")
  const [readOnly, setReadOnly] = useState(false)
  const [actionMode, setActionMode] = useState<ActionMode>(null)
  const [dateDraft, setDateDraft] = useState("")
  const [dateOptions, setDateOptions] = useState<string[]>([])
  const [locationDraft, setLocationDraft] = useState("")
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const matchRound = match?.round ?? round

  const load = useCallback(async () => {
    const response = await fetch(`/api/matches/${encodeURIComponent(id)}/chat`, { cache: "no-store" })
    const data = await response.json().catch(() => null)
    if (!response.ok) { setError(chatErrorMessage(data?.error)); return }
    setMessages(data.messages ?? [])
    setParticipants(data.participants ?? [])
    setMe(data.currentUserId ?? "")
    setRound(data.round ?? null)
    setReadOnly(Boolean(data.readOnly))
    setError("")
  }, [id])

  useEffect(() => {
    const initialTimer = window.setTimeout(() => { void load() }, 0)
    const pollingTimer = window.setInterval(() => { if (!document.hidden) void load() }, 2500)
    return () => { window.clearTimeout(initialTimer); window.clearInterval(pollingTimer) }
  }, [load])

  useEffect(() => {
    const panel = messagesRef.current
    if (panel) panel.scrollTo({ top: panel.scrollHeight, behavior: "smooth" })
  }, [messages.length])

  useEffect(() => {
    const root = viewportRef.current
    if (!root) return
    const visualViewport = window.visualViewport
    const html = document.documentElement
    const pageBody = document.body
    const previousHtmlOverflow = html.style.overflow
    const previousBodyOverflow = pageBody.style.overflow
    const previousBodyOverscroll = pageBody.style.overscrollBehavior
    const previousMatchChatActive = html.dataset.matchChatActive
    let restingViewportHeight = visualViewport?.height ?? window.innerHeight
    html.dataset.matchChatActive = "true"
    html.style.overflow = "hidden"
    pageBody.style.overflow = "hidden"
    pageBody.style.overscrollBehavior = "none"
    const syncViewport = (keepLatestVisible = false, forceComposerFocused = false) => {
      const visibleHeight = visualViewport?.height ?? window.innerHeight
      const visibleTop = visualViewport?.offsetTop ?? 0
      const composerFocused = forceComposerFocused || document.activeElement === composerRef.current
      if (!composerFocused) restingViewportHeight = visibleHeight
      const keyboardLikelyOpen = composerFocused && restingViewportHeight - visibleHeight > 120
      root.style.height = `${Math.round(visibleHeight)}px`
      root.style.top = `${Math.round(visibleTop)}px`
      root.style.setProperty("--match-chat-bottom-inset", keyboardLikelyOpen ? "0px" : "env(safe-area-inset-bottom, 0px)")
      if (keepLatestVisible) window.requestAnimationFrame(() => { const panel = messagesRef.current; if (panel) panel.scrollTop = panel.scrollHeight })
    }
    const handleViewportResize = () => syncViewport(true)
    const handleViewportScroll = () => syncViewport(false)
    const composer = composerRef.current
    const focusTimers: number[] = []
    const handleComposerFocus = () => {
      restingViewportHeight = Math.max(restingViewportHeight, window.innerHeight, visualViewport?.height ?? 0)
      syncViewport(true, true)
      for (const delay of [0, 80, 180, 320]) focusTimers.push(window.setTimeout(() => syncViewport(true, true), delay))
    }
    syncViewport(false)
    visualViewport?.addEventListener("resize", handleViewportResize)
    visualViewport?.addEventListener("scroll", handleViewportScroll)
    window.addEventListener("resize", handleViewportResize)
    composer?.addEventListener("focus", handleComposerFocus)
    return () => {
      visualViewport?.removeEventListener("resize", handleViewportResize)
      visualViewport?.removeEventListener("scroll", handleViewportScroll)
      window.removeEventListener("resize", handleViewportResize)
      composer?.removeEventListener("focus", handleComposerFocus)
      focusTimers.forEach((timer) => window.clearTimeout(timer))
      html.style.overflow = previousHtmlOverflow
      pageBody.style.overflow = previousBodyOverflow
      pageBody.style.overscrollBehavior = previousBodyOverscroll
      if (previousMatchChatActive === undefined) delete html.dataset.matchChatActive
      else html.dataset.matchChatActive = previousMatchChatActive
    }
  }, [])

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return []
    const query = mentionQuery.toLocaleLowerCase("es-ES")
    return participants.filter((item) => item.userId && item.userId !== me && (item.handle.toLocaleLowerCase("es-ES").startsWith(query) || item.displayName.toLocaleLowerCase("es-ES").includes(query))).slice(0, 4)
  }, [me, mentionQuery, participants])

  function resizeComposer(target: HTMLTextAreaElement) { target.style.height = "auto"; target.style.height = `${Math.min(target.scrollHeight, 128)}px` }
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
    const nextCursor = tokenStart + participant.handle.length + 2
    setBody(next)
    setMentionQuery(null)
    window.setTimeout(() => { input.focus(); input.setSelectionRange(nextCursor, nextCursor); resizeComposer(input) }, 0)
  }

  async function post(kind: ChatKind, payload: unknown = {}, text = "") {
    if (sending || readOnly) return false
    setSending(true)
    const response = await fetch(`/api/matches/${encodeURIComponent(id)}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text, kind, payload }) })
    const data = await response.json().catch(() => null)
    if (response.ok) {
      setBody("")
      setMentionQuery(null)
      setActionMode(null)
      if (composerRef.current) composerRef.current.style.height = "auto"
      await load()
    } else {
      if (data?.error === "match_chat_read_only") setReadOnly(true)
      setError(data?.error === "match_chat_rate_limited" ? "Demasiados mensajes seguidos. Espera unos segundos." : data?.error === "match_chat_read_only" ? "El partido ya tiene resultado. El chat queda disponible solo para lectura." : chatErrorMessage(data?.error))
    }
    setSending(false)
    return response.ok
  }

  async function send(event: React.FormEvent) { event.preventDefault(); const text = body.trim(); if (text) await post("text", {}, text) }
  async function sendDates() {
    const options = [...dateOptions, dateDraft ? new Date(dateDraft).toISOString() : ""].filter(Boolean)
    if (!options.length) return
    if (await post("date_proposal", { options })) { setDateDraft(""); setDateOptions([]) }
  }
  async function sendLocation() {
    const known = activeLeague.locations.find((item) => item.id === locationDraft)
    const name = known?.name ?? locationDraft.trim()
    if (!name) return
    if (await post("location_proposal", { name, locationId: known?.id ?? null })) setLocationDraft("")
  }
  async function respond(messageId: string, optionKey: string, responseValue: "available" | "unavailable") {
    const key = `${messageId}:${optionKey}`
    if (responding || readOnly) return
    setResponding(key)
    const response = await fetch(`/api/matches/${encodeURIComponent(id)}/chat`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId, optionKey, response: responseValue }) })
    const data = await response.json().catch(() => null)
    if (response.ok) await load()
    else if (data?.error === "match_chat_read_only") setReadOnly(true)
    else setError(chatErrorMessage(data?.error))
    setResponding("")
  }

  function proposalControls(message: Message, optionKey: string) {
    const optionResponses = message.responses.filter((item) => item.optionKey === optionKey)
    const mine = optionResponses.find((item) => item.userId === me)?.response
    const yes = optionResponses.filter((item) => item.response === "available").length
    const no = optionResponses.filter((item) => item.response === "unavailable").length
    return <div className="mt-1.5 flex items-center gap-1.5"><span className="mr-auto type-caption font-bold text-neutral-500">✓ {yes} · ✕ {no}</span>{!readOnly ? <><button type="button" disabled={Boolean(responding)} onClick={() => void respond(message.id, optionKey, "available")} className={`rounded-full px-2 py-1 type-caption font-black ${mine === "available" ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-700"}`}>Me viene bien</button><button type="button" disabled={Boolean(responding)} onClick={() => void respond(message.id, optionKey, "unavailable")} className={`rounded-full px-2 py-1 type-caption font-black ${mine === "unavailable" ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-700"}`}>No puedo</button></> : null}</div>
  }

  return (
    <div ref={viewportRef} className="fixed inset-x-0 top-0 z-[60] mx-auto flex w-full max-w-md min-h-0 flex-col overflow-hidden bg-stone-50" style={{ height: "100dvh" }}>
      <header className="app-page-header shrink-0 border-b border-neutral-200 bg-stone-50 px-3 pb-2" style={{ paddingTop: "max(10px, env(safe-area-inset-top, 0px))" }}>
        <div className="relative flex min-h-10 items-center"><BackButton fallbackHref={`/match/${id}`} label="Volver" /><h1 className="type-page-title pointer-events-none absolute left-1/2 max-w-[65%] -translate-x-1/2 truncate text-center font-black tracking-tight">{matchRound ? `Chat · Jornada ${matchRound}` : "Chat del partido"}</h1></div>
      </header>
      {match ? <div className="shrink-0 px-3 pt-2"><div className="rounded-2xl border border-neutral-200 bg-white p-2.5 shadow-sm"><MatchTeamsPanel teamA={match.teamA} teamB={match.teamB} players={players} mode="versus" linkPlayers={false} /></div></div> : null}
      <div ref={messagesRef} className="mx-3 mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl bg-neutral-100 p-3 shadow-inner">
        {messages.length === 0 && !error ? <p className="py-16 text-center text-sm font-semibold text-neutral-500">Todavía no hay mensajes. Escribe para organizar el partido.</p> : null}
        <div className="space-y-2">
          {messages.map((message) => {
            const mine = message.sender_user_id === me
            const payload = record(message.payload)
            if (message.kind !== "text") return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className="w-[92%] rounded-2xl border border-neutral-200 bg-white p-3 text-neutral-950 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate type-caption font-black text-neutral-500">{mine ? "Tú" : message.sender_display_name}</p><p className="text-sm font-black">{message.kind === "date_proposal" ? "Propuesta de fecha" : "Propuesta de ubicación"}</p></div><span className="type-caption font-bold text-neutral-400">{new Date(message.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span></div>{message.kind === "date_proposal" ? <div className="mt-2 space-y-2">{(Array.isArray(payload.options) ? payload.options : []).map((raw) => { const option = record(raw); const key = String(option.key ?? ""); const startsAt = String(option.startsAt ?? ""); return key && startsAt ? <div key={key} className="rounded-xl bg-neutral-50 px-2.5 py-2"><p className="text-sm font-bold">{proposalDate(startsAt)}</p>{proposalControls(message, key)}</div> : null })}</div> : <div className="mt-2 rounded-xl bg-neutral-50 px-2.5 py-2"><p className="text-sm font-bold">{String(payload.name ?? "Ubicación propuesta")}</p>{proposalControls(message, String(payload.key ?? "location"))}</div>}</div></div>
            return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[84%] rounded-2xl px-3 py-2 shadow-sm ${mine ? "rounded-br-md bg-neutral-950 text-white" : "rounded-bl-md border border-neutral-200 bg-white text-neutral-950"}`}>{!mine ? <p className="max-w-full truncate whitespace-nowrap type-caption font-black text-neutral-500">{message.sender_display_name}</p> : null}<p className="whitespace-pre-wrap break-words text-sm leading-5"><MentionText body={message.body} participants={participants} /></p><p className={`mt-0.5 text-right leading-none ${mine ? "text-neutral-300" : "text-neutral-400"}`}><span className="inline-block origin-right scale-90 type-caption">{new Date(message.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span></p></div></div>
          })}
        </div>
      </div>
      {error ? <p className="mx-3 mt-2 shrink-0 rounded-xl bg-red-50 px-3 py-2 type-caption font-bold text-red-700">{error}</p> : null}
      {readOnly ? <div className="mt-2 shrink-0 border-t border-neutral-200 bg-white px-3 pt-2 text-center type-caption font-bold text-neutral-500" style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom, 0px))" }}>Partido finalizado · Chat en modo lectura</div> : <>
        {mentionSuggestions.length ? <div className="mx-3 mt-2 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">{mentionSuggestions.map((item) => <button key={item.playerId} type="button" onClick={() => insertMention(item)} className="flex w-full items-center gap-2 border-b border-neutral-100 px-3 py-2 text-left last:border-b-0"><span className="min-w-0 flex-1 truncate text-sm font-black">{item.displayName}</span><span className="type-caption font-bold text-neutral-400">@{item.handle}</span></button>)}</div> : null}
        {actionMode ? <div className="mx-3 mt-2 shrink-0 rounded-2xl border border-neutral-200 bg-white p-3 shadow-lg">{actionMode === "menu" ? <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setActionMode("date")} className="flex items-center justify-center rounded-xl bg-neutral-100 px-3 py-3 text-center text-sm font-black">Proponer fecha</button><button type="button" onClick={() => setActionMode("location")} className="flex items-center justify-center rounded-xl bg-neutral-100 px-3 py-3 text-center text-sm font-black">Proponer ubicación</button></div> : null}{actionMode === "date" ? <div><div className="flex items-center justify-between"><p className="text-sm font-black">Proponer fechas</p><button type="button" onClick={() => { setActionMode(null); setDateDraft(""); setDateOptions([]) }} className="type-caption font-black text-neutral-500">Cerrar</button></div><div className="mt-2 flex gap-2"><input type="datetime-local" value={dateDraft} onChange={(event) => setDateDraft(event.target.value)} className="min-w-0 flex-1 rounded-xl bg-neutral-100 px-2.5 py-2 text-sm font-bold" /><button type="button" disabled={!dateDraft || dateOptions.length >= 3} onClick={() => { if (!dateDraft) return; const iso = new Date(dateDraft).toISOString(); setDateOptions((current) => current.includes(iso) ? current : [...current, iso].slice(0, 3)); setDateDraft("") }} className="flex items-center justify-center rounded-xl bg-neutral-950 px-3 text-center text-sm font-black text-white disabled:opacity-40">Añadir</button></div>{dateOptions.length ? <div className="mt-2 space-y-1">{dateOptions.map((item) => <div key={item} className="flex items-center justify-between rounded-xl bg-neutral-50 px-2.5 py-1.5"><span className="text-xs font-bold">{proposalDate(item)}</span><button type="button" onClick={() => setDateOptions((current) => current.filter((date) => date !== item))} className="type-caption font-black text-neutral-400">Quitar</button></div>)}</div> : null}<button type="button" disabled={sending || (!dateOptions.length && !dateDraft)} onClick={() => void sendDates()} className="mt-2 flex w-full items-center justify-center rounded-xl bg-neutral-950 px-3 py-2 text-center text-sm font-black text-white disabled:opacity-40">Enviar propuesta</button></div> : null}{actionMode === "location" ? <div><div className="flex items-center justify-between"><p className="text-sm font-black">Proponer ubicación</p><button type="button" onClick={() => { setActionMode(null); setLocationDraft("") }} className="type-caption font-black text-neutral-500">Cerrar</button></div><select value={locationDraft} onChange={(event) => setLocationDraft(event.target.value)} className="mt-2 w-full rounded-xl bg-neutral-100 px-3 py-2 text-sm font-bold"><option value="">Selecciona una ubicación</option>{activeLeague.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select><p className="my-1 text-center type-caption font-bold text-neutral-400">o</p><input value={activeLeague.locations.some((item) => item.id === locationDraft) ? "" : locationDraft} onChange={(event) => setLocationDraft(event.target.value)} placeholder="Escribe otra ubicación" className="w-full rounded-xl bg-neutral-100 px-3 py-2 text-sm font-bold outline-none" /><button type="button" disabled={sending || !locationDraft.trim()} onClick={() => void sendLocation()} className="mt-2 flex w-full items-center justify-center rounded-xl bg-neutral-950 px-3 py-2 text-center text-sm font-black text-white disabled:opacity-40">Enviar propuesta</button></div> : null}</div> : null}
        <form onSubmit={send} className="mt-2 flex shrink-0 items-end gap-2 border-t border-neutral-200 bg-white px-3 pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]" style={{ paddingBottom: "max(8px, var(--match-chat-bottom-inset, env(safe-area-inset-bottom, 0px)))" }}>
          <button type="button" aria-label="Acciones del partido" title="Acciones del partido" onClick={() => setActionMode((current) => current ? null : "menu")} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-center text-xl font-black text-neutral-700 transition active:scale-95">+</button>
          <textarea ref={composerRef} value={body} onChange={(event) => { setBody(event.target.value); resizeComposer(event.currentTarget); updateMentionQuery(event.target.value, event.currentTarget.selectionStart ?? event.target.value.length) }} onClick={(event) => updateMentionQuery(event.currentTarget.value, event.currentTarget.selectionStart ?? event.currentTarget.value.length)} maxLength={2000} rows={1} enterKeyHint="send" placeholder="Escribe un mensaje…" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); if (mentionSuggestions[0]) insertMention(mentionSuggestions[0]); else event.currentTarget.form?.requestSubmit() } }} className="max-h-32 min-h-10 flex-1 resize-none overflow-y-auto rounded-xl bg-neutral-100 px-3 py-2 text-base leading-5 outline-none" />
          <button type="submit" disabled={!body.trim() || sending} aria-label={sending ? "Enviando mensaje" : "Enviar mensaje"} title={sending ? "Enviando mensaje" : "Enviar mensaje"} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white transition active:scale-95 disabled:opacity-40"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg></button>
        </form>
      </>}
    </div>
  )
}
