"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { openChatWithPreview } from "@/lib/chatEntryRequest"
import { useParams } from "next/navigation"
import { BackButton } from "@/components/ui/BackButton"
import { MatchChatComposer, MatchChatReadOnlyBar, MatchChatTextMessage, resizeMatchChatComposer, useMatchChatViewport } from "@/components/match/chat/MatchChatShared"
import type { MatchChatParticipant } from "@/components/match/chat/MatchChatShared"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { CHAT_UNREAD_LOCAL_REFRESH_EVENT, subscribeChatRealtime } from "@/lib/chatRealtimeClient"

type Message = { id: string; sender_user_id: string; sender_display_name: string; body: string; created_at: string }
type Chat = { unread?: number; messages: Message[]; participants?: MatchChatParticipant[]; me: string; readOnly: boolean; hasMore: boolean; season: { name: string; league_id?: string }; realtimeTopic: string | null }

export default function LeagueSeasonChatPage() {
  const { seasonId } = useParams<{ seasonId: string }>()
  return <LeagueSeasonChat key={seasonId} seasonId={seasonId} />
}

function mergeMessages(previous: Message[], incoming: Message[]) {
  return [...new Map([...previous, ...incoming].map(message => [message.id, message])).values()]
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
}

function LeagueSeasonChat({ seasonId }: { seasonId: string }) {
  const account = useSession().data?.user?.email
  const { tx } = useI18n()
  const { leagues } = useLeagueAccess()
  const [chat, setChat] = useState<Chat | null>(null)
  const league = leagues.find((item) => item.id === chat?.season.league_id)
  const [body, setBody] = useState("")
  const [error, setError] = useState(false)
  const [pending, setPending] = useState<Message | null>(null)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const olderScrollHeight = useRef<number | null>(null)
  const sending = useRef(false)
  const refreshAfterSend = useRef(false)
  const messages = pending && chat ? [...chat.messages, pending] : chat?.messages ?? []
  useMatchChatViewport({ viewportRef, composerRef, messagesRef })
  const load = useCallback(async () => {
    if (sending.current) { refreshAfterSend.current = true; return }
    const response = await fetch(`/api/league-season-chats/${encodeURIComponent(seasonId)}`, { cache: "no-store" }).catch(() => null)
    const next = response?.ok ? await response.json().catch(() => null) as Chat | null : null
    if (!next) {
      if (response && [401, 403, 404].includes(response.status)) setChat(null)
      setError(true)
      return
    }
    if (sending.current) { refreshAfterSend.current = true; return }
    if (next.unread) window.dispatchEvent(new Event(CHAT_UNREAD_LOCAL_REFRESH_EVENT))
    setChat((current) => {
      if (!current || current.me !== next.me) return next
      const hasOlder = current.messages.length > 0 && next.messages.length > 0 && current.messages[0].created_at < next.messages[0].created_at
      return { ...next, hasMore: hasOlder ? current.hasMore : next.hasMore, messages: mergeMessages(current.messages, next.messages) }
    })
    setError(false)
  }, [seasonId])
  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => void openChatWithPreview(account, `/api/league-season-chats/${encodeURIComponent(seasonId)}`, payload => {
      if (active) setChat({ ...(payload as Chat), realtimeTopic: null })
    }, load), 0)
    return () => { active = false; window.clearTimeout(timer) }
  }, [account, load, seasonId])
  useEffect(() => subscribeChatRealtime(chat?.realtimeTopic ?? null, () => { void load() }), [chat?.realtimeTopic, load])
  useLayoutEffect(() => {
    const panel = messagesRef.current
    if (!panel) return
    if (olderScrollHeight.current !== null) {
      panel.scrollTop += panel.scrollHeight - olderScrollHeight.current
      olderScrollHeight.current = null
    } else panel.scrollTop = panel.scrollHeight
  }, [messages.length])
  async function loadOlder() {
    const first = chat?.messages[0]
    if (!first || loadingOlder) return
    setLoadingOlder(true)
    const response = await fetch(`/api/league-season-chats/${encodeURIComponent(seasonId)}?before=${encodeURIComponent(first.id)}&markRead=0`, { cache: "no-store" }).catch(() => null)
    if (response?.ok) {
      const older = await response.json() as Chat
      if (older.messages.some(message => !chat.messages.some(current => current.id === message.id))) olderScrollHeight.current = messagesRef.current?.scrollHeight ?? null
      setChat((current) => current ? { ...current, hasMore: older.hasMore, messages: mergeMessages(current.messages, older.messages) } : current)
    } else setError(true)
    setLoadingOlder(false)
  }
  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = body.trim()
    if (!text || sending.current || !chat || chat.readOnly) return
    sending.current = true
    const sender = chat.participants?.find(participant => participant.userId === chat.me)
    setPending({ id: "pending", sender_user_id: chat.me, sender_display_name: sender?.displayName ?? tx("Tú"), body: text, created_at: new Date().toISOString() })
    setError(false)
    setBody("")
    if (composerRef.current) composerRef.current.style.height = "auto"
    const response = await fetch(`/api/league-season-chats/${encodeURIComponent(seasonId)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text }),
    }).catch(() => null)
    const confirmed = response?.ok ? (await response.json().catch(() => null))?.message as Message | undefined : undefined
    if (response?.ok) {
      if (confirmed?.id) setChat(current => current ? { ...current, messages: mergeMessages(current.messages, [confirmed]) } : current)
      window.dispatchEvent(new Event(CHAT_UNREAD_LOCAL_REFRESH_EVENT))
    } else {
      setBody(current => current || text)
      if (response && [401, 403, 404].includes(response.status)) setChat(null)
      if (response?.status === 409) setChat(current => current ? { ...current, readOnly: true } : current)
      setError(true)
    }
    setPending(null)
    sending.current = false
    const refresh = refreshAfterSend.current
    refreshAfterSend.current = false
    if (refresh || (response?.ok && !confirmed?.id)) void load()
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
    <div ref={messagesRef} className="league-season-chat-messages min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-4" aria-live="polite">
      {chat?.hasMore ? <button type="button" className="mx-auto flex items-center justify-center text-center type-small font-bold" onClick={() => void loadOlder()} disabled={loadingOlder}>{tx("Cargar mensajes anteriores")}</button> : null}
      {chat && messages.length === 0 ? <p className="text-center type-small">{tx("Todavía no hay mensajes. ¡Empieza la conversación!")}</p> : null}
      {chat && messages.map((message, index) => <MatchChatTextMessage key={message.id} message={message} me={chat.me} participants={chat.participants ?? []} pending={message === pending} previousSameSender={index > 0 && messages[index - 1].sender_user_id === message.sender_user_id} />)}
    </div>
    {chat?.readOnly ? <MatchChatReadOnlyBar>{tx("Temporada finalizada · Solo lectura")}</MatchChatReadOnlyBar> : chat ? <MatchChatComposer body={body} composerRef={composerRef} onSubmit={send} onBodyChange={(value, element) => { setBody(value); resizeMatchChatComposer(element) }} sending={pending !== null} /> : null}
  </div>
}
