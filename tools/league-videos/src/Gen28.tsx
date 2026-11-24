// Tutorial genérico 28 · Kit de medios y pack de bienvenida (administración; solo lo ve quien tiene rol de creador). Datos ficticios.
import { mkAdmin, Spec } from "./GenAdmin";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen28";

const spec: Spec = {
  BOUNDS, VOICE, voice: "voice-gen28-david.mp3", stageEnd: 5,
  hook: { text: "El Centro de\n*difusión* te prepara\nimágenes listas\npara compartir", words: ["El", "Centro", "de", "difusión", "te", "prepara", "imágenes", "listas", "para", "compartir"] },
  tags: ["ELIGE EL CARTEL", "ESCOGE EL ESTILO", "PACK DE BIENVENIDA", "CREA TU PRIMER CARTEL"],
  views: [
    { a: 1, b: 1, title: "Centro de difusión", sub: "Carteles listos para compartir", items: [
      { k: "chips", items: ["Bienvenida", "Formato", "Reglas", "Resultados", "Clasificación", "MVP", "Próxima jornada", "Final"], a: [1, "cartel"], sel: 4, selAt: [1, "clasificación"] }] },
    { a: 2, b: 2, title: "Cartel de ejemplo", sub: "Estilo y formato", items: [
      { k: "chips", items: ["Condensada", "Editorial", "Atlética", "Geométrica"], a: [2, "estilo"], sel: 1, selAt: [2, "tipografías"] }, { k: "btn", t: "Descargar · 1080 × 1350", a: [2, "descárgalo"], hl: [2, "descárgalo"] }] },
    { a: 3, b: 4, title: "Pack de bienvenida", sub: "Diseño para quien se inscribe", items: [
      { k: "row", t: "Diseño del pack", s: "El contenido lo decides tú", ico: "▣", a: [3, "pack"], hl: [3, "tú"] }] },
  ],
  pops: [[1, "cartel"], [1, "clasificación"], [2, "estilo"], [2, "descárgalo"], [3, "pack"]],
};
const g = mkAdmin(spec);
export const GEN28_FRAMES = g.frames;
export const Gen28Kit = g.Comp;
