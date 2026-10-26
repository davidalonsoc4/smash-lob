import type { ComponentProps, ReactNode } from "react"
import { MatchDetailPairingPanel, MatchSideHelp } from "@/components/match/MatchDetailPairingPanel"
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge"
import { BackButton } from "@/components/ui/BackButton"

type MatchDetailViewProps = {
  backHref: string
  backLabel: string
  eyebrow?: ReactNode
  title: ReactNode
  context?: ReactNode
  subtitle?: ReactNode
  status: string
  statusVariant?: ComponentProps<typeof MatchStatusBadge>["variant"]
  scheduledAt?: string | null
  resultRecordedAt?: string | null
  coordinationStatus?: "coordinating" | "awaiting_booking" | null
  isParticipant?: boolean
  canRecordResult?: boolean
  headerActions?: ReactNode
  beforePairing?: ReactNode
  pairing: ComponentProps<typeof MatchDetailPairingPanel>
  children?: ReactNode
}

export function MatchDetailView({
  backHref,
  backLabel,
  title,
  context,
  subtitle,
  status,
  statusVariant = "text",
  scheduledAt,
  resultRecordedAt,
  coordinationStatus = null,
  isParticipant = false,
  canRecordResult = false,
  headerActions,
  beforePairing,
  pairing,
  children,
}: MatchDetailViewProps) {
  const showPositionHelp = pairing.showPositionHelp && !pairing.sets?.length && (pairing.pointsA == null || pairing.pointsB == null)
  const contextLine = context ?? (subtitle ? (
    <p className="mt-0.5 text-xs font-black uppercase tracking-wide text-neutral-500">
      {subtitle}
    </p>
  ) : null)
  return (
    <div className="space-y-3">
      <header className="app-page-header">
        <BackButton fallbackHref={backHref} label={backLabel} />

        <div className="min-w-0 w-full" style={{ maxWidth: "none" }}>
          <div className="app-match-header-row flex min-w-0 items-center justify-between gap-2.5">
            <h1 className="type-page-title min-w-0 font-black tracking-tight">{title}</h1>

            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <MatchStatusBadge
                variant={statusVariant}
                status={status}
                scheduledAt={scheduledAt}
                resultRecordedAt={resultRecordedAt}
                coordinationStatus={coordinationStatus}
                isParticipant={isParticipant}
                canRecordResult={canRecordResult}
              />
              {headerActions}
            </div>
          </div>


          {showPositionHelp ? (
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0 flex-1">{contextLine}</div>
              <MatchSideHelp />
            </div>
          ) : contextLine}
        </div>
      </header>

      {beforePairing}

      <MatchDetailPairingPanel {...pairing} />

      {children}
    </div>
  )
}
