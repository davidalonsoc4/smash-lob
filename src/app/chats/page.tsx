"use client"

import { StatusDot } from "@/components/ui/StatusDot"
import { LeagueSeasonChatAccess } from "@/components/league/LeagueSeasonChatAccess"

import Link from "next/link"
import { useEffect } from "react"
import { scheduleChatEntryPreviews } from "@/lib/chatEntryRequest"
import { useAccountProfile } from "@/context/AccountProfileProvider"
import { useLeagueScreenEntrance, useLeagueScreenScope } from "@/hooks/useLeagueScreenScope"
import { useSessionResource } from "@/hooks/useSessionResource"
import { cardListEntrance } from "@/lib/cardListEntrance"
import type { LeagueChatItem } from "@/lib/leagueScreenData"
import { SeasonContextLineSelector } from "@/components/layout/SeasonContextLine"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { getIntlLocale } from "@/i18n/localeFormatting"
import { compactParticipantName } from "@/lib/chatProposalVoters"


function formatChatDate(value: string | null, locale: "es" | "en" | "eu") { const date = value ? new Date(value) : null; return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat(getIntlLocale(locale), { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date) : "" }
function chatParticipantsLabel(chat: LeagueChatItem, tx: (source: string) => string) { const names = [chat.partner, ...chat.rivals], participantName = (name: string) => compactParticipantName(name, names), rivals = chat.rivals.filter(Boolean).map(participantName), rivalLabel = rivals.length > 1 ? `${rivals.slice(0, -1).join(", ")} ${tx("y")} ${rivals.at(-1)}` : rivals[0] ?? tx("Rivales"); return `${tx("con")} ${participantName(chat.partner) || tx("Pareja")} vs ${rivalLabel}` }
function chatStatus(chat: LeagueChatItem, tx: (source: string) => string) { const status = chat.status === "scheduling" && chat.coordinationStatus ? chat.coordinationStatus : chat.status, meta: Record<string, [string, string]> = { coordinating: [tx("Coordinando"), "violet"], awaiting_booking: [tx("Pendiente de reserva"), "indigo"], scheduled: [tx("Programado"), "blue"], postponed: [tx("Aplazado"), "orange"] }; return status === "scheduling" ? null : meta[status] ?? [tx(status), "neutral"] }
function ChatCards({ chats, animate, tour }: { chats: LeagueChatItem[]; animate: boolean; tour?: string }) {
  const { tx, locale } = useI18n()
  return <div data-tour={tour} {...(animate ? cardListEntrance : {})} className="chat-list-stack overflow-hidden rounded-xl">{chats.map((chat, index) => { const participantsLabel = chatParticipantsLabel(chat, tx), statusMeta = chatStatus(chat, tx), radius = chats.length === 1 ? "!rounded-xl" : index === 0 ? "!rounded-t-xl !rounded-b-none" : index === chats.length - 1 ? "!rounded-b-xl !rounded-t-none" : "!rounded-none"; return <div key={chat.id} className="relative"><Link href={`/match/${chat.id}/chat`} className={`block ${index ? "-mt-px" : ""}`}><AppCard className={`app-card-explicit-accent !overflow-hidden !p-0 !shadow-none transition active:scale-[0.99] ${radius} ${chat.unread ? "chat-list-card-unread" : ""}`}><div className="flex min-w-0 items-stretch"><div className="min-w-0 flex-1 py-3 pl-4 pr-4"><div className="flex min-w-0 items-center gap-1.5"><p className="type-panel-title min-w-0 flex-1 truncate font-black">{tx("Jornada")}{" "}{chat.round}</p>{chat.unread > 0 ? <span aria-label={tx(`${chat.unread} mensaje${chat.unread === 1 ? "" : "s"} sin leer`)} className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-neutral-950 px-1.5 type-caption font-black text-white shadow-sm">{chat.unread > 99 ? "99+" : chat.unread}</span> : null}{chat.readOnly || statusMeta ? <span className="h-5 w-5 shrink-0" aria-hidden="true" /> : null}</div><p className="mt-2 whitespace-normal break-words type-small font-semibold text-neutral-600" title={participantsLabel}>{participantsLabel}</p><div className="mt-2 flex min-w-0 items-center gap-2 border-t border-neutral-100 pt-2"><div className="min-w-0 flex-1">{chat.lastMessage ? <p className={`truncate type-caption ${chat.unread ? "font-black text-neutral-800" : "font-semibold text-neutral-500"}`}><span className="font-black">{chat.lastMessage.sender}</span>: {chat.lastMessage.body}</p> : <p className="type-caption font-semibold text-neutral-400">{tx("Sin mensajes todavía")}</p>}</div><p className="shrink-0 type-caption font-semibold text-neutral-400">{formatChatDate(chat.lastMessage?.createdAt ?? chat.scheduledAt, locale)}</p></div></div></div></AppCard></Link>{chat.readOnly || statusMeta ? <div className="absolute right-4 top-3"><StatusDot kind={chat.readOnly ? "chat" : "match-participant"} status={chat.readOnly ? "readonly" : chat.status === "scheduling" && chat.coordinationStatus ? chat.coordinationStatus : chat.status} label={chat.readOnly ? tx("Solo lectura") : statusMeta![0]} /></div> : null}</div> })}</div> }

export default function ChatsPage() {
  const { seasons } = useSeasonSettings()
  const { tx } = useI18n()
  const { t } = useI18n(), { activeLeague, activeSeason, rounds } = useCurrentLeagueData()
  const { account, leagueScreenData } = useAccountProfile()
  const scope = useLeagueScreenScope(activeLeague.id)
  const chatResource = leagueScreenData.chats.get(scope, activeLeague.id, activeSeason.id)
  const { data, failed: error } = useSessionResource(chatResource)
  const chats = data?.chats ?? []
  const loading = !data && !error
  const animate = useLeagueScreenEntrance("chats", activeLeague.id, chats.length > 0)
  const openChats = chats.filter((chat) => !chat.readOnly), finishedChats = chats.filter((chat) => chat.readOnly), roundNumbers = [...new Set(rounds.map((item) => item.round))].sort((a, b) => a - b), anchorRound = rounds.find((item) => item.status === "active")?.round ?? rounds.find((item) => item.status === "overdue")?.round ?? rounds.find((item) => item.status === "upcoming")?.round ?? openChats[0]?.round ?? null, nextRound = anchorRound === null ? null : roundNumbers.find((round) => round > anchorRound) ?? anchorRound
  const activeChats = openChats.filter((chat) => Boolean(chat.lastMessage) || nextRound === null || chat.round <= nextRound), upcomingChats = openChats.filter((chat) => !chat.lastMessage && nextRound !== null && chat.round > nextRound)
  const firstActive = activeChats[0]?.id
  const ready = Boolean(data)
  useEffect(() => {
    if (!ready) return
    return scheduleChatEntryPreviews(account, `/api/league-season-chats/${encodeURIComponent(activeSeason.id)}`, firstActive && `/api/matches/${encodeURIComponent(firstActive)}/chat`)
  }, [account, activeSeason.id, ready, firstActive])
  return <div className="compact-page space-y-3"><header className="app-page-header"><BackButton fallbackHref="/league/home" label={t.common.back} /><h1 className="type-page-title font-black tracking-tight">{tx("Chats")}</h1><SeasonContextLineSelector leagueId={activeLeague.id} season={activeSeason} seasons={seasons} /></header>
    <LeagueSeasonChatAccess leagueId={activeLeague.id} seasonId={activeSeason.id} leagueName={activeLeague.name} seasonName={activeSeason.name} />
    {loading ? <AppCard><p className="text-sm font-semibold text-neutral-500">{tx("Cargando conversaciones…")}</p></AppCard> : null}{error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{tx("No se han podido cargar tus chats.")}</p> : null}{!loading && !error && chats.length === 0 ? <AppCard><p className="text-sm font-black">{tx("Todavía no tienes chats de partido.")}</p><p className="mt-1 text-xs font-semibold text-neutral-500">{tx("Cuando participes en una jornada, su conversación aparecerá aquí.")}</p></AppCard> : null}
    {activeChats.length > 0 ? <section data-tour="chats-conversations" className="space-y-1.5"><h2 className="type-section-title font-black text-neutral-700">{tx("Activos")}</h2><ChatCards chats={activeChats} animate={animate} /></section> : null}{upcomingChats.length > 0 ? <section data-tour="chats-upcoming" className="space-y-1.5 pt-1"><h2 className="type-section-title font-black text-neutral-700">{tx("Próximos")}</h2><ChatCards chats={upcomingChats} animate={animate && !activeChats.length} /></section> : null}{finishedChats.length > 0 ? <section data-tour="chats-finished" className="space-y-2 pt-1"><h2 className="type-section-title font-black text-neutral-700">{tx("Chats finalizados")}</h2><ChatCards chats={finishedChats} animate={animate && !activeChats.length && !upcomingChats.length} /></section> : null}
  </div>
}
