"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { MatchDetailPairingPanel } from "@/components/match/MatchDetailPairingPanel"
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge"
import { PersonalMatchResultForm } from "@/components/personal/PersonalMatchResultForm"
import { PersonalMatchSchedulePanel } from "@/components/personal/PersonalMatchSchedulePanel"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import type { PlayerProfile } from "@/data/fakeData"
import {
  sortPersonalMatchParticipants,
  type PersonalMatchItem,
} from "@/lib/personalMatches"

export default function PersonalMatchDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [item, setItem] = useState<PersonalMatchItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [editingResult, setEditingResult] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/personal-matches/${encodeURIComponent(params.id)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { item?: PersonalMatchItem }
        if (!response.ok || !payload.item) throw new Error("personal_match_lookup_failed")
        return payload.item
      })
      .then((nextItem) => {
        if (!cancelled) setItem(nextItem)
      })
      .catch(() => {
        if (!cancelled) setError("No se ha podido cargar este partido.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [params.id])

  const scoreboard = useMemo(() => {
    if (!item) return null
    const sorted = sortPersonalMatchParticipants(item.participants)
    const players: PlayerProfile[] = sorted.map((participant) => ({
      id: `personal-${participant.team}-${participant.slot}`,
      leagueId: "personal",
      slug: `personal-${participant.team}-${participant.slot}`,
      displayName: participant.displayName,
      avatarInitials: participant.displayName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] ?? "")
        .join("")
        .toUpperCase() || "JG",
      avatarUrl: participant.avatarUrl ?? null,
      userId: null,
    }))
    const teamA = sorted
      .filter((participant) => participant.team === 1)
      .map((participant) => `personal-${participant.team}-${participant.slot}`)
    const teamB = sorted
      .filter((participant) => participant.team === 2)
      .map((participant) => `personal-${participant.team}-${participant.slot}`)
    const pointsA = item.status === "finished"
      ? item.sets.filter((set) => set.a > set.b).length
      : null
    const pointsB = item.status === "finished"
      ? item.sets.filter((set) => set.b > set.a).length
      : null

    return { players, teamA, teamB, pointsA, pointsB }
  }, [item])

  async function deleteMatch() {
    if (!item?.canDelete || deleting) return
    if (!window.confirm("¿Eliminar este amistoso del historial de todos sus participantes?")) return

    setDeleting(true)
    setError(null)
    try {
      const response = await fetch(`/api/personal-matches/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("personal_match_delete_failed")
      router.replace("/personal-matches")
    } catch {
      setError("No se ha podido eliminar el partido.")
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="compact-page space-y-3">
        <BackButton fallbackHref="/personal-matches" label="Mis partidos" />
        <AppCard className="p-4">
          <p className="text-xs font-semibold text-neutral-500">Cargando partido...</p>
        </AppCard>
      </div>
    )
  }

  if (!item || !scoreboard) {
    return (
      <div className="compact-page space-y-3">
        <BackButton fallbackHref="/personal-matches" label="Mis partidos" />
        <AppCard className="border-red-100 bg-red-50 p-4">
          <p className="text-sm font-black text-red-800">Partido no disponible</p>
          <p className="mt-1 text-xs font-semibold text-red-700">{error}</p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="compact-page space-y-3">
      <header className="pt-1">
        <BackButton fallbackHref="/personal-matches" label="Mis partidos" />
        <div className="relative mt-3 min-w-0 w-full pr-28">
          <h1 className="min-w-0 text-2xl font-black tracking-tight">Partido</h1>
          <div className="absolute right-0 top-0 flex shrink-0 flex-col items-end gap-1 text-right">
            <span className="self-end rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-700">
              Amistoso
            </span>
            <MatchStatusBadge
              status={item.status}
              scheduledAt={item.scheduledAt}
              resultRecordedAt={item.resultRecordedAt}
            />
          </div>
        </div>
      </header>

      <MatchDetailPairingPanel
        teamA={scoreboard.teamA}
        teamB={scoreboard.teamB}
        players={scoreboard.players}
        pointsA={scoreboard.pointsA}
        pointsB={scoreboard.pointsB}
        sets={item.sets}
        linkPlayers={false}
      />

      <PersonalMatchSchedulePanel match={item} onUpdated={setItem} />

      {item.status === "scheduled" && item.canManage ? (
        <PersonalMatchResultForm
          match={item}
          mode="create"
          onSaved={(nextItem) => {
            setItem(nextItem)
            setEditingResult(false)
          }}
        />
      ) : null}

      {item.status === "finished" && item.canManage && !editingResult ? (
        <AppCard>
          <p className="font-black">Resultado registrado</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
            Puedes corregir los sets si detectas algún error en el amistoso.
          </p>
          <button
            type="button"
            onClick={() => setEditingResult(true)}
            className="mt-3 w-full rounded-xl bg-neutral-100 px-3 py-2 text-sm font-black text-neutral-800"
          >
            Editar resultado
          </button>
        </AppCard>
      ) : null}

      {item.status === "finished" && item.canManage && editingResult ? (
        <PersonalMatchResultForm
          match={item}
          mode="edit"
          onCancel={() => setEditingResult(false)}
          onSaved={(nextItem) => {
            setItem(nextItem)
            setEditingResult(false)
          }}
        />
      ) : null}

      <AppCard className="border-blue-100 bg-blue-50 p-3">
        <p className="text-xs font-black text-blue-950">Partido personal</p>
        <p className="mt-1 text-[10px] font-semibold leading-4 text-blue-700">
          Este encuentro no pertenece a ninguna competición y no afecta a clasificación, estadísticas oficiales, récords ni MVP de tus ligas.
        </p>
      </AppCard>

      {item.canDelete ? (
        <button
          type="button"
          disabled={deleting}
          onClick={() => void deleteMatch()}
          className="w-full rounded-xl bg-red-50 px-3 py-2.5 text-xs font-black text-red-700 disabled:opacity-50"
        >
          {deleting ? "Eliminando..." : "Eliminar partido"}
        </button>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p>
      ) : null}
    </div>
  )
}
