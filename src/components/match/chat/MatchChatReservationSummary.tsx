import Link from "next/link"
import { useI18n } from "@/i18n/I18nProvider"

export function MatchChatResultPendingBanner({ href }: { href: string }) {
  const { t, tx } = useI18n()
  return (
    <Link href={href} prefetch={false} className="app-match-reservation-banner flex min-h-12 w-full shrink-0 items-center justify-between gap-2 border-b border-blue-100 bg-blue-50 px-3 py-1.5 text-xs text-blue-900">
      <span className="font-bold">{t.matchResult.pendingScheduleTitle}</span>
      <span className="font-semibold underline underline-offset-2">{tx("Ver partido")}</span>
    </Link>
  )
}

export function MatchChatReservationSummary({ date, location }: { date: string; location?: string | null }) {
  const { tx } = useI18n()
  return <>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-xs font-bold leading-4"><span className="app-match-reservation-label">{tx("Reserva")}</span><span className="sr-only"> · {tx("Guardar en calendario")}</span> · {date}</span>
      {location ? <span className="app-match-reservation-detail block truncate text-xs leading-4" title={location}>{location}</span> : null}
    </span>
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0"><path d="M8 2v4M16 2v4M3 9h18" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M12 13v6M9 16h6" /></svg>
  </>
}
