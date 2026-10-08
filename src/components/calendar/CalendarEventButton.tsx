"use client"
import { useRef, type ReactNode } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { getCalendarExport, type CalendarEvent, type CalendarProvider } from "@/lib/calendarEvent"
export function CalendarEventButton({ event, children, className, label }: { event: CalendarEvent; children?: ReactNode; className?: string; label?: string }) {
  const { tx } = useI18n(), dialog = useRef<HTMLDialogElement>(null)
  const data = getCalendarExport(event)
  if (!data) return null
  function exportTo(provider: CalendarProvider) {
    if (!data) return
    if (provider === "google") window.open(data.googleUrl, "_blank", "noopener,noreferrer")
    else { const url = URL.createObjectURL(new Blob([data.ics], { type: "text/calendar;charset=utf-8" })), link = document.createElement("a"); link.href = url; link.download = "smash-lob.ics"; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 30000) }
    dialog.current?.close()
  }
  return <>
    <button type="button" title={label ?? tx("Añadir al calendario")} className={className ?? "flex w-full items-center justify-center rounded-xl bg-neutral-950 px-2.5 py-2 text-xs !font-semibold text-white"} onClick={() => dialog.current?.showModal()}>{children ?? label ?? tx("Añadir al calendario")}</button>
    <dialog ref={dialog} aria-label={tx("Añadir al calendario")} className="fixed inset-0 m-auto w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-950 shadow-xl backdrop:bg-black/50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
      <h2 className="type-panel-title font-black">{tx("Añadir al calendario")}</h2>
      <button type="button" className="mt-3 w-full rounded-xl bg-neutral-100 px-3 py-3 text-left text-sm font-bold dark:bg-neutral-800" onClick={() => exportTo("google")}>Google Calendar</button>
      <button type="button" className="mt-2 w-full rounded-xl bg-neutral-100 px-3 py-3 text-left text-sm font-bold dark:bg-neutral-800" onClick={() => exportTo("ics")}>{tx("Apple Calendar / otros (.ics)")}</button>
      <button type="button" className="mt-3 w-full rounded-xl px-3 py-2 text-sm font-bold" onClick={() => dialog.current?.close()}>{tx("Cancelar")}</button>
    </dialog>
  </>
}
