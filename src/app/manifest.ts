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
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
