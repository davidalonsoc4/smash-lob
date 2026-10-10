"use client"

import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { useI18n } from "@/i18n/I18nProvider"
import { getStatusExplanation } from "@/lib/statusHelp"

export function StatusHelp({ children, className = "", kind, status, description, label }: {
  children: ReactNode; className?: string; kind?: string; status?: string; description?: string; label?: string
}) {
  const { locale } = useI18n()
  const text = description ?? getStatusExplanation(kind ?? "match", status ?? "", locale)
  const [position, setPosition] = useState<{ left: number; top: number; above: boolean } | null>(null)
  const trigger = useRef<HTMLSpanElement>(null)
  const popup = useRef<HTMLSpanElement>(null)
  const pinned = useRef(false)
  const id = useId()
  function show() {
    const rect = trigger.current?.getBoundingClientRect()
    if (!rect) return
    const width = Math.min(288, window.innerWidth - 24)
    setPosition({ left: Math.max(12, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 12)), top: rect.bottom + 8, above: false })
  }
  function close() { pinned.current = false; setPosition(null) }
  useEffect(() => {
    if (!position) return
    const bounds = popup.current?.getBoundingClientRect()
    const rect = trigger.current?.getBoundingClientRect()
    if (bounds && rect && bounds.bottom > window.innerHeight - 12 && !position.above) {
      setPosition({ ...position, top: Math.max(12, rect.top - bounds.height - 8), above: true })
    }
    function outside(event: PointerEvent) {
      if (!trigger.current?.contains(event.target as Node) && !popup.current?.contains(event.target as Node)) close()
    }
    function escape(event: KeyboardEvent) { if (event.key === "Escape") close() }
    document.addEventListener("pointerdown", outside)
    document.addEventListener("keydown", escape)
    window.addEventListener("resize", close)
    window.addEventListener("scroll", close, true)
    return () => {
      document.removeEventListener("pointerdown", outside)
      document.removeEventListener("keydown", escape)
      window.removeEventListener("resize", close)
      window.removeEventListener("scroll", close, true)
    }
  }, [position])
  if (!text) return <span className={className}>{children}</span>
  return <>
    <span ref={trigger} role="button" tabIndex={0} aria-label={label} aria-expanded={!!position} aria-describedby={position ? id : undefined}
      className={`${className} cursor-help focus-visible:outline-2 focus-visible:outline-offset-2`}
      onPointerEnter={event => { if (event.pointerType === "mouse") show() }}
      onPointerLeave={() => { if (!pinned.current) setPosition(null) }}
      onFocus={show} onBlur={close}
      onClick={event => { event.preventDefault(); event.stopPropagation(); if (pinned.current) close(); else { pinned.current = true; show() } }}
      onKeyDown={event => {
        if (["Enter", " ", "Escape"].includes(event.key)) { event.preventDefault(); event.stopPropagation(); if (event.key === "Escape" || pinned.current) close(); else { pinned.current = true; show() } }
      }}>{children}</span>
    {position ? createPortal(<span ref={popup} id={id} role="tooltip" className="fixed z-[200] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium leading-5 text-neutral-950 shadow-lg"
      style={{ left: position.left, top: position.top, width: "min(288px, calc(100vw - 24px))" }}
      onClick={event => { event.preventDefault(); event.stopPropagation() }}>{text}</span>, document.body) : null}
  </>
}
