import { useEffect, useRef, type ReactNode } from "react"

const LONG_PRESS_MS = 480
const MOVE_TOLERANCE = 10
const SWIPE_TRIGGER = 72
const SWIPE_MAX_SHIFT = 64

/**
 * Wraps a chat bubble with the touch gestures people already know from other chat apps:
 * press and hold (or right-click, or Enter on the focused bubble) opens the actions menu,
 * and swiping the bubble to the right starts a reply.
 */
export function LeagueChatMessageActions({ label, onOpen, onReply, replyLabel, children }: {
  label: string
  replyLabel: string
  /** Receives the bubble position so the menu can open next to it. */
  onOpen: (rect: DOMRect) => void
  onReply: () => void
  children: ReactNode
}) {
  const wrapper = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const hint = useRef<HTMLSpanElement>(null)
  const gesture = useRef<{ x: number; y: number; timer: number; swiping: boolean; opened: boolean } | null>(null)

  function open() {
    const rect = wrapper.current?.getBoundingClientRect()
    if (rect) onOpen(rect)
  }
  function shift(distance: number, animate: boolean) {
    if (content.current) {
      content.current.style.transition = animate ? "transform 160ms ease-out" : "none"
      content.current.style.transform = distance ? `translateX(${distance}px)` : ""
    }
    if (hint.current) {
      hint.current.style.opacity = String(Math.min(1, distance / (SWIPE_TRIGGER * 0.6)))
      hint.current.style.transform = `translateY(-50%) scale(${0.7 + Math.min(0.3, distance / 200)})`
    }
  }
  function cancelPress() {
    if (gesture.current) window.clearTimeout(gesture.current.timer)
  }
  function finish() {
    cancelPress()
    gesture.current = null
    shift(0, true)
  }
  useEffect(() => cancelPress, [])

  return <div ref={wrapper} className="relative">
    <span ref={hint} aria-hidden="true" style={{ opacity: 0 }}
      className="pointer-events-none absolute left-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-900/70 text-white">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 6 6v3" /></svg>
    </span>
    <div ref={content} tabIndex={0} role="group" aria-label={label} title={replyLabel}
      className="min-w-0 touch-pan-y select-none outline-offset-2 [-webkit-touch-callout:none] focus-visible:outline"
      onContextMenu={event => { event.preventDefault(); finish(); open() }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return
        if (event.key === "Enter" || event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey)) { event.preventDefault(); open() }
      }}
      onPointerDown={event => {
        if (event.pointerType === "mouse" || !event.isPrimary) return
        cancelPress()
        gesture.current = {
          x: event.clientX, y: event.clientY, swiping: false, opened: false,
          timer: window.setTimeout(() => { if (gesture.current && !gesture.current.swiping) { gesture.current.opened = true; open() } }, LONG_PRESS_MS),
        }
      }}
      onPointerMove={event => {
        const current = gesture.current
        if (!current || current.opened) return
        const dx = event.clientX - current.x
        const dy = event.clientY - current.y
        if (!current.swiping) {
          if (Math.hypot(dx, dy) > MOVE_TOLERANCE) cancelPress()
          if (dx > MOVE_TOLERANCE && dx > Math.abs(dy) * 1.5) current.swiping = true
          else return
        }
        shift(Math.max(0, Math.min(SWIPE_MAX_SHIFT, dx * 0.6)), false)
      }}
      onPointerUp={event => {
        const current = gesture.current
        const dx = current ? event.clientX - current.x : 0
        const reply = Boolean(current?.swiping && dx >= SWIPE_TRIGGER)
        finish()
        if (reply) onReply()
      }}
      onPointerCancel={finish}
    >{children}</div>
  </div>
}
