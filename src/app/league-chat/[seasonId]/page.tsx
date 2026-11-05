"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { BackButton } from "@/components/ui/BackButton"
import { MatchChatComposer, MatchChatReadOnlyBar, MatchChatTextMessage } from "@/components/match/chat/MatchChatShared"
import type { MatchChatParticipant } from "@/components/match/chat/MatchChatShared"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { subscribeChatRealtime } from "@/lib/chatRealtimeClient"

type Message = { id: string; sender_user_id: string; sender_display_name: string; body: string; created_at: string }
type Chat = { messages: Message[]; participants?: MatchChatParticipant[]; me: string; readOnly: boolean; hasMore: boolean; season: { name: string; league_id?: string }; realtimeTopic: string | null }

export default function LeagueSeasonChatPage() {
  const { seasonId } = useParams<{ seasonId: string }>()
  const { tx } = useI18n()
  const { leagues } = useLeagueAccess()
  const [chat, setChat] = useState<Chat | null>(null)
  const league = leagues.find((item) => item.id === chat?.season.league_id)
  const [body, setBody] = useState("")
  const [error, setError] = useState(false)
  const [sending, setSending] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const loadingOlderRef = useRef(false)
  const load = useCallback(async () => {
    const response = await fetch(`/api/league-season-chats/${encodeURIComponent(seasonId)}`, { cache: "no-store" }).catch(() => null)
    if (!response?.ok) { setError(true); return }
    const next = await response.json() as Chat
    setChat((current) => {
      if (!current || current.messages.length <= next.messages.length) return next
      const all = new Map([...current.messages, ...next.messages].map((message) => [message.id, message]))
      return { ...next, hasMore: current.hasMore, messages: [...all.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)) }
    })
    setError(false)
  }, [seasonId])
  useEffect(() => { void Promise.resolve().then(load) }, [load])
  useEffect(() => subscribeChatRealtime(chat?.realtimeTopic ?? null, () => { void load() }), [chat?.realtimeTopic, load])
  useEffect(() => {
    if (loadingOlderRef.current) { loadingOlderRef.current = false; return }
    endRef.current?.scrollIntoView({ block: "end" })
  }, [chat?.messages.length])
  async function loadOlder() {
    const first = chat?.messages[0]
    if (!first || loadingOlder) return
    setLoadingOlder(true)
    const response = await fetch(`/api/league-season-chats/${encodeURIComponent(seasonId)}?before=${encodeURIComponent(first.id)}&markRead=0`, { cache: "no-store" }).catch(() => null)
    if (response?.ok) {
      const older = await response.json() as Chat
      loadingOlderRef.current = older.messages.length > 0
      setChat((current) => current ? { ...current, hasMore: older.hasMore, messages: [...older.messages, ...current.messages] } : current)
    } else setError(true)
    setLoadingOlder(false)
  }
  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!body.trim() || sending) return
    setSending(true)
    const response = await fetch(`/api/league-season-chats/${encodeURIComponent(seasonId)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }),
    }).catch(() => null)
    if (response?.ok) { setBody(""); await load() } else setError(true)
    setSending(false)
  }
  return <div ref={viewportRef} className="fixed inset-x-0 top-0 z-[60] mx-auto flex h-[100dvh] w-full max-w-md min-h-0 flex-col overflow-hidden bg-stone-50">
    <header data-compact-chat-header className="app-page-header app-match-chat-header shrink-0 border-b border-neutral-200 bg-stone-50 px-3 pb-2">
      <div className="flex min-h-10 items-center gap-2 pr-11">
        <BackButton fallbackHref="/chats" label={tx("Volver")} iconOnly />
        {league?.logoUrl ? <LeagueLogo league={league} size="sm" /> : null}
        <div className="min-w-0 flex-1">
          <h1 className="type-page-title truncate font-black tracking-tight">{league?.name ?? tx("Chat de liga")}</h1>
          <div className="flex min-w-0 items-center gap-2 text-xs leading-4 text-neutral-500 dark:text-neutral-400">
            {chat?.season.name ? <span className="min-w-0 truncate">{chat.season.name}</span> : null}
            {chat?.participants?.length ? <>
              {chat.season.name ? <span aria-hidden="true">·</span> : null}
              <details className="relative shrink-0">
                <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">{chat.participants.length} {tx(chat.participants.length === 1 ? "participante" : "participantes")}</summary>
                <div className="absolute left-0 top-full z-10 mt-1 max-w-[16rem] rounded-lg border border-neutral-200 bg-white p-2 text-neutral-700 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">{chat.participants.map((participant) => participant.displayName).join(" · ")}</div>
              </details>
            </> : null}
          </div>
        </div>
      </div>
    </header>
    {error ? <p role="alert">{tx("No se ha podido cargar o enviar el mensaje. Inténtalo de nuevo.")}</p> : null}
    <div className="league-season-chat-messages min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4" aria-live="polite">
      {chat?.hasMore ? <button type="button" className="mx-auto flex items-center justify-center text-center type-small font-bold" onClick={() => void loadOlder()} disabled={loadingOlder}>{tx("Cargar mensajes anteriores")}</button> : null}
      {chat?.messages.length === 0 ? <p className="text-center type-small">{tx("Todavía no hay mensajes. ¡Empieza la conversación!")}</p> : null}
      {chat?.messages.map((message, index) => <MatchChatTextMessage key={message.id} message={message} me={chat.me} participants={chat.participants ?? []} previousSameSender={index > 0 && chat.messages[index - 1].sender_user_id === message.sender_user_id} />)}<div ref={endRef} />
    </div>
    {chat?.readOnly ? <MatchChatReadOnlyBar>{tx("Temporada finalizada · Solo lectura")}</MatchChatReadOnlyBar> : chat ? <MatchChatComposer body={body} composerRef={composerRef} onSubmit={send} onBodyChange={setBody} sending={sending} /> : null}
  </div>
}
