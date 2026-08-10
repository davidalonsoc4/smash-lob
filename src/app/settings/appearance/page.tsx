"use client"

import { type ReactNode, useSyncExternalStore } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import {
  type ColorfulPalette,
  type ThemeMode,
  type VisualStyle,
  useTheme,
} from "@/context/ThemeProvider"
import { useI18n } from "@/i18n/I18nProvider"
import {
  type AppFontSize,
  getServerAppFontSize,
  persistAppFontSize,
  readStoredAppFontSize,
  subscribeAppFontSize,
} from "@/lib/fontSizePreference"

const colorfulPaletteSwatches: Record<ColorfulPalette, string[]> = {
  indigo: ["#5b5ce2", "#7c4dff", "#e94b9b", "#f2a93b"],
  midnight: ["#365f9d", "#5a78b5", "#87b5df", "#d6a45a"],
  sage: ["#55765f", "#7f9b83", "#a6b99d", "#c39a62"],
  burgundy: ["#8b3f57", "#a85c70", "#d2a2ad", "#c29572"],
  terracotta: ["#a95640", "#c0785e", "#ddaa84", "#c89a58"],
  graphite: ["#4f6379", "#71879b", "#a7c5d8", "#c2a36d"],
}

function AppearanceSection({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section id={id} className="settings-search-target space-y-2">
      <div className="px-1">
        <h2 className="type-panel-title text-neutral-950">{title}</h2>
        <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">{description}</p>
      </div>
      <AppCard className="!p-2.5">{children}</AppCard>
    </section>
  )
}

function ThemeModePreview({ mode }: { mode: ThemeMode }) {
  return (
    <span
      aria-hidden="true"
      className={`appearance-preview-${mode} relative block h-8 overflow-hidden rounded-lg ring-1`}
    >
      <span className="appearance-preview-card absolute left-1.5 right-1.5 top-1.5 h-1.5 rounded-full" />
      <span className="appearance-preview-card absolute bottom-1.5 left-1.5 h-3 w-6 rounded" />
      <span className="appearance-preview-chip absolute bottom-1.5 right-1.5 h-3 w-3 rounded-full" />
    </span>
  )
}

