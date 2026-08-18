import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import {
  decodePendingAccessDestination,
  PENDING_ACCESS_INTENT_COOKIE,
} from "@/lib/pendingAccessIntent"

export const dynamic = "force-dynamic"

export default async function LaunchPage() {
  const cookieStore = await cookies()
  const pendingDestination = decodePendingAccessDestination(
    cookieStore.get(PENDING_ACCESS_INTENT_COOKIE)?.value,
  )

  redirect(pendingDestination ?? "/")
}
