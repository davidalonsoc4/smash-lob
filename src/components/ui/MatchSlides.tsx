import { Children, useLayoutEffect, useRef, type ReactNode } from "react"

/** Native touch scrolling always settles on a full panel; selectors remain usable. */
export function MatchSlides({ index, onChange, label, children }: { index: number; onChange: (index: number) => void; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const count = Children.count(children)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touching = useRef(false)
  const stride = (el: HTMLDivElement) => el.clientWidth + (parseFloat(getComputedStyle(el).columnGap) || 0)
  function settle(el: HTMLDivElement) {
    if (touching.current || !el.clientWidth) return
    const next = Math.max(0, Math.min(count - 1, Math.round(el.scrollLeft / stride(el))))
    if (Math.abs(el.scrollLeft - next * stride(el)) > 0.5) el.scrollTo?.({ left: next * stride(el), behavior: "instant" })
    onChange(next)
  }
  function waitForIdle(el: HTMLDivElement) {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => settle(el), 160)
  }
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const align = () => element.scrollTo?.({ left: index * stride(element), behavior: "instant" })
    align()
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(align)
    observer?.observe(element)
    return () => { observer?.disconnect(); if (idleTimer.current) clearTimeout(idleTimer.current) }
  }, [index, count])
  if (count < 2) return <>{children}</>
  return <div ref={ref} role="group" aria-label={label} className="match-slides flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
    onScroll={event => waitForIdle(event.currentTarget)} onScrollEnd={event => settle(event.currentTarget)}
    onTouchStart={() => { touching.current = true }} onTouchEnd={event => { touching.current = false; waitForIdle(event.currentTarget) }}
    onTouchCancel={event => { touching.current = false; waitForIdle(event.currentTarget) }}>
    {Children.map(children, (child, position) => <div className="min-w-0 shrink-0 basis-full snap-start snap-always" aria-hidden={position !== index} inert={position !== index}>{child}</div>)}
  </div>
}
