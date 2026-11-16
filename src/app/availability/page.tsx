import { redirect } from "next/navigation"

/** La disponibilidad vive en Ajustes → Mi perfil; esta ruta se conserva para enlaces antiguos. */
export default function AvailabilityPage() {
  redirect("/settings/profile#availability")
}
