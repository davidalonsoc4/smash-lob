"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type {
  PersonalMatchParticipantDraft,
  PersonalMatchPerson,
} from "@/lib/personalMatches"

export type EditablePersonalMatchParticipant = PersonalMatchParticipantDraft & {
  label: string
}

export function PersonalMatchParticipantSelector({
  participant,
  people,
  usedKeys,
  onChange,
  locked = false,
}: {
  participant: EditablePersonalMatchParticipant
  people: PersonalMatchPerson[]
  usedKeys: Set<string>
  onChange: (next: EditablePersonalMatchParticipant) => void
  locked?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const selectedPerson = participant.personKey
    ? people.find((person) => person.key === participant.personKey) ?? null
    : null
  const filteredPeople = useMemo(() => {
    const cleanQuery = query.trim().toLocaleLowerCase("es-ES")
    return people
      .filter((person) => !person.isSelf)
      .filter((person) => {
        if (!cleanQuery) return true
        return [person.displayName, ...person.sourceLeagueNames]
          .join(" ")
          .toLocaleLowerCase("es-ES")
          .includes(cleanQuery)
      })
  }, [people, query])

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
  }

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-neutral-200 bg-white p-2.5">
      <p className="type-caption font-black uppercase tracking-[0.16em] text-neutral-500">
        {participant.label}
      </p>

      {locked ? (
        <p className="mt-1.5 truncate whitespace-nowrap text-sm font-black text-neutral-950">
          {participant.displayName}
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className="mt-1.5 flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-left outline-none focus:border-neutral-400"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black text-neutral-950">
                {selectedPerson?.displayName ??
                  (participant.personKey
                    ? participant.displayName
                    : participant.displayName.trim() || "Otro jugador...")}
              </span>
              {selectedPerson?.sourceLeagueNames.length ? (
                <span className="mt-0.5 block truncate type-caption font-semibold text-neutral-500">
                  {selectedPerson.sourceLeagueNames.join(" · ")}
                </span>
              ) : !participant.personKey ? (
                <span className="mt-0.5 block type-caption font-semibold text-neutral-500">
                  Escribe un nombre que no esté en tus ligas
                </span>
              ) : null}
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0 text-neutral-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>

          {isOpen && typeof document !== "undefined"
            ? createPortal(
                <>
                  <button
                    type="button"
                    aria-label={`Cerrar selector de ${participant.label.toLowerCase()}`}
                    onClick={closePicker}
                    className="fixed inset-0 z-[100] bg-neutral-950/45 backdrop-blur-[1px]"
                  />
                  <section
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Seleccionar ${participant.label.toLowerCase()}`}
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
                          <p className="text-sm font-black text-neutral-950">
                            Seleccionar jugador
                          </p>
                          <p className="type-caption font-semibold text-neutral-400">
                            {participant.label} · {filteredPeople.length} conocido{filteredPeople.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={closePicker}
                          aria-label="Cerrar"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-center text-sm font-black text-neutral-500"
                        >
                          ×
                        </button>
                      </div>

                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 focus-within:border-neutral-400 focus-within:bg-white">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-4 w-4 shrink-0 text-neutral-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <circle cx="11" cy="11" r="7" />
                          <path d="m20 20-3.5-3.5" />
                        </svg>
                        <input
                          ref={searchInputRef}
                          type="search"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Buscar jugador o liga..."
                          aria-label={`Buscar ${participant.label.toLowerCase()}`}
                          className="min-w-0 flex-1 border-0 bg-transparent px-0 py-2.5 text-sm font-semibold outline-none"
                        />
                        {query ? (
                          <button
                            type="button"
                            onClick={() => setQuery("")}
                            aria-label="Borrar búsqueda"
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-center text-xs font-black text-neutral-600"
                          >
                            ×
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">
                      <button
                        type="button"
                        onClick={() => {
                          onChange({
                            ...participant,
                            personKey: null,
                            displayName: "",
                          })
                          closePicker()
                        }}
                        className={`w-full rounded-lg border px-2.5 py-2 text-left ${
                          !participant.personKey
                            ? "border-neutral-950 bg-neutral-950 text-white"
                            : "border-neutral-200 bg-white text-neutral-900"
                        }`}
                      >
                        <span className="block text-xs font-black">Otro jugador...</span>
                        <span
                          className={`mt-0.5 block type-caption font-semibold ${
                            !participant.personKey
                              ? "text-neutral-300"
                              : "text-neutral-500"
                          }`}
                        >
                          Introducir nombre manualmente
                        </span>
                      </button>

                      {filteredPeople.map((person) => {
                        const unavailable =
                          usedKeys.has(person.key) &&
                          participant.personKey !== person.key
                        const selected = participant.personKey === person.key
                        return (
                          <button
                            key={person.key}
                            type="button"
                            disabled={unavailable}
                            onClick={() => {
                              onChange({
                                ...participant,
                                personKey: person.key,
                                displayName: person.displayName,
                              })
                              closePicker()
                            }}
                            className={`w-full rounded-lg border px-2.5 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
                              selected
                                ? "border-neutral-950 bg-neutral-950 text-white"
                                : "border-neutral-200 bg-white text-neutral-900 active:bg-neutral-100"
                            }`}
                          >
                            <span className="block truncate text-xs font-black">
                              {person.displayName}
                            </span>
                            <span
                              className={`mt-0.5 block truncate type-caption font-semibold ${
                                selected ? "text-neutral-300" : "text-neutral-500"
                              }`}
                            >
                              {person.sourceLeagueNames.length > 0
                                ? person.sourceLeagueNames.join(" · ")
                                : "Jugador conocido"}
                              {unavailable ? " · Ya seleccionado" : ""}
                            </span>
                          </button>
                        )
                      })}

                      {filteredPeople.length === 0 ? (
                        <p className="px-2 py-4 text-center type-caption font-semibold text-neutral-500">
                          No hay jugadores que coincidan. Usa «Otro jugador...» para escribir el nombre.
                        </p>
                      ) : null}
                    </div>
                  </section>
                </>,
                document.body,
              )
            : null}

          {!participant.personKey ? (
            <input
              value={participant.displayName}
              onChange={(event) =>
                onChange({
                  ...participant,
                  displayName: event.target.value.slice(0, 60),
                })
              }
              placeholder="Nombre del jugador"
              className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm font-semibold outline-none focus:border-neutral-400"
            />
          ) : null}
        </>
      )}
    </div>
  )
}
