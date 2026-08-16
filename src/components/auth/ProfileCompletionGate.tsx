"use client"

import { ChangeEvent, FormEvent, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { ImageCropDialog } from "@/components/images/ImageCropDialog"
import { AppBootSkeleton } from "@/components/loading/PageSkeletons"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AppCard } from "@/components/ui/AppCard"
import { useAccountProfile } from "@/context/AccountProfileProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { normalizeProfileName, splitGoogleDisplayName, type DominantHand, type PreferredPlayerSide } from "@/lib/accountProfile"
import type { WeeklyAvailability } from "@/lib/playerAvailability"
import type { AccountProfile } from "@/lib/accountProfile"
import { readFileAsDataUrl, validateImageFile } from "@/lib/clientImages"
import { isSafeImageUrl, normalizeImageUrl } from "@/lib/imageUrl"

type ProfileCompletionFormProps = {
  initialFirstName: string
  initialLastName: string
  initialPreferredSide: PreferredPlayerSide | null
  initialDominantHand: DominantHand | null
  initialAvatarUrl: string | null
  googleAvatarUrl: string | null
  accountError: string | null
  saveProfile: (
    firstName: string,
    lastName: string,
    availability?: {
      timezone: string
      weeklySlots: WeeklyAvailability
    },
    preferredSide?: PreferredPlayerSide | null,
    dominantHand?: DominantHand | null,
  ) => Promise<AccountProfile | null>
  saveAvatar: (avatarUrl: string | null) => Promise<AccountProfile | null>
}

