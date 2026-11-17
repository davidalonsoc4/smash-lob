"use client"

import type { ReactNode } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { getIntlLocale } from "@/i18n/localeFormatting"

/** A "Novedad": an important chat message that was also pushed to every participant. Full width and highlighted. */
export function LeagueChatAnnouncementCard({ author, createdAt, body, editedLabel, pending = false, quote, children }: {
  author: string
  createdAt: string
  body: string
  editedLabel?: string
  pending?: boolean
  quote?: ReactNode
  /** Photo or video attached to the announcement. */
  children?: ReactNode
}) {
  const { tx, locale } = useI18n()
  const time = new Date(createdAt).toLocaleTimeString(getIntlLocale(locale), { hour: "2-digit", minute: "2-digit" })
  return (
    <article data-league-chat-announcement className={`league-chat-announcement w-full rounded-2xl border-2 px-3 py-2.5 shadow-sm ${pending ? "opacity-70" : ""}`}>
      <header className="flex items-center gap-2">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="league-chat-announcement-label h-5 w-5 shrink-0">
          <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 6a9 9 0 0 1 0 12" />
        </svg>
        <span className="league-chat-announcement-label type-caption font-black uppercase tracking-[0.14em]">{tx("Novedad")}</span>
        <span className="league-chat-announcement-meta ml-auto type-caption font-bold">{time}</span>
      </header>
      <p className="league-chat-announcement-meta mt-0.5 truncate type-caption font-bold">{author}</p>
      {quote}
      {children ? <div className="mt-2">{children}</div> : null}
      {body ? <p className="mt-1.5 whitespace-pre-wrap break-words text-base font-semibold leading-snug">{body}</p> : null}
      {editedLabel ? <p className="league-chat-announcement-meta mt-1 italic type-caption">{editedLabel}</p> : null}
    </article>
  )
}
