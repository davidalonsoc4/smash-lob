import { useI18n } from "@/i18n/I18nProvider"
import { NumberStepper, SelectChevron } from "./TournamentFormControls"
import { TraditionalTournamentDrawFields } from "./TraditionalTournamentDrawFields"
import { type TraditionalSetup } from "@/lib/traditionalTournamentSetup"
import type { FixedTournamentTeam } from "@/lib/fixedRapidTournament"
import type { TraditionalPlan } from "@/lib/traditionalTournament"
import styles from "./Tournament.module.css"

export function TraditionalTournamentFields({setup,onChange,teams,names,plan}:{setup:TraditionalSetup;onChange:(setup:TraditionalSetup)=>void;teams:FixedTournamentTeam[];names:ReadonlyMap<string,string>;plan:TraditionalPlan|null}){
  const {tx}=useI18n()
  const update=(value:Partial<TraditionalSetup>)=>onChange({...setup,...value})
  return <div className="grid gap-3">
    {setup.format!=="knockout"?<NumberStepper label={tx("Número de grupos")} value={setup.groupCount} values={Array.from({length:Math.max(1,Math.floor(teams.length/2))},(_,i)=>i+1).filter(n=>setup.format!=="groups_knockout"||n>=2)} onChange={groupCount=>update({groupCount,manualGroups:false})} tx={tx} />:null}
    {setup.format==="groups_knockout"?<NumberStepper label={tx("Clasificados por grupo")} value={setup.qualifiersPerGroup} values={Array.from({length:Math.max(1,Math.floor(teams.length/Math.max(1,setup.groupCount)))},(_,i)=>i+1)} onChange={qualifiersPerGroup=>update({qualifiersPerGroup})} tx={tx} />:null}
    {setup.format!=="groups"?<><label className="flex min-h-11 items-center justify-between gap-3 text-sm font-semibold">{tx("Partido por el tercer puesto")}<input type="checkbox" checked={setup.thirdPlace} onChange={event=>update({thirdPlace:event.target.checked})}/></label><label className="flex min-h-11 items-center justify-between gap-3 text-sm font-semibold">{tx("Cuadro de consolación")}<input type="checkbox" checked={setup.consolation} onChange={event=>update({consolation:event.target.checked})}/></label><p className={styles.help}>{tx(setup.format==="knockout"?"La consolación reúne a quienes pierden en primera ronda. Los pases automáticos no cuentan como derrotas.":"La consolación reúne a las parejas que no se clasifican desde los grupos.")}</p></>:null}
    <label className="grid gap-1 text-sm font-bold">{tx("Planificación del calendario")}<SelectChevron><select className={`${styles.field} ${styles.selectField}`} value={setup.scheduleMode} onChange={event=>update({scheduleMode:event.target.value as TraditionalSetup["scheduleMode"]})}><option value="automatic">{tx("Automática, editable después")}</option><option value="manual">{tx("Manual, sin horarios iniciales")}</option></select></SelectChevron></label>
    <TraditionalTournamentDrawFields setup={setup} onChange={onChange} teams={teams} names={names} plan={plan}/>
  </div>
}
