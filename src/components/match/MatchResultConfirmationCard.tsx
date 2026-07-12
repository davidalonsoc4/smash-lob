"use client"

import { useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import type { PlayerProfile } from "@/data/fakeData"

type ResultConfirmationStatus = "confirmed" | "disputed"

type ResultConfirmation = {
  matchId: string
  playerId: string
  status: ResultConfirmationStatus
  updatedAt: string
}

type MatchResultConfirmationCardProps = {
  matchId: string
  participantIds: string[]
  currentUserId: string
  players: PlayerProfile[]
}

const storageKey = "smash-lob-result-confirmations"

function readConfirmations() {
  if (typeof window === "undefined") {
    return [] as ResultConfirmation[]
  }

  try {
    const value = window.localStorage.getItem(storageKey)
    const parsed = value ? JSON.parse(value) : []

    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is ResultConfirmation =>
            typeof item?.matchId === "string" &&
            typeof item?.playerId === "string" &&
            (item?.status === "confirmed" || item?.status === "disputed") &&
            typeof item?.updatedAt === "string"
        )
      : []
  } catch {
    return []
  }
}

function playerName(players: PlayerProfile[], playerId: string) {
  return players.find((player) => player.id === playerId)?.displayName ?? playerId
}

export function MatchResultConfirmationCard({
  matchId,
  participantIds,
  currentUserId,
  players,
}: MatchResultConfirmationCardProps) {
  const [confirmations, setConfirmations] =
    useState<ResultConfirmation[]>(readConfirmations)
  const isParticipant = participantIds.includes(currentUserId)
  const matchConfirmations = useMemo(
    () => confirmations.filter((confirmation) => confirmation.matchId === matchId),
    [confirmations, matchId]
  )
  const currentConfirmation = matchConfirmations.find(
    (confirmation) => confirmation.playerId === currentUserId
  )
  const confirmedIds = new Set(
    matchConfirmations
      .filter((confirmation) => confirmation.status === "confirmed")
      .map((confirmation) => confirmation.playerId)
  )
  const disputedIds = new Set(
    matchConfirmations
      .filter((confirmation) => confirmation.status === "disputed")
      .map((confirmation) => confirmation.playerId)
  )
  const pendingIds = participantIds.filter(
    (playerId) => !confirmedIds.has(playerId) && !disputedIds.has(playerId)
  )

  function saveConfirmation(status: ResultConfirmationStatus) {
    const nextConfirmation = {
      matchId,
      playerId: currentUserId,
      status,
      updatedAt: new Date().toISOString(),
    }
    const nextConfirmations = [
      ...confirmations.filter(
        (confirmation) =>
          !(confirmation.matchId === matchId && confirmation.playerId === currentUserId)
      ),
      nextConfirmation,
    ]

    window.localStorage.setItem(storageKey, JSON.stringify(nextConfirmations))
    setConfirmations(nextConfirmations)
  }

  return (
    <AppCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-black">Confirmar resultado</p>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
            Propuesta inicial: cada jugador confirma si el marcador guardado es correcto o pide revision.
          </p>
        </div>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-black text-neutral-700">
          Beta
        </span>
      </div>

      {isParticipant ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => saveConfirmation("confirmed")}
            className={`rounded-xl px-3 py-2 text-sm font-black ${
              currentConfirmation?.status === "confirmed"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-800"
            }`}
          >
            Correcto
          </button>
          <button
            type="button"
            onClick={() => saveConfirmation("disputed")}
            className={`rounded-xl px-3 py-2 text-sm font-black ${
              currentConfirmation?.status === "disputed"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-800"
            }`}
          >
            Revisar
          </button>
        </div>
      ) : null}

      <div className="mt-3 grid gap-2">
        {participantIds.map((playerId) => {
          const player = players.find((item) => item.id === playerId) ?? null
          const status = confirmedIds.has(playerId)
            ? "Confirmado"
            : disputedIds.has(playerId)
              ? "Revisar"
              : "Pendiente"

          return (
            <div
              key={playerId}
              className="flex items-center justify-between gap-3 rounded-xl bg-neutral-100 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <PlayerAvatar player={player} size="sm" />
                <p className="truncate text-sm font-black">
                  {playerName(players, playerId)}
                </p>
              </div>
              <span className="shrink-0 text-xs font-black text-neutral-500">
                {status}
              </span>
            </div>
          )
        })}
      </div>

      {pendingIds.length > 0 ? (
        <p className="mt-3 text-xs font-semibold text-neutral-500">
          Pendientes: {pendingIds.map((playerId) => playerName(players, playerId)).join(", ")}
        </p>
      ) : null}
    </AppCard>
  )
}
