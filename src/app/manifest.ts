import type { MetadataRoute } from "next"
import { getAppBranding } from "@/lib/appVariant"
import { PRODUCTION_APP_URL } from "@/lib/appUrl"

export default function manifest(): MetadataRoute.Manifest {
  const branding = getAppBranding()
  const iconOrigin = branding.preproduction ? PRODUCTION_APP_URL : "" // Native icon downloads omit PRE access cookies.
  return {
    id: "/",
    name: branding.applicationName,
    short_name: branding.shortName,
    description: "Ligas, torneos y rankings privados de pádel.",
    start_url: "/launch?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    categories: ["sports", "productivity"],
    icons: [
      {
        src: `${iconOrigin}${branding.icon192}`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${iconOrigin}${branding.maskableIcon192}`,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: `${iconOrigin}${branding.icon512}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${iconOrigin}${branding.maskableIcon512}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
