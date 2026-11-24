import { getTutorialFileRule } from "@/lib/tutorialVideos"

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
