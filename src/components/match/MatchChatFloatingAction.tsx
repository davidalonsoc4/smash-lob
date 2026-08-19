"use client"

import Link from "next/link"
import { useI18n } from "@/i18n/I18nProvider"

function ChatIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 18.5 3.5 21l3.7-1A9 9 0 1 0 5 18.5Z" />
      <path d="M8 10.5h8M8 14h5" />
    </svg>
  )
}

export function MatchChatActionLink({ href }: { href: string }) {
  const { tx } = useI18n()
  return (
    <Link
      data-tour="match-chat-access"
      href={href}
      aria-label={tx("Abrir chat del partido")}
      title={tx("Chat del partido")}
      className="app-floating-primary-control grid h-10 w-10 place-items-center rounded-full border border-neutral-950 bg-neutral-950 text-white shadow-lg transition active:scale-95"
    >
      <ChatIcon />
    </Link>
  )
}

export function MatchChatFloatingAction({ href }: { href: string }) {
  return (
    <div
      className="fixed z-40 flex flex-col items-end gap-2"
      style={{
        right: "max(14px, calc((100vw - 448px) / 2 + 14px))",
        bottom: "calc(84px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <MatchChatActionLink href={href} />
    </div>
  )
}
