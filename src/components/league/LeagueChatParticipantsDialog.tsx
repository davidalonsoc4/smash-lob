"use client"

import Link from "next/link"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { FloatingDialog } from "@/components/ui/FloatingDialog"
import type { MatchChatParticipant } from "@/components/match/chat/MatchChatShared"
import { useI18n } from "@/i18n/I18nProvider"

const ROLE_ORDER = { creator: 0, admin: 1 } as const

/** Creator first, then administrators, then everyone else alphabetically. */
export function sortLeagueChatParticipants(participants: MatchChatParticipant[]) {
  const rank = (participant: MatchChatParticipant) => (participant.role ? ROLE_ORDER[participant.role] : 2)
  return [...participants].sort((a, b) => rank(a) - rank(b) || a.displayName.localeCompare(b.displayName, "es", { sensitivity: "base" }))
}

export function leagueChatProfileHref(participant: Pick<MatchChatParticipant, "playerId"> | null | undefined) {
  return participant?.playerId ? `/player/${participant.playerId}` : null
}

/** Everyone in the chat, one per row, each opening the player's profile when the account is linked to a player. */
export function LeagueChatParticipantsDialog({ open, onClose, participants, me }: { open: boolean; onClose: () => void; participants: MatchChatParticipant[]; me: string }) {
  const { tx } = useI18n()
  return (
    <FloatingDialog open={open} onClose={onClose} title={tx("Participantes")} variant="content">
      <ul data-league-chat-participants className="max-h-[60dvh] space-y-1 overflow-y-auto">
        {sortLeagueChatParticipants(participants).map((participant) => {
          const href = leagueChatProfileHref(participant)
          const content = (
            <>
              <PlayerAvatar player={{ displayName: participant.displayName, avatarUrl: participant.avatarUrl }} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black">{participant.displayName}{participant.userId === me ? <span className="ml-1 font-semibold opacity-70">({tx("Tú")})</span> : null}</span>
                {participant.role ? <span className="block type-caption font-bold opacity-70">{tx(participant.role === "creator" ? "Creador" : "Administrador")}</span> : null}
              </span>
              {href ? <ClickableChevron className="shrink-0" /> : null}
            </>
          )
          return (
            <li key={participant.userId ?? participant.displayName}>
              {href
                ? <Link href={href} onClick={onClose} className="flex min-h-12 items-center gap-3 rounded-xl px-2 py-1.5 transition active:scale-[0.99]">{content}</Link>
                : <div className="flex min-h-12 items-center gap-3 rounded-xl px-2 py-1.5">{content}</div>}
            </li>
          )
        })}
      </ul>
    </FloatingDialog>
  )
}
