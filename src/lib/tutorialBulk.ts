import { unzip } from "fflate"
import { getTutorialFileRule, isTutorialScreen } from "@/lib/tutorialVideos"

/** One tutorial prepared from a bulk selection: a video and, when a picture has the same name, its thumbnail. */
export type BulkTutorialEntry = { key: string; video: File; poster: File | null; title: string }

export type BulkTutorialPlan = { entries: BulkTutorialEntry[]; ignored: { name: string; reason: "not_supported" | "too_big" | "no_video" }[] }

function baseName(name: string) {
  return name.replace(/\.[^.]+$/, "").trim()
}

/** "03_chat-de-la-liga" -> "Chat de la liga": the order prefix and separators do not belong in a title. */
export function titleFromFileName(name: string) {
  const cleaned = baseName(name).replace(/^\d+\s*[._)\-–]*\s*/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim()
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : baseName(name)
}

/**
 * Groups the chosen files by name: an MP4 plus an image with the same name (ignoring case and extension) become one
 * tutorial with its thumbnail. Entries come in natural file-name order, so numbering the files keeps the order.
 */
export function planBulkTutorials(files: File[]): BulkTutorialPlan {
  const ignored: BulkTutorialPlan["ignored"] = []
  const videos = new Map<string, File>()
  const posters = new Map<string, File>()
  for (const file of files) {
    const rule = getTutorialFileRule(file.type)
    if (!rule) { ignored.push({ name: file.name, reason: "not_supported" }); continue }
    if (file.size > rule.maxBytes) { ignored.push({ name: file.name, reason: "too_big" }); continue }
    const key = baseName(file.name).toLowerCase()
    if (rule.kind === "video") videos.set(key, file)
    else posters.set(key, file)
  }
  for (const [key, poster] of posters) if (!videos.has(key)) ignored.push({ name: poster.name, reason: "no_video" })
  const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" })
  const entries = [...videos.entries()]
    .sort(([a], [b]) => collator.compare(a, b))
    .map(([key, video]) => ({ key, video, poster: posters.get(key) ?? null, title: titleFromFileName(video.name) }))
  return { entries, ignored }
}

const ZIP_CONTENT_TYPES: Record<string, string> = { mp4: "video/mp4", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }
const MAX_ZIP_ENTRIES = 100

export function isZipFile(file: File) {
  return /.zip$/i.test(file.name) || file.type === "application/zip" || file.type === "application/x-zip-compressed"
}

/** Name and content type of an archive entry worth reading: videos and thumbnails, not folders, hidden or macOS metadata files. */
export function zipEntryInfo(path: string) {
  const parts = path.split("/")
  const name = parts[parts.length - 1] ?? ""
  if (!name || path.endsWith("/") || parts.some((part) => part.startsWith(".") || part === "__MACOSX")) return null
  if (isBulkManifestName(name)) return { name, type: "application/json" }
  const type = ZIP_CONTENT_TYPES[name.split(".").pop()?.toLowerCase() ?? ""]
  return type ? { name, type } : null
}

/** Unpacks a .zip in the browser into the same File objects the multiple-file picker would give. Folders are flattened. */
export function readZipFiles(zip: File): Promise<File[]> {
  return zip.arrayBuffer().then((buffer) => new Promise<File[]>((resolve, reject) => {
    const types = new Map<string, { name: string; type: string }>()
    let count = 0
    unzip(new Uint8Array(buffer), {
      filter: (entry) => {
        const info = zipEntryInfo(entry.name)
        const rule = info ? (info.type === "application/json" ? { maxBytes: MAX_MANIFEST_BYTES } : getTutorialFileRule(info.type)) : null
        if (!info || !rule || entry.originalSize > rule.maxBytes || count >= MAX_ZIP_ENTRIES) return false
        count += 1
        types.set(entry.name, info)
        return true
      },
    }, (error, files) => {
      if (error) { reject(error); return }
      resolve(Object.entries(files).flatMap(([path, bytes]) => {
        const info = types.get(path)
        return info ? [new File([bytes as BlobPart], info.name, { type: info.type })] : []
      }))
    })
  }))
}

const MAX_MANIFEST_BYTES = 256 * 1024

export type BulkDestination = "generic" | "leagues" | "social"
export type BulkAudience = "draft" | "public"

/** What the manifest says about one video; every field is optional and anything invalid is dropped with a warning. */
export type BulkManifestItem = {
  order: number
  title?: string
  description?: string
  poster?: string
  destination?: BulkDestination
  audience?: BulkAudience
  /** A screen id (see TUTORIAL_SCREENS); absent means a general video. */
  screen?: string
  leagueNames?: string[]
}
export type BulkManifestWarning = { reason: "bad_destination" | "bad_screen" | "bad_audience" | "no_file"; detail: string }
export type BulkManifest = { byFile: Map<string, BulkManifestItem>; warnings: BulkManifestWarning[] }

/** "manifest.json" or "manifest.txt" (any case): the file that describes the videos of a .zip. */
export function isBulkManifestName(name: string) {
  return /^manifest\.(json|txt)$/i.test(name)
}

