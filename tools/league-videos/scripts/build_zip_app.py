#!/usr/bin/env python3
"""Construye el .zip de entrega para la subida masiva de /admin/tutorials (manifest.json en la raíz).
Fuente del manifest: docs/INSTRUCCIONES_ZIP_VIDEOS.md de la rama staging. Solo incluye los vídeos que existen."""
import json, os, re, shutil, subprocess, sys, zipfile

BASE = "out/listos-para-subir"
# nº del plan -> (mp4 producido, jpg producido)
SRC = {
 1: "ayuda/01-como-funciona-una-liga", 2: "ayuda/02-como-se-puntua", 3: "ayuda/03-tu-primera-jornada", 4: "ayuda/04-estados-de-un-partido",
 5: "ayuda/05-sorteo-del-saque", 6: "ayuda/06-subir-el-resultado", 7: "ayuda/07-confirmar-un-resultado", 8: "ayuda/08-mvp-votar-y-premios",
 9: "ayuda/09-aplazar-lesion-y-suplentes", 10: "ayuda/10-quien-lleva-las-bolas", 11: "ayuda/11-pagos-de-pista", 12: "ayuda/12-instalar-app-y-avisos",
 13: "ayuda/13-configurar-notificaciones", 14: "ayuda/14-perfil-y-disponibilidad", 15: "ayuda/15-apariencia-e-idioma", 16: "ayuda/16-estadisticas-y-records",
 17: "ayuda/17-compartir-con-espectadores", 18: "ayuda/18-partidos-amistosos", 19: "ig1-reel-liguilla",
 21: "ayuda/21-crear-tu-liga", 22: "ayuda/22-crear-una-temporada", 23: "ayuda/23-gestionar-la-temporada", 24: "ayuda/24-economia-de-la-temporada",
 25: "ayuda/25-comunicados-y-chat", 26: "ayuda/26-roles-y-espectadores", 27: "ayuda/27-cerrar-la-temporada", 28: "ayuda/28-kit-de-medios",
}
# descripciones ajustadas al contenido real del vídeo producido
DESC = {
 "15": "Cómo cambiar el tema (claro, oscuro o automático), el estilo, la paleta y el idioma de la app.",
 "17": "Cómo invitar a espectadores para que sigan la liga en solo lectura sin jugar.",
 "19": "Reel de la liguilla.",
}
doc = subprocess.run(["git", "show", "origin/staging:docs/INSTRUCCIONES_ZIP_VIDEOS.md"], capture_output=True, text=True, check=True).stdout
man = json.loads(re.search(r"## manifest.json\s+```json\n(.*?)\n```", doc, re.S).group(1))
OUT = sys.argv[1] if len(sys.argv) > 1 else "out/entrega-app"
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
vids, missing = [], []
for v in man["videos"]:
    n = int(v["archivo"][:2])
    if n not in SRC: missing.append(n); continue
    stem = v["archivo"][:-4]
    shutil.copy(f"{BASE}/{SRC[n]}.mp4", f"{OUT}/{stem}.mp4"); shutil.copy(f"{BASE}/{SRC[n]}.jpg", f"{OUT}/{stem}.jpg")
    if f"{n:02d}" in DESC: v["descripcion"] = DESC[f"{n:02d}"]
    vids.append(v)
man["videos"] = vids
json.dump(man, open(f"{OUT}/manifest.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
zp = OUT.rstrip("/") + ".zip"
if os.path.exists(zp): os.remove(zp)
with zipfile.ZipFile(zp, "w", zipfile.ZIP_STORED) as z:
    for f in ["manifest.json"] + sorted(x for x in os.listdir(OUT) if x != "manifest.json"): z.write(f"{OUT}/{f}", f)
print("faltan", missing, "| ficheros", len(os.listdir(OUT)), "| zip", zp, os.path.getsize(zp) // 1048576, "MB")
