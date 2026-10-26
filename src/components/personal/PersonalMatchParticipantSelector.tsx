"use client"

import { useMemo, useRef, useState } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { FloatingDialog, DialogCloseButton } from "@/components/ui/FloatingDialog"
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
  const { tx } = useI18n()
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

  function closePicker() {
    setIsOpen(false)
    setQuery("")
  }

  return (
    <div className="relative min-w-0 max-w-full overflow-hidden rounded-xl border border-neutral-200 bg-white p-2.5">
      <p className="type-caption font-black uppercase tracking-[0.16em] text-neutral-500">
        {participant.label}
      </p>

      {locked ? (
        <p className="mt-1.5 break-words text-sm font-black text-neutral-950">
          {participant.displayName}
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label={tx(`Seleccionar ${participant.label.toLowerCase()}`)}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className={!participant.personKey ? "absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-lg text-neutral-500 outline-none focus-visible:ring-2" : "mt-1.5 flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-left outline-none focus:border-neutral-400"}
          >
            <span className={!participant.personKey ? "sr-only" : "min-w-0 flex-1"}>
              <span className="block truncate text-sm font-black text-neutral-950">
                {selectedPerson?.displayName ??
                  (participant.personKey
                    ? participant.displayName
                    : participant.displayName.trim() || tx("Otro jugador..."))}
              </span>
              {selectedPerson?.sourceLeagueNames.length ? (
                <span className="mt-0.5 block truncate type-caption font-semibold text-neutral-500">
                  {selectedPerson.sourceLeagueNames.join(" · ")}
                </span>
              ) : !participant.personKey ? (
                <span className="mt-0.5 block type-caption font-semibold text-neutral-500">{tx("Escribe un nombre que no esté en tus ligas")}</span>
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

          <FloatingDialog open={isOpen} onClose={closePicker} title={tx(`Seleccionar ${participant.label.toLowerCase()}`)} variant="search">
<div className="shrink-0 border-b border-neutral-100 px-3 pb-2.5 pt-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h2>{tx("Seleccionar jugador")}</h2>
                          <p className="type-caption font-semibold text-neutral-400">
                            {participant.label} · {filteredPeople.length} conocido{filteredPeople.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <DialogCloseButton onClick={closePicker} />
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
                          placeholder={tx("Buscar jugador o liga...")}
                          aria-label={tx(`Buscar ${participant.label.toLowerCase()}`)}
                          className="min-w-0 flex-1 border-0 bg-transparent px-0 py-2.5 text-sm font-semibold outline-none"
                        />
                        {query ? (
                          <button
                            type="button"
                            onClick={() => setQuery("")}
                            aria-label={tx("Borrar búsqueda")}
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
                        <span className="block text-xs font-black">{tx("Otro jugador...")}</span>
                        <span
                          className={`mt-0.5 block type-caption font-semibold ${
                            !participant.personKey
                              ? "text-neutral-300"
                              : "text-neutral-500"
                          }`}
                        >{tx("Introducir nombre manualmente")}</span>
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
                                : tx("Jugador conocido")}
                              {unavailable ? " · Ya seleccionado" : ""}
                            </span>
                          </button>
                        )
                      })}

                      {filteredPeople.length === 0 ? (
                        <p className="px-2 py-4 text-center type-caption font-semibold text-neutral-500">{tx("No hay jugadores que coincidan. Usa «Otro jugador...» para escribir el nombre.")}</p>
                      ) : null}
                    </div>
                  </FloatingDialog>

          {!participant.personKey ? (
            <input
              aria-label={`${tx("Nombre del jugador")} · ${participant.label}`}
              value={participant.displayName}
              onChange={(event) =>
                onChange({
                  ...participant,
                  displayName: event.target.value.slice(0, 60),
                })
              }
              placeholder={tx("Nombre del jugador")}
              className="mt-2 w-full rounded-lg border border-neutral-200 bg-white pl-2.5 pr-12 py-2 text-sm font-semibold outline-none focus:border-neutral-400"
            />
          ) : null}
        </>
      )}
    </div>
  )
}
