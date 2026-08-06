/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import {
  BIG_SMILE_ACCESSORIES,
  BIG_SMILE_BACKGROUNDS,
  BIG_SMILE_BACKGROUND_FILLS,
  BIG_SMILE_EYES,
  BIG_SMILE_FLIPS,
  BIG_SMILE_HAIRS,
  BIG_SMILE_HAIR_COLORS,
  BIG_SMILE_MOUTHS,
  BIG_SMILE_SKIN_COLORS,
  type BigSmileAccessory,
  type BigSmileBackgroundFill,
  type BigSmileEyes,
  type BigSmileFlip,
  type BigSmileHair,
  type BigSmileMouth,
} from "../bigSmileOptions"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"

type Category = "hair" | "skin" | "eyes" | "mouth" | "accessories" | "background" | "frame" | "advanced"
type Recipe = {
  seed: string
  hair: BigSmileHair
  hairColor: string
  hairColor2: string
  hairColor3: string
  hairColorFill: BigSmileBackgroundFill
  hairColorStops: 2 | 3
  hairColorAngle: number
  hairProbability: number
  skinColor: string
  skinColor2: string
  skinColor3: string
  skinColorFill: BigSmileBackgroundFill
  skinColorStops: 2 | 3
  skinColorAngle: number
  eyes: BigSmileEyes
  eyesProbability: number
  mouth: BigSmileMouth
  mouthProbability: number
  accessories: BigSmileAccessory
  accessoriesProbability: number
  backgroundColor: string
  backgroundColor2: string
  backgroundColor3: string
  backgroundFill: BigSmileBackgroundFill
  backgroundStops: 2 | 3
  backgroundAngle: number
  flip: BigSmileFlip
  rotate: number
  scale: number
  translateX: number
  translateY: number
  borderRadius: number
}

const CATEGORIES: readonly { id: Category; label: string }[] = [
  { id: "hair", label: "Pelo" },
  { id: "skin", label: "Piel" },
  { id: "eyes", label: "Ojos" },
  { id: "mouth", label: "Boca" },
  { id: "accessories", label: "Accesorios" },
  { id: "background", label: "Fondo" },
  { id: "frame", label: "Encuadre" },
  { id: "advanced", label: "Avanzado" },
]

const DEFAULT_RECIPE: Recipe = {
  seed: "Davo",
  hair: "shortHair",
  hairColor: "71472d",
  hairColor2: "e9b729",
  hairColor3: "605de4",
  hairColorFill: "solid",
  hairColorStops: 2,
  hairColorAngle: 0,
  hairProbability: 100,
  skinColor: "efcc9f",
  skinColor2: "e2ba87",
  skinColor3: "c99c62",
  skinColorFill: "solid",
  skinColorStops: 2,
  skinColorAngle: 0,
  eyes: "cheery",
  eyesProbability: 100,
  mouth: "teethSmile",
  mouthProbability: 100,
  accessories: "glasses",
  accessoriesProbability: 100,
  backgroundColor: "dbeafe",
  backgroundColor2: "ede9fe",
  backgroundColor3: "dcfce7",
  backgroundFill: "solid",
  backgroundStops: 2,
  backgroundAngle: 35,
  flip: "none",
  rotate: 0,
  scale: 1,
  translateX: 0,
  translateY: 0,
  borderRadius: 0,
}

const PRESETS: readonly { label: string; recipe: Partial<Recipe> }[] = [
  { label: "Davo", recipe: DEFAULT_RECIPE },
  { label: "Deportivo", recipe: { hair: "curlyShortHair", eyes: "normal", mouth: "openedSmile", accessories: "none", hairColor: "3a1a00", backgroundColor: "dcfce7", backgroundFill: "solid" } },
  { label: "Retro", recipe: { hair: "mohawk", eyes: "starstruck", mouth: "gapSmile", accessories: "sunglasses", hairColor: "605de4", backgroundColor: "fef3c7", backgroundColor2: "fee2e2", backgroundColor3: "ede9fe", backgroundFill: "linear", backgroundStops: 3, backgroundAngle: 35 } },
  { label: "Sobrio", recipe: { hair: "straightHair", eyes: "normal", mouth: "unimpressed", accessories: "glasses", hairColor: "111827", backgroundColor: "111827", backgroundColor2: "000000", backgroundFill: "radial", backgroundStops: 2 } },
]

