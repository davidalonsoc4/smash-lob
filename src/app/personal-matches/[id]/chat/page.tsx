"use client"

import { FormEvent, useCallback, useEffect, useRef, useState } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { useSession } from "next-auth/react"
import { openChatWithPreview } from "@/lib/chatEntryRequest"
import { clearMatchChatCache, readMatchChatCache, writeMatchChatCache } from "@/lib/matchChatCache"
import { useParams } from "next/navigation"
import { useChatReservationPhase } from "@/hooks/useChatReservationPhase"
import { PersonalAddToCalendarButton } from "@/components/personal/PersonalAddToCalendarButton"
import { MatchChatReservationSummary, MatchChatResultPendingBanner } from "@/components/match/chat/MatchChatReservationSummary"
import type { PersonalMatchItem } from "@/lib/personalMatches"
import { getIntlLocale } from "@/i18n/localeFormatting"
import {
  MatchChatComposer,
  MatchChatReadOnlyBar,
  MatchChatScreen,
  MatchChatTextMessage,
  MatchChatWriteWindowBanner,
  resizeMatchChatComposer,
  useMatchChatAutoScroll,
  useMatchChatViewport,
  type MatchChatParticipant,
  type MatchChatTextMessageData,
} from "@/components/match/chat/MatchChatShared"
import {
  CHAT_UNREAD_LOCAL_REFRESH_EVENT,
  subscribeChatRealtime,
} from "@/lib/chatRealtimeClient"

type PersonalChatMessage = MatchChatTextMessageData

type PersonalChatParticipant = MatchChatParticipant & {
  participantId: string
}

type PersonalChatSnapshot = {
  match: PersonalMatchItem | null
  messages: PersonalChatMessage[]
  participants: PersonalChatParticipant[]
  currentUserId: string
  readOnly: boolean
  expired: boolean
  writeUntil: string | null
  realtimeTopic: string | null
}

let fallbackPendingMessageSequence = 0

function createPendingMessageId() {
  const cryptoApi = typeof globalThis !== "undefined" ? globalThis.crypto : undefined

  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return `pending-${cryptoApi.randomUUID()}`
  }

  if (cryptoApi && typeof cryptoApi.getRandomValues === "function") {
    const values = new Uint32Array(4)
    cryptoApi.getRandomValues(values)
    return `pending-${Array.from(values, (value) => value.toString(36)).join("-")}`
  }

  fallbackPendingMessageSequence += 1
  return `pending-fallback-${fallbackPendingMessageSequence}`
}

function mapSnapshot(value: unknown): PersonalChatSnapshot {
  const source =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}

  return {
    match: source.match && typeof source.match === "object" ? source.match as PersonalMatchItem : null,
    messages: Array.isArray(source.messages)
      ? (source.messages as PersonalChatMessage[])
      : [],
    participants: Array.isArray(source.participants)
      ? (source.participants as PersonalChatParticipant[])
      : [],
    currentUserId:
      typeof source.currentUserId === "string" ? source.currentUserId : "",
    readOnly: Boolean(source.readOnly),
    expired: Boolean(source.expired),
    writeUntil:
      typeof source.writeUntil === "string" ? source.writeUntil : null,
    realtimeTopic:
      typeof source.realtimeTopic === "string" ? source.realtimeTopic : null,
  }
}

export default function PersonalMatchChatPage() {
  const account = useSession().data?.user?.email
  const id = String(useParams<{ id: string }>().id ?? "")
  return <PersonalMatchChat key={JSON.stringify([account, id])} account={account} id={id} />
}

