"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { useTheme } from "@/context/ThemeProvider"
import { useI18n } from "@/i18n/I18nProvider"

const changed = "smash-lob:competition-notice"
function subscribe(listener: () => void) { window.addEventListener("storage", listener); window.addEventListener(changed, listener); return () => { window.removeEventListener("storage", listener); window.removeEventListener(changed, listener) } }
export function CompetitionLaunchNotice() {
  const { data: session, status } = useSession()
  const { setVisualStyle } = useTheme()
  const { tx } = useI18n()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [hiddenKey, setHiddenKey] = useState<string | null>(null)
  const key = "smash-lob:competition-launch-popup-v2:" + (session?.user?.email ?? "").toLowerCase()
  const dismissed = useSyncExternalStore(subscribe, () => { try { return window.localStorage.getItem(key) === "dismissed" } catch { return false } }, () => true)
  const visible = status === "authenticated" && !dismissed && hiddenKey !== key
  useEffect(() => { const dialog = dialogRef.current; if (visible && dialog && !dialog.open) dialog.showModal(); return () => { if (dialog?.open) dialog.close() } }, [visible])
  if (!visible) return null
  function dismiss() { setHiddenKey(key); try { window.localStorage.setItem(key, "dismissed") } catch { /* Storage may be unavailable. */ } window.dispatchEvent(new Event(changed)) }
  return <dialog ref={dialogRef} onCancel={dismiss} aria-label={tx("NUEVO TEMA OSCURO DISPONIBLE")} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-5 text-neutral-950 shadow-2xl backdrop:bg-black/50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
    <h2 className="text-sm font-semibold">{tx("NUEVO TEMA OSCURO DISPONIBLE")}</h2>
    <div className="mt-4 grid grid-cols-2 gap-2">
      <button type="button" onClick={() => { setVisualStyle("competition"); dismiss() }} className="inline-flex items-center justify-center rounded-xl bg-neutral-950 px-3 py-2 text-center text-sm font-semibold text-white dark:bg-white dark:text-neutral-950">{tx("APLICAR AHORA")}</button>
      <button type="button" onClick={dismiss} className="inline-flex items-center justify-center rounded-xl border border-neutral-300 px-3 py-2 text-center text-sm font-semibold dark:border-neutral-600">{tx("AHORA NO")}</button>
    </div>
    <Link onClick={dismiss} href="/settings/appearance#visual-style" className="mt-3 block text-xs text-neutral-600 underline dark:text-neutral-300">{tx("Puedes cambiar de tema en Ajustes → Temas y apariencia.")}</Link>
  </dialog>
}
