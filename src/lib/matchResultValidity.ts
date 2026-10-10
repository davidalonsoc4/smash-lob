export function hasMatchResultWinner(sets: { a: number; b: number }[]) {
  if (!sets.length || sets.some((set) => !Number.isFinite(set.a) || !Number.isFinite(set.b) || set.a === set.b)) return false
  return sets.filter((set) => set.a > set.b).length !== sets.filter((set) => set.b > set.a).length
}
