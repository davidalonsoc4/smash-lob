"use client"

import { useEffect, useState } from "react"
import { BackButton } from "@/components/ui/BackButton"
import { useI18n } from "@/i18n/I18nProvider"
import { translateLeagueText } from "@/i18n/leagueText"
import { loadRapidAudio, saveRapidAudio, type RapidAudioSettings as Settings } from "@/lib/rapidAudioSettings"
import { cancelRapidPlayback, disableRapidAudio, enableRapidAudio, previewRapidAudio, suspendRapidAudio } from "@/lib/rapidTournamentAudio"
import styles from "./Tournament.module.css"

export function RapidAudioSettings({ value, onChange, onPreview, previewDisabled = false, expanded = false }: { value: Settings; onChange: (next: Settings) => void; onPreview: () => void; previewDisabled?: boolean; expanded?: boolean }) {
  const { tx } = useI18n()
  const sounds: Array<[Settings["sound"], string]> = [["beep", tx("Pitidos deportivos")], ["bell", tx("Campana")], ["whistle", tx("Silbato")], ["gong", tx("Gong")], ["chime", tx("Carillón")], ["horn", tx("Bocina")], ["sonar", tx("Sonar")], ["arcade", tx("Arcade")]]
  const select = (key: keyof Settings, label: string, options: Array<[string, string]>, disabled = false) => <label className="block min-w-0 space-y-1"><span className="text-xs font-bold">{tx(label)}</span><select className={styles.field} value={String(value[key])} disabled={disabled} onChange={(event) => onChange({ ...value, [key]: event.target.value })}>{options.map(([id, name]) => <option key={id} value={id}>{tx(name)}</option>)}</select></label>
  return <section className={styles.audioCard} aria-label={tx("Sonidos y avisos")}>
    <div className={styles.audioHeading}><div className="min-w-0"><h2 className="type-panel-title font-black">{tx("Sonidos y avisos")}</h2><p className={styles.help}>{value.mode === "voice" ? tx("Solo voz") : sounds.find(([id]) => id === value.sound)?.[1]}</p></div><button type="button" className={styles.secondary} disabled={previewDisabled} onClick={onPreview}><span aria-hidden="true">♪</span>{tx("Probar sonido")}</button></div>
    <details className={styles.audioSettings} open={expanded || undefined}><summary>{tx("Configurar avisos")}</summary><div className="grid gap-3 pt-3">
      {select("mode", "Reproducir", [["both", tx("Sonido y voz")], ["tone", tx("Solo sonido")], ["voice", tx("Solo voz")]])}
      <div className="grid grid-cols-2 gap-2">{select("sound", tx("Sonido del aviso"), sounds, value.mode === "voice")}{select("intensity", "Intensidad", [["soft", tx("Suave")], ["normal", tx("Normal")], ["loud", tx("Alta")]])}</div>
      {select("language", tx("Idioma de los avisos"), [["app", tx("Idioma de la app")], ["es", tx("Español")], ["en", "English"], ["both", tx("English + Español")]], value.mode === "tone")}
      <label className={styles.audioSwitch}><span><span className="block text-sm font-bold">{tx("Cuenta atrás de 3 segundos")}</span><span className={styles.help}>{tx("Antes de empezar y terminar cada ronda.")}</span></span><input type="checkbox" checked={value.countdown} onChange={(event) => onChange({ ...value, countdown: event.target.checked })} /></label>
      <p className={styles.help}>{tx("Voz automática del dispositivo según el idioma. En bilingüe: inglés, pausa y español; la cuenta atrás se dice una sola vez en inglés.")}</p>
      <p className={styles.help}>{tx("Se guarda en este dispositivo. El volumen máximo depende del móvil o del altavoz.")}</p>
    </div></details>
  </section>
}

export function RapidAudioSettingsScreen() {
  const { tx, locale, t } = useI18n()
  const [settings, setSettings] = useState(loadRapidAudio)
  const [error, setError] = useState(false)
  useEffect(() => {
    const hide = () => { if (document.hidden) suspendRapidAudio() }
    document.addEventListener("visibilitychange", hide)
    return () => { document.removeEventListener("visibilitychange", hide); disableRapidAudio() }
  }, [])
  async function preview() {
    const ok = await enableRapidAudio("settings-preview")
    setError(!ok)
    if (ok && !document.hidden && window.location.pathname === "/settings/sounds") previewRapidAudio("settings-preview", Object.fromEntries((["es", "en", "eu"] as const).map((lang) => [lang, translateLeagueText(lang, "Prueba de sonido. Quedan dos minutos.")])), locale, settings)
  }
  return <div className={`${styles.theme} compact-page space-y-4`}>
    <header className="app-page-header"><BackButton fallbackHref="/settings" returnToParam="returnTo" label={t.common.back} /><h1 className="type-page-title mt-0.5 font-black">{tx("Sonidos y avisos")}</h1><p className={styles.help}>{tx("Avisos de las rondas de tus torneos. Independientes de las notificaciones push.")}</p></header>
    <RapidAudioSettings value={settings} expanded onPreview={() => void preview()} onChange={(value) => { cancelRapidPlayback(); setSettings(value); saveRapidAudio(value) }} />
    {error ? <p role="alert" className={styles.help}>{tx("No se ha podido reproducir el sonido. Vuelve a pulsar Probar sonido.")}</p> : null}
    <p className={styles.help}>{tx("Los avisos requieren Seguimiento visible. Si usas Bluetooth, revisa el apagado automático del altavoz.")}</p>
  </div>
}