const STORAGE_KEY = "smash-lob-avatar-lab-big-smile-recipe-v3"

function normalizeColorInput(value: string) {
  const normalized = value.trim().replace(/^#/, "").toLowerCase()
  return /^[0-9a-f]{6}$/.test(normalized) ? normalized : null
}

function buildUrl(recipe: Recipe, revision: number) {
  const params = new URLSearchParams({
    seed: recipe.seed.trim() || "Davo",
    hair: recipe.hair,
    hairColor: recipe.hairColor,
    hairColor2: recipe.hairColor2,
    hairColor3: recipe.hairColor3,
    hairColorFill: recipe.hairColorFill,
    hairColorStops: String(recipe.hairColorStops),
    hairColorAngle: String(recipe.hairColorAngle),
    hairProbability: String(recipe.hairProbability),
    skinColor: recipe.skinColor,
    skinColor2: recipe.skinColor2,
    skinColor3: recipe.skinColor3,
    skinColorFill: recipe.skinColorFill,
    skinColorStops: String(recipe.skinColorStops),
    skinColorAngle: String(recipe.skinColorAngle),
    eyes: recipe.eyes,
    eyesProbability: String(recipe.eyesProbability),
    mouth: recipe.mouth,
    mouthProbability: String(recipe.mouthProbability),
    accessories: recipe.accessories,
    accessoriesProbability: String(recipe.accessoriesProbability),
    backgroundColor: recipe.backgroundColor,
    backgroundColor2: recipe.backgroundColor2,
    backgroundColor3: recipe.backgroundColor3,
    backgroundFill: recipe.backgroundFill,
    backgroundStops: String(recipe.backgroundStops),
    backgroundAngle: String(recipe.backgroundAngle),
    flip: recipe.flip,
    rotate: String(recipe.rotate),
    scale: String(recipe.scale),
    translateX: String(recipe.translateX),
    translateY: String(recipe.translateY),
    borderRadius: String(recipe.borderRadius),
    revision: String(revision),
  })
  return `/api/experimental/avatar-lab/dicebear-big-smile?${params.toString()}`
}

function OptionButton({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`min-h-12 rounded-2xl border px-3 py-2 text-[11px] font-black ${selected ? "border-rose-700 bg-rose-50 text-rose-950 ring-2 ring-rose-700/15" : "border-neutral-200 bg-white text-neutral-700"}`}>
      {label}
    </button>
  )
}

function ColorButton({ hex, selected, label, onClick }: { hex: string; selected: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={`rounded-2xl border bg-white p-2 ${selected ? "border-rose-700 ring-2 ring-rose-700/20" : "border-neutral-200"}`}>
      <span className="block aspect-square w-full rounded-xl border border-black/10" style={{ backgroundColor: `#${hex}` }} />
      <span className="mt-1 block text-center text-[9px] font-black text-neutral-600">{label}</span>
    </button>
  )
}

function CustomColor({ label, hex, onChange }: { label: string; hex: string; onChange: (hex: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 p-3 text-[11px] font-black text-neutral-700">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-neutral-500">#{hex}</span>
        <input
          type="color"
          value={`#${hex}`}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const next = normalizeColorInput(event.target.value)
            if (next) onChange(next)
          }}
          className="h-9 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0"
        />
      </span>
    </label>
  )
}

function Slider({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (value: number) => void }) {
  return (
    <label className="block rounded-2xl bg-stone-50 p-3">
      <span className="flex items-center justify-between gap-3 text-[11px] font-black text-neutral-700">
        <span>{label}</span>
        <span>{value}{suffix ?? ""}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value))} className="mt-2 w-full accent-rose-700" />
    </label>
  )
}

type PreviewResult = {
  url: string
  state: "ready" | "error"
}

