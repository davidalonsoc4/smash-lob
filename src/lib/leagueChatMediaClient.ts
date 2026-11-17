import { LEAGUE_CHAT_MEDIA_BUCKET, getLeagueChatMediaRule } from "@/lib/leagueChatMedia"
import { supabase } from "@/lib/supabase"

export type LeagueChatMediaUploadError = "invalid_media" | "forbidden" | "read_only" | "failed"

/** Uploads a photo/video straight to private Storage with a one-use token and returns its path. */
export async function uploadLeagueChatMedia(
  seasonId: string,
  file: File,
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
  const { path, token } = (await response.json().catch(() => ({}))) as { path?: string; token?: string }
  if (!path || !token) return { ok: false, error: "failed" }
  const upload = await supabase.storage
    .from(LEAGUE_CHAT_MEDIA_BUCKET)
    .uploadToSignedUrl(path, token, file, { contentType: file.type })
  return upload.error ? { ok: false, error: "failed" } : { ok: true, path }
}
