import { useLayoutEffect, useRef } from "react"

/** Shrink short labels gently; exceptionally long names wrap at a readable size. */
export function FitText({ children, className = "" }: { children: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const box = ref.current
    if (!box) return
    const text = box.firstElementChild as HTMLSpanElement
    const fit = () => {
      text.style.fontSize = ""
      text.style.whiteSpace = "nowrap"
      text.style.maxWidth = "none"
      const base = parseFloat(getComputedStyle(text).fontSize)
      const minimum = parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.625
      const available = box.getBoundingClientRect().width - 1
      let size = Math.max(minimum, Math.min(base, base * available / Math.max(1, text.getBoundingClientRect().width)))
      text.style.fontSize = `${size}px`
      while (text.getBoundingClientRect().width > available && size > minimum) { size = Math.max(minimum, size - 0.25); text.style.fontSize = `${size}px` }
      text.style.whiteSpace = text.getBoundingClientRect().width > available ? "normal" : "nowrap"
      text.style.maxWidth = "100%"
    }
    let previousWidth = -1, frame = 0
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(entries => { const width = entries[0].contentRect.width; if (width !== previousWidth) { previousWidth = width; cancelAnimationFrame(frame); frame = requestAnimationFrame(fit) } })
    observer?.observe(box)
    let disposed = false
    void document.fonts?.ready.then(() => { if (!disposed) fit() })
    fit()
    return () => { disposed = true; cancelAnimationFrame(frame); observer?.disconnect() }
  }, [children])
  return <span ref={ref} className={`block min-w-0 ${className}`}><span className="inline-block max-w-full break-words">{children}</span></span>
}
