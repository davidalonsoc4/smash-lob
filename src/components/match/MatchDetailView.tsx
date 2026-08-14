import type { ComponentProps, ReactNode } from "react"
import { MatchDetailPairingPanel } from "@/components/match/MatchDetailPairingPanel"
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
  scheduledAt?: string | null
  resultRecordedAt?: string | null
  coordinationStatus?: "coordinating" | "awaiting_booking" | null
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
  scheduledAt,
  resultRecordedAt,
  coordinationStatus = null,
  headerActions,
  beforePairing,
  pairing,
  children,
}: MatchDetailViewProps) {
  return (
    <div className="space-y-3">
      <header className="app-page-header">
        <BackButton fallbackHref={backHref} label={backLabel} />

        <div className="min-w-0 w-full" style={{ maxWidth: "none" }}>
          <div className="flex min-w-0 items-start justify-between gap-2.5">
            <h1 className="type-page-title min-w-0 font-black tracking-tight">{title}</h1>

            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <MatchStatusBadge
                status={status}
                scheduledAt={scheduledAt}
                resultRecordedAt={resultRecordedAt}
                coordinationStatus={coordinationStatus}
              />
              {headerActions}
            </div>
          </div>


          {context ?? (subtitle ? (
            <p className="mt-0.5 text-xs font-black uppercase tracking-wide text-neutral-500">
              {subtitle}
            </p>
          ) : null)}
        </div>
      </header>

      {beforePairing}

      <MatchDetailPairingPanel {...pairing} />

      {children}
    </div>
  )
}
