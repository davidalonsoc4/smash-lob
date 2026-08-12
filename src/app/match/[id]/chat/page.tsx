"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { BackButton } from "@/components/ui/BackButton"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
type Message = { id: string; sender_user_id: string; sender_display_name: string; body: string; created_at: string }
const chatErrorMessage = (error?: string) => error === "match_chat_unavailable" ? "El chat todavía no está disponible en este entorno." : error ?? "No se ha podido cargar el chat."
export default function MatchChatPage() {
  const id = String(useParams<{ id: string }>().id); const { matches, players } = useCurrentLeagueData(); const match = matches.find((item) => item.id === id)
  const [messages, setMessages] = useState<Message[]>([]); const [me, setMe] = useState(""); const [round, setRound] = useState<number | null>(null); const [body, setBody] = useState(""); const [error, setError] = useState(""); const [sending, setSending] = useState(false); const endRef = useRef<HTMLDivElement>(null)
  const playerNames = useMemo(() => new Map(players.map((player) => [player.id, player.displayName])), [players]); const name = (playerId: string) => playerNames.get(playerId) ?? "Jugador"
  const matchRound = match?.round ?? round; const participants = match ? `${match.teamA.map(name).join(" / ")} vs ${match.teamB.map(name).join(" / ")}` : ""
  const load = useCallback(async () => {
    const response = await fetch(`/api/matches/${encodeURIComponent(id)}/chat`, { cache: "no-store" }); const data = await response.json().catch(() => null)
    if (!response.ok) { setError(chatErrorMessage(data?.error)); return }
    setMessages(data.messages ?? []); setMe(data.currentUserId ?? ""); setRound(data.round ?? null); setError("")
  }, [id, setError, setMe, setMessages, setRound])
  useEffect(() => { const initialTimer = window.setTimeout(() => { void load() }, 0); const pollingTimer = window.setInterval(() => { if (!document.hidden) void load() }, 2500); return () => { window.clearTimeout(initialTimer); window.clearInterval(pollingTimer) } }, [load])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages.length])
  async function send(event: React.FormEvent) {
    event.preventDefault(); const text = body.trim(); if (!text || sending) return; setSending(true)
    const response = await fetch(`/api/matches/${encodeURIComponent(id)}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text }) }); const data = await response.json().catch(() => null)
    if (response.ok) { setBody(""); await load() } else setError(data?.error === "match_chat_rate_limited" ? "Demasiados mensajes seguidos. Espera unos segundos." : chatErrorMessage(data?.error)); setSending(false)
  }
  return <div className="space-y-3 pb-20"><header className="app-page-header"><BackButton fallbackHref={`/match/${id}`} label="Volver" /><h1 className="type-page-title font-black tracking-tight">{matchRound ? `Chat · Jornada ${matchRound}` : "Chat del partido"}</h1></header>{participants ? <div className="rounded-xl bg-neutral-100 px-3 py-2 text-center text-sm font-bold leading-5 text-neutral-700">{participants}</div> : null}
    <div className="min-h-96 rounded-2xl bg-neutral-100 p-3 shadow-inner">{messages.length === 0 && !error ? <p className="py-16 text-center text-sm font-semibold text-neutral-500">Todavía no hay mensajes. Escribe para organizar el partido.</p> : null}<div className="space-y-2">{messages.map((message) => { const mine = message.sender_user_id === me; return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[84%] rounded-2xl px-3 py-2 shadow-sm ${mine ? "rounded-br-md bg-neutral-950 text-white" : "rounded-bl-md border border-neutral-200 bg-white text-neutral-950"}`}>{!mine ? <p className="type-caption font-black text-neutral-500">{message.sender_display_name}</p> : null}<p className="whitespace-pre-wrap break-words text-sm leading-5">{message.body}</p><p className={`mt-1 text-right type-caption ${mine ? "text-neutral-300" : "text-neutral-400"}`}>{new Date(message.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p></div></div> })}<div ref={endRef} /></div></div>
    {error ? <p className="rounded-xl bg-red-50 px-3 py-2 type-caption font-bold text-red-700">{error}</p> : null}<div className="fixed left-1/2 z-40 w-full max-w-[448px] -translate-x-1/2 px-3" style={{ bottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}><form onSubmit={send} className="flex items-end gap-2 rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg"><textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={1} placeholder="Escribe un mensaje…" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} className="max-h-32 min-h-10 flex-1 resize-none rounded-xl bg-neutral-100 px-3 py-2 text-sm outline-none" /><button type="submit" disabled={!body.trim() || sending} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-neutral-950 px-4 text-center text-sm font-black text-white disabled:opacity-40">{sending ? "…" : "Enviar"}</button></form></div></div>
}