const plain = (value: unknown) => String(value ?? "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

function destinationOf(value: unknown): BulkDestination | null {
  const word = plain(value)
  if (["generico", "genericos", "generic", "app", "aplicacion"].includes(word)) return "generic"
  if (["liga", "ligas", "league", "leagues"].includes(word)) return "leagues"
  if (["redes", "red", "social", "instagram", "redes sociales"].includes(word)) return "social"
  return null
}

function audienceOf(value: unknown): BulkAudience | null {
  const word = plain(value)
  if (["borrador", "draft", "privado"].includes(word)) return "draft"
  if (["publico", "public"].includes(word)) return "public"
  return null
}

/**
 * Reads the text of a manifest: {"destino": "...", "videos": [{ "archivo", "titulo", "descripcion", "miniatura",
 * "destino", "pantalla", "quien", "ligas" }]}. Returns null when it is not valid JSON of that shape.
 */
export function parseBulkManifest(text: string): BulkManifest | null {
  let data: unknown
  try { data = JSON.parse(text.replace(/^﻿/, "")) } catch { return null }
  const root = data as { destino?: unknown; quien?: unknown; videos?: unknown } | null
  const list = Array.isArray(data) ? data : root && typeof root === "object" ? root.videos : null
  if (!Array.isArray(list)) return null
  const warnings: BulkManifestWarning[] = []
  const common: { destination?: BulkDestination; audience?: BulkAudience } = {}
  if (root && !Array.isArray(root)) {
    if (root.destino !== undefined) { const d = destinationOf(root.destino); if (d) common.destination = d; else warnings.push({ reason: "bad_destination", detail: String(root.destino) }) }
    if (root.quien !== undefined) { const a = audienceOf(root.quien); if (a) common.audience = a; else warnings.push({ reason: "bad_audience", detail: String(root.quien) }) }
  }
  const byFile = new Map<string, BulkManifestItem>()
  list.forEach((raw, order) => {
    const item = raw as Record<string, unknown> | null
    const file = typeof item?.archivo === "string" ? item.archivo : ""
    if (!item || !file.trim()) return
    const out: BulkManifestItem = { order, ...common }
    if (typeof item.titulo === "string" && item.titulo.trim()) out.title = item.titulo.trim().slice(0, 120)
    if (typeof item.descripcion === "string" && item.descripcion.trim()) out.description = item.descripcion.trim().slice(0, 1000)
    if (typeof item.miniatura === "string" && item.miniatura.trim()) out.poster = item.miniatura.trim()
    if (item.destino !== undefined) { const d = destinationOf(item.destino); if (d) out.destination = d; else warnings.push({ reason: "bad_destination", detail: `${file}: ${String(item.destino)}` }) }
    if (item.quien !== undefined) { const a = audienceOf(item.quien); if (a) out.audience = a; else warnings.push({ reason: "bad_audience", detail: `${file}: ${String(item.quien)}` }) }
    if (item.pantalla !== undefined && item.pantalla !== null && String(item.pantalla).trim()) {
      const screen = String(item.pantalla).trim().toLowerCase()
      if (isTutorialScreen(screen)) out.screen = screen
      else warnings.push({ reason: "bad_screen", detail: `${file}: ${String(item.pantalla)}` })
    }
    const leagues = Array.isArray(item.ligas) ? item.ligas : typeof item.ligas === "string" ? [item.ligas] : []
    const names = leagues.map((name) => String(name).trim()).filter(Boolean)
    if (names.length) out.leagueNames = names
    byFile.set(baseName(file).toLowerCase(), out)
  })
  return { byFile, warnings }
}

export type BulkPlannedEntry = BulkTutorialEntry & { meta: BulkManifestItem | null }

/**
 * Joins the planned videos with their manifest data: the manifest order wins, a named thumbnail replaces the
 * same-name one and the title it gives replaces the file-name title. Manifest lines without a video are reported.
 */
export function applyBulkManifest(plan: BulkTutorialPlan, manifest: BulkManifest | null, files: File[]) {
  const warnings = [...(manifest?.warnings ?? [])]
  if (!manifest) return { entries: plan.entries.map((entry) => ({ ...entry, meta: null })) as BulkPlannedEntry[], warnings }
  const keys = new Set(plan.entries.map((entry) => entry.key))
  for (const [key, item] of manifest.byFile) if (!keys.has(key)) warnings.push({ reason: "no_file", detail: key + (item.title ? ` (${item.title})` : "") })
  const images = new Map(files.filter((file) => getTutorialFileRule(file.type)?.kind === "poster").map((file) => [file.name.toLowerCase(), file]))
  const entries = plan.entries.map((entry) => {
    const meta = manifest.byFile.get(entry.key) ?? null
    const poster = (meta?.poster && images.get(meta.poster.toLowerCase())) || entry.poster
    return { ...entry, poster, title: meta?.title ?? entry.title, meta }
  })
  const position = (entry: BulkPlannedEntry) => entry.meta?.order ?? Number.MAX_SAFE_INTEGER
  entries.sort((a, b) => position(a) - position(b))
  return { entries: entries as BulkPlannedEntry[], warnings }
}

/** League ids for the names a manifest gives (ignoring case and accents); the names that match no league come back apart. */
export function matchLeagueNames(names: string[], leagues: { id: string; name: string }[]) {
  const ids: string[] = []
  const unknown: string[] = []
  for (const name of names) {
    const found = leagues.find((league) => plain(league.name) === plain(name))
    if (found) { if (!ids.includes(found.id)) ids.push(found.id) } else unknown.push(name)
  }
  return { ids, unknown }
}
