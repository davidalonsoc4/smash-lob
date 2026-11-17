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
import { createCoalescedRunner } from "@/lib/coalescedRunner"
import { LeagueChatMediaBody } from "@/components/league/LeagueChatMedia"
import { LEAGUE_CHAT_MEDIA_ACCEPT, getLeagueChatMediaRule } from "@/lib/leagueChatMedia"
import { uploadLeagueChatMedia } from "@/lib/leagueChatMediaClient"

/** Distance from the bottom (px) under which the reader counts as "following" the conversation. */
const FOLLOW_THRESHOLD = 96

type Message = { id: string; sender_user_id: string; sender_display_name: string; body: string; created_at: string; media_kind?: "image" | "video" | null; media_url?: string | null }
type Attachment = { file: File; previewUrl: string; kind: "image" | "video" }
type Chat = { unread?: number; messages: Message[]; participants?: MatchChatParticipant[]; me: string; readOnly: boolean; hasMore: boolean; canPublishMedia?: boolean; season: { name: string; league_id?: string }; realtimeTopic: string | null }

export default function LeagueSeasonChatPage() {
  const { seasonId } = useParams<{ seasonId: string }>()
  return <LeagueSeasonChat key={seasonId} seasonId={seasonId} />
}

function mergeMessages(previous: Message[], incoming: Message[]) {
  // A refresh signs media again with a new URL; keep the one already loaded so players do not reload.
  const loaded = new Map(previous.map(message => [message.id, message]))
  const stable = incoming.map(message => {
    const known = loaded.get(message.id)
    return known?.media_url && message.media_url ? { ...message, media_url: known.media_url } : message
  })
  return [...new Map([...previous, ...stable].map(message => [message.id, message])).values()]
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
  const [unseenCount, setUnseenCount] = useState(0)
  const followingBottom = useRef(true)
  const renderedCount = useRef(0)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const olderScrollHeight = useRef<number | null>(null)
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
  // Several people writing at once fire many "refresh" notices: reload one at a time.
  useEffect(() => {
    const runLoad = createCoalescedRunner(load)
    return subscribeChatRealtime(chat?.realtimeTopic ?? null, () => { void runLoad() })
  }, [chat?.realtimeTopic, load])
  const messageCount = messages.length
  const lastSenderId = messages.at(-1)?.sender_user_id
  useLayoutEffect(() => {
    const panel = messagesRef.current
    if (!panel) return
    const previousCount = renderedCount.current
    renderedCount.current = messageCount
    if (olderScrollHeight.current !== null) {
      panel.scrollTop += panel.scrollHeight - olderScrollHeight.current
      olderScrollHeight.current = null
      return
    }
    const added = messageCount - previousCount
    const lastIsMine = lastSenderId === chat?.me
    // Only follow new messages when already at the bottom (or when the user wrote); otherwise do not move
    // the reader away from what they are reading and offer a shortcut instead.
    if (previousCount === 0 || followingBottom.current || lastIsMine) {
      panel.scrollTop = panel.scrollHeight
      followingBottom.current = true
      setUnseenCount(0)
    } else if (added > 0) setUnseenCount(count => count + added)
  }, [messageCount, lastSenderId, chat?.me])
  function handleMessagesScroll() {
    const panel = messagesRef.current
    if (!panel) return
    followingBottom.current = panel.scrollHeight - panel.scrollTop - panel.clientHeight < FOLLOW_THRESHOLD
    if (followingBottom.current) setUnseenCount(count => count === 0 ? count : 0)
  }
  function scrollToLatest() {
    const panel = messagesRef.current
    if (!panel) return
    followingBottom.current = true
    setUnseenCount(0)
    panel.scrollTo({ top: panel.scrollHeight, behavior: "smooth" })
  }
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
  function clearAttachment() {
    setAttachment(current => { if (current) URL.revokeObjectURL(current.previewUrl); return null })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }
  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    const rule = getLeagueChatMediaRule(file.type)
    if (!rule || file.size > rule.maxBytes) {
      setMediaError(tx("Archivo no admitido o demasiado grande (vídeo MP4 hasta 50 MB, foto hasta 10 MB)."))
      return
    }
    setMediaError(null)
    clearAttachment()
    setAttachment({ file, kind: rule.kind, previewUrl: URL.createObjectURL(file) })
  }
  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = body.trim()
    if (!text || sending.current || !chat || chat.readOnly) return
    sending.current = true
    const sender = chat.participants?.find(participant => participant.userId === chat.me)
    const sentAttachment = attachment
    setPending({ id: "pending", sender_user_id: chat.me, sender_display_name: sender?.displayName ?? tx("Tú"), body: text, created_at: new Date().toISOString(), ...(sentAttachment ? { media_kind: sentAttachment.kind, media_url: sentAttachment.previewUrl } : {}) })
    setError(false)
    setMediaError(null)
    setBody("")
    if (composerRef.current) composerRef.current.style.height = "auto"
    let mediaPath: string | undefined
    if (sentAttachment) {
      const upload = await uploadLeagueChatMedia(seasonId, sentAttachment.file)
      if (!upload.ok) {
        setBody(current => current || text)
        setMediaError(tx(upload.error === "forbidden" ? "Solo el creador de la liga puede publicar fotos y vídeos." : upload.error === "invalid_media" ? "Archivo no admitido o demasiado grande (vídeo MP4 hasta 50 MB, foto hasta 10 MB)." : "No se ha podido subir el archivo. Revisa la conexión y vuelve a intentarlo."))
        setPending(null)
        sending.current = false
        return
      }
      mediaPath = upload.path
    }
    const response = await fetch(`/api/league-season-chats/${encodeURIComponent(seasonId)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mediaPath ? { body: text, mediaPath } : { body: text }),
    }).catch(() => null)
    const confirmed = response?.ok ? (await response.json().catch(() => null))?.message as Message | undefined : undefined
    if (response?.ok) {
      if (sentAttachment) clearAttachment()
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
    <div ref={messagesRef} onScroll={handleMessagesScroll} className="league-season-chat-messages min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-4" aria-live="polite">
      {chat?.hasMore ? <button type="button" className="mx-auto flex items-center justify-center text-center type-small font-bold" onClick={() => void loadOlder()} disabled={loadingOlder}>{tx("Cargar mensajes anteriores")}</button> : null}
      {chat && messages.length === 0 ? <p className="text-center type-small">{tx("Todavía no hay mensajes. ¡Empieza la conversación!")}</p> : null}
      {chat && messages.map((message, index) => <MatchChatTextMessage key={message.id} message={message} bodyContent={message.media_url ? <LeagueChatMediaBody message={message} /> : undefined} me={chat.me} participants={chat.participants ?? []} pending={message === pending} previousSameSender={index > 0 && messages[index - 1].sender_user_id === message.sender_user_id} />)}
    </div>
    {unseenCount > 0 ? <div className="relative h-0 shrink-0"><button type="button" onClick={scrollToLatest} className="absolute bottom-2 left-1/2 z-10 inline-flex min-h-9 -translate-x-1/2 items-center justify-center rounded-full text-center bg-neutral-950 px-4 text-xs font-black text-white shadow-lg active:scale-[0.97]">↓ {unseenCount} {tx(unseenCount === 1 ? "mensaje nuevo" : "mensajes nuevos")}</button></div> : null}
    {mediaError ? <p role="alert" className="shrink-0 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">{mediaError}</p> : null}
    {attachment && !chat?.readOnly ? <div data-league-chat-attachment className="flex shrink-0 items-center gap-2 border-t border-neutral-200 bg-white px-3 pt-2">
      <span className="min-w-0 flex-1 truncate text-xs font-bold text-neutral-700">{tx(attachment.kind === "video" ? "Vídeo" : "Foto")}: {attachment.file.name} · {(attachment.file.size / 1048576).toFixed(1)} MB{body.trim() ? "" : " · " + tx("Escribe un texto para publicarlo")}</span>
      <button type="button" onClick={clearAttachment} aria-label={tx("Quitar archivo")} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-4 w-4"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
    </div> : null}
    {chat?.readOnly ? <MatchChatReadOnlyBar>{tx("Temporada finalizada · Solo lectura")}</MatchChatReadOnlyBar> : chat ? <MatchChatComposer body={body} composerRef={composerRef} onSubmit={send} onBodyChange={(value, element) => { setBody(value); resizeMatchChatComposer(element) }} sending={pending !== null} hasTopAttachment={Boolean(attachment)} leadingAction={chat.canPublishMedia ? <><input ref={fileInputRef} type="file" accept={LEAGUE_CHAT_MEDIA_ACCEPT} onChange={pickFile} className="sr-only" tabIndex={-1} aria-hidden="true" /><button type="button" onClick={() => fileInputRef.current?.click()} disabled={pending !== null} aria-label={tx("Adjuntar foto o vídeo")} title={tx("Adjuntar foto o vídeo")} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition active:scale-95 disabled:opacity-40"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L10 17.7a1.7 1.7 0 0 1-2.4-2.4l7.6-7.6" /></svg></button></> : undefined} /> : null}
  </div>
}
