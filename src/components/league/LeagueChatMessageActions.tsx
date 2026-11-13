import { useEffect, useRef, type ReactNode } from "react"

export function LeagueChatMessageActions({ label, onOpen, children }: {
  label: string
  onOpen: () => void
  children: ReactNode
}) {
  const press = useRef<{ x: number; y: number; timer: number } | null>(null)
  function cancelPress() {
    if (press.current) window.clearTimeout(press.current.timer)
    press.current = null
  }
  useEffect(() => cancelPress, [])
  return <div className="flex items-center justify-end gap-1">
    <button type="button" aria-label={label} title={label} aria-haspopup="dialog" onClick={onOpen}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-600 focus-visible:outline dark:text-neutral-300">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
    </button>
    <div className="min-w-0"
      onContextMenu={event => { event.preventDefault(); cancelPress(); onOpen() }}
      onPointerDown={event => {
        if (event.pointerType === "mouse" || !event.isPrimary) return
        cancelPress()
        press.current = { x: event.clientX, y: event.clientY, timer: window.setTimeout(() => { press.current = null; onOpen() }, 480) }
      }}
      onPointerMove={event => {
        if (press.current && Math.hypot(event.clientX - press.current.x, event.clientY - press.current.y) > 10) cancelPress()
      }}
      onPointerUp={cancelPress} onPointerCancel={cancelPress} onPointerLeave={cancelPress}
    >{children}</div>
  </div>
}
