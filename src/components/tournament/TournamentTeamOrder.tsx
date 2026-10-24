import { useI18n } from "@/i18n/I18nProvider"
import styles from "./Tournament.module.css"

export function TournamentTeamOrder({order,names,onChange}:{order:string[];names:ReadonlyMap<string,string>;onChange:(order:string[])=>void}){
  const {tx}=useI18n()
  function move(index:number,direction:number){const next=[...order];[next[index],next[index+direction]]=[next[index+direction],next[index]];onChange(next)}
  return <ol className="grid gap-2">{order.map((id,index)=><li key={id} className="flex min-w-0 items-center gap-2 rounded-xl border border-neutral-200 p-2">
    <span className="text-xs font-bold tabular-nums">{index+1}</span><span className="min-w-0 flex-1 break-words text-sm font-semibold">{names.get(id)}</span>
    <button type="button" className={`${styles.secondary} shrink-0`} disabled={index===0} aria-label={`${tx("Subir pareja")}: ${names.get(id)}`} onClick={()=>move(index,-1)}>↑</button>
    <button type="button" className={`${styles.secondary} shrink-0`} disabled={index===order.length-1} aria-label={`${tx("Bajar pareja")}: ${names.get(id)}`} onClick={()=>move(index,1)}>↓</button>
  </li>)}</ol>
}
