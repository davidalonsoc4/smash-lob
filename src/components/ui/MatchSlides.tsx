import { Children, useLayoutEffect, useRef, type ReactNode } from "react"

/** Native touch scrolling always settles on a full panel; selectors remain usable. */
export function MatchSlides({ index, onChange, label, children }: { index: number; onChange: (index: number) => void; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const align = () => element.scrollTo?.({ left: index * element.clientWidth, behavior: "instant" })
    align()
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(align)
    observer?.observe(element)
    return () => observer?.disconnect()
  }, [index])
  return <div ref={ref} role="group" aria-label={label} className="match-slides flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
    onScrollEnd={event => { const el = event.currentTarget; if (el.clientWidth) onChange(Math.max(0, Math.min(Children.count(children) - 1, Math.round(el.scrollLeft / el.clientWidth)))) }}>
    {Children.map(children, (child, position) => <div className="min-w-0 shrink-0 basis-full snap-start snap-always" aria-hidden={position !== index} inert={position !== index}>{child}</div>)}
  </div>
}
