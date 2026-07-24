"use client"

import { AccountProfileSettings } from "@/components/settings/AccountProfileSettings"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useI18n } from "@/i18n/I18nProvider"

export default function MyProfileSettingsPage() {
  const { t } = useI18n()

  return (
    <div className="compact-page space-y-3">
      <header className="pt-1">
        <BackButton fallbackHref="/settings" label={t.common.back} />
        <p className="text-sm font-medium text-neutral-500">
          {t.settings.accountSettingsTitle}
        </p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          {t.settings.myProfileTitle}
        </h1>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          {t.settings.myProfileDescription}
        </p>
      </header>

      <AppCard>
        <AccountProfileSettings />
      </AppCard>
    </div>
  )
}
