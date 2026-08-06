import { NextResponse } from "next/server"
import { APP_VERSION } from "@/lib/appVersion"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getEnvironment(request: Request) {
  const hostname = new URL(request.url).hostname.toLowerCase()

  if (hostname === "pre.smashandlob.com") {
    return "pre"
  }

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0"
  ) {
    return "local"
  }

  if (hostname === "smashandlob.com" || hostname === "www.smashandlob.com") {
    return "prod"
  }

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
