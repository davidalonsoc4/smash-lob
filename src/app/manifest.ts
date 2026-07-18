import type { MetadataRoute } from "next"
import { getAppBranding } from "@/lib/appVariant"

export default function manifest(): MetadataRoute.Manifest {
  const branding = getAppBranding()

  return {
    name: branding.applicationName,
    short_name: branding.shortName,
    description: "Ligas, torneos y rankings privados de pádel.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: branding.backgroundColor,
    theme_color: branding.themeColor,
    orientation: "portrait",
    categories: ["sports", "productivity"],
    icons: [
      {
        src: branding.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: branding.maskableIcon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: branding.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: branding.maskableIcon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
