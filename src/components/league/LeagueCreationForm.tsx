"use client"
import { useRef, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import type { League } from "@/data/fakeData"
import { ImageCropDialog } from "@/components/images/ImageCropDialog"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { readFileAsDataUrl, validateImageFile } from "@/lib/clientImages"
import { DEFAULT_LEAGUE_ACCENT, normalizeAccentColor } from "@/lib/visualStyle"

export function LeagueCreationForm({ initialLeague, onComplete, onBack }: {
  initialLeague?: League; onComplete?: () => void; onBack?: () => void
}) {
  const { tx, t } = useI18n()
  const router = useRouter()
  const { activateGrantedLeague } = useActiveLeague()
  const { canCreateLeagues, createLeague, updateLeagueDetails, updateLeagueLogo, updateLeagueAccentColor } = useLeagueAccess()
  const created = useRef<League | null>(initialLeague ?? null)
  const [name, setName] = useState(initialLeague?.name ?? "")
  const [description, setDescription] = useState(initialLeague?.description ?? "")
  const [recommendations, setRecommendations] = useState(initialLeague?.recommendations ?? "")
  const [modality, setModality] = useState<"individual" | "fixed_pairs">(initialLeague?.modality ?? "individual")
  const [accent, setAccent] = useState(normalizeAccentColor(initialLeague?.accentColor ?? DEFAULT_LEAGUE_ACCENT))
  const [logo, setLogo] = useState<string | null>(initialLeague?.logoUrl ?? null)
  const [crop, setCrop] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [identitySaved, setIdentitySaved] = useState(Boolean(initialLeague))
  const [error, setError] = useState<string | null>(null)
  const submitLock = useRef(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || submitLock.current) return
    submitLock.current = true; setSaving(true); setError(null)
    try {
      let league = created.current
      if (!league) {
        league = await createLeague({ name: name.trim(), description: description.trim() || t.newLeague.defaultDescription, recommendations: recommendations.trim(), modality, accentColor: accent, locations: [] })
        if (!league) throw new Error(t.newLeague.createError)
        created.current = league; setIdentitySaved(true)
      } else {
        if (!await updateLeagueDetails(league.id, { name, description, recommendations })) throw new Error(tx("No se han podido guardar los datos de la liga."))
        if (accent !== normalizeAccentColor(league.accentColor ?? DEFAULT_LEAGUE_ACCENT) && !await updateLeagueAccentColor(league.id, accent)) throw new Error(tx("No se ha podido guardar el color de la liga."))
      }
      if (logo !== (league.logoUrl ?? null) && !await updateLeagueLogo(league.id, logo)) throw new Error(tx("La liga está guardada, pero falta guardar el logo. Vuelve a intentarlo."))
      if (onComplete) onComplete()
      else { activateGrantedLeague(league.id, "/admin/season"); router.replace("/admin/season") }
    } catch (cause) { setError(cause instanceof Error ? cause.message : t.newLeague.createError) }
    finally { submitLock.current = false; setSaving(false) }
  }
  if (!initialLeague && !canCreateLeagues) return <AppCard><p className="font-bold">{tx("No tienes permisos para crear ligas")}</p><BackButton fallbackHref="/leagues/all" label={tx("Atrás")} /></AppCard>
  return <div className="space-y-3" data-league-creation>
    <header className="app-page-header">{onBack ? <button type="button" disabled={saving} onClick={onBack} className="app-top-back-control flex min-h-11 items-center gap-2">← {tx("Atrás")}</button> : <BackButton fallbackHref="/leagues/all" label={tx("Atrás")} />}<h1 className="type-page-title mt-2 text-xl font-black">{initialLeague ? tx("Datos de la liga") : t.newLeague.title}</h1></header>
    <p className="text-xs font-semibold text-neutral-500">{tx("Liga · Temporada · Resumen")}</p>
    <form onSubmit={submit} className="space-y-3">
      <AppCard className="space-y-4">
        <label className="block"><span className="text-sm font-bold">{t.newLeague.leagueName}</span><input autoComplete="off" maxLength={120} required value={name} disabled={saving} onChange={e => setName(e.target.value)} placeholder={t.newLeague.leagueNamePlaceholder} className="league-creation-input mt-2" /></label>
        <label className="block"><span className="text-sm font-bold">{tx("Modalidad de liga")}</span><select aria-label={tx("Modalidad de liga")} value={modality} disabled={saving || identitySaved} onChange={e => setModality(e.target.value as typeof modality)} className="league-creation-input mt-2">
          <option value="individual">{tx("Individual de Smash & Lob")}</option><option value="fixed_pairs">{tx("Por parejas fijas")}</option>
        </select><span className="mt-2 block text-xs leading-5 text-neutral-500">{modality === "individual" ? tx("Cada jugador compite individualmente y cambia de compañero a lo largo de la temporada.") : tx("De 2 a 16 parejas. Cada pareja mantiene sus jugadores y compite en una clasificación conjunta durante la temporada.")}</span>
          <span className="mt-1 block text-xs text-neutral-500">{tx("La modalidad queda fijada al crear la liga.")}</span>
        </label>
        <label className="block"><span className="text-sm font-bold">{t.newLeague.leagueDescription} <span className="font-normal text-neutral-500">({tx("Opcional")})</span></span><textarea rows={2} maxLength={2000} value={description} disabled={saving} onChange={e => setDescription(e.target.value)} placeholder={t.newLeague.leagueDescriptionPlaceholder} className="league-creation-input mt-2 resize-none" /></label>
      </AppCard>
      <details className="league-creation-details"><summary>{tx("Personalizar liga")}<span className="text-xs font-normal text-neutral-500">{tx("Logo, color e indicaciones")}</span></summary><div className="space-y-4 p-3 pt-0">
        <div className="flex items-center gap-3"><LeagueLogo league={{ name: name || t.newLeague.title, logoUrl: logo }} size="lg" /><div className="min-w-0 flex-1"><label className="league-creation-secondary cursor-pointer">{tx("Subir logo")}<input type="file" accept="image/*" className="sr-only" disabled={saving} onChange={async e => {
          const file = e.target.files?.[0]; e.target.value = ""; if (!file) return
          try { validateImageFile(file); setError(null); setCrop(await readFileAsDataUrl(file)) } catch (cause) { setError(cause instanceof Error ? cause.message : tx("No se ha podido procesar la imagen.")) }
        }} /></label>{logo ? <button type="button" disabled={saving} className="mt-2 text-xs font-semibold text-red-600" onClick={() => setLogo(null)}>{tx("Quitar logo")}</button> : <p className="mt-2 text-xs text-neutral-500">{tx("Se usan iniciales si no hay logo.")}</p>}</div></div>
        <label className="flex items-center justify-between gap-3 text-sm font-bold">{t.settings.leagueAccentColor}<input type="color" value={accent} disabled={saving} onChange={e => setAccent(normalizeAccentColor(e.target.value))} className="h-10 w-14 rounded-lg border border-neutral-200 bg-transparent p-1" /></label>
        <label className="block"><span className="text-sm font-bold">{tx("Recomendaciones de la liga")}</span><textarea rows={2} maxLength={4000} value={recommendations} disabled={saving} onChange={e => setRecommendations(e.target.value)} placeholder={tx("Bolas recomendadas, pistas habituales, equipamiento o normas prácticas para jugar la liga.")} className="league-creation-input mt-2 resize-none" /></label>
      </div></details>
      {error ? <p role="alert" className="text-sm font-semibold text-red-600">{tx(error)}</p> : null}
      <div className="league-creation-footer"><div>{onBack ? <button type="button" disabled={saving} onClick={onBack} className="league-creation-secondary">{tx("Atrás")}</button> : <BackButton fallbackHref="/leagues/all" label={tx("Atrás")} />}</div><button type="submit" disabled={saving || !name.trim()} className="league-creation-primary">{saving ? tx("Guardando...") : initialLeague ? tx("Siguiente paso") : tx("Crear liga y continuar")}</button></div>
      <p className="text-center text-xs text-neutral-500">{tx("Después prepararás la primera temporada. La liga no comenzará todavía.")}</p>
    </form>
    {crop ? <ImageCropDialog src={crop} title={tx("Recortar logo de la liga")} description={tx("Ajusta el encuadre. Los PNG transparentes conservarán el fondo transparente.")} shape="square" outputSize={512} outputType="auto" maxOutputBytes={512 * 1024} onCancel={() => setCrop(null)} onConfirm={async data => { setLogo(data); setCrop(null); return true }} /> : null}
  </div>
}
