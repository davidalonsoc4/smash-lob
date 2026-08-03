"use client"

import { useEffect } from "react"
import { AppErrorView } from "@/components/errors/AppErrorView"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("app_route_error", {
      digest: error.digest ?? "unknown",
    })
  }, [error])

  return (
    <AppErrorView
      title="Algo no ha salido bien"
      description="No se ha podido cargar esta pantalla. Revisa tu conexión y vuelve a intentarlo."
      incidenceCode={error.digest ? `SL-${error.digest.slice(0, 8).toUpperCase()}` : undefined}
      onRetry={reset}
    />
  )
}
