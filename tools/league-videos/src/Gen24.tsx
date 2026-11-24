// Tutorial genérico 24 · Economía de la temporada (administración; solo lo ve quien tiene rol de creador). Datos ficticios.
import { mkAdmin, Spec } from "./GenAdmin";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen24";

const spec: Spec = {
  BOUNDS, VOICE, voice: "voice-gen24-david.mp3", stageEnd: 6,
  hook: { text: "Lleva las cuentas\nde tu temporada\nen *Economía*", words: ["Lleva", "las", "cuentas", "de", "tu", "temporada", "en", "Economía"] },
  tags: ["INSCRIPCIONES", "REGISTRA GASTOS", "SOLO LA ORGANIZACIÓN", "INFORME DE TRANSPARENCIA", "TU PRIMER GASTO"],
  views: [
    { a: 1, b: 1, title: "Economía de temporada", sub: "Estado de inscripciones", items: [
      { k: "money", l: "Inscripciones pagadas", v: "6 de 8", a: [1, "pagado"], tone: "ok" }, { k: "money", l: "Pendientes por aportar", v: "2", a: [1, "pendiente"], tone: "no" }, { k: "toggle", t: "Inscripción activada", a: [1, "inscripción"], on: [1, "inscripción"] }] },
    { a: 2, b: 2, title: "Economía de temporada", sub: "Registrar gasto", items: [
      { k: "field", l: "Concepto", v: "Bolas jornada de apertura", a: [2, "bolas"] }, { k: "field", l: "Importe", v: "12,00 €", a: [2, "importe"] },
      { k: "btn", t: "Añadir gasto", a: [2, "gasto"], hl: [2, "concepto"] }, { k: "money", l: "Saldo disponible", v: "36,00 €", a: [2, "saldo"], tone: "ok" }] },
    { a: 3, b: 3, title: "Economía de temporada", sub: "Pantalla privada", items: [
      { k: "note", t: "Solo la ve la organización", tone: "no", a: [3, "privada"] }, { k: "note", t: "No se publica en la app", tone: "info", a: [3, "organización"] }] },
    { a: 4, b: 5, title: "Comparte las cuentas", sub: "Informe de transparencia", items: [
      { k: "btn", t: "Ver imagen para compartir", a: [4, "imagen"], hl: [4, "imagen"] }, { k: "btn", t: "Exportar Excel (.xlsx)", ghost: true, a: [4, "Excel"], hl: [4, "Excel"] }, { k: "note", t: "Tú decides si lo compartes", tone: "info", a: [4, "decides"] }] },
  ],
  pops: [[1, "pagado"], [1, "pendiente"], [2, "bolas"], [2, "importe"], [2, "saldo"], [3, "privada"], [4, "imagen"], [4, "Excel"]],
};
const g = mkAdmin(spec);
export const GEN24_FRAMES = g.frames;
export const Gen24Economia = g.Comp;
