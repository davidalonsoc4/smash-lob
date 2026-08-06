import { NextResponse } from "next/server"
import { APP_VERSION } from "@/lib/appVersion"
import { isObservabilityWebhookConfigured } from "@/lib/serverObservability"
import { isDistributedRateLimitConfigured } from "@/lib/serverRateLimit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getEnvironment(request: Request) {
  const hostname = new URL(request.url).hostname.toLowerCase()

  if (hostname === "pre.smashandlob.com") return "pre"
  if (["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname)) return "local"
  if (["smashandlob.com", "www.smashandlob.com"].includes(hostname)) return "prod"
  return "unknown"
}

export function GET(request: Request) {
  const environment = getEnvironment(request)

  return NextResponse.json(
    {
      status: "ok",
      version: APP_VERSION,
      environment,
      checkedAt: new Date().toISOString(),
      capabilities: {
        distributedRateLimit: isDistributedRateLimitConfigured(),
        observabilityWebhook: isObservabilityWebhookConfigured(),
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Smash-Lob-Version": APP_VERSION,
        "X-Smash-Lob-Environment": environment,
      },
    },
  )
}
