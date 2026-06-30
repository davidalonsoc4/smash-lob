"use client"

import { ChangeEvent, useState } from "react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"
import { LeagueSwitcher } from "@/components/league/LeagueSwitcher"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { LocalDataMaintenanceCard } from "@/components/settings/LocalDataMaintenanceCard"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { APP_VERSION } from "@/lib/appVersion"
import { resizeImageFileToDataUrl } from "@/lib/clientImages"
import { recordActivityEvent } from "@/lib/activity"


function getActorFromSession(session: ReturnType<typeof useSession>["data"]) {
  return {
    actorEmail: session?.user?.email ?? "system@smash-lob.local",
    actorDisplayName: session?.user?.name ?? null,
  }
}

function AccountAvatarSettings() {
  const { t } = useI18n()
  const { currentUser } = useCurrentUser()
  const { data: session } = useSession()
  const { updateLeaguePlayerAvatar } = useLeagueAccess()
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl ?? null)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveAvatar(nextAvatarUrl: string | null) {
    setIsSaving(true)
    setSaved(false)
    setError(null)

    const updated = await updateLeaguePlayerAvatar(
      currentUser.leagueId,
      currentUser.id,
      nextAvatarUrl
    )

    setIsSaving(false)

    if (!updated) {
      setError(t.settings.avatarSaveError)
      return
    }

    setAvatarUrl(nextAvatarUrl)

    try {
      await recordActivityEvent({
        leagueId: currentUser.leagueId,
        ...getActorFromSession(session),
        type: "player_avatar_updated",
        title: nextAvatarUrl ? "Imagen de perfil actualizada" : "Imagen de perfil eliminada",
        description: nextAvatarUrl
          ? `${currentUser.displayName} ha actualizado su imagen de perfil.`
          : `${currentUser.displayName} ha eliminado su imagen de perfil.`,
        metadata: {
          targetPlayerId: currentUser.id,
          targetPlayerName: currentUser.displayName,
          hasAvatar: Boolean(nextAvatarUrl),
        },
      })
    } catch {
      // La imagen ya está guardada; la actividad es auxiliar.
    }

    setSaved(true)
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const dataUrl = await resizeImageFileToDataUrl({
        file,
        maxSize: 512,
      })

      await saveAvatar(dataUrl)
    } catch (imageError) {
      setError(
        imageError instanceof Error
          ? imageError.message
          : t.settings.avatarProcessError
      )
    } finally {
      event.target.value = ""
    }
  }

  return (
    <div className="mt-5 rounded-2xl bg-neutral-100 p-4">
      <p className="font-bold">{t.settings.accountSettingsTitle}</p>
      <p className="mt-1 text-xs text-neutral-500">
        {t.settings.accountSettingsDescription}
      </p>

      <div className="mt-4 flex items-center gap-4">
        <PlayerAvatar
          player={{
            ...currentUser,
            avatarUrl,
          }}
          size="lg"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black">
            {currentUser.displayName}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {avatarUrl ? t.settings.avatarCustomActive : t.settings.avatarInitialsFallback}
          </p>
        </div>
      </div>

      <label className="mt-4 block w-full rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-neutral-800">
        {isSaving ? t.common.saving : t.settings.uploadAvatar}
        <input
          type="file"
          accept="image/*"
          disabled={isSaving}
          onChange={handleFileChange}
          className="sr-only"
        />
      </label>

      {avatarUrl ? (
        <button
          type="button"
          onClick={() => saveAvatar(null)}
          disabled={isSaving}
          className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-neutral-800 disabled:text-neutral-400"
        >
          {t.settings.removeAvatar}
        </button>
      ) : null}

      {error ? (
        <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>
      ) : null}

      {saved ? (
        <p className="mt-3 text-xs font-semibold text-neutral-600">
          {t.settings.avatarSaved}
        </p>
      ) : null}
    </div>
  )
}

export default function SettingsPage() {
  const { t } = useI18n()
  const { data: session } = useSession()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const { isLeagueAdmin, isLeagueCreator, userLeagues } = useLeagueAccess()
  const canAccessAdmin = isLeagueAdmin(activeLeague.id)
  const canMaintainLocalData = isLeagueCreator(activeLeague.id)
  const hasMultipleLeagues = userLeagues.length > 1

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <BackButton fallbackHref="/profile" label={t.common.back} />

        <p className="text-sm font-medium text-neutral-500">
          {activeLeague.name} - {activeSeason.name}
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
          {t.settings.title}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {t.settings.description}
        </p>
      </header>

      <AppCard>
        <p className="font-bold">{t.settings.languageTitle}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{t.settings.language}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {t.settings.languageDescription}
            </p>
          </div>

          <LanguageSwitcher />
        </div>
      </AppCard>

      {hasMultipleLeagues ? (
        <AppCard>
          <p className="font-bold">{t.settings.leagueTitle}</p>

          <div className="mt-4">
            <LeagueSwitcher />
          </div>
        </AppCard>
      ) : null}

      {canAccessAdmin ? (
        <Link href="/admin">
          <AppCard className="transition active:scale-[0.99]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{t.settings.adminPanelTitle}</p>
                <p className="mt-2 text-sm text-neutral-500">
                  {t.settings.adminPanelDescription}
                </p>
              </div>

              <span className="text-xl">&gt;</span>
            </div>
          </AppCard>
        </Link>
      ) : null}

      <AppCard>
        <p className="font-bold">{t.settings.accountTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.settings.accountDescription}
        </p>

        {session?.user?.email ? (
          <div className="mt-4 rounded-2xl bg-neutral-100 p-4">
            <p className="text-xs font-semibold text-neutral-500">
              {t.settings.connectedEmail}
            </p>
            <p className="mt-1 text-sm font-black text-neutral-900">
              {session.user.email}
            </p>
          </div>
        ) : null}

        <AccountAvatarSettings />

        <div className="mt-4 space-y-3">
          <Link
            href="/invite"
            className="block w-full rounded-2xl bg-neutral-100 px-4 py-3 text-center text-sm font-black text-neutral-800"
          >
            {t.settings.joinNewExistingLeague}
          </Link>

          <Link
            href="/league/new"
            className="block w-full rounded-2xl bg-neutral-950 px-4 py-3 text-center text-sm font-black text-white"
          >
            {t.settings.createNewLeague}
          </Link>
        </div>
      </AppCard>

      {canMaintainLocalData ? <LocalDataMaintenanceCard /> : null}

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700"
      >
        {t.auth.signOut}
      </button>

      <p className="pb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-300">
        Smash & Lob {APP_VERSION}
      </p>
    </div>
  )
}
