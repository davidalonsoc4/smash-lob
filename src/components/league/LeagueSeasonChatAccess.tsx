import Link from "next/link"
import { useEffect, useState } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { subscribeChatRealtime } from "@/lib/chatRealtimeClient"
import { MatchChatActionLink } from "@/components/match/MatchChatFloatingAction"
import { AppCard } from "@/components/ui/AppCard"
import { StatusDot } from "@/components/ui/StatusDot"
import { getIntlLocale } from "@/i18n/leagueText"

type Preview = { unread: number; readOnly: boolean; realtimeTopic: string | null; participantCount?: number; participants?: { userId: string }[]; messages?: { sender_display_name: string; body: string; created_at: string }[] }

export function LeagueSeasonChatAccess({ seasonId, floating = false, leagueName, seasonName }: { seasonId: string; floating?: boolean; leagueName?: string; seasonName?: string }) {
  const { tx, locale } = useI18n()
  const [preview, setPreview] = useState<Preview | null>(null)
  useEffect(() => {
    let alive = true
    async function load() {
      const response = await fetch(`/api/league-season-chats/${encodeURIComponent(seasonId)}?summary=1`, { cache: "no-store" }).catch(() => null)
      if (!alive) return
      if (!response?.ok) { setPreview(null); return }
      const data = await response.json() as Preview
      if (alive) setPreview(data)
    }
    void load()
    const onVisible = () => { if (!document.hidden) void load() }
    document.addEventListener("visibilitychange", onVisible)
    return () => { alive = false; document.removeEventListener("visibilitychange", onVisible) }
  }, [seasonId])
  useEffect(() => subscribeChatRealtime(preview?.realtimeTopic ?? null, () => {
    void fetch(`/api/league-season-chats/${encodeURIComponent(seasonId)}?summary=1`, { cache: "no-store" }).then(async (response) => {
      if (response.ok) setPreview(await response.json() as Preview)
    }).catch(() => undefined)
  }), [preview?.realtimeTopic, seasonId])
  if (!preview || (floating && preview.readOnly)) return null
  const href = `/league-chat/${encodeURIComponent(seasonId)}`
  if (!floating) {
    const participantCount = preview.participantCount ?? preview.participants?.length ?? 0
    const last = preview.messages?.at(-1)
    const date = last ? new Date(last.created_at) : null
    const formattedDate = date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat(getIntlLocale(locale), { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date) : ""
    return <section className="space-y-1.5"><h2 className="type-section-title font-black text-neutral-700">{tx("Chat general")}</h2><Link href={href} className="block transition active:scale-[0.99]"><AppCard className={`app-card-explicit-accent !overflow-hidden !p-0 !shadow-none ${preview.unread ? "chat-list-card-unread" : ""}`}><div className="min-w-0 px-4 py-3"><div className="flex items-center gap-2"><p className="type-panel-title min-w-0 flex-1 truncate font-black">{leagueName ?? tx("Chat de liga")}</p>{preview.unread > 0 ? <span aria-label={tx("Mensajes sin leer")} className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-neutral-950 px-1.5 type-caption font-black text-white">{preview.unread > 99 ? "99+" : preview.unread}</span> : null}{preview.readOnly ? <StatusDot kind="chat" status="readonly" label={tx("Solo lectura")} /> : null}</div><p className="mt-2 type-small font-semibold text-neutral-600">{seasonName ? `${seasonName} · ` : ""}{participantCount ? `${participantCount} ${tx(participantCount === 1 ? "participante" : "participantes")}` : tx("Conversación de la temporada")}</p><div className="mt-2 flex min-w-0 items-center gap-2 border-t border-neutral-100 pt-2"><div className="min-w-0 flex-1">{last ? <p className={`truncate type-caption ${preview.unread ? "font-black text-neutral-800" : "font-semibold text-neutral-500"}`}><span className="font-black">{last.sender_display_name}</span>: {last.body}</p> : <p className="type-caption font-semibold text-neutral-400">{tx("Sin mensajes todavía")}</p>}</div><p className="shrink-0 type-caption font-semibold text-neutral-400">{formattedDate}</p></div></div></AppCard></Link></section>
  }
  return <div className="fixed z-40 flex flex-col items-end gap-2" style={{ right: "max(14px, calc((100vw - var(--app-shell-width, 448px)) / 2 + 14px))", bottom: "calc(84px + env(safe-area-inset-bottom, 0px))" }}><MatchChatActionLink href={href} label={tx("Abrir chat de liga")} unread={preview.unread > 0} /></div>
}
