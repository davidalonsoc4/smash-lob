"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BackButton } from "@/components/ui/BackButton"
import { AppCard } from "@/components/ui/AppCard"
import { TournamentShareButton } from "@/components/tournament/TournamentShareButton"
import { useI18n } from "@/i18n/I18nProvider"
import { disableRapidAudio } from "@/lib/rapidTournamentAudio"

type TournamentSettingsData = {
  traditional?: { results: unknown[] } | null
  access: { role: "creator" | "participant" }
  tournament: { id: string; name: string; status: "draft" | "in_progress" | "finished" }
  matches: Array<{ scoreA: number | null; scoreB: number | null }>
}

export function RapidTournamentSettings({ tournamentId }: { tournamentId: string }) {
  const { tx } = useI18n()
  const router = useRouter()
  const [data, setData] = useState<TournamentSettingsData | null>(null)
  const [loadingError, setLoadingError] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [finishingEmpty, setFinishingEmpty] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/tournaments/${encodeURIComponent(tournamentId)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("tournament_read_failed")
        return response.json() as Promise<TournamentSettingsData>
      })
      .then((result) => { if (!controller.signal.aborted) setData(result) })
      .catch(() => { if (!controller.signal.aborted) setLoadingError(true) })
    return () => controller.abort()
  }, [tournamentId])

  async function deleteTournament() {
    if (!data || data.tournament.status !== "finished" || deleting) return
    if (!window.confirm(tx("Se eliminarán definitivamente este torneo, sus jugadores y resultados. ¿Eliminar el torneo?"))) return
    setDeleting(true)
    setError("")
    try {
      const response = await fetch(`/api/tournaments/${encodeURIComponent(tournamentId)}`, { method: "DELETE" })
      if (!response.ok) {
        setError(tx("No se ha podido eliminar el torneo. Finalízalo antes de volver a intentarlo."))
        return
      }
      disableRapidAudio()
      router.replace("/leagues")
    } catch {
      setError(tx("No se ha podido completar la acción. Comprueba tu conexión e inténtalo de nuevo."))
    } finally {
      setDeleting(false)
    }
  }

  async function finishEmptyTournament() {
    if (!data || data.tournament.status === "finished" || finishingEmpty) return
    if (!window.confirm(tx("Finalizarás este torneo sin resultados. Después podrás eliminarlo. ¿Continuar?"))) return
    setFinishingEmpty(true)
    setError("")
    try {
      const response = await fetch(`/api/tournaments/${encodeURIComponent(tournamentId)}/finish-empty`, { method: "POST" })
      if (!response.ok) {
        setError(tx("No se ha podido finalizar el torneo sin resultados."))
        return
      }
      setData((current) => current ? { ...current, tournament: { ...current.tournament, status: "finished" } } : current)
    } catch {
      setError(tx("No se ha podido completar la acción. Comprueba tu conexión e inténtalo de nuevo."))
    } finally {
      setFinishingEmpty(false)
    }
  }

  const fallbackHref = `/tournaments/${encodeURIComponent(tournamentId)}`
  if (!data) {
    return (
      <div className="compact-page space-y-3">
        <BackButton fallbackHref={fallbackHref} returnToParam="returnTo" label={tx("Competiciones")} />
        <AppCard>
          <p role={loadingError ? "alert" : "status"} className="text-sm font-semibold text-neutral-600">
            {loadingError
              ? tx("No se ha podido cargar este torneo o no tienes acceso.")
              : tx("Cargando ajustes del torneo…")}
          </p>
        </AppCard>
      </div>
    )
  }

  const isCreator = data.access.role === "creator"
  const canDelete = isCreator && data.tournament.status === "finished"
  const hasResults = Boolean(data.traditional?.results.length) || data.matches.some((match) => match.scoreA !== null || match.scoreB !== null)
  const canFinishEmpty = !data.traditional && isCreator && data.tournament.status !== "finished" && !hasResults
  const statusLabel = data.tournament.status === "draft" ? tx("Borrador") : data.tournament.status === "in_progress" ? tx("En curso") : tx("Finalizado")
  return (
    <div className="compact-page space-y-4">
      <header className="app-page-header">
        <BackButton fallbackHref={fallbackHref} returnToParam="returnTo" label={tx("Volver")} />
        <h1 className="type-page-title mt-0.5 text-xl font-black tracking-tight">{tx("Ajustes del torneo")}</h1>
        <p className="mt-1 text-sm font-semibold text-neutral-600">{data.tournament.name} · {statusLabel}</p>
      </header>
      {isCreator ? <AppCard accentStrip>
        <p className="type-panel-title font-black">{tx("Invitaciones")}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{tx("Comparte el QR del torneo para que cada participante entre con su cuenta y elija su perfil.")}</p>
<div className="mt-3"><TournamentShareButton tournamentId={tournamentId} inline /></div>
      </AppCard> : null}      {!data.traditional ? <AppCard accentStrip>
        <p className="type-panel-title font-black">{tx("Avisos de ronda")}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{tx("Configura los sonidos y avisos que usarás durante el seguimiento de este torneo.")}</p>
        <Link href={`/settings/sounds?returnTo=${encodeURIComponent(`/tournaments/${tournamentId}/settings`)}`} className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 text-center text-sm font-black text-neutral-900 active:bg-neutral-100">{tx("Sonidos y avisos")}</Link>
      </AppCard> : null}
      {data.traditional ? <AppCard accentStrip><p className="type-panel-title font-black">{tx("Administrar torneo")}</p><div className="mt-3 grid grid-cols-2 gap-2"><Link className="inline-flex min-h-10 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 text-center text-sm font-black text-neutral-900" href={`/tournaments/${tournamentId}/calendar`}>{tx("Calendario completo")}</Link><Link className="inline-flex min-h-10 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 text-center text-sm font-black text-neutral-900" href={`/tournaments/${tournamentId}/standings`}>{tx("Clasificación")}</Link></div></AppCard> : null}
      {isCreator ? <AppCard accentStrip>
        <p className="type-panel-title font-black">{tx("Duplicar torneo")}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{tx("Reutiliza los participantes y la configuración en un torneo independiente. Los resultados no se copian.")}</p>
        <Link href={`/tournaments/new?duplicateOf=${encodeURIComponent(tournamentId)}`} className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 text-center text-sm font-black text-neutral-900 active:bg-neutral-100">{tx("Duplicar torneo")}</Link>
      </AppCard> : null}
      <AppCard className="border-red-200 bg-red-50">
        <p className="type-panel-title font-black text-red-950">{tx("Zona sensible")}</p>
        {isCreator ? <>
          <p className="mt-1 text-xs font-semibold leading-5 text-red-700">{canDelete ? tx("Elimina definitivamente el torneo, sus participantes, calendario y resultados.") : hasResults || data.traditional ? tx("Registra todos los resultados para finalizar el torneo normalmente.") : tx("Finaliza este torneo de prueba sin resultados para poder eliminarlo.")}</p>
          {canFinishEmpty ? <button type="button" onClick={() => void finishEmptyTournament()} disabled={finishingEmpty} className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl border border-red-300 bg-white px-3 text-center text-sm font-black text-red-800 active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50">{finishingEmpty ? tx("Finalizando…") : tx("Finalizar sin resultados")}</button> : null}
          <button type="button" onClick={() => void deleteTournament()} disabled={!canDelete || deleting} className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-3 text-center text-sm font-black text-white active:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-200">{deleting ? tx("Eliminando…") : tx("Eliminar torneo")}</button>
          {error ? <p role="alert" className="mt-2 text-xs font-bold text-red-700">{error}</p> : null}
        </> : <p className="mt-1 text-xs font-semibold leading-5 text-red-700">{tx("Solo el organizador puede gestionar este torneo.")}</p>}
      </AppCard>
    </div>
  )
}
