"use client"

import { useRouter } from "next/navigation"
import { type MouseEvent } from "react"

type BackButtonProps = {
  fallbackHref: string
  label: string
}

export function BackButton({ fallbackHref, label }: BackButtonProps) {
  const router = useRouter()

  function handleBack(event: MouseEvent<HTMLAnchorElement>) {
    const currentHref = window.location.href
    const referrerUrl = document.referrer
      ? new URL(document.referrer)
      : null
    const canGoBackInsideApp =
      referrerUrl?.origin === window.location.origin &&
      referrerUrl.href !== currentHref

    if (canGoBackInsideApp) {
      event.preventDefault()
      router.back()
    }
  }

  return (
    <a
      href={fallbackHref}
      onClick={handleBack}
      className="text-sm font-semibold text-neutral-500"
    >
      {label}
    </a>
  )
}
