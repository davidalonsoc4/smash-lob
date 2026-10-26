import { useEffect, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { useI18n } from "@/i18n/I18nProvider"

// Imported by client components. Native top-layer dialogs own focus and inertness.
let openDialogs = 0, savedOverflow = ""
export function FloatingDialog({ open, onClose, title, children, variant = "actions", busy = false, dirty = false, className = "" }: { open: boolean; onClose: () => void; title: string; children: ReactNode; variant?: "actions" | "search" | "content" | "help"; busy?: boolean; dirty?: boolean; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null), { tx } = useI18n()
  useEffect(() => {
    const node = ref.current
    if (!open || !node) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!openDialogs++) { savedOverflow = document.body.style.overflow; document.body.style.overflow = "hidden" }
    node.showModal()
    node.querySelector<HTMLElement>('[data-dialog-autofocus], input[type="search"], input[role="combobox"]')?.focus()
    return () => { node.close(); if (!--openDialogs) document.body.style.overflow = savedOverflow; if (previous?.isConnected) previous.focus({ preventScroll: true }) }
  }, [open])
  function requestClose() { if (!busy && (!dirty || window.confirm(tx("¿Descartar los cambios sin guardar?")))) onClose() }
  if (typeof document === "undefined") return null
  return createPortal(<dialog ref={ref} role="dialog" aria-label={title} aria-modal="true" data-floating-dialog={variant} className={`app-dialog app-dialog-${variant} ${className}`} onCancel={event => { event.preventDefault(); requestClose() }} onKeyDown={event => { if (event.key === "Escape" && !event.nativeEvent.isComposing) { event.preventDefault(); event.stopPropagation(); requestClose() } }} onClick={event => { const box = event.currentTarget.getBoundingClientRect(); if (event.target === event.currentTarget && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) requestClose() }}>{open ? children : null}</dialog>, document.body)
}
export function DialogCloseButton({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
  const { tx } = useI18n()
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={tx("Cerrar")} className="app-dialog-close"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
}
export function DialogChevron() { return <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="m9 5 7 7-7 7" /></svg> }
export function DialogOptionIcon({ kind }: { kind: "calendar" | "directions" | "copy" }) { return <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">{kind === "calendar" ? <><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4m8-4v4M4 11h16" /></> : kind === "directions" ? <path d="m21 3-6 18-4-8-8-4Z" /> : <><rect x="9" y="9" width="11" height="11" rx="3" /><path d="M15 9V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h3" /></>}</svg> }
