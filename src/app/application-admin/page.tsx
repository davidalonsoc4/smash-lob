import Link from "next/link"
import { notFound } from "next/navigation"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
export const dynamic = "force-dynamic"
const items = [
  { href: "/application-admin/users", title: "Usuarios", description: "Gestiona cuentas globales, permisos, suspensiones, dispositivos y propiedad de ligas." },
  { href: "/application-admin/locations", title: "Ubicaciones", description: "Consulta y elimina lugares del catálogo global cuando no estén en uso." },
  { href: "/application-admin/suggestions", title: "Sugerencias recibidas", description: "Revisa, clasifica y anota las propuestas enviadas por los usuarios." },
]
export default async function ApplicationManagementPage() {
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok || !authResult.actor.user.isSuperuser) notFound()
  return <div className="compact-page space-y-3"><header className="app-page-header"><BackButton fallbackHref="/settings" label="Volver" /><h1 className="type-page-title font-black">Gestión de la app</h1><p className="mt-0.5 text-xs font-black uppercase tracking-[0.16em] text-red-600">Superusuario</p><p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">Herramientas globales de administración de Smash & Lob.</p></header><div className="space-y-2">{items.map((item) => <Link key={item.href} href={item.href} className="block"><AppCard className="!p-3 transition active:scale-[0.99]"><div className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="type-panel-title font-black">{item.title}</p><p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">{item.description}</p></div><ClickableChevron className="shrink-0" /></div></AppCard></Link>)}</div></div>
}
