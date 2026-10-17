import { useEffect, useState } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import type { RapidAudioSettings as Settings } from "@/lib/rapidAudioSettings"
import styles from "./Tournament.module.css"

export function RapidAudioSettings({ value, onChange }: { value: Settings; onChange: (next: Settings) => void }) {
  const { tx, locale } = useI18n()
  const [voices, setVoices] = useState(() => typeof window === "undefined" ? [] : window.speechSynthesis?.getVoices() ?? [])
  useEffect(() => { const synth = window.speechSynthesis; if (!synth) return; const update = () => setVoices(synth.getVoices()), timer = window.setTimeout(update, 0); synth.addEventListener("voiceschanged", update); return () => { window.clearTimeout(timer); synth.removeEventListener("voiceschanged", update) } }, [])
  const select = (key: keyof Settings, label: string, options: Array<[string, string]>, disabled = false) => <label className="block space-y-1"><span className="text-sm font-bold">{tx(label)}</span><select className={styles.field} value={String(value[key])} disabled={disabled} onChange={(event) => onChange({ ...value, [key]: event.target.value })}>{options.map(([id, name]) => <option key={id} value={id}>{tx(name)}</option>)}</select></label>
  const voiceSelect = (lang: "es" | "en") => {
    const key = lang === "es" ? "voiceEs" : "voiceEn", available = voices.filter((voice) => voice.lang.toLowerCase().startsWith(lang)), saved = value[key]
    return select(key, lang === "es" ? "Voz en español" : "Voz en inglés", [["", "Automática del dispositivo"], ...(saved && !available.some((voice) => voice.voiceURI === saved) ? [[saved, tx("Voz guardada no disponible · automática")] as [string, string]] : []), ...available.map((voice): [string, string] => [voice.voiceURI, `${voice.name} (${voice.lang})`])], value.mode === "tone")
  }
  return <details className={`${styles.audioSettings} space-y-3`}><summary className="flex min-h-11 cursor-pointer items-center text-sm font-bold">{tx("Configurar avisos")}</summary><div className="grid gap-3">
    {select("mode", "Reproducir", [["both", "Sonido y voz"], ["tone", "Solo sonido"], ["voice", "Solo voz"]])}
    {select("sound", tx("Sonido del aviso"), [["beep", "Pitidos deportivos"], ["bell", "Campana"], ["whistle", "Silbato"], ["gong", "Gong"]], value.mode === "voice")}
    {select("intensity", "Intensidad", [["soft", "Suave"], ["normal", "Normal"], ["loud", "Alta"]])}
    <p className={styles.help}>{tx("El volumen máximo lo fija el móvil o el altavoz. Prueba el sonido después de cambiarlo.")}</p>
    {select("language", tx("Idioma de los avisos"), [["app", tx("Idioma de la app")], ["es", tx("Español")], ["en", "English"], ["both", tx("English + Español")]], value.mode === "tone")}
    {(value.language === "es" || value.language === "both" || (value.language === "app" && locale === "es")) ? voiceSelect("es") : null}
    {(value.language === "en" || value.language === "both" || (value.language === "app" && locale === "en")) ? voiceSelect("en") : null}
    <p className={styles.help}>{tx("Las voces dependen del dispositivo; algunas necesitan conexión. Si una voz no está disponible, se usa una automática.")}</p>
    <label className="flex min-h-11 items-center justify-between gap-3 text-sm font-bold"><span>{tx("Cuenta atrás de 3 segundos")}</span><input type="checkbox" checked={value.countdown} onChange={(event) => onChange({ ...value, countdown: event.target.checked })} /></label>
    <p className={styles.help}>{tx("Antes de empezar y terminar cada ronda. Audios fijos en español o inglés; en bilingüe, una sola cuenta en inglés.")}</p>
    <p className={styles.help}>{tx("Preferencias guardadas en este dispositivo. Si usas Bluetooth, revisa el apagado automático del altavoz.")}</p>
  </div></details>
}
