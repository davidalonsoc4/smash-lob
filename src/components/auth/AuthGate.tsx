"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { signIn, useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { AppBootSkeleton } from "@/components/loading/PageSkeletons"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"
import { buildPostAuthDestination } from "@/lib/authRedirect"
import { isLocalDevAutoLoginEnabled, isLoopbackHostname } from "@/lib/localDevAuth"

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
  const localDevAttemptedRef = useRef(false)
  const [localDevSigningIn, setLocalDevSigningIn] = useState(false)

  useEffect(() => {
    if (
      status !== "unauthenticated" ||
      localDevAttemptedRef.current ||
      !isLocalDevAutoLoginEnabled() ||
      typeof window === "undefined" ||
      !isLoopbackHostname(window.location.hostname)
    ) {
      return
    }

    localDevAttemptedRef.current = true
    setLocalDevSigningIn(true)

    void signIn("local-dev", { local: "1", redirect: false })
      .then((result) => {
        if (result?.ok) {
          window.location.reload()
          return
        }

        setLocalDevSigningIn(false)
      })
      .catch(() => {
        setLocalDevSigningIn(false)
      })
  }, [status])

  if (status === "loading" || localDevSigningIn) {
    return <AppBootSkeleton />
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
          <p className="mt-3 rounded-2xl bg-neutral-100 px-3 py-3 text-xs font-semibold leading-5 text-neutral-600">
            Organiza ligas privadas de pádel con calendario, disponibilidad, resultados,
            clasificación, estadísticas y avisos en un único lugar.
          </p>

          <button
            type="button"
            onClick={() => {
              const searchParams =
                typeof window === "undefined"
                  ? null
                  : new URLSearchParams(window.location.search)
              const callbackUrl = isAccessInviteRoute
                ? buildPostAuthDestination(pathname, searchParams)
                : "/"

              void signIn("google", { callbackUrl })
            }}
            className="flex mt-5 w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white items-center justify-center text-center"
          >
            {t.auth.signInWithGoogle}
          </button>

          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 type-caption font-bold text-neutral-500">
            <Link href="/about" className="underline underline-offset-2">
              Sobre la app
            </Link>
            <Link href="/privacy" className="underline underline-offset-2">
              Privacidad
            </Link>
            <Link href="/terms" className="underline underline-offset-2">
              Condiciones
            </Link>
          </div>
        </AppCard>
      </main>
    )
  }

  return children
}