function StylePreview({ style }: { style: VisualStyle }) {
  if (style === "plain") {
    return (
      <span aria-hidden="true" className="relative block h-9 overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-neutral-200">
        <span className="absolute inset-x-2 top-2 h-2 rounded-full bg-white" />
        <span className="absolute bottom-2 left-2 h-3 w-8 rounded-md bg-white" />
        <span className="absolute bottom-2 right-2 h-3 w-3 rounded-full bg-neutral-300" />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className="appearance-preview-colorful relative block h-9 overflow-hidden rounded-xl ring-1"
    >
      <span className="appearance-preview-card absolute inset-x-2 top-2 h-2 rounded-full" />
      <span className="appearance-preview-card absolute bottom-2 left-2 h-3 w-8 rounded-md" />
      <span className="appearance-preview-chip absolute bottom-2 right-2 h-3 w-3 rounded-full" />
    </span>
  )
}

function PaletteSwatches({ palette }: { palette: ColorfulPalette }) {
  return (
    <span aria-hidden="true" className="flex items-center gap-1">
      {colorfulPaletteSwatches[palette].map((color) => (
        <span
          key={color}
          className="h-4 w-4 rounded-full border border-white/80 shadow-sm"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  )
}

const fontSizeCopy = {
  es: {
    title: "Tamaño de texto",
    description: "Ajusta toda la interfaz en este dispositivo.",
    small: "Pequeño",
    normal: "Normal",
    large: "Grande",
  },
  en: {
    title: "Text size",
    description: "Adjust the whole interface on this device.",
    small: "Small",
    normal: "Normal",
    large: "Large",
  },
  eu: {
    title: "Testuaren tamaina",
    description: "Doitu interfaze osoa gailu honetan.",
    small: "Txikia",
    normal: "Normala",
    large: "Handia",
  },
} as const

function FontSizeControl({ locale }: { locale: string }) {
  const fontSize = useSyncExternalStore(
    subscribeAppFontSize,
    readStoredAppFontSize,
    getServerAppFontSize,
  )
  const copy = fontSizeCopy[locale as keyof typeof fontSizeCopy] ?? fontSizeCopy.es
  const options: Array<{ value: AppFontSize; glyph: string; label: string }> = [
    { value: "small", glyph: "A−", label: copy.small },
    { value: "normal", glyph: "A", label: copy.normal },
    { value: "large", glyph: "A+", label: copy.large },
  ]

  return (
    <section id="font-size" className="settings-search-target">
      <AppCard className="!p-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="type-panel-title font-black text-neutral-950">{copy.title}</h2>
            <p className="mt-0.5 type-caption font-semibold leading-4 text-neutral-500">
              {copy.description}
            </p>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">
            {options.map((option) => {
              const selected = option.value === fontSize
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-label={`${copy.title}: ${option.label}`}
                  aria-pressed={selected}
                  title={option.label}
                  onClick={() => {
                    persistAppFontSize(option.value)
                  }}
                  className={`grid h-9 min-w-9 place-items-center rounded-lg px-2 font-black transition active:scale-[0.96] ${
                    selected
                      ? "bg-white text-neutral-950 shadow-sm ring-1 ring-neutral-200"
                      : "text-neutral-500"
                  }`}
                >
                  {option.glyph}
                </button>
              )
            })}
          </div>
        </div>
      </AppCard>
    </section>
  )
}

export default function AppearancePage() {
  const { locale, t } = useI18n()
  const {
    themeMode,
    setThemeMode,
    visualStyle,
    setVisualStyle,
    colorfulPalette,
    setColorfulPalette,
  } = useTheme()

  const themeOptions: Array<{ value: ThemeMode; label: string }> = [
    { value: "light", label: t.settings.appearanceLight },
    { value: "dark", label: t.settings.appearanceDark },
    { value: "system", label: t.settings.appearanceSystem },
  ]
  const styleOptions: Array<{ value: VisualStyle; label: string; description: string }> = [
    {
      value: "plain",
      label: t.settings.visualStylePlain,
      description: t.settings.visualStylePlainDescription,
    },
    {
      value: "colorful",
      label: t.settings.visualStyleColorful,
      description: t.settings.visualStyleColorfulDescription,
    },
  ]
  const paletteOptions: Array<{ value: ColorfulPalette; label: string; description: string }> = [
    {
      value: "indigo",
      label: t.settings.colorfulPaletteIndigo,
      description: t.settings.colorfulPaletteIndigoDescription,
    },
    {
      value: "midnight",
      label: t.settings.colorfulPaletteMidnight,
      description: t.settings.colorfulPaletteMidnightDescription,
    },
    {
      value: "sage",
      label: t.settings.colorfulPaletteSage,
      description: t.settings.colorfulPaletteSageDescription,
    },
    {
      value: "burgundy",
      label: t.settings.colorfulPaletteBurgundy,
      description: t.settings.colorfulPaletteBurgundyDescription,
    },
    {
      value: "terracotta",
      label: t.settings.colorfulPaletteTerracotta,
      description: t.settings.colorfulPaletteTerracottaDescription,
    },
    {
      value: "graphite",
      label: t.settings.colorfulPaletteGraphite,
      description: t.settings.colorfulPaletteGraphiteDescription,
    },
  ]
  const selectedPalette = paletteOptions.find((option) => option.value === colorfulPalette)

  return (
    <div className="compact-page space-y-4">
      <header className="app-page-header">
        <BackButton fallbackHref="/settings" label={t.common.back} />
        <h1 className="type-page-title mt-1 text-xl font-black tracking-tight">{t.settings.appearancePageTitle}</h1>
      </header>

      <AppCard className="appearance-current-summary overflow-hidden !p-3">
        <div className="flex items-center gap-3">
          <span className="appearance-summary-orb grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-neutral-950 text-sm font-black text-white">
            Aa
          </span>
          <div className="min-w-0 flex-1">
            <p className="type-caption font-black uppercase tracking-[0.16em] text-neutral-400">
              {t.settings.appearanceCurrent}
            </p>
            <p className="mt-0.5 text-sm font-black text-neutral-950">
              {themeOptions.find((option) => option.value === themeMode)?.label} · {styleOptions.find((option) => option.value === visualStyle)?.label}
            </p>
            {visualStyle === "colorful" ? (
              <div className="mt-1 flex items-center gap-2">
                <PaletteSwatches palette={colorfulPalette} />
                <p className="truncate type-caption font-bold text-neutral-500">{selectedPalette?.label}</p>
              </div>
            ) : null}
          </div>
        </div>
      </AppCard>

      <FontSizeControl locale={locale} />

      <AppearanceSection
        id="theme-mode"
        title={t.settings.themeModeTitle}
        description={t.settings.themeModeDescription}
      >
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((option) => {
            const selected = themeMode === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setThemeMode(option.value)}
                className={`appearance-compact-option rounded-xl border p-2 text-left transition active:scale-[0.98] ${
                  selected
                    ? "border-neutral-950 bg-white shadow-sm ring-1 ring-neutral-950/10"
                    : "border-neutral-200 bg-neutral-50"
                }`}
              >
                <ThemeModePreview mode={option.value} />
                <span className="mt-1.5 flex items-center justify-between gap-1">
                  <span className="truncate type-caption font-black text-neutral-950">{option.label}</span>
                  {selected ? (
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-neutral-950 type-caption font-black text-white">✓</span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      </AppearanceSection>

      <AppearanceSection
        id="visual-style"
        title={t.settings.visualStyleTitle}
        description={t.settings.visualStyleDescription}
      >
        <div className="grid grid-cols-2 gap-2">
          {styleOptions.map((option) => {
            const selected = visualStyle === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setVisualStyle(option.value)}
                className={`appearance-compact-option rounded-xl border p-2 text-left transition active:scale-[0.98] ${
                  selected
                    ? "border-neutral-950 bg-white shadow-sm ring-1 ring-neutral-950/10"
                    : "border-neutral-200 bg-neutral-50"
                }`}
              >
                <StylePreview style={option.value} />
                <span className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-neutral-950">{option.label}</span>
                  {selected ? (
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-neutral-950 type-caption font-black text-white">✓</span>
                  ) : null}
                </span>
                <span className="mt-0.5 block type-caption font-semibold leading-3.5 text-neutral-500">
                  {option.description}
                </span>
              </button>
            )
          })}
        </div>
      </AppearanceSection>

      {visualStyle === "colorful" ? (
        <AppearanceSection
          id="color-palette"
          title={t.settings.colorfulPaletteTitle}
          description={t.settings.colorfulPaletteDescription}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {paletteOptions.map((option) => {
              const selected = colorfulPalette === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setColorfulPalette(option.value)}
                  className={`colorful-palette-option min-h-16 rounded-xl border px-2.5 py-2 text-left transition active:scale-[0.98] ${
                    selected
                      ? "border-neutral-950 bg-white shadow-sm ring-1 ring-neutral-950/10"
                      : "border-neutral-200 bg-neutral-50"
                  }`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <PaletteSwatches palette={option.value} />
                    {selected ? (
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-neutral-950 type-caption font-black text-white">✓</span>
                    ) : null}
                  </span>
                  <span className="mt-1.5 block type-caption font-black leading-4 text-neutral-950">{option.label}</span>
                </button>
              )
            })}
          </div>
          {selectedPalette ? (
            <p className="mt-2 px-1 type-caption font-semibold leading-4 text-neutral-500">
              {selectedPalette.description}
            </p>
          ) : null}
        </AppearanceSection>
      ) : null}

      <p className="px-1 pb-1 type-caption font-semibold leading-4 text-neutral-400">
        {t.settings.appearanceDeviceOnly}
      </p>
    </div>
  )
}