export function BigSmileEditorClient() {
  const [recipe, setRecipe] = useState<Recipe>(DEFAULT_RECIPE)
  const [category, setCategory] = useState<Category>("hair")
  const [status, setStatus] = useState("")
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw) {
          setRecipe({
            ...DEFAULT_RECIPE,
            ...(JSON.parse(raw) as Partial<Recipe>),
          })
        }
      } catch {
        // Ignore an invalid local demo recipe.
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!status) return
    const timer = window.setTimeout(() => setStatus(""), 2200)
    return () => window.clearTimeout(timer)
  }, [status])

  const avatarUrl = useMemo(() => buildUrl(recipe, revision), [recipe, revision])
  const previewState =
    previewResult?.url === avatarUrl ? previewResult.state : "loading"

  function update<K extends keyof Recipe>(key: K, value: Recipe[K]) {
    setRecipe((current) => ({ ...current, [key]: value }))
  }

  function randomize() {
    const pick = <T,>(values: readonly T[]) => values[Math.floor(Math.random() * values.length)]
    const accessory = pick(BIG_SMILE_ACCESSORIES).id
    setRecipe({
      seed: `SmashLob-${Math.floor(Math.random() * 99999)}`,
      hair: pick(BIG_SMILE_HAIRS).id,
      hairColor: pick(BIG_SMILE_HAIR_COLORS),
      hairColor2: pick(BIG_SMILE_HAIR_COLORS),
      hairColor3: pick(BIG_SMILE_HAIR_COLORS),
      hairColorFill: pick(BIG_SMILE_BACKGROUND_FILLS).id,
      hairColorStops: pick([2, 3] as const),
      hairColorAngle: Math.floor(Math.random() * 721) - 360,
      hairProbability: 100,
      skinColor: pick(BIG_SMILE_SKIN_COLORS),
      skinColor2: pick(BIG_SMILE_SKIN_COLORS),
      skinColor3: pick(BIG_SMILE_SKIN_COLORS),
      skinColorFill: Math.random() > 0.7 ? pick(BIG_SMILE_BACKGROUND_FILLS).id : "solid",
      skinColorStops: pick([2, 3] as const),
      skinColorAngle: Math.floor(Math.random() * 721) - 360,
      eyes: pick(BIG_SMILE_EYES).id,
      eyesProbability: 100,
      mouth: pick(BIG_SMILE_MOUTHS).id,
      mouthProbability: 100,
      accessories: accessory,
      accessoriesProbability: accessory === "none" ? 0 : 100,
      backgroundColor: pick(BIG_SMILE_BACKGROUNDS),
      backgroundColor2: pick(BIG_SMILE_BACKGROUNDS),
      backgroundColor3: pick(BIG_SMILE_BACKGROUNDS),
      backgroundFill: pick(BIG_SMILE_BACKGROUND_FILLS).id,
      backgroundStops: pick([2, 3] as const),
      backgroundAngle: Math.floor(Math.random() * 361),
      flip: pick(BIG_SMILE_FLIPS).id,
      rotate: Math.floor(Math.random() * 17) - 8,
      scale: Number((0.85 + Math.random() * 0.3).toFixed(2)),
      translateX: Math.floor(Math.random() * 11) - 5,
      translateY: Math.floor(Math.random() * 11) - 5,
      borderRadius: pick([0, 12, 25, 50] as const),
    })
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recipe))
      setStatus("Avatar guardado localmente")
    } catch {
      setStatus("No se pudo guardar")
    }
  }

  async function copyRecipe() {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ renderer: "dicebear-big-smile", version: 3, recipe }, null, 2))
      setStatus("Receta copiada")
    } catch {
      setStatus("No se pudo copiar")
    }
  }

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setRecipe((current) => ({ ...current, ...preset.recipe }))
    setStatus(`Preset ${preset.label} aplicado`)
  }

  return (
    <div className="compact-page space-y-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="pt-1">
        <BackButton fallbackHref="/experimental/avatar-lab" label="Volver" />
        <p className="mt-1 text-xs font-bold text-neutral-500">Laboratorio de avatares</p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">DiceBear Big Smile</h1>
        <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
          Prueba todas sus piezas y ajustes. El resultado no se aplica todavía a tu perfil.
        </p>
      </header>

      <AppCard className="border-amber-200 bg-amber-50">
        <p className="text-xs font-black text-amber-950">Solo pruebas en PRE</p>
        <p className="mt-1 text-[11px] font-semibold leading-5 text-amber-800">
          La configuración se guarda únicamente en este navegador para que puedas seguir trasteando desde el móvil.
        </p>
      </AppCard>

      <AppCard className="overflow-hidden !p-0">
          <div className="relative flex h-[250px] items-center justify-center bg-stone-50 p-3 sm:h-[310px]">
            <img key={avatarUrl} src={avatarUrl} alt="Avatar DiceBear Big Smile" className="h-full w-full object-contain" onLoad={() => setPreviewResult({ url: avatarUrl, state: "ready" })} onError={() => setPreviewResult({ url: avatarUrl, state: "error" })} />
            {previewState === "loading" ? <span className="absolute bottom-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black text-neutral-600 shadow">Actualizando…</span> : null}
            {previewState === "error" ? (
              <button type="button" onClick={() => setRevision((value) => value + 1)} className="absolute bottom-3 rounded-full bg-red-50 px-3 py-1 text-[10px] font-black text-red-700 shadow">Reintentar vista</button>
            ) : null}
          </div>
          <div className="border-t border-neutral-100 p-3">
            <label className="block text-[10px] font-black uppercase tracking-[0.12em] text-neutral-500">
              Semilla
              <input value={recipe.seed} onChange={(event: ChangeEvent<HTMLInputElement>) => update("seed", event.target.value)} className="mt-2 h-10 w-full rounded-2xl border border-neutral-200 bg-stone-50 px-3 text-sm font-bold outline-none focus:border-rose-500" />
            </label>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {PRESETS.map((preset) => <button key={preset.label} type="button" onClick={() => applyPreset(preset)} className="shrink-0 rounded-full bg-stone-100 px-3 py-2 text-[10px] font-black text-neutral-700">{preset.label}</button>)}
            </div>
            {status ? <div className="mt-1 text-center text-[11px] font-black text-rose-700">{status}</div> : null}
          </div>
        </AppCard>

      <AppCard>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((item) => (
              <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black ${category === item.id ? "bg-rose-700 text-white" : "bg-stone-100 text-neutral-700"}`}>
                {item.label}
              </button>
            ))}
          </div>

          {category === "hair" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Peinado · {BIG_SMILE_HAIRS.length} opciones oficiales</h2>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{BIG_SMILE_HAIRS.map((item) => <OptionButton key={item.id} label={item.label} selected={recipe.hair === item.id} onClick={() => update("hair", item.id)} />)}</div>
              </div>
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Relleno del pelo</h2>
                <div className="mt-2 grid grid-cols-3 gap-2">{BIG_SMILE_BACKGROUND_FILLS.map((item) => <OptionButton key={item.id} label={item.label} selected={recipe.hairColorFill === item.id} onClick={() => update("hairColorFill", item.id)} />)}</div>
              </div>
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Color principal</h2>
                <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">{BIG_SMILE_HAIR_COLORS.map((hex, index) => <ColorButton key={hex} hex={hex} selected={recipe.hairColor === hex} label={`Color ${index + 1}`} onClick={() => update("hairColor", hex)} />)}</div>
                <div className="mt-2"><CustomColor label="Principal personalizado" hex={recipe.hairColor} onChange={(hex) => update("hairColor", hex)} /></div>
              </div>
              {recipe.hairColorFill !== "solid" ? (
                <>
                  <CustomColor label="Color secundario" hex={recipe.hairColor2} onChange={(hex) => update("hairColor2", hex)} />
                  <div className="grid grid-cols-2 gap-2">
                    <OptionButton label="2 colores" selected={recipe.hairColorStops === 2} onClick={() => update("hairColorStops", 2)} />
                    <OptionButton label="3 colores" selected={recipe.hairColorStops === 3} onClick={() => update("hairColorStops", 3)} />
                  </div>
                  {recipe.hairColorStops === 3 ? <CustomColor label="Tercer color" hex={recipe.hairColor3} onChange={(hex) => update("hairColor3", hex)} /> : null}
                  <Slider label="Ángulo del pelo" value={recipe.hairColorAngle} min={-360} max={360} step={5} suffix="°" onChange={(value) => update("hairColorAngle", value)} />
                </>
              ) : null}
            </div>
          ) : null}

          {category === "skin" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Relleno de piel</h2>
                <div className="mt-2 grid grid-cols-3 gap-2">{BIG_SMILE_BACKGROUND_FILLS.map((item) => <OptionButton key={item.id} label={item.label} selected={recipe.skinColorFill === item.id} onClick={() => update("skinColorFill", item.id)} />)}</div>
              </div>
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Tono principal</h2>
                <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-8">{BIG_SMILE_SKIN_COLORS.map((hex, index) => <ColorButton key={hex} hex={hex} selected={recipe.skinColor === hex} label={`Tono ${index + 1}`} onClick={() => update("skinColor", hex)} />)}</div>
                <div className="mt-2"><CustomColor label="Tono personalizado" hex={recipe.skinColor} onChange={(hex) => update("skinColor", hex)} /></div>
              </div>
              {recipe.skinColorFill !== "solid" ? (
                <>
                  <CustomColor label="Tono secundario" hex={recipe.skinColor2} onChange={(hex) => update("skinColor2", hex)} />
                  <div className="grid grid-cols-2 gap-2">
                    <OptionButton label="2 tonos" selected={recipe.skinColorStops === 2} onClick={() => update("skinColorStops", 2)} />
                    <OptionButton label="3 tonos" selected={recipe.skinColorStops === 3} onClick={() => update("skinColorStops", 3)} />
                  </div>
                  {recipe.skinColorStops === 3 ? <CustomColor label="Tercer tono" hex={recipe.skinColor3} onChange={(hex) => update("skinColor3", hex)} /> : null}
                  <Slider label="Ángulo de piel" value={recipe.skinColorAngle} min={-360} max={360} step={5} suffix="°" onChange={(value) => update("skinColorAngle", value)} />
                </>
              ) : null}
            </div>
          ) : null}

          {category === "eyes" ? (
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Expresión de ojos · {BIG_SMILE_EYES.length} opciones oficiales</h2>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{BIG_SMILE_EYES.map((item) => <OptionButton key={item.id} label={item.label} selected={recipe.eyes === item.id} onClick={() => update("eyes", item.id)} />)}</div>
            </div>
          ) : null}

          {category === "mouth" ? (
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Boca · {BIG_SMILE_MOUTHS.length} opciones oficiales</h2>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{BIG_SMILE_MOUTHS.map((item) => <OptionButton key={item.id} label={item.label} selected={recipe.mouth === item.id} onClick={() => update("mouth", item.id)} />)}</div>
            </div>
          ) : null}

          {category === "accessories" ? (
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Accesorios · {BIG_SMILE_ACCESSORIES.length - 1} piezas + ninguno</h2>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{BIG_SMILE_ACCESSORIES.map((item) => <OptionButton key={item.id} label={item.label} selected={recipe.accessories === item.id} onClick={() => update("accessories", item.id)} />)}</div>
            </div>
          ) : null}

          {category === "background" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Tipo de fondo</h2>
                <div className="mt-2 grid grid-cols-3 gap-2">{BIG_SMILE_BACKGROUND_FILLS.map((item) => <OptionButton key={item.id} label={item.label} selected={recipe.backgroundFill === item.id} onClick={() => update("backgroundFill", item.id)} />)}</div>
              </div>
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Color principal</h2>
                <div className="mt-2 grid grid-cols-5 gap-2">{BIG_SMILE_BACKGROUNDS.map((hex, index) => <ColorButton key={hex} hex={hex} selected={recipe.backgroundColor === hex} label={`F${index + 1}`} onClick={() => update("backgroundColor", hex)} />)}</div>
                <div className="mt-2"><CustomColor label="Principal personalizado" hex={recipe.backgroundColor} onChange={(hex) => update("backgroundColor", hex)} /></div>
              </div>
              {recipe.backgroundFill !== "solid" ? (
                <>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Color secundario</h2>
                    <div className="mt-2 grid grid-cols-5 gap-2">{BIG_SMILE_BACKGROUNDS.map((hex, index) => <ColorButton key={hex} hex={hex} selected={recipe.backgroundColor2 === hex} label={`F${index + 1}`} onClick={() => update("backgroundColor2", hex)} />)}</div>
                    <div className="mt-2"><CustomColor label="Secundario personalizado" hex={recipe.backgroundColor2} onChange={(hex) => update("backgroundColor2", hex)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <OptionButton label="2 colores" selected={recipe.backgroundStops === 2} onClick={() => update("backgroundStops", 2)} />
                    <OptionButton label="3 colores" selected={recipe.backgroundStops === 3} onClick={() => update("backgroundStops", 3)} />
                  </div>
                  {recipe.backgroundStops === 3 ? <CustomColor label="Tercer color" hex={recipe.backgroundColor3} onChange={(hex) => update("backgroundColor3", hex)} /> : null}
                  <Slider label="Ángulo del degradado" value={recipe.backgroundAngle} min={-360} max={360} step={5} suffix="°" onChange={(value) => update("backgroundAngle", value)} />
                </>
              ) : null}
            </div>
          ) : null}

          {category === "frame" ? (
            <div className="space-y-3">
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.12em] text-neutral-500">Orientación</h2>
                <div className="mt-2 grid grid-cols-2 gap-2">{BIG_SMILE_FLIPS.map((item) => <OptionButton key={item.id} label={item.label} selected={recipe.flip === item.id} onClick={() => update("flip", item.id)} />)}</div>
              </div>
              <Slider label="Giro" value={recipe.rotate} min={-360} max={360} step={1} suffix="°" onChange={(value) => update("rotate", value)} />
              <Slider label="Zoom" value={recipe.scale} min={0} max={10} step={0.05} onChange={(value) => update("scale", value)} />
              <Slider label="Posición horizontal" value={recipe.translateX} min={-1000} max={1000} step={1} suffix="%" onChange={(value) => update("translateX", value)} />
              <Slider label="Posición vertical" value={recipe.translateY} min={-1000} max={1000} step={1} suffix="%" onChange={(value) => update("translateY", value)} />
              <Slider label="Redondeado" value={recipe.borderRadius} min={0} max={50} step={5} suffix="%" onChange={(value) => update("borderRadius", value)} />
            </div>
          ) : null}

          {category === "advanced" ? (
            <div className="space-y-3">
              <p className="rounded-2xl bg-amber-50 p-3 text-[11px] font-semibold leading-5 text-amber-950">DiceBear permite controlar la probabilidad de aparición de cada componente. Al 100% siempre se muestra; al 0% se oculta.</p>
              <Slider label="Probabilidad de pelo" value={recipe.hairProbability} min={0} max={100} step={5} suffix="%" onChange={(value) => update("hairProbability", value)} />
              <Slider label="Probabilidad de ojos" value={recipe.eyesProbability} min={0} max={100} step={5} suffix="%" onChange={(value) => update("eyesProbability", value)} />
              <Slider label="Probabilidad de boca" value={recipe.mouthProbability} min={0} max={100} step={5} suffix="%" onChange={(value) => update("mouthProbability", value)} />
              <Slider label="Probabilidad de accesorio" value={recipe.accessories === "none" ? 0 : recipe.accessoriesProbability} min={0} max={100} step={5} suffix="%" onChange={(value) => update("accessoriesProbability", value)} />
            </div>
          ) : null}
        </AppCard>

      <AppCard>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={randomize} className="h-11 rounded-xl border border-neutral-200 bg-white text-xs font-black">Aleatorio</button>
          <button type="button" onClick={() => setRecipe(DEFAULT_RECIPE)} className="h-11 rounded-xl border border-neutral-200 bg-white text-xs font-black">Restablecer</button>
          <button type="button" onClick={copyRecipe} className="h-11 rounded-xl border border-neutral-200 bg-white text-xs font-black">Copiar receta</button>
          <button type="button" onClick={save} className="h-11 rounded-xl bg-neutral-950 text-xs font-black text-white">Guardar en este móvil</button>
        </div>
      </AppCard>

      <p className="px-1 text-center text-[10px] font-semibold leading-4 text-neutral-500">
        Big Smile utiliza la API pública de DiceBear. Esta pantalla es experimental y no escribe datos en tu cuenta ni en la liga.
      </p>
    </div>
  )
}
