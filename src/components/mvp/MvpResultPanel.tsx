import type { ReactNode } from "react"
import type { MvpPlayer } from "@/lib/mvp"
import { useI18n } from "@/i18n/I18nProvider"
import { StatusHelp } from "@/components/ui/StatusHelp"

export function MvpResultPanel({
  title,
  players,
  detail,
  action,
}: {
  title: string;
  players: MvpPlayer[];
  detail?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="app-match-mvp-recognition flex items-center gap-2.5 rounded-xl border border-neutral-200 px-3 py-2.5" data-mvp-recognition>
      <span className="app-match-mvp-star text-xl" aria-hidden="true">★</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-neutral-500">
          {title}
        </p>
        <p className="app-match-mvp-name break-words text-lg font-bold leading-snug text-neutral-950">
          {players.map((player) => player.displayName).join(" / ")}
        </p>
        {detail ? (
          <p className="text-xs text-neutral-500">{detail}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function AdjustedIndexHelp({ children }: { children: ReactNode }) {
  const { tx } = useI18n()
  return (
    <StatusHelp label={tx("Información sobre el índice ajustado")} className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2" description={
      <span className="block space-y-2">
        <span className="block font-black">{tx("Cómo se elige el MVP avanzado")}</span>
        <span className="block">{tx("Primero se elige la pareja ganadora más dominante de la jornada: diferencia de juegos y, si empata, sets y juegos a favor y en contra.")}</span>
        <span className="block">{tx("El índice usa los partidos válidos de esta temporada hasta esa jornada. Por partido: resultado (60%), diferencia relativa de sets (25%) y de juegos (15%). Ajusta la aportación estimada según compañeros y rivales, suavizando la estimación cuando hay pocos datos.")}</span>
        <span className="block">{tx("Se muestra multiplicado por 100. Cuanto mayor, mejor; no es un porcentaje ni una escala fija de 0 a 100.")}</span>
        <span className="block">{tx("Si los índices de los dos compañeros difieren en 3 puntos o menos, comparten el MVP por empate técnico.")}</span>
      </span>
    }>
      {children}
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-3 w-3 shrink-0"><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><circle cx="12" cy="7.5" r=".8" fill="currentColor" stroke="none" /></svg>
    </StatusHelp>
  )
}
