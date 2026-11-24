// Tutorial genérico 26 · Roles, usuarios y espectadores (administración; solo lo ve quien tiene rol de creador). Datos ficticios.
import { mkAdmin, Spec } from "./GenAdmin";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen26";

const spec: Spec = {
  BOUNDS, VOICE, voice: "voice-gen26-david.mp3", stageEnd: 6,
  hook: { text: "Cada persona\ntiene su\n*papel*", words: ["Cada", "persona", "tiene", "su", "papel"] },
  tags: ["CREADOR", "ADMINISTRADORES", "JUGADORES", "ESPECTADORES", "REPASA LOS ACCESOS"],
  views: [
    { a: 1, b: 1, title: "Personas y accesos", sub: "Quién puede qué", items: [
      { k: "row", t: "Creador", s: "Quien creó la liga", ico: "★", a: [1, "creador"], hl: [1, "creó"] }, { k: "note", t: "No se puede degradar ni desvincular", tone: "no", a: [1, "degradar"] }] },
    { a: 2, b: 2, title: "Personas y accesos", sub: "Administradores", items: [
      { k: "row", t: "Jugador de ejemplo", s: "Cuenta vinculada", ico: "A", a: [2, "administradores"] }, { k: "btn", t: "Convertir en admin", a: [2, "conviértelos"], hl: [2, "admin"] }, { k: "btn", t: "Retirar permiso de admin", ghost: true, a: [2, "retira"], hl: [2, "retira"] }] },
    { a: 3, b: 3, title: "Jugadores y usuarios", sub: "Cuentas vinculadas", items: [
      { k: "avs", names: ["Ana", "Beto", "Carla", "Dani"], a: [3, "jugadores"] }, { k: "field", l: "Nombre visible del jugador", v: "Ana", a: [3, "nombre"] }, { k: "btn", t: "Desvincular cuenta", ghost: true, a: [3, "desvincular"], hl: [3, "desvincular"] }] },
    { a: 4, b: 5, title: "Personas y accesos", sub: "Espectadores y permisos", items: [
      { k: "row", t: "Espectadores", s: "Solo leen", ico: "◉", a: [4, "espectadores"], hl: [4, "leen"] }, { k: "note", t: "Un admin no puede quitarse sus propios permisos", tone: "no", a: [4, "quitarse"] }] },
  ],
  pops: [[1, "creador"], [1, "degradar"], [2, "conviértelos"], [2, "retira"], [3, "nombre"], [3, "desvincular"], [4, "espectadores"], [4, "quitarse"]],
};
const g = mkAdmin(spec);
export const GEN26_FRAMES = g.frames;
export const Gen26Roles = g.Comp;
