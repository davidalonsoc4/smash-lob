"use client"

import type { ReactNode } from "react"
import { formatMoney } from "@/lib/courtBooking"
import type { SeasonRegistrationFee } from "@/lib/seasonRegistration"
import { useI18n } from "@/i18n/I18nProvider"
type LeagueRulesSummaryProps = {
  registrationFee?: SeasonRegistrationFee | null
  className?: string
}
type RuleSectionProps = {
  title: string
  children: ReactNode
}
function RuleSection({ title, children }: RuleSectionProps) {
  return (
    <section className="rounded-2xl bg-neutral-50 px-3 py-3 ring-1 ring-neutral-100">
      <h3 className="type-panel-title text-neutral-950">{title}</h3>
      <div className="mt-2 space-y-2 text-xs font-semibold leading-5 text-neutral-600">
        {children}
      </div>
    </section>
  )
}
function RuleList({ children }: { children: ReactNode }) {
  return <ul className="space-y-1.5">{children}</ul>
}
function RuleItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="shrink-0 text-neutral-400">•</span>
      <span>{children}</span>
    </li>
  )
}
export function LeagueRulesSummary({
  registrationFee,
  className = "",
}: LeagueRulesSummaryProps) {
  const { tx } = useI18n()
  const hasRegistrationFee = Boolean(
    registrationFee?.enabled && registrationFee.amount > 0,
  )
  const registrationAmountLabel = hasRegistrationFee
    ? formatMoney(registrationFee?.amount ?? 0)
    : "el importe definido por el organizador"
  const registrationPurpose = registrationFee?.purpose?.trim()
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="rounded-2xl bg-neutral-950 px-3 py-3 text-white">
        <p className="type-caption font-black uppercase tracking-[0.2em] text-white/50">
          {tx("Reglamento oficial")}
        </p>
        <h2 className="type-section-title mt-1 text-lg font-black tracking-tight">
          {tx("II Edición Smash & Lob")}{" "}</h2>
        <p className="mt-1 text-xs font-semibold leading-5 text-white/70">
          {tx("Formato pensado para exprimir las 2 horas de pista, premiar la constancia y mantener la competitividad hasta el último juego.")}{" "}</p>
      </div>
      <RuleSection title={tx("💰 Inscripción, fianza y cena")}>
        <RuleList>
          <RuleItem>
            <strong>{tx("Cuota:")}</strong> {registrationAmountLabel} {tx("por persona.")}{" "}{hasRegistrationFee
              ? tx(" El estado del pago se gestiona desde la app.")
              : tx(" Si la temporada tiene cuota, aparecerá informada antes de reclamar jugador.")}
          </RuleItem>
          <RuleItem>
            <strong>{tx("Fondo y fianza:")}</strong> {tx("la inscripción funciona como fondo de compromiso para cubrir reservas, botes nuevos, premios y gastos comunes.")}{" "}</RuleItem>
          <RuleItem>
            <strong>{tx("Cena/comida final:")}</strong> {tx("el dinero sobrante queda reservado para sufragar la clausura de la liga.")}{" "}</RuleItem>
          <RuleItem>
            <strong>{tx("Material:")}</strong> {tx("se estrenará un bote de bolas nuevo por partido. El reparto de botes se organizará al inicio de la temporada.")}{" "}</RuleItem>
        </RuleList>
        {registrationPurpose ? (
          <p className="rounded-2xl bg-white px-3 py-2 text-neutral-700 ring-1 ring-neutral-100">
            <strong>{tx("Destino indicado por el organizador:")}</strong> {registrationPurpose}
          </p>
        ) : null}
      </RuleSection>
      <RuleSection title={tx("📅 Organización, buena fe y plazos")}>
        <RuleList>
          <RuleItem>
            <strong>{tx("Calendario equilibrado:")}</strong> {tx("el cuadrante busca que todos jueguen con todos y contra todos de la forma más justa posible.")}{" "}</RuleItem>
          <RuleItem>
            <strong>{tx("Buena fe:")}</strong> {tx("la fecha de jornada es una referencia. Si hay vacaciones, lesiones o problemas de agenda, el partido se aplaza y se recupera.")}{" "}</RuleItem>
          <RuleItem>
            <strong>{tx("Fecha de corte:")}</strong> {tx("todos los partidos de liga regular deben estar jugados antes del fin de semana de clausura.")}{" "}</RuleItem>
        </RuleList>
      </RuleSection>
      <RuleSection title={tx("🩹 Suplentes y reemplazos")}>
        <RuleList>
          <RuleItem>
            {tx("La organización puede mantener una bolsa de suplentes y añadir nuevos perfiles durante la temporada cuando sea necesario.")}{" "}</RuleItem>
          <RuleItem>
            {tx("Una sustitución puntual afecta únicamente al partido seleccionado y puede deshacerse antes de registrar el resultado.")}{" "}</RuleItem>
          <RuleItem>
            {tx("Un reemplazo permanente se aplica desde una jornada concreta: el titular saliente conserva su histórico y el nuevo titular comienza desde cero.")}{" "}</RuleItem>
          <RuleItem>
            {tx("Los puntos, MVP, confirmaciones y pagos corresponden siempre a quien disputa realmente el partido. El titular ausente no hereda esos puntos.")}{" "}</RuleItem>
        </RuleList>
      </RuleSection>
      <RuleSection title={tx("🎾 Sistema de competición y puntuación")}>
        <RuleList>
          <RuleItem>
            <strong>{tx("Duración:")}</strong> {tx("los partidos serán siempre de 2 horas.")}{" "}</RuleItem>
          <RuleItem>
            <strong>{tx("Sets:")}</strong> {tx("se juegan 3 sets obligatorios. Cada set ganado suma 1 punto individual.")}{" "}</RuleItem>
          <RuleItem>
            <strong>{tx("Reparto:")}</strong> {tx("un 3-0 da 3 puntos a cada ganador. Un 2-1 da 2 puntos a cada ganador y 1 a cada perdedor.")}{" "}</RuleItem>
          <RuleItem>
            <strong>{tx("Star Point:")}</strong> {tx("ventajas clásicas y punto de oro en el tercer 40-40.")}{" "}</RuleItem>
        </RuleList>
      </RuleSection>
      <RuleSection title={tx("✨ Pareja MVP de la jornada")}>
        <p>
          {tx("La pareja con la victoria más demoledora de la jornada recibirá la mención de Pareja MVP: prioridad al 3-0 y después a la mayor diferencia de juegos.")}{" "}</p>
      </RuleSection>
      <RuleSection title={tx("⏳ Tercer set incompleto")}>
        <RuleList>
          <RuleItem>
            {tx("Si una pareja lidera por 2 o más juegos cuando termina el tiempo, se lleva el punto del set.")}{" "}</RuleItem>
          <RuleItem>
            {tx("Si hay empate o solo 1 juego de diferencia, el set se considera nulo y se reparte 0,5 puntos a cada jugador.")}{" "}</RuleItem>
        </RuleList>
      </RuleSection>
      <RuleSection title={tx("🏆 Desempates en el ranking")}>
        <RuleList>
          <RuleItem>
            <strong>{tx("1. Game average:")}</strong> {tx("mayor diferencia total de juegos.")}{" "}</RuleItem>
          <RuleItem>
            <strong>{tx("2. Juegos a favor:")}</strong> {tx("quien haya ganado más juegos totales en la liga.")}{" "}</RuleItem>
        </RuleList>
        <p className="rounded-2xl bg-white px-3 py-2 text-neutral-700 ring-1 ring-neutral-100">
          {tx("No conviene relajarse ni en el último juego del tercer set: la diferencia de juegos puede decidir al campeón.")}{" "}</p>
      </RuleSection>
    </div>
  )
}
