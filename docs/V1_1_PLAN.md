# Plan técnico v1.1

Versión candidata: `1.1.0-rc.1`
Rama: `feature/v1.1-stability-hardening`
Base verificada: `staging` (`3495324`, mismo árbol de archivos que `main` v1.0.0)

## Hallazgos

- La base parte limpia y `staging` coincide con `origin/staging`. `main` añade únicamente
  el commit de merge de v1.0.0; su árbol de archivos es idéntico al de `staging`.
- Auth.js v5 usa la configuración mínima del proveedor Google. El proyecto declara
  `AUTH_SECRET`, `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET`, pero no valida su presencia,
  no configura una página de error propia y no registra una incidencia segura.
- `AUTH_URL` figura en `.env.example` aunque la aplicación obtiene el origen canónico
  mediante `NEXT_PUBLIC_APP_URL`; no se ha demostrado que `AUTH_URL` sea necesario.
- El retorno de autenticación conserva el pathname de invitaciones, pero no conserva
  actualmente su query string (`leagueId`).
- `next.config.ts` contiene `http://localhost:300`, un puerto de desarrollo incorrecto,
  y no configura todavía cabeceras de seguridad.
- La autorización de rutas sensibles ya está centralizada en los límites server-side
  de usuario y liga. La cobertura automática, incluido el aislamiento entre ligas,
  es inexistente.
- No hay Vitest, Testing Library, Playwright ni Axe. Tampoco hay límites de tasa
  reutilizables ni límites para la mayoría de las mutaciones sensibles.
- El service worker solo gestiona instalación y push: no versiona caché, no ofrece
  shell/offline y no controla el aviso de actualización.
- La baja push desuscribe el navegador y después deshabilita el endpoint servidor,
  pero la API no elimina el endpoint y no hay pruebas de respuestas push 404/410.
- No existen `error.tsx`, `global-error.tsx` ni `not-found.tsx`.
- Las exportaciones CSV/Excel existen, pero requieren una prueba explícita contra
  formula injection.
- `npm ci` reproducible pasó. `npm audit` informó de cinco vulnerabilidades altas;
  se analizarán sin ejecutar `npm audit fix` ni actualizaciones mayores.

## Prioridades de implementación

1. Auth.js, retorno exacto de invitaciones, validación de entorno, errores trazables y
   pruebas de los flujos de acceso.
2. Validadores compartidos, aislamiento de permisos, rate limiting y protección de
   exportaciones.
3. Infraestructura Vitest + Testing Library y Playwright + Axe, con fixtures sin datos
   reales; pruebas de dominio, API y E2E críticas.
4. Cabeceras de seguridad compatibles, PWA controlada y baja push completa.
5. Accesibilidad crítica, cargas diferidas de dependencias pesadas, CI, documentación,
   versión y changelog.
6. Validación completa, revisión visual móvil/escritorio y comparación contra
   `staging`.

## Riesgos y límites

- OAuth Google real requiere una cuenta de prueba dedicada y configuración remota;
  si no están disponibles, se documentará como verificación manual y no como prueba
  automatizada superada.
- CSP se introducirá de forma compatible y se validará en build/E2E para evitar romper
  Auth.js, Supabase, imágenes, PWA o el script de tema inicial.
- No se hará una reescritura global de autorización, contextos o Server Components.
- Las pruebas E2E con datos persistentes usarán fixtures de PRE o dobles locales; no se
  usarán cuentas personales ni datos de producción.
- Una regresión crítica de lint, tipos, build, seguridad o aislamiento detendrá la
  promoción.

## Migraciones

No hay una migración necesaria confirmada al inicio. Si una corrección verificable la
requiere, se añadirá una migración nueva, reversible mediante migración de avance, y
se validará únicamente contra PRE. No se editarán migraciones aplicadas ni se hará
reset remoto.

## Pruebas necesarias

- Unitarias: clasificación/desempates, sets/resultados, permisos, URLs, invitaciones,
  identidad histórica, fechas Europe/Madrid, CSV/Excel, changelog y validadores.
- Integración: rutas sensibles de ligas, temporadas, partidos, resultados,
  invitaciones/espectadores, administración, exportaciones y notificaciones.
- E2E: acceso anónimo, retorno de invitación, entrada por roles, temporada/partido/
  resultado, aislamiento de liga, resumen/exportaciones y cierre de sesión.
- Visual + Axe: Inicio, Partidos, Clasificación, Estadísticas, Ajustes, invitación,
  administración de temporada y compartir resumen, en móvil y escritorio.

## Acciones externas

Requieren autorización adicional o credenciales disponibles en el entorno:

- push de la rama, merge en `staging` y despliegue de PRE;
- configuración o comprobación remota de variables en Vercel;
- OAuth Google real;
- aplicación y auditoría de una eventual migración en Supabase PRE;
- recomendaciones de protección de ramas en GitHub (se documentarán, no se aplicarán).

`main`, la etiqueta `v1.0.0`, Supabase PROD y el despliegue PROD quedan fuera de alcance.
