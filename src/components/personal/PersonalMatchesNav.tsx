import Link from "next/link"
import { isCompetitionOverviewRoute } from "@/lib/competitionNavigation"
import { useI18n } from "@/i18n/I18nProvider"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { FitText } from "@/components/ui/FitText"
type PersonalNavIconName = "matches" | "chats" | "profile" | "leagues"

function PersonalNavIcon({ icon }: { icon: PersonalNavIconName }) {
  const commonProps = {
    "aria-hidden": true,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "app-bottom-nav-icon",
  }

  if (icon === "chats") {
    return (
      <svg {...commonProps}>
        <path d="M5 18.5 3.5 21l3.7-1A9 9 0 1 0 5 18.5Z" />
        <path d="M8 10.5h8M8 14h5" />
      </svg>
    )
  }

  if (icon === "profile") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5.5 20c.8-4 3.1-6 6.5-6s5.7 2 6.5 6" />
      </svg>
    )
  }

  if (icon === "leagues") {
    return (
      <svg {...commonProps}>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 12 8 4 8-4" />
        <path d="m4 17 8 4 8-4" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <path d="M7 3v4" />
      <path d="M17 3v4" />
      <path d="M4 8h16" />
      <rect x="4" y="5" width="16" height="16" rx="3" />
      <path d="M8 12h3" />
      <path d="M8 16h6" />
    </svg>
  )
}

export function PersonalMatchesNav() {
  const { tx } = useI18n()
  const pathname = usePathname()

  useEffect(() => {
    const root = document.documentElement
    root.dataset.bottomNavVisible = "true"

    return () => {
      delete root.dataset.bottomNavVisible
    }
  }, [])
  const isProfile = pathname === "/personal-matches/profile"
  const isChats = pathname === "/personal-matches/chats"
  const isMatchesActive =
    pathname === "/personal-matches" ||
    (pathname.startsWith("/personal-matches/") && !isProfile && !isChats)

  const items = [
    {
      href: "/leagues",
      label: "Competiciones",
      icon: "leagues" as const,
      active: isCompetitionOverviewRoute(pathname),
    },
    {
      href: "/personal-matches",
      label: "Mis partidos",
      icon: "matches" as const,
      active: isMatchesActive,
    },
    {
      href: "/personal-matches/chats",
      label: "Chats",
      icon: "chats" as const,
      active: isChats,
    },
    {
      href: "/personal-matches/profile",
      label: "Mi perfil",
      icon: "profile" as const,
      active: isProfile,
    },
  ]

  return (
    <nav
      aria-label={tx("Navegación global")}
      className="personal-matches-bottom-nav fixed bottom-0 left-1/2 z-50 w-full -translate-x-1/2 border-t border-neutral-200 bg-white/95 shadow-[0_-6px_18px_rgba(0,0,0,0.06)] backdrop-blur"
      style={{
        maxWidth: "var(--app-shell-width, 448px)",
        minHeight: "72px",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="app-bottom-nav-grid grid w-full grid-cols-4 bg-transparent text-center" style={{ minHeight: "72px", paddingTop: "7px", paddingBottom: "7px" }}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={
              item.active
                ? "app-bottom-nav-active flex min-w-0 flex-col items-center justify-center bg-neutral-950 text-center font-black text-white shadow-sm"
                : "app-bottom-nav-item flex min-w-0 flex-col items-center justify-center bg-transparent text-center font-black text-neutral-600 transition active:bg-neutral-100"
            }
            style={{ minHeight: "52px" }}
          >
            <PersonalNavIcon icon={item.icon} />
            <FitText className="w-[calc(100%+8px)] leading-none tracking-tighter">{tx(item.label)}</FitText>
          </Link>
        ))}
      </div>
    </nav>
  )
}
