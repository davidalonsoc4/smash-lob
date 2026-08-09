import type { Metadata } from "next"
import Link from "next/link"
import { PublicDocumentSection, PublicSiteLayout } from "@/components/legal/PublicSiteLayout"

export const metadata: Metadata = {
  title: "Sobre Smash & Lob",
  description:
    "Información pública sobre Smash & Lob, una aplicación privada para organizar ligas de pádel.",
  alternates: { canonical: "/about" },
}

const features = [
  {
    title: "Calendario y jornadas",
    description:
      "Organiza encuentros, fechas, disponibilidad de jugadores y evolución de cada jornada.",
  },
  {
    title: "Resultados y clasificación",
    description:
      "Registra marcadores, calcula puntos y consulta el ranking actualizado de la temporada.",
  },
  {
    title: "Gestión privada por invitación",
    description:
      "Cada liga controla sus participantes, administradores, espectadores y reglas propias.",
  },
  {
    title: "Estadísticas y resúmenes",
    description:
      "Consulta rendimiento, cara a cara, MVP y resúmenes finales preparados para compartir.",
  },
]

export default function AboutPage() {
  return (
    <PublicSiteLayout
      eyebrow="Información pública"
      title="Una herramienta sencilla para organizar ligas privadas de pádel"
      description="Smash & Lob reúne calendario, resultados, clasificación, disponibilidad, avisos y estadísticas para que una liga entre amigos pueda gestionarse desde un único sitio."
    >
      <PublicDocumentSection title="Qué es Smash & Lob">
        <p>
          Smash & Lob es una aplicación web privada y no comercial diseñada para pequeñas
          ligas de pádel. El acceso se realiza con una cuenta de Google y, salvo los
          administradores autorizados para crear ligas, requiere una invitación a una liga
          concreta.
        </p>
        <p>
          La aplicación no organiza partidos públicos ni vende plazas. Cada liga define sus
          propias normas, participantes, calendario y forma de gestionar pagos entre sus
          miembros.
        </p>
      </PublicDocumentSection>

      <PublicDocumentSection title="Funciones principales">
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl bg-neutral-100 p-4">
              <h3 className="type-panel-title font-black text-neutral-950">{feature.title}</h3>
              <p className="mt-1 text-xs font-semibold leading-5 text-neutral-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </PublicDocumentSection>

      <PublicDocumentSection title="Acceso y transparencia">
        <p>
          El inicio de sesión con Google se utiliza exclusivamente para identificar la cuenta,
          asociarla con las ligas autorizadas y mantener una sesión segura. Smash & Lob no
          solicita acceso a Gmail, Google Drive, calendarios ni otros contenidos privados de la
          cuenta de Google.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/privacy"
            className="rounded-full bg-neutral-950 px-4 py-2 text-xs font-black text-white"
          >
            Política de privacidad
          </Link>
          <Link
            href="/terms"
            className="rounded-full bg-neutral-200 px-4 py-2 text-xs font-black text-neutral-950"
          >
            Condiciones de uso
          </Link>
        </div>
      </PublicDocumentSection>
    </PublicSiteLayout>
  )
}
