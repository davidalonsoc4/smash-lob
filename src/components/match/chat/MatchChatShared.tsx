"use client"

import Link from "next/link"
import {
  useEffect,
  useLayoutEffect,
  useRef,
  type FormEventHandler,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type ReactNode,
  type RefObject,
} from "react"
import { MatchChatSendIcon } from "@/components/match/MatchChatSendIcon"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { BackButton } from "@/components/ui/BackButton"
import { useI18n } from "@/i18n/I18nProvider"
import { getIntlLocale } from "@/i18n/leagueText"
import type { Locale } from "@/i18n/translations"

export type MatchChatParticipant = {
  userId: string | null
  displayName: string
  avatarUrl: string | null
  lastReadAt: string | null
}

export type MatchChatTextMessageData = {
  id: string
  sender_user_id: string
  sender_display_name: string
  body: string
  created_at: string
}

export type MatchChatQuotedReply = {
  senderDisplayName: string
  body: string
  href?: string | null
}

const CHAT_PERSON_COLORS = [
  "text-sky-700",
  "text-violet-700",
  "text-amber-700",
  "text-teal-700",
] as const

export function getMatchChatParticipantColorClass(
  userId: string,
  participants: MatchChatParticipant[],
) {
  const index = participants.findIndex((item) => item.userId === userId)
  return CHAT_PERSON_COLORS[(index < 0 ? 0 : index) % CHAT_PERSON_COLORS.length]
}

export function MatchChatMessageReceipt({
  message,
  me,
  participants,
  pending = false,
}: {
  message: MatchChatTextMessageData
  me: string
  participants: MatchChatParticipant[]
  pending?: boolean
}) {
  const { tx } = useI18n()
  const others = participants.filter((item) => item.userId && item.userId !== me)
  const readCount = others.filter(
    (item) =>
      item.lastReadAt &&
      Date.parse(item.lastReadAt) >= Date.parse(message.created_at),
  ).length
  const allRead = !pending && others.length > 0 && readCount === others.length
  const label = pending
    ? tx("Enviando")
    : allRead
      ? tx("Leído por todos")
      : readCount
        ? tx(`Leído por ${readCount}`)
        : tx("Enviado")

  return (
    <span
      className={`ml-1 inline-flex align-middle type-caption font-black ${
        allRead ? "text-sky-400" : "text-neutral-400"
      }`}
      title={label}
      aria-label={label}
    >
      {pending ? "·" : allRead ? "✓✓" : "✓"}
    </span>
  )
}

