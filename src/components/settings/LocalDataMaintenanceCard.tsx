"use client"

import { useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import {
  clearLocalDomainStorage,
  getLastSupabaseError,
} from "@/lib/localAppStorage"

export function LocalDataMaintenanceCard() {
  const [isConfirming, setIsConfirming] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  function handleShowLastError() {
    setLastError(getLastSupabaseError() ?? "No hay errores recientes guardados.")
  }

  function handleClearLocalData() {
    if (!isConfirming) {
      setIsConfirming(true)
      return
    }

    clearLocalDomainStorage()
    window.location.reload()
  }

  return (
    <AppCard>
      <p className="font-bold">Mantenimiento local</p>
      <p className="mt-2 text-sm text-neutral-500">
        Úsalo si cambias de móvil, publicas una preview o notas datos antiguos en pantalla.
        No borra nada de Supabase; solo limpia la caché de este navegador.
      </p>

      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={handleShowLastError}
          className="w-full rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-800"
        >
          Ver último error de Supabase
        </button>

        {lastError ? (
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-2xl bg-neutral-950 p-4 text-xs font-semibold text-white">
            {lastError}
          </pre>
        ) : null}

        <button
          type="button"
          onClick={handleClearLocalData}
          className={`w-full rounded-2xl px-4 py-3 text-sm font-black ${
            isConfirming
              ? "bg-red-600 text-white"
              : "bg-red-50 text-red-700"
          }`}
        >
          {isConfirming
            ? "Confirmar limpieza local"
            : "Limpiar caché local de la app"}
        </button>
      </div>
    </AppCard>
  )
}
