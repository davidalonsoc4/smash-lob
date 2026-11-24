// Tutorial genérico 21 · Crear tu liga e invitar jugadores (administración; solo lo ve quien tiene rol de creador). Datos ficticios.
import { mkAdmin, Spec } from "./GenAdmin";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen21";

const spec: Spec = {
  BOUNDS, VOICE, voice: "voice-gen21-david.mp3", stageEnd: 7,
  hook: { text: "Crear tu\n*liga* lleva\nun minuto", words: ["Crear", "tu", "liga", "lleva", "un", "minuto"] },
  tags: ["NOMBRE, LOGO Y LUGARES", "COLOR Y RECOMENDACIONES", "LA MODALIDAD SE FIJA", "INVITA A LOS JUGADORES", "CÓDIGO REGENERABLE", "CREA TU LIGA"],
  views: [
    { a: 1, b: 1, title: "Nueva liga", sub: "Datos de la liga", items: [
      { k: "field", l: "Nombre de la liga", v: "Liga de ejemplo", a: [1, "nombre"] }, { k: "field", l: "Descripción", v: "Liga entre amigos", a: [1, "descripción"] },
      { k: "row", t: "Logo", s: "Sube una imagen", ico: "▣", a: [1, "logo"] }, { k: "row", t: "Lugares habituales", s: "Polideportivo, club…", ico: "⌖", a: [1, "lugares"] }] },
    { a: 2, b: 2, title: "Nueva liga", sub: "Color y recomendaciones", items: [
      { k: "chips", items: ["Dorado", "Azul", "Verde", "Violeta"], a: [2, "color"], sel: 0, selAt: [2, "color", 1] },
      { k: "field", l: "Recomendaciones de la liga", v: "Bolas, pistas o equipamiento", a: [2, "recomendaciones"] }] },
    { a: 3, b: 3, title: "Nueva liga", sub: "Modalidad", items: [
      { k: "row", t: "Modalidad individual", s: "Queda fijada al crear la liga", ico: "!", a: [3, "modalidad"], hl: [3, "fija"] },
      { k: "note", t: "Después no se puede cambiar", tone: "info", a: [3, "cambia"] }] },
    { a: 4, b: 5, title: "Invitar jugadores", sub: "Código y enlace de invitación", items: [
      { k: "field", l: "Código de invitación", v: "ABC-123", a: [4, "código"] }, { k: "btn", t: "Copiar código o enlace", a: [4, "enlace"], hl: [4, "copia"] },
      { k: "avs", names: ["Ana", "Beto", "Carla", "Dani"], a: [4, "cada"], tag: ["Reclaman su perfil", [4, "perfil"]] },
      { k: "btn", t: "Regenerar invitación", ghost: true, a: [5, "código"], hl: [5, "regeneras"] }] },
  ],
  pops: [[1, "nombre"], [1, "logo"], [1, "lugares"], [2, "color"], [2, "recomendaciones"], [3, "modalidad"], [4, "código"], [4, "perfil"], [5, "regeneras"]],
};
const g = mkAdmin(spec);
export const GEN21_FRAMES = g.frames;
export const Gen21Crealiga = g.Comp;
