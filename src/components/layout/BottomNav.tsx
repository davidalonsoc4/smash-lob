"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { ANNOUNCEMENTS_REFRESH_EVENT } from "@/lib/announcements"
import { useI18n } from "@/i18n/I18nProvider"
import { CHAT_UNREAD_LOCAL_REFRESH_EVENT, subscribeChatRealtime } from "@/lib/chatRealtimeClient"

type NavItem = {
  href: string
  label: string
  icon: "home" | "ranking" | "matches" | "chats" | "profile" | "settings"
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
    className: "app-bottom-nav-icon",
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

  if (icon === "chats") {
    return <svg {...commonProps}><path d="M5 18.5 3.5 21l3.7-1A9 9 0 1 0 5 18.5Z" /><path d="M8 10.5h8M8 14h5" /></svg>
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

export function BottomNav({ homeOnlyLocked = false }: { homeOnlyLocked?: boolean }) {
  const pathname = usePathname()
  const { t } = useI18n()
  const { activeLeagueId } = useActiveLeague()
  const { isLeagueSpectator, refreshLeagueAccess } = useLeagueAccess()
  const { activeSeason } = useCurrentLeagueData()
  const spectatorMode = isLeagueSpectator(activeLeagueId)
  const [chatUnreadState, setChatUnreadState] = useState<{ scope: string; count: number }>({ scope: "", count: 0 })
  const isSoftRefreshingRef = useRef(false)
  const lastSoftRefreshAtRef = useRef<number | null>(null)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.bottomNavVisible = "true"
    return () => { delete root.dataset.bottomNavVisible }
  }, [])

  const softRefreshHomeData = useCallback(async () => {
    if (isSoftRefreshingRef.current) {
      return
    }

    isSoftRefreshingRef.current = true

    try {
      await refreshLeagueAccess()
      window.dispatchEvent(new Event(ANNOUNCEMENTS_REFRESH_EVENT))
      lastSoftRefreshAtRef.current = Date.now()
    } finally {
      isSoftRefreshingRef.current = false
    }
  }, [refreshLeagueAccess])

  useEffect(() => {
    lastSoftRefreshAtRef.current = Date.now()

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") {
        return
      }

      const lastSoftRefreshAt = lastSoftRefreshAtRef.current

      if (lastSoftRefreshAt === null) {
        lastSoftRefreshAtRef.current = Date.now()
        return
      }

      const dataAge = Date.now() - lastSoftRefreshAt

      if (dataAge >= 30_000) {
        void softRefreshHomeData()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [softRefreshHomeData])

  const chatUnreadScope = activeLeagueId && activeSeason.id ? `${activeLeagueId}:${activeSeason.id}` : ""
  const chatUnread = !spectatorMode && chatUnreadState.scope === chatUnreadScope ? chatUnreadState.count : 0

  useEffect(() => {
    if (spectatorMode || !activeLeagueId || !activeSeason.id) return
    let active = true
    let realtimeTopic: string | null = null
    let unsubscribeRealtime: () => void = () => undefined
    const refresh = async () => {
      const response = await fetch(`/api/chats?leagueId=${encodeURIComponent(activeLeagueId)}&seasonId=${encodeURIComponent(activeSeason.id)}`, { cache: "no-store" }).catch(() => null)
      if (!active || !response?.ok) return
      const data = await response.json().catch(() => null)
      if (!active) return
      setChatUnreadState({ scope: `${activeLeagueId}:${activeSeason.id}`, count: Number(data?.totalUnread) || 0 })
      const nextTopic = typeof data?.realtimeTopic === "string" ? data.realtimeTopic : null
      if (nextTopic === realtimeTopic) return
      unsubscribeRealtime()
      realtimeTopic = nextTopic
      unsubscribeRealtime = subscribeChatRealtime(realtimeTopic, () => { if (!document.hidden) void refresh() })
    }
    const handleVisibility = () => { if (!document.hidden) void refresh() }
    const handleLocalUnreadRefresh = () => { void refresh() }
    const initialTimer = window.setTimeout(() => { void refresh() }, 0)
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener(CHAT_UNREAD_LOCAL_REFRESH_EVENT, handleLocalUnreadRefresh)
    return () => {
      active = false
      window.clearTimeout(initialTimer)
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener(CHAT_UNREAD_LOCAL_REFRESH_EVENT, handleLocalUnreadRefresh)
      unsubscribeRealtime()
    }
  }, [activeLeagueId, activeSeason.id, pathname, spectatorMode])

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
      href: "/chats",
      label: t.nav.chats,
      icon: "chats",
      isActive: (currentPathname) => currentPathname.startsWith("/chats"),
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
      label: t.nav.account,
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
      data-tour="bottom-navigation"
      className="app-bottom-nav fixed bottom-0 left-1/2 z-50 w-full -translate-x-1/2 border-t border-neutral-200 bg-white/95 shadow-[0_-6px_18px_rgba(0,0,0,0.06)] backdrop-blur"
      style={{
        minHeight: "72px",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className={`app-bottom-nav-grid grid w-full ${spectatorMode ? "grid-cols-4" : "grid-cols-5"} bg-transparent`}
        style={{
          minHeight: "72px",
          paddingTop: "7px",
          paddingBottom: "7px",
        }}
      >
        {navItems.map((item) => {
          const isActive = item.isActive(pathname)
          const isDisabled = homeOnlyLocked && item.href !== "/"
          const content = (
            <>
              <span className="relative"><NavIcon icon={item.icon} />{!homeOnlyLocked && item.icon === "chats" && chatUnread > 0 ? <span className="absolute -right-3 -top-2 min-w-4 rounded-full bg-red-600 px-1 text-center text-xs font-black leading-4 text-white">{chatUnread > 99 ? "99+" : chatUnread}</span> : null}</span>
              <span className="leading-none">{item.label}</span>
            </>
          )

          if (isDisabled) {
            return (
              <button
                key={item.href}
                type="button"
                disabled
                aria-disabled="true"
                title="Disponible cuando comience la temporada"
                className="app-bottom-nav-item flex flex-col items-center justify-center bg-transparent text-center font-black text-neutral-400 opacity-40"
                style={{ minHeight: "52px" }}
              >
                {content}
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(event) => {
                if (item.href !== "/") {
                  return
                }

                void softRefreshHomeData()

                if (pathname === "/") {
                  event.preventDefault()
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }
              }}
              className={
                isActive
                  ? "app-bottom-nav-active flex flex-col items-center justify-center bg-neutral-950 text-center font-black text-white shadow-sm"
                  : "app-bottom-nav-item flex flex-col items-center justify-center bg-transparent text-center font-black text-neutral-600 transition active:bg-neutral-100"
              }
              style={{ minHeight: "52px" }}
            >
              {content}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
