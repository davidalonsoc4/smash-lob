"use client"

import { useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"

const MENU_WIDTH = 208
const ITEM_HEIGHT = 44
const EDGE = 8

type Item = { key: string; label: string; onSelect: () => void; danger?: boolean; icon: "reply" | "edit" | "delete" | "image" | "megaphone" | "poll" | "tutorial" | "league" }

const ICONS = {
  reply: <><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 6 6v3" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  delete: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m6 6 1 14h10l1-14" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="m21 16-5-5-8 9" /></>,
  megaphone: <><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 6a9 9 0 0 1 0 12" /></>,
  tutorial: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9.5 5 2.5-5 2.5Z" /></>,
  league: <><path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6Z" /></>,
  poll: <><path d="M5 20V10" /><path d="M12 20V4" /><path d="M19 20v-7" /></>,
} as const

/** Small menu next to the pressed message, instead of a centred dialog. */
export function LeagueChatMessageMenu({ anchor, mine, items, label, onClose }: {
  anchor: DOMRect
  mine: boolean
  items: Item[]
  label: string
  onClose: () => void
}) {
  const menu = useRef<HTMLDivElement>(null)
  // Only rendered after a press, so the viewport size is always known here.
  const position = useMemo(() => {
    const height = items.length * ITEM_HEIGHT + EDGE
    const above = anchor.top - height - EDGE > 64
    const top = Math.max(EDGE, Math.min(above ? anchor.top - height - 4 : anchor.bottom + 4, window.innerHeight - height - EDGE))
    const left = Math.max(EDGE, Math.min(mine ? anchor.right - MENU_WIDTH : anchor.left, window.innerWidth - MENU_WIDTH - EDGE))
    return { top, left }
  }, [anchor, items.length, mine])
  useEffect(() => {
    menu.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])
  if (typeof document === "undefined") return null
  return createPortal(
    <>
      <button type="button" aria-label={label} tabIndex={-1} onClick={onClose} className="fixed inset-0 z-[150] cursor-default bg-black/20" />
      <div ref={menu} role="menu" aria-label={label} data-league-chat-menu
        style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
        className="league-chat-menu fixed z-[151] overflow-hidden rounded-2xl border border-neutral-200 bg-white py-1 shadow-xl">
        {items.map(item => <button key={item.key} type="button" role="menuitem" onClick={item.onSelect}
          style={{ height: ITEM_HEIGHT }}
          className={`flex w-full items-center gap-3 px-4 text-left text-sm font-bold active:bg-neutral-100 ${item.danger ? "text-red-600" : "text-neutral-900"}`}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">{ICONS[item.icon]}</svg>
          {item.label}
        </button>)}
      </div>
    </>,
    document.body,
  )
}
