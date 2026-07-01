"use client"

import { FormEvent, type ReactNode, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { AppCard } from "@/components/ui/AppCard"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { normalizeInviteCode } from "@/lib/inviteUrls"

type LeagueEntryGateProps = {
  children: ReactNode
}

export function LeagueEntryGate({ children }: LeagueEntryGateProps) {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { canCreateLeagues, userLeagues } = useLeagueAccess()
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const isInviteRoute = pathname === "/invite" || pathname.startsWith("/invite/")
  const isNewLeagueRoute = pathname === "/league/new"

  if (isInviteRoute || (isNewLeagueRoute && canCreateLeagues) || userLeagues.length > 0) {
    return children
  }

  function handleJoinSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedInviteCode = normalizeInviteCode(inviteCode)

    if (!normalizedInviteCode) {
      setError(t.invites.invalidCode)
      return
    }

    router.push(`/invite/${encodeURIComponent(normalizedInviteCode)}`)
  }

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-6 text-neutral-950">
      <div className="mx-auto max-w-md space-y-5">
        <header className="pt-8">
          <p className="text-sm font-medium text-neutral-500">
            {session?.user?.email}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">
            {t.onboarding.title}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {t.onboarding.description}
          </p>
        </header>

        {canCreateLeagues ? (
          <AppCard>
            <p className="font-bold">{t.onboarding.createTitle}</p>
            <p className="mt-2 text-sm text-neutral-500">
              {t.onboarding.createDescription}
            </p>
            <Link
              href="/league/new"
              className="mt-4 block w-full rounded-2xl bg-neutral-950 px-4 py-3 text-center text-sm font-black text-white"
            >
              {t.onboarding.createAction}
            </Link>
          </AppCard>
        ) : null}

        <AppCard>
          <p className="font-bold">{t.onboarding.joinTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.onboarding.joinDescription}
          </p>

          <form onSubmit={handleJoinSubmit} className="mt-4 space-y-3">
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

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-neutral-800 shadow-sm"
        >
          {t.auth.signOut}
        </button>
      </div>
    </main>
  )
}
