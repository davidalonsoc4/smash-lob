import { useI18n } from "@/i18n/I18nProvider"

export type PersonalProfileSection = "summary" | "relations" | "head-to-head"

export function ProfileSectionTabs({
  section,
  onSectionChange,
}: {
  section: PersonalProfileSection
  onSectionChange: (section: PersonalProfileSection) => void
}) {
  const { tx } = useI18n()
  return (
    <div data-profile-sections data-personal-profile-sections className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">
      {[
        ["summary", tx("Resumen")],
        ["relations", tx("Parejas / rivales")],
        ["head-to-head", tx("Cara a cara")],
      ].map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={section === value}
          onClick={() => onSectionChange(value as PersonalProfileSection)}
          className={`rounded-lg px-1.5 py-1.5 type-caption font-black transition ${section === value ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500"}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
