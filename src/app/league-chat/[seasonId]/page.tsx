"use client"

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { openChatWithPreview } from "@/lib/chatEntryRequest"
import { useParams } from "next/navigation"
import { BackButton } from "@/components/ui/BackButton"
import { MatchChatComposer, MatchChatReadOnlyBar, MatchChatTextMessage, resizeMatchChatComposer, useMatchChatViewport } from "@/components/match/chat/MatchChatShared"
import type { MatchChatParticipant } from "@/components/match/chat/MatchChatShared"
import { FloatingDialog } from "@/components/ui/FloatingDialog"
import { LeagueChatMessageActions } from "@/components/league/LeagueChatMessageActions"
import { LeagueChatMessageMenu } from "@/components/league/LeagueChatMessageMenu"
import { getIntlLocale } from "@/i18n/localeFormatting"
import { getChatDayKey, getChatDayLabel } from "@/lib/chatDayLabel"
import { CHAT_LIST_ACCOUNT_HEADER } from "@/lib/chatListMemory"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { CHAT_UNREAD_LOCAL_REFRESH_EVENT, subscribeChatRealtime } from "@/lib/chatRealtimeClient"
import { createCoalescedRunner } from "@/lib/coalescedRunner"
import { LeagueChatMediaBody } from "@/components/league/LeagueChatMedia"
import { LEAGUE_CHAT_MEDIA_ACCEPT, getLeagueChatMediaRule } from "@/lib/leagueChatMedia"
import { uploadLeagueChatMedia } from "@/lib/leagueChatMediaClient"
import { inspectMp4, moveMoovToFront } from "@/lib/mp4"

/** Distance from the bottom (px) under which the reader counts as "following" the conversation. */
const FOLLOW_THRESHOLD = 96

type ReplyPreview = { id: string; sender_user_id?: string; sender_display_name: string; body: string; deleted?: boolean; media_kind?: "image" | "video" | null }
type Message = { id: string; sender_user_id: string; sender_display_name: string; body: string; created_at: string; edited_at?: string | null; deleted_at?: string | null; media_kind?: "image" | "video" | null; media_url?: string | null; reply_to_id?: string | null; reply?: ReplyPreview | null; upload_progress?: number | null }
type Attachment = { file: File; previewUrl: string; kind: "image" | "video" }
type Chat = { unread?: number; messages: Message[]; participants?: MatchChatParticipant[]; me: string; readOnly: boolean; hasMore: boolean; canPublishMedia?: boolean; season: { name: string; league_id?: string }; realtimeTopic: string | null }

export default function LeagueSeasonChatPage() {
  const { seasonId } = useParams<{ seasonId: string }>()
  const account = useSession().data?.user?.email
  return <LeagueSeasonChat key={seasonId + ":" + (account ?? "")} seasonId={seasonId} account={account} />
}

function mergeMessages(previous: Message[], incoming: Message[]) {
  const byId = new Map(previous.map(message => [message.id, message]))
  for (const message of incoming) {
    const current = byId.get(message.id)
    const version = (value?: Message) => value?.deleted_at ?? value?.edited_at ?? ""
    if (version(message) < version(current)) continue
    // A refresh signs media again with a new URL; keep the one already loaded so players do not reload.
    byId.set(message.id, current?.media_url && message.media_url ? { ...message, media_url: current.media_url } : message)
  }
  return [...byId.values()]
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
}