function ProfileCompletionForm({
  initialFirstName,
  initialLastName,
  initialPreferredSide,
  initialDominantHand,
  initialAvatarUrl,
  googleAvatarUrl,
  accountError,
  saveProfile,
  saveAvatar,
}: ProfileCompletionFormProps) {
  const { t } = useI18n()
  const [firstName, setFirstName] = useState(initialFirstName)
  const [lastName, setLastName] = useState(initialLastName)
  const [preferredSide, setPreferredSide] = useState<PreferredPlayerSide | null>(initialPreferredSide)
  const [dominantHand, setDominantHand] = useState<DominantHand | null>(initialDominantHand)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [avatarCropSource, setAvatarCropSource] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const normalizedGoogleAvatar = normalizeImageUrl(googleAvatarUrl)
  const effectiveAvatarUrl =
    (avatarUrl && isSafeImageUrl(avatarUrl) ? avatarUrl : null) ??
    (normalizedGoogleAvatar && isSafeImageUrl(normalizedGoogleAvatar)
      ? normalizedGoogleAvatar
      : null)


  async function handleAvatarFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    try {
      validateImageFile(file)
      setAvatarError(null)
      setAvatarCropSource(await readFileAsDataUrl(file))
    } catch (imageError) {
      setAvatarError(
        imageError instanceof Error ? imageError.message : t.settings.avatarProcessError,
      )
    }
  }

  async function handleAvatarConfirm(dataUrl: string) {
    setIsSavingAvatar(true)
    setAvatarError(null)
    const result = await saveAvatar(dataUrl)
    setIsSavingAvatar(false)
    if (!result) {
      setAvatarError(t.settings.avatarSaveError)
      return false
    }
    setAvatarUrl(result.avatarUrl)
    setAvatarCropSource(null)
    return true
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanFirstName = normalizeProfileName(firstName, 40)
    const cleanLastName = normalizeProfileName(lastName, 60)

    if (cleanFirstName.length < 2 || cleanLastName.length < 2) {
      setFormError(t.accountProfile.validationError)
      return
    }

    if (!preferredSide) {
      setFormError(t.accountProfile.preferredSideRequired)
      return
    }
    if (!dominantHand) {
      setFormError(t.accountProfile.dominantHandRequired)
      return
    }

    setIsSaving(true)
    setFormError(null)
    const result = await saveProfile(cleanFirstName, cleanLastName, undefined, preferredSide, dominantHand)
    setIsSaving(false)

    if (!result) {
      setFormError(t.accountProfile.saveError)
    }
  }

  return (
    <div className="min-h-screen bg-stone-200 px-4 py-8 text-neutral-950">
      <div className="mx-auto max-w-md">
        <AppCard>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
            {t.accountProfile.eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">
            {t.accountProfile.title}
          </h1>
          <div className="mt-5 rounded-2xl bg-neutral-50 p-3">
            <div className="flex items-center gap-3">
              <PlayerAvatar
                player={{
                  displayName: `${firstName} ${lastName}`.trim() || "Jugador",
                  avatarUrl: effectiveAvatarUrl,
                }}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-neutral-950">
                  {t.settings.profileImageTitle}
                </p>
                <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
                  {t.settings.profileImageDescription}
                </p>
              </div>
            </div>
            <label className="mt-3 flex w-full cursor-pointer items-center justify-center rounded-xl bg-white px-3 py-2.5 text-xs font-black text-neutral-800 ring-1 ring-neutral-200">
              {isSavingAvatar ? t.common.saving : t.settings.uploadAvatar}
              <input
                type="file"
                accept="image/*"
                disabled={isSavingAvatar}
                onChange={handleAvatarFileChange}
                className="sr-only"
              />
            </label>
            <p className="mt-2 text-center type-caption font-semibold text-neutral-400">
              Opcional · si no subes una imagen, se mantiene la imagen de Google o el avatar predeterminado.
            </p>
            {avatarError ? (
              <p className="mt-2 text-center text-xs font-bold text-red-600">{avatarError}</p>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
                {t.accountProfile.firstName}
              </span>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                onBlur={() => setFirstName(normalizeProfileName(firstName, 40))}
                autoComplete="given-name"
                maxLength={40}
                className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-neutral-500"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
                {t.accountProfile.lastName}
              </span>
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                onBlur={() => setLastName(normalizeProfileName(lastName, 60))}
                autoComplete="family-name"
                maxLength={60}
                className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-neutral-500"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
                {t.accountProfile.dominantHand}
              </span>
              <select
                value={dominantHand ?? ""}
                onChange={(event) => setDominantHand((event.target.value || null) as DominantHand | null)}
                required
                className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-neutral-500"
              >
                <option value="" disabled>{t.accountProfile.dominantHandNone}</option>
                <option value="right">{t.accountProfile.dominantHandRight}</option>
                <option value="left">{t.accountProfile.dominantHandLeft}</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
                {t.accountProfile.preferredSide}
              </span>
              <select
                value={preferredSide ?? ""}
                onChange={(event) => setPreferredSide((event.target.value || null) as PreferredPlayerSide | null)}
                required
                className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm font-bold outline-none focus:border-neutral-500"
              >
                <option value="" disabled>{t.accountProfile.preferredSideNone}</option>
                <option value="drive">{t.accountProfile.preferredSideDrive}</option>
                <option value="reves">{t.accountProfile.preferredSideBackhand}</option>
                <option value="versatile">{t.accountProfile.preferredSideVersatile}</option>
              </select>
            </label>


            {formError || accountError ? (
              <p className="text-sm font-bold text-red-600">
                {formError ?? accountError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSaving}
              className="flex w-full rounded-2xl bg-neutral-950 px-3 py-3 text-sm font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
            >
              {isSaving ? t.common.saving : t.accountProfile.continue}
            </button>
          </form>
          {avatarCropSource ? (
            <ImageCropDialog
              src={avatarCropSource}
              title="Recortar imagen de perfil"
              description="Ajusta el encuadre antes de guardar. La imagen seguirá siendo opcional."
              shape="circle"
              outputSize={256}
              outputType="image/webp"
              maxOutputBytes={160 * 1024}
              onCancel={() => setAvatarCropSource(null)}
              onConfirm={handleAvatarConfirm}
            />
          ) : null}
        </AppCard>
      </div>
    </div>
  )
}

export function ProfileCompletionGate({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { profile, isLoading, error, saveProfile, saveAvatar } = useAccountProfile()
  const googleDefaults = splitGoogleDisplayName(session?.user?.name)

  if (error === "account_suspended") {
    return (
      <div className="min-h-screen bg-stone-200 px-4 py-8 text-neutral-950">
        <div className="mx-auto max-w-md">
          <AppCard>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
              Cuenta suspendida
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight">
              Acceso temporalmente bloqueado
            </h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-neutral-500">
              Un administrador de Smash & Lob ha suspendido esta cuenta. Tus ligas,
              jugadores y resultados se conservan, pero no puedes utilizar la aplicación
              hasta que se reactive el acceso.
            </p>
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/" })}
              className="flex mt-5 w-full rounded-2xl bg-neutral-950 px-3 py-3 text-sm font-black text-white items-center justify-center text-center"
            >
              Cerrar sesión
            </button>
          </AppCard>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <AppBootSkeleton />
  }

  if (profile?.isComplete) {
    return children
  }

  const initialFirstName = profile?.firstName || googleDefaults.firstName
  const initialLastName = profile?.lastName || googleDefaults.lastName
  return (
    <ProfileCompletionForm
      key={`${initialFirstName}\u0000${initialLastName}\u0000${profile?.preferredSide ?? ""}\u0000${profile?.dominantHand ?? ""}`}
      initialFirstName={initialFirstName}
      initialLastName={initialLastName}
      initialPreferredSide={profile?.preferredSide ?? null}
      initialDominantHand={profile?.dominantHand ?? null}
      initialAvatarUrl={profile?.avatarUrl ?? null}
      googleAvatarUrl={session?.user?.image ?? null}
      accountError={error}
      saveProfile={saveProfile}
      saveAvatar={saveAvatar}
    />
  )
}
