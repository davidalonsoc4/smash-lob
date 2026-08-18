"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  getLeagueLocationTownNameLabel,
  type LeagueLocation,
} from "@/lib/leagueLocations"

export function PersonalMatchLocationPicker({
  locations,
  loading,
  selectedLocationId,
  manualLocationName,
  onSelectedLocationIdChange,
  onManualLocationNameChange,
  disabled = false,
}: {
  locations: LeagueLocation[]
  loading: boolean
  selectedLocationId: string
  manualLocationName: string
  onSelectedLocationIdChange: (value: string) => void
  onManualLocationNameChange: (value: string) => void
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [isAddingLocation, setIsAddingLocation] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const selectedLocation = locations.find(
    (location) => location.id === selectedLocationId,
  )
  const selectedLabel = selectedLocation
    ? getLeagueLocationTownNameLabel(selectedLocation)
    : manualLocationName.trim() || "Seleccionar ubicación"
  const filteredLocations = useMemo(() => {
    const cleanQuery = query.trim().toLocaleLowerCase("es-ES")
    if (!cleanQuery) return locations
    return locations.filter((location) =>
      getLeagueLocationTownNameLabel(location)
        .toLocaleLowerCase("es-ES")
        .includes(cleanQuery),
    )
  }, [locations, query])

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.requestAnimationFrame(() => searchInputRef.current?.focus())
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isOpen])

  function closePicker() {
    setIsOpen(false)
    setQuery("")
    setIsAddingLocation(false)
  }

  return (
    <div className="min-w-0">
      <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
        Pista o club
      </span>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        disabled={disabled || loading}
        className="mt-1 flex w-full min-w-0 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-left text-sm font-semibold text-neutral-900 shadow-sm transition active:bg-neutral-50 disabled:bg-neutral-100"
      >
        <span className={`min-w-0 flex-1 truncate ${selectedLocation || manualLocationName.trim() ? "text-neutral-900" : "text-neutral-400"}`}>
          {loading ? "Cargando ubicaciones..." : selectedLabel}
        </span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Cerrar buscador de ubicaciones"
                onClick={closePicker}
                className="fixed inset-0 z-[100] bg-neutral-950/45 backdrop-blur-[1px]"
              />
              <section
                role="dialog"
                aria-modal="true"
                aria-label="Buscar ubicación"
                className="fixed left-1/2 z-[110] flex w-[min(360px,calc(100vw-28px))] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
                style={{
                  top: "max(14px, calc(var(--app-safe-top) + 10px))",
                  maxHeight:
                    "min(440px, calc(100dvh - var(--app-safe-top) - env(safe-area-inset-bottom, 0px) - 28px))",
                }}
              >
                <div className="shrink-0 border-b border-neutral-100 px-3 pb-2.5 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-neutral-950">Seleccionar ubicación</p>
                      <p className="type-caption font-semibold text-neutral-400">{locations.length} disponibles</p>
                    </div>
                    <button type="button" onClick={closePicker} aria-label="Cerrar" className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-center text-sm font-black text-neutral-500">×</button>
                  </div>
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 focus-within:border-neutral-400 focus-within:bg-white">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Buscar por localidad o nombre..."
                      className="min-w-0 flex-1 border-0 bg-transparent px-0 py-2.5 text-sm font-semibold outline-none"
                    />
                    {query ? <button type="button" onClick={() => setQuery("")} aria-label="Borrar búsqueda" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-center text-xs font-black text-neutral-600">×</button> : null}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                  {isAddingLocation ? (
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5">
                      <p className="text-sm font-black text-neutral-900">Nueva ubicación</p>
                      <p className="mt-0.5 type-caption font-semibold text-neutral-500">Se guardará en el catálogo global al guardar el partido.</p>
                      <input
                        value={manualLocationName}
                        onChange={(event) => onManualLocationNameChange(event.target.value.slice(0, 120))}
                        placeholder="Nombre del club o ubicación"
                        className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm font-semibold outline-none focus:border-neutral-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onSelectedLocationIdChange("")
                          closePicker()
                        }}
                        disabled={!manualLocationName.trim()}
                        className="mt-2 flex w-full items-center justify-center rounded-lg bg-neutral-950 px-3 py-2 text-center text-sm font-black text-white disabled:bg-neutral-300"
                      >
                        Usar esta ubicación
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredLocations.map((location) => {
                        const selected = location.id === selectedLocationId
                        return (
                          <button
                            key={location.id}
                            type="button"
                            onClick={() => {
                              onSelectedLocationIdChange(location.id)
                              onManualLocationNameChange("")
                              closePicker()
                            }}
                            className={`w-full rounded-lg border px-2.5 py-2 text-left ${selected ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-900"}`}
                          >
                            <span className="block truncate text-xs font-black">{getLeagueLocationTownNameLabel(location)}</span>
                          </button>
                        )
                      })}
                      {filteredLocations.length === 0 ? <p className="px-2 py-4 text-center type-caption font-semibold text-neutral-500">No hay ubicaciones que coincidan con la búsqueda.</p> : null}
                    </div>
                  )}
                </div>

                <div className="shrink-0 border-t border-neutral-100 bg-white p-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingLocation((current) => !current)}
                    className="flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-center text-sm font-black text-neutral-800"
                  >
                    {isAddingLocation ? "Cancelar nueva ubicación" : "+ Añadir nueva ubicación"}
                  </button>
                </div>
              </section>
            </>,
            document.body,
          )
        : null}
    </div>
  )
}
