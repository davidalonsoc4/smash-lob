import type { ReactNode } from "react"
import styles from "./Tournament.module.css"
export function SelectChevron({ children }: { children: ReactNode }) { return <span className={styles.selectWrap}>{children}<svg aria-hidden="true" viewBox="0 0 20 20" className={styles.selectChevron}><path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg></span> }
export function NumberStepper({ label, value, values, onChange, tx, editable = false }: { label: string; value: number; values: readonly number[]; onChange: (value: number) => void; tx: (text: string) => string; editable?: boolean }) {
  const previous = [...values].reverse().find(option => option < value), next = values.find(option => option > value)
  return <div className={styles.stepperRow}><span className={styles.stepperLabel}>{label}</span><div className={styles.stepper}>
    <button type="button" aria-label={`${tx("Disminuir")} ${label}`} disabled={previous === undefined} onClick={() => previous !== undefined && onChange(previous)}>‹</button>
    {editable ? <input type="number" inputMode="numeric" aria-label={`${label}: ${value}`} min={values[0]} max={values.at(-1)} step={1} value={value} onChange={event => { const number = Number(event.target.value); if (Number.isInteger(number) && number >= values[0] && number <= values[values.length - 1]) onChange(number) }} /> : <output aria-label={`${label}: ${value}`} aria-live="polite">{value}</output>}
    <button type="button" aria-label={`${tx("Aumentar")} ${label}`} disabled={next === undefined} onClick={() => next !== undefined && onChange(next)}>›</button>
  </div></div>
}
