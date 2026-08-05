# Línea base de seguridad de dependencias

La rama `feature/v0.18-security-hardening` inicia la serie v0.18 con una comprobación reproducible del árbol instalado.

## Comandos

- `npm run security:check`: revisa las versiones resueltas en `package-lock.json`.
- `npm run typecheck`: ejecuta TypeScript sin emitir archivos.
- `npm run validate`: ejecuta seguridad, lint, TypeScript y build en ese orden.

## Versiones mínimas controladas

- `next-auth`: `5.0.0-beta.32` o una versión corregida posterior.
- `@auth/core`: `0.41.3` o superior.
- `brace-expansion` usado por el árbol principal: `5.0.8` o superior.
- Las copias heredadas `1.1.17` solo se aceptan en rutas concretas de herramientas de lint y cuando el lockfile las marca como dependencias de desarrollo. Si aparecen en otra rama del árbol o pasan a producción, la comprobación falla.

## Actualizaciones automáticas

Dependabot revisa semanalmente las dependencias npm y agrupa por separado los cambios de producción y desarrollo. Toda actualización debe probarse primero en `staging`.

## Flujo recomendado

1. Ejecutar `npm install` o `npm ci`.
2. Ejecutar `npm run validate`.
3. Probar acceso con Google, cierre de sesión y navegación autenticada en PRE.
4. Publicar en producción únicamente después de validar PRE.
