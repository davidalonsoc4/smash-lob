import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

const navigationItems = [
  { href: "/about", label: "Sobre la app" },
  { href: "/privacy", label: "Privacidad" },
  { href: "/terms", label: "Condiciones" },
]

export function PublicSiteLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-6 text-neutral-950 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <header className="rounded-[2rem] bg-neutral-950 p-5 text-white shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <Image
              src="/icon-192.png"
              alt="Logo de Smash & Lob"
              width={52}
              height={52}
              className="rounded-2xl bg-white"
              priority
            />
            <div>
              <p className="text-lg font-black tracking-tight">Smash & Lob</p>
              <p className="text-xs font-semibold text-neutral-400">
                Ligas privadas de pádel
              </p>
            </div>
          </div>

          <p className="mt-7 text-[10px] font-black uppercase tracking-[0.22em] text-neutral-400">
            {eyebrow}
          </p>
          <h1 className="mt-2 max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-neutral-300 sm:text-base">
            {description}
          </p>

          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Información pública">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-white/15 px-3 py-2 text-xs font-black text-white transition hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/"
              className="rounded-full bg-white px-3 py-2 text-xs font-black text-neutral-950 transition hover:bg-neutral-200"
            >
              Acceder a la app
            </Link>
          </nav>
        </header>

        <article className="mt-4 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-8">
          {children}
        </article>

        <footer className="px-3 py-5 text-center text-xs font-semibold leading-5 text-neutral-600">
          <p>Smash & Lob · Proyecto privado y no comercial para ligas de pádel.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href} className="underline underline-offset-2">
                {item.label}
              </Link>
            ))}
          </div>
        </footer>
      </div>
    </main>
  )
}

export function PublicDocumentSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-b border-neutral-100 py-5 first:pt-0 last:border-b-0 last:pb-0">
      <h2 className="text-lg font-black tracking-tight text-neutral-950">{title}</h2>
      <div className="mt-2 space-y-3 text-sm font-medium leading-6 text-neutral-600">
        {children}
      </div>
    </section>
  )
}
