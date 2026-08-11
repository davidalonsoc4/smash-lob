"use client"

import { useEffect, useState } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import {
  ACTION_FEEDBACK_EVENT,
  showActionFeedback,
  type ActionFeedbackDetail,
  type ActionFeedbackTone,
} from "@/lib/actionFeedback"

function FeedbackIcon({ tone }: { tone: ActionFeedbackTone }) {
  if (tone === "success") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (tone === "error") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M12 8v5" strokeLinecap="round" />
        <path d="M12 17h.01" strokeLinecap="round" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" strokeLinecap="round" />
      <path d="M12 8h.01" strokeLinecap="round" />
    </svg>
  )
}

function toneClasses(tone: ActionFeedbackTone) {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/95 dark:text-emerald-100"
  }

  if (tone === "error") {
    return "border-red-200 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/95 dark:text-red-100"
  }

  return "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/95 dark:text-blue-100"
}

export function ActionFeedbackCenter({ hasBottomNav = true }: { hasBottomNav?: boolean }) {
  const { t } = useI18n()
  const [feedback, setFeedback] = useState<ActionFeedbackDetail | null>(null)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    function handleFeedback(event: Event) {
      const customEvent = event as CustomEvent<ActionFeedbackDetail>
      setFeedback(customEvent.detail)
    }

    function handleOffline() {
      setIsOffline(true)
    }

    function handleOnline() {
      setIsOffline(false)
      showActionFeedback({
        tone: "success",
        message: t.actionFeedback.backOnline,
        durationMs: 2800,
      })
    }

    const initialStatusTimer = window.setTimeout(() => {
      setIsOffline(!window.navigator.onLine)
    }, 0)

    window.addEventListener(ACTION_FEEDBACK_EVENT, handleFeedback)
    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)

    return () => {
      window.clearTimeout(initialStatusTimer)
      window.removeEventListener(ACTION_FEEDBACK_EVENT, handleFeedback)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
    }
  }, [t.actionFeedback.backOnline])

  useEffect(() => {
    if (!feedback) {
      return
    }

    const duration = feedback.durationMs ?? (feedback.tone === "error" ? 7000 : 3200)

    if (duration <= 0) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback((current) => (current?.id === feedback.id ? null : current))
    }, duration)

    return () => window.clearTimeout(timeoutId)
  }, [feedback])

  if (!feedback && !isOffline) {
    return null
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[80] mx-auto max-w-md px-3"
      style={{
        bottom: hasBottomNav
          ? "max(88px, calc(env(safe-area-inset-bottom, 0px) + 78px))"
          : "max(16px, calc(env(safe-area-inset-bottom, 0px) + 12px))",
      }}
    >
      <div className="space-y-2">
        {feedback ? (
          <div
            role={feedback.tone === "error" ? "alert" : "status"}
            aria-live={feedback.tone === "error" ? "assertive" : "polite"}
            className={`pointer-events-auto flex items-center gap-2 rounded-2xl border px-3 py-2.5 shadow-lg backdrop-blur ${toneClasses(feedback.tone)}`}
          >
            <div className="shrink-0">
              <FeedbackIcon tone={feedback.tone} />
            </div>
            <p className="min-w-0 flex-1 text-xs font-bold leading-5">
              {feedback.message}
            </p>
            {feedback.actionLabel && feedback.onAction ? (
              <button
                type="button"
                onClick={() => {
                  const action = feedback.onAction
                  setFeedback(null)
                  action?.()
                }}
                className="inline-flex min-h-11 shrink-0 rounded-xl bg-white/80 px-3 text-xs font-black shadow-sm dark:bg-neutral-900/70 items-center justify-center text-center"
              >
                {feedback.actionLabel}
              </button>
            ) : null}
            <button
              type="button"
              aria-label={t.actionFeedback.close}
              onClick={() => setFeedback(null)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-current/70 transition active:bg-white/60"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="m7 7 10 10M17 7 7 17" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ) : null}

        {isOffline ? (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-auto rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 shadow-lg backdrop-blur dark:border-amber-800 dark:bg-amber-950/95"
          >
            <p className="text-xs font-black text-amber-950 dark:text-amber-100">
              {t.actionFeedback.offlineTitle}
            </p>
            <p className="mt-0.5 type-caption font-semibold leading-4 text-amber-800 dark:text-amber-200">
              {t.actionFeedback.offlineDescription}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
