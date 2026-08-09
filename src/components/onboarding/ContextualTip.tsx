"use client"

import Link from "next/link"
import { useCallback, useState, useSyncExternalStore } from "react"
import {
  dismissOnboardingTip,
  isOnboardingTipVisible,
  resetOnboardingTips,
  subscribeOnboardingTips,
  type OnboardingTipId,
} from "@/lib/onboardingTips"

type ContextualTipProps = {
  tipId: OnboardingTipId
  title: string
  description: string
  dismissLabel: string
  actionLabel?: string
  actionHref?: string
  compact?: boolean
}

function TipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M9 18h6M10 21h4M8.2 14.8A6.5 6.5 0 1 1 15.8 14.8c-.9.7-1.3 1.4-1.3 2.2h-5c0-.8-.4-1.5-1.3-2.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ContextualTip({
  tipId,
  title,
  description,
  dismissLabel,
  actionLabel,
  actionHref,
  compact = false,
}: ContextualTipProps) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeOnboardingTips(listener),
    [],
  )
  const visible = useSyncExternalStore(
    subscribe,
    () => isOnboardingTipVisible(tipId),
    () => false,
  )

  if (!visible) {
    return null
  }

  return (
    <aside
      className={`rounded-3xl border border-blue-100 bg-blue-50/85 text-blue-950 shadow-sm ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700">
          <TipIcon />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-blue-800/80">
            {description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {actionLabel && actionHref ? (
              <Link
                href={actionHref}
                className="rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white"
              >
                {actionLabel}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => dismissOnboardingTip(tipId)}
              className="rounded-xl bg-white/75 px-3 py-2 text-xs font-black text-blue-800"
            >
              {dismissLabel}
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

type OnboardingTipsResetProps = {
  title: string
  description: string
  actionLabel: string
  doneLabel: string
}

export function OnboardingTipsReset({
  title,
  description,
  actionLabel,
  doneLabel,
}: OnboardingTipsResetProps) {
  const [feedback, setFeedback] = useState(false)

  function handleReset() {
    resetOnboardingTips()
    setFeedback(true)
  }

  return (
    <div className="rounded-xl bg-neutral-100 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black text-neutral-950">{title}</p>
          <p className="mt-0.5 type-caption font-semibold leading-4 text-neutral-500">
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="shrink-0 rounded-xl bg-white px-3 py-2 type-caption font-black text-neutral-700 shadow-sm"
        >
          {feedback ? doneLabel : actionLabel}
        </button>
      </div>
    </div>
  )
}
