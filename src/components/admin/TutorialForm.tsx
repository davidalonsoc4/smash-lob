"use client"

import { useState, type ChangeEvent } from "react"
import { inspectMp4, moveMoovToFront } from "@/lib/mp4"
import { extractVideoPoster } from "@/lib/videoPoster"
import { TUTORIAL_FILE_ACCEPT, TUTORIAL_SCREENS, getTutorialFileRule, type TutorialAudience } from "@/lib/tutorialVideos"
import { createTutorial, fromLocalInputValue, toLocalInputValue, updateTutorial, uploadTutorialFile, type TutorialDraft, type TutorialLeagueOption, type TutorialSaveResult } from "@/lib/tutorialVideosClient"
import { applyBulkManifest, isBulkManifestName, isZipFile, matchLeagueNames, parseBulkManifest, planBulkTutorials, readZipFiles, type BulkAudience, type BulkDestination, type BulkRole, type BulkManifestWarning, type BulkTutorialEntry, type BulkTutorialPlan } from "@/lib/tutorialBulk"
import { useI18n } from "@/i18n/I18nProvider"

type Picked = { file: File; poster: Blob | null; width: number | null; height: number | null; durationMs: number | null }

/** Create (with a video) or edit (text, audience and leagues) a tutorial. */
export function TutorialForm({ editingId, initial, leagues, announcedLeagueIds = [], onDone, onCancel }: {
  editingId: string | null
  initial: TutorialDraft
  leagues: TutorialLeagueOption[]
  /** Leagues that already got the notice in their chat: they are never announced twice. */
  announcedLeagueIds?: string[]
  onDone: () => void
  onCancel: () => void
}) {
  const { tx } = useI18n()
  const [draft, setDraft] = useState<TutorialDraft>(initial)
  const [picked, setPicked] = useState<Picked | null>(null)
  const [customPoster, setCustomPoster] = useState<File | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [announce, setAnnounce] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)
  const social = draft.category === "social"
  const pendingLeagues = !social && draft.role === "player" && draft.audience === "leagues" ? draft.leagueIds.filter((id) => !announcedLeagueIds.includes(id)) : []
  const wantsAnnouncement = announce && pendingLeagues.length > 0

  /** Closes the form, unless some league could not be notified: then the admin must see which one. */
  function finish(result: TutorialSaveResult) {
    const skipped = result.announcement?.skipped ?? []
    if (!skipped.length) { onDone(); return }
    const names = skipped.map((item) => item.leagueName).join(", ")
    setNotice(`${tx("Guardado, pero no se ha publicado el aviso en el chat de:")} ${names}. ${tx("Comprueba que la liga tenga una temporada en curso o sin comenzar.")}`)
  }

  const valid = draft.title.trim().length > 0 && (editingId !== null || picked !== null) && (social || draft.audience !== "leagues" || draft.leagueIds.length > 0)

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    const rule = getTutorialFileRule(file.type)
    if (!rule || rule.kind !== "video" || file.size > rule.maxBytes) {
      setError(tx("Solo se admiten vídeos MP4 de hasta 50 MB."))
      return
    }
    setError(null)
    let prepared = file
    const info = await inspectMp4(file).catch(() => null)
    if (info && !info.faststart && !info.fragmented) {
      const moved = await moveMoovToFront(file).catch(() => null)
      if (moved) prepared = new File([moved], file.name, { type: "video/mp4" })
    }
    const poster = await extractVideoPoster(prepared)
    setPicked({ file: prepared, poster: poster?.blob ?? null, width: poster?.width ?? null, height: poster?.height ?? null, durationMs: poster?.durationMs ?? null })
    if (!draft.title.trim()) setDraft((current) => ({ ...current, title: file.name.replace(/\.mp4$/i, "").replace(/[_-]+/g, " ").trim() }))
  }

  function pickPoster(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    const rule = getTutorialFileRule(file.type)
    if (!rule || rule.kind !== "poster" || file.size > rule.maxBytes) {
      setError(tx("La miniatura debe ser una imagen JPG, PNG o WebP de hasta 5 MB."))
      return
    }
    setError(null)
    setCustomPoster(file)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    const fields = { ...draft, title: draft.title.trim(), description: draft.description.trim(), publishAt: social || draft.audience === "draft" ? null : draft.publishAt, ...(social ? { audience: "draft" as const, leagueIds: [], screen: null } : {}) }
    if (editingId) {
      const newPosterPath = customPoster ? await uploadTutorialFile(customPoster, customPoster.type) : null
      if (customPoster && !newPosterPath) { setBusy(false); setError(tx("No se ha podido subir la miniatura.")); return }
      const saved = await updateTutorial(editingId, { ...fields, ...(newPosterPath ? { posterPath: newPosterPath } : {}), announce: wantsAnnouncement })
      setBusy(false)
      if (saved.ok) finish(saved)
      else setError(tx("No se ha podido guardar."))
      return
    }
    if (!picked) return
    const videoPath = await uploadTutorialFile(picked.file, "video/mp4", setProgress)
    if (!videoPath) { setBusy(false); setProgress(null); setError(tx("No se ha podido subir el vídeo. Revisa la conexión.")); return }
    // A thumbnail chosen by hand wins over the frame taken automatically from the video.
    const posterPath = customPoster
      ? await uploadTutorialFile(customPoster, customPoster.type)
      : picked.poster ? await uploadTutorialFile(picked.poster, "image/jpeg") : null
    const created = await createTutorial({ ...fields, videoPath, posterPath, width: picked.width, height: picked.height, durationMs: picked.durationMs, announce: wantsAnnouncement })
    setBusy(false)
    setProgress(null)
    if (created.ok) finish(created)
    else setError(tx("No se ha podido guardar el tutorial."))
  }

  const audiences: { value: TutorialAudience; label: string; hint: string }[] = [
    { value: "draft", label: tx("Borrador"), hint: tx("Solo lo ves tú. No lo ve nadie más.") },
    { value: "public", label: tx("Público"), hint: tx("Lo ve cualquier persona con sesión en la app.") },
    { value: "leagues", label: tx("Solo ligas elegidas"), hint: tx("Solo lo ven los miembros de las ligas que marques.") },
  ]
  const toggleLeague = (id: string) => setDraft((current) => ({ ...current, leagueIds: current.leagueIds.includes(id) ? current.leagueIds.filter((item) => item !== id) : [...current.leagueIds, id] }))

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div className="flex items-center gap-2" data-dialog-sticky-header>
        <h2 className="min-w-0 flex-1 truncate font-bold">{editingId ? tx("Editar tutorial") : tx("Nuevo tutorial")}</h2>
        <button type="submit" disabled={!valid || busy} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 px-4 text-center text-sm font-bold text-white disabled:opacity-40">
          {busy ? tx("Guardando…") : tx("Guardar")}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full px-3 text-sm font-bold">{tx("Cancelar")}</button>
      </div>
      {!editingId ? (
        <label className="block text-xs font-semibold text-neutral-600">
          {tx("Vídeo (MP4, hasta 50 MB)")}
          <input type="file" accept={TUTORIAL_FILE_ACCEPT} disabled={busy} onChange={pick} className="mt-1 block w-full text-sm" />
          {picked ? <span className="mt-1 block text-xs font-bold text-neutral-700">{picked.file.name} · {(picked.file.size / 1048576).toFixed(1)} MB</span> : null}
        </label>
      ) : null}
      <label className="block text-xs font-semibold text-neutral-600">
        {tx("Miniatura (opcional)")}
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={pickPoster} className="mt-1 block w-full text-sm" />
        <span className="mt-1 block text-xs font-semibold text-neutral-600">
          {customPoster ? `${customPoster.name} · ${(customPoster.size / 1048576).toFixed(1)} MB` : editingId ? tx("Si no eliges una, se mantiene la actual.") : tx("Si no eliges una, se usa un fotograma del vídeo.")}
        </span>
      </label>
      <label className="block text-xs font-semibold text-neutral-600">
        {tx("Título")}
        <input value={draft.title} maxLength={120} disabled={busy} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="mt-1 w-full rounded-lg border border-neutral-400 px-2.5 py-1.5 text-base text-neutral-950" />
      </label>
      <label className="block text-xs font-semibold text-neutral-600">
        {tx("Descripción")}
        <textarea value={draft.description} rows={2} maxLength={500} disabled={busy} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="mt-1 w-full rounded-lg border border-neutral-400 p-2 text-base text-neutral-950" />
      </label>
      <label className="block text-xs font-semibold text-neutral-600">
        {tx("Tipo de vídeo")}
        <select value={draft.category} disabled={busy} onChange={(event) => setDraft({ ...draft, category: event.target.value === "social" ? "social" : "app" })} className="mt-1 w-full rounded-lg border border-neutral-400 px-2.5 py-1.5 text-base text-neutral-950">
          <option value="app">{tx("Tutorial de la aplicación")}</option>
          <option value="social">{tx("Redes sociales (solo lo ves tú)")}</option>
        </select>
      </label>
      {social ? null : <>
      <label className="block text-xs font-semibold text-neutral-600">
        {tx("Pantalla del vídeo (opcional)")}
        <select value={draft.screen ?? ""} disabled={busy} onChange={(event) => setDraft({ ...draft, screen: event.target.value || null })} className="mt-1 w-full rounded-lg border border-neutral-400 px-2.5 py-1.5 text-base text-neutral-950">
          <option value="">{tx("Vídeo general (sin pantalla)")}</option>
          {TUTORIAL_SCREENS.map((screen) => <option key={screen.id} value={screen.id}>{tx(screen.label)}</option>)}
        </select>
        <span className="mt-1 block text-xs font-semibold text-neutral-600">{tx("Si eliges una pantalla, su botón de ayuda ofrecerá este vídeo.")}</span>
      </label>
      <label className="block text-xs font-semibold text-neutral-600">
        {tx("Rol al que va dirigido")}
        <select value={draft.role} disabled={busy} onChange={(event) => setDraft({ ...draft, role: event.target.value === "creator" ? "creator" : "player" })} className="mt-1 w-full rounded-lg border border-neutral-400 px-2.5 py-1.5 text-base text-neutral-950">
          <option value="player">{tx("Jugador (todo el mundo)")}</option>
          <option value="creator">{tx("Creator (solo quien organiza la liga)")}</option>
        </select>
        <span className="mt-1 block text-xs font-semibold text-neutral-600">{tx("Los de Creator no los ven los jugadores ni se avisa en el chat de la liga.")}</span>
      </label>
      <fieldset className="space-y-1.5" disabled={busy}>
        <legend className="text-xs font-semibold text-neutral-600">{tx("¿Quién lo ve?")}</legend>
        {audiences.map((option) => (
          <label key={option.value} className="flex items-start gap-2 rounded-xl bg-neutral-100 p-2">
            <input type="radio" name="tutorial-audience" checked={draft.audience === option.value} onChange={() => setDraft({ ...draft, audience: option.value })} className="mt-1" />
            <span><span className="block text-sm font-black text-neutral-950">{option.label}</span><span className="block text-xs font-semibold text-neutral-600">{option.hint}</span></span>
          </label>
        ))}
      </fieldset>
      {draft.audience === "leagues" ? (
        <fieldset className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-neutral-300 p-2" disabled={busy}>
          <legend className="px-1 text-xs font-semibold text-neutral-600">{tx("Ligas")}</legend>
          {leagues.map((league) => (
            <label key={league.id} className="flex items-center gap-2 py-1 text-sm font-semibold text-neutral-950">
              <input type="checkbox" checked={draft.leagueIds.includes(league.id)} onChange={() => toggleLeague(league.id)} />
              <span className="min-w-0 truncate">{league.name}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
      {draft.audience !== "draft" ? (
        <label className="block text-xs font-semibold text-neutral-600">
          {tx("Programar publicación (opcional)")}
          <div className="mt-1 flex items-center gap-2">
            <input type="datetime-local" data-tutorial-publish-at value={toLocalInputValue(draft.publishAt)} disabled={busy}
              onChange={(event) => setDraft({ ...draft, publishAt: fromLocalInputValue(event.target.value) })}
              className="min-w-0 flex-1 rounded-lg border border-neutral-400 px-2.5 py-1.5 text-base text-neutral-950" />
            {draft.publishAt ? <button type="button" disabled={busy} onClick={() => setDraft({ ...draft, publishAt: null })} className="shrink-0 rounded-full px-3 py-1.5 text-sm font-bold">{tx("Quitar")}</button> : null}
          </div>
          <span className="mt-1 block text-xs font-semibold text-neutral-600">{tx("Hasta esa fecha nadie más lo verá. Se publica poco después de la hora indicada, no al minuto exacto.")}</span>
        </label>
      ) : null}
      {pendingLeagues.length > 0 ? (
        <label className="flex items-start gap-2 rounded-xl bg-neutral-100 p-2">
          <input type="checkbox" checked={announce} disabled={busy} onChange={(event) => setAnnounce(event.target.checked)} className="mt-1" />
          <span className="min-w-0 text-xs font-bold leading-snug text-neutral-950"><span className="block text-sm font-black">{tx("Avisar en el chat de la liga")}</span><span className="block font-semibold text-neutral-600">{tx("Publica una Novedad firmada por la liga y avisa a todos sus participantes. Solo se avisa una vez a cada liga.")}</span></span>
        </label>
      ) : null}
      </>}
      {progress !== null ? <div role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-neutral-200"><div className="h-full bg-neutral-950" style={{ width: `${Math.round(progress * 100)}%` }} /></div> : null}
      {error ? <p role="alert" className="text-xs font-bold text-red-700">{error}</p> : null}
      {notice ? (
        <div role="status" className="space-y-2 rounded-xl bg-amber-100 p-2 text-xs font-bold text-amber-950">
          <p>{notice}</p>
          <button type="button" onClick={onDone} className="inline-flex min-h-9 items-center justify-center rounded-full bg-neutral-950 px-4 text-center text-sm font-bold text-white">{tx("Entendido")}</button>
        </div>
      ) : null}
    </form>
  )
}

/** Fields set by the manifest of a .zip win over the general choices of the form for that video. */
type BulkRow = BulkTutorialEntry & {
  screen: string; description: string; state: "pending" | "uploading" | "done" | "failed"; progress: number
  destination?: BulkDestination; audience?: BulkAudience; role?: BulkRole; leagueIds?: string[]; unknownLeagues?: string[]
}

/**
 * Uploads many tutorials at once: pick the files (or a .zip with them), say where they go, check the titles,
 * and each video is uploaded and recorded in turn together with the thumbnail that has the same name.
 */
export function TutorialBulkForm({ leagues, onDone, onCancel }: { leagues: TutorialLeagueOption[]; onDone: () => void; onCancel: () => void }) {
  const { tx } = useI18n()
  const [rows, setRows] = useState<BulkRow[]>([])
  const [ignored, setIgnored] = useState<BulkTutorialPlan["ignored"]>([])
  const [destination, setDestination] = useState<BulkDestination>("generic")
  const [audience, setAudience] = useState<"draft" | "public">("draft")
  const [leagueIds, setLeagueIds] = useState<string[]>([])
  const [role, setRole] = useState<BulkRole>("player")
  const [busy, setBusy] = useState(false)
  const [reading, setReading] = useState(false)
  const [zipError, setZipError] = useState(false)
  const [manifestError, setManifestError] = useState(false)
  const [warnings, setWarnings] = useState<BulkManifestWarning[]>([])
  const where = (row: BulkRow) => ({ destination: row.destination ?? destination, audience: row.audience ?? audience, role: row.role ?? role, leagueIds: row.leagueIds ?? leagueIds })

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? [])
    event.target.value = ""
    if (!chosen.length) return
    setZipError(false)
    setReading(true)
    const files: File[] = []
    for (const file of chosen) {
      if (!isZipFile(file)) { files.push(file); continue }
      try { files.push(...(await readZipFiles(file))) } catch { setZipError(true) }
    }
    const manifestFile = files.find((file) => isBulkManifestName(file.name))
    const manifest = manifestFile ? parseBulkManifest(await manifestFile.text().catch(() => "")) : null
    setManifestError(Boolean(manifestFile) && !manifest)
    setReading(false)
    const plan = planBulkTutorials(files.filter((file) => !isBulkManifestName(file.name)))
    const applied = applyBulkManifest(plan, manifest, files)
    setIgnored(plan.ignored)
    setWarnings(applied.warnings)
    setRows(applied.entries.map(({ meta, ...entry }) => {
      const matched = meta?.leagueNames ? matchLeagueNames(meta.leagueNames, leagues) : null
      return {
        ...entry, screen: meta?.screen ?? "", description: meta?.description ?? "", state: "pending", progress: 0,
        destination: meta?.destination, audience: meta?.audience, role: meta?.role,
        leagueIds: matched ? matched.ids : undefined, unknownLeagues: matched?.unknown.length ? matched.unknown : undefined,
      }
    }))
  }
  const patch = (key: string, change: Partial<BulkRow>) => setRows((current) => current.map((row) => (row.key === key ? { ...row, ...change } : row)))
  const toggleLeague = (id: string) => setLeagueIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))

  async function uploadRow(row: BulkRow) {
    patch(row.key, { state: "uploading", progress: 0 })
    let video = row.video
    const info = await inspectMp4(video).catch(() => null)
    if (info && !info.faststart && !info.fragmented) {
      const moved = await moveMoovToFront(video).catch(() => null)
      if (moved) video = new File([moved], video.name, { type: "video/mp4" })
    }
    const frame = await extractVideoPoster(video)
    const videoPath = await uploadTutorialFile(video, "video/mp4", (fraction) => patch(row.key, { progress: fraction }))
    if (!videoPath) return false
    const posterPath = row.poster ? await uploadTutorialFile(row.poster, row.poster.type) : frame?.blob ? await uploadTutorialFile(frame.blob, "image/jpeg") : null
    const target = where(row)
    const created = await createTutorial({
      title: row.title.trim(), description: row.description, publishAt: null,
      audience: target.destination === "leagues" ? "leagues" : target.destination === "social" ? "draft" : target.audience,
      leagueIds: target.destination === "leagues" ? target.leagueIds : [],
      category: target.destination === "social" ? "social" : "app",
      role: target.destination === "social" ? "player" : target.role,
      screen: target.destination === "generic" ? row.screen || null : null,
      videoPath, posterPath, width: frame?.width ?? null, height: frame?.height ?? null, durationMs: frame?.durationMs ?? null, announce: false,
    })
    return created.ok
  }

  async function run() {
    if (busy) return
    setBusy(true)
    // One at a time and in order: every tutorial is added after the previous one, so the order of the files is kept.
    for (const row of rows) {
      if (row.state === "done") continue
      const ok = await uploadRow(row).catch(() => false)
      patch(row.key, { state: ok ? "done" : "failed", progress: ok ? 1 : 0 })
    }
    setBusy(false)
  }

  const pending = rows.filter((row) => row.state !== "done").length
  const allDone = rows.length > 0 && pending === 0
  const valid = rows.length > 0 && rows.every((row) => row.title.trim().length > 0 && (where(row).destination !== "leagues" || where(row).leagueIds.length > 0))
  const reasons = { not_supported: tx("formato no admitido"), too_big: tx("archivo demasiado grande"), no_video: tx("imagen sin vídeo con el mismo nombre") }
  const warningLabels = { bad_destination: tx("destino no válido"), bad_screen: tx("pantalla no válida"), bad_audience: tx("«quien» no válido"), bad_role: tx("«rol» no válido"), no_file: tx("el manifest cita un archivo que no está") }
  const stateLabel = { pending: tx("Pendiente"), uploading: tx("Subiendo…"), done: tx("Subido"), failed: tx("Ha fallado: vuelve a pulsar Subir") }
  const destinations: { value: BulkDestination; label: string; hint: string }[] = [
    { value: "generic", label: tx("Genéricos"), hint: tx("Tutoriales de la aplicación para todo el mundo.") },
    { value: "leagues", label: tx("Ligas"), hint: tx("Solo los ven los miembros de las ligas que marques.") },
    { value: "social", label: tx("Redes sociales"), hint: tx("Material para redes. Solo lo ves tú.") },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2" data-dialog-sticky-header>
        <h2 className="min-w-0 flex-1 truncate font-bold">{tx("Subir varios vídeos")}</h2>
        {allDone ? (
          <button type="button" onClick={onDone} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 px-4 text-center text-sm font-bold text-white">{tx("Listo")}</button>
        ) : (
          <>
            <button type="button" data-bulk-upload onClick={() => void run()} disabled={!valid || busy} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 px-4 text-center text-sm font-bold text-white disabled:opacity-40">
              {busy ? tx("Subiendo…") : `${tx("Subir")} (${pending})`}
            </button>
            <button type="button" onClick={onCancel} disabled={busy} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full px-3 text-sm font-bold">{tx("Cancelar")}</button>
          </>
        )}
      </div>
      {!rows.length ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-neutral-600">{tx("Elige los vídeos MP4 y, si quieres, sus miniaturas con el mismo nombre (JPG, PNG o WebP), o un archivo .zip que los contenga.")}</p>
          <label className="flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-neutral-950 px-4 text-center text-sm font-black text-white focus-within:ring-2 focus-within:ring-neutral-950 focus-within:ring-offset-2 aria-disabled:opacity-40" aria-disabled={reading}>
            {tx("Elegir vídeos e imágenes")}
            <input type="file" multiple data-bulk-files accept="video/mp4,image/jpeg,image/png,image/webp,.json,.txt,application/json,text/plain" disabled={reading} onChange={(event) => void choose(event)} className="sr-only" />
          </label>
          <label className="flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-neutral-100 px-4 text-center text-sm font-black text-neutral-950 focus-within:ring-2 focus-within:ring-neutral-950 focus-within:ring-offset-2 aria-disabled:opacity-40" aria-disabled={reading}>
            {tx("Elegir un archivo .zip")}
            <input type="file" data-bulk-zip accept=".zip,application/zip,application/x-zip-compressed" disabled={reading} onChange={(event) => void choose(event)} className="sr-only" />
          </label>
          {reading ? <p className="text-xs font-bold text-neutral-700">{tx("Leyendo el archivo…")}</p> : null}
        </div>
      ) : null}
      {zipError ? <p role="alert" className="text-xs font-bold text-red-700">{tx("No se ha podido leer el .zip. Comprueba que no esté dañado.")}</p> : null}
      {manifestError ? <p role="alert" className="text-xs font-bold text-red-700">{tx("No se ha podido leer el manifest.json. Revisa que sea un JSON válido; se usan los ajustes de abajo.")}</p> : null}
      {rows.some((row) => row.destination) ? <p role="status" className="text-xs font-bold text-emerald-800">{tx("Se han aplicado los datos del manifest. Revisa cada vídeo antes de subir.")}</p> : null}
      {rows.length && rows.some((row) => !row.destination) ? (
        <>
          <fieldset className="space-y-1.5" disabled={busy}>
            <legend className="text-xs font-semibold text-neutral-600">{tx("¿Dónde van?")}</legend>
            {destinations.map((option) => (
              <label key={option.value} className="flex items-start gap-2 rounded-xl bg-neutral-100 p-2">
                <input type="radio" name="bulk-destination" checked={destination === option.value} onChange={() => setDestination(option.value)} className="mt-1" />
                <span><span className="block text-sm font-black text-neutral-950">{option.label}</span><span className="block text-xs font-semibold text-neutral-600">{option.hint}</span></span>
              </label>
            ))}
          </fieldset>
          {destination !== "social" ? (
            <fieldset className="space-y-1.5" disabled={busy}>
              <legend className="text-xs font-semibold text-neutral-600">{tx("Rol al que van dirigidos")}</legend>
              {(["player", "creator"] as const).map((value) => (
                <label key={value} className="flex items-center gap-2 rounded-xl bg-neutral-100 p-2 text-sm font-black text-neutral-950">
                  <input type="radio" name="bulk-role" checked={role === value} onChange={() => setRole(value)} />
                  {value === "player" ? tx("Jugador (todo el mundo)") : tx("Creator (solo quien organiza la liga)")}
                </label>
              ))}
            </fieldset>
          ) : null}
          {destination === "generic" ? (
            <fieldset className="space-y-1.5" disabled={busy}>
              <legend className="text-xs font-semibold text-neutral-600">{tx("¿Quién los ve?")}</legend>
              {(["draft", "public"] as const).map((value) => (
                <label key={value} className="flex items-center gap-2 rounded-xl bg-neutral-100 p-2 text-sm font-black text-neutral-950">
                  <input type="radio" name="bulk-audience" checked={audience === value} onChange={() => setAudience(value)} />
                  {value === "draft" ? tx("Borrador (solo tú; los publicas después)") : tx("Público (cualquier persona con sesión)")}
                </label>
              ))}
            </fieldset>
          ) : null}
          {destination === "leagues" ? (
            <fieldset className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-neutral-300 p-2" disabled={busy}>
              <legend className="px-1 text-xs font-semibold text-neutral-600">{tx("Ligas")}</legend>
              {leagues.map((league) => (
                <label key={league.id} className="flex items-center gap-2 py-1 text-sm font-semibold text-neutral-950">
                  <input type="checkbox" checked={leagueIds.includes(league.id)} onChange={() => toggleLeague(league.id)} />
                  <span className="min-w-0 truncate">{league.name}</span>
                </label>
              ))}
            </fieldset>
          ) : null}
        </>
      ) : null}
      {rows.map((row) => (
        <div key={row.key} data-bulk-row className="space-y-1.5 rounded-xl border border-neutral-300 p-2">
          <p className="truncate text-xs font-semibold text-neutral-600">{row.video.name}{row.poster ? ` + ${row.poster.name}` : ""}</p>
          <input value={row.title} maxLength={120} disabled={busy || row.state === "done"} onChange={(event) => patch(row.key, { title: event.target.value })} aria-label={tx("Título")} className="w-full rounded-lg border border-neutral-400 px-2.5 py-1.5 text-base text-neutral-950" />
          {row.role === "creator" || (!row.role && role === "creator" && where(row).destination !== "social") ? <p className="text-xs font-black text-amber-800">{tx("Rol: Creator")}</p> : null}
          {row.destination ? <p className="text-xs font-black text-neutral-950">{destinations.find((option) => option.value === row.destination)?.label}{row.destination === "generic" ? ` · ${row.audience === "public" ? tx("Público") : tx("Borrador")}` : ""}{row.destination === "leagues" ? `: ${leagues.filter((league) => row.leagueIds?.includes(league.id)).map((league) => league.name).join(", ") || tx("sin liga")}` : ""}</p> : null}
          {row.unknownLeagues ? <p role="alert" className="text-xs font-bold text-red-700">{tx("Liga no encontrada:")} {row.unknownLeagues.join(", ")}</p> : null}
          {where(row).destination === "generic" ? (
            <select value={row.screen} disabled={busy || row.state === "done"} onChange={(event) => patch(row.key, { screen: event.target.value })} aria-label={tx("Pantalla del vídeo (opcional)")} className="w-full rounded-lg border border-neutral-400 px-2.5 py-1.5 text-base text-neutral-950">
              <option value="">{tx("Vídeo general (sin pantalla)")}</option>
              {TUTORIAL_SCREENS.map((screen) => <option key={screen.id} value={screen.id}>{tx(screen.label)}</option>)}
            </select>
          ) : null}
          <p className={`text-xs font-bold ${row.state === "failed" ? "text-red-700" : "text-neutral-700"}`}>
            {stateLabel[row.state]}{row.state === "uploading" ? ` ${Math.round(row.progress * 100)}%` : ""}
          </p>
        </div>
      ))}
      {warnings.length ? (
        <div role="status" className="space-y-1 rounded-xl bg-amber-100 p-2 text-xs font-bold text-amber-950">
          <p>{tx("Avisos del manifest:")}</p>
          {warnings.map((item, index) => <p key={index} className="font-semibold">{warningLabels[item.reason]}: {item.detail}</p>)}
        </div>
      ) : null}
      {ignored.length ? (
        <div role="status" className="space-y-1 rounded-xl bg-amber-100 p-2 text-xs font-bold text-amber-950">
          <p>{tx("No se usarán estos archivos:")}</p>
          {ignored.map((item) => <p key={item.name} className="font-semibold">{item.name}: {reasons[item.reason]}</p>)}
        </div>
      ) : null}
    </div>
  )
}
