"use client"

import { AppCard } from "@/components/ui/AppCard"

export function OfflineFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <AppCard className="w-full max-w-sm">
        <h1 className="text-2xl font-black tracking-tight">Sin conexión</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-neutral-600">
          Smash &amp; Lob necesita conexión para consultar y modificar los datos
          de tu liga.
        </p>
        <button
          type="button"
          onClick={() => window.location.replace("/")}
          className="mt-4 block rounded-2xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white"
        >
          Reintentar
        </button>
      </AppCard>
    </main>
  )
}
