import Link from "next/link"
import { AppCard } from "@/components/ui/AppCard"
import { createIncidenceCode, logServerEvent } from "@/lib/serverLog"

type AuthErrorPageProps = {
  searchParams: Promise<{ error?: string }>
}

const actionableMessages: Record<string, string> = {
  AccessDenied:
    "Tu cuenta no tiene acceso a este recurso. Comprueba la invitación o contacta con quien administra la liga.",
  Verification:
    "El enlace de acceso ya no es válido. Vuelve a iniciar sesión desde la invitación original.",
  OAuthAccountNotLinked:
    "Esta dirección ya está asociada a otro método de acceso. Usa la misma cuenta con la que entraste por primera vez.",
}

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const { error = "AuthError" } = await searchParams
  const incidenceCode = createIncidenceCode()

  logServerEvent("warn", "auth_error_page_rendered", {
    route: "/auth/error",
    method: "GET",
    operation: "auth_error",
    outcome: "shown",
    errorCode: error.slice(0, 80),
    incidenceCode,
  })

  const description =
    actionableMessages[error] ??
    "No hemos podido completar el acceso. Inténtalo de nuevo; si continúa, comparte el código de incidencia con el administrador."

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <AppCard className="w-full max-w-sm">
        <p className="text-sm font-medium text-neutral-500">Smash &amp; Lob</p>
        <h1 className="type-page-title mt-1 text-2xl font-black tracking-tight text-neutral-950">
          No se ha podido iniciar sesión
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-neutral-600">
          {description}
        </p>
        <p
          className="mt-4 rounded-2xl bg-neutral-100 px-3 py-3 text-xs font-black text-neutral-700"
          aria-live="polite"
        >
          Código de incidencia: {incidenceCode}
        </p>
        <div className="mt-4 grid gap-2">
          <Link
            href="/"
            className="inline-flex rounded-2xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white items-center justify-center"
          >
            Volver a intentarlo
          </Link>
          <Link
            href="/about"
            className="inline-flex rounded-2xl bg-neutral-100 px-3 py-2.5 text-center text-sm font-black text-neutral-800 items-center justify-center"
          >
            Ayuda sobre la aplicación
          </Link>
        </div>
      </AppCard>
    </main>
  )
}
