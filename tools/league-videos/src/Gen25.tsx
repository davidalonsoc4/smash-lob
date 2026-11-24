// Tutorial genérico 25 · Comunicados y chat de la liga (administración; solo lo ve quien tiene rol de creador). Datos ficticios.
import { mkAdmin, Spec } from "./GenAdmin";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen25";

const spec: Spec = {
  BOUNDS, VOICE, voice: "voice-gen25-david.mp3", stageEnd: 6,
  hook: { text: "Para avisar\na tu liga,\nusa un *comunicado*", words: ["Para", "avisar", "a", "tu", "liga", "usa", "un", "comunicado"] },
  tags: ["¿A QUIÉN VA?", "CÓMO LLEGA", "OCULTAR AUTOMÁTICAMENTE", "COMUNICADO O CHAT", "PUBLICA EL PRIMERO"],
  views: [
    { a: 1, b: 1, title: "Crear comunicado", sub: "Escribe el mensaje y elige destino", items: [
      { k: "field", l: "Mensaje", v: "Cambio de pista este sábado…", a: [1, "mensaje"] },
      { k: "chips", items: ["Toda la liga", "Una temporada", "Jugadores concretos"], a: [1, "elige"], sel: 0, selAt: [1, "liga"] }] },
    { a: 2, b: 2, title: "Crear comunicado", sub: "Cómo llega", items: [
      { k: "toggle", t: "Fijar en la pantalla de inicio", a: [2, "fijado"], on: [2, "inicio"] }, { k: "toggle", t: "Enviar notificación", a: [2, "notificación"], on: [2, "notificación"] }] },
    { a: 3, b: 3, title: "Crear comunicado", sub: "Opcional", items: [
      { k: "field", l: "Ocultar automáticamente", v: "Pasada una fecha", a: [3, "ocultarlo"] }] },
    { a: 4, b: 4, title: "Comunicado o chat", sub: "Cada uno para lo suyo", items: [
      { k: "row", t: "Comunicados", s: "Llegan a todos · avisos importantes", ico: "!", a: [4, "comunicados"], hl: [4, "todos"] }, { k: "row", t: "Chat", s: "Conversar entre jugadores", ico: "✉", a: [4, "chat"] },
      { k: "note", t: "Cambio de pista · fecha límite · cena final", tone: "info", a: [4, "pista"] }] },
    { a: 5, b: 5, title: "Crear comunicado", sub: "Publicar y notificar", items: [{ k: "btn", t: "Publicar y notificar", a: [5, "Publica"], hl: [5, "Publica"] }] },
  ],
  pops: [[1, "mensaje"], [1, "elige"], [2, "fijado"], [2, "notificación"], [3, "ocultarlo"], [4, "comunicados"], [4, "chat"], [5, "Publica"]],
};
const g = mkAdmin(spec);
export const GEN25_FRAMES = g.frames;
export const Gen25Comunicados = g.Comp;
