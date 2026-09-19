"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppCard } from "@/components/ui/AppCard"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useMatchData } from "@/context/MatchDataProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { deleteSupabaseRoundMatches, deleteSupabaseSeason } from "@/lib/supabaseSeasons"
import { showActionFeedback } from "@/lib/actionFeedback"

const supabaseUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const isSupabaseBackedId = (id: string) => supabaseUuidPattern.test(id)
const recordSupabaseError = (action: string, error: unknown) => {
  try { window.localStorage.setItem("smash-lob-last-supabase-error", JSON.stringify({ action, message: error instanceof Error ? error.message : String(error), at: new Date().toISOString() })) } catch { /* diagnostics are best effort */ }
}

export function SeasonDangerZone({ activeLeagueId, activeSeasonId, totalRounds }: { activeLeagueId: string; activeSeasonId: string; totalRounds: number }) {
  const { tx } = useI18n()
  const router = useRouter()
  const { deleteSeason, hydrateSeasonSnapshot } = useSeasonSettings()
  const { deleteRoundMatches, deleteSeasonMatches } = useMatchData()
  const { userLeagues } = useLeagueAccess()
  const [selectedRound, setSelectedRound] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function handleDeleteRound() {
    if (isSaving || !window.confirm(tx(`¿Eliminar la Jornada ${selectedRound}? Se borrarán sus partidos y resultados.`))) return
    setIsSaving(true); setError(null)
    if (isSupabaseBackedId(activeSeasonId)) {
      try { await deleteSupabaseRoundMatches({ leagueId: activeLeagueId, seasonId: activeSeasonId, round: selectedRound }) }
      catch (caught) { recordSupabaseError("delete-round-matches", caught); setError("No se ha podido eliminar la jornada en Supabase. Revisa smash-lob-last-supabase-error."); setIsSaving(false); return }
    }
    deleteRoundMatches(activeSeasonId, selectedRound); showActionFeedback({ tone: "success", message: tx(`Jornada ${selectedRound} eliminada.`) }); setIsSaving(false)
  }

  async function handleDeleteSeason() {
    if (isSaving || !window.confirm(tx("¿Eliminar la temporada completa? Se borrarán sus jornadas, partidos y resultados."))) return
    setIsSaving(true); setError(null)
    if (isSupabaseBackedId(activeSeasonId)) {
      try { hydrateSeasonSnapshot(await deleteSupabaseSeason({ leagueId: activeLeagueId, seasonId: activeSeasonId })) }
      catch (caught) { recordSupabaseError("delete-season", caught); setError("No se ha podido eliminar la temporada en Supabase. Revisa smash-lob-last-supabase-error."); setIsSaving(false); return }
    }
    deleteSeason(activeLeagueId, activeSeasonId); deleteSeasonMatches(activeSeasonId); setIsSaving(false); router.push(userLeagues.length > 0 ? "/leagues" : "/")
  }

  return <AppCard>
    <p className="font-bold">{tx("Zona de eliminación")}</p>
    <p className="mt-1 text-xs font-semibold text-neutral-500">{tx("Permite borrar jornadas o temporadas completas si el calendario se creó mal. Es una acción destructiva.")}</p>
    <div className="mt-3 rounded-2xl bg-neutral-100 p-3"><label className="block"><span className="text-xs font-black uppercase tracking-wide text-neutral-600">{tx("Jornada a eliminar")}</span><select value={selectedRound} onChange={(event) => setSelectedRound(Number(event.target.value))} disabled={isSaving} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-black text-neutral-950 outline-none">{Array.from({ length: totalRounds }, (_, index) => index + 1).map((round) => <option key={round} value={round}>{tx("Jornada")} {round}</option>)}</select></label><button type="button" onClick={handleDeleteRound} disabled={isSaving} className="flex mt-3 w-full rounded-2xl bg-red-50 px-3 py-2.5 text-sm font-black text-red-700 disabled:text-red-300 items-center justify-center text-center">{tx("Eliminar jornada")}</button></div>
    <button type="button" onClick={handleDeleteSeason} disabled={isSaving} className="flex mt-3 w-full rounded-2xl bg-red-600 px-3 py-2.5 text-sm font-black text-white disabled:bg-red-200 items-center justify-center text-center">{tx("Eliminar temporada completa")}</button>
    {error ? <p className="mt-3 text-center text-sm font-semibold text-red-600">{tx(error)}</p> : null}
  </AppCard>
}
