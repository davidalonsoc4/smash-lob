/* eslint-disable @next/next/no-img-element */
"use client"

import Link from "next/link"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { DEFAULT_NOTION_AVATAR_RECIPE } from "../notionAvatarModel"
import { NotionAvatarRenderer } from "./NotionAvatarRenderer"

const BIG_SMILE_PREVIEW =
  "/api/experimental/avatar-lab/dicebear-big-smile?seed=Davo&hair=shortHair&hairColor=71472d&skinColor=efcc9f&eyes=cheery&mouth=teethSmile&accessories=glasses&backgroundColor=dbeafe&backgroundColor2=ede9fe&backgroundFill=solid&flip=none&rotate=0&scale=1&translateX=0&translateY=0&borderRadius=0"

export function AvatarLabClient() {
  return (
    <div className="compact-page space-y-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="pt-1">
        <BackButton fallbackHref="/settings" label="Volver" />
        <p className="mt-1 text-xs font-bold text-neutral-500">Ajustes</p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Laboratorio de avatares
        </h1>
        <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
          Compara dos estilos y prueba sus opciones desde el móvil.
        </p>
      </header>

      <AppCard className="border-amber-200 bg-amber-50">
        <p className="text-xs font-black text-amber-950">
          Función experimental en PRE
        </p>
        <p className="mt-1 type-caption font-semibold leading-5 text-amber-800">
          Lo que hagas aquí no cambia tu imagen, tu perfil ni ningún jugador de
          la liga. Los editores solo guardan pruebas en este dispositivo.
        </p>
      </AppCard>

      <div className="space-y-3">
        <Link
          href="/experimental/avatar-lab/big-smile"
          className="block active:scale-[0.995]"
        >
          <AppCard className="overflow-hidden !p-0">
            <div className="flex aspect-[16/10] items-center justify-center bg-blue-50 p-4">
              <img
                src={BIG_SMILE_PREVIEW}
                alt="Ejemplo de DiceBear Big Smile"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex items-center gap-3 border-t border-neutral-100 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-black text-neutral-950">
                    DiceBear Big Smile
                  </h2>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 type-caption font-black uppercase tracking-[0.1em] text-blue-800">
                    Colorido
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
                  Pelo, piel, ojos, boca, accesorios, fondos, encuadre y ajustes
                  avanzados.
                </p>
              </div>
              <ClickableChevron className="shrink-0" />
            </div>
          </AppCard>
        </Link>

        <Link
          href="/experimental/avatar-lab/notion-avatar"
          className="block active:scale-[0.995]"
        >
          <AppCard className="overflow-hidden !p-0">
            <div className="flex aspect-[16/10] items-center justify-center bg-violet-50 p-4">
              <div className="aspect-square h-full overflow-hidden rounded-2xl bg-[#f5f0e8]">
                <NotionAvatarRenderer recipe={DEFAULT_NOTION_AVATAR_RECIPE} />
              </div>
            </div>
            <div className="flex items-center gap-3 border-t border-neutral-100 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-black text-neutral-950">
                    Notion Avatar
                  </h2>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 type-caption font-black uppercase tracking-[0.1em] text-violet-800">
                    Minimalista
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
                  Cara, nariz, boca, ojos, cejas, gafas, pelo, accesorios,
                  detalles y barba.
                </p>
              </div>
              <ClickableChevron className="shrink-0" />
            </div>
          </AppCard>
        </Link>
      </div>
    </div>
  )
}
