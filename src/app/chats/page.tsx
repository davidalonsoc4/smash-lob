"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { SeasonContextLine } from "@/components/layout/SeasonContextLine"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { subscribeChatRealtime } from "@/lib/chatRealtimeClient"

type ChatItem = { id: string; round: number; scheduledAt: string | null; readOnly: boolean; partner: string; rivals: string[]; unread: number; lastMessage: { sender: string; body: string; createdAt: string } | null }
function formatChatDate(value: string | null) { const date = value ? new Date(value) : null; return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date) : "" }
function firstName(value: string) { return value.trim().split(/\s+/)[0] || "" }
function chatParticipantsLabel(chat: ChatItem) { const rivals = chat.rivals.filter(Boolean).map(firstName); const rivalLabel = rivals.length > 1 ? `${rivals.slice(0, -1).join(", ")} y ${rivals.at(-1)}` : rivals[0] ?? "Rivales"; return `con ${firstName(chat.partner) || "Pareja"} vs ${rivalLabel}` }
function ChatCards({ chats }: { chats: ChatItem[] }) { return <div className="space-y-2">{chats.map((chat) => { const participantsLabel = chatParticipantsLabel(chat); return <Link key={chat.id} href={`/match/${chat.id}/chat`} className="group block"><AppCard className={`chat-list-card app-card-explicit-accent !overflow-hidden !p-0 transition active:scale-[0.99] ${chat.unread ? "chat-list-card-unread" : ""}`}><div className="flex min-w-0 items-stretch"><div className="min-w-0 flex-1 py-3 pl-4 pr-2"><div className="flex min-w-0 items-center gap-2"><p className="type-panel-title min-w-0 flex-1 truncate font-black">Jornada {chat.round}</p>{chat.unread > 0 ? <span className="shrink-0 rounded-full bg-neutral-950 px-2 py-0.5 type-caption font-black text-white">{chat.unread > 99 ? "99+" : chat.unread}</span> : null}{chat.readOnly ? <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 type-caption font-black text-neutral-500">Solo lectura</span> : null}</div><p className="mt-0.5 truncate type-small font-semibold text-neutral-600" title={participantsLabel}>{participantsLabel}</p><div className="mt-2 flex min-w-0 items-center gap-2 border-t border-neutral-100 pt-2"><div className="min-w-0 flex-1">{chat.lastMessage ? <p className={`truncate type-caption ${chat.unread ? "font-black text-neutral-800" : "font-semibold text-neutral-500"}`}><span className="font-black">{chat.lastMessage.sender}</span>: {chat.lastMessage.body}</p> : <p className="type-caption font-semibold text-neutral-400">Sin mensajes todavía</p>}</div><p className="shrink-0 type-caption font-semibold text-neutral-400">{formatChatDate(chat.lastMessage?.createdAt ?? chat.scheduledAt)}</p></div></div><div className="flex w-9 shrink-0 items-center justify-center text-neutral-300 transition group-active:translate-x-0.5"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m9 18 6-6-6-6" /></svg></div></div></AppCard></Link> })}</div> }

export default function ChatsPage() {
  const { t } = useI18n()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const [chats, setChats] = useState<ChatItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [realtimeTopic, setRealtimeTopic] = useState<string | null>(null)
  const load = useCallback(async () => {
    const params = new URLSearchParams({ leagueId: activeLeague.id, seasonId: activeSeason.id })
    const response = await fetch(`/api/chats?${params.toString()}`, { cache: "no-store" }).catch(() => null)
    const data = response ? await response.json().catch(() => null) : null
    if (!response?.ok) { setError(true); setLoading(false); return }
    setChats(Array.isArray(data?.chats) ? data.chats : []); setRealtimeTopic(typeof data?.realtimeTopic === "string" ? data.realtimeTopic : null); setError(false); setLoading(false)
  }, [activeLeague.id, activeSeason.id])
  useEffect(() => { const initialTimer = window.setTimeout(() => { void load() }, 0); const handleVisibility = () => { if (!document.hidden) void load() }; document.addEventListener("visibilitychange", handleVisibility); return () => { window.clearTimeout(initialTimer); document.removeEventListener("visibilitychange", handleVisibility) } }, [load])
  useEffect(() => subscribeChatRealtime(realtimeTopic, () => { if (!document.hidden) void load() }), [load, realtimeTopic])
  const activeChats = chats.filter((chat) => !chat.readOnly)
  const finishedChats = chats.filter((chat) => chat.readOnly)
  return <div className="compact-page space-y-3">
    <header className="app-page-header">
      <BackButton fallbackHref="/" label={t.common.back} />
      <h1 className="type-page-title font-black tracking-tight">Chats</h1>
      <SeasonContextLine seasonName={activeSeason.name} statusLabel={activeSeason.status === "finished" ? t.common.finishedSeasonBadge : activeSeason.status === "upcoming" ? t.rounds.statusUpcoming : t.rounds.statusActive} className="mt-0.5" />
    </header>
    {loading ? <AppCard><p className="text-sm font-semibold text-neutral-500">Cargando conversaciones…</p></AppCard> : null}
    {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">No se han podido cargar tus chats.</p> : null}
    {!loading && !error && chats.length === 0 ? <AppCard><p className="text-sm font-black">Todavía no tienes chats de partido.</p><p className="mt-1 text-xs font-semibold text-neutral-500">Cuando participes en una jornada, su conversación aparecerá aquí.</p></AppCard> : null}
    {activeChats.length > 0 ? <ChatCards chats={activeChats} /> : null}
    {finishedChats.length > 0 ? <section className="space-y-2 pt-1"><h2 className="type-section-title text-lg font-black text-neutral-600">Chats finalizados</h2><ChatCards chats={finishedChats} /></section> : null}
  </div>
}
