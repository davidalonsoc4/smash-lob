"use client"

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import type { MvpManualSelection, MvpScope, MvpVote } from "@/lib/mvp"
import {
  fetchSupabaseMvpData,
  saveSupabaseMvpManualSelection,
  upsertSupabaseMvpVote,
} from "@/lib/supabaseMvp"

type MvpVoteInput = {
  leagueId: string
  seasonId: string
  round: number
  matchId?: string | null
  voterPlayerId: string
  selectedPlayerId: string
}

type MvpManualSelectionInput = {
  leagueId: string
  seasonId: string
  scope: MvpScope
  round: number | null
  selectedPlayerId: string | null
}

type MvpContextValue = {
  votes: MvpVote[]
  manualSelections: MvpManualSelection[]
  voteForRoundMvp: (input: MvpVoteInput) => void
  setManualMvpSelection: (input: MvpManualSelectionInput) => void
}

type MvpProviderProps = {
  children: ReactNode
}

const MvpContext = createContext<MvpContextValue | null>(null)
const votesStorageKey = "smash-lob-mvp-votes"
const manualSelectionsStorageKey = "smash-lob-mvp-manual-selections"
const lastSupabaseErrorStorageKey = "smash-lob-last-supabase-error"
const supabaseUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function parseStoredArray<T>(value: string | null): T[] | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value)

    if (!Array.isArray(parsed)) {
      return null
    }

    return parsed as T[]
  } catch {
    return null
  }
}

function isSameVote(firstVote: MvpVoteInput, secondVote: MvpVoteInput) {
  return (
    firstVote.leagueId === secondVote.leagueId &&
    firstVote.seasonId === secondVote.seasonId &&
    firstVote.round === secondVote.round &&
    (firstVote.matchId ?? null) === (secondVote.matchId ?? null) &&
    firstVote.voterPlayerId === secondVote.voterPlayerId
  )
}

function isSameManualSelection(
  selection: MvpManualSelection,
  input: MvpManualSelectionInput
) {
  return (
    selection.leagueId === input.leagueId &&
    selection.seasonId === input.seasonId &&
    selection.scope === input.scope &&
    selection.round === input.round
  )
}

function isSupabaseBackedId(id: string) {
  return supabaseUuidPattern.test(id)
}

function recordSupabaseError(action: string, error: unknown) {
  const details =
    typeof error === "object" && error !== null
      ? error
      : { message: String(error) }

  window.localStorage.setItem(
    lastSupabaseErrorStorageKey,
    JSON.stringify({
      action,
      ...details,
      createdAt: new Date().toISOString(),
    })
  )
}

function mergeVotes(currentVotes: MvpVote[], incomingVotes: MvpVote[]) {
  const items = new Map(
    currentVotes.map((vote) => [
      `${vote.leagueId}:${vote.seasonId}:${vote.round}:${vote.matchId ?? "round"}:${vote.voterPlayerId}`,
      vote,
    ])
  )

  incomingVotes.forEach((vote) => {
    items.set(
      `${vote.leagueId}:${vote.seasonId}:${vote.round}:${vote.matchId ?? "round"}:${vote.voterPlayerId}`,
      vote
    )
  })

  return Array.from(items.values())
}

function mergeManualSelections(
  currentSelections: MvpManualSelection[],
  incomingSelections: MvpManualSelection[]
) {
  const items = new Map(
    currentSelections.map((selection) => [
      `${selection.leagueId}:${selection.seasonId}:${selection.scope}:${selection.round ?? "season"}`,
      selection,
    ])
  )

  incomingSelections.forEach((selection) => {
    items.set(
      `${selection.leagueId}:${selection.seasonId}:${selection.scope}:${selection.round ?? "season"}`,
      selection
    )
  })

  return Array.from(items.values())
}

