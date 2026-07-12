"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useI18n } from "@/i18n/I18nProvider"

type NavItem = {
  href: string
  label: string
  icon: "home" | "ranking" | "matches" | "profile" | "settings"
  isActive: (pathname: string) => boolean
}

function NavIcon({ icon }: { icon: NavItem["icon"] }) {
  const commonProps = {
    "aria-hidden": true,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-4 w-4",
  }

  if (icon === "home") {
    return (
      <svg {...commonProps}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V21h13V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
    )
  }

  if (icon === "ranking") {
    return (
      <svg {...commonProps}>
        <path d="M5 20V10" />
        <path d="M12 20V4" />
        <path d="M19 20v-7" />
      </svg>
    )
  }

  if (icon === "matches") {
    return (
      <svg {...commonProps}>
        <path d="M7 3v4" />
        <path d="M17 3v4" />
        <path d="M4 8h16" />
        <rect x="4" y="5" width="16" height="16" rx="3" />
      </svg>
    )
  }

  if (icon === "settings") {
    return (
      <svg {...commonProps}>
        <path d="M4 7h10" />
        <path d="M18 7h2" />
        <path d="M4 17h2" />
        <path d="M10 17h10" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="8" cy="17" r="2" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </svg>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useI18n()
  const { activeLeagueId } = useActiveLeague()
  const { isLeagueSpectator } = useLeagueAccess()
  const spectatorMode = isLeagueSpectator(activeLeagueId)

  const playerNavItems: NavItem[] = [
    {
      href: "/",
      label: t.nav.home,
      icon: "home",
      isActive: (currentPathname) => currentPathname === "/",
    },
    {
      href: "/ranking",
      label: t.nav.ranking,
      icon: "ranking",
      isActive: (currentPathname) =>
        currentPathname === "/ranking" ||
        currentPathname.startsWith("/player"),
    },
    {
      href: "/matches",
      label: t.nav.matches,
      icon: "matches",
      isActive: (currentPathname) =>
        currentPathname === "/matches" ||
        currentPathname.startsWith("/match") ||
        currentPathname.startsWith("/round"),
    },
    {
      href: "/profile",
      label: t.nav.profile,
      icon: "profile",
      isActive: (currentPathname) => currentPathname.startsWith("/profile"),
    },
  ]
  const spectatorNavItems: NavItem[] = [
    playerNavItems[0],
    playerNavItems[1],
    playerNavItems[2],
    {
      href: "/settings",
      label: "Cuenta",
      icon: "settings",
      isActive: (currentPathname) =>
        currentPathname.startsWith("/settings") ||
        currentPathname === "/leagues" ||
        currentPathname === "/help",
    },
  ]
  const navItems = spectatorMode ? spectatorNavItems : playerNavItems

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-neutral-200 bg-white/95 shadow-[0_-6px_18px_rgba(0,0,0,0.06)] backdrop-blur"
      style={{
        minHeight: "72px",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="grid w-full grid-cols-4 gap-1.5 bg-transparent px-2.5"
        style={{
          minHeight: "72px",
          paddingTop: "7px",
          paddingBottom: "7px",
        }}
      >
        {navItems.map((item) => {
          const isActive = item.isActive(pathname)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? "flex flex-col items-center justify-center gap-0.5 rounded-xl bg-neutral-950 px-1 text-center text-[10px] font-black text-white shadow-sm"
                  : "flex flex-col items-center justify-center gap-0.5 rounded-xl bg-transparent px-1 text-center text-[10px] font-black text-neutral-500 transition active:bg-neutral-100"
              }
              style={{
                minHeight: "52px",
              }}
            >
              <NavIcon icon={item.icon} />
              <span className="leading-none">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
