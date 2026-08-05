import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import { isPreproductionApp } from "@/lib/appVariant"

export const metadata: Metadata = {
  title: "Laboratorio de avatares",
  robots: { index: false, follow: false },
}

export default function AvatarLabLayout({ children }: { children: ReactNode }) {
  if (!isPreproductionApp()) notFound()
  return children
}
