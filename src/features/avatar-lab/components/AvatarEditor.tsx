"use client"

import { COLOR_SWATCHES } from "../catalog"
import type { AvatarCategory, AvatarRecipe } from "../types"
import { ColorOptions, ControlGroup, SegmentedOptions } from "./AvatarControls"

export function AvatarEditor({
  category,
  recipe,
  onChange,
}: {
  category: AvatarCategory
  recipe: AvatarRecipe
  onChange: (recipe: AvatarRecipe) => void
}) {
  if (category === "identity") {
    return (
      <div className="space-y-3">
        <ControlGroup title="Mano dominante" description="La previsualización mantiene el mismo arte base y se refleja para mostrar versión zurda.">
          <SegmentedOptions
            value={recipe.handedness}
            options={[
              { value: "right", label: "Diestro" },
              { value: "left", label: "Zurdo" },
            ]}
            onChange={(handedness) => onChange({ ...recipe, handedness })}
          />
        </ControlGroup>
        <ControlGroup title="Tono de piel">
          <ColorOptions
            value={recipe.skinTone}
            options={COLOR_SWATCHES.skinTone}
            onChange={(skinTone) => onChange({ ...recipe, skinTone })}
          />
        </ControlGroup>
      </div>
    )
  }

  if (category === "head") {
    return (
      <div className="space-y-3">
        <ControlGroup title="Base visual" description="En esta fase el peinado, la barba y la gorra se fijan al diseño canónico y solo se exponen variantes ya redibujadas.">
          <div className="rounded-xl border border-[#e7dfd3] bg-[#faf7f0] px-3 py-2 text-[11px] font-semibold leading-4 text-neutral-600">
            Pelo despeinado + barba corta + gorra hacia atrás como base fija del personaje.
          </div>
        </ControlGroup>

        <ControlGroup title="Color de pelo">
          <ColorOptions
            value={recipe.hair.color}
            options={COLOR_SWATCHES.hair}
            onChange={(color) => onChange({ ...recipe, hair: { ...recipe.hair, style: "messy_short_01", color } })}
          />
        </ControlGroup>

        <ControlGroup title="Color de barba">
          <ColorOptions
            value={recipe.beard.color}
            options={COLOR_SWATCHES.hair}
            onChange={(color) => onChange({ ...recipe, beard: { ...recipe.beard, style: "short_full_01", color } })}
          />
        </ControlGroup>

        <ControlGroup title="Gorra">
          <ColorOptions
            value={recipe.cap.color}
            options={COLOR_SWATCHES.cap}
            onChange={(color) => onChange({
              ...recipe,
              cap: { style: "backwards_01", color },
              headband: { ...recipe.headband, style: "none" },
            })}
          />
        </ControlGroup>

        <ControlGroup title="Ojos">
          <ColorOptions
            value={recipe.eyes.color}
            options={COLOR_SWATCHES.eyes}
            onChange={(color) => onChange({ ...recipe, eyes: { ...recipe.eyes, color } })}
          />
        </ControlGroup>
      </div>
    )
  }

  if (category === "outfit") {
    return (
      <div className="space-y-3">
        <ControlGroup title="Camiseta técnica" description="Se mantiene el patrón exacto del diseño base y solo cambia la versión ya dibujada.">
          <ColorOptions
            value={recipe.shirt.primaryColor}
            options={COLOR_SWATCHES.shirt}
            onChange={(primaryColor) => onChange({
              ...recipe,
              shirt: {
                ...recipe.shirt,
                primaryColor,
                secondaryColor: primaryColor === "light_blue" ? "light_blue_shadow" : "green_shadow",
              },
            })}
          />
        </ControlGroup>
        <ControlGroup title="Pantalón corto">
          <ColorOptions
            value={recipe.shorts.primaryColor}
            options={COLOR_SWATCHES.shorts}
            onChange={(primaryColor) => onChange({
              ...recipe,
              shorts: {
                ...recipe.shorts,
                primaryColor,
                secondaryColor: primaryColor === "black" ? "charcoal" : "black",
              },
            })}
          />
        </ControlGroup>
      </div>
    )
  }

  if (category === "arms") {
    return (
      <div className="space-y-3">
        <ControlGroup title="Manga compresiva" description="En esta revisión la manga se mantiene activa en el brazo dominante para respetar el diseño maestro.">
          <ColorOptions
            value={recipe.compressionSleeve.color}
            options={COLOR_SWATCHES.binary}
            onChange={(color) => onChange({
              ...recipe,
              compressionSleeve: { enabled: true, side: "dominant", color },
            })}
          />
        </ControlGroup>

        <ControlGroup title="Muñequera" description="La muñequera se mantiene en el brazo no dominante para no romper la silueta canónica.">
          <ColorOptions
            value={recipe.wristband.color}
            options={COLOR_SWATCHES.binary}
            onChange={(color) => onChange({
              ...recipe,
              wristband: { enabled: true, side: "non_dominant", color },
            })}
          />
        </ControlGroup>
      </div>
    )
  }

  if (category === "feet") {
    return (
      <div className="space-y-3">
        <ControlGroup title="Calcetines" description="En esta fase se mantiene el corte alto del diseño maestro.">
          <ColorOptions
            value={recipe.socks.primaryColor}
            options={COLOR_SWATCHES.binary}
            onChange={(primaryColor) => onChange({
              ...recipe,
              socks: { length: "high", primaryColor },
            })}
          />
        </ControlGroup>
        <ControlGroup title="Zapatillas">
          <ColorOptions
            value={recipe.shoes.primaryColor}
            options={COLOR_SWATCHES.shoes}
            onChange={(primaryColor) => onChange({
              ...recipe,
              shoes: {
                ...recipe.shoes,
                primaryColor,
                secondaryColor: primaryColor === "white" ? "black" : "white",
              },
            })}
          />
        </ControlGroup>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <ControlGroup title="Pala" description="La pala se mantiene fijada al modelo canónico mientras se redibujan las variantes adicionales.">
        <div className="rounded-xl border border-[#e7dfd3] bg-[#faf7f0] px-3 py-2 text-[11px] font-semibold leading-4 text-neutral-600">
          Modelo canónico activo: pala blanca redonda con grafismo central.
        </div>
      </ControlGroup>
    </div>
  )
}
