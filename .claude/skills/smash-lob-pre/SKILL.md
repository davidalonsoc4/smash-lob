---
name: smash-lob-pre
description: Prepara y valida cambios seguros para PRE de Smash & Lob. Úsala para crear rama, revisar tests, abrir PR contra staging, desplegar a PRE o investigar un CI fallido.
---

# Flujo seguro de staging / PRE

1. Lee `AGENTS.md`. Confirma `git status`, rama, remoto y SHA actual de `staging`; no descartes cambios locales.
2. Trabaja en rama de funcionalidad desde `staging` actual; no edites `main` para probar. No ejecutar acciones remotas si el usuario solo pidió revisar.
3. Revisa diff y alcance: permisos, auth, base de datos, PWA, pruebas, costes. No cambies migraciones ya aplicadas. Nunca uses claves de PROD en pruebas.
4. Ejecuta checks dirigidos y `npm run validate` si el cambio lo justifica. Si hay controles E2E, ejécutalos o explica por qué no. **Una prueba fallida bloquea la publicación** hasta entenderla; no reduzcas presupuestos ni silencies errores sin justificación.
5. Abre PR hacia `staging` y presenta archivos tocados, resultados y riesgos.
6. Fusionar/publicar en `staging` exige consentimiento explícito (anterior o en esta petición). Después verifica GitHub CI, SHA desplegado en Vercel, dominio `pre.smashandlob.com`, smoke checks y comportamientos clave. No confundir preview de rama con PRE.
7. **PROD nunca se incluye en una publicación a PRE.** Una publicación a `main` necesita autorización independiente y diff exacto: no fusionar ciegamente toda `staging` si hay funciones ocultas/no aprobadas.
8. Resume: PR, commit, entorno, CI, despliegue confirmado, pruebas manuales pendientes. Nunca afirmar 'cero riesgo'.

Prohibido: `git reset --hard`, `git clean -fd`, `git push --force`, exponer secretos, editar datos remotos sin confirmación.
