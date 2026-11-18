import type { TutorialAdminItem, TutorialSummary } from "@/lib/tutorialVideos"

export type TutorialLeagueOption = { id: string; name: string }

async function readJson<T>(response: Response | null): Promise<T | null> {
  if (!response?.ok) return null
  return (await response.json().catch(() => null)) as T | null
}

export async function fetchTutorials() {
  const data = await readJson<{ tutorials: TutorialSummary[] }>(await fetch("/api/tutorials", { cache: "no-store" }).catch(() => null))
  return data?.tutorials ?? null
}

export async function fetchTutorialVideoUrl(tutorialId: string) {
  const data = await readJson<{ videoUrl: string }>(await fetch(`/api/tutorials/${encodeURIComponent(tutorialId)}`, { cache: "no-store" }).catch(() => null))
  return data?.videoUrl ?? null
}

export async function markTutorialSeen(tutorialId: string) {
  await fetch(`/api/tutorials/${encodeURIComponent(tutorialId)}/view`, { method: "POST" }).catch(() => null)
}

export async function fetchAdminTutorials() {
  return readJson<{ tutorials: TutorialAdminItem[]; leagues: TutorialLeagueOption[] }>(
    await fetch("/api/application-admin/tutorials", { cache: "no-store" }).catch(() => null),
  )
}

function putWithProgress(uploadUrl: string, file: Blob, onProgress?: (fraction: number) => void) {
  return new Promise<boolean>((resolve) => {
    const body = new FormData()
    body.append("cacheControl", "3600")
    body.append("", file)
    const request = new XMLHttpRequest()
    request.open("PUT", uploadUrl)
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress?.(event.loaded / event.total)
    }
    request.onload = () => resolve(request.status >= 200 && request.status < 300)
    request.onerror = () => resolve(false)
    request.onabort = () => resolve(false)
    request.ontimeout = () => resolve(false)
    request.send(body)
  })
}

/** Uploads a video (or its thumbnail) straight to private Storage and returns its path. */
export async function uploadTutorialFile(file: Blob, contentType: string, onProgress?: (fraction: number) => void) {
  const response = await fetch("/api/application-admin/tutorials/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType, size: file.size }),
  }).catch(() => null)
  const data = await readJson<{ path: string; uploadUrl: string }>(response)
  if (!data?.path || !data.uploadUrl) return null
  onProgress?.(0)
  return (await putWithProgress(data.uploadUrl, file, onProgress)) ? data.path : null
}

/** What happened with the automatic notice in the league chats (only when it was requested). */
export type TutorialSaveResult = { ok: boolean; announcement?: { posted: number; skipped: { leagueId: string; leagueName: string; reason: "no_season" | "failed" }[] } }

export type TutorialDraft = {
  title: string
  description: string
  audience: "draft" | "public" | "leagues"
  leagueIds: string[]
  /** Moment it goes live (ISO); null publishes right away. */
  publishAt: string | null
}

/** ISO moment -> value of a datetime-local input (the viewer's own time zone). */
export function toLocalInputValue(iso: string | null) {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Value of a datetime-local input -> ISO moment (or null when empty/invalid). */
export function fromLocalInputValue(value: string) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null
}

export async function createTutorial(input: TutorialDraft & {
  videoPath: string
  posterPath: string | null
  width: number | null
  height: number | null
  durationMs: number | null
  announce?: boolean
}): Promise<TutorialSaveResult> {
  const response = await fetch("/api/application-admin/tutorials", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  }).catch(() => null)
  const data = await readJson<{ announcement?: TutorialSaveResult["announcement"] }>(response)
  return { ok: Boolean(response?.ok), announcement: data?.announcement }
}

export async function updateTutorial(id: string, input: TutorialDraft & { posterPath?: string | null; announce?: boolean }): Promise<TutorialSaveResult> {
  const response = await fetch(`/api/application-admin/tutorials/${encodeURIComponent(id)}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  }).catch(() => null)
  const data = await readJson<{ announcement?: TutorialSaveResult["announcement"] }>(response)
  return { ok: Boolean(response?.ok), announcement: data?.announcement }
}

export async function deleteTutorial(id: string) {
  const response = await fetch(`/api/application-admin/tutorials/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => null)
  return Boolean(response?.ok)
}

export async function reorderTutorials(order: string[]) {
  const response = await fetch("/api/application-admin/tutorials", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order }),
  }).catch(() => null)
  return Boolean(response?.ok)
}
