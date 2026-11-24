"use client"

import Link from "next/link"
import { FloatingDialog, DialogCloseButton } from "@/components/ui/FloatingDialog"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { TutorialPlayerDialog } from "@/components/help/TutorialVideoCard"
import { fetchTutorials } from "@/lib/tutorialVideosClient"
import { getTutorialScreenForPath, type TutorialSummary } from "@/lib/tutorialVideos"
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

export function FloatingHelpButton() {
  const { locale, tx } = useI18n()
  const copy = getOnboardingCopy(locale)
  const { currentTour, progress, startCurrentTour } = useOnboarding()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const screen = getTutorialScreenForPath(pathname ?? "")
  const [screenVideos, setScreenVideos] = useState<TutorialSummary[]>([])
  const [playing, setPlaying] = useState<TutorialSummary | null>(null)

  // The videos of this screen (the ones assigned to it, in the order of the management) are looked up when the panel opens.
  useEffect(() => {
    if (!open || !screen) return
    let cancelled = false
    void fetchTutorials().then((list) => {
      if (!cancelled) setScreenVideos(list?.filter((item) => item.screen === screen) ?? [])
    })
    return () => { cancelled = true }
  }, [open, screen])
  const completed = currentTour ? hasCompletedCurrentTour(progress, currentTour) : false

  return (
    <>
      <button
        type="button"
        data-tour="floating-help"
        aria-label={copy.helpLabel}
        title={copy.helpLabel}
        onClick={() => setOpen(true)}
        className="app-floating-control z-50 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-600 shadow-sm backdrop-blur transition active:scale-[0.96] active:bg-neutral-100"
      >
        <HelpIcon />
      </button>

      <FloatingDialog open={open} onClose={() => setOpen(false)} title={copy.helpTitle} variant="help">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="type-section-title text-lg font-black tracking-tight">{currentTour?.title ?? copy.noTourTitle}</h2>
                <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
                  {currentTour?.description ?? copy.noTourDescription}
                </p>
              </div>
              <DialogCloseButton onClick={() => setOpen(false)} />
            </div>

            {currentTour ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  window.setTimeout(startCurrentTour, 80)
                }}
                className="app-dialog-primary mt-4 w-full"
              >
                {completed ? copy.repeatCurrent : copy.startCurrent}
              </button>
            ) : null}

            {screen && screenVideos.length === 1 ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setPlaying(screenVideos[0])
                }}
                className="app-dialog-option mt-2 justify-center"
              >
                {copy.screenVideo}
              </button>
            ) : null}
            {screen && screenVideos.length > 1 ? (
              <div data-screen-videos className="mt-3 space-y-1.5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">{tx("Vídeos de esta pantalla")}</p>
                {screenVideos.map((video) => (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      setPlaying(video)
                    }}
                    className="app-dialog-option w-full justify-between gap-2 text-left"
                  >
                    <span className="min-w-0 flex-1 truncate">{video.title}</span>
                    {!video.seen ? <span className="shrink-0 rounded-full bg-neutral-950 px-2 py-0.5 type-caption font-black text-white">{tx("Nuevo")}</span> : null}
                  </button>
                ))}
              </div>
            ) : null}

            <Link
              href="/help"
              onClick={() => setOpen(false)}
              className="app-dialog-option mt-2 justify-center"
            >
              {copy.allTutorials}
            </Link>
      </FloatingDialog>
      <TutorialPlayerDialog tutorial={playing} onClose={() => setPlaying(null)} onSeen={(id) => setScreenVideos((list) => list.map((item) => (item.id === id ? { ...item, seen: true } : item)))} />
    </>
  )
}
