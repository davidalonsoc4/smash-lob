"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ANNOUNCEMENTS_REFRESH_EVENT,
  fetchLeagueAnnouncements,
  type LeagueAnnouncement,
} from "@/lib/announcements"

function formatAnnouncementDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function LeagueAnnouncementsCard({ leagueId }: { leagueId: string }) {
  const [announcements, setAnnouncements] = useState<LeagueAnnouncement[]>([])

  const refreshAnnouncements = useCallback(async () => {
    try {
      const items = await fetchLeagueAnnouncements(leagueId, { homeOnly: true })
      setAnnouncements(items.slice(0, 3))
    } catch {
      setAnnouncements([])
    }
  }, [leagueId])

  useEffect(() => {
    let cancelled = false

    fetchLeagueAnnouncements(leagueId, { homeOnly: true })
      .then((items) => {
        if (!cancelled) setAnnouncements(items.slice(0, 3))
      })
      .catch(() => {
        if (!cancelled) setAnnouncements([])
      })

    const handleRefresh = () => void refreshAnnouncements()
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void refreshAnnouncements()
    }

    window.addEventListener(ANNOUNCEMENTS_REFRESH_EVENT, handleRefresh)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      cancelled = true
      window.removeEventListener(ANNOUNCEMENTS_REFRESH_EVENT, handleRefresh)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [leagueId, refreshAnnouncements])

  if (announcements.length === 0) return null

  return (
    <section className="overflow-hidden rounded-2xl border border-orange-300 bg-orange-50 shadow-[0_2px_12px_rgba(234,88,12,0.08)]">
      <div className="flex items-center gap-2 border-b border-orange-200 px-3 py-2">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-orange-500 text-[11px] font-black text-white">!</span>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-900">
          Comunicados
        </p>
      </div>

      <div className="divide-y divide-orange-200">
        {announcements.map((announcement) => (
          <article key={announcement.id} className="px-3 py-2.5">
            <p className="text-sm font-black leading-4 text-orange-950">
              {announcement.title}
            </p>
            <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs font-semibold leading-4 text-orange-950/75">
              {announcement.body}
            </p>
            <p className="mt-1.5 text-[9px] font-bold text-orange-800/60">
              {announcement.createdByDisplayName ?? "Administración"}
              {formatAnnouncementDate(announcement.publishedAt)
                ? ` · ${formatAnnouncementDate(announcement.publishedAt)}`
                : ""}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
