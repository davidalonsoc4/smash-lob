import type { ReactNode } from "react"

export type SettingsSectionIconName =
  | "profile"
  | "language"
  | "appearance"
  | "notifications"
  | "availability"
  | "leagues"
  | "join"
  | "create"
  | "payments"
  | "activity"
  | "admin"
  | "applicationAdmin"
  | "suggestions"
  | "help"
  | "changelog"
  | "about"
  | "avatar"
  | "matches"
  | "competition"

const paths: Record<SettingsSectionIconName, ReactNode> = {
  profile: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c.9-4 3.4-6 7.5-6s6.6 2 7.5 6" />
    </>
  ),
  language: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.2 2.4 3.2 5.2 3.2 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.2-5.2-3.2-8.5S9.8 5.9 12 3.5Z" />
    </>
  ),
  appearance: (
    <>
      <path d="M12 3v2" />
      <path d="M12 19v2" />
      <path d="m4.93 4.93 1.42 1.42" />
      <path d="m17.65 17.65 1.42 1.42" />
      <path d="M3 12h2" />
      <path d="M19 12h2" />
      <path d="m4.93 19.07 1.42-1.42" />
      <path d="m17.65 6.35 1.42-1.42" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  notifications: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  availability: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 9h18" />
      <path d="m8 14 2 2 5-5" />
    </>
  ),
  leagues: (
    <>
      <path d="M4 5h16v14H4z" />
      <path d="M8 9h8M8 13h5" />
    </>
  ),
  join: (
    <>
      <path d="M15 4h5v16h-5" />
      <path d="M4 12h12M11 7l5 5-5 5" />
    </>
  ),
  create: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  payments: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18M7 15h3" />
    </>
  ),
  activity: (
    <>
      <path d="M4 19V5M4 19h16" />
      <path d="m7 15 3-4 3 2 5-6" />
    </>
  ),
  admin: (
    <>
      <path d="M12 3 20 6v5c0 5-3.2 8-8 10-4.8-2-8-5-8-10V6l8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  applicationAdmin: (
    <>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
    </>
  ),
  suggestions: (
    <>
      <path d="M5 18.5A8.5 8.5 0 1 1 19.5 5 8.5 8.5 0 0 1 13 20l-3.5-1.5L5 20v-1.5Z" />
      <path d="M8 10h8M8 14h5" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.3 2.3 0 1 1 3.7 1.8c-1 .7-1.5 1.2-1.5 2.7" />
      <path d="M12 17h.01" />
    </>
  ),
  changelog: (
    <>
      <path d="M5 4h14v16H5z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  about: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  avatar: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 20c.7-3.5 3-5.5 7-5.5s6.3 2 7 5.5" />
      <path d="M4 5h3M17 5h3" />
    </>
  ),
  matches: (
    <>
      <path d="M4 6h16v12H4z" />
      <path d="M8 10h8M8 14h5" />
    </>
  ),
  competition: (
    <>
      <path d="M12 3 20 7v5c0 4.5-3 7.5-8 9-5-1.5-8-4.5-8-9V7l8-4Z" />
      <path d="M8 12h8M12 8v8" />
    </>
  ),
}

export function SettingsSectionIcon({ name }: { name: SettingsSectionIconName }) {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-xl bg-neutral-100 text-neutral-700">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {paths[name]}
      </svg>
    </span>
  )
}
