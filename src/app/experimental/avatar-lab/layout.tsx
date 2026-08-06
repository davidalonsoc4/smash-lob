import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { isAvatarLabRequestContext } from "@/lib/serverAvatarLabAccess"

export const metadata: Metadata = {
  title: "Laboratorio de avatares",
  robots: { index: false, follow: false },
}

export default async function AvatarLabLayout({
  children,
}: {
  children: ReactNode
}) {
  if (!(await isAvatarLabRequestContext())) notFound()
  return children
}
