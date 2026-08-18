"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import {
  CHAT_UNREAD_LOCAL_REFRESH_EVENT,
  subscribeChatRealtime,
} from "@/lib/chatRealtimeClient"

type PersonalChatOverviewItem = {
  id: string
  status: "scheduled" | "finished"
  scheduledAt: string | null
  resultRecordedAt: string | null
  locationName: string | null
  readOnly: boolean
  expired: boolean
  partner: string
  rivals: string[]
  unread: number
  lastMessage: {
    sender: string
    body: string
    createdAt: string
  } | null
  realtimeTopic: string | null
}

function formatChatDate(value: string | null) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || ""
}

function participantLabel(chat: PersonalChatOverviewItem) {
  const rivals = chat.rivals.filter(Boolean).map(firstName)
  const rivalLabel =
    rivals.length > 1
      ? `${rivals.slice(0, -1).join(", ")} y ${rivals.at(-1)}`
      : rivals[0] ?? "Rivales"
  return `con ${firstName(chat.partner) || "Pareja"} vs ${rivalLabel}`
}

function chatBadge(chat: PersonalChatOverviewItem) {
  if (chat.expired) return "Historial eliminado"
  if (chat.readOnly) return "Solo lectura"
  if (chat.status === "finished") return "Abierto 24 h"
  return "Programado"
}

function errorMessage(error: string | null) {
  if (error === "personal_match_chat_schema_missing") {
    return "El chat de amistosos todavía no está activado en esta base de datos. Falta aplicar la migración del chat."
  }
  return "No se han podido cargar tus chats de amistosos."
}

export default function PersonalMatchChatsPage() {
  const [chats, setChats] = useState<PersonalChatOverviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const response = await fetch("/api/personal-matches/chats", {
      cache: "no-store",
    }).catch(() => null)
    const payload = response
      ? await response.json().catch(() => null)
      : null

    if (!response?.ok) {
      setError(
        payload && typeof payload.error === "string"
          ? payload.error
          : "personal_match_chats_lookup_failed",
      )
      setLoading(false)
      return
    }

    setChats(Array.isArray(payload?.chats) ? payload.chats : [])
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void load()
    }
    const handleLocalRefresh = () => void load()
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener(CHAT_UNREAD_LOCAL_REFRESH_EVENT, handleLocalRefresh)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener(CHAT_UNREAD_LOCAL_REFRESH_EVENT, handleLocalRefresh)
    }
  }, [load])

  const realtimeTopics = useMemo(
    () => [...new Set(chats.map((chat) => chat.realtimeTopic).filter((topic): topic is string => Boolean(topic)))],
    [chats],
  )
  const realtimeKey = realtimeTopics.join("|")

  useEffect(() => {
    if (!realtimeKey) return
    const unsubscribes = realtimeKey
      .split("|")
      .filter(Boolean)
      .map((topic) =>
        subscribeChatRealtime(topic, () => {
          if (document.visibilityState === "visible") void load()
        }),
      )
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [load, realtimeKey])

  return (
    <div className="compact-page space-y-3">
      <header className="app-page-header">
        <BackButton fallbackHref="/personal-matches" label="Volver" />
        <h1 className="type-page-title font-black tracking-tight">Chats</h1>
      </header>

      {loading ? (
        <AppCard>
          <p className="text-sm font-semibold text-neutral-500">
            Cargando conversaciones…
          </p>
        </AppCard>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
          {errorMessage(error)}
        </p>
      ) : null}

      {!loading && !error && chats.length === 0 ? (
        <AppCard>
          <p className="text-sm font-black">Todavía no tienes chats de amistosos.</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            Cuando registres un amistoso, su conversación aparecerá aquí.
          </p>
        </AppCard>
      ) : null}

      {!error && chats.length > 0 ? (
        <div className="overflow-hidden rounded-xl" data-personal-match-chats-list>
          {chats.map((chat, index) => {
            const radius =
              chats.length === 1
                ? "!rounded-xl"
                : index === 0
                  ? "!rounded-t-xl !rounded-b-none"
                  : index === chats.length - 1
                    ? "!rounded-b-xl !rounded-t-none"
                    : "!rounded-none"
            const eventDate =
              chat.lastMessage?.createdAt ??
              chat.resultRecordedAt ??
              chat.scheduledAt

            return (
              <Link
                key={chat.id}
                href={`/personal-matches/${encodeURIComponent(chat.id)}/chat`}
                className={`block ${index ? "-mt-px" : ""}`}
              >
                <AppCard
                  className={`app-card-explicit-accent !overflow-hidden !p-0 !shadow-none transition active:scale-[0.99] ${radius} ${chat.unread ? "chat-list-card-unread" : ""}`}
                >
                  <div className="min-w-0 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <p className="type-panel-title min-w-0 flex-1 truncate font-black">
                        Amistoso
                      </p>
                      {chat.unread > 0 ? (
                        <span
                          aria-label={`${chat.unread} mensaje${chat.unread === 1 ? "" : "s"} sin leer`}
                          className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-neutral-950 px-1.5 type-caption font-black text-white shadow-sm"
                        >
                          {chat.unread > 99 ? "99+" : chat.unread}
                        </span>
                      ) : null}
                      <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 type-caption font-black uppercase tracking-[0.12em] text-neutral-500">
                        {chatBadge(chat)}
                      </span>
                    </div>

                    <p className="mt-0.5 truncate type-small font-semibold text-neutral-600">
                      {participantLabel(chat)}
                    </p>

                    {chat.locationName ? (
                      <p className="mt-0.5 truncate type-caption font-semibold text-neutral-400">
                        {chat.locationName}
                      </p>
                    ) : null}

                    <div className="mt-2 flex min-w-0 items-center gap-2 border-t border-neutral-100 pt-2">
                      <div className="min-w-0 flex-1">
                        {chat.lastMessage ? (
                          <p
                            className={`truncate type-caption ${chat.unread ? "font-black text-neutral-800" : "font-semibold text-neutral-500"}`}
                          >
                            <span className="font-black">{chat.lastMessage.sender}</span>: {chat.lastMessage.body}
                          </p>
                        ) : (
                          <p className="type-caption font-semibold text-neutral-400">
                            {chat.expired
                              ? "Los mensajes ya se han eliminado"
                              : "Sin mensajes todavía"}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 type-caption font-semibold text-neutral-400">
                        {formatChatDate(eventDate)}
                      </p>
                    </div>
                  </div>
                </AppCard>
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
