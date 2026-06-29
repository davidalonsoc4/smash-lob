"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useI18n } from "@/i18n/I18nProvider"

export default function ManualInvitePage() {
  const { t } = useI18n()
  const router = useRouter()
  const { getLeagueByInviteCode } = useLeagueAccess()
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const league = getLeagueByInviteCode(inviteCode)

    if (!league) {
      setError(t.invites.invalidCode)
      return
    }

    router.push(`/invite/${encodeURIComponent(league.inviteCode)}`)
  }

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <BackButton fallbackHref="/settings" label={t.common.back} />
        <h1 className="mt-4 text-3xl font-black tracking-tight">
          {t.onboarding.joinTitle}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {t.onboarding.joinDescription}
        </p>
      </header>

      <AppCard>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">
              {t.invites.codeLabel}
            </span>
            <input
              value={inviteCode}
              onChange={(event) => {
                setInviteCode(event.target.value)
                setError(null)
              }}
              placeholder={t.invites.codePlaceholder}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold uppercase text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
            />
          </label>

          {error ? (
            <p className="text-sm font-semibold text-red-600">{error}</p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white"
          >
            {t.onboarding.joinAction}
          </button>
        </form>
      </AppCard>
    </div>
  )
}
