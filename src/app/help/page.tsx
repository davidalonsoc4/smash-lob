"use client"

import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"

function HelpSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <AppCard>
      <p className="text-lg font-black text-neutral-950">{title}</p>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-600">
        {children}
      </div>
    </AppCard>
  )
}

export default function HelpPage() {
  const { t } = useI18n()
  const { activeLeague, activeSeason } = useCurrentLeagueData()

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <BackButton fallbackHref="/settings" label={t.common.back} />

        <p className="mt-4 text-sm font-medium text-neutral-500">
          {activeLeague.name} · {activeSeason.name}
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
          {t.help.title}
        </h1>

        <p className="mt-2 text-sm text-neutral-500">{t.help.description}</p>
      </header>

      <HelpSection title={t.help.starPointsTitle}>
        <p>{t.help.starPointsDescription}</p>
        <p className="rounded-2xl bg-neutral-100 p-3 font-semibold text-neutral-700">
          {t.help.starPointsTip}
        </p>
      </HelpSection>

      <HelpSection title={t.help.tieBreakTitle}>
        <p>{t.help.tieBreakDescription}</p>
        <p className="rounded-2xl bg-neutral-100 p-3 font-semibold text-neutral-700">
          {t.help.tieBreakTip}
        </p>
      </HelpSection>

      <HelpSection title={t.help.threeSetsTitle}>
        <p>{t.help.threeSetsDescription}</p>
        <p>{t.help.threeSetsBalance}</p>
      </HelpSection>

      <AppCard className="border border-dashed border-neutral-300 bg-neutral-50">
        <p className="font-black text-neutral-950">{t.help.futureTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.help.futureDescription}
        </p>
      </AppCard>
    </div>
  )
}
