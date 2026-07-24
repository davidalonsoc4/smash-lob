import Link from "next/link"
import type { ReactNode } from "react"

type EmptyStateAction = {
  label: string
  href?: string
  onClick?: () => void
}

type EmptyStateProps = {
  title: string
  description: string
  icon?: ReactNode
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  compact?: boolean
  className?: string
}

function EmptyStateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M8.5 12h7M12 8.5v7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function Action({ action, secondary = false }: { action: EmptyStateAction; secondary?: boolean }) {
  const className = secondary
    ? "rounded-2xl bg-neutral-100 px-3 py-2.5 text-center text-xs font-black text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
    : "rounded-2xl bg-neutral-950 px-3 py-2.5 text-center text-xs font-black text-white dark:bg-white dark:text-neutral-950"

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    )
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  )
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  compact = false,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-3xl border border-dashed border-neutral-200 bg-white/70 text-center shadow-sm dark:border-neutral-700 dark:bg-neutral-900/70 ${
        compact ? "px-3 py-4" : "px-5 py-6"
      } ${className}`}
    >
      <div className={`mx-auto grid place-items-center rounded-2xl bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300 ${compact ? "h-10 w-10" : "h-12 w-12"}`}>
        {icon ?? <EmptyStateIcon />}
      </div>
      <p className={`${compact ? "mt-3 text-sm" : "mt-4 text-base"} font-black text-neutral-950 dark:text-white`}>
        {title}
      </p>
      <p className="mx-auto mt-1.5 max-w-sm text-xs font-semibold leading-5 text-neutral-500 dark:text-neutral-400">
        {description}
      </p>
      {action || secondaryAction ? (
        <div className={`mx-auto mt-4 grid max-w-sm gap-2 ${action && secondaryAction ? "grid-cols-2" : "grid-cols-1"}`}>
          {action ? <Action action={action} /> : null}
          {secondaryAction ? <Action action={secondaryAction} secondary /> : null}
        </div>
      ) : null}
    </div>
  )
}
