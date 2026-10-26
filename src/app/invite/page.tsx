"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useI18n } from "@/i18n/I18nProvider"
import { getCompetitionInvitePath } from "@/lib/inviteUrls"

export default function ManualInvitePage() {
  const { t, tx } = useI18n()
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const destination = getCompetitionInvitePath(inviteCode)

    if (!destination) {
      setError(t.invites.invalidCode)
      return
    }

    router.push(destination)
  }

  return (
    <div className="space-y-4">
      <header className="app-page-header">
        <BackButton fallbackHref="/settings" label={t.common.back} />
        <h1 className="type-page-title mt-3 text-2xl font-black tracking-tight">
          {t.settings.joinNewExistingLeague}
        </h1>
      </header>

      <AppCard>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">
              {tx("Código o enlace de invitación")}
            </span>
            <input
              value={inviteCode}
              onChange={(event) => {
                setInviteCode(event.target.value)
                setError(null)
              }}
              placeholder={t.invites.codePlaceholder}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
            />
          </label>

          {error ? (
            <p className="text-sm font-semibold text-red-600">{tx(error)}</p>
          ) : null}

          <button
            type="submit"
            className="flex w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white items-center justify-center text-center"
          >
            {t.onboarding.joinAction}
          </button>
        </form>
      </AppCard>
    </div>
  )
}
