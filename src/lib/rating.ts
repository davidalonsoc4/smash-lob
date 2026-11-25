// Nivel de los jugadores (Elo propio de Smash & Lob).
// Se calcula siempre desde todo el historial a la vez: se buscan los ratings que mejor explican todos los resultados
// (Bradley-Terry regularizado). No depende del orden de los partidos y no hay nada que "acumular" ni que quede desfasado.

export type RatingSet = { a: number; b: number }
export type RatingMatch = { id: string; at: string; kind: "league" | "friendly"; teamA: string[]; teamB: string[]; sets: RatingSet[] }

export type RatingConfig = {
  /** Peso del margen de juegos frente a ganar o perder (0-1). */
  marginWeight: number
  /** Peso de un amistoso frente a un partido de liga. */
  friendlyWeight: number
  /** Freno: cuanto más alto, más cerca de 1000 se quedan los jugadores con pocos partidos. */
  regularization: number
  /** Partidos a partir de los cuales el nivel deja de ser provisional. */
  provisionalUntil: number
  iterations: number
}

export const DEFAULT_RATING_CONFIG: RatingConfig = { marginWeight: 0.3, friendlyWeight: 0.5, regularization: 0.08, provisionalUntil: 10, iterations: 3000 }

export type RatingEvent = { matchId: string; at: string; kind: "league" | "friendly"; won: boolean; expected: number; partners: string[]; opponents: string[]; score: string }
export type PlayerRating = { key: string; rating: number; level: number; matches: number; wins: number; provisional: boolean; events: RatingEvent[] }

const BASE = 1000
const SCALE = 400
const LN10 = Math.LN10

/** Rating Elo -> nivel de 0 a 100 (50 = 1000). Nadie llega a 0 ni a 100. */
export function ratingToLevel(rating: number) {
  return 100 / (1 + Math.pow(10, (BASE - rating) / SCALE))
}

/** Referencia visual (no es un nivel absoluto: todos los niveles son relativos a los jugadores de la app). */
export const RATING_BANDS = [{ from: 1300, label: "Élite" }, { from: 1100, label: "Avanzado" }, { from: 900, label: "Medio" }, { from: -Infinity, label: "Iniciación" }] as const
export const ratingBand = (rating: number) => RATING_BANDS.find((band) => rating >= band.from)!.label
/** Posición (0-100 %) en la barra de referencia, de 700 a 1400 Elo. */
export const ratingBarPosition = (rating: number) => Math.round(Math.min(1, Math.max(0, (rating - 700) / 700)) * 100)

export function expectedScore(ratingA: number, ratingB: number) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / SCALE))
}

function resultOf(match: RatingMatch) {
  const setsA = match.sets.filter((set) => set.a > set.b).length
  const setsB = match.sets.filter((set) => set.b > set.a).length
  if (setsA === setsB) return null
  const gamesA = match.sets.reduce((total, set) => total + set.a, 0)
  const gamesB = match.sets.reduce((total, set) => total + set.b, 0)
  return { win: setsA > setsB ? 1 : 0, share: gamesA + gamesB > 0 ? gamesA / (gamesA + gamesB) : 0.5 }
}

const isValid = (match: RatingMatch) => match.teamA.length === 2 && match.teamB.length === 2 && new Set([...match.teamA, ...match.teamB]).size === 4

export function computeRatings(matches: readonly RatingMatch[], config: RatingConfig = DEFAULT_RATING_CONFIG): Map<string, PlayerRating> {
  const usable = matches
    .filter(isValid)
    .map((match) => ({ match, result: resultOf(match) }))
    .filter((entry): entry is { match: RatingMatch; result: NonNullable<ReturnType<typeof resultOf>> } => entry.result !== null)
    .sort((left, right) => left.match.at.localeCompare(right.match.at))

  const theta = new Map<string, number>()
  for (const { match } of usable) for (const key of [...match.teamA, ...match.teamB]) theta.set(key, 0)

  const unit = SCALE / LN10 // 1 unidad logistica = esta cantidad de puntos Elo
  const targets = usable.map(({ match, result }) => ({
    match,
    target: (1 - config.marginWeight) * result.win + config.marginWeight * result.share,
    weight: match.kind === "friendly" ? config.friendlyWeight : 1,
  }))

  for (let step = 0; step < config.iterations; step += 1) {
    const gradient = new Map<string, number>()
    for (const [key, value] of theta) gradient.set(key, -config.regularization * value)
    for (const { match, target, weight } of targets) {
      const a = ((theta.get(match.teamA[0]) ?? 0) + (theta.get(match.teamA[1]) ?? 0)) / 2
      const b = ((theta.get(match.teamB[0]) ?? 0) + (theta.get(match.teamB[1]) ?? 0)) / 2
      const delta = (weight * (target - 1 / (1 + Math.exp(-(a - b))))) / 2
      for (const key of match.teamA) gradient.set(key, (gradient.get(key) ?? 0) + delta)
      for (const key of match.teamB) gradient.set(key, (gradient.get(key) ?? 0) - delta)
    }
    for (const [key, value] of theta) theta.set(key, value + 0.05 * (gradient.get(key) ?? 0))
  }

  const ratings = new Map<string, PlayerRating>()
  for (const [key, value] of theta) {
    const rating = BASE + value * unit
    ratings.set(key, { key, rating, level: ratingToLevel(rating), matches: 0, wins: 0, provisional: true, events: [] })
  }

  for (const { match, result } of usable) {
    const average = (keys: string[]) => keys.reduce((total, key) => total + (ratings.get(key)?.rating ?? BASE), 0) / keys.length
    const expectedA = expectedScore(average(match.teamA), average(match.teamB))
    const score = match.sets.map((set) => `${set.a}-${set.b}`).join(" ")
    const record = (keys: string[], others: string[], won: boolean, expected: number) => {
      for (const key of keys) {
        const player = ratings.get(key)
        if (!player) continue
        player.matches += 1
        if (won) player.wins += 1
        player.events.push({ matchId: match.id, at: match.at, kind: match.kind, won, expected, partners: keys.filter((other) => other !== key), opponents: others, score })
      }
    }
    record(match.teamA, match.teamB, result.win === 1, expectedA)
    record(match.teamB, match.teamA, result.win === 0, 1 - expectedA)
  }
  for (const player of ratings.values()) player.provisional = player.matches < config.provisionalUntil
  return ratings
}

/** Diferencia de nivel (0-100) entre dos parejas. */
export function pairLevelGap(ratings: ReadonlyMap<string, number>, pairA: readonly string[], pairB: readonly string[]) {
  const level = (pair: readonly string[]) => pair.reduce((total, key) => total + ratingToLevel(ratings.get(key) ?? BASE), 0) / pair.length
  return Math.abs(level(pairA) - level(pairB))
}
