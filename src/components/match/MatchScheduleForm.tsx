"use client"

import { type FormEvent, type ReactNode, useMemo, useState } from "react"
import { useMatchData } from "@/context/MatchDataProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { isDateTimeInsideRoundWindow } from "@/lib/rounds"

type MatchScheduleFormProps = {
  matchId: string
  status: string
  scheduledAt: string | null
  dateLabel: string | null
  location: string | null
  availableLocations: string[]
  roundStartsAt: string | null
  roundEndsAt: string | null
  canManage: boolean
  calendarAction?: ReactNode
}

const otherLocationValue = "__other__"

export function MatchScheduleForm({
  matchId,
  status,
  scheduledAt,
  dateLabel,
  location,
  availableLocations,
  roundStartsAt,
  roundEndsAt,
  canManage,
  calendarAction,
}: MatchScheduleFormProps) {
  const { t } = useI18n()
  const { updateMatchSchedule, postponeMatch } = useMatchData()

  const isFinished = status === "finished"
  const isPostponed = status === "postponed"
  const hasSchedule = !isPostponed && Boolean(scheduledAt || dateLabel || location)

  const initialLocationValue =
    hasSchedule && location && availableLocations.includes(location)
      ? location
      : hasSchedule && location
        ? otherLocationValue
        : ""

  const [isEditing, setIsEditing] = useState(
    canManage && !hasSchedule && !isPostponed && !isFinished
  )
  const [scheduledAtValue, setScheduledAtValue] = useState(
    hasSchedule ? scheduledAt ?? "" : ""
  )
  const [selectedLocation, setSelectedLocation] =
    useState(initialLocationValue)
  const [customLocation, setCustomLocation] = useState(
    hasSchedule && location && !availableLocations.includes(location)
      ? location
      : ""
  )
  const [isSaving, setIsSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const finalLocation = useMemo(() => {
    if (selectedLocation === otherLocationValue) {
      return customLocation.trim()
    }

    return selectedLocation.trim()
  }, [customLocation, selectedLocation])

  const canSave =
    canManage &&
    !isSaving &&
    scheduledAtValue.trim().length > 0 &&
    finalLocation.length > 0
  const canPostpone = canManage && !isSaving && !isFinished && !isPostponed

  const isOutsideRoundWindow =
    scheduledAtValue.trim().length > 0 &&
    !isDateTimeInsideRoundWindow({
      dateTimeValue: scheduledAtValue,
      startsAt: roundStartsAt,
      endsAt: roundEndsAt,
    })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canManage || !canSave) {
      return
    }

    setIsSaving(true)
    setActionError(null)

    const saved = await updateMatchSchedule(matchId, {
      scheduledAt: scheduledAtValue,
      location: finalLocation,
    })

    setIsSaving(false)

    if (!saved) {
      setActionError(
        "No se ha podido guardar el horario en la base de datos. Revisa Supabase o el valor smash-lob-last-supabase-error."
      )
      return
    }

    setIsEditing(false)
  }

  function handleCancel() {
    if (!canManage || isSaving) {
      return
    }

    setScheduledAtValue(hasSchedule ? scheduledAt ?? "" : "")
    setSelectedLocation(initialLocationValue)
    setCustomLocation(
      hasSchedule && location && !availableLocations.includes(location)
        ? location
        : ""
    )
    setActionError(null)
    setIsEditing(false)
  }

  async function handlePostpone() {
    if (!canManage || isSaving) {
      return
    }

    setIsSaving(true)
    setActionError(null)

    const saved = await postponeMatch(matchId)

    setIsSaving(false)

    if (!saved) {
      setActionError(
        "No se ha podido aplazar el partido en la base de datos. Revisa Supabase o el valor smash-lob-last-supabase-error."
      )
      return
    }

    setScheduledAtValue("")
    setSelectedLocation("")
    setCustomLocation("")
    setIsEditing(false)
  }

  function getTitle() {
    if (isPostponed) {
      return t.matchDetail.postponedTitle
    }

    if (hasSchedule) {
      return t.matchDetail.schedule
    }

    return canManage
      ? t.matchDetail.addScheduleTitle
      : t.matchDetail.pendingSchedule
  }

  function getDescription() {
    if (isPostponed) {
      return t.matchDetail.postponedDescription
    }

    if (hasSchedule) {
      return t.matchDetail.scheduleDescription
    }

    return canManage
      ? t.matchDetail.addScheduleDescription
      : t.matchDetail.pendingScheduleDescription
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-3 shadow-[0_1px_8px_rgba(15,23,42,0.045)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-black text-neutral-950">{getTitle()}</p>

          <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
            {getDescription()}
          </p>
        </div>

        {canManage && !isEditing && !isFinished ? (
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            {isPostponed ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isSaving}
                className="rounded-full bg-neutral-950 px-2.5 py-1.5 text-[11px] font-black text-white disabled:bg-neutral-300"
              >
                {t.matchDetail.rescheduleButton}
              </button>
            ) : (
              <>
                {hasSchedule ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    disabled={isSaving}
                    className="rounded-full bg-neutral-100 px-2.5 py-1.5 text-[11px] font-black text-neutral-800 disabled:text-neutral-400"
                  >
                    {t.matchDetail.editScheduleButton}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    disabled={isSaving}
                    className="rounded-full bg-neutral-950 px-2.5 py-1.5 text-[11px] font-black text-white disabled:bg-neutral-300"
                  >
                    {t.matchDetail.addScheduleButton}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePostpone}
                  disabled={!canPostpone}
                  className="rounded-full bg-orange-100 px-2.5 py-1.5 text-[11px] font-black text-orange-900 disabled:text-orange-300"
                >
                  {isSaving ? "Guardando..." : t.matchDetail.postponeButton}
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      {!isEditing ? (
        <div className="mt-2 rounded-lg bg-neutral-100 px-2.5 py-2 text-sm">
          {hasSchedule ? (
            <>
              <p className="font-black text-neutral-950">
                {dateLabel ?? t.matches.pendingDate}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-neutral-600">
                {location ?? t.matches.missingSchedule}
              </p>

              {calendarAction ? calendarAction : null}
            </>
          ) : (
            <>
              <p className="font-black text-neutral-950">
                {isPostponed
                  ? t.matches.pendingReschedule
                  : t.matches.pendingDate}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-neutral-600">
                {isPostponed
                  ? t.matches.needsReschedule
                  : t.matchDetail.noScheduleDescription}
              </p>
            </>
          )}
        </div>
      ) : null}

      {actionError ? (
        <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">
          {actionError}
        </p>
      ) : null}

      {canManage && isEditing ? (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
                {t.matchDetail.scheduleDateLabel}
              </span>

              <input
                type="datetime-local"
                value={scheduledAtValue}
                onChange={(event) => setScheduledAtValue(event.target.value)}
                disabled={isSaving}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
                {t.matchDetail.scheduleLocation}
              </span>

              <select
                value={selectedLocation}
                onChange={(event) => setSelectedLocation(event.target.value)}
                disabled={isSaving}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
              >
                <option value="">
                  {t.matchDetail.scheduleLocationPlaceholder}
                </option>

                {availableLocations.map((availableLocation) => (
                  <option key={availableLocation} value={availableLocation}>
                    {availableLocation}
                  </option>
                ))}

                <option value={otherLocationValue}>
                  {t.matchDetail.otherLocation}
                </option>
              </select>
            </label>
          </div>

          {selectedLocation === otherLocationValue ? (
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
                {t.matchDetail.customLocation}
              </span>

              <input
                value={customLocation}
                onChange={(event) => setCustomLocation(event.target.value)}
                disabled={isSaving}
                placeholder={t.matchDetail.customLocationPlaceholder}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
              />
            </label>
          ) : null}

          {isOutsideRoundWindow ? (
            <div className="rounded-lg bg-orange-100 p-2 text-xs text-orange-900">
              <p className="font-black">{t.rounds.outsideWindowTitle}</p>
              <p className="mt-0.5 font-semibold">
                {t.rounds.outsideWindowDescription}
              </p>
            </div>
          ) : null}

          <div className="flex gap-2">
            {(hasSchedule || isPostponed) && !isFinished ? (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 rounded-xl bg-neutral-100 px-3 py-2 text-sm font-black text-neutral-800 disabled:text-neutral-400"
              >
                {t.matchDetail.cancelScheduleEdit}
              </button>
            ) : null}

            <button
              type="submit"
              disabled={!canSave}
              className="flex-1 rounded-xl bg-neutral-950 px-3 py-2 text-sm font-black text-white disabled:bg-neutral-300"
            >
              {isSaving
                ? "Guardando..."
                : hasSchedule || isPostponed
                  ? t.matchDetail.saveScheduleChanges
                  : t.matchDetail.saveSchedule}
            </button>
          </div>

          {canPostpone ? (
            <button
              type="button"
              onClick={handlePostpone}
              disabled={!canPostpone}
              className="w-full rounded-xl bg-orange-100 px-3 py-2 text-sm font-black text-orange-900 disabled:text-orange-300"
            >
              {isSaving ? "Guardando..." : t.matchDetail.postponeButton}
            </button>
          ) : null}
        </form>
      ) : null}
    </section>
  )
}
