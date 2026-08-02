"use client"

import { AppErrorView } from "@/components/errors/AppErrorView"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body>
        <AppErrorView
          title="Smash & Lob necesita recargarse"
          description="Se ha producido un error inesperado. Puedes reintentar sin perder los datos ya guardados."
          incidenceCode={error.digest ? `SL-${error.digest.slice(0, 8).toUpperCase()}` : undefined}
          onRetry={reset}
        />
      </body>
    </html>
  )
}
