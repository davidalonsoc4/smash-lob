// Tutorial genérico 27 · Cerrar la temporada y empezar la siguiente (administración; solo lo ve quien tiene rol de creador). Datos ficticios.
import { mkAdmin, Spec } from "./GenAdmin";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen27";

const spec: Spec = {
  BOUNDS, VOICE, voice: "voice-gen27-david.mp3", stageEnd: 5,
  hook: { text: "Cuando se juega\nla última jornada,\nfinaliza la *temporada*", words: ["Cuando", "se", "juega", "la", "última", "jornada", "finaliza", "la", "temporada"] },
  tags: ["AVISO DE APLAZADOS", "TEMPORADA CERRADA", "SIGUIENTE CICLO", "PREPARA LA SIGUIENTE"],
  views: [
    { a: 1, b: 1, title: "Finalizar temporada", sub: "Partidos aplazados sin jugar", items: [
      { k: "note", t: "Hay partidos aplazados fuera de fecha: no se jugarán ni puntuarán", tone: "info", a: [1, "aplazados"] }, { k: "btn", t: "Finalizar de todos modos", ghost: true, a: [1, "avisa"], hl: [1, "avisa"] }] },
    { a: 2, b: 2, title: "Temporada finalizada", sub: "Solo lectura", items: [
      { k: "row", t: "Enhorabuena a la persona ganadora", s: "La temporada ha finalizado", ico: "★", a: [2, "felicita"], hl: [2, "ganadora"] }, { k: "row", t: "MVP de la temporada", s: "Reconocimientos finales", ico: "◆", a: [2, "MVP"] }] },
    { a: 3, b: 4, title: "Siguiente ciclo", sub: "Nueva temporada", items: [
      { k: "btn", t: "Crear temporada desde cero", a: [3, "nueva"], hl: [3, "cero"] }, { k: "btn", t: "Duplicar la temporada anterior", ghost: true, a: [3, "duplica"], hl: [3, "duplica"] }] },
  ],
  pops: [[1, "aplazados"], [1, "avisa"], [2, "felicita"], [2, "MVP"], [3, "nueva"], [3, "duplica"]],
};
const g = mkAdmin(spec);
export const GEN27_FRAMES = g.frames;
export const Gen27Cierre = g.Comp;
