"use client"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { League } from "@/data/fakeData"
import type { LeagueLocation } from "@/lib/leagueLocations"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { LeagueCreationForm } from "./LeagueCreationForm"
import { NewSeasonForm } from "@/components/admin/season/NewSeasonForm"

export function LeagueCreationWizard() {
  const router = useRouter()
  const { tx } = useI18n()
  const { activateGrantedLeague } = useActiveLeague()
  const { createLeague, updateLeagueLogo, updateLeagueDetails, updateLeagueAccentColor, updateLeagueLocations } = useLeagueAccess()
  const [draft, setDraft] = useState<League | null>(null)
  const [editingIdentity, setEditingIdentity] = useState(true)
  const [expandCustomization, setExpandCustomization] = useState(false)
  const [modalityLocked, setModalityLocked] = useState(false)
  // A final-save retry must reuse the league already returned by the server.
  const saved = useRef<League | null>(null)
  async function prepareLeague(locations: LeagueLocation[]) {
    if (!draft) throw new Error(tx("Revisa los datos de la liga."))
    let league = saved.current
    if (!league) {
      league = await createLeague({ name: draft.name, description: draft.description, recommendations: draft.recommendations ?? "", modality: draft.modality, accentColor: draft.accentColor ?? undefined, locations })
      if (!league) throw new Error(tx("No se han podido guardar los datos de la liga."))
      saved.current = league; setModalityLocked(true)
    } else {
      if (league.modality !== draft.modality) throw new Error(tx("La modalidad queda fijada al crear la liga."))
      if (!await updateLeagueDetails(league.id, { name: draft.name, description: draft.description, recommendations: draft.recommendations ?? "" }) || !await updateLeagueAccentColor(league.id, draft.accentColor ?? "#D7A544") || !await updateLeagueLocations(league.id, locations)) throw new Error(tx("No se han podido guardar los datos de la liga."))
    }
    if (draft.logoUrl !== (league.logoUrl ?? null)) {
      if (!await updateLeagueLogo(league.id, draft.logoUrl ?? null)) throw new Error(tx("La liga está guardada, pero falta guardar el logo. Vuelve a intentarlo."))
      saved.current = { ...league, logoUrl: draft.logoUrl }
    }
    return league.id
  }
  return <>
    <div hidden={!editingIdentity}><LeagueCreationForm initialLeague={draft ?? undefined} modalityLocked={modalityLocked} expandCustomization={expandCustomization} onNext={league => { setDraft(league); setEditingIdentity(false); window.scrollTo(0, 0) }} onBack={() => router.push("/leagues")} /></div>
    {draft ? <div hidden={editingIdentity}><NewSeasonForm activeLeagueId={draft.id} activeLeagueName={draft.name} activeSeasonId="" currentPlayers={[]} initialLocations={draft.locations ?? []} draftLeague={draft} onEditLeague={fromSummary => { setExpandCustomization(fromSummary); setEditingIdentity(true); window.scrollTo(0, 0) }} onPrepareLeague={prepareLeague} onCreated={id => activateGrantedLeague(id, "/")} onExit={() => router.push("/leagues")} /></div> : null}
  </>
}
