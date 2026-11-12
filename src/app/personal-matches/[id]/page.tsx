"use client"

import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/i18n/I18nProvider"
import { requestMatchDashboardRefresh, requestPaymentLedgerRefresh, requestPersonalProfileHistoryRefresh } from "@/lib/appRefreshEvents"
import { useEffect, useMemo, useRef, useState } from "react"
import { useAccountProfile } from "@/context/AccountProfileProvider"
import { clearMatchChatCache, readMatchChatCache, writeMatchChatCache } from "@/lib/matchChatCache"
import { MatchDetailView } from "@/components/match/MatchDetailView"
import { MatchChatFloatingAction } from "@/components/match/MatchChatFloatingAction"
import { PersonalMatchParticipantsPanel } from "@/components/personal/PersonalMatchParticipantsPanel"
import { PersonalMatchCourtBookingPanel } from "@/components/personal/PersonalMatchCourtBookingPanel"
import { PersonalMatchResultForm } from "@/components/personal/PersonalMatchResultForm"
import { PersonalMatchSchedulePanel } from "@/components/personal/PersonalMatchSchedulePanel"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { buildPersonalMatchDetailModel } from "@/lib/personalMatchDetailModel"
import type { PersonalMatchItem } from "@/lib/personalMatches"

export default function PersonalMatchDetailPage() {
  const { account, matchDashboard, history } = useAccountProfile()
  const { id } = useParams<{ id: string }>()
  const dashboard = matchDashboard.getSnapshot().data
  const initialItem = account
    ? dashboard?.upcoming.find(match => match.id === id) ?? dashboard?.items.find(match => match.id === id) ?? history.getSnapshot().data?.find(match => match.id === id)
    : undefined
  return <PersonalMatchDetail key={JSON.stringify([account, id])} account={account} id={id} initialItem={initialItem} />
}

function PersonalMatchDetail({ account, id, initialItem }: { account: string; id: string; initialItem?: PersonalMatchItem }) {
  const { tx } = useI18n()
  const router = useRouter()
  const cacheKey = `personal-detail:${id}`
  const [item, setItem] = useState<PersonalMatchItem | null>(() =>
    (account ? readMatchChatCache(cacheKey, account) as PersonalMatchItem | null : null) ?? initialItem ?? null,
  )
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [editingResult, setEditingResult] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const revision = useRef(0)

  useEffect(() => {
    const controller = new AbortController()
    const requestRevision = revision.current
    fetch(`/api/personal-matches/${encodeURIComponent(id)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (controller.signal.aborted) return
        if ([401, 403, 404].includes(response.status)) {
          clearMatchChatCache(cacheKey, account)
          setItem(null)
        }
        const payload = (await response.json()) as { item?: PersonalMatchItem }
        if (!response.ok || !payload.item) throw new Error("personal_match_lookup_failed")
        return payload.item
      })
      .then((nextItem) => {
        if (controller.signal.aborted || !nextItem || revision.current !== requestRevision) return
        if (account) writeMatchChatCache(cacheKey, account, nextItem)
        setItem(nextItem)
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("No se ha podido cargar este partido.")
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [account, cacheKey, id])

  function updateItem(nextItem: PersonalMatchItem) {
    revision.current++
    if (account) writeMatchChatCache(cacheKey, account, nextItem)
    setItem(nextItem)
  }

  const scoreboard = useMemo(() => (item ? buildPersonalMatchDetailModel(item) : null), [item])

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
      revision.current++
      clearMatchChatCache(cacheKey, account)
      requestPaymentLedgerRefresh()
      if (item.status === "finished") requestPersonalProfileHistoryRefresh()
      else requestMatchDashboardRefresh()
      router.replace("/personal-matches")
    } catch {
      setError("No se ha podido eliminar el partido.")
      setDeleting(false)
    }
  }

  if (loading && !item) {
    return (
      <div className="compact-page space-y-3">
        <BackButton fallbackHref="/personal-matches" label={tx("Mis partidos")} />
        <AppCard className="p-4">
          <p className="text-xs font-semibold text-neutral-500">{tx("Cargando partido...")}</p>
        </AppCard>
      </div>
    )
  }

  if (!item || !scoreboard) {
    return (
      <div className="compact-page space-y-3">
        <BackButton fallbackHref="/personal-matches" label={tx("Mis partidos")} />
        <AppCard className="border-red-100 bg-red-50 p-4">
          <p className="text-sm font-black text-red-800">{tx("Partido no disponible")}</p>
          <p className="mt-1 text-xs font-semibold text-red-700">{error}</p>
        </AppCard>
      </div>
    )
  }

  return (
    <MatchDetailView
      backHref="/personal-matches"
      backLabel="Mis partidos"
      title={tx("Partido")}
      status={item.status}
      isParticipant={item.participants.some(participant => participant.isCurrentUser)}
      canRecordResult={item.status === "scheduled" && item.canManage}
      scheduledAt={item.scheduledAt}
      resultRecordedAt={item.resultRecordedAt}
      headerActions={
        <MatchChatFloatingAction href={`/personal-matches/${item.id}/chat`} />
      }
      pairing={{
        teamA: scoreboard.teamA,
        teamB: scoreboard.teamB,
        players: scoreboard.players,
        pointsA: scoreboard.pointsA,
        pointsB: scoreboard.pointsB,
        sets: item.sets,
        linkPlayers: false,
        showPendingPlayerMetadata: true,
        showFinishedPlayerMetadata: false,
      }}
    >
      <PersonalMatchParticipantsPanel match={item} onUpdated={updateItem} />

      <PersonalMatchSchedulePanel match={item} onUpdated={updateItem} />

      <PersonalMatchCourtBookingPanel match={item} onUpdated={updateItem} />

      {item.status === "scheduled" && item.canManage ? (
        <PersonalMatchResultForm
          match={item}
          mode="create"
          onSaved={(nextItem) => {
            updateItem(nextItem)
            setEditingResult(false)
          }}
        />
      ) : null}

      {item.status === "finished" && item.canManage && !editingResult ? (
        <AppCard>
          <p className="font-black">{tx("Resultado registrado")}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{tx("Puedes corregir los sets si detectas algún error en el amistoso.")}</p>
          <button
            type="button"
            onClick={() => setEditingResult(true)}
            className="flex mt-3 w-full rounded-xl bg-neutral-100 px-3 py-2 text-sm font-black text-neutral-800 items-center justify-center text-center"
          >{tx("Editar resultado")}</button>
        </AppCard>
      ) : null}

      {item.status === "finished" && item.canManage && editingResult ? (
        <PersonalMatchResultForm
          match={item}
          mode="edit"
          onCancel={() => setEditingResult(false)}
          onSaved={(nextItem) => {
            updateItem(nextItem)
            setEditingResult(false)
          }}
        />
      ) : null}

      <AppCard className="border-blue-100 bg-blue-50 p-3">
        <p className="text-xs font-black text-blue-950">{tx("Partido personal")}</p>
        <p className="mt-1 type-caption font-semibold leading-4 text-blue-700">{tx("Este encuentro no pertenece a ninguna competición y no afecta a clasificación, estadísticas oficiales, récords ni MVP de tus ligas.")}</p>
      </AppCard>

      {item.canDelete ? (
        <button
          type="button"
          disabled={deleting}
          onClick={() => void deleteMatch()}
          className="flex w-full rounded-xl bg-red-50 px-3 py-2.5 text-xs font-black text-red-700 disabled:opacity-50 items-center justify-center text-center"
        >
          {deleting ? "Eliminando..." : tx("Eliminar partido")}
        </button>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p>
      ) : null}
    </MatchDetailView>
  )
}
