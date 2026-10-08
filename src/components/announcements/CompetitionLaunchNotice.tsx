"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { useState, useSyncExternalStore } from "react"
import { useTheme } from "@/context/ThemeProvider"
import { useI18n } from "@/i18n/I18nProvider"

const changed = "smash-lob:competition-notice"
function subscribe(listener: () => void) { window.addEventListener("storage", listener); window.addEventListener(changed, listener); return () => { window.removeEventListener("storage", listener); window.removeEventListener(changed, listener) } }
export function CompetitionLaunchNotice() {
  const { data: session, status } = useSession()
  const { visualStyle, setVisualStyle } = useTheme()
  const { tx } = useI18n()
  const [hiddenKey, setHiddenKey] = useState<string | null>(null)
  const key = "smash-lob:competition-launch-v1:" + (session?.user?.email ?? "").toLowerCase()
  const dismissed = useSyncExternalStore(subscribe, () => { try { return window.localStorage.getItem(key) === "dismissed" } catch { return false } }, () => true)
  if (status !== "authenticated" || dismissed || hiddenKey === key) return null
  function dismiss() { setHiddenKey(key); try { window.localStorage.setItem(key, "dismissed") } catch { /* Storage may be unavailable. */ } window.dispatchEvent(new Event(changed)) }
  return <section aria-label={tx("Nuevos temas disponibles")} className="mb-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-neutral-950">
    <div className="flex items-center justify-between gap-3"><h2 className="type-panel-title font-black">{tx("NUEVOS TEMAS DISPONIBLES")}</h2><button type="button" onClick={dismiss} aria-label={tx("Cerrar aviso de temas")} className="shrink-0 rounded-lg px-2 py-1">×</button></div>
    <p className="mt-2 text-sm">{tx("Competition ya está disponible para todos, por ahora solo en modo oscuro.")}</p>
    {visualStyle === "competition" ? <p role="status" className="mt-2 text-sm font-semibold">{tx("Competition aplicado")}</p> : <button type="button" onClick={() => setVisualStyle("competition")} className="mt-3 inline-flex items-center justify-center text-center rounded-xl bg-neutral-950 px-3 py-2 text-sm font-semibold text-white">{tx("HAZ CLICK PARA APLICAR")}</button>}
    <p className="mt-3 text-xs">{tx("Para volver a Clásico o cambiar de tema: Ajustes → Temas y apariencia → Estilo visual.")}</p>
    <Link href="/settings/appearance#visual-style" className="mt-1 inline-block text-sm font-semibold underline">{tx("Ir a Temas")}</Link>
  </section>
}
