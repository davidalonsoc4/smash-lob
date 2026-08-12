"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { MatchTeamsPanel } from "@/components/matches/MatchTeamsPanel"
import { BackButton } from "@/components/ui/BackButton"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
type Message = {
  id: string
  sender_user_id: string
  sender_display_name: string
  body: string
  created_at: string
}
const chatErrorMessage = (error?: string) =>
  error === "match_chat_unavailable"
    ? "El chat todavía no está disponible en este entorno."
    : error ?? "No se ha podido cargar el chat."
export default function MatchChatPage() {
  const id = String(useParams<{ id: string }>().id)
  const { matches, players } = useCurrentLeagueData()
  const match = matches.find((item) => item.id === id)
  const [messages, setMessages] = useState<Message[]>([])
  const [me, setMe] = useState("")
  const [round, setRound] = useState<number | null>(null)
  const [body, setBody] = useState("")
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const matchRound = match?.round ?? round
  const load = useCallback(async () => {
    const response = await fetch(`/api/matches/${encodeURIComponent(id)}/chat`, {
      cache: "no-store",
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      setError(chatErrorMessage(data?.error))
      return
    }
    setMessages(data.messages ?? [])
    setMe(data.currentUserId ?? "")
    setRound(data.round ?? null)
    setError("")
  }, [id, setError, setMe, setMessages, setRound])
  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void load()
    }, 0)
    const pollingTimer = window.setInterval(() => {
      if (!document.hidden) void load()
    }, 2500)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(pollingTimer)
    }
  }, [load])
  useEffect(() => {
    const panel = messagesRef.current
    if (panel) {
      panel.scrollTo({ top: panel.scrollHeight, behavior: "smooth" })
    }
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
    let restingViewportHeight = visualViewport?.height ?? window.innerHeight
    html.style.overflow = "hidden"
    pageBody.style.overflow = "hidden"
    pageBody.style.overscrollBehavior = "none"
    const syncViewport = (keepLatestVisible = false, forceComposerFocused = false) => {
      const visibleHeight = visualViewport?.height ?? window.innerHeight
      const visibleTop = visualViewport?.offsetTop ?? 0
      const composerFocused = forceComposerFocused || document.activeElement === composerRef.current
      if (!composerFocused) restingViewportHeight = visibleHeight
      const keyboardLikelyOpen =
        composerFocused && restingViewportHeight - visibleHeight > 120
      root.style.height = `${Math.round(visibleHeight)}px`
      root.style.top = `${Math.round(visibleTop)}px`
      root.style.setProperty(
        "--match-chat-bottom-inset",
        keyboardLikelyOpen ? "0px" : "env(safe-area-inset-bottom, 0px)",
      )
      if (keepLatestVisible) {
        window.requestAnimationFrame(() => {
          const panel = messagesRef.current
          if (panel) panel.scrollTop = panel.scrollHeight
        })
      }
    }
    const handleViewportResize = () => syncViewport(true)
    const handleViewportScroll = () => syncViewport(false)
    const composer = composerRef.current
    const focusTimers: number[] = []
    const handleComposerFocus = () => {
      restingViewportHeight = Math.max(restingViewportHeight, window.innerHeight, visualViewport?.height ?? 0)
      syncViewport(true, true)
      for (const delay of [0, 80, 180, 320]) {
        focusTimers.push(window.setTimeout(() => syncViewport(true, true), delay))
      }
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
    }
  }, [])
  function resizeComposer(target: HTMLTextAreaElement) {
    target.style.height = "auto"
    target.style.height = `${Math.min(target.scrollHeight, 128)}px`
  }
  async function send(event: React.FormEvent) {
    event.preventDefault()
    const text = body.trim()
    if (!text || sending) return
    setSending(true)
    const response = await fetch(`/api/matches/${encodeURIComponent(id)}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    })
    const data = await response.json().catch(() => null)
    if (response.ok) {
      setBody("")
      if (composerRef.current) composerRef.current.style.height = "auto"
      await load()
    } else {
      setError(
        data?.error === "match_chat_rate_limited"
          ? "Demasiados mensajes seguidos. Espera unos segundos."
          : chatErrorMessage(data?.error),
      )
    }
    setSending(false)
  }
  return (
    <div
      ref={viewportRef}
      className="fixed inset-x-0 top-0 z-[60] mx-auto flex w-full max-w-md min-h-0 flex-col overflow-hidden bg-stone-50"
      style={{ height: "100dvh" }}
    >
      <header
        className="app-page-header shrink-0 border-b border-neutral-200 bg-stone-50 px-3 pb-2"
        style={{ paddingTop: "max(10px, env(safe-area-inset-top, 0px))" }}
      >
        <div className="relative flex min-h-10 items-center">
          <BackButton fallbackHref={`/match/${id}`} label="Volver" />
          <h1 className="type-page-title pointer-events-none absolute left-1/2 max-w-[65%] -translate-x-1/2 truncate text-center font-black tracking-tight">
            {matchRound ? `Chat · Jornada ${matchRound}` : "Chat del partido"}
          </h1>
        </div>
      </header>
      {match ? (
        <div className="shrink-0 px-3 pt-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-2.5 shadow-sm">
            <MatchTeamsPanel
              teamA={match.teamA}
              teamB={match.teamB}
              players={players}
              mode="versus"
              linkPlayers={false}
            />
          </div>
        </div>
      ) : null}
      <div
        ref={messagesRef}
        className="mx-3 mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl bg-neutral-100 p-3 shadow-inner"
      >
        {messages.length === 0 && !error ? (
          <p className="py-16 text-center text-sm font-semibold text-neutral-500">
            Todavía no hay mensajes. Escribe para organizar el partido.
          </p>
        ) : null}
        <div className="space-y-2">
          {messages.map((message) => {
            const mine = message.sender_user_id === me
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[84%] rounded-2xl px-3 py-2 shadow-sm ${
                    mine
                      ? "rounded-br-md bg-neutral-950 text-white"
                      : "rounded-bl-md border border-neutral-200 bg-white text-neutral-950"
                  }`}
                >
                  {!mine ? (
                    <p className="type-caption font-black text-neutral-500">
                      {message.sender_display_name}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words text-sm leading-5">{message.body}</p>
                  <p
                    className={`mt-0.5 text-right leading-none ${
                      mine ? "text-neutral-300" : "text-neutral-400"
                    }`}
                  >
                    <span className="inline-block origin-right scale-90 type-caption">
                      {new Date(message.created_at).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {error ? (
        <p className="mx-3 mt-2 shrink-0 rounded-xl bg-red-50 px-3 py-2 type-caption font-bold text-red-700">
          {error}
        </p>
      ) : null}
      <form
        onSubmit={send}
        className="mt-2 flex shrink-0 items-end gap-2 border-t border-neutral-200 bg-white px-3 pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]"
        style={{
          paddingBottom: "max(8px, var(--match-chat-bottom-inset, env(safe-area-inset-bottom, 0px)))",
        }}
      >
        <textarea
          ref={composerRef}
          value={body}
          onChange={(event) => {
            setBody(event.target.value)
            resizeComposer(event.currentTarget)
          }}
          maxLength={2000}
          rows={1}
          enterKeyHint="send"
          placeholder="Escribe un mensaje…"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
          className="max-h-32 min-h-10 flex-1 resize-none overflow-y-auto rounded-xl bg-neutral-100 px-3 py-2 text-base leading-5 outline-none"
        />
        <button
          type="submit"
          disabled={!body.trim() || sending}
          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-neutral-950 px-4 text-center text-sm font-black text-white disabled:opacity-40"
        >
          {sending ? "…" : "Enviar"}
        </button>
      </form>
    </div>
  )
}
