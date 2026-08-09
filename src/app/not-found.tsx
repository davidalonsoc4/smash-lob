import Link from "next/link"
import { AppCard } from "@/components/ui/AppCard"

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <AppCard className="w-full max-w-sm">
        <p className="text-sm font-black text-neutral-400">404</p>
        <h1 className="type-page-title mt-1 text-2xl font-black tracking-tight">
          Esta página no existe
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-neutral-500">
          El enlace puede haber caducado o la dirección no es correcta.
        </p>
        <Link
          href="/"
          className="mt-4 block rounded-2xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white"
        >
          Ir al inicio
        </Link>
      </AppCard>
    </main>
  )
}
