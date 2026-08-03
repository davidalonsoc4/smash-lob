import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AvatarLabClient } from "@/features/avatar-lab/components/AvatarLabClient"
import { isPreproductionApp } from "@/lib/appVariant"

export const metadata: Metadata = {
  title: "Avatar Lab DEMO",
  robots: { index: false, follow: false },
}

export default function AvatarLabPage() {
  if (!isPreproductionApp()) notFound()
  return <AvatarLabClient />
}
