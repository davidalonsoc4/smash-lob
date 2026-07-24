"use client"

import { ChangeEvent, FormEvent, useState } from "react"
import { useSession } from "next-auth/react"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { useAccountProfile } from "@/context/AccountProfileProvider"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { normalizeProfileName } from "@/lib/accountProfile"
import { recordActivityEvent } from "@/lib/activity"
import { resizeImageFileToDataUrl } from "@/lib/clientImages"
import {
  isSafeDataImageUrl,
  isSafeImageUrl,
  normalizeImageUrl,
} from "@/lib/imageUrl"
import type { AccountProfile } from "@/lib/accountProfile"

function getActorFromSession(session: ReturnType<typeof useSession>["data"]) {
  return {
    actorEmail: session?.user?.email ?? "system@smash-lob.local",
    actorDisplayName: session?.user?.name ?? null,
  }
}

function normalizeAvatarUrl(value: string | null | undefined) {
  const cleanValue = normalizeImageUrl(value)

  return cleanValue && isSafeImageUrl(cleanValue) ? cleanValue : null
}

function isCustomUploadedAvatar(value: string | null | undefined) {
  return isSafeDataImageUrl(value)
}

function AccountProfileForm({
  initialProfile,
}: {
  initialProfile: AccountProfile
}) {
  const { t } = useI18n()
  const { data: session } = useSession()
  const { saveProfile } = useAccountProfile()
  const { currentUser } = useCurrentUser()
  const { refreshLeagueAccess, updateLeaguePlayerAvatar } = useLeagueAccess()
  const [firstName, setFirstName] = useState(initialProfile.firstName)
  const [lastName, setLastName] = useState(initialProfile.lastName)
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl ?? null)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)
  const [nameFeedback, setNameFeedback] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [avatarFeedback, setAvatarFeedback] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const googleAvatarUrl = normalizeAvatarUrl(session?.user?.image)
  const effectiveAvatarUrl = normalizeAvatarUrl(avatarUrl) ?? googleAvatarUrl
  const isUsingCustomAvatar = isCustomUploadedAvatar(avatarUrl)
  const canEditAvatar = !currentUser.id.startsWith("__")
  const displayName = `${firstName} ${lastName}`.trim() || currentUser.displayName
  const avatarStatusLabel = isUsingCustomAvatar
    ? t.settings.avatarCustomActive
    : effectiveAvatarUrl
      ? t.settings.avatarGoogleFallback
      : t.settings.avatarInitialsFallback

  async function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanFirstName = normalizeProfileName(firstName, 40)
    const cleanLastName = normalizeProfileName(lastName, 60)

    if (cleanFirstName.length < 2 || cleanLastName.length < 2) {
      setNameError(t.accountProfile.validationError)
      return
    }

    if (!window.confirm(t.accountProfile.changeConfirm)) {
      return
    }

    setIsSavingName(true)
    setNameFeedback(null)
    setNameError(null)

    const result = await saveProfile(cleanFirstName, cleanLastName)

    if (!result) {
      setNameError(t.accountProfile.saveError)
      setIsSavingName(false)
      return
    }

    await refreshLeagueAccess()
    setFirstName(result.firstName)
    setLastName(result.lastName)
    setNameFeedback(t.accountProfile.saved)
    setIsSavingName(false)
  }

  async function saveAvatar(nextAvatarUrl: string | null) {
    if (!canEditAvatar) {
      return
    }

    setIsSavingAvatar(true)
    setAvatarFeedback(null)
    setAvatarError(null)

    const updated = await updateLeaguePlayerAvatar(
      currentUser.leagueId,
      currentUser.id,
      nextAvatarUrl,
    )

    setIsSavingAvatar(false)

    if (!updated) {
      setAvatarError(t.settings.avatarSaveError)
      return
    }

    setAvatarUrl(nextAvatarUrl)

    try {
      await recordActivityEvent({
        leagueId: currentUser.leagueId,
        ...getActorFromSession(session),
        type: "player_avatar_updated",
        title: nextAvatarUrl
          ? "Imagen de perfil actualizada"
          : "Imagen de perfil eliminada",
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

    setAvatarFeedback(t.settings.avatarSaved)
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
      setAvatarError(
        imageError instanceof Error
          ? imageError.message
          : t.settings.avatarProcessError,
      )
    } finally {
      event.target.value = ""
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <PlayerAvatar
          player={{
            ...currentUser,
            displayName,
            avatarUrl: effectiveAvatarUrl,
          }}
          size="lg"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-black text-neutral-950">
            {displayName}
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-neutral-500">
            {session?.user?.email ?? t.settings.connectedEmail}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-neutral-400">
            {canEditAvatar
              ? avatarStatusLabel
              : t.settings.profileGoogleImageNotice}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleNameSubmit}
        className="border-t border-neutral-100 pt-3"
      >
        <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
          Datos de cuenta
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          El nombre se actualiza en todas las ligas vinculadas a esta cuenta.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
              {t.accountProfile.firstName}
            </span>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              onBlur={() => setFirstName(normalizeProfileName(firstName, 40))}
              autoComplete="given-name"
              maxLength={40}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-bold outline-none focus:border-neutral-500"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
              {t.accountProfile.lastName}
            </span>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              onBlur={() => setLastName(normalizeProfileName(lastName, 60))}
              autoComplete="family-name"
              maxLength={60}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-bold outline-none focus:border-neutral-500"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSavingName}
          className="mt-2.5 w-full rounded-xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300"
        >
          {isSavingName ? t.common.saving : t.accountProfile.saveChanges}
        </button>

        {nameFeedback ? (
          <p className="mt-2 text-xs font-bold text-emerald-700">
            {nameFeedback}
          </p>
        ) : null}
        {nameError ? (
          <p className="mt-2 text-xs font-bold text-red-600">{nameError}</p>
        ) : null}
      </form>

      {canEditAvatar ? (
        <div className="border-t border-neutral-100 pt-3">
          <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            {t.settings.profileImageTitle}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
            {t.settings.profileImageDescription} La imagen se aplica al jugador de la liga activa.
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="block rounded-xl bg-neutral-100 px-3 py-2.5 text-center text-xs font-black text-neutral-800">
              {isSavingAvatar ? t.common.saving : t.settings.uploadAvatar}
              <input
                type="file"
                accept="image/*"
                disabled={isSavingAvatar}
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={() => saveAvatar(null)}
              disabled={isSavingAvatar || !isUsingCustomAvatar}
              className="rounded-xl bg-neutral-100 px-3 py-2.5 text-xs font-black text-neutral-800 disabled:text-neutral-300"
            >
              {t.settings.removeAvatar}
            </button>
          </div>

          {avatarError ? (
            <p className="mt-2 text-xs font-semibold text-red-600">
              {avatarError}
            </p>
          ) : null}
          {avatarFeedback ? (
            <p className="mt-2 text-xs font-semibold text-neutral-600">
              {avatarFeedback}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function AccountProfileSettings() {
  const { t } = useI18n()
  const { profile, isLoading } = useAccountProfile()
  const { currentUser } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="rounded-xl bg-neutral-50 px-3 py-4 text-center text-xs font-semibold text-neutral-500">
        {t.settings.profileLoading}
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="rounded-xl bg-red-50 px-3 py-4 text-center text-xs font-semibold text-red-700">
        {t.settings.profileLoadError}
      </div>
    )
  }

  return (
    <AccountProfileForm
      key={`${profile.firstName}\u0000${profile.lastName}\u0000${currentUser.id}`}
      initialProfile={profile}
    />
  )
}
