"use client"

import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { formatMoney } from "@/lib/courtBooking"

type HelpBlockProps = {
  eyebrow?: string
  title: string
  children: React.ReactNode
}

type MiniCardProps = {
  title: string
  description: string
}

type SummaryItemProps = {
  title: string
  description: string
}

function HelpBlock({ eyebrow, title, children }: HelpBlockProps) {
  return (
    <details className="group rounded-xl border border-neutral-200 bg-white shadow-[0_1px_8px_rgba(15,23,42,0.045)]">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 px-3 py-3">
        <span className="min-w-0">
          {eyebrow ? (
            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
              {eyebrow}
            </span>
          ) : null}
          <span className="mt-0.5 block text-lg font-black tracking-tight text-neutral-950">
            {title}
          </span>
        </span>

        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-lg font-black text-neutral-500 transition group-open:rotate-45">
          +
        </span>
      </summary>

      <div className="space-y-3 border-t border-neutral-100 px-3 pb-3 pt-3 text-sm leading-relaxed text-neutral-600">
        {children}
      </div>
    </details>
  )
}

function MiniCard({ title, description }: MiniCardProps) {
  return (
    <div className="rounded-2xl bg-neutral-100 px-3 py-2.5">
      <p className="text-sm font-black text-neutral-950">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-neutral-500">
        {description}
      </p>
    </div>
  )
}

function SummaryItem({ title, description }: SummaryItemProps) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-neutral-100">
      <p className="text-sm font-black text-neutral-950">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-neutral-500">
        {description}
      </p>
    </div>
  )
}

function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-neutral-100 py-3 last:border-b-0">
      <p className="text-sm font-black text-neutral-900">{label}</p>
      <p className="max-w-[62%] text-right text-sm font-semibold text-neutral-500">
        {value}
      </p>
    </div>
  )
}