export function MvpProvider({ children }: MvpProviderProps) {
  const { userLeagues } = useLeagueAccess()
  const [votes, setVotes] = useState<MvpVote[]>([])
  const [manualSelections, setManualSelections] = useState<
    MvpManualSelection[]
  >([])
  const supabaseLeagueIds = useMemo(
    () => userLeagues.map((league) => league.id).filter(isSupabaseBackedId),
    [userLeagues]
  )
  const supabaseLeagueIdKey = supabaseLeagueIds.join("|")

  useEffect(() => {
    const storedVotes = parseStoredArray<MvpVote>(
      window.localStorage.getItem(votesStorageKey)
    )
    const storedManualSelections = parseStoredArray<MvpManualSelection>(
      window.localStorage.getItem(manualSelectionsStorageKey)
    )

    if (storedVotes) {
      window.setTimeout(() => setVotes(storedVotes), 0)
    }

    if (storedManualSelections) {
      window.setTimeout(() => setManualSelections(storedManualSelections), 0)
    }
  }, [])

  const persistVotes = useCallback((nextVotes: MvpVote[]) => {
    window.localStorage.setItem(votesStorageKey, JSON.stringify(nextVotes))
    return nextVotes
  }, [])

  const persistManualSelections = useCallback(
    (nextSelections: MvpManualSelection[]) => {
      window.localStorage.setItem(
        manualSelectionsStorageKey,
        JSON.stringify(nextSelections)
      )
      return nextSelections
    },
    []
  )

  useEffect(() => {
    if (!supabaseLeagueIdKey) {
      return
    }

    fetchSupabaseMvpData(supabaseLeagueIds)
      .then((result) => {
        setVotes((currentVotes) =>
          persistVotes(mergeVotes(currentVotes, result.votes))
        )
        setManualSelections((currentSelections) =>
          persistManualSelections(
            mergeManualSelections(currentSelections, result.manualSelections)
          )
        )
      })
      .catch((error) => {
        recordSupabaseError("fetch-mvp-data", error)
      })
  }, [persistManualSelections, persistVotes, supabaseLeagueIdKey, supabaseLeagueIds])

  const voteForRoundMvp = useCallback(
    (input: MvpVoteInput) => {
      const nextVote: MvpVote = {
        ...input,
        createdAt: new Date().toISOString(),
      }

      setVotes((currentVotes) =>
        persistVotes([
          ...currentVotes.filter((vote) => !isSameVote(vote, input)),
          nextVote,
        ])
      )

      if (isSupabaseBackedId(input.leagueId)) {
        upsertSupabaseMvpVote(nextVote).catch((error) => {
          recordSupabaseError("upsert-mvp-vote", error)
        })
      }
    },
    [persistVotes]
  )

  const setManualMvpSelection = useCallback(
    (input: MvpManualSelectionInput) => {
      setManualSelections((currentSelections) => {
        const selectionsWithoutCurrent = currentSelections.filter(
          (selection) => !isSameManualSelection(selection, input)
        )

        if (!input.selectedPlayerId) {
          return persistManualSelections(selectionsWithoutCurrent)
        }

        return persistManualSelections([
          ...selectionsWithoutCurrent,
          {
            leagueId: input.leagueId,
            seasonId: input.seasonId,
            scope: input.scope,
            round: input.round,
            selectedPlayerId: input.selectedPlayerId,
            updatedAt: new Date().toISOString(),
          },
        ])
      })

      if (isSupabaseBackedId(input.leagueId)) {
        saveSupabaseMvpManualSelection(input).catch((error) => {
          recordSupabaseError("save-mvp-manual-selection", error)
        })
      }
    },
    [persistManualSelections]
  )

  const value = useMemo(
    () => ({
      votes,
      manualSelections,
      voteForRoundMvp,
      setManualMvpSelection,
    }),
    [manualSelections, setManualMvpSelection, voteForRoundMvp, votes]
  )

  return <MvpContext.Provider value={value}>{children}</MvpContext.Provider>
}

export function useMvp() {
  const context = useContext(MvpContext)

  if (!context) {
    throw new Error("useMvp must be used inside MvpProvider")
  }

  return context
}
