import { useState } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { collectPwaDiagnostic, type PwaDiagnostic } from "@/lib/pwaDiagnostic"

export function PwaDiagnosticPanel() {
  const { tx } = useI18n()
  const [busy, setBusy] = useState(false), [report, setReport] = useState<PwaDiagnostic | null>(null)
  const [receipt, setReceipt] = useState(""), [failed, setFailed] = useState(false)
  async function send() {
    setBusy(true); setFailed(false); setReceipt(""); setReport(null)
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const next = await collectPwaDiagnostic()
      setReport(next)
      timer = setTimeout(() => controller.abort(), 10_000)
      const response = await fetch("/api/observability/pwa-diagnostic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next), cache: "no-store", signal: controller.signal })
      const result = await response.json()
      if (!response.ok || !result.accepted || !/^SL-[A-F\d]{8}$/.test(result.incidenceCode)) throw new Error("diagnostic-not-accepted")
      setReceipt(result.incidenceCode)
    } catch { setFailed(true) }
    finally { clearTimeout(timer); setBusy(false) }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ ...report, incidenceCode: receipt || null }, null, 2)], { type: "application/json" }))
    const link = document.createElement("a")
    link.href = url; link.download = "smash-lob-diagnostic.json"; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1_000)
  }
  return <section aria-label={tx("Diagnóstico de apariencia y PWA")} className="rounded-2xl border border-neutral-200 bg-white p-4">
    <p className="font-bold">{tx("Diagnóstico de apariencia y PWA")}</p>
    <p className="mt-1 text-xs text-neutral-600">{tx("Datos técnicos sin información de cuenta. El informe no puede leer el color de la barra de Android.")}</p>
    <button type="button" disabled={busy} onClick={() => void send()} className="mt-3 flex w-full items-center justify-center rounded-xl border border-neutral-300 px-3 py-2 text-center text-sm font-semibold disabled:opacity-50">{busy ? tx("Enviando...") : tx("Enviar diagnóstico")}</button>
    {receipt ? <p role="status" className="mt-2 text-sm">{tx("Código de diagnóstico")}: <code className="font-bold select-all">{receipt}</code></p> : null}
    {failed ? <p role="alert" className="mt-2 text-sm text-red-600">{tx("No se ha podido enviar el diagnóstico.")}</p> : null}
    {report ? <button type="button" onClick={download} className="mt-2 flex w-full items-center justify-center rounded-xl border border-neutral-300 px-3 py-2 text-center text-sm font-semibold">{tx("Descargar diagnóstico JSON")}</button> : null}
  </section>
}
