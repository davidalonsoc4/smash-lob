"use client"

import { useState } from "react"
import { useAccountProfile } from "@/context/AccountProfileProvider"
import { useLeagueScreenScope } from "@/hooks/useLeagueScreenScope"
import { useSessionResource } from "@/hooks/useSessionResource"
import { useI18n } from "@/i18n/I18nProvider"
import { getIntlLocale } from "@/i18n/localeFormatting"

function formatAnnouncementDate(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function LeagueAnnouncementsCard({ leagueId }: { leagueId: string }) {
  const { locale, tx } = useI18n()
  const intlLocale = getIntlLocale(locale)
  const { leagueScreenData } = useAccountProfile()
  const scope = useLeagueScreenScope(leagueId)
  const { data } = useSessionResource(leagueScreenData.announcements.get(scope, leagueId))
  const [enteredAt] = useState(() => Date.now())
  const announcements = data?.filter(item => !item.expiresAt || Date.parse(item.expiresAt) > enteredAt).slice(0, 3) ?? []

  if (announcements.length === 0) return null

  return (
    <section className="overflow-hidden rounded-2xl border border-orange-300 bg-orange-50 shadow-[0_2px_12px_rgba(234,88,12,0.08)]">
      <div className="flex items-center gap-2 border-b border-orange-200 px-3 py-2">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-orange-500 type-caption font-black text-white">!</span>
        <p className="type-caption font-black uppercase tracking-[0.16em] text-orange-900">
          {tx("Comunicados")}
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
            <p className="mt-1.5 type-caption font-bold text-orange-800/60">
              {announcement.createdByDisplayName ?? tx("Administración")}
              {formatAnnouncementDate(announcement.publishedAt, intlLocale)
                ? ` · ${formatAnnouncementDate(announcement.publishedAt, intlLocale)}`
                : ""}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