export function MatchChatTextMessage({
  message,
  me,
  participants,
  previousSameSender,
  senderHref,
  quotedReply,
  bodyContent,
  pending = false,
  rowClassName = "",
  gestureProps,
}: {
  message: MatchChatTextMessageData
  me: string
  participants: MatchChatParticipant[]
  previousSameSender: boolean
  senderHref?: string | null
  quotedReply?: MatchChatQuotedReply | null
  bodyContent?: ReactNode
  pending?: boolean
  rowClassName?: string
  gestureProps?: HTMLAttributes<HTMLDivElement>
}) {
  const { locale } = useI18n()
  const mine = message.sender_user_id === me || pending
  const sender = participants.find((item) => item.userId === message.sender_user_id)
  const senderColor = getMatchChatParticipantColorClass(
    message.sender_user_id,
    participants,
  )

  return (
    <div
      {...gestureProps}
      className={`flex items-start gap-1 ${mine ? "justify-end" : "justify-start"} ${rowClassName}`}
    >
      {!mine ? (
        <span className="flex h-7 w-7 shrink-0 items-start">
          {!previousSameSender ? (
            <PlayerAvatar
              player={{
                displayName: sender?.displayName ?? message.sender_display_name,
                avatarUrl: sender?.avatarUrl ?? null,
              }}
              size="sm"
            />
          ) : null}
        </span>
      ) : null}

      <div
        className={`max-w-[86%] rounded-2xl px-2.5 py-1.5 shadow-sm ${
          mine
            ? `${!previousSameSender ? "rounded-tr-md " : ""}border border-transparent bg-clip-padding bg-neutral-950 text-white`
            : `${!previousSameSender ? "rounded-tl-md " : ""}border border-neutral-200 bg-white text-neutral-950`
        }`}
      >
        {!mine && !previousSameSender ? (
          senderHref ? (
            <Link
              href={senderHref}
              onClick={(event) => event.stopPropagation()}
              className={`block w-fit max-w-full truncate whitespace-nowrap type-caption font-black underline-offset-2 active:underline ${senderColor}`}
            >
              {message.sender_display_name}
            </Link>
          ) : (
            <p className={`max-w-full truncate whitespace-nowrap type-caption font-black ${senderColor}`}>
              {message.sender_display_name}
            </p>
          )
        ) : null}

        {quotedReply ? (
          <div
            className={`mb-1 rounded-lg border-l-2 px-2 py-1 ${
              mine
                ? "border-white/50 bg-white/10"
                : "border-neutral-300 bg-neutral-100"
            }`}
          >
            {quotedReply.href ? (
              <Link
                href={quotedReply.href}
                onClick={(event) => event.stopPropagation()}
                className={`block truncate type-caption font-black underline-offset-2 active:underline ${
                  mine ? "text-neutral-100" : "text-neutral-600"
                }`}
              >
                {quotedReply.senderDisplayName}
              </Link>
            ) : (
              <p
                className={`truncate type-caption font-black ${
                  mine ? "text-neutral-100" : "text-neutral-600"
                }`}
              >
                {quotedReply.senderDisplayName}
              </p>
            )}
            <p
              className={`truncate type-caption font-semibold ${
                mine ? "text-neutral-300" : "text-neutral-500"
              }`}
            >
              {quotedReply.body}
            </p>
          </div>
        ) : null}

        <div className="relative">
          <p
            className={`whitespace-pre-wrap break-words ${
              mine ? "pr-16" : "pr-11"
            } text-sm leading-5`}
          >
            {bodyContent ?? message.body}
          </p>
          <span
            className={`absolute bottom-0 right-0 inline-flex whitespace-nowrap leading-none ${
              mine ? "text-neutral-300" : "text-neutral-400"
            }`}
          >
            <span className="origin-right scale-90 type-caption">
              {new Date(message.created_at).toLocaleTimeString(getIntlLocale(locale), {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {mine ? (
                <MatchChatMessageReceipt
                  message={message}
                  me={me}
                  participants={participants}
                  pending={pending}
                />
              ) : null}
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

export function MatchChatComposer({
  body,
  composerRef,
  onSubmit,
  onBodyChange,
  onTextareaClick,
  onKeyDown,
  leadingAction,
  disabled = false,
  sending = false,
  hasTopAttachment = false,
}: {
  body: string
  composerRef: RefObject<HTMLTextAreaElement | null>
  onSubmit: FormEventHandler<HTMLFormElement>
  onBodyChange: (value: string, element: HTMLTextAreaElement) => void
  onTextareaClick?: MouseEventHandler<HTMLTextAreaElement>
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>
  leadingAction?: ReactNode
  disabled?: boolean
  sending?: boolean
  hasTopAttachment?: boolean
}) {
  const { tx } = useI18n()
  return (
    <form
      data-tour="chat-composer"
      onSubmit={onSubmit}
      className={`flex shrink-0 items-end gap-2 bg-white px-3 pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] ${
        hasTopAttachment ? "" : "border-t border-neutral-200"
      }`}
      style={{
        paddingBottom:
          "max(8px, var(--match-chat-bottom-inset, env(safe-area-inset-bottom, 0px)))",
      }}
    >
      {leadingAction}
      <textarea
        ref={composerRef}
        value={body}
        onChange={(event) => onBodyChange(event.target.value, event.currentTarget)}
        onClick={onTextareaClick}
        maxLength={2000}
        rows={1}
        enterKeyHint="send"
        placeholder={tx("Escribe un mensaje…")}
        onKeyDown={
          onKeyDown ??
          ((event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          })
        }
        disabled={disabled}
        className="max-h-32 min-h-10 flex-1 resize-none overflow-y-auto rounded-xl bg-neutral-100 px-3 py-2 text-base leading-5 outline-none disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || sending || !body.trim()}
        onPointerDown={(event) => event.preventDefault()}
        aria-label={tx("Enviar mensaje")}
        title={tx("Enviar mensaje")}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white transition active:scale-95 disabled:opacity-40"
      >
        <MatchChatSendIcon />
      </button>
    </form>
  )
}

export function MatchChatReadOnlyBar({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-14 shrink-0 items-center justify-center border-t border-neutral-200 bg-white px-3 pt-2 text-center type-caption font-bold text-neutral-500"
      style={{
        paddingBottom:
          "max(8px, var(--match-chat-bottom-inset, env(safe-area-inset-bottom, 0px)))",
      }}
    >
      {children}
    </div>
  )
}

export function MatchChatWriteWindowBanner({
  writeUntil,
}: {
  writeUntil: string | null
}) {
  const { tx, locale } = useI18n()
  const label = formatMatchChatWriteUntil(writeUntil, locale)
  return (
    <div className="shrink-0 border-b border-amber-100 bg-amber-50 px-3 py-1.5 text-center type-caption font-bold text-amber-800">
      {tx("Partido finalizado · Puedes seguir escribiendo hasta")}{" "}{label ?? tx("24 h después del resultado")}.
    </div>
  )
}


export function MatchChatFrame({
  viewportRef,
  backHref,
  title,
  titleHref,
  children,
}: {
  viewportRef: RefObject<HTMLDivElement | null>
  backHref: string
  title: string
  titleHref?: string | null
  children: ReactNode
}) {
  const { tx } = useI18n()
  return (
    <div
      ref={viewportRef}
      className="fixed inset-x-0 top-0 z-[60] mx-auto flex w-full max-w-md min-h-0 flex-col overflow-hidden bg-stone-50"
      style={{ height: "100dvh" }}
    >
      <header className="app-page-header app-match-chat-header shrink-0 border-b border-neutral-200 bg-stone-50 px-3 pb-2">
        <div className="relative flex min-h-10 items-center">
          <BackButton fallbackHref={backHref} label={tx("Volver")} />
          {titleHref ? (
            <Link
              href={titleHref}
              aria-label={tx("Abrir detalle del partido")}
              className="absolute left-1/2 max-w-[65%] -translate-x-1/2 truncate rounded-lg px-1 text-center transition active:scale-[0.98]"
            >
              <h1 className="type-page-title truncate font-black tracking-tight">{title}</h1>
            </Link>
          ) : (
            <div className="absolute left-1/2 max-w-[65%] -translate-x-1/2 truncate rounded-lg px-1 text-center">
              <h1 className="type-page-title truncate font-black tracking-tight">{title}</h1>
            </div>
          )}
        </div>
      </header>
      {children}
    </div>
  )
}

export function MatchChatScreen({
  viewportRef,
  backHref,
  title,
  titleHref,
  messagesRef,
  loading,
  error,
  hasMessages,
  emptyState,
  topContent,
  messages,
  footer,
}: {
  viewportRef: RefObject<HTMLDivElement | null>
  backHref: string
  title: string
  titleHref?: string | null
  messagesRef: RefObject<HTMLDivElement | null>
  loading: boolean
  error?: string | null
  hasMessages: boolean
  emptyState: ReactNode
  topContent?: ReactNode
  messages: ReactNode
  footer: ReactNode
}) {
  const { tx } = useI18n()

  return (
    <MatchChatFrame
      viewportRef={viewportRef}
      backHref={backHref}
      title={title}
      titleHref={titleHref}
    >
      <div
        data-tour="chat-messages"
        className="flex min-h-0 flex-1 flex-col overflow-hidden bg-neutral-100"
      >
        {topContent}
        <div
          ref={messagesRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2"
        >
          {loading ? (
            <p className="py-8 text-center text-xs font-bold text-neutral-400">{tx("Cargando chat...")}</p>
          ) : error && !hasMessages ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-xs font-bold text-red-700">
              {tx(error)}
            </p>
          ) : !hasMessages ? (
            emptyState
          ) : (
            messages
          )}
        </div>

        {error && hasMessages ? (
          <div className="shrink-0 border-t border-red-100 bg-red-50 px-3 py-1.5 text-center type-caption font-bold text-red-700">
            {tx(error)}
          </div>
        ) : null}

        {footer}
      </div>
    </MatchChatFrame>
  )
}

export function resizeMatchChatComposer(element: HTMLTextAreaElement) {
  element.style.height = "auto"
  element.style.height = `${Math.min(element.scrollHeight, 128)}px`
}

export function formatMatchChatWriteUntil(value: string | null, locale: Locale = "es") {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

export function useMatchChatAutoScroll({
  messagesRef,
  messageCount,
  mode = "always",
}: {
  messagesRef: RefObject<HTMLDivElement | null>
  messageCount: number
  mode?: "always" | "stick"
}) {
  const initialScrollDoneRef = useRef(false)

  useLayoutEffect(() => {
    const container = messagesRef.current
    if (!container) return

    const shouldScroll =
      mode === "always" ||
      !initialScrollDoneRef.current ||
      container.scrollHeight - container.scrollTop - container.clientHeight < 120

    if (shouldScroll) {
      container.scrollTop = container.scrollHeight
      initialScrollDoneRef.current = true
    }
  }, [messageCount, messagesRef, mode])
}

export function useMatchChatViewport({
  viewportRef,
  composerRef,
  messagesRef,
}: {
  viewportRef: RefObject<HTMLDivElement | null>
  composerRef: RefObject<HTMLTextAreaElement | null>
  messagesRef: RefObject<HTMLDivElement | null>
}) {
  useEffect(() => {
    const root = viewportRef.current
    if (!root) return

    const visualViewport = window.visualViewport
    const html = document.documentElement
    const pageBody = document.body
    const previousHtmlOverflow = html.style.overflow
    const previousBodyOverflow = pageBody.style.overflow
    const previousBodyOverscroll = pageBody.style.overscrollBehavior
    const previousMatchChatActive = html.dataset.matchChatActive
    let restingViewportHeight = visualViewport?.height ?? window.innerHeight

    html.dataset.matchChatActive = "true"
    html.style.overflow = "hidden"
    pageBody.style.overflow = "hidden"
    pageBody.style.overscrollBehavior = "none"

    const syncViewport = (
      keepLatestVisible = false,
      forceComposerFocused = false,
    ) => {
      const visibleHeight = visualViewport?.height ?? window.innerHeight
      const visibleTop = visualViewport?.offsetTop ?? 0
      const composerFocused =
        forceComposerFocused || document.activeElement === composerRef.current

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
      restingViewportHeight = Math.max(
        restingViewportHeight,
        window.innerHeight,
        visualViewport?.height ?? 0,
      )
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
      if (previousMatchChatActive === undefined) delete html.dataset.matchChatActive
      else html.dataset.matchChatActive = previousMatchChatActive
    }
  }, [composerRef, messagesRef, viewportRef])
}
