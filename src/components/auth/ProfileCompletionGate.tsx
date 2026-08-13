"use client"

import { FormEvent, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { AppBootSkeleton } from "@/components/loading/PageSkeletons"
import { AppCard } from "@/components/ui/AppCard"
import { useAccountProfile } from "@/context/AccountProfileProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { normalizeProfileName, splitGoogleDisplayName, type DominantHand, type PreferredPlayerSide } from "@/lib/accountProfile"
import type { WeeklyAvailability } from "@/lib/playerAvailability"
import type { AccountProfile } from "@/lib/accountProfile"

type ProfileCompletionFormProps = {
  initialFirstName: string
  initialLastName: string
  initialPreferredSide: PreferredPlayerSide | null
  initialDominantHand: DominantHand | null
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
}

function ProfileCompletionForm({
  initialFirstName,
  initialLastName,
  initialPreferredSide,
  initialDominantHand,
  accountError,
  saveProfile,
}: ProfileCompletionFormProps) {
  const { t } = useI18n()
  const [firstName, setFirstName] = useState(initialFirstName)
  const [lastName, setLastName] = useState(initialLastName)
  const [preferredSide, setPreferredSide] = useState<PreferredPlayerSide | null>(initialPreferredSide)
  const [dominantHand, setDominantHand] = useState<DominantHand | null>(initialDominantHand)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

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
        </AppCard>
      </div>
    </div>
  )
}

export function ProfileCompletionGate({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { profile, isLoading, error, saveProfile } = useAccountProfile()
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
      accountError={error}
      saveProfile={saveProfile}
    />
  )
}
