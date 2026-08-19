"use client"

import { ChangeEvent, FormEvent, useState } from "react"
import { useSession } from "next-auth/react"
import { ImageCropDialog } from "@/components/images/ImageCropDialog"
import { ProfileCardSkeleton } from "@/components/loading/PageSkeletons"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { useAccountProfile } from "@/context/AccountProfileProvider"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { normalizeProfileName, type DominantHand, type PreferredPlayerSide } from "@/lib/accountProfile"
import { showActionFeedback } from "@/lib/actionFeedback"
import { recordActivityEvent } from "@/lib/activity"
import { readFileAsDataUrl, validateImageFile } from "@/lib/clientImages"
import { isSafeImageUrl, normalizeImageUrl } from "@/lib/imageUrl"
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

function AccountProfileForm({
  initialProfile,
}: {
  initialProfile: AccountProfile
}) {
  const { t, tx } = useI18n()
  const { data: session } = useSession()
  const { saveProfile, saveAvatar: saveAccountAvatar } = useAccountProfile()
  const { currentUser } = useCurrentUser()
  const { refreshLeagueAccess } = useLeagueAccess()
  const [firstName, setFirstName] = useState(initialProfile.firstName)
  const [lastName, setLastName] = useState(initialProfile.lastName)
  const [preferredSide, setPreferredSide] = useState<PreferredPlayerSide | null>(initialProfile.preferredSide)
  const [dominantHand, setDominantHand] = useState<DominantHand | null>(initialProfile.dominantHand)
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl)
  const [avatarCropSource, setAvatarCropSource] = useState<string | null>(null)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const googleAvatarUrl = normalizeAvatarUrl(session?.user?.image)
  const storedAvatarUrl = normalizeAvatarUrl(avatarUrl)
  const effectiveAvatarUrl = storedAvatarUrl ?? googleAvatarUrl
  const isUsingUploadedImage = Boolean(
    storedAvatarUrl && storedAvatarUrl !== googleAvatarUrl,
  )
  const canEditAvatar = Boolean(session?.user?.email)
  const displayName = `${firstName} ${lastName}`.trim() || currentUser.displayName
  const avatarStatusLabel = isUsingUploadedImage
    ? t.settings.avatarCustomActive
    : effectiveAvatarUrl
      ? t.settings.avatarGoogleFallback
      : t.settings.avatarInitialsFallback

  async function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanFirstName = normalizeProfileName(firstName, 40)
    const cleanLastName = normalizeProfileName(lastName, 60)

    if (cleanFirstName.length < 2 || cleanLastName.length < 2) {
      const validationMessage = t.accountProfile.validationError
      setNameError(validationMessage)
      showActionFeedback({ tone: "error", message: validationMessage })
      return
    }

    if (!window.confirm(t.accountProfile.changeConfirm)) {
      return
    }

    setIsSavingName(true)
    setNameError(null)

    if (!preferredSide) { setNameError(t.accountProfile.preferredSideRequired); setIsSavingName(false); return }
    if (!dominantHand) { setNameError(t.accountProfile.dominantHandRequired); setIsSavingName(false); return }
    const result = await saveProfile(cleanFirstName, cleanLastName, undefined, preferredSide, dominantHand)

    if (!result) {
      const saveError = t.accountProfile.saveError
      setNameError(saveError)
      showActionFeedback({ tone: "error", message: saveError })
      setIsSavingName(false)
      return
    }

    await refreshLeagueAccess()
    setFirstName(result.firstName)
    setLastName(result.lastName)
    setPreferredSide(result.preferredSide)
    setDominantHand(result.dominantHand)
    showActionFeedback({ tone: "success", message: t.accountProfile.saved })
    setIsSavingName(false)
  }

  async function saveAvatar(nextAvatarUrl: string | null) {
    if (!canEditAvatar) {
      return false
    }

    setIsSavingAvatar(true)
    setAvatarError(null)

    const updatedProfile = await saveAccountAvatar(nextAvatarUrl)

    if (!updatedProfile) {
      const saveError = t.settings.avatarSaveError
      setAvatarError(saveError)
      showActionFeedback({ tone: "error", message: saveError })
      setIsSavingAvatar(false)
      return false
    }

    setAvatarUrl(updatedProfile.avatarUrl)
    await refreshLeagueAccess()
    setIsSavingAvatar(false)

    if (!currentUser.id.startsWith("__")) {
      try {
        await recordActivityEvent({
          leagueId: currentUser.leagueId,
          ...getActorFromSession(session),
          type: "user_updated",
          title: nextAvatarUrl
            ? "Imagen de perfil actualizada"
            : "Imagen de perfil restablecida",
          description: nextAvatarUrl
            ? `${displayName} ha actualizado su imagen global de perfil.`
            : `${displayName} ha recuperado la imagen de Google o el avatar predeterminado.`,
          metadata: {
            targetPlayerId: currentUser.id,
            targetPlayerName: displayName,
            hasAvatar: Boolean(nextAvatarUrl),
            scope: "account",
          },
        })
      } catch {
        // La imagen ya está guardada; la actividad es auxiliar.
      }
    }

    showActionFeedback({ tone: "success", message: t.settings.avatarSaved })
    return true
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      validateImageFile(file)
      setAvatarError(null)
      setAvatarCropSource(await readFileAsDataUrl(file))
    } catch (imageError) {
      const processError =
        imageError instanceof Error
          ? imageError.message
          : t.settings.avatarProcessError
      setAvatarError(processError)
      showActionFeedback({ tone: "error", message: processError })
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
          previewable
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-black text-neutral-950">
            {displayName}
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-neutral-500">
            {session?.user?.email ?? t.settings.connectedEmail}
          </p>
          <p className="mt-0.5 type-caption font-semibold text-neutral-400">
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
        <p className="type-caption font-black uppercase tracking-wide text-neutral-500">
          {tx("Datos de cuenta")}
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          {tx("El nombre se actualiza en todas las ligas vinculadas a esta cuenta.")}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="type-caption font-black uppercase tracking-wide text-neutral-500">
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
            <span className="type-caption font-black uppercase tracking-wide text-neutral-500">
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

        <label className="mt-2 block">
          <span className="type-caption font-black uppercase tracking-wide text-neutral-500">{t.accountProfile.preferredSide}</span>
          <select value={preferredSide ?? ""} onChange={(event) => setPreferredSide((event.target.value || null) as PreferredPlayerSide | null)} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-bold outline-none focus:border-neutral-500">
            <option value="" disabled>{t.accountProfile.preferredSideNone}</option><option value="drive">{t.accountProfile.preferredSideDrive}</option><option value="reves">{t.accountProfile.preferredSideBackhand}</option><option value="versatile">{t.accountProfile.preferredSideVersatile}</option>
          </select>
          <p className="mt-1 type-caption font-semibold text-neutral-500">{t.accountProfile.preferredSideDescription}</p>
        </label>

        <label className="mt-2 block">
          <span className="type-caption font-black uppercase tracking-wide text-neutral-500">{t.accountProfile.dominantHand}</span>
          <select value={dominantHand ?? ""} onChange={(event) => setDominantHand((event.target.value || null) as DominantHand | null)} className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-bold outline-none focus:border-neutral-500">
            <option value="" disabled>{t.accountProfile.dominantHandNone}</option><option value="right">{t.accountProfile.dominantHandRight}</option><option value="left">{t.accountProfile.dominantHandLeft}</option>
          </select>
          <p className="mt-1 type-caption font-semibold text-neutral-500">{t.accountProfile.dominantHandDescription}</p>
        </label>

        <button
          type="submit"
          disabled={isSavingName}
          className="flex mt-2.5 w-full rounded-xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
        >
          {isSavingName ? t.common.saving : t.accountProfile.saveChanges}
        </button>

        {nameError ? (
          <p className="mt-2 text-xs font-bold text-red-600">{tx(nameError)}</p>
        ) : null}
      </form>

      {canEditAvatar ? (
        <div className="border-t border-neutral-100 pt-3">
          <p className="type-caption font-black uppercase tracking-wide text-neutral-500">
            {t.settings.profileImageTitle}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
            {t.settings.profileImageDescription}
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
              disabled={isSavingAvatar || !isUsingUploadedImage}
              className="inline-flex rounded-xl bg-neutral-100 px-3 py-2.5 text-xs font-black text-neutral-800 disabled:text-neutral-300 items-center justify-center text-center"
            >
              {t.settings.removeAvatar}
            </button>
          </div>

          {avatarError ? (
            <p className="mt-2 text-xs font-semibold text-red-600">
              {tx(avatarError)}
            </p>
          ) : null}
        </div>
      ) : null}

      {avatarCropSource ? (
        <ImageCropDialog
          src={avatarCropSource}
          title={tx("Recortar imagen de perfil")}
          description={tx("Ajusta el encuadre, el zoom y la orientación antes de guardar la imagen.")}
          shape="circle"
          outputSize={256}
          outputType="image/webp"
          maxOutputBytes={160 * 1024}
          onCancel={() => setAvatarCropSource(null)}
          onConfirm={async (dataUrl) => {
            const saved = await saveAvatar(dataUrl)
            if (saved) {
              setAvatarCropSource(null)
            }
            return saved
          }}
        />
      ) : null}
    </div>
  )
}

export function AccountProfileSettings() {
  const { t, tx } = useI18n()
  const { profile, isLoading } = useAccountProfile()
  const { currentUser } = useCurrentUser()

  if (isLoading) {
    return <ProfileCardSkeleton />
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
      key={`${profile.firstName}\u0000${profile.lastName}\u0000${profile.preferredSide ?? ""}\u0000${profile.dominantHand ?? ""}\u0000${profile.avatarUrl ?? ""}\u0000${currentUser.id}`}
      initialProfile={profile}
    />
  )
}
