"use client"

import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"

export function OfflineFallback() {
  const { tx } = useI18n()
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <AppCard className="w-full max-w-sm">
        <h1 className="text-2xl font-black tracking-tight">{tx("Sin conexión")}</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-neutral-600">
          {tx("Smash &amp; Lob necesita conexión para consultar y modificar los datos de tu liga.")}{" "}</p>
        <button
          type="button"
          onClick={() => window.location.replace("/")}
          className="flex mt-4 rounded-2xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white items-center justify-center"
        >
          {tx("Reintentar")}{" "}</button>
      </AppCard>
    </main>
  )
}
