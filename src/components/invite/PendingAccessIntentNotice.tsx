"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"
import type { PendingAccessIntentKind } from "@/lib/pendingAccessIntent"
import { clearPendingAccessIntent } from "@/lib/pendingAccessIntentClient"

type PendingAccessIntentPayload = {
  pending?: boolean
  kind?: PendingAccessIntentKind | null
}

export function PendingAccessIntentNotice() {
  const { t } = useI18n()
  const [intentKind, setIntentKind] = useState<PendingAccessIntentKind | null>(null)

  useEffect(() => {
    let cancelled = false

    void fetch("/api/access-intent", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          return null
        }

        return (await response.json()) as PendingAccessIntentPayload
      })
      .then((payload) => {
        if (cancelled || !payload?.pending || !payload.kind) {
          return
        }

        setIntentKind(payload.kind)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [])

  if (!intentKind) {
    return null
  }

  return (
    <AppCard className="mb-3 border-amber-200 bg-amber-50">
      <p className="text-sm font-black text-amber-950">
        {t.pendingAccess.title}
      </p>
      <p className="mt-1 text-xs font-semibold leading-5 text-amber-900/75">
        {intentKind === "spectate"
          ? t.pendingAccess.spectatorDescription
          : t.pendingAccess.inviteDescription}
      </p>
      <div className="mt-3 flex gap-2">
        <Link
          href="/launch?source=pending-invitation"
          className="inline-flex items-center justify-center rounded-xl bg-amber-950 px-3 py-2 text-center text-xs font-black text-white"
        >
          {t.pendingAccess.continue}
        </Link>
        <button
          type="button"
          onClick={() => {
            setIntentKind(null)
            void clearPendingAccessIntent()
          }}
          className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 text-center text-xs font-black text-amber-950 ring-1 ring-amber-200"
        >
          {t.pendingAccess.dismiss}
        </button>
      </div>
    </AppCard>
  )
}
