import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Smash & Lob Padel",
    short_name: "Smash & Lob",
    description: "Ligas, torneos y rankings privados de pádel.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5f5f5",
    theme_color: "#0a0a0a",
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
