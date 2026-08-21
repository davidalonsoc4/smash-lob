"use client"

import { useRouter } from "next/navigation"
import { type MouseEvent } from "react"

type BackButtonProps = {
  fallbackHref: string
  label: string
  returnToParam?: string
}

function getSafeInternalReturnTo(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value === "/settings" ||
    value.startsWith("/settings/")
  ) {
    return null
  }

  return value
}

export function BackButton({ fallbackHref, label, returnToParam }: BackButtonProps) {
  const router = useRouter()

  function handleBack(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()

    const currentUrl = new URL(window.location.href)
    const explicitReturnTo = returnToParam
      ? getSafeInternalReturnTo(currentUrl.searchParams.get(returnToParam))
      : null

    if (explicitReturnTo) {
      router.replace(explicitReturnTo)
      return
    }

    const currentHref = currentUrl.href
    const referrerUrl = document.referrer
      ? new URL(document.referrer)
      : null
    const canGoBackInsideApp =
      referrerUrl?.origin === window.location.origin &&
      referrerUrl.href !== currentHref

    if (canGoBackInsideApp) {
      router.back()
      return
    }

    router.push(fallbackHref)
  }

  return (
    <a
      href={fallbackHref}
      onClick={handleBack}
      className="app-top-back-control text-sm font-semibold text-neutral-500"
    >
      {label}
    </a>
  )
}
