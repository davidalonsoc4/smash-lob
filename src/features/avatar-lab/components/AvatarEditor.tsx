"use client"

import { BEARD_OPTIONS, COLOR_SWATCHES, HAIR_OPTIONS } from "../catalog"
import type { AvatarCategory, AvatarRecipe } from "../types"
import { ColorOptions, ControlGroup, SegmentedOptions, ToggleOptions } from "./AvatarControls"

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
        <ControlGroup title="Mano dominante" description="La pala, la manga y la orientación se recalculan sin reflejar letras.">
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
    const capActive = recipe.cap.style !== "none"
    const headbandActive = recipe.headband.style !== "none"
    const capBlockedByHair = recipe.hair.style === "short_up_01"

    return (
      <div className="space-y-3">
        <ControlGroup title="Pelo">
          <SegmentedOptions
            value={recipe.hair.style}
            options={HAIR_OPTIONS.map((option) => ({
              ...option,
              disabled: capActive && option.value === "short_up_01",
              disabledReason: "Este peinado no tiene variante compatible con gorra en la DEMO.",
            }))}
            columns={3}
            onChange={(style) => onChange({ ...recipe, hair: { ...recipe.hair, style } })}
          />
          {recipe.hair.style !== "none" ? (
            <div className="mt-2">
              <ColorOptions
                value={recipe.hair.color}
                options={COLOR_SWATCHES.hair}
                onChange={(color) => onChange({ ...recipe, hair: { ...recipe.hair, color } })}
              />
            </div>
          ) : null}
        </ControlGroup>

        <ControlGroup title="Barba">
          <SegmentedOptions
            value={recipe.beard.style}
            options={BEARD_OPTIONS}
            columns={3}
            onChange={(style) => onChange({ ...recipe, beard: { ...recipe.beard, style } })}
          />
          {recipe.beard.style !== "none" ? (
            <div className="mt-2">
              <ColorOptions
                value={recipe.beard.color}
                options={COLOR_SWATCHES.hair}
                onChange={(color) => onChange({ ...recipe, beard: { ...recipe.beard, color } })}
              />
            </div>
          ) : null}
        </ControlGroup>

        <ControlGroup title="Gorra" description="Gorra y cinta son mutuamente excluyentes.">
          <SegmentedOptions
            value={capActive ? "on" : "off"}
            options={[
              { value: "off", label: "Sin gorra" },
              {
                value: "on",
                label: "Hacia atrás",
                disabled: capBlockedByHair,
                disabledReason: "Cambia el peinado hacia arriba antes de activar la gorra.",
              },
            ]}
            onChange={(value) => onChange({
              ...recipe,
              cap: { ...recipe.cap, style: value === "on" ? "backwards_01" : "none" },
              headband: value === "on" ? { ...recipe.headband, style: "none" } : recipe.headband,
            })}
          />
          {capActive ? (
            <div className="mt-2">
              <ColorOptions
                value={recipe.cap.color}
                options={COLOR_SWATCHES.cap}
                onChange={(color) => onChange({ ...recipe, cap: { ...recipe.cap, color } })}
              />
            </div>
          ) : null}
        </ControlGroup>

        <ControlGroup title="Cinta de pelo" description="Al activarla se desactiva automáticamente la gorra.">
          <SegmentedOptions
            value={headbandActive ? "on" : "off"}
            options={[
              { value: "off", label: "Sin cinta" },
              { value: "on", label: "Cinta básica" },
            ]}
            onChange={(value) => onChange({
              ...recipe,
              headband: { ...recipe.headband, style: value === "on" ? "basic_01" : "none" },
              cap: value === "on" ? { ...recipe.cap, style: "none" } : recipe.cap,
            })}
          />
          {headbandActive ? (
            <div className="mt-2">
              <ColorOptions
                value={recipe.headband.color}
                options={COLOR_SWATCHES.headband}
                onChange={(color) => onChange({ ...recipe, headband: { ...recipe.headband, color } })}
              />
            </div>
          ) : null}
        </ControlGroup>

        <ControlGroup title="Ojos">
          <ColorOptions
            value={recipe.eyes.color}
            options={COLOR_SWATCHES.eyes}
            onChange={(color) => onChange({ ...recipe, eyes: { ...recipe.eyes, color } })}
          />
        </ControlGroup>

        <ControlGroup title="Cejas">
          <SegmentedOptions
            value={recipe.eyebrows.style}
            options={[
              { value: "thick_straight_01", label: "Gruesas rectas" },
              { value: "angled_01", label: "Ascendentes" },
            ]}
            onChange={(style) => onChange({ ...recipe, eyebrows: { ...recipe.eyebrows, style } })}
          />
          <div className="mt-2">
            <ColorOptions
              value={recipe.eyebrows.color}
              options={COLOR_SWATCHES.hair}
              onChange={(color) => onChange({ ...recipe, eyebrows: { ...recipe.eyebrows, color } })}
            />
          </div>
        </ControlGroup>
      </div>
    )
  }

  if (category === "outfit") {
    return (
      <div className="space-y-3">
        <ControlGroup title="Camiseta técnica">
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
          <div className="mt-2">
            <ColorOptions
              value={recipe.shirt.secondaryColor}
              options={COLOR_SWATCHES.shirtSecondary}
              onChange={(secondaryColor) => onChange({
                ...recipe,
                shirt: { ...recipe.shirt, secondaryColor },
              })}
            />
          </div>
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
        <ControlGroup title="Manga compresiva" description="En la DEMO se coloca en el brazo dominante.">
          <ToggleOptions
            enabled={recipe.compressionSleeve.enabled}
            onChange={(enabled) => onChange({
              ...recipe,
              compressionSleeve: { ...recipe.compressionSleeve, enabled, side: "dominant" },
            })}
          />
          {recipe.compressionSleeve.enabled ? (
            <div className="mt-2">
              <ColorOptions
                value={recipe.compressionSleeve.color}
                options={COLOR_SWATCHES.binary}
                onChange={(color) => onChange({
                  ...recipe,
                  compressionSleeve: { ...recipe.compressionSleeve, color },
                })}
              />
            </div>
          ) : null}
        </ControlGroup>

        <ControlGroup title="Muñequera">
          <ToggleOptions
            enabled={recipe.wristband.enabled}
            onChange={(enabled) => onChange({ ...recipe, wristband: { ...recipe.wristband, enabled } })}
          />
          {recipe.wristband.enabled ? (
            <div className="mt-2 space-y-2">
              <SegmentedOptions
                value={recipe.wristband.side}
                options={[
                  { value: "dominant", label: "Dominante" },
                  { value: "non_dominant", label: "No dominante" },
                ]}
                onChange={(side) => onChange({ ...recipe, wristband: { ...recipe.wristband, side } })}
              />
              <ColorOptions
                value={recipe.wristband.color}
                options={COLOR_SWATCHES.binary}
                onChange={(color) => onChange({ ...recipe, wristband: { ...recipe.wristband, color } })}
              />
            </div>
          ) : null}
        </ControlGroup>
      </div>
    )
  }

  if (category === "feet") {
    return (
      <div className="space-y-3">
        <ControlGroup title="Calcetines">
          <SegmentedOptions
            value={recipe.socks.length}
            options={[
              { value: "high", label: "Altos" },
              { value: "short", label: "Cortos" },
            ]}
            onChange={(length) => onChange({ ...recipe, socks: { ...recipe.socks, length } })}
          />
          <div className="mt-2">
            <ColorOptions
              value={recipe.socks.primaryColor}
              options={COLOR_SWATCHES.binary}
              onChange={(primaryColor) => onChange({ ...recipe, socks: { ...recipe.socks, primaryColor } })}
            />
          </div>
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
      <ControlGroup title="Modelo de pala">
        <SegmentedOptions
          value={recipe.racket.model}
          options={[
            { value: "round_b_01", label: "Redonda · B" },
            { value: "diamond_stripe_01", label: "Diamante · franja" },
          ]}
          onChange={(model) => onChange({ ...recipe, racket: { ...recipe.racket, model } })}
        />
      </ControlGroup>
      <ControlGroup title="Color principal">
        <ColorOptions
          value={recipe.racket.primaryColor}
          options={[
            { value: "white", label: "Blanca", color: "#f7f4ea" },
            { value: "black", label: "Negra", color: "#191b1d" },
          ]}
          onChange={(primaryColor) => onChange({ ...recipe, racket: { ...recipe.racket, primaryColor } })}
        />
      </ControlGroup>
      <ControlGroup title="Detalle secundario">
        <ColorOptions
          value={recipe.racket.secondaryColor}
          options={[
            { value: "black", label: "Negro", color: "#191b1d" },
            { value: "light_blue", label: "Azul claro", color: "#55a9d9" },
          ]}
          onChange={(secondaryColor) => onChange({ ...recipe, racket: { ...recipe.racket, secondaryColor } })}
        />
      </ControlGroup>
    </div>
  )
}
