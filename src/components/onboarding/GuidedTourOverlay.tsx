"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"
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
const getViewport = () => { const viewport = window.visualViewport, styles = getComputedStyle(document.documentElement), rawTop = viewport?.offsetTop ?? 0, fallbackTop = Number.parseFloat(styles.getPropertyValue("--app-safe-top-fallback")) || 0, safeBottom = Number.parseFloat(styles.getPropertyValue("--app-safe-bottom")) || 0, top = Math.max(rawTop, fallbackTop); return { top, left: viewport?.offsetLeft ?? 0, width: viewport?.width ?? window.innerWidth, height: Math.max(0, (viewport?.height ?? window.innerHeight) - (top - rawTop) - safeBottom) } }

function getTargetRect(selector?: string): TargetRect | null {
  if (!selector) return null
  const element = document.querySelector(selector)
  if (!(element instanceof HTMLElement)) return null
  const rect = element.getBoundingClientRect(), viewport = getViewport(), top = Math.max(viewport.top + 8, rect.top - padding), left = Math.max(viewport.left + 8, rect.left - padding)
  return { top, left, width: Math.max(0, Math.min(viewport.left + viewport.width - left - 8, rect.width + padding * 2)), height: Math.max(0, Math.min(viewport.top + viewport.height - top - 8, rect.height + padding * 2)) }
}

export function GuidedTourOverlay() {
  const pathname = usePathname(), isMatchChatRoute = pathname.startsWith("/match/") && pathname.endsWith("/chat")
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

    const visualViewport = window.visualViewport
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)
    visualViewport?.addEventListener("resize", update)
    visualViewport?.addEventListener("scroll", update)
    return () => {
      window.cancelAnimationFrame(initialFrame)
      window.clearTimeout(scrollTimeout)
      if (settledTimeout !== null) window.clearTimeout(settledTimeout)
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
      visualViewport?.removeEventListener("resize", update)
      visualViewport?.removeEventListener("scroll", update)
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
    if (typeof window === "undefined") return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
    const viewport = getViewport(), width = Math.min(step?.wide ? 432 : 340, viewport.width - 24), bottom = viewport.top + viewport.height, right = viewport.left + viewport.width
    if (!targetRect || step?.side === "center") return { left: `${viewport.left + viewport.width / 2}px`, top: `${viewport.top + viewport.height / 2}px`, transform: "translate(-50%, -50%)", width: `${width}px`, maxHeight: `${Math.max(96, viewport.height - 24)}px` }
    const left = Math.max(viewport.left + 12, Math.min(right - width - 12, targetRect.left + targetRect.width / 2 - width / 2)), targetBottom = targetRect.top + targetRect.height, above = targetRect.top - viewport.top - 12, below = bottom - targetBottom - 12, minimum = 176
    if ((isMatchChatRoute && Math.max(above, below) < minimum) || (above < minimum && below < minimum)) return { left: `${viewport.left + viewport.width / 2}px`, top: `${viewport.top + viewport.height / 2}px`, transform: "translate(-50%, -50%)", width: `${width}px`, maxHeight: `${Math.max(80, viewport.height - 24)}px` }
    const useTop = (step?.side === "top" && above >= minimum) || below < minimum && above > below, maxHeight = Math.max(minimum, Math.min(340, useTop ? above : below)), top = useTop ? targetRect.top - maxHeight - 12 : Math.min(bottom - maxHeight - 12, targetBottom + 12)
    return { left: `${left}px`, top: `${Math.max(viewport.top + 12, top)}px`, width: `${width}px`, maxHeight: `${maxHeight}px` }
  }, [isMatchChatRoute, step?.side, step?.wide, targetRect])

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
        className="fixed z-[101] flex flex-col overflow-hidden rounded-3xl border border-white/20 bg-white p-4 text-neutral-950 shadow-2xl"
        style={popoverStyle}
      >
        <div className="min-h-0 overflow-y-auto">
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
        </div>
        <div className="mt-3 flex shrink-0 items-center justify-between gap-2 border-t border-neutral-100 pt-3">
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
                className="inline-flex rounded-xl bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700 items-center justify-center text-center"
              >
                {copy.previous}
              </button>
            ) : null}
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex rounded-xl bg-neutral-950 px-4 py-2 text-xs font-black text-white items-center justify-center text-center"
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
