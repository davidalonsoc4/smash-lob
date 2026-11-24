// Tutorial genérico 23 · Gestionar la temporada en curso (administración; solo lo ve quien tiene rol de creador). Datos ficticios.
import { mkAdmin, Spec } from "./GenAdmin";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen23";

const spec: Spec = {
  BOUNDS, VOICE, voice: "voice-gen23-david.mp3", stageEnd: 6,
  hook: { text: "Con la temporada\nen marcha,\ntú llevas\nel *control*", words: ["Con", "la", "temporada", "en", "marcha", "tú", "llevas", "el", "control"] },
  tags: ["GESTIÓN DE JORNADAS", "BUZÓN DE INCIDENCIAS", "SUPLENTES Y REEMPLAZOS", "CALENDARIO MAL CREADO", "REVISA TUS JORNADAS"],
  views: [
    { a: 1, b: 1, title: "Gestión de jornadas", sub: "Control manual o modo automático", items: [
      { k: "chips", items: ["Activar", "Finalizar", "Reabrir", "Reordenar"], a: [1, "activar"], sel: 0, selAt: [1, "activar"] },
      { k: "row", t: "Jornada 3 · activa", s: "Fuera de plazo: no", ico: "3", a: [1, "finalizar"], hl: [1, "reabrir"] }, { k: "toggle", t: "Modo automático", a: [1, "automático"], on: [1, "automático"] }] },
    { a: 2, b: 2, title: "Buzón de incidencias", sub: "Avisos de los jugadores", items: [
      { k: "row", t: "Incidencia · Partido de la jornada 3", s: "Un jugador informa de un problema", ico: "!", a: [2, "incidencias"], hl: [2, "incidencias"] }, { k: "btn", t: "Resolver", a: [2, "resuelves"], hl: [2, "resuelves"] }] },
    { a: 3, b: 3, title: "Suplentes y reemplazos", sub: "Bolsa de suplentes", items: [
      { k: "row", t: "Sustitución puntual", s: "Un suplente juega un partido", ico: "↔", a: [3, "puntual"] },
      { k: "row", t: "Reemplazo permanente", s: "El saliente conserva sus puntos; el entrante empieza de cero", ico: "⇄", a: [3, "permanente"], hl: [3, "cero"] }] },
    { a: 4, b: 5, title: "Zona de eliminación", sub: "Si el calendario se creó mal", items: [
      { k: "field", l: "Jornada a eliminar", v: "Jornada 7", a: [4, "calendario"] }, { k: "btn", t: "Eliminar jornada", ghost: true, a: [4, "eliminar"], hl: [4, "eliminar"] }] },
  ],
  pops: [[1, "activar"], [1, "reordenar"], [1, "automático"], [2, "incidencias"], [2, "resuelves"], [3, "puntual"], [3, "permanente"], [4, "eliminar"]],
};
const g = mkAdmin(spec);
export const GEN23_FRAMES = g.frames;
export const Gen23Gestion = g.Comp;
