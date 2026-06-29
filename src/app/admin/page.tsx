"use client"

import Link from "next/link"
import { useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"

function LeagueInviteCard({
  inviteCode,
  leagueName,
  onRegenerate,
}: {
  inviteCode: string
  leagueName: string
  onRegenerate: () => void
}) {
  const { t } = useI18n()
  const [copiedValue, setCopiedValue] = useState<"code" | "link" | null>(null)
  const invitePath = `/invite/${encodeURIComponent(inviteCode)}`

  async function copyValue(value: string, type: "code" | "link") {
    await navigator.clipboard.writeText(value)
    setCopiedValue(type)
    window.setTimeout(() => setCopiedValue(null), 1800)
  }

  return (
    <AppCard>
      <p className="font-bold">{t.adminPanel.inviteTitle}</p>
      <p className="mt-2 text-sm text-neutral-500">
        {t.adminPanel.inviteDescription}
      </p>

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl bg-neutral-100 p-4">
          <p className="text-xs font-semibold text-neutral-500">
            {t.adminPanel.inviteCodeLabel}
          </p>
          <p className="mt-1 break-all text-lg font-black text-neutral-950">
            {inviteCode}
          </p>
          <button
            type="button"
            onClick={() => copyValue(inviteCode, "code")}
            className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-black text-neutral-800 shadow-sm"
          >
            {copiedValue === "code"
              ? t.adminPanel.inviteCopied
              : t.adminPanel.copyCode}
          </button>
        </div>

        <div className="rounded-2xl bg-neutral-100 p-4">
          <p className="text-xs font-semibold text-neutral-500">
            {t.adminPanel.inviteLinkLabel}
          </p>
          <p className="mt-1 break-all text-sm font-black text-neutral-950">
            {invitePath}
          </p>
          <button
            type="button"
            onClick={() =>
              copyValue(`${window.location.origin}${invitePath}`, "link")
            }
            className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-black text-neutral-800 shadow-sm"
          >
            {copiedValue === "link"
              ? t.adminPanel.inviteCopied
              : t.adminPanel.copyLink}
          </button>
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold text-neutral-500">
        {t.adminPanel.inviteHelper.replace("{leagueName}", leagueName)}
      </p>

      <button
        type="button"
        onClick={() => {
          onRegenerate()
          setCopiedValue(null)
        }}
        className="mt-4 w-full rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-800"
      >
        {t.adminPanel.regenerateInviteCode}
      </button>

      <p className="mt-2 text-xs font-semibold text-neutral-500">
        {t.adminPanel.regenerateInviteCodeDescription}
      </p>
    </AppCard>
  )
}

export default function AdminPage() {
  const { t } = useI18n()
  const {
    getLeagueInviteCode,
    isLeagueAdmin,
    regenerateLeagueInviteCode,
  } = useLeagueAccess()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const canAccessAdmin = isLeagueAdmin(activeLeague.id)
  const inviteCode = getLeagueInviteCode(activeLeague.id)

  if (!canAccessAdmin) {
    return (
      <div className="space-y-5">
        <header className="pt-2">
          <BackButton fallbackHref="/settings" label={t.common.back} />

          <h1 className="mt-4 text-3xl font-black tracking-tight">
            {t.adminPanel.accessDeniedTitle}
          </h1>
        </header>

        <AppCard>
          <p className="font-bold">{t.adminPanel.accessDeniedCardTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.adminPanel.accessDeniedDescription}
          </p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <BackButton fallbackHref="/settings" label={t.common.back} />

        <p className="mt-4 text-sm font-medium text-neutral-500">
          {activeLeague.name} - {activeSeason.name}
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
          {t.adminPanel.title}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {t.adminPanel.description}
        </p>
      </header>

      <div className="space-y-3">
        <Link href="/admin/league">
          <AppCard className="transition active:scale-[0.99]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{t.adminPanel.leagueTitle}</p>
                <p className="mt-2 text-sm text-neutral-500">
                  {t.adminPanel.leagueDescription}
                </p>
              </div>

              <span className="text-xl">&gt;</span>
            </div>
          </AppCard>
        </Link>

        <Link href="/admin/season">
          <AppCard className="transition active:scale-[0.99]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{t.adminPanel.seasonTitle}</p>
                <p className="mt-2 text-sm text-neutral-500">
                  {t.adminPanel.seasonDescription}
                </p>
              </div>

              <span className="text-xl">&gt;</span>
            </div>
          </AppCard>
        </Link>
      </div>

      <LeagueInviteCard
        inviteCode={inviteCode}
        leagueName={activeLeague.name}
        onRegenerate={() => regenerateLeagueInviteCode(activeLeague.id)}
      />

      <AppCard>
        <p className="font-bold">{t.adminPanel.futureTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.adminPanel.futureDescription}
        </p>
      </AppCard>
    </div>
  )
}
