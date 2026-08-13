"use client"

import { useMemo, useState } from "react"
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

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-2.5">
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
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            className="mt-1.5 flex w-full items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-left outline-none focus:border-neutral-400"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-neutral-950">
                {selectedPerson?.displayName ?? (participant.personKey ? participant.displayName : "Otro jugador...")}
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
            <span aria-hidden="true" className={`shrink-0 text-xs text-neutral-500 transition ${isOpen ? "rotate-180" : ""}`}>
              ▾
            </span>
          </button>

          {isOpen ? (
            <div className="mt-1.5 rounded-xl border border-neutral-200 bg-neutral-50/80 p-1.5">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar jugador o liga..."
                aria-label={`Buscar ${participant.label.toLowerCase()}`}
                className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm font-semibold outline-none focus:border-neutral-400"
              />
              <div className="mt-1.5 flex items-center justify-between gap-2 px-1 type-caption font-semibold text-neutral-500">
                <span>{filteredPeople.length} conocido{filteredPeople.length === 1 ? "" : "s"}</span>
                <span>{query.trim() ? "Resultados filtrados" : "Desliza para ver más"}</span>
              </div>
              <div className="mt-1 max-h-52 space-y-1 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    onChange({ ...participant, personKey: null, displayName: "" })
                    setQuery("")
                    setIsOpen(false)
                  }}
                  className={`w-full rounded-lg border px-2.5 py-2 text-left ${
                    !participant.personKey
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-200 bg-white text-neutral-900"
                  }`}
                >
                  <span className="block text-xs font-black">Otro jugador...</span>
                  <span className={`mt-0.5 block type-caption font-semibold ${!participant.personKey ? "text-neutral-300" : "text-neutral-500"}`}>
                    Introducir nombre manualmente
                  </span>
                </button>

                {filteredPeople.map((person) => {
                  const unavailable = usedKeys.has(person.key) && participant.personKey !== person.key
                  const selected = participant.personKey === person.key
                  return (
                    <button
                      key={person.key}
                      type="button"
                      disabled={unavailable}
                      onClick={() => {
                        onChange({ ...participant, personKey: person.key, displayName: person.displayName })
                        setQuery("")
                        setIsOpen(false)
                      }}
                      className={`w-full rounded-lg border px-2.5 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        selected
                          ? "border-neutral-950 bg-neutral-950 text-white"
                          : "border-neutral-200 bg-white text-neutral-900 active:bg-neutral-100"
                      }`}
                    >
                      <span className="block truncate text-xs font-black">{person.displayName}</span>
                      <span className={`mt-0.5 block truncate type-caption font-semibold ${selected ? "text-neutral-300" : "text-neutral-500"}`}>
                        {person.sourceLeagueNames.length > 0
                          ? person.sourceLeagueNames.join(" · ")
                          : "Jugador conocido"}
                        {unavailable ? " · Ya seleccionado" : ""}
                      </span>
                    </button>
                  )
                })}
                {filteredPeople.length === 0 ? (
                  <p className="px-2 py-3 text-center type-caption font-semibold text-neutral-500">
                    No hay jugadores que coincidan. Usa «Otro jugador...» para escribir el nombre.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

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
