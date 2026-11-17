import { getLeagueChatMediaRule } from "@/lib/leagueChatMedia"

export type LeagueChatMediaUploadError = "invalid_media" | "forbidden" | "read_only" | "failed"

/** PUT the file to the one-use signed upload URL, reporting progress (fetch cannot do that). */
function putWithProgress(uploadUrl: string, file: File, onProgress?: (fraction: number) => void) {
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

/** Uploads a photo/video straight to private Storage with a one-use token and returns its path. */
export async function uploadLeagueChatMedia(
  seasonId: string,
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<{ ok: true; path: string } | { ok: false; error: LeagueChatMediaUploadError }> {
  if (!getLeagueChatMediaRule(file.type)) return { ok: false, error: "invalid_media" }
  const response = await fetch(`/api/league-season-chats/${encodeURIComponent(seasonId)}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  }).catch(() => null)
  if (!response?.ok) {
    if (response?.status === 400) return { ok: false, error: "invalid_media" }
    if (response?.status === 403) return { ok: false, error: "forbidden" }
    if (response?.status === 409) return { ok: false, error: "read_only" }
    return { ok: false, error: "failed" }
  }
  const { path, uploadUrl } = (await response.json().catch(() => ({}))) as { path?: string; uploadUrl?: string }
  if (!path || !uploadUrl) return { ok: false, error: "failed" }
  onProgress?.(0)
  const uploaded = await putWithProgress(uploadUrl, file, onProgress)
  return uploaded ? { ok: true, path } : { ok: false, error: "failed" }
}
