"use client"

import { FormEvent, useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
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
  messages: PersonalChatMessage[]
  participants: PersonalChatParticipant[]
  currentUserId: string
  readOnly: boolean
  expired: boolean
  writeUntil: string | null
  realtimeTopic: string | null
}

function mapSnapshot(value: unknown): PersonalChatSnapshot {
  const source =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}

  return {
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
  const id = String(useParams<{ id: string }>().id ?? "")
  const [snapshot, setSnapshot] = useState<PersonalChatSnapshot | null>(null)
  const [body, setBody] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const messagesRef = useRef<HTMLDivElement | null>(null)
  const composerRef = useRef<HTMLTextAreaElement | null>(null)

  const loadChat = useCallback(
    async (options?: { markRead?: boolean; silent?: boolean }) => {
      const markRead = options?.markRead !== false
      if (!options?.silent) setError(null)

      try {
        const response = await fetch(
          `/api/personal-matches/${encodeURIComponent(id)}/chat${
            markRead ? "" : "?markRead=0"
          }`,
          { cache: "no-store" },
        )
        const payload = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(
            payload && typeof payload.error === "string"
              ? payload.error
              : "personal_match_chat_lookup_failed",
          )
        }
        setSnapshot(mapSnapshot(payload))
        if (markRead) {
          window.dispatchEvent(new Event(CHAT_UNREAD_LOCAL_REFRESH_EVENT))
        }
      } catch (loadError) {
        if (!options?.silent) {
          setError(
            loadError instanceof Error &&
              loadError.message === "personal_match_chat_schema_missing"
              ? "El chat de amistosos todavía no está activado en esta base de datos. Falta aplicar la migración del chat."
              : "No se ha podido cargar el chat del amistoso.",
          )
        }
      } finally {
        if (!options?.silent) setLoading(false)
      }
    },
    [id],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => void loadChat(), 0)
    return () => window.clearTimeout(timer)
  }, [loadChat])

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
    if (!text || sending || snapshot?.readOnly || snapshot?.expired) return

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

      setBody("")
      if (composerRef.current) composerRef.current.style.height = "auto"
      await loadChat({ silent: true })
      requestAnimationFrame(() => composerRef.current?.focus())
    } catch (sendError) {
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

  const topContent = (
    <>
      {snapshot && !snapshot.readOnly && snapshot.writeUntil ? (
        <MatchChatWriteWindowBanner writeUntil={snapshot.writeUntil} />
      ) : null}
      {snapshot?.expired ? (
        <div className="shrink-0 border-b border-neutral-200 bg-white px-3 py-2 text-center type-caption font-bold text-neutral-500">
          Historial eliminado · Los mensajes de los amistosos se borran 2 meses después del partido.
        </div>
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
          {snapshot?.expired ? "Chat eliminado" : "Aún no hay mensajes"}
        </p>
        {!snapshot?.expired ? (
          <p className="mt-1 type-caption font-semibold leading-4 text-neutral-400">
            Usa este chat para coordinar cualquier detalle del amistoso.
          </p>
        ) : null}
      </div>
    </div>
  )

  const footer = snapshot?.readOnly || snapshot?.expired ? (
    <MatchChatReadOnlyBar>
      {snapshot.expired
        ? "Chat archivado · Historial eliminado tras 2 meses"
        : "Partido finalizado · Chat en modo lectura"}
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
      title="Chat · Amistoso"
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
