"use client"
import { useState, type ReactNode } from "react"
import { FloatingDialog, DialogChevron, DialogOptionIcon } from "@/components/ui/FloatingDialog"
import { useI18n } from "@/i18n/I18nProvider"
import { getCalendarExport, type CalendarEvent, type CalendarProvider } from "@/lib/calendarEvent"
export function CalendarEventButton({ event, children, className, label }: { event: CalendarEvent; children?: ReactNode; className?: string; label?: string }) {
  const { tx } = useI18n(), [open, setOpen] = useState(false), [failed, setFailed] = useState(false)
  const data = getCalendarExport(event)
  if (!data) return null
  function exportTo(provider: CalendarProvider) {
    if (!data) return
    try {
    if (provider === "google") window.open(data.googleUrl, "_blank", "noopener,noreferrer")
    else { const url = URL.createObjectURL(new Blob([data.ics], { type: "text/calendar;charset=utf-8" })), link = document.createElement("a"); link.href = url; link.download = "smash-lob.ics"; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 30000) }
    setOpen(false)
    } catch { setFailed(true) }
  }
  return <>
    <button type="button" title={label ?? tx("Añadir al calendario")} className={className ?? "app-action-button flex w-full items-center justify-center rounded-xl bg-neutral-950 px-2.5 py-2 text-xs !font-semibold text-white"} onClick={() => { setFailed(false); setOpen(true) }}>{children ?? label ?? tx("Añadir al calendario")}</button>
    <FloatingDialog open={open} onClose={() => setOpen(false)} title={tx("Añadir al calendario")}>
      <h2 className="type-panel-title font-black">{tx("Añadir al calendario")}</h2>
      <button type="button" className="app-dialog-option mt-3" onClick={() => exportTo("google")}><span className="flex items-center gap-2"><DialogOptionIcon kind="calendar" />Google Calendar</span><DialogChevron /></button>
      <button type="button" className="app-dialog-option mt-2" onClick={() => exportTo("ics")}><span className="flex items-center gap-2"><DialogOptionIcon kind="calendar" />{tx("Apple Calendar / otros (.ics)")}</span><DialogChevron /></button>
      {failed ? <p role="alert" className="mt-3 text-sm text-red-600">{tx("No se ha podido abrir el calendario. Inténtalo de nuevo.")}</p> : null}
      <button type="button" className="app-dialog-cancel" onClick={() => setOpen(false)}>{tx("Cancelar")}</button>
    </FloatingDialog>
  </>
}
