"use client"

import { signIn, useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"

type AuthGateProps = {
  children: React.ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const { t } = useI18n()
  const { status } = useSession()
  const pathname = usePathname()
  const isInviteRoute = pathname === "/invite" || pathname.startsWith("/invite/")
  const isSpectatorInviteRoute = pathname.startsWith("/spectate/")
  const isAccessInviteRoute = isInviteRoute || isSpectatorInviteRoute

  useEffect(() => {
    if (status !== "unauthenticated" || !isAccessInviteRoute) {
      return
    }

    signIn("google", { callbackUrl: pathname })
  }, [isAccessInviteRoute, pathname, status])

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
        <AppCard className="w-full max-w-sm">
          <p className="font-bold">{t.auth.loadingTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.auth.loadingDescription}
          </p>
        </AppCard>
      </main>
    )
  }

  if (status === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
        <AppCard className="w-full max-w-sm">
          <p className="text-sm font-medium text-neutral-500">
            {t.auth.subtitle}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-950">
            {t.auth.title}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {t.auth.description}
          </p>

          <button
            type="button"
            onClick={() =>
              signIn("google", { callbackUrl: isAccessInviteRoute ? pathname : "/" })
            }
            className="mt-5 w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white"
          >
            {t.auth.signInWithGoogle}
          </button>
        </AppCard>
      </main>
    )
  }

  return children
}
