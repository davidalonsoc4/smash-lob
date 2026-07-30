import type { Metadata } from "next"
import { PublicDocumentSection, PublicSiteLayout } from "@/components/legal/PublicSiteLayout"

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Política de privacidad y protección de datos de Smash & Lob.",
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  const responsibleName =
    process.env.NEXT_PUBLIC_LEGAL_RESPONSIBLE_NAME?.trim() ||
    "la administración de Smash & Lob"
  const contactEmail = process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL?.trim() || null

  return (
    <PublicSiteLayout
      eyebrow="Última actualización: 30 de julio de 2026"
      title="Política de privacidad"
      description="Esta política explica qué datos utiliza Smash & Lob, para qué se emplean y cómo pueden ejercer sus derechos las personas usuarias."
    >
      <PublicDocumentSection title="1. Responsable y contacto">
        <p>
          El responsable del tratamiento es {responsibleName}, dentro del proyecto privado y
          no comercial Smash & Lob, destinado a la organización de ligas de pádel.
        </p>
        {contactEmail ? (
          <p>
            Para consultas o para ejercer derechos de protección de datos, escribe a{" "}
            <a
              href={`mailto:${contactEmail}`}
              className="font-black text-neutral-950 underline underline-offset-2"
            >
              {contactEmail}
            </a>
            . La solicitud debe permitir identificar la cuenta afectada.
          </p>
        ) : (
          <p>
            Para consultas o para ejercer derechos de protección de datos, la persona usuaria
            puede contactar con el administrador que facilitó su acceso a la liga, respondiendo al
            mismo canal de invitación. Las personas con acceso a la aplicación también pueden
            utilizar el buzón de sugerencias para solicitar que se les contacte.
          </p>
        )}
      </PublicDocumentSection>

      <PublicDocumentSection title="2. Datos que se tratan">
        <p>Smash & Lob puede tratar las siguientes categorías de información:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Nombre, dirección de correo electrónico y foto de perfil facilitados por Google.</li>
          <li>Nombre visible, avatar y preferencias configuradas dentro de la aplicación.</li>
          <li>Disponibilidad horaria y zona horaria indicadas voluntariamente.</li>
          <li>Pertenencia a ligas, roles, invitaciones y permisos de acceso.</li>
          <li>Partidos, resultados, clasificaciones, estadísticas, votos y reconocimientos MVP.</li>
          <li>Reservas, importes y estados de pago anotados por los miembros de una liga.</li>
          <li>Preferencias de notificaciones y datos técnicos necesarios para avisos push.</li>
          <li>Sugerencias, incidencias y registros de actividad relacionados con la gestión de la liga.</li>
        </ul>
      </PublicDocumentSection>

      <PublicDocumentSection title="3. Datos de Google">
        <p>
          El acceso con Google se limita a los datos básicos necesarios para identificar a la
          persona usuaria: nombre, correo electrónico, imagen de perfil e identificadores de
          autenticación asociados. Smash & Lob no solicita acceso a Gmail, Google Drive,
          Google Calendar, contactos ni otros contenidos de la cuenta.
        </p>
        <p>
          Los datos recibidos de Google no se venden, no se utilizan con fines publicitarios y
          no se comparten para crear perfiles comerciales.
        </p>
      </PublicDocumentSection>

      <PublicDocumentSection title="4. Finalidades y bases del tratamiento">
        <p>Los datos se utilizan para:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Autenticar cuentas y mantener sesiones seguras.</li>
          <li>Permitir la participación y administración de ligas privadas.</li>
          <li>Gestionar calendarios, resultados, clasificaciones, pagos y estadísticas.</li>
          <li>Enviar notificaciones solicitadas y avisos relevantes de la competición.</li>
          <li>Prevenir abusos, investigar incidencias y mantener la seguridad del servicio.</li>
          <li>Atender consultas, sugerencias y solicitudes relacionadas con la cuenta.</li>
        </ul>
        <p>
          El tratamiento se basa en la prestación del servicio solicitado por la persona
          usuaria, en el interés legítimo de mantener una liga privada operativa y segura y,
          cuando corresponde, en el consentimiento, por ejemplo para activar notificaciones
          push en un dispositivo.
        </p>
      </PublicDocumentSection>

      <PublicDocumentSection title="5. Proveedores y destinatarios">
        <p>
          Smash & Lob utiliza Google para la autenticación, Vercel para alojar y desplegar la
          aplicación y Supabase para almacenar y procesar los datos de la aplicación. Estos
          proveedores actúan conforme a sus propias condiciones y compromisos de protección de
          datos.
        </p>
        <p>
          Dentro de cada liga, determinados datos deportivos y organizativos pueden ser visibles
          para otros participantes, espectadores autorizados o administradores según los permisos
          configurados. No se ceden datos a anunciantes ni se venden bases de datos.
        </p>
      </PublicDocumentSection>

      <PublicDocumentSection title="6. Transferencias internacionales">
        <p>
          Algunos proveedores tecnológicos pueden procesar información fuera del Espacio
          Económico Europeo. Cuando esto sucede, el tratamiento se realiza conforme a los
          mecanismos de garantía aplicables del proveedor, como decisiones de adecuación o
          cláusulas contractuales tipo.
        </p>
      </PublicDocumentSection>

      <PublicDocumentSection title="7. Conservación">
        <p>
          Los datos se conservan mientras la cuenta o las ligas asociadas permanezcan activas y
          durante el tiempo razonablemente necesario para mantener el historial deportivo,
          resolver incidencias, cumplir obligaciones aplicables y proteger la seguridad del
          servicio. Las solicitudes de supresión se valorarán teniendo en cuenta la información
          compartida que forme parte del historial de una liga.
        </p>
      </PublicDocumentSection>

      <PublicDocumentSection title="8. Derechos de las personas usuarias">
        <p>
          Se puede solicitar acceso, rectificación, supresión, limitación, oposición y, cuando
          proceda, portabilidad de los datos. La solicitud debe permitir identificar la cuenta
          afectada. También puede presentarse una reclamación ante la Agencia Española de
          Protección de Datos.
        </p>
      </PublicDocumentSection>

      <PublicDocumentSection title="9. Cookies, almacenamiento local y notificaciones">
        <p>
          La aplicación utiliza cookies técnicas de autenticación y almacenamiento local para
          recordar preferencias como el tema visual, la liga activa o determinados estados de
          interfaz. Son elementos necesarios para el funcionamiento del servicio y no se usan
          para publicidad comportamental.
        </p>
        <p>
          Las notificaciones push solo se activan tras una acción expresa en un dispositivo y
          pueden desactivarse desde la aplicación o desde la configuración del navegador.
        </p>
      </PublicDocumentSection>

      <PublicDocumentSection title="10. Seguridad, menores y cambios">
        <p>
          Se aplican medidas técnicas y organizativas razonables para limitar accesos no
          autorizados y separar los entornos de producción y pruebas. Ningún sistema puede
          garantizar una seguridad absoluta.
        </p>
        <p>
          Smash & Lob no está dirigido a menores de 14 años. Esta política puede actualizarse
          cuando cambien las funciones, los proveedores o las obligaciones aplicables; la fecha
          de la versión vigente aparecerá al inicio del documento.
        </p>
      </PublicDocumentSection>
    </PublicSiteLayout>
  )
}
