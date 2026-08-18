import type { PersonalMatchPerson } from "@/lib/personalMatches"

type IdentifiedPersonalMatchPerson = PersonalMatchPerson & {
  userId: string | null
}

function normalizePersonName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es-ES")
}

export function deduplicatePersonalMatchPeople<
  T extends IdentifiedPersonalMatchPerson,
>(people: T[]): T[] {
  const copies = people.map((person) => ({
    ...person,
    sourceLeagueNames: [...person.sourceLeagueNames],
  })) as T[]
  const linkedIndexesByName = new Map<string, number[]>()

  copies.forEach((person, index) => {
    if (!person.userId) return
    const normalizedName = normalizePersonName(person.displayName)
    const indexes = linkedIndexesByName.get(normalizedName) ?? []
    indexes.push(index)
    linkedIndexesByName.set(normalizedName, indexes)
  })

  const absorbedIndexes = new Set<number>()
  copies.forEach((person, index) => {
    if (person.userId) return
    const linkedIndexes = linkedIndexesByName.get(
      normalizePersonName(person.displayName),
    )
    if (linkedIndexes?.length !== 1) return

    const linkedPerson = copies[linkedIndexes[0]]
    linkedPerson.sourceLeagueNames = [
      ...new Set([
        ...linkedPerson.sourceLeagueNames,
        ...person.sourceLeagueNames,
      ]),
    ]
    absorbedIndexes.add(index)
  })

  return copies.filter((_, index) => !absorbedIndexes.has(index))
}
