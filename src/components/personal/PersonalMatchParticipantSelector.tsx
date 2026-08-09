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
  const externalValue = "__external__"
  const selectedValue = participant.personKey ?? externalValue

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-2.5">
      <p className="type-caption font-black uppercase tracking-[0.16em] text-neutral-400">
        {participant.label}
      </p>
      {locked ? (
        <p className="mt-1.5 text-sm font-black text-neutral-950">
          {participant.displayName}
        </p>
      ) : (
        <>
          <select
            value={selectedValue}
            onChange={(event) => {
              const key = event.target.value
              if (key === externalValue) {
                onChange({ ...participant, personKey: null, displayName: "" })
                return
              }
              const person = people.find((item) => item.key === key)
              if (!person) return
              onChange({
                ...participant,
                personKey: person.key,
                displayName: person.displayName,
              })
            }}
            className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs font-bold text-neutral-900 outline-none focus:border-neutral-400"
          >
            <option value={externalValue}>Otro jugador...</option>
            {people
              .filter((person) => !person.isSelf)
              .map((person) => (
                <option
                  key={person.key}
                  value={person.key}
                  disabled={
                    usedKeys.has(person.key) && participant.personKey !== person.key
                  }
                >
                  {person.displayName}
                  {person.sourceLeagueNames.length > 0
                    ? ` · ${person.sourceLeagueNames.join(", ")}`
                    : ""}
                </option>
              ))}
          </select>

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
