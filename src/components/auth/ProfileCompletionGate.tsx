"use client"

import { FormEvent, useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { AppCard } from "@/components/ui/AppCard"
import {
  buildStandardWeeklyAvailability,
  getStandardAvailabilityEditorInitialState,
  StandardAvailabilityEditor,
} from "@/components/auth/StandardAvailabilityEditor"
import { useAccountProfile } from "@/context/AccountProfileProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { normalizeProfileName, splitGoogleDisplayName } from "@/lib/accountProfile"
import { getBrowserTimezone, type WeeklyAvailability } from "@/lib/playerAvailability"
import type { AccountProfile } from "@/lib/accountProfile"

type ProfileCompletionFormProps = {
  initialFirstName: string
  initialLastName: string
  initialWeeklySlots: WeeklyAvailability
  accountError: string | null
  saveProfile: (
    firstName: string,
    lastName: string,
    availability?: {
      timezone: string
      weeklySlots: WeeklyAvailability
    },
  ) => Promise<AccountProfile | null>
}

function ProfileCompletionForm({
  initialFirstName,
  initialLastName,
  initialWeeklySlots,
  accountError,
  saveProfile,
}: ProfileCompletionFormProps) {
  const { t } = useI18n()
  const initialAvailability = getStandardAvailabilityEditorInitialState(
    initialWeeklySlots,
  )
  const [firstName, setFirstName] = useState(initialFirstName)
  const [lastName, setLastName] = useState(initialLastName)
  const [selectedDays, setSelectedDays] = useState(
    initialAvailability.selectedDays,
  )
  const [availabilitySlot, setAvailabilitySlot] = useState(
    initialAvailability.slot,
  )
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

    if (
      selectedDays.length === 0 ||
      !availabilitySlot.start ||
      !availabilitySlot.end ||
      availabilitySlot.start >= availabilitySlot.end
    ) {
      setFormError(t.accountProfile.availabilityValidationError)
      return
    }

    setIsSaving(true)
    setFormError(null)
    const result = await saveProfile(cleanFirstName, cleanLastName, {
      timezone: getBrowserTimezone(),
      weeklySlots: buildStandardWeeklyAvailability({
        selectedDays,
        slot: availabilitySlot,
      }),
    })
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
          <p className="mt-2 text-sm font-semibold leading-6 text-neutral-500">
            {t.accountProfile.description}
          </p>

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

            <p className="rounded-2xl bg-neutral-100 px-3 py-2.5 text-xs font-semibold leading-5 text-neutral-600">
              {t.accountProfile.globalNameNotice}
            </p>

            <StandardAvailabilityEditor
              selectedDays={selectedDays}
              slot={availabilitySlot}
              dayLabels={t.accountProfile.availabilityDays}
              title={t.accountProfile.availabilityTitle}
              description={t.accountProfile.availabilityDescription}
              startLabel={t.accountProfile.availabilityStart}
              endLabel={t.accountProfile.availabilityEnd}
              laterNotice={t.accountProfile.availabilityLaterNotice}
              onSelectedDaysChange={setSelectedDays}
              onSlotChange={setAvailabilitySlot}
            />

            {formError || accountError ? (
              <p className="text-sm font-bold text-red-600">
                {formError ?? accountError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-2xl bg-neutral-950 px-3 py-3 text-sm font-black text-white disabled:bg-neutral-300"
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
  const { t } = useI18n()
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
              className="mt-5 w-full rounded-2xl bg-neutral-950 px-3 py-3 text-sm font-black text-white"
            >
              Cerrar sesión
            </button>
          </AppCard>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-200 text-neutral-950">
        <div className="mx-auto flex min-h-screen max-w-md items-center bg-stone-50 px-4 shadow-[0_0_32px_rgba(15,23,42,0.06)]">
          <AppCard className="w-full text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-950" />
            <p className="mt-4 font-black">{t.accountProfile.loadingTitle}</p>
          </AppCard>
        </div>
      </div>
    )
  }

  if (profile?.isComplete) {
    return children
  }

  const initialFirstName = profile?.firstName || googleDefaults.firstName
  const initialLastName = profile?.lastName || googleDefaults.lastName
  const initialWeeklySlots =
    profile?.standardAvailabilityWeeklySlots ??
    {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    }

  return (
    <ProfileCompletionForm
      key={`${initialFirstName}\u0000${initialLastName}`}
      initialFirstName={initialFirstName}
      initialLastName={initialLastName}
      initialWeeklySlots={initialWeeklySlots}
      accountError={error}
      saveProfile={saveProfile}
    />
  )
}
