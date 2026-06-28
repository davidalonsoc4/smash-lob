"use client"

import { useRouter } from "next/navigation"

type BackButtonProps = {
  fallbackHref: string
  label: string
}

export function BackButton({ fallbackHref, label }: BackButtonProps) {
  const router = useRouter()

  function handleBack() {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push(fallbackHref)
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="text-sm font-semibold text-neutral-500"
    >
      {label}
    </button>
  )
}