function LeagueSeasonChat({ seasonId, account }: { seasonId: string; account?: string | null }) {
  const { tx, locale } = useI18n()
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
  const [action, setAction] = useState<{ id: string; mode: "menu" | "edit" | "delete" } | null>(null)
  const [editBody, setEditBody] = useState("")
  const [actionError, setActionError] = useState(false)
  const [changing, setChanging] = useState(false)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null)
  const endpoint = `/api/league-season-chats/${encodeURIComponent(seasonId)}`
  const accountHeader = account ? encodeURIComponent(account.trim().toLowerCase()) : null
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const olderScrollHeight = useRef<number | null>(null)
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [mediaNotice, setMediaNotice] = useState<string | null>(null)
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
  const realtimeTopic = chat?.realtimeTopic
  useEffect(() => {
    const controller = new AbortController()
    // Several people writing at once fire many "refresh" notices: reload one at a time.
    const runLoad = createCoalescedRunner(load)
    const unsubscribe = subscribeChatRealtime(realtimeTopic, (_leagueDataChanged, changedMessageId) => {
      if (!changedMessageId || !accountHeader) { void runLoad(); return }
      void fetch(endpoint + "?messageId=" + encodeURIComponent(changedMessageId), {
        signal: controller.signal, cache: "no-store", headers: { [CHAT_LIST_ACCOUNT_HEADER]: accountHeader },
      }).then(async response => {
        if (!response.ok) return
        const { message } = await response.json() as { message: Message }
        if (!controller.signal.aborted) setChat(current => current?.messages.some(item => item.id === message.id)
          ? { ...current, messages: mergeMessages(current.messages, [message]) } : current)
      }).catch(() => undefined)
    })
    return () => { controller.abort(); unsubscribe() }
  }, [accountHeader, endpoint, load, realtimeTopic])
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
  async function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    const rule = getLeagueChatMediaRule(file.type)
    if (!rule || file.size > rule.maxBytes) {
      setMediaError(tx("Archivo no admitido o demasiado grande (vídeo MP4 hasta 50 MB, foto hasta 10 MB)."))
      return
    }
    setMediaError(null)
    setMediaNotice(null)
    clearAttachment()
    let prepared = file
    if (rule.kind === "video") {
      // Lossless: put the index at the start so the video begins playing before it is fully downloaded.
      const info = await inspectMp4(file).catch(() => null)
      if (info && !info.faststart && !info.fragmented) {
        const moved = await moveMoovToFront(file).catch(() => null)
        if (moved) prepared = new File([moved], file.name, { type: "video/mp4" })
      }
      // The browser cannot re-encode audio: warn so the video can be exported again at 48 kHz.
      if (info?.audioSampleRate && info.audioSampleRate !== 48000) setMediaNotice(tx("El audio del vídeo no está a 48 kHz y en algunos móviles puede no oírse. Conviene exportarlo con audio a 48 kHz."))
    }
    setAttachment({ file: prepared, kind: rule.kind, previewUrl: URL.createObjectURL(prepared) })
  }
  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = body.trim()
    if ((!text && !attachment) || sending.current || !chat || chat.readOnly) return
    sending.current = true
    const sender = chat.participants?.find(participant => participant.userId === chat.me)
    const sentAttachment = attachment
    const sentReplyId = replyTo?.id
    setPending({ id: "pending", sender_user_id: chat.me, sender_display_name: sender?.displayName ?? tx("Tú"), body: text, created_at: new Date().toISOString(), ...(replyTo ? { reply_to_id: replyTo.id, reply: { id: replyTo.id, sender_user_id: replyTo.sender_user_id, sender_display_name: replyTo.sender_display_name, body: replyTo.body.slice(0, 140), media_kind: replyTo.media_kind ?? null } } : {}), ...(sentAttachment ? { media_kind: sentAttachment.kind, media_url: sentAttachment.previewUrl } : {}) })
    setError(false)
    setMediaError(null)
    setBody("")
    if (composerRef.current) composerRef.current.style.height = "auto"
    let mediaPath: string | undefined
    if (sentAttachment) {
      const upload = await uploadLeagueChatMedia(seasonId, sentAttachment.file, fraction => setPending(current => current ? { ...current, upload_progress: fraction } : current))
      if (!upload.ok) {
        setBody(current => current || text)
        setMediaError(tx(upload.error === "forbidden" ? "Solo el creador de la liga puede publicar fotos y vídeos." : upload.error === "invalid_media" ? "Archivo no admitido o demasiado grande (vídeo MP4 hasta 50 MB, foto hasta 10 MB)." : "No se ha podido subir el archivo. Revisa la conexión y vuelve a intentarlo."))
        setPending(null)
        sending.current = false
        return
      }
      mediaPath = upload.path
      setPending(current => current ? { ...current, upload_progress: null } : current)
    }
    const response = await fetch(`/api/league-season-chats/${encodeURIComponent(seasonId)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text, ...(mediaPath ? { mediaPath } : {}), ...(sentReplyId ? { replyToId: sentReplyId } : {}) }),
    }).catch(() => null)
    const confirmed = response?.ok ? (await response.json().catch(() => null))?.message as Message | undefined : undefined
    if (response?.ok) {
      if (sentAttachment) clearAttachment()
      setReplyTo(null)
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
  async function changeMessage() {
    if (!action || action.mode === "menu" || !accountHeader || changing) return
    setChanging(true)
    setActionError(false)
    const response = await fetch(endpoint, {
      method: "PATCH", headers: { "Content-Type": "application/json", [CHAT_LIST_ACCOUNT_HEADER]: accountHeader },
      body: JSON.stringify({ messageId: action.id, body: action.mode === "delete" ? null : editBody.trim() }),
    }).catch(() => null)
    const message = response?.ok ? (await response.json().catch(() => null))?.message as Message | undefined : undefined
    if (message?.id) {
      setChat(current => current ? { ...current, messages: mergeMessages(current.messages, [message]) } : current)
      setAction(null)
      window.dispatchEvent(new Event(CHAT_UNREAD_LOCAL_REFRESH_EVENT))
    } else setActionError(true)
    setChanging(false)
  }

  useEffect(() => { if (action?.mode === "edit") editorRef.current?.focus({ preventScroll: true }) }, [action?.mode])

  function replyPreviewText(reply: ReplyPreview) {
    if (reply.deleted) return tx("Mensaje eliminado")
    const kind = reply.media_kind ? tx(reply.media_kind === "video" ? "Vídeo" : "Foto") : ""
    return kind && reply.body ? `${kind} · ${reply.body}` : kind || reply.body
  }
  function startReply(message: Message) {
    setReplyTo(message)
    setAction(null)
    setMenuAnchor(null)
    composerRef.current?.focus({ preventScroll: true })
  }
  function findMessageElement(id: string) {
    return messagesRef.current?.querySelector<HTMLElement>(`[data-message-id="${id}"]`) ?? null
  }
  /** Scrolls to the quoted message, loading earlier pages first when it is not on screen yet. */
  async function jumpToMessage(id: string) {
    let target = findMessageElement(id)
    let cursor = chat?.messages[0]?.id
    let more = Boolean(chat?.hasMore)
    for (let page = 0; !target && more && cursor && page < 10; page++) {
      const response = await fetch(`${endpoint}?before=${encodeURIComponent(cursor)}&markRead=0`, { cache: "no-store" }).catch(() => null)
      if (!response?.ok) return
      const older = await response.json() as Chat
      setChat(current => current ? { ...current, hasMore: older.hasMore, messages: mergeMessages(current.messages, older.messages) } : current)
      more = older.hasMore
      cursor = older.messages[0]?.id
      await new Promise(resolve => window.setTimeout(resolve, 60))
      target = findMessageElement(id)
    }
    if (!target) return
    target.scrollIntoView({ block: "center", behavior: "smooth" })
    target.classList.add("league-chat-jump-highlight")
    window.setTimeout(() => target?.classList.remove("league-chat-jump-highlight"), 1400)
  }
  function openMenuFor(message: Message, rect: DOMRect) {
    setEditBody(message.body)
    setActionError(false)
    setAction({ id: message.id, mode: "menu" })
    setMenuAnchor(rect)
  }
  const actionMessage = action ? chat?.messages.find(item => item.id === action.id) : undefined
  const actionIsMine = Boolean(actionMessage && chat && actionMessage.sender_user_id === chat.me)
  const optionsLabel = tx("Opciones del mensaje")
  const editLabel = tx("Editar mensaje")
  const deleteLabel = tx("Eliminar mensaje")
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
    <div ref={messagesRef} onScroll={handleMessagesScroll} className="league-season-chat-messages min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-4" aria-live="polite">
      {chat?.hasMore ? <button type="button" className="mx-auto flex items-center justify-center text-center type-small font-bold" onClick={() => void loadOlder()} disabled={loadingOlder}>{tx("Cargar mensajes anteriores")}</button> : null}
      {chat && messages.length === 0 ? <p className="text-center type-small">{tx("Todavía no hay mensajes. ¡Empieza la conversación!")}</p> : null}
      {chat && messages.map((message, index) => {
        const previous = index > 0 ? messages[index - 1] : null
        const newDay = !previous || getChatDayKey(previous.created_at) !== getChatDayKey(message.created_at)
        const sameGroup = Boolean(previous) && !newDay && previous!.sender_user_id === message.sender_user_id
        const bubble = <MatchChatTextMessage
          message={message} me={chat.me} participants={chat.participants ?? []} pending={message === pending}
          rowClassName={message === pending ? "opacity-70" : ""}
          previousSameSender={sameGroup}
          bodyContent={message.deleted_at ? <em>{tx("Mensaje eliminado")}</em> : message.media_url ? <LeagueChatMediaBody message={message} /> : undefined}
          editedLabel={message.edited_at && !message.deleted_at ? tx("Editado") : undefined}
          overlayMeta={Boolean(message.media_url && !message.body.trim() && !message.deleted_at && !message.edited_at)}
          quotedReply={message.reply && !message.deleted_at ? { senderDisplayName: message.reply.sender_display_name, authorUserId: message.reply.sender_user_id ?? null, body: replyPreviewText(message.reply) } : null}
          onQuotedReplyClick={message.reply ? () => void jumpToMessage(message.reply!.id) : undefined}
        />
        const spacing = index === 0 ? "" : sameGroup ? "mt-0.5" : "mt-3"
        const separator = newDay ? <div key={`day-${message.id}`} data-chat-day-separator className={`flex justify-center ${index === 0 ? "pb-1" : "py-3"}`}>
          <span className="chat-day-pill rounded-full px-3 py-1 type-micro font-bold uppercase tracking-wide">
            {getChatDayLabel(message.created_at, new Date(), getIntlLocale(locale), { today: tx("Hoy"), yesterday: tx("Ayer") })}
          </span>
        </div> : null
        if (chat.readOnly || message === pending || message.deleted_at) {
          return <Fragment key={message.id}>{separator}<div data-message-id={message.id} className={newDay ? "" : spacing}>{bubble}</div></Fragment>
        }
        return <Fragment key={message.id}>{separator}<div data-message-id={message.id} className={newDay ? "" : spacing}><LeagueChatMessageActions label={optionsLabel} replyLabel={tx("Responder")} onOpen={rect => openMenuFor(message, rect)} onReply={() => startReply(message)}>{bubble}</LeagueChatMessageActions></div></Fragment>
      })}
    </div>
    {unseenCount > 0 ? <div className="relative h-0 shrink-0"><button type="button" onClick={scrollToLatest} className="absolute bottom-2 left-1/2 z-10 inline-flex min-h-9 -translate-x-1/2 items-center justify-center rounded-full text-center bg-neutral-950 px-4 text-xs font-black text-white shadow-lg active:scale-[0.97]">↓ {unseenCount} {tx(unseenCount === 1 ? "mensaje nuevo" : "mensajes nuevos")}</button></div> : null}
    {mediaError ? <p role="alert" className="shrink-0 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">{mediaError}</p> : null}
    {mediaNotice && attachment ? <p role="status" data-league-chat-notice className="chat-notice shrink-0 px-3 py-1.5 text-xs font-bold">{mediaNotice}</p> : null}
    {replyTo && !chat?.readOnly ? <div data-league-chat-reply className="flex shrink-0 items-center gap-2 border-t border-neutral-200 bg-white px-3 pt-2">
      <span aria-hidden="true" className="h-9 w-1 shrink-0 rounded-full bg-neutral-400" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-black text-neutral-800">{tx("Respondiendo a")} {replyTo.sender_display_name}</span>
        <span className="block truncate text-xs text-neutral-600">{replyTo.media_kind ? tx(replyTo.media_kind === "video" ? "Vídeo" : "Foto") + (replyTo.body ? " · " : "") : ""}{replyTo.body}</span>
      </span>
      <button type="button" onClick={() => setReplyTo(null)} aria-label={tx("Cancelar respuesta")} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-4 w-4"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
    </div> : null}
    {attachment && !chat?.readOnly ? <div data-league-chat-attachment className="flex shrink-0 items-center gap-2 border-t border-neutral-200 bg-white px-3 pt-2">
      <span className="min-w-0 flex-1 truncate text-xs font-bold text-neutral-700">{tx(attachment.kind === "video" ? "Vídeo" : "Foto")}: {attachment.file.name} · {(attachment.file.size / 1048576).toFixed(1)} MB</span>
      <button type="button" onClick={clearAttachment} aria-label={tx("Quitar archivo")} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-4 w-4"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
    </div> : null}
    {chat?.readOnly ? <MatchChatReadOnlyBar>{tx("Temporada finalizada · Solo lectura")}</MatchChatReadOnlyBar> : chat ? <MatchChatComposer body={body} composerRef={composerRef} onSubmit={send} onBodyChange={(value, element) => { setBody(value); resizeMatchChatComposer(element) }} sending={pending !== null} hasTopAttachment={Boolean(attachment) || Boolean(replyTo)} allowEmpty={Boolean(attachment)} leadingAction={chat.canPublishMedia ? <><input ref={fileInputRef} type="file" accept={LEAGUE_CHAT_MEDIA_ACCEPT} onChange={pickFile} className="sr-only" tabIndex={-1} aria-hidden="true" /><button type="button" onClick={() => fileInputRef.current?.click()} disabled={pending !== null} aria-label={tx("Adjuntar foto o vídeo")} title={tx("Adjuntar foto o vídeo")} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition active:scale-95 disabled:opacity-40"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L10 17.7a1.7 1.7 0 0 1-2.4-2.4l7.6-7.6" /></svg></button></> : undefined} /> : null}
    {action?.mode === "menu" && menuAnchor && actionMessage ? <LeagueChatMessageMenu anchor={menuAnchor} mine={actionIsMine} label={optionsLabel}
      onClose={() => { setAction(null); setMenuAnchor(null) }}
      items={[
        { key: "reply", icon: "reply", label: tx("Responder"), onSelect: () => startReply(actionMessage) },
        ...(actionIsMine ? [
          { key: "edit", icon: "edit" as const, label: editLabel, onSelect: () => { setMenuAnchor(null); setAction({ id: actionMessage.id, mode: "edit" }) } },
          { key: "delete", icon: "delete" as const, danger: true, label: deleteLabel, onSelect: () => { setMenuAnchor(null); setAction({ id: actionMessage.id, mode: "delete" }) } },
        ] : []),
      ]} /> : null}
    <FloatingDialog open={Boolean(action) && action?.mode !== "menu"} onClose={() => setAction(null)} busy={changing} className="league-chat-edit-dialog"
      title={action?.mode === "edit" ? editLabel : deleteLabel}>
      {action && action.mode !== "menu" ? <form className="space-y-3" onSubmit={event => { event.preventDefault(); void changeMessage() }}>
        <h2 className="font-bold">{action.mode === "edit" ? editLabel : deleteLabel}</h2>
        {action.mode === "edit" ? <textarea aria-label={editLabel} ref={editorRef} value={editBody} maxLength={2000} rows={3}
          className="w-full rounded-lg border border-neutral-400 p-2" disabled={changing} onChange={event => setEditBody(event.target.value)} />
          : <p>{tx("El texto se eliminará para todos los participantes.")}</p>}
        {actionError ? <p role="alert">{tx("No se ha podido modificar el mensaje.")}</p> : null}
        <div className="flex justify-end gap-3">
          <button type="button" disabled={changing} onClick={() => setAction(null)}>{tx("Cancelar")}</button>
          <button type="submit" disabled={changing || (action.mode === "edit" && !editBody.trim() && !actionMessage?.media_url)}
            className="inline-flex items-center justify-center rounded-lg bg-neutral-950 px-3 py-2 text-center font-bold text-white disabled:opacity-50">
            {action.mode === "edit" ? tx("Guardar cambios") : deleteLabel}
          </button>
        </div>
      </form> : null}
    </FloatingDialog>
  </div>
}
