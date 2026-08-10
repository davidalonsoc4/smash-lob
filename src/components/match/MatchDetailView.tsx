import type { ComponentProps, ReactNode } from "react"
import { MatchDetailPairingPanel } from "@/components/match/MatchDetailPairingPanel"
import { MatchStatusBadge } from "@/components/matches/MatchStatusBadge"
import { BackButton } from "@/components/ui/BackButton"

type MatchDetailViewProps = {
  backHref: string
  backLabel: string
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  status: string
  scheduledAt?: string | null
  resultRecordedAt?: string | null
  headerActions?: ReactNode
  beforePairing?: ReactNode
  pairing: ComponentProps<typeof MatchDetailPairingPanel>
  children?: ReactNode
}

export function MatchDetailView({
  backHref,
  backLabel,
  eyebrow,
  title,
  subtitle,
  status,
  scheduledAt,
  resultRecordedAt,
  headerActions,
  beforePairing,
  pairing,
  children,
}: MatchDetailViewProps) {
  return (
    <div className="space-y-3">
      <header className="app-page-header">
        <BackButton fallbackHref={backHref} label={backLabel} />

        <div className="mt-3 min-w-0 w-full" style={{ maxWidth: "none" }}>
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
              {eyebrow}
            </p>
          ) : null}

          <div
            className={`${eyebrow ? "mt-1" : ""} flex min-w-0 items-start justify-between gap-2.5`}
          >
            <h1 className="type-page-title min-w-0 text-2xl font-black tracking-tight">{title}</h1>

            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <MatchStatusBadge
                status={status}
                scheduledAt={scheduledAt}
                resultRecordedAt={resultRecordedAt}
              />
              {headerActions}
            </div>
          </div>

          {subtitle ? (
            <p className="mt-0.5 text-xs font-black uppercase tracking-wide text-neutral-500">
              {subtitle}
            </p>
          ) : null}
        </div>
      </header>

      {beforePairing}

      <MatchDetailPairingPanel {...pairing} />

      {children}
    </div>
  )
}
