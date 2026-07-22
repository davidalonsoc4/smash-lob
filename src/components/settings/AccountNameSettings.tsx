"use client"

import { FormEvent, useEffect, useState } from "react"
import { useAccountProfile } from "@/context/AccountProfileProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useI18n } from "@/i18n/I18nProvider"

export function AccountNameSettings() {
  const { t } = useI18n()
  const { profile, saveProfile } = useAccountProfile()
  const { refreshLeagueAccess } = useLeagueAccess()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    setFirstName(profile.firstName)
    setLastName(profile.lastName)
  }, [profile])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanFirstName = firstName.trim()
    const cleanLastName = lastName.trim()

    if (cleanFirstName.length < 2 || cleanLastName.length < 2) {
      setError(t.accountProfile.validationError)
      return
    }

    if (!window.confirm(t.accountProfile.changeConfirm)) {
      return
    }

    setIsSaving(true)
    setFeedback(null)
    setError(null)

    const result = await saveProfile(cleanFirstName, cleanLastName)

    if (!result) {
      setError(t.accountProfile.saveError)
      setIsSaving(false)
      return
    }

    await refreshLeagueAccess()
    setFeedback(t.accountProfile.saved)
    setIsSaving(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
    >
      <p className="text-sm font-black text-neutral-950">
        {t.accountProfile.settingsTitle}
      </p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
        {t.accountProfile.settingsDescription}
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            {t.accountProfile.firstName}
          </span>
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            maxLength={40}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-neutral-500"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            {t.accountProfile.lastName}
          </span>
          <input
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="family-name"
            maxLength={60}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-neutral-500"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="mt-3 w-full rounded-xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300"
      >
        {isSaving ? t.common.saving : t.accountProfile.saveChanges}
      </button>

      {feedback ? (
        <p className="mt-2 text-xs font-bold text-emerald-700">{feedback}</p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs font-bold text-red-600">{error}</p>
      ) : null}
    </form>
  )
}
