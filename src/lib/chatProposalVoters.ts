export function compactParticipantName(name: string, names: string[]) {
  const compact = (value: string) => { const [first, surname] = value.trim().split(/\s+/); return `${first}${surname ? ` ${Array.from(surname)[0].toLocaleUpperCase("es-ES")}.` : ""}` }
  const label = compact(name)
  return names.filter(value => compact(value).toLocaleLowerCase("es-ES") === label.toLocaleLowerCase("es-ES")).length > 1 ? name : label
}

/** Keep every match participant visible, including players without an account. */
export function groupChatProposalVoters<T extends { userId: string | null }>(
  participants: T[],
  responses: { userId: string; optionKey: string; response: "available" | "unavailable" }[],
  optionKey: string,
) {
  const byUser = new Map(responses.filter(item => item.optionKey === optionKey).map(item => [item.userId, item.response]))
  const yes: T[] = [], no: T[] = [], pending: T[] = []
  for (const participant of participants) {
    const response = participant.userId ? byUser.get(participant.userId) : undefined
    if (response === "available") yes.push(participant)
    else if (response === "unavailable") no.push(participant)
    else pending.push(participant)
  }
  return { yes, no, pending }
}
