import { useState } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { traditionalMatchLabel } from "@/lib/traditionalTournamentLabels"
import { buildTraditionalSchedule,validateTraditionalSchedule,type TraditionalScheduleEntry,type TraditionalScheduleOptions } from "@/lib/traditionalTournamentSchedule"
import type { TraditionalPlan } from "@/lib/traditionalTournament"
import { SelectChevron } from "./TournamentFormControls"
import styles from "./Tournament.module.css"

function localTime(value:string){const date=new Date(value);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}T${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`}
export function TraditionalCalendarEditor({plan,initial,options,playedIds,busy,onSave}:{plan:TraditionalPlan;initial:TraditionalScheduleEntry[];options:TraditionalScheduleOptions;playedIds:ReadonlySet<string>;busy:boolean;onSave:(schedule:TraditionalScheduleEntry[])=>Promise<void>}){
  const {tx}=useI18n(),[entries,setEntries]=useState(()=>initial),[error,setError]=useState("")
  const matches=plan.matches.filter(match=>match.a&&match.b)
  function update(id:string,field:"startsAt"|"endsAt"|"court",value:string){
    const current=entries.find(entry=>entry.matchId===id),start=Date.parse(options.startsAt)
    const next=current??{matchId:id,court:1,startsAt:new Date(start).toISOString(),endsAt:new Date(start+options.matchMinutes*60000).toISOString()}
    let changed={...next}
    if(field==="court")changed.court=Number(value)
    else {const date=new Date(value);if(!value||!Number.isFinite(date.getTime()))return;changed={...next,[field]:date.toISOString()};if(field==="startsAt")changed.endsAt=new Date(date.getTime()+Math.max(60000,Date.parse(next.endsAt)-Date.parse(next.startsAt))).toISOString()}
    setEntries(previous=>[...previous.filter(entry=>entry.matchId!==id),changed]);setError("")
  }
  function save(){try{validateTraditionalSchedule(plan,entries,options);setError("");void onSave(entries)}catch{setError(tx("Revisa los horarios: respeta los cruces previos, las transiciones y evita solapar parejas o pistas."))}}
  function automatic(){try{const generated=buildTraditionalSchedule(plan,options);setEntries(generated.map(entry=>playedIds.has(entry.matchId)?initial.find(old=>old.matchId===entry.matchId)??entry:entry));setError("")}catch{setError(tx("No se ha podido calcular el calendario."))}}
  return <details className={`${styles.panel} ${styles.section}`}><summary>{tx("Editar horarios y pistas")}</summary><div className={styles.sectionBody}>
    <p className={styles.help}>{tx("Puedes programar partidos en días distintos o dejarlos pendientes. Los partidos disputados conservan su horario.")}</p>
    <button type="button" className={styles.secondary} onClick={automatic} disabled={busy}>{tx("Proponer horarios automáticos")}</button>
    {matches.map(match=>{const slot=entries.find(entry=>entry.matchId===match.id),locked=playedIds.has(match.id);return <fieldset key={match.id} disabled={locked||busy} className="min-w-0 rounded-xl border border-neutral-200 p-3"><legend className="px-1 text-xs font-bold">{traditionalMatchLabel(plan,match,tx)}</legend>
      <label className="flex min-h-11 items-center justify-between gap-2 text-sm">{tx("Programar partido")}<input type="checkbox" checked={Boolean(slot)} onChange={event=>event.target.checked?update(match.id,"court","1"):setEntries(previous=>previous.filter(entry=>entry.matchId!==match.id))}/></label>
      {slot?<div className="grid gap-2"><label className="grid min-w-0 gap-1 text-xs font-bold">{tx("Inicio")}<input className={styles.field} type="datetime-local" value={localTime(slot.startsAt)} onChange={event=>update(match.id,"startsAt",event.target.value)}/></label><label className="grid min-w-0 gap-1 text-xs font-bold">{tx("Fin estimado")}<input className={styles.field} type="datetime-local" value={localTime(slot.endsAt)} onChange={event=>update(match.id,"endsAt",event.target.value)}/></label>
        <label className="grid gap-1 text-xs font-bold">{tx("Pista")}<SelectChevron><select className={`${styles.field} ${styles.selectField}`} value={slot.court} onChange={event=>update(match.id,"court",event.target.value)}>{Array.from({length:options.courts},(_,i)=><option key={i+1} value={i+1}>{tx("Pista")} {i+1}</option>)}</select></SelectChevron></label></div>:null}
    </fieldset>})}
    {error?<p role="alert" className="text-sm font-semibold text-red-700">{error}</p>:null}
    <button type="button" className={styles.primary} onClick={save} disabled={busy}>{tx("Guardar calendario")}</button>
  </div></details>
}
