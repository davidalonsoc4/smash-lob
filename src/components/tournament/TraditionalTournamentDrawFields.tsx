import { useI18n } from "@/i18n/I18nProvider"
import { NumberStepper, SelectChevron } from "./TournamentFormControls"
import { TournamentTeamOrder } from "./TournamentTeamOrder"
import { traditionalOrder, type TraditionalSetup } from "@/lib/traditionalTournamentSetup"
import type { FixedTournamentTeam } from "@/lib/fixedRapidTournament"
import type { TraditionalPlan } from "@/lib/traditionalTournament"
import styles from "./Tournament.module.css"

export function TraditionalTournamentDrawFields({setup,onChange,teams,names,plan}:{setup:TraditionalSetup;onChange:(setup:TraditionalSetup)=>void;teams:FixedTournamentTeam[];names:ReadonlyMap<string,string>;plan:TraditionalPlan|null}){
  const {tx}=useI18n(),order=traditionalOrder(teams,setup.order)
  const update=(value:Partial<TraditionalSetup>)=>onChange({...setup,...value})
  return (
    <details className={styles.help}><summary>{tx("Sorteo y cabezas de serie")}</summary><div className="grid gap-3">
      <label className="grid gap-1 text-sm font-bold">{tx("Tipo de sorteo")}<SelectChevron><select className={`${styles.field} ${styles.selectField}`} value={setup.drawMode} onChange={event=>update({drawMode:event.target.value as TraditionalSetup["drawMode"]})}><option value="automatic">{tx("Automático")}</option><option value="manual">{tx("Orden manual")}</option></select></SelectChevron></label>
      {setup.drawMode==="automatic"?<NumberStepper label={tx("Cabezas de serie")} value={Math.min(setup.seedCount,teams.length)} values={Array.from({length:teams.length+1},(_,i)=>i)} onChange={seedCount=>update({seedCount})} tx={tx}/>:null}
      <p>{tx(setup.drawMode==="manual"?"Ordena las parejas: las primeras posiciones reciben los pases y la protección del cuadro estándar.":"Las primeras parejas de esta lista serán las cabezas de serie; el resto se sorteará.")}</p>
      <TournamentTeamOrder order={order} names={names} onChange={next=>update({order:next})}/>
      {setup.format!=="knockout"?<><label className="flex min-h-11 items-center justify-between gap-3 text-sm font-bold">{tx("Asignar grupos manualmente")}<input type="checkbox" checked={setup.manualGroups} onChange={event=>update({manualGroups:event.target.checked,assignments:event.target.checked?Object.fromEntries((plan?.groups??[]).flatMap((group,i)=>group.teamIds.map(id=>[id,i+1]))):{}})}/></label>
        {setup.manualGroups?order.map(id=><label key={id} className="grid gap-1 text-sm font-semibold">{names.get(id)}<SelectChevron><select className={`${styles.field} ${styles.selectField}`} aria-label={`${tx("Grupo")}: ${names.get(id)}`} value={setup.assignments[id]??""} onChange={event=>update({assignments:{...setup.assignments,[id]:Number(event.target.value)}})}><option value="">{tx("Selecciona un grupo")}</option>{Array.from({length:setup.groupCount},(_,i)=><option key={i+1} value={i+1}>{tx("Grupo")} {i+1}</option>)}</select></SelectChevron></label>):null}</>:null}
    </div></details>
  )
}
