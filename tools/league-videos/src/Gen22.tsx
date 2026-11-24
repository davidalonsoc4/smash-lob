// Tutorial genérico 22 · Crear una temporada (administración; solo lo ve quien tiene rol de creador). Datos ficticios.
import { mkAdmin, Spec } from "./GenAdmin";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen22";

const spec: Spec = {
  BOUNDS, VOICE, voice: "voice-gen22-david.mp3", stageEnd: 6,
  hook: { text: "Una *temporada*\nse configura\nen cuatro bloques", words: ["Una", "temporada", "se", "configura", "en", "cuatro", "bloques"] },
  tags: ["CALENDARIO", "INICIO Y VISIBILIDAD", "REGLAS DE JUEGO", "ORGANIZACIÓN", "REVISA Y CONFIRMA"],
  views: [
    { a: 1, b: 1, title: "Nueva temporada", sub: "Calendario y duración", items: [
      { k: "field", l: "Participantes", v: "8 jugadores", a: [1, "participantes"] }, { k: "field", l: "Jornadas totales", v: "7 jornadas", a: [1, "jornadas"] },
      { k: "field", l: "Partidos y descansos por jornada", v: "2 partidos · 0 descansos", a: [1, "partidos"] },
      { k: "chips", items: ["Vuelta única", "Doble vuelta", "Temporada larga"], a: [1, "vuelta"], sel: 0, selAt: [1, "única"] }] },
    { a: 2, b: 2, title: "Nueva temporada", sub: "Inicio y visibilidad", items: [
      { k: "toggle", t: "Inicio programado", a: [2, "programa"], on: [2, "fecha"] }, { k: "field", l: "Jornada inaugural", v: "Domingo · 12:00", a: [2, "inaugural"] },
      { k: "row", t: "Calendario visible", s: "Decide cuándo se ve", ico: "◷", a: [2, "calendario"], hl: [2, "calendario"] }] },
    { a: 3, b: 3, title: "Nueva temporada", sub: "Reglas de juego", items: [
      { k: "chips", items: ["Tres sets completos", "Al mejor de tres"], a: [3, "sets"], sel: 1, selAt: [3, "mejor"] },
      { k: "row", t: "Sistema de MVP", s: "Sin MVP, automático o por votación", ico: "★", a: [3, "MVP"] },
      { k: "row", t: "Confirmación de resultados", s: "Sin confirmación, adicional u obligatoria", ico: "✓", a: [3, "confirmación"] }] },
    { a: 4, b: 4, title: "Nueva temporada", sub: "Organización y pagos", items: [
      { k: "toggle", t: "Bolas asignadas por la organización", a: [4, "bolas"], on: [4, "bolas"] }, { k: "toggle", t: "Cuota de inscripción", a: [4, "cuota"], on: [4, "cuota"] }] },
    { a: 5, b: 5, title: "Resumen de la temporada", sub: "Revisa los datos antes de confirmar", items: [
      { k: "note", t: "Calendario y duración", a: [5, "resumen"] }, { k: "note", t: "Inicio y visibilidad", a: [5, "confirmar"] }, { k: "note", t: "Reglas y organización", a: [5, "editar"] },
      { k: "btn", t: "Crear temporada", a: [5, "bloque"], hl: [5, "resto"] }] },
  ],
  pops: [[1, "participantes"], [1, "jornadas"], [1, "vuelta"], [2, "programa"], [2, "inaugural"], [2, "calendario"], [3, "sets"], [3, "MVP"], [3, "confirmación"], [4, "bolas"], [4, "cuota"], [5, "resumen"], [5, "editar"]],
};
const g = mkAdmin(spec);
export const GEN22_FRAMES = g.frames;
export const Gen22Temporada = g.Comp;
