# Candidata v1.15.38 — PRE y preparación de Producción

Estado: en validación local. No autorizada la promoción a Producción.

- Publicar en PRE desde staging los cambios visuales pendientes de Competiciones, previews, Partido, MVP y chats.
- Torneos disponibles en PRE/local, ocultos en Producción para todos los roles. Un mismo control se aplica a accesos y búsqueda; proxy bloquea páginas, API, invitaciones y sonidos de torneos con404.
- No hay migraciones nuevas ni diferencias de migraciones respecto a main. No ejecutar SQL ni modificar datos.
- Referencia de recuperación de código: main1bc3f70e (v1.15.36). Mantener intactos main, dominio/deployment PROD y tagv1.0.0 durante esta preparación.

## Antes de promover

1. Registrar SHA final de staging, versión, CI y deployment/alias PRE verificados tras pasar validate, E2E y auditoría runtime.
2. Aceptación manual PRE: PWA física, carrusel/último encuentro, calendario, chat, pagos y torneos visibles. Revisar también colores personalizados.
3. Resolver o aplazar expresamente el chat general de liga que el usuario prevé abordar antes de PROD. Propuesta pendiente: chat por temporada, acceso según pertenencia histórica; temporada actual escribible, anterior en lectura; decidir conservación/borrado antes de implementar. No borrar historial ni crear tablas ahora.
4. Con autorización posterior: preparar PR staging→main según proceso vigente, confirmar recuperación de deployment y ausencia de migraciones pendientes, reconstruir con configuración PROD. No promover directamente un artefacto PRE porque su entorno es distinto.
5. Verificar tras promoción health/version/prod, PWA/SW, ligas/amistosos y ausencia de torneos en todos los roles. Rutas/api/invitaciones de torneo deben responder404 incluso con sesión; comprobar que siguen visibles en PRE.

La ocultación no elimina torneos ni participantes existentes. Es reversible mediante código en una futura versión.
