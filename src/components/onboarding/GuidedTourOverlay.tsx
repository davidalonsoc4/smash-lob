"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useI18n } from "@/i18n/I18nProvider"
import { getOnboardingCopy } from "@/features/onboarding/types"
import { useOnboarding } from "@/features/onboarding/OnboardingProvider"

type TargetRect = {
  top: number
  left: number
  width: number
  height: number
}

const padding = 8

function getTargetRect(selector?: string): TargetRect | null {
  if (!selector) return null
  const element = document.querySelector(selector)
  if (!(element instanceof HTMLElement)) return null
  const rect = element.getBoundingClientRect()
  return {
    top: Math.max(8, rect.top - padding),
    left: Math.max(8, rect.left - padding),
    width: Math.min(window.innerWidth - 16, rect.width + padding * 2),
    height: Math.min(window.innerHeight - 16, rect.height + padding * 2),
  }
}

export function GuidedTourOverlay() {
  const { locale } = useI18n()
  const copy = getOnboardingCopy(locale)
  const {
    activeTour,
    currentStepIndex,
    nextStep,
    previousStep,
    skipTour,
    closeTour,
  } = useOnboarding()
  const step = activeTour?.steps[currentStepIndex]
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  useEffect(() => {
    if (!step) return

    const update = () => setTargetRect(getTargetRect(step.selector))
    const initialFrame = window.requestAnimationFrame(update)
    let settledTimeout: number | null = null
    const scrollTimeout = window.setTimeout(() => {
      const element = step.selector ? document.querySelector(step.selector) : null
      element?.scrollIntoView({ behavior: "smooth", block: "center" })
      settledTimeout = window.setTimeout(update, 260)
    }, 40)

    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)
    return () => {
      window.cancelAnimationFrame(initialFrame)
      window.clearTimeout(scrollTimeout)
      if (settledTimeout !== null) window.clearTimeout(settledTimeout)
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
    }
  }, [step])

  useEffect(() => {
    if (!activeTour) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTour()
      if (event.key === "ArrowRight") nextStep()
      if (event.key === "ArrowLeft" && currentStepIndex > 0) previousStep()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeTour, closeTour, currentStepIndex, nextStep, previousStep])

  const popoverStyle = useMemo(() => {
    if (!targetRect || step?.side === "center") {
      return {
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        ...(step?.wide
          ? { width: "min(432px, calc(100vw - 16px))" }
          : {}),
      }
    }

    if (typeof window === "undefined") {
      return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
    }

    const width = Math.min(340, window.innerWidth - 24)
    const left = Math.max(12, Math.min(window.innerWidth - width - 12, targetRect.left + targetRect.width / 2 - width / 2))
    const spaceBelow = window.innerHeight - (targetRect.top + targetRect.height)
    const preferTop = step?.side === "top" || (step?.side !== "bottom" && spaceBelow < 230)
    const top = preferTop
      ? Math.max(12, targetRect.top - 206)
      : Math.min(window.innerHeight - 210, targetRect.top + targetRect.height + 12)

    return { left: `${left}px`, top: `${top}px`, width: `${width}px` }
  }, [step?.side, step?.wide, targetRect])

  if (typeof document === "undefined" || !activeTour || !step) return null

  const isLast = currentStepIndex === activeTour.steps.length - 1

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={activeTour.title}>
      <button
        type="button"
        aria-label={copy.close}
        onClick={closeTour}
        className="absolute inset-0 cursor-default"
      />
      {targetRect ? (
        <div
          className="pointer-events-none fixed rounded-2xl ring-2 ring-white/95 transition-all duration-200"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            boxShadow: "0 0 0 9999px rgba(10, 10, 10, 0.72)",
          }}
        />
      ) : (
        <div className="pointer-events-none fixed inset-0 bg-neutral-950/72" />
      )}

      <section
        className="fixed z-[101] max-h-[calc(100vh-24px)] overflow-y-auto rounded-3xl border border-white/20 bg-white p-4 text-neutral-950 shadow-2xl"
        style={popoverStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="type-caption font-black uppercase tracking-[0.18em] text-neutral-400">
              {copy.stepProgress(currentStepIndex + 1, activeTour.steps.length)}
            </p>
            <h2 className="type-section-title mt-1 text-lg font-black tracking-tight">{step.title}</h2>
          </div>
          <button
            type="button"
            onClick={closeTour}
            aria-label={copy.close}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-lg font-black text-neutral-500"
          >
            ×
          </button>
        </div>
        <p className="mt-2 text-sm font-semibold leading-6 text-neutral-600">
          {step.description}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={skipTour}
            className="rounded-xl px-2 py-2 text-xs font-black text-neutral-500"
          >
            {copy.skip}
          </button>
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={previousStep}
                className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700"
              >
                {copy.previous}
              </button>
            ) : null}
            <button
              type="button"
              onClick={nextStep}
              className="rounded-xl bg-neutral-950 px-4 py-2 text-xs font-black text-white"
            >
              {isLast ? copy.finish : copy.next}
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  )
}
