"use client"

import Link from "next/link"
import { useState } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { getOnboardingCopy } from "@/features/onboarding/types"
import { useOnboarding } from "@/features/onboarding/OnboardingProvider"
import { hasCompletedCurrentTour } from "@/features/onboarding/progress"

export function HelpIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-[17px] w-[17px]">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M9.8 9a2.4 2.4 0 1 1 3.7 2c-1 .6-1.5 1.1-1.5 2.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function FloatingHelpButton({ right }: { right: string }) {
  const { locale } = useI18n()
  const copy = getOnboardingCopy(locale)
  const { currentTour, progress, startCurrentTour } = useOnboarding()
  const [open, setOpen] = useState(false)
  const completed = currentTour ? hasCompletedCurrentTour(progress, currentTour) : false

  return (
    <>
      <button
        type="button"
        data-tour="floating-help"
        aria-label={copy.helpLabel}
        title={copy.helpLabel}
        onClick={() => setOpen(true)}
        className="app-floating-control z-50 flex items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-600 shadow-sm backdrop-blur transition active:scale-[0.96] active:bg-neutral-100"
        style={{ position: "fixed", top: "max(10px, calc(env(safe-area-inset-top, 0px) + 8px))", right, width: 34, height: 34 }}
      >
        <HelpIcon />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-neutral-950/45 p-3 sm:items-center">
          <button type="button" aria-label={copy.close} onClick={() => setOpen(false)} className="absolute inset-0" />
          <section
            role="dialog"
            aria-modal="true"
            aria-label={copy.helpTitle}
            className="relative z-[91] w-full max-w-sm rounded-3xl bg-white p-4 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="type-section-title text-lg font-black tracking-tight">{currentTour?.title ?? copy.noTourTitle}</h2>
                <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
                  {currentTour?.description ?? copy.noTourDescription}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-lg font-black text-neutral-500">×</button>
            </div>

            {currentTour ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  window.setTimeout(startCurrentTour, 80)
                }}
                className="flex mt-4 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white items-center justify-center text-center"
              >
                {completed ? copy.repeatCurrent : copy.startCurrent}
              </button>
            ) : null}

            <Link
              href="/help#tutoriales-visuales"
              onClick={() => setOpen(false)}
              className="flex mt-2 w-full rounded-2xl bg-neutral-100 px-4 py-3 text-center text-sm font-black text-neutral-800 items-center justify-center"
            >
              {copy.allTutorials}
            </Link>
          </section>
        </div>
      ) : null}
    </>
  )
}
