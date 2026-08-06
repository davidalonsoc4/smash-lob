import { NextResponse } from "next/server"
import {
  NOTION_AVATAR_PART_ORDER,
  type NotionAvatarPart,
} from "@/features/avatar-lab/notionAvatarModel"
import { notionAvatarRecipeFromSearchParams } from "@/features/avatar-lab/notionAvatarUrl"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { isAvatarLabRequest } from "@/lib/avatarLabAccess"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"

export const runtime = "nodejs"

// Open SVG layers from Mayandev/notion-avatar (MIT), composed server-side for this PRE-only lab.

const SVG_FILTER = `<defs><filter id="notion-avatar-outline" x="-20%" y="-20%" width="140%" height="140%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="linearRGB"><feMorphology operator="dilate" radius="20 20" in="SourceAlpha" result="morphology"/><feFlood flood-color="#ffffff" flood-opacity="1" result="flood"/><feComposite in="flood" in2="morphology" operator="in" result="composite"/><feMerge result="merge"><feMergeNode in="composite"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`

function fallbackSvg(message: string) {
  const safe = message.replace(/[<>&"']/g, "")
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080"><rect width="1080" height="1080" fill="#f5f5f4"/><rect x="70" y="70" width="940" height="940" rx="96" fill="#fff" stroke="#d6d3d1" stroke-width="12"/><text x="540" y="510" text-anchor="middle" font-family="system-ui,sans-serif" font-size="54" font-weight="700" fill="#171717">Notion Avatar no disponible</text><text x="540" y="585" text-anchor="middle" font-family="system-ui,sans-serif" font-size="30" fill="#57534e">${safe}</text></svg>`
}

function svgResponse(svg: string, status = 200) {
  return new NextResponse(svg, {
    status,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control":
        status === 200
          ? "private, max-age=3600, stale-while-revalidate=604800"
          : "no-store",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
      "X-Avatar-Renderer": "notion-avatar-official-assets",
      "X-Avatar-Source": "Mayandev/notion-avatar",
    },
  })
}

function sanitizeSvg(svg: string) {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
}

function extractSvgBody(svg: string) {
  return sanitizeSvg(svg)
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "")
}

function upstreamUrl(part: NotionAvatarPart, index: number) {
  return `https://raw.githubusercontent.com/Mayandev/notion-avatar/main/public/avatar/preview/${part}/${index}.svg`
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
    scope: "avatar_lab_notion",
    limit: 60,
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
  const recipe = notionAvatarRecipeFromSearchParams(url.searchParams)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)

  try {
    const layers = await Promise.all(
      NOTION_AVATAR_PART_ORDER.map(async (part) => {
        const response = await fetch(upstreamUrl(part, recipe[part]), {
          headers: { Accept: "image/svg+xml" },
          signal: controller.signal,
          next: { revalidate: 604_800 },
        })

        if (!response.ok) {
          throw new Error(`${part}: HTTP ${response.status}`)
        }

        const svg = await response.text()
        if (!svg.includes("<svg")) throw new Error(`${part}: SVG inválido`)
        return `<g id="notion-avatar-${part}">${extractSvgBody(svg)}</g>`
      }),
    )

    return svgResponse(
      `<svg viewBox="0 0 1080 1080" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="1080" fill="#ffffff"/>${SVG_FILTER}<g filter="url(#notion-avatar-outline)">${layers.join("")}</g></svg>`,
    )
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Tiempo de espera agotado"
        : "No se pudieron cargar las piezas"
    return svgResponse(fallbackSvg(message), 502)
  } finally {
    clearTimeout(timeout)
  }
}
