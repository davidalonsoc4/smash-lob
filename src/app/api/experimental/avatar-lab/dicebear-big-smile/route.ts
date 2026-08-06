import { NextResponse } from "next/server"
import { buildDiceBearBigSmileUrl } from "@/features/avatar-lab/bigSmileUrl"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { isAvatarLabRequest } from "@/lib/avatarLabAccess"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"

export const runtime = "nodejs"

function fallbackSvg(message: string) {
  const safe = message.replace(/[<>&"']/g, "")
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="#dbeafe"/><rect x="16" y="16" width="224" height="224" rx="22" fill="#fff" stroke="#d6cec1" stroke-width="4"/><text x="128" y="112" text-anchor="middle" font-family="system-ui,sans-serif" font-size="17" font-weight="700" fill="#9f1239">Big Smile no disponible</text><text x="128" y="143" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="#57534e">${safe}</text></svg>`
}

function svgResponse(svg: string, status = 200) {
  return new NextResponse(svg, {
    status,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control":
        status === 200
          ? "private, max-age=3600, stale-while-revalidate=86400"
          : "no-store",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
      "X-Avatar-Renderer": "dicebear-big-smile-10.x",
    },
  })
}

function sanitizeSvg(svg: string) {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
}

export async function GET(request: Request) {
  if (!isAvatarLabRequest(request)) {
    return new NextResponse(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    })
  }

  const rateLimited = enforceRequestRateLimit({
    request,
    scope: "avatar_lab_big_smile",
    limit: 120,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return svgResponse(
      fallbackSvg("Inicia sesión para usar el laboratorio"),
      authResult.status,
    )
  }

  const url = new URL(request.url)
  const upstream = buildDiceBearBigSmileUrl(url.searchParams)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)

  try {
    const response = await fetch(upstream, {
      headers: { Accept: "image/svg+xml" },
      signal: controller.signal,
      next: { revalidate: 3600 },
    })
    if (!response.ok) return svgResponse(fallbackSvg(`Respuesta HTTP ${response.status}`), 502)
    const svg = await response.text()
    if (!svg.includes("<svg")) return svgResponse(fallbackSvg("Respuesta SVG inválida"), 502)
    return svgResponse(sanitizeSvg(svg))
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "Tiempo de espera agotado"
      : "No se pudo conectar"
    return svgResponse(fallbackSvg(message), 502)
  } finally {
    clearTimeout(timeout)
  }
}
