import { useI18n } from "@/i18n/I18nProvider"
import type { TraditionalPlan } from "@/lib/traditionalTournament"
import type { TraditionalScheduleEntry } from "@/lib/traditionalTournamentSchedule"
import { traditionalMatchLabel, traditionalSourceLabel } from "@/lib/traditionalTournamentLabels"
import styles from "./Tournament.module.css"

export function TraditionalTournamentPreview({plan,names,schedule,courts,matchMinutes,transitionMinutes}:{plan:TraditionalPlan;names:ReadonlyMap<string,string>;schedule:TraditionalScheduleEntry[];courts:number;matchMinutes:number;transitionMinutes:number}){
  const {tx,locale}=useI18n(),matches=plan.matches.filter(match=>match.a&&match.b)
  const format=new Intl.DateTimeFormat(locale==="eu"?"eu-ES":locale==="en"?"en-GB":"es-ES",{dateStyle:"short",timeStyle:"short"})
  return <div className="grid gap-3" data-traditional-preview>
    <div className={styles.summaryGrid}>{[[tx("Parejas"),plan.teams.length],[tx("Partidos"),matches.length],[tx("Grupos"),plan.groups.length],[tx("Pases automáticos"),plan.matches.length-matches.length],[tx("Pistas"),courts],[tx("Duración estimada de partido (minutos)"),matchMinutes],[tx("Transición entre partidos (minutos)"),transitionMinutes],[tx("Clasificados por grupo"),plan.configuration.qualifiersPerGroup],[tx("Tercer puesto"),tx(plan.configuration.thirdPlace?"Sí":"No")],[tx("Consolación"),tx(plan.configuration.consolation?"Sí":"No")]].map(([label,value])=><div key={label} className={styles.metric}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <p className={styles.help}>{tx("La participación depende del avance en el cuadro. Las duraciones sirven para planificar; no limitan el partido.")}</p>
    {plan.groups.length?<div className="grid gap-2">{plan.groups.map((group,i)=><p key={group.id} className="text-xs leading-5"><strong>{tx("Grupo")} {i+1}: </strong>{group.teamIds.map(id=>names.get(id)).join(" · ")}</p>)}</div>:null}
    <details className={styles.help}><summary>{tx("Vista previa del cuadro y horarios")}</summary><ol className="grid gap-2">{plan.matches.map(match=>{
      const slot=schedule.find(slot=>slot.matchId===match.id)
      return <li key={match.id} className="rounded-xl border border-neutral-200 p-2"><p className="font-bold">{traditionalMatchLabel(plan,match,tx)}</p><p>{traditionalSourceLabel(plan,match.a,names,tx)} · {traditionalSourceLabel(plan,match.b,names,tx)}</p>{slot?<p>{format.format(new Date(slot.startsAt))} · {tx("Pista")} {slot.court}</p>:null}</li>
    })}</ol></details>
  </div>
}