export default function HelpPage() {
  const { t } = useI18n()
  const { activeLeague, activeSeason, roundSettings } = useCurrentLeagueData()
  const requiresThreeSets = roundSettings.requiresThreeSets
  const registrationFee = roundSettings.registrationFee
  const hasRegistrationFee = Boolean(
    registrationFee.enabled && registrationFee.amount > 0
  )
  const registrationAmountLabel = hasRegistrationFee
    ? formatMoney(registrationFee.amount)
    : t.help.registrationFallbackAmount
  const registrationPurpose = registrationFee.purpose.trim()
  const setsSummaryDescription = requiresThreeSets
    ? t.help.summarySetsThree
    : t.help.summarySetsOptional

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <BackButton fallbackHref="/settings" label={t.common.back} />

        <p className="mt-3 text-sm font-medium text-neutral-500">
          {activeLeague.name} · {activeSeason.name}
        </p>

        <h1 className="mt-1 text-2xl font-black tracking-tight">
          {t.help.title}
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          {t.help.fullDescription}
        </p>
      </header>

      <AppCard className="space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-400">
            {t.help.quickSummaryEyebrow}
          </p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-neutral-950">
            {t.help.quickSummaryTitle}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-neutral-500">
            {t.help.quickSummaryDescription}
          </p>
        </div>

        <div className="grid gap-3">
          <SummaryItem
            title={t.help.summaryOwnPointsTitle}
            description={t.help.summaryOwnPointsDescription}
          />
          <SummaryItem
            title={t.help.summarySetsTitle}
            description={setsSummaryDescription}
          />
          <SummaryItem
            title={t.help.summaryGamesTitle}
            description={t.help.summaryGamesDescription}
          />
        </div>
      </AppCard>

      <HelpBlock eyebrow={t.help.tipsEyebrow} title={t.help.tipsTitle}>
        <p>
          {t.help.tipsIntro}
        </p>
        <div className="grid gap-3">
          <MiniCard
            title={t.help.tipsParallelTitle}
            description={t.help.tipsParallelDescription}
          />
          <MiniCard
            title={t.help.tipsBackCourtTitle}
            description={t.help.tipsBackCourtDescription}
          />
          <MiniCard
            title={t.help.tipsNetDefenseTitle}
            description={t.help.tipsNetDefenseDescription}
          />
          <MiniCard
            title={t.help.tipsHighBallsTitle}
            description={t.help.tipsHighBallsDescription}
          />
          <MiniCard
            title={t.help.tipsBeforeServeTitle}
            description={t.help.tipsBeforeServeDescription}
          />
        </div>
      </HelpBlock>

      <HelpBlock eyebrow={t.help.registrationEyebrow} title={t.help.registrationTitle}>
        <div className="grid gap-3">
          <MiniCard
            title={t.help.registrationFeeTitle}
            description={`${registrationAmountLabel} ${t.help.registrationFeeDescriptionSuffix}`}
          />
          <MiniCard
            title={t.help.registrationFundTitle}
            description={t.help.registrationFundDescription}
          />
          <MiniCard
            title={t.help.registrationBallsTitle}
            description={t.help.registrationBallsDescription}
          />
        </div>
        {registrationPurpose ? (
          <p className="rounded-2xl bg-neutral-100 p-3 text-xs font-bold text-neutral-600">
            {t.help.registrationPurposePrefix} {registrationPurpose}
          </p>
        ) : null}
      </HelpBlock>

      <HelpBlock eyebrow={t.help.formatEyebrow} title={t.help.formatTitle}>
        <div className="grid gap-3">
          <MiniCard
            title={t.help.formatRotatingPairsTitle}
            description={t.help.formatRotatingPairsDescription}
          />
          <MiniCard
            title={t.help.formatRoundsTitle}
            description={t.help.formatRoundsDescription}
          />
          <MiniCard
            title={t.help.formatRankingTitle}
            description={t.help.formatRankingDescription}
          />
          <MiniCard
            title={t.help.formatCourtBookingTitle}
            description={t.help.formatCourtBookingDescription}
          />
          <MiniCard
            title={t.help.formatGoodFaithTitle}
            description={t.help.formatGoodFaithDescription}
          />
        </div>
      </HelpBlock>

      <HelpBlock eyebrow={t.help.injuriesEyebrow} title={t.help.injuriesTitle}>
        <div className="grid gap-3">
          <MiniCard
            title={t.help.injuriesRealTitle}
            description={t.help.injuriesRealDescription}
          />
          <MiniCard
            title={t.help.injuriesAgreedTitle}
            description={t.help.injuriesAgreedDescription}
          />
          <MiniCard
            title={t.help.injuriesNoInheritedTitle}
            description={t.help.injuriesNoInheritedDescription}
          />
        </div>
      </HelpBlock>

      <HelpBlock eyebrow={t.help.scoringEyebrow} title={t.help.scoringTitle}>
        <div className="rounded-2xl bg-white px-4 py-1 shadow-sm ring-1 ring-neutral-100">
          {requiresThreeSets ? (
            <>
              <RuleRow label={t.help.scoringThreeNilLabel} value={t.help.scoringThreeNilValue} />
              <RuleRow label={t.help.scoringTwoOneLabel} value={t.help.scoringTwoOneValue} />
            </>
          ) : (
            <>
              <RuleRow label={t.help.scoringEachSetLabel} value={t.help.scoringEachSetValue} />
              <RuleRow label={t.help.scoringPlayedSetsLabel} value={t.help.scoringPlayedSetsValue} />
            </>
          )}
          <RuleRow label={t.help.scoringTiebreakLabel} value={t.help.scoringTiebreakValue} />
        </div>
        <p>
          {requiresThreeSets
            ? t.help.scoringThreeSetsNote
            : t.help.scoringOptionalSetsNote}
        </p>
        {requiresThreeSets ? (
          <p className="rounded-2xl bg-neutral-100 p-3 text-xs font-bold text-neutral-600">
            {t.help.scoringIncompleteSetNote}
          </p>
        ) : null}
      </HelpBlock>

      <HelpBlock
        eyebrow={t.help.keyRuleEyebrow}
        title={requiresThreeSets ? t.help.keyRuleThreeSetsTitle : t.help.keyRuleOptionalSetsTitle}
      >
        {requiresThreeSets ? (
          <>
            <p>
              {t.help.keyRuleThreeSetsIntro}
            </p>
            <div className="grid gap-2">
              <MiniCard
                title={t.help.keyRuleFairTitle}
                description={t.help.keyRuleFairDescription}
              />
              <MiniCard
                title={t.help.keyRuleEmotionTitle}
                description={t.help.keyRuleEmotionDescription}
              />
              <MiniCard
                title={t.help.keyRuleConsistencyTitle}
                description={t.help.keyRuleConsistencyDescription}
              />
            </div>
          </>
        ) : (
          <>
            <p>
              {t.help.keyRuleOptionalSetsIntro}
            </p>
            <div className="grid gap-2">
              <MiniCard
                title={t.help.keyRuleFlexTitle}
                description={t.help.keyRuleFlexDescription}
              />
              <MiniCard
                title={t.help.keyRuleSetPointsTitle}
                description={t.help.keyRuleSetPointsDescription}
              />
              <MiniCard
                title={t.help.keyRuleGamesTiebreakTitle}
                description={t.help.keyRuleGamesTiebreakDescription}
              />
            </div>
          </>
        )}
      </HelpBlock>

      <HelpBlock eyebrow={t.help.matchesEyebrow} title={t.help.matchesTitle}>
        <div className="rounded-2xl bg-white px-4 py-1 shadow-sm ring-1 ring-neutral-100">
          <RuleRow label={t.help.matchesUnscheduledLabel} value={t.help.matchesUnscheduledValue} />
          <RuleRow label={t.help.matchesScheduledLabel} value={t.help.matchesScheduledValue} />
          <RuleRow label={t.help.matchesPostponedLabel} value={t.help.matchesPostponedValue} />
          <RuleRow label={t.help.matchesFinishedLabel} value={t.help.matchesFinishedValue} />
        </div>
      </HelpBlock>

      <HelpBlock eyebrow={t.help.padelEyebrow} title={t.help.padelTitle}>
        <div className="grid gap-3">
          <MiniCard
            title={t.help.padelStarPointTitle}
            description={t.help.padelStarPointDescription}
          />
          <MiniCard
            title={t.help.padelTieBreakWhenTitle}
            description={t.help.padelTieBreakWhenDescription}
          />
          <MiniCard
            title={t.help.padelTieBreakServeTitle}
            description={t.help.padelTieBreakServeDescription}
          />
          <MiniCard
            title={t.help.padelServeRotationTitle}
            description={t.help.padelServeRotationDescription}
          />
          <MiniCard
            title={t.help.padelSideChangesTitle}
            description={t.help.padelSideChangesDescription}
          />
          <MiniCard
            title={t.help.padelHowToWinTitle}
            description={t.help.padelHowToWinDescription}
          />
        </div>
      </HelpBlock>

      <HelpBlock eyebrow={t.help.mvpEyebrow} title={t.help.mvpTitle}>
        <p>
          {t.help.mvpDescription}
        </p>
        <p className="rounded-2xl bg-neutral-100 p-3 text-xs font-bold text-neutral-600">
          {t.help.mvpTip}
        </p>
      </HelpBlock>
    </div>
  )
}