function PersonalMatchChat({ account, id }: { account?: string | null; id: string }) {
  const { tx, locale } = useI18n()
  const cacheKey = `personal-chat:${id}`
  const [initialSnapshot] = useState(() => account ? readMatchChatCache(cacheKey, account) as PersonalChatSnapshot | null : null)
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [body, setBody] = useState("")
  const [loading, setLoading] = useState(!initialSnapshot)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const messagesRef = useRef<HTMLDivElement | null>(null)
  const composerRef = useRef<HTMLTextAreaElement | null>(null)

  const loadChat = useCallback(
    async (options?: { markRead?: boolean; silent?: boolean; signal?: AbortSignal }) => {
      const markRead = options?.markRead !== false
      if (!options?.silent) setError(null)

      try {
        const response = await fetch(
          `/api/personal-matches/${encodeURIComponent(id)}/chat${
            markRead ? "" : "?markRead=0"
          }`,
          { cache: "no-store", signal: options?.signal },
        )
        const payload = await response.json().catch(() => null)
        if (options?.signal?.aborted) return
        if (!response.ok) {
          if ([401, 403, 404].includes(response.status)) {
            if (account) clearMatchChatCache(cacheKey, account)
            setSnapshot(null)
          }
          throw new Error(
            payload && typeof payload.error === "string"
              ? payload.error
              : "personal_match_chat_lookup_failed",
          )
        }
        const nextSnapshot = mapSnapshot(payload)
        if (account) writeMatchChatCache(cacheKey, account, nextSnapshot)
        setSnapshot(nextSnapshot)
        if (markRead) {
          window.dispatchEvent(new Event(CHAT_UNREAD_LOCAL_REFRESH_EVENT))
        }
      } catch (loadError) {
        if (!options?.silent && !options?.signal?.aborted) {
          setError(
            loadError instanceof Error &&
              loadError.message === "personal_match_chat_schema_missing"
              ? "El chat de amistosos todavía no está activado en esta base de datos. Falta aplicar la migración del chat."
              : "No se ha podido cargar el chat del amistoso.",
          )
        }
      } finally {
        if (!options?.silent && !options?.signal?.aborted) setLoading(false)
      }
    },
    [account, cacheKey, id],
  )

  useEffect(() => {
    const controller = new AbortController()
    const refresh = () => loadChat({ signal: controller.signal })
    const timer = window.setTimeout(() => {
      if (initialSnapshot) void refresh()
      else void openChatWithPreview(account, `/api/personal-matches/${encodeURIComponent(id)}/chat`, payload => {
        if (controller.signal.aborted) return
        setSnapshot({ ...mapSnapshot(payload), realtimeTopic: null })
        setLoading(false)
      }, refresh)
    }, 0)
    return () => { controller.abort(); window.clearTimeout(timer) }
  }, [account, id, initialSnapshot, loadChat])

  useEffect(() => {
    if (!snapshot?.realtimeTopic) return
    return subscribeChatRealtime(snapshot.realtimeTopic, () => {
      void loadChat({ silent: true })
    })
  }, [loadChat, snapshot?.realtimeTopic])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void loadChat({ silent: true })
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [loadChat])

  useEffect(() => {
    if (!snapshot?.writeUntil || snapshot.readOnly) return
    const cutoff = Date.parse(snapshot.writeUntil)
    if (!Number.isFinite(cutoff)) return
    const delay = cutoff - Date.now()
    const timeout = Math.max(0, Math.min(delay + 250, 2_147_000_000))
    const timer = window.setTimeout(
      () => void loadChat({ silent: true }),
      timeout,
    )
    return () => window.clearTimeout(timer)
  }, [loadChat, snapshot?.readOnly, snapshot?.writeUntil])

  const messages = snapshot?.messages ?? []
  const participants = snapshot?.participants ?? []
  const me = snapshot?.currentUserId ?? ""

  useMatchChatAutoScroll({
    messagesRef,
    messageCount: messages.length,
    mode: "stick",
  })
  useMatchChatViewport({ viewportRef, composerRef, messagesRef })

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = body.trim()
    if (!text || sending || snapshot?.readOnly || snapshot?.expired || !snapshot) return

    const optimisticId = createPendingMessageId()
    const senderDisplayName =
      snapshot.participants.find((participant) => participant.userId === snapshot.currentUserId)?.displayName ??
      "Tú"
    const optimisticMessage: PersonalChatMessage = {
      id: optimisticId,
      sender_user_id: snapshot.currentUserId,
      sender_display_name: senderDisplayName,
      body: text,
      created_at: new Date().toISOString(),
    }

    setSnapshot((current) =>
      current
        ? { ...current, messages: [...current.messages, optimisticMessage] }
        : current,
    )
    setBody("")
    if (composerRef.current) composerRef.current.style.height = "auto"
    setSending(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/personal-matches/${encodeURIComponent(id)}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        },
      )
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        if (payload?.error === "personal_match_chat_read_only") {
          await loadChat({ silent: true })
          throw new Error("read_only")
        }
        if (payload?.error === "personal_match_chat_schema_missing") {
          throw new Error("personal_match_chat_schema_missing")
        }
        throw new Error("send_failed")
      }

      window.dispatchEvent(new Event(CHAT_UNREAD_LOCAL_REFRESH_EVENT))
      const confirmed = payload?.message as PersonalChatMessage | undefined
      if (confirmed?.id) {
        setSnapshot((current) => {
          if (!current) return current
          const withoutPending = current.messages.filter((message) => message.id !== optimisticId)
          if (withoutPending.some((message) => message.id === confirmed.id)) {
            return { ...current, messages: withoutPending }
          }
          return { ...current, messages: [...withoutPending, confirmed] }
        })
      } else {
        void loadChat({ silent: true })
      }
    } catch (sendError) {
      setSnapshot((current) =>
        current
          ? { ...current, messages: current.messages.filter((message) => message.id !== optimisticId) }
          : current,
      )
      setBody((current) => current || text)
      requestAnimationFrame(() => {
        if (composerRef.current) resizeMatchChatComposer(composerRef.current)
      })
      setError(
        sendError instanceof Error &&
          sendError.message === "personal_match_chat_schema_missing"
          ? "El chat de amistosos todavía no está activado en esta base de datos. Falta aplicar la migración del chat."
          : "No se ha podido enviar el mensaje.",
      )
    } finally {
      setSending(false)
    }
  }

  const match = snapshot?.match
  const reservedAt = match?.status === "scheduled" && !match.resultRecordedAt && match.courtBooking?.isReserved ? match.scheduledAt : null
  const reservationPhase = useChatReservationPhase(reservedAt)
  const topContent = (
    <>
      {match && reservedAt && reservationPhase === "upcoming" ? (
        <PersonalAddToCalendarButton match={match} triggerClassName="app-match-reservation-banner flex min-h-12 w-full shrink-0 items-center gap-3 border-b border-blue-100 bg-blue-50 px-3 py-1.5 text-left text-blue-900">
          <MatchChatReservationSummary date={new Intl.DateTimeFormat(getIntlLocale(locale), { dateStyle: "medium", timeStyle: "short" }).format(new Date(reservedAt))} location={match.locationName} />
        </PersonalAddToCalendarButton>
      ) : null}
      {reservationPhase === "result_pending" && !snapshot?.readOnly && !snapshot?.expired ? <MatchChatResultPendingBanner href={`/personal-matches/${id}`} /> : null}
      {snapshot && !snapshot.readOnly && snapshot.writeUntil ? (
        <MatchChatWriteWindowBanner writeUntil={snapshot.writeUntil} />
      ) : null}
      {snapshot?.expired ? (
        <div className="shrink-0 border-b border-neutral-200 bg-white px-3 py-2 text-center type-caption font-bold text-neutral-500">{tx("Historial eliminado · Los mensajes de los amistosos se borran 2 meses después del partido.")}</div>
      ) : null}
    </>
  )

  const messageNodes = messages.map((message, index) => {
    const previous = index > 0 ? messages[index - 1] : null
    const previousSameSender = previous?.sender_user_id === message.sender_user_id
    const spacing = previousSameSender ? "mt-0.5" : index ? "mt-2" : ""

    return (
      <MatchChatTextMessage
        key={message.id}
        message={message}
        me={me}
        participants={participants}
        previousSameSender={previousSameSender}
        rowClassName={spacing}
      />
    )
  })

  const emptyState = (
    <div className="flex min-h-full items-center justify-center px-8 py-10 text-center">
      <div>
        <p className="text-sm font-black text-neutral-700">
          {snapshot?.expired ? "Chat eliminado" : tx("Aún no hay mensajes")}
        </p>
        {!snapshot?.expired ? (
          <p className="mt-1 type-caption font-semibold leading-4 text-neutral-400">{tx("Usa este chat para coordinar cualquier detalle del amistoso.")}</p>
        ) : null}
      </div>
    </div>
  )

  const footer = snapshot?.readOnly || snapshot?.expired ? (
    <MatchChatReadOnlyBar>
      {snapshot.expired
        ? "Chat archivado · Historial eliminado tras 2 meses"
        : tx("Partido finalizado · Chat en modo lectura")}
    </MatchChatReadOnlyBar>
  ) : (
    <MatchChatComposer
      body={body}
      composerRef={composerRef}
      onSubmit={send}
      onBodyChange={(value, element) => {
        setBody(value)
        resizeMatchChatComposer(element)
      }}
      sending={sending}
    />
  )

  return (
    <MatchChatScreen
      viewportRef={viewportRef}
      backHref={`/personal-matches/${id}`}
      title={tx("Amistoso")}
      titleHref={`/personal-matches/${id}`}
      messagesRef={messagesRef}
      loading={loading}
      error={error}
      hasMessages={messages.length > 0}
      emptyState={emptyState}
      topContent={topContent}
      messages={messageNodes}
      footer={footer}
    />
  )
}
