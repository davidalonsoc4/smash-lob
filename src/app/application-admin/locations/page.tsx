import { notFound } from "next/navigation"
import ApplicationAdminManagement from "@/components/application-admin/ApplicationAdminManagement"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
export const dynamic = "force-dynamic"
export default async function ApplicationLocationsPage() { const authResult = await requireAuthenticatedAppUser(); if (!authResult.ok || !authResult.actor.user.isSuperuser) notFound(); return <ApplicationAdminManagement mode="locations" /> }
