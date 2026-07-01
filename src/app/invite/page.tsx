"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useI18n } from "@/i18n/I18nProvider"
import { normalizeInviteCode } from "@/lib/inviteUrls"

export default function ManualInvitePage() {
  const { t } = useI18n()
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedInviteCode = normalizeInviteCode(inviteCode)

    if (!normalizedInviteCode) {
      setError(t.invites.invalidCode)
      return
    }

    router.push(`/invite/${encodeURIComponent(normalizedInviteCode)}`)
  }

  return (
    <div className="space-y-3">
      <header className="pt-2">
        <BackButton fallbackHref="/settings" label={t.common.back} />
        <h1 className="mt-4 sl-page-title">
          {t.onboarding.joinTitle}
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          {t.onboarding.joinDescription}
        </p>
      </header>

      <AppCard>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">
              {t.invites.codeLabel}
            </span>
            <input
              value={inviteCode}
              onChange={(event) => {
                setInviteCode(event.target.value)
                setError(null)
              }}
              placeholder={t.invites.codePlaceholder}
              className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold uppercase text-stone-900 shadow-sm outline-none focus:border-neutral-400"
            />
          </label>

          {error ? (
            <p className="text-sm font-semibold text-red-600">{error}</p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-black text-white"
          >
            {t.onboarding.joinAction}
          </button>
        </form>
      </AppCard>
    </div>
  )
}
