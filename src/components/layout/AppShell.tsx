"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type ReactNode } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { BottomNav } from "./BottomNav"

type AppShellProps = {
  children: ReactNode
}

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        width: "14px",
        height: "14px",
        display: "block",
      }}
    >
      <path d="M4 7h10" />
      <path d="M18 7h2" />
      <path d="M4 17h2" />
      <path d="M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </svg>
  )
}

export function AppShell({ children }: AppShellProps) {
  const { t } = useI18n()
  const pathname = usePathname()

  const shouldShowSettingsButton =
    pathname !== "/settings" &&
    pathname !== "/league/new" &&
    !pathname.startsWith("/admin") &&
    pathname !== "/invite" &&
    !pathname.startsWith("/invite/")
  const shouldShowBottomNav =
    pathname !== "/invite" &&
    !pathname.startsWith("/invite/") &&
    pathname !== "/league/new"

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-950">
      <div className="mx-auto min-h-screen max-w-md bg-neutral-50">
        {shouldShowSettingsButton ? (
          <Link
            href="/settings"
            aria-label={t.appHeader.settingsLabel}
            title={t.appHeader.settingsLabel}
            className="z-50 flex items-center justify-center rounded-full bg-neutral-200 text-neutral-700 shadow-sm transition active:scale-[0.96] active:bg-neutral-300"
            style={{
              position: "fixed",
              top: "32px",
              right: "max(22px, calc((100vw - 448px) / 2 + 22px))",
              width: "30px",
              height: "30px",
            }}
          >
            <SettingsIcon />
          </Link>
        ) : null}

        <main
          className="px-4 pt-4"
          style={{
            paddingBottom: "132px",
          }}
        >
          {children}
        </main>

        {shouldShowBottomNav ? <BottomNav /> : null}
      </div>
    </div>
  )
}
