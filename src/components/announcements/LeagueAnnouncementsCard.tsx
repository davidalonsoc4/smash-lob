"use client"

import { useCallback, useEffect, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import {
  ANNOUNCEMENTS_REFRESH_EVENT,
  fetchLeagueAnnouncements,
  type LeagueAnnouncement,
} from "@/lib/announcements"

function formatAnnouncementDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

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
      const items = await fetchLeagueAnnouncements(leagueId)
      setAnnouncements(items.slice(0, 3))
    } catch {
      setAnnouncements([])
    }
  }, [leagueId])

  useEffect(() => {
    let cancelled = false

    fetchLeagueAnnouncements(leagueId)
      .then((items) => {
        if (!cancelled) setAnnouncements(items.slice(0, 3))
      })
      .catch(() => {
        if (!cancelled) setAnnouncements([])
      })

    const handleRefresh = () => {
      void refreshAnnouncements()
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshAnnouncements()
      }
    }

    window.addEventListener(ANNOUNCEMENTS_REFRESH_EVENT, handleRefresh)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      cancelled = true
      window.removeEventListener(ANNOUNCEMENTS_REFRESH_EVENT, handleRefresh)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [leagueId, refreshAnnouncements])

  if (announcements.length === 0) {
    return null
  }

  return (
    <AppCard className="overflow-hidden p-0">
      <div className="border-b border-neutral-100 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
          Comunicados
        </p>
      </div>

      <div className="divide-y divide-neutral-100">
        {announcements.map((announcement) => (
          <article key={announcement.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="font-black text-neutral-950">
                    {announcement.title}
                  </p>
                  {announcement.pinned ? (
                    <span className="rounded-full bg-neutral-950 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                      Fijado
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 whitespace-pre-line text-sm font-semibold leading-5 text-neutral-600">
                  {announcement.body}
                </p>
              </div>
            </div>

            <p className="mt-2 text-[10px] font-bold text-neutral-400">
              {announcement.createdByDisplayName ?? "Administración"}
              {formatAnnouncementDate(announcement.publishedAt)
                ? ` · ${formatAnnouncementDate(announcement.publishedAt)}`
                : ""}
            </p>
          </article>
        ))}
      </div>
    </AppCard>
  )
}
