import type { Metadata } from "next"
import { PublicDocumentSection, PublicSiteLayout } from "@/components/legal/PublicSiteLayout"

export const metadata: Metadata = {
  title: "Condiciones de uso",
  description: "Condiciones de uso de la aplicación privada Smash & Lob.",
  alternates: { canonical: "/terms" },
}

export default function TermsPage() {
  const contactEmail = process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL?.trim() || null

  return (
    <PublicSiteLayout
      eyebrow="Última actualización: 30 de julio de 2026"
      title="Condiciones de uso"
      description="Estas condiciones regulan el acceso y uso de Smash & Lob como herramienta privada de organización de ligas de pádel."
    >
      <PublicDocumentSection title="1. Naturaleza del servicio">
        <p>
          Smash & Lob es una aplicación privada y no comercial para organizar ligas de pádel.
          Permite gestionar participantes, calendario, disponibilidad, resultados,
          clasificaciones, reconocimientos, comunicaciones y anotaciones económicas internas.
        </p>
        <p>
          La aplicación no actúa como club deportivo, organizador profesional, entidad de pago,
          árbitro oficial ni aseguradora de las actividades realizadas por los miembros de una
          liga.
        </p>
      </PublicDocumentSection>

      <PublicDocumentSection title="2. Acceso y cuenta">
        <p>
          El acceso requiere una cuenta de Google válida. La mayoría de las personas usuarias
          necesitan además una invitación de una liga. Cada persona es responsable de mantener
          segura su cuenta y de no facilitar a terceros enlaces o códigos de acceso que deban ser
          privados.
        </p>
        <p>
          La información de perfil debe ser veraz y suficiente para que los demás participantes
          puedan identificar correctamente a la persona dentro de la competición.
        </p>
      </PublicDocumentSection>

      <PublicDocumentSection title="3. Administración de las ligas">
        <p>
          Cada liga es gestionada por sus administradores, que deciden sus normas, participantes,
          jornadas, resultados, permisos y comunicaciones. Los miembros deben plantear ante esos
          administradores cualquier desacuerdo deportivo u organizativo.
        </p>
        <p>
          Los administradores se comprometen a utilizar los datos de los participantes únicamente
          para gestionar la liga y a no conceder accesos innecesarios.
        </p>
      </PublicDocumentSection>

      <PublicDocumentSection title="4. Uso permitido">
        <p>No está permitido:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Suplantar a otras personas o acceder a cuentas, ligas o datos sin autorización.</li>
          <li>Manipular resultados, votaciones, clasificaciones o registros de actividad.</li>
          <li>Introducir contenido ofensivo, ilegal, engañoso o que vulnere derechos de terceros.</li>
          <li>Intentar dañar, automatizar abusivamente o eludir las medidas de seguridad.</li>
          <li>Utilizar datos obtenidos en la aplicación para publicidad o finalidades ajenas a la liga.</li>
        </ul>
      </PublicDocumentSection>

      <PublicDocumentSection title="5. Resultados, reservas y pagos">
        <p>
          Los resultados y estadísticas dependen de la información introducida por los miembros
          y administradores. Smash & Lob facilita cálculos y registros, pero no garantiza que los
          datos aportados sean correctos ni resuelve disputas deportivas.
        </p>
        <p>
          Las cantidades mostradas en reservas o pagos son anotaciones informativas entre los
          miembros. La aplicación no custodia dinero, no ejecuta transferencias y no sustituye
          justificantes de pago ni acuerdos entre las personas implicadas.
        </p>
      </PublicDocumentSection>

      <PublicDocumentSection title="6. Disponibilidad y cambios del servicio">
        <p>
          El servicio se ofrece según disponibilidad y puede experimentar interrupciones,
          mantenimiento, errores o cambios funcionales. Se procurará proteger la información y
          corregir incidencias razonablemente, pero no se garantiza disponibilidad permanente ni
          ausencia total de fallos.
        </p>
      </PublicDocumentSection>

      <PublicDocumentSection title="7. Contenidos e imágenes">
        <p>
          Cada persona debe contar con autorización para subir imágenes, nombres, logotipos o
          cualquier otro contenido que incorpore a la aplicación. Los contenidos de una liga
          siguen perteneciendo a sus titulares; se autoriza únicamente su tratamiento técnico
          para prestar las funciones solicitadas.
        </p>
      </PublicDocumentSection>

      <PublicDocumentSection title="8. Suspensión y eliminación">
        <p>
          Una cuenta o un acceso a una liga puede suspenderse o retirarse ante incumplimientos,
          riesgos de seguridad, abuso del servicio o petición del administrador competente. La
          eliminación de una cuenta no implica necesariamente borrar resultados históricos que
          deban conservarse para mantener la coherencia de una competición, aunque podrán
          anonimizarse cuando sea apropiado.
        </p>
      </PublicDocumentSection>

      <PublicDocumentSection title="9. Responsabilidad">
        <p>
          La práctica deportiva, la reserva de pistas, los desplazamientos, los pagos y los
          acuerdos entre participantes se realizan bajo responsabilidad de las personas
          implicadas. Smash & Lob no responde de lesiones, cancelaciones, conflictos, pérdidas
          económicas ni decisiones adoptadas por administradores o jugadores fuera del
          funcionamiento técnico de la aplicación.
        </p>
      </PublicDocumentSection>

      <PublicDocumentSection title="10. Legislación, cambios y contacto">
        <p>
          Estas condiciones se interpretan conforme a la legislación española. Podrán
          actualizarse para reflejar cambios funcionales, de seguridad o normativos; la fecha de
          la versión vigente aparecerá al inicio del documento.
        </p>
        {contactEmail ? (
          <p>
            Para consultas sobre estas condiciones, escribe a{" "}
            <a
              href={`mailto:${contactEmail}`}
              className="font-black text-neutral-950 underline underline-offset-2"
            >
              {contactEmail}
            </a>
            .
          </p>
        ) : (
          <p>
            Para consultas sobre estas condiciones, contacta con el administrador que facilitó el
            acceso a tu liga mediante el mismo canal de invitación.
          </p>
        )}
      </PublicDocumentSection>
    </PublicSiteLayout>
  )
}
