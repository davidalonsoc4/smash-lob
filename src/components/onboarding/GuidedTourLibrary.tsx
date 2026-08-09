"use client"

import Link from "next/link"
import { useState } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { getOnboardingCopy } from "@/features/onboarding/types"
import { useOnboarding } from "@/features/onboarding/OnboardingProvider"
import { hasCompletedCurrentTour } from "@/features/onboarding/progress"

export function GuidedTourLibrary() {
  const { locale } = useI18n()
  const copy = getOnboardingCopy(locale)
  const { availableTours, progress, resetAllTours } = useOnboarding()
  const [resetDone, setResetDone] = useState(false)
  const visibleTours = availableTours

  return (
    <section id="tutoriales-visuales" className="scroll-mt-24 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="type-caption font-black uppercase tracking-[0.2em] text-neutral-400">
            {copy.libraryEyebrow}
          </p>
          <h2 className="mt-1 type-panel-title text-neutral-950">
            {copy.libraryTitle}
          </h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
            {copy.libraryDescription}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        {visibleTours.map((tour) => {
          const completed = hasCompletedCurrentTour(progress, tour)
          return (
            <div key={tour.key} className="rounded-2xl bg-neutral-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-neutral-950">{tour.title}</p>
                  <p className="mt-0.5 type-caption font-semibold leading-4 text-neutral-500">
                    {tour.description}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 type-caption font-black uppercase tracking-wide ${completed ? "bg-emerald-100 text-emerald-700" : "bg-white text-neutral-500"}`}>
                  {completed ? copy.completed : copy.pending}
                </span>
              </div>
              <Link
                href={`${tour.route}?tour=${encodeURIComponent(tour.key)}`}
                className="mt-2 inline-flex rounded-xl bg-white px-3 py-2 type-caption font-black text-neutral-800 shadow-sm"
              >
                {copy.openScreen}
              </Link>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          void resetAllTours().then(() => setResetDone(true))
        }}
        className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs font-black text-neutral-700"
      >
        {resetDone ? copy.resetDone : copy.resetAll}
      </button>
    </section>
  )
}
