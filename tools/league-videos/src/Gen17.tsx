// Tutorial genérico 17 · Compartir con espectadores (administración; solo lo ve quien tiene rol de creador). Datos ficticios.
import { mkAdmin, Spec } from "./GenAdmin";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen17";

const spec: Spec = {
  BOUNDS, VOICE, voice: "voice-gen17-david.mp3", stageEnd: 7,
  hook: { text: "¿Quieres que\n*alguien* siga\ntu liga sin jugar?", words: ["Quieres", "que", "alguien", "siga", "tu", "liga", "sin", "jugar"] },
  tags: ["ESPECTADORES", "ENLACE DE ESPECTADOR", "SIN INICIAR SESIÓN", "SOLO LECTURA", "TÚ DECIDES", "COMPARTE EL ENLACE"],
  views: [
    { a: 1, b: 1, title: "Espectadores", sub: "Acceso de solo lectura", items: [
      { k: "row", t: "Invita a espectadores", s: "Siguen la liga sin jugar", ico: "◉", a: [1, "Invítalo"], hl: [1, "espectador"] }] },
    { a: 2, b: 2, title: "Administración", sub: "Liga de ejemplo", items: [
      { k: "row", t: "Personas y accesos", s: "Plantilla, cuentas y espectadores", ico: "◎", a: [2, "Administración"], hl: [2, "accesos"] },
      { k: "field", l: "Enlace de espectador", v: "Invitación de solo lectura", a: [2, "enlace"] },
      { k: "btn", t: "Copiar enlace", a: [2, "copia"], hl: [2, "copia"] }] },
    { a: 3, b: 3, title: "Invitación de espectador", sub: "Acceso de solo lectura", items: [
      { k: "btn", t: "Ver liga sin iniciar sesión", a: [3, "abre"], hl: [3, "sesión"] },
      { k: "btn", t: "Añadir liga a mi cuenta de Google", ghost: true, a: [3, "guardarla"], hl: [3, "Google"] }] },
    { a: 4, b: 4, title: "Vista de espectador", sub: "Solo lectura", items: [
      { k: "note", t: "Partidos", a: [4, "partidos"] }, { k: "note", t: "Resultados", a: [4, "resultados"] }, { k: "note", t: "Clasificación", a: [4, "clasificación"] },
      { k: "note", t: "Sin datos personales ni actividad interna", tone: "no", a: [4, "personales"] }] },
    { a: 5, b: 6, title: "Espectadores de la liga", sub: "Cuentas con acceso de solo lectura", items: [
      { k: "toggle", t: "Calendario visible", a: [5, "decides"], on: [5, "publicas"] },
      { k: "row", t: "Espectador 1", s: "Acceso de solo lectura", ico: "1", a: [5, "Puedes"] },
      { k: "btn", t: "Retirar acceso", ghost: true, a: [5, "retirar"], hl: [5, "retirar"] }] },
  ],
  pops: [[1, "Invítalo"], [2, "Administración"], [2, "accesos"], [2, "copia"], [3, "abre"], [3, "Google"], [4, "partidos"], [4, "resultados"], [4, "clasificación"], [5, "calendario"], [5, "retirar"]],
};
const g = mkAdmin(spec);
export const GEN17_FRAMES = g.frames;
export const Gen17Espectadores = g.Comp;
