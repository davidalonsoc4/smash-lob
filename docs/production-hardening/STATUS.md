# Publicación Welcome Pack — 2026-09-14 (en curso)

# v1.15.4 — Saneamiento y hardening (2026-09-19, en curso)

- Rama `codex/v1.15.4-hardening-cleanup` creada desde `origin/main` en `01c9212`; versión de aplicación actualizada a `1.15.4`. No se ha desplegado PRE ni PROD.
- Auditoría inicial documentada en `docs/production-hardening/V1_15_4_HARDENING_AUDIT.md`.
- Separada la capacidad de crear ligas del modo visual de la liga activa.
- Añadido estado persistente de leído/no leído para notificaciones mediante la migración pendiente `20260919100000_add_notification_read_state.sql`, API autenticada y acciones individuales/globales en `/notifications`.
- La actividad administrativa admite cursor temporal (`createdAtBefore`) y devuelve `nextCursor`, manteniendo el orden estable sin ampliar artificialmente el límite por página.
- Añadidos endpoints autenticados de exportación JSON (`/api/account/export`) y solicitud de anonimización de cuenta (`/api/account/delete`, confirmación reforzada); no se despliega ni se aplica ninguna migración remotamente en esta rama.
- Privacidad, condiciones y página informativa vuelven a estar presentes en el buscador de ajustes para usuarios autenticados y espectadores.
- Se añadieron contratos unitarios de la rama para el estado de notificaciones, paginación, descubribilidad legal y autoservicio de cuenta.
- `npm run validate` y `npm run release:check` se detienen deliberadamente en `i18n:check`: al proteger de nuevo `Mis partidos` aparecen textos visibles históricos sin `tx` en sus páginas y componentes. La deuda queda identificada y no se ha rebajado el gate.
- Corregido un 404 real del acceso público por QR: `src/proxy.ts` bloqueaba cualquier `/spectate/:code/view` anónimo aunque existía la página pública. La ruta de vista ahora atraviesa el proxy sin abrir ninguna capacidad autenticada; se añadió regresión unitaria.
- Se eliminó la exclusión de `Mis partidos` del gate i18n y se conectaron sus textos visibles al sistema EN/EU. El presupuesto total se ajusta de 129.200 a 129.800 líneas para incluir las traducciones y contratos nuevos; no se aumentan límites de archivos críticos.

- En `codex/welcome-pack-stickers` queda v1.15.2 con margen exterior de seguridad de 5 mm, repetición configurable de 1 a 20 copias por diseño, recálculo del tamaño máximo para que todas quepan en una hoja A4, y relleno automático de huecos útiles con logos de liga sin solapes. Pasa typecheck, i18n, presupuestos de fuente, lint de archivos cambiados, 7 unitarias/integración dirigidas y 2 E2E del flujo de selección/repetición en móvil y escritorio. Build de producción generado por Playwright con el distDir de pruebas y sin tocar el `.next` de `npm run dev`; `release:check` completa no se repite mientras el servidor local solicitado sigue activo. Cambios solo locales, sin despliegue.

- v1.15.0 cierra `codex/anonymous-spectator-access` en el commit `3a64f9ed2a3d37d8fba95d1ff0852703c791ac6c`: la versión visible, paquetes, service worker, changelog y smoke contracts quedan sincronizados con `1.15.0`; se conserva el acceso de espectadores sin cuenta publicado en v1.14.40. `npm run release:check` pasa: 200 archivos / 757 pruebas unitarias e integración, 66 E2E, build de 1.055.668 bytes gzip y auditoría runtime con 0 vulnerabilidades. ESLint sin errores, con el warning previo de `window.location.assign()` en `SpectatorInviteFlow.tsx`. Sin migraciones nuevas. PRE deployment `dpl_AdWELZir5mqrcpfx9t6EEwjC3QGd` y Producción `dpl_97fnxuMr5YmH2RQwYo4auCm8X493` quedaron `Ready`; ambos health endpoints confirman v1.15.0 en su entorno y `npm run smoke:prod` pasa.
- Para v1.14.40, el presupuesto global de fuente se ajusta de 128.150 a 128.700 líneas y los componentes cliente máximos de 184 a 185; se conservan los límites de páginas cliente, rutas API y archivos sensibles.
- v1.14.40 implementada en `codex/anonymous-spectator-access` y publicada en PRE y Producción. `npm run release:check` supera 200 archivos / 757 pruebas unitarias e integración, 66 E2E, build de 1.055.669 bytes gzip y auditoría runtime con cero vulnerabilidades; `git diff --check` limpio. ESLint termina sin errores y conserva un warning previo de `window.location.assign()` en `SpectatorInviteFlow.tsx`. Sin migraciones nuevas.
- v1.14.39 promovida desde `staging` a `main` (`3a76d66a98fe9bf7a8ab5c8d6c681b86c64b36e5`) y publicada en Producción. Se aplicó únicamente la migración validada en PRE `20260917120000_add_manual_ball_custodian_selection.sql`; el dry-run mostró esa única migración pendiente y el lint de esquema PROD terminó sin errores. Vercel deployment `dpl_CcvETMAckFva3pQeraqBjiRiSurD` quedó `Ready`, alias `smashandlob.com`, y `/api/health` devolvió v1.14.39. `origin/main` verificado en el mismo SHA.
- Publicación v1.14.40 verificada: `staging` `ad786871f7f9d7d0f49ec8d86339fdf11b79db39`, PRE deployment `dpl_35uw4cMUC6Xq58fsBWBVr7iKqZCn` `Ready`, alias `pre.smashandlob.com`; health confirma `1.14.40/pre`. La promoción a `main` quedó en `1a3a19e953d4c8557a39794683922ff0e21ab942`; Producción deployment `dpl_CPPPJ5thpkHSspGMX76twmo6rN5a` `Ready`, alias `smashandlob.com`; `npm run smoke:prod` y `/api/health` confirman `1.14.40/prod`. La invitación y el QR ofrecen una vista pública sin sesión con API de solo lectura; chats, actividad, pagos, incidencias e identidad de cuenta quedan fuera del payload. Se preservan la fase secreta y el calendario progresivo.
- v1.14.39 validada sobre `codex/manual-ball-custodian-selection`: el selector de custodios se presenta como tarjetas con avatar y estado seleccionado; Home y Calendario solo muestran “Eres el encargado de las bolas” a la persona asignada. `npm run release:check` pasa: 199 archivos / 755 pruebas unitarias e integración, 64 E2E, build de 1.052.217 bytes gzip y auditoría runtime con 0 vulnerabilidades; lint conserva un warning preexistente en `SpectatorInviteFlow.tsx`. Se actualizan los presupuestos de fuente para alojar el ajuste. Merge `cc8f387` publicado y verificado en `origin/staging`. PRE apunta al deployment Vercel `dpl_HwCLJRkLJDii1rmqSZ1ZGDj9LN16` (`Ready`), construido desde `e741c60`, ancestro de `staging` con árbol idéntico; `/api/health` confirma v1.14.39. `main`, Production y el tag `v1.0.0` siguen intactos.
- v1.14.38 desplegada en PRE, rama `codex/manual-ball-custodian-selection` basada en `staging`: se añaden los modos de prioridad y selección explícita de custodios, validación de cobertura para el calendario y una migración nueva para guardar el modo y los jugadores elegibles. Los avisos de custodio se generan solo para partidos programados y se filtran, junto con el resto de avisos vinculados a partidos, durante el periodo previo al inicio. `npm run release:check` pasa: 199 archivos / 754 pruebas unitarias e integración, 64 E2E, build de 1.050.423 bytes gzip y auditoría runtime con 0 vulnerabilidades; lint conserva un warning preexistente en `SpectatorInviteFlow.tsx`. La Supabase CLI se vinculó explícitamente al proyecto PRE `miadjotkucgluwbrgeih`; la única migración nueva `20260917120000_add_manual_ball_custodian_selection.sql` figura aplicada y `db lint --linked --schema public` no encuentra errores. Merge `2808ea1` publicado en `origin/staging`; deployment Vercel `Ready`, alias `https://pre.smashandlob.com` verificado con `/api/health` en versión 1.14.38. Migración aplicada en PRE; `main`, Production y el tag `v1.0.0` siguen intactos.
- v1.14.37 (rama `codex/spectator-league-qr-safe-pwa-update`, basada en `staging`): el QR de espectadores usa módulos redondeados color carbón, conserva cuadrados los patrones de localización/alineación, mantiene cuatro módulos de zona blanca y lleva el icono de la app incrustado en SVG sobre una placa central; conserva corrección de errores H y evita cubrir alineación central en códigos de mayor versión. Se amplía el presupuesto global de 127.500 a 127.600 líneas (estado: 127.567) y el del changelog de 2.480 a 2.490 (estado: 2.481). `npm run release:check` superado: 199 archivos / 749 pruebas unitarias e integración, 64 E2E en móvil, escritorio y PWA, lint sin errores (un warning preexistente en `SpectatorInviteFlow.tsx`), typecheck, i18n, compilación dentro del presupuesto (1.047.723 bytes gzip) y auditoría runtime con 0 vulnerabilidades. El E2E verifica el SVG con logo incrustado, los módulos redondeados y el margen de cuatro módulos; además lo rasteriza y decodifica con jsQR en móvil y escritorio, comprobando que el contenido coincide exactamente con la URL de espectador. El commit `2ea893e` se integró en `staging` con `113f4fc` y su preview Vercel quedó Ready. PRE está protegido por Vercel SSO para solicitudes anónimas (302 a `vercel.com/sso-api`), pero se verificó autenticado con `vercel curl`: salud `ok`, versión `1.14.37`, portada 200, Avatar Lab 200 y su API 401 sin sesión. La promoción a `main` quedó en `46f274a`; el deployment de producción `smash-ha0buepd5-davidalonsoc4-8740s-projects.vercel.app` está Ready y `npm run smoke:prod` confirma versión 1.14.37, portada disponible y Avatar Lab oculto/bloqueado. Sin cambios de base de datos ni migraciones.
- v1.14.36 (rama `codex/spectator-league-qr-safe-pwa-update`, basada en `staging`): el diálogo QR comparte la superficie del marco de la app y elimina el acento dorado; el QR conserva fondo blanco para el escaneo. `npm run release:check` superado: 199 archivos / 749 pruebas unitarias e integración, 64 E2E en móvil, escritorio y PWA, lint sin errores (un warning preexistente en `SpectatorInviteFlow.tsx`), typecheck, i18n, compilación dentro del presupuesto (1.046.811 bytes gzip) y auditoría runtime con 0 vulnerabilidades. Tras el ajuste final de fondo, pasan ESLint, coherencia de versión y presupuesto de código, además del E2E del popup en móvil y escritorio (2/2) con comparación de color frente al marco de la app. Sin cambios de base de datos ni migraciones, commit o despliegue.
- v1.14.35 (rama `codex/spectator-league-qr-safe-pwa-update`, basada en `staging`): mejora visual del diálogo del QR. El código se presenta en una tarjeta clara con más aire, y se refuerzan jerarquía, explicación e iconos de las acciones. Se conserva el flujo league-wide y la descarga SVG de v1.14.34. Se verifican destinos local (`localhost`), PRE (`https://pre.smashandlob.com/spectate/...`) y PROD (`https://smashandlob.com/spectate/...`); localhost solo se usa en solicitudes locales. El límite global de fuente se amplía de 127.400 a 127.500 líneas (estado actual: 127.450); no cambian los límites por archivo. `npm run release:check` superado: 199 archivos / 749 pruebas unitarias e integración, 64 E2E en móvil y escritorio, lint, typecheck, i18n, build dentro del presupuesto (1.046.897 bytes gzip) y auditoría runtime con 0 vulnerabilidades. Lint mantiene el warning preexistente en `SpectatorInviteFlow.tsx`. Sin cambios de base de datos ni migraciones, commit o despliegue.
- v1.14.34 (rama `codex/spectator-league-qr-safe-pwa-update`, basada en `staging`): implementado y validado localmente. Compartir espectadores abre un diálogo con QR SVG descargable y botón para compartir el enlace por liga. La PWA activa versiones pendientes tras 60 segundos sin actividad, con la pestaña visible/enfocada, sin diálogo abierto y sin foco en un campo editable; la recarga también espera a que vuelva un momento seguro. El límite global de fuente se amplía de 127.260 a 127.400 líneas para alojar el cambio (estado actual: 127.367); no cambian los límites por archivo. `npm run release:check` superado: 198 archivos / 746 pruebas unitarias e integración, 64 E2E, typecheck, i18n, build dentro del presupuesto (1.045.605 bytes gzip) y auditoría runtime con 0 vulnerabilidades. Lint mantiene un warning preexistente en `SpectatorInviteFlow.tsx`. Sin cambios de base de datos ni migraciones, commit o despliegue.
- v1.14.33 (rama `codex/organization-assigned-balls`): la Jornada de Apertura asigna al organizador todos los partidos de la Jornada 1, y el reparto normal empieza en la Jornada 2. El total de botes cuenta cada partido de apertura una sola vez; sin calendario todavía no se muestra un conteo provisional de dos botes. `npm run release:check` superado: 198 archivos / 746 pruebas unitarias e integración, 62 E2E, lint sin errores (un warning preexistente en `SpectatorInviteFlow.tsx`), typecheck, i18n, build dentro del presupuesto (1.038.295 bytes gzip) y auditoría runtime con 0 vulnerabilidades. Commit de release `96e993c`; integrado en `staging` (`bc456c3`) y `main` (`59601eb`). PRE Ready: `dpl_A3wmWLPHQyXgYK9A8GMei13DU3LZ` (`pre.smashandlob.com`). PROD Ready: `dpl_JKFvnbcxWX3qECJnEKyYdje7Fifu` (`smashandlob.com`). No requiere migración.
- v1.14.32 (rama `codex/organization-assigned-balls`): corrección de Jornada de Apertura; los dos primeros partidos con participantes de la Jornada 1 quedan fijados al organizador, cuentan como los dos botes de apertura sin duplicarlos y las jornadas siguientes vuelven al cálculo normal. Se añade “Bolas asignadas por la organización” al buscador de ajustes. El presupuesto global de fuente sube de forma acotada de 127.180 a 127.260 líneas; los límites por archivo no cambian. `npm run release:check` superado: 198 archivos / 746 pruebas unitarias e integración, 62 E2E, build dentro del presupuesto (1.038.394 bytes gzip), typecheck e i18n; auditoría runtime con 0 vulnerabilidades. Lint conserva un warning preexistente en `SpectatorInviteFlow.tsx`. No requiere migración; sin commit ni despliegue.
- v1.14.31 (rama `codex/organization-assigned-balls`): se suman al creador los dos botes de una Jornada de Apertura configurada; el custodio de cada partido recibe un aviso privado al quedar asignado y un recordatorio dentro de las dos horas previas. Usa el endpoint de cron ya existente, sin migraciones nuevas. Los presupuestos suben de forma acotada a 127.180 líneas totales y 6.150 para administración de temporada. `npm run release:check` superado: 198 archivos / 744 pruebas unitarias e integración, 62 E2E, build dentro del presupuesto (1.037.474 bytes gzip), typecheck e i18n; auditoría runtime con 0 vulnerabilidades. Lint conserva un warning preexistente en `SpectatorInviteFlow.tsx`. No se ha desplegado.
- v1.14.30 corrige las flechas de prioridad de custodios: en temporadas existentes operaban sobre la prioridad almacenada incompleta en vez del orden visible normalizado, por lo que a veces no movían jugadores. Creación y edición usan ahora el mismo reordenador. `npm run release:check` superado: 197 archivos / 738 pruebas unitarias e integración, 62 E2E, typecheck, build dentro del presupuesto (1.035.739 bytes gzip) y auditoría runtime sin vulnerabilidades; lint conserva un warning preexistente en `SpectatorInviteFlow.tsx`. Cambio aún no desplegado.
- v1.14.29 añade el desglose de botes por custodio y el acceso directo al panel de bolas asignadas desde la navegación de edición de temporada. En autoinscripción se genera o prepara el calendario solo al completar la plantilla; la vista calcula los custodios sobre ese calendario completo y muestra un mensaje mientras aún no exista. Se amplía de forma acotada el presupuesto de fuente para administración de temporada a 6.120 líneas y el total a 126.520. Validación local completa superada: 197 archivos / 737 pruebas unitarias e integración, 62 E2E, lint (un warning preexistente en `SpectatorInviteFlow.tsx`), typecheck, build dentro del presupuesto y auditoría runtime sin vulnerabilidades. PRE verificada Ready en `pre.smashandlob.com` (deployment `dpl_DmERca3YXoGzadW463FsEnGmBRaT`). En PROD se aplicó únicamente la migración `20260916120000_add_organization_ball_assignment.sql`; la lista de migraciones y `db lint` quedaron limpios. v1.14.29 integrada en `main` (`1c75ca1`) y publicada Ready en `smashandlob.com` (deployment `dpl_CivzRD8ijK6YPRoqK1giWnqH8BKS`).
- v1.14.28 corrige errores reportados al probar en PRE el reparto de bolas: el formulario de creación permite ordenar nombres nuevos y usuarios de la app y resuelve las referencias temporales a jugadores reales; las temporadas activas permiten guardar otros ajustes conservando su fecha histórica de inicio, pero rechazan cambios a esa fecha. No requiere migración. Validación local completa superada: 197 archivos / 736 pruebas unitarias e integración, 62 E2E, typecheck, build dentro de presupuesto y auditoría runtime sin vulnerabilidades. Lint conserva un warning preexistente en `SpectatorInviteFlow.tsx`. Integrada en `staging` (`7d44ccf`) y PRE verificada Ready (`dpl_7y6whTL5uHECoZijBfHJFKb9HzHA`, alias `pre.smashandlob.com`). PROD y `main` intactos.
- En `codex/organization-assigned-balls` se integra v1.14.27 de bolas asignadas por la organización: migración nueva `20260916120000_add_organization_ball_assignment.sql`, configuración persistente y API de creación/edición, bloqueo tras el primer resultado, cálculo determinista del conjunto mínimo de custodios y reparto equilibrado por partido. La compra de bolas se oculta en reservas/pagos cuando la opción está activa. Typecheck, lint, build y 730 pruebas unitarias/integración pasan; queda la validación local de Supabase, bloqueada por falta de Docker/Podman.
- La comprobación de `supabase db reset --local` queda bloqueada en este equipo porque no hay Docker ni Podman disponibles (`docker: command not found`); no se ha tocado ninguna base de datos remota.
- La puerta completa de v1.14.27 pasa: 196 archivos / 730 pruebas, i18n EN/EU, lint con un warning preexistente, typecheck, build y presupuestos de producción. El presupuesto de código se amplía de forma acotada a 126.500 líneas totales, 6.100 para administración de temporada y 2.480 para el changelog para incluir este desarrollo.
- La migración `20260916120000_add_organization_ball_assignment.sql` se aplicó y verificó en el proyecto Supabase de PRE (`smash-lob-staging`, ref. `miadjotkucgluwbrgeih`). `supabase migration list` la muestra aplicada y una consulta remota confirma ambas columnas con sus valores por defecto. PROD permanece sin cambios.
- `staging` se ha integrado y publicado en PRE con el merge `c4bbb7d` (versión v1.14.27). Vercel deployment `dpl_HwQ11zAXddUV7k4HsVTKAwjRp3Sf` quedó `Ready` con alias `https://pre.smashandlob.com`; PROD sigue sin cambios.

- v1.14.26 promocionada y verificada: `release:check` pasa con 728 pruebas unitarias/integración, 62 E2E, build dentro de presupuesto y auditoría runtime sin vulnerabilidades. El código de release quedó integrado en `staging` (`e4904e6`) y `main` (`39e9ba9`), con los registros de promoción posteriores en `c069450` y `a8fa2e5`. Los despliegues Vercel finales están Ready: PRE `dpl_5T87ToXPh7S18gAEZGhiwNcQrnUp` con alias `https://pre.smashandlob.com` y PROD `dpl_FzvhGhgkba65cQG8z1nAMTF6BG7t`. La siguiente tarea se inicia en una rama nueva para bolas asignadas por la organización.
- Solicitud actual autoriza integrar feature → staging → main, sin force push ni espera/polling de Vercel. Esta autorización sustituye para esta entrega la restricción histórica de main de v1.1; el tag v1.0.0 queda intacto.
- Inicio limpio: feature y origin/feature en 6f0d4c77; origin/staging en 03681f8; origin/main en aa1dc6a. Feature contiene 94 commits ausentes de staging; staging solo añade el revert temporal 03681f8 frente a feature.
- Staging aporta frente a main d701bdb, 52c4473 y b7a853e (orígenes configurables y autenticación LAN), más cd465cd, 7b83eb8 y a302d41 (prototipo Welcome Pack), retirado temporalmente por 03681f8. Se conservará su historia y se recuperará la implementación final de feature al resolver el revert.
- Main tiene únicamente el merge aa1dc6a fuera de staging, sin contenido exclusivo. Migraciones, package.json, package-lock.json y appVersion.ts son idénticos entre las tres ramas; no hay nuevas migraciones Git que aplicar en esta entrega. No se ha auditado ni modificado la base de datos remota.
- Dos stashes preexistentes contienen propuestas visuales antiguas de overgrip y ball wrap; permanecen intactos, sin aplicar ni borrar. No son cambios activos del workspace y no se incorporan sobre los diseños posteriores.
- Primer release:check detenido en i18n por textos Welcome Pack sin traducir. Se conectan al sistema existente y se añaden traducciones EN/EU sin excluir archivos del control.
- Revisión detectó que la página seguía usando un OvergripBandPreview local antiguo: ahora importa el componente final simplificado con impresión PDF. Se corrigen medidas informativas de bolsa (50 × 130 mm, 6 por A4) y orden informativo del listado por apellido. El título de impresión del overgrip se asigna como texto para no interpolar HTML del nombre de liga.
- Presupuesto de fuente ajustado al alcance real de Welcome Pack y sus traducciones: 125.500 líneas, 183 clientes y 50 páginas cliente. Límites de rutas API y archivos críticos conservados. Pendiente repetir la puerta completa antes de cualquier push.
- La sustitución del fajín en AppCard dependía del nombre de función, frágil bajo minificación. Se elimina al importar directamente el componente final. Nueva prueba Playwright verifica el recorrido de página a PDF y sus 18 piezas por A4, usando exclusivamente fixtures.
- Auditoría runtime anticipada detectó Next.js crítico (GHSA-p293-qw3h-jr36 / GHSA-2xp9-vwfh-vxw4) y Sharp alto (GHSA-rgj7-g3m4-5g8c). Se interrumpió la validación antes de publicar. Actualización explícita a Next.js/eslint-config-next 16.3.5 y Sharp/override 0.35.4; pendiente validar lockfile y repetir release:check, sin audit fix --force.
- Instalación verificada y auditoría runtime con 0 vulnerabilidades. Correcciones compatibles adicionales en herramientas: brace-expansion 1.1.18/5.0.9 y js-yaml 4.3.2. Auditoría incluyendo desarrollo conserva dos entradas moderadas de Vitest/@vitest/mocker (GHSA-82fw-gwwq-j7x9), fuera del gate runtime; no se cambia de major del runner en esta entrega. Pruebas unitarias nuevas cubren traducciones de controles/fuentes y preservación de medidas EN/EU/ES.
- La puerta detectó un contrato visual antiguo del selector de calendario (esperaba overflow-x-auto pese al cambio 4ef8a3e): actualizado al selector compacto y complementado con comprobación real de ancho en Playwright.
- Dos pruebas exhaustivas de calendario agotaban sus tiempos bajo concurrencia automática. Aisladas pasan 24/24: caso parcial 2,17 s y todos los máximos 12,28 s. Se limita Vitest a dos workers para evitar saturación, sin ampliar tiempos ni reducir los casos o aserciones.
- El primer Playwright completo terminó 58/62. Las dos verificaciones funcionales nuevas pasaron en móvil; los fallos de HOME y acceso público fueron espera de la compilación bajo `next dev`, no una incidencia de Axe o autenticación. La suite arranca ahora build + servidor de producción con los mismos fixtures placeholder, dos workers y 15 s para aserciones/capturas. Las únicas diferencias visuales son las dos referencias de CALENDARIO, limitadas al selector compacto ya revisado; se actualizarán y volverán a ejecutar todas las E2E.
- La configuración de capturas de Playwright 1.62 no admite timeout específico en `toHaveScreenshot`; se elimina esa opción inválida tras el diagnóstico directo de `next build`. La espera general de 15 s se conserva para el contenido de página.
- Validación final de feature superada con `npm run release:check`: 193 archivos / 724 pruebas unitarias e integración, build de producción dentro de presupuesto (1.023.297 bytes gzip, 97 chunks), 62 E2E Playwright y `npm audit --omit=dev --audit-level=high` con 0 vulnerabilidades. Las dos referencias visuales de CALENDARIO se actualizaron únicamente para reflejar el selector compacto; la inspección de diff confirma ese alcance.
- Se crearon los commits locales 0e18ad8 (dependencias), 2e1da67 (Welcome Pack) y f3f7d67 (validación). Un `index.lock` vacío de 2026-09-14, sin procesos Git activos, se confirmó obsoleto y se eliminó antes de los commits. Pendiente: push verificado de feature, merge normal en staging, repetir puerta y push; después merge normal de staging en main, puerta final y push.
- Feature publicada y verificada en origin como 5194537. El merge inicial de staging (`c4a184e`) resolvió automáticamente el revert temporal borrando MediaKitSectionNav y la regla ESLint necesaria para la página Welcome Pack; ambas se restauran desde la feature antes de repetir validación. No se ha publicado staging todavía.
- La primera puerta sobre staging confirmó que los dos casos exhaustivos de calendario superan sus límites de 5/30 s en este equipo, también con un único worker. Se conserva íntegro el algoritmo determinista y todas sus alternativas, pues la generación ocurre una vez por temporada; los límites de esas dos pruebas se amplían a 10/60 s para validar el resultado completo sin falsos fallos de rendimiento local. Pendiente: suite completa, puerta staging y push solo si ambas pasan.
- La selección de vueltas ya no reconstruye los conteos de parejas de todos los partidos acumulados para cada candidata: conserva los conteos de cada vuelta y los combina para puntuarla. No cambia candidatas, reglas de desempate ni auditorías; la prueba exhaustiva completa de máximos pasó de ~34 s a 15,1 s y los 24 casos focalizados pasan en 23,7 s.
- Puerta completa de `staging` superada tras la optimización: 193 archivos / 724 pruebas unitarias e integración, build de producción dentro de presupuesto (1.023.413 bytes gzip, 97 chunks), 62 pruebas Playwright y `npm audit --omit=dev --audit-level=high` con 0 vulnerabilidades. Pendiente: push verificado de `staging`, promoción normal a `main` y repetición de la puerta final.
- Promoción final a `main` validada: 193 archivos / 724 pruebas, build dentro de presupuesto, 62 Playwright y auditoría runtime sin vulnerabilidades. Pendiente: push verificado de `main`.
- Ajuste local posterior en `feature/welcome-pack-media-kit`: selector de piezas en cuadrícula en móvil, guía visible de A4 vertical/horizontal, escala 100 % y ajuste manual solo si el diálogo del navegador conserva una orientación previa. Precintos y overgrips declaran páginas CSS nombradas; 9/9 pruebas focalizadas y TypeScript correctos. No se ha publicado este ajuste.
- Iteración móvil validada manualmente: los selectores vuelven al carrusel horizontal, ahora con tarjetas compactas sin etiquetas de estado y con proporción rectangular. La preview no cambia; la guía de impresión conserva orientación, escala y el ajuste manual excepcional. Pendiente: puerta completa y promoción secuencial.

# v1.13.8 — Sello azul premium reforzado (2026-08-27)

- La Carta de bienvenida mantiene la textura de papel premium y el sello orgánico, pero refuerza el azul del sello para que el logo gane presencia y legibilidad.
- Se conservan el tamaño grande del sello, su posición irregular y el solape natural con la firma sin reescalados.
- Continúa sobre `feature/v1.13.0-media-kit-welcome-letter`; al quedar cerrada esta iteración, el siguiente paso es subir todo v1.13 a PRE.

# v1.13.6 — Refuerzo visual de sello y papel (2026-08-27)

- La Carta de bienvenida refuerza la textura del papel premium para que el grano se perciba mejor sin comprometer la legibilidad.
- El sello limpio y el sello tinta recuperan presencia con un azul tinta más vivo y un contraste superior, manteniendo su colocación orgánica junto a la firma.
- Se mantiene el tamaño grande del sello, su inclinación/posición irregular y la firma sin reescalado.
- Continúa sobre `feature/v1.13.0-media-kit-welcome-letter`; v1.12 y v1.13 siguen fuera de PROD hasta cerrar la rama.

# v1.13.5 — Acabado premium de carta y sello (2026-08-27)

- La Carta de bienvenida incorpora textura sutil de papel premium, sello azul grisáceo menos intenso y mayor legibilidad del logo.
- Se conserva el sello grande y orgánico de v1.13.4 y la firma mantiene siempre su tamaño aunque exista solape.
- El cierre final deja de repetir el nombre del destinatario; el nombre continúa personalizando el saludo inicial.
- Continúa en `feature/v1.13.0-media-kit-welcome-letter`; v1.12 y v1.13 siguen fuera de PROD hasta cerrar la rama.

# v1.13.4 — Sello orgánico y firma sin restricciones (2026-08-27)

- El sello de la Carta de bienvenida aumenta a 164 px para ganar presencia en el bloque de cierre.
- Su posición varía de forma aleatoria controlada hasta ±26 px en horizontal, ±20 px en vertical y ±9° de inclinación en cada render.
- La firma conserva siempre el tamaño asociado a la tipografía elegida; no se reduce para evitar el sello y se permite el solape parcial intencionado.
- El sello mantiene sus variantes Sin sello, Sello limpio y Sello tinta y continúa usando el logo normal de la liga en cabecera.
- Continúa en `feature/v1.13.0-media-kit-welcome-letter`; v1.12 y v1.13 siguen fuera de PROD hasta cerrar la rama.

# v1.13.3 — Personalización de destinatario, logo y sello (2026-08-27)

- La Carta de bienvenida incorpora nombre del destinatario y selector Masculino/Femenino para resolver automáticamente Bienvenido/Bienvenida y cualquier tratamiento dependiente del género.
- El logo de la liga se conserva siempre normal en la esquina superior izquierda cuando existe.
- El sello queda como elemento independiente junto a la firma y ofrece Sin sello, Sello limpio y Sello tinta.
- La firma automática pasa a `Organización de {NOMBRE DE LA LIGA}` y continúa siendo editable.
- Continúa en `feature/v1.13.0-media-kit-welcome-letter`; v1.12 y v1.13 siguen fuera de PROD hasta cerrar la rama.

# v1.13.2 — Sello institucional, firma manuscrita y cierre de párrafos (2026-08-27)

- La Carta de bienvenida permite mostrar el logo original o convertirlo en un sello azul tinta, con variantes limpia e impresión orgánica.
- La firma incorpora estilos independientes del cuerpo: clásica, Allura, Petit Formal Script y Great Vibes; por defecto se usa Allura.
- El texto automático separa en bloques propios «Desde este momento…» y «Bienvenido/a a Smash & Lob», también en inglés y euskera.
- Las fuentes manuscritas se cargan bajo demanda junto a las serif premium y mantienen fallback local si la red no está disponible.
- Continúa en `feature/v1.13.0-media-kit-welcome-letter`; v1.12 y v1.13 siguen fuera de PROD hasta cerrar la rama.

# v1.13.1 — Párrafos y tipografía premium en la carta (2026-08-27)

- La Carta de bienvenida respeta saltos manuales y separa cada bloque automático con una línea completa de aire.
- Personalizar incorpora cuatro estilos: Club clásico (Cormorant Garamond + Libre Baskerville), Editorial premium (Instrument Serif + Lora), Baskerville y Lora.
- Las fuentes se cargan bajo demanda desde Google Fonts al componer la carta; el render conserva fallback serif local si la red no está disponible.
- La altura de la carta sigue calculándose antes de dibujar para reducir el cuerpo si hace falta y proteger la firma y el último párrafo.
- Continúa en `feature/v1.13.0-media-kit-welcome-letter`; v1.12 y v1.13 permanecen fuera de PROD hasta cerrar la rama.

# v1.13.0 — Carta institucional de bienvenida (2026-08-26)

- Rama: `feature/v1.13.0-media-kit-welcome-letter`.
- Media Kit incorpora el preset **Carta de bienvenida**, con diseño premium de documento institucional y texto completo editable.
- El contenido automático se construye con los datos reales de la temporada: inscripción, Jornada de Apertura, inicio programado y descansos solo aparecen cuando existen.
- La carta explica de forma breve acceso por invitación, perfil, gestión desde la app y Formato Smash & Lob; título, cuerpo, despedida y firma se pueden personalizar y restaurar.
- v1.12 continúa pendiente de PROD; v1.13 parte de v1.12.4 y se desplegarán conjuntamente cuando se cierre esta rama.

# v1.12.4 — Auditoría personalizada y creación más clara (2026-08-26)

- La auditoría de calendario deja de limitarse a 1×/2× vueltas completas: cualquier duración válida, incluida una personalizada como 11 jugadores y 13 jornadas, muestra Equilibrio del calendario y REROLL.
- El panel identifica las duraciones parciales como Personalizada y muestra cada regla aplicable; los repartos matemáticamente no exactos se describen mediante el rango optimizado realmente obtenido.
- REROLL conserva la misma protección: cualquier resultado registrado bloquea la regeneración.
- La creación separa Tipo de calendario, Duración y Visibilidad en tarjetas independientes y numeradas; Equilibrado/Manual pasan de desplegable a opciones visibles.
- No hay cambios de esquema ni migraciones nuevas.

# v1.12.2 — Auditoría adaptativa del calendario (2026-08-26)
- v1.12.2: el panel de Equilibrio del calendario adapta sus validaciones al número real de jugadores; los formatos con descansos muestran por separado partidos por jornada, máximo una aparición, descansos por jornada y jugador, ausencia de descansos consecutivos y cuartetos no repetidos.

- La misma rama `feature/v1.12.0-flexible-season-size` continúa acumulando el desarrollo v1.12.x; no se publica en PRE/PROD.
- Todos los tamaños entre 8 y 24 jugadores pueden crear temporada. Los múltiplos de cuatro conservan el calendario perfectamente equilibrado sin descansos y el resto usa un calendario equilibrado con descansos.
- Los calendarios con descansos usan N jornadas por vuelta, `floor(N/4)` partidos por jornada y `N mod 4` descansos por jornada; cada jugador descansa exactamente `N mod 4` veces por vuelta.
- El generador cíclico determinista evita descansos consecutivos, parejas repetidas y cuartetos repetidos dentro de cada vuelta y limita la repetición de rivales.
- HOME y Mis partidos identifican explícitamente las jornadas de descanso del jugador sin romper el ocultamiento progresivo de emparejamientos.
- Revisión de continuidad: el resumen de temporadas finalizadas y el fallback local de creación inicial usan también el cómputo flexible de jornadas, evitando tratar las plantillas con descansos como `N-1` jornadas.
- La auditoría, API, duplicación y calendario manual comparten las reglas flexibles. La migración `20260825214500_allow_flexible_season_player_capacity.sql` elimina únicamente la antigua exigencia SQL de múltiplo de cuatro, conservando el rango legacy 4..32 en BBDD mientras la aplicación limita nuevas temporadas a 8..24.

# v1.12.0 — Tamaño flexible de temporada (2026-08-25)

- Rama prevista: `feature/v1.12.0-flexible-season-size`, creada desde `main` en `dcdf9ea54e284e7704cbf4562c37fda236528d0f`.
- La creación de temporada usa un selector genérico de 8 a 24 jugadores, ajustable de uno en uno.
- En esta fase solo 8, 12, 16, 20 y 24 permiten crear la temporada; los demás tamaños se muestran como futuros formatos con descansos.
- La validación de tamaño se centraliza y se reutiliza en cliente, API y duplicación de temporadas.
- El generador equilibrado añade starters cíclicos verificados para 20 y 24 jugadores y conserva la auditoría de pareja única y doble oposición por vuelta.
- No hay migraciones ni cambios de datos persistidos.

# v1.10.18 — Plantillas continuistas, ubicaciones estructuradas y amistosos visibles (2026-08-19)

- Las temporadas posteriores con `roster_mode = self_registration` pueden arrancar con jugadores de la temporada anterior ya inscritos: se seleccionan por defecto en administración, se pueden desmarcar y las plazas restantes permanecen abiertas al autoregistro. La Temporada 1 conserva el autoalta del creador cuando corresponde.
- Las cuotas son estrictamente por temporada: una nueva temporada genera su registro económico con todos los jugadores inicialmente pendientes, sin heredar pagos de la anterior.
- La plantilla fija admite usuarios globales registrados en Smash & Lob mediante un directorio público limitado a nombre/avatar; el servidor crea o reutiliza el jugador de esa liga y enlaza directamente `league_memberships`.
- Los amistosos incorporan `location_id`, `location_court` y `location_snapshot`. La pista deja de formar parte de la identidad de la ubicación global y `padel_locations` pasa a ser la fuente maestra cuando existe.
- Superadmin puede borrar una ubicación del catálogo aunque tenga usos, conservando snapshots históricos; además ve liga/temporada/jornada/fecha/jugadores y puede abrir, cambiar o quitar la ubicación de partidos futuros.
- `Mis partidos > Próximos partidos` contiene exclusivamente todos los amistosos futuros. Los amistosos programados cuya fecha ya pasó pasan al historial aunque sigan `scheduled`; los partidos de Liga no aparecen nunca en Próximos.
- `Añadir al calendario` de amistosos conserva siempre sus clases de botón aunque reciba clases de layout desde `MatchScheduleForm`.
- Nueva migración aditiva `20260819173000_personal_locations_and_match_dashboard.sql`. No limpia automáticamente datos legacy de PROD: la inspección y corrección se hace de forma explícita desde Superadmin antes de eliminar duplicados.

# v1.10.17 — Contexto de Ajustes y safe area de Mis partidos (2026-08-19)

- La NAVBAR de `Mis partidos` reutiliza la misma superficie segura inferior de la NAVBAR de Liga: además del `safe-area-inset-bottom`, activa el estado raíz `data-bottom-nav-visible` para que la barra de gestos móvil conserve el fondo de la navegación.
- `AJUSTES` deja de renderizar cualquier NAVBAR inferior; al entrar desde Liga o `Mis partidos` ya no aparece de forma implícita la navegación de Liga.
- El acceso flotante a Ajustes añade un `returnTo` interno con la ruta actual y el botón `Volver` de Ajustes lo consume de forma segura; una entrada directa a Ajustes conserva HOME como fallback.
- Los chats de Liga y Amistosos ocultan el botón flotante global de Ajustes.
- No hay cambios de Supabase ni migraciones nuevas.

# v1.10.16 — Liga completa en Euskera e Inglés y pulido de UI (2026-08-19)

- Se mantiene el sistema i18n existente y se completa una auditoría de las pantallas y flujos de Liga para cubrir Español, Euskera e Inglés: navegación, formularios, estados, errores, feedback, chats, economía, clasificación, estadísticas, administración, temporada programada, tutoriales y exportables.
- `I18nProvider` incorpora `tx(...)` como adaptador para texto visible heredado/dinámico; reutiliza los diccionarios `es/en/eu` existentes y no crea un segundo selector ni otra fuente de estado de idioma.
- `scripts/check-league-i18n.mjs` comprueba paridad de las claves estructuradas, cobertura de textos `tx`, plantillas dinámicas y mensajes de feedback/error, y detecta español hardcodeado en el núcleo de las pantallas de Liga.
- El exportable `Calendario de enfrentamientos` conserva el centro del `VS`, reduce el hueco central efectivo y amplía las áreas de los dos nombres para reducir recortes.
- Los controles flotantes superiores de `AppShell` se agrupan en un contenedor flex; si desaparece `Añadir` porque la plantilla está completa, `Ayuda / Tutorial` se recoloca automáticamente sin dejar un hueco.
- Los exportables de temporada y media kit reciben el locale activo para traducir también el contenido generado fuera del DOM.
- No hay cambios de Supabase ni migraciones nuevas.

# v1.10.15 — Calendario preparado antes del inicio programado (2026-08-19)

- Las temporadas programadas con `roster_mode = self_registration` dejan de esperar al momento de activación para crear partidos: cuando la plantilla está completa se genera el calendario manteniendo la temporada en `upcoming`.
- `/api/access` ejecuta primero una preparación idempotente de calendarios programados y después la activación de los que ya han alcanzado `scheduled_start_at`; esto cubre también temporadas ya existentes en PRE/PROD.
- La preparación no depende de que las cuotas estén pagadas: los emparejamientos dependen de la plantilla. La activación real conserva el gate de cuotas pendiente.
- `server_start_self_registration_season` reutiliza los partidos preparados y valida que el calendario siga siendo compatible con la plantilla, evitando duplicados.
- Si un administrador libera una plaza antes del inicio, el RPC elimina el calendario preparado en la misma transacción; al completarse de nuevo la plantilla se genera uno nuevo.
- Nueva migración `20260818232000_prepare_scheduled_self_registration_calendar.sql`.
- VISTA ADMIN ON conserva acceso previo al calendario; VISTA ADMIN OFF y jugadores normales mantienen el bloqueo programado.

# v1.10.14 — VISTA ADMIN y simulación de temporada programada (2026-08-19)

- Se corrige el bypass excesivo introducido al permitir que los administradores navegasen una temporada programada: el rol real por sí solo ya no evita el bloqueo de jugador.
- `isLeagueAdmin(...)` / `canAccessAdmin` —que incorporan `isAdminViewEnabled`— gobiernan ahora el bypass visible en HOME, AppShell, CALENDARIO/PARTIDOS, detalle de PARTIDO, CHAT de Liga y selección de temporada de `useCurrentLeagueData`.
- Con VISTA ADMIN activada, creador/admin/superusuario conserva la temporada programada navegable y ve también countdown/estado programado en HOME.
- Con VISTA ADMIN desactivada, esa misma cuenta se comporta como jugador normal para las pruebas locales: navegación bloqueada, HOME previo al inicio y partidos/chats restringidos hasta el comienzo.
- Los permisos reales no se eliminan del modelo ni de servidor; el cambio afecta al modo de presentación/navegación controlado por VISTA ADMIN.
- La Jornada 1 sigue sin activarse antes de su fecha y no hay migraciones nuevas.

# v1.10.13 — Inicio programado visible también para admins (2026-08-19)

- Se corrige una regresión de v1.10.11/v1.10.12: permitir que un administrador navegue una temporada programada no debe ocultar en HOME su estado previo al inicio.
- `SeasonStartCountdown` y el panel `Próxima temporada` pasan a depender del estado programado de la temporada, no de que el usuario esté bloqueado; por tanto también aparecen para creador, administradores y superusuarios.
- El bloqueo de navegación continúa dependiendo de `isPlayerSeasonLocked` / `isScheduledSeasonHomeLocked`, de modo que los jugadores normales siguen restringidos hasta el inicio y los administradores mantienen calendario, jornadas y partidos accesibles.
- No se adelanta la activación de la Jornada 1 ni se modifica la fecha programada.
- No hay cambios de Supabase ni migraciones nuevas.

# v1.10.12 — CHAT compartido entre Liga y Amistosos (2026-08-18)

- Los chats de Liga y Amistosos reutilizan `MatchChatShared.tsx` como base común para cabecera/frame, mensajes de texto, avatares, colores de remitente, recibos de lectura, composer, estado de solo lectura, aviso de las 24 horas y ajuste al viewport/teclado móvil.
- El chat de Liga conserva como extensiones específicas las propuestas de fecha y ubicación, menciones, respuestas por gesto y confirmación de reserva; los mensajes de texto normales se renderizan con el mismo componente que los amistosos.
- El chat de Amistosos deja de mantener una segunda implementación visual: usa `MatchChatScreen`, `MatchChatTextMessage`, `MatchChatComposer`, `MatchChatReadOnlyBar`, `MatchChatWriteWindowBanner`, `useMatchChatAutoScroll` y `useMatchChatViewport`.
- Se añaden pruebas estructurales para impedir que Liga y Amistosos vuelvan a duplicar las piezas visuales comunes del chat.
- Se mantienen acumulados todos los cambios de v1.10.11: bandeja `Mis partidos > Chats`, selector flotante de jugadores, tutoriales automáticos de una sola ejecución, pago de inscripción corregido, temporada programada plenamente navegable para administradores y botón futuro de transparencia en Economía.
- No hay migraciones nuevas en v1.10.12. El chat de amistosos sigue dependiendo de la migración aditiva ya preparada `20260818213500_add_personal_match_chat.sql`; esta entrega local no la aplica a ningún Supabase remoto.
- Validación previa de v1.10.12 en el entorno de preparación: 15/15 checkers estáticos, `git diff --check`, transpilación sintáctica de 49 TS/TSX modificados y 127/127 pruebas unitarias/estructurales modificadas ejecutables sin dependencias del proyecto. La validación completa real de dependencias, lint, typecheck, suite, build, quality y E2E se repite sin short-circuit en el equipo local antes de arrancar desarrollo.

# v1.10.11 — Chats de amistosos, pagos y temporada programada para admins (2026-08-18)

- `Mis partidos > Chats` reúne todas las conversaciones de amistosos del usuario, sin filtrar por estado, con no leídos, último mensaje, Realtime y los estados Programado, Abierto 24 h, Solo lectura e Historial eliminado.
- El chat de amistosos distingue explícitamente la ausencia del esquema de chat y señala la migración pendiente `20260818213500_add_personal_match_chat.sql`; esta entrega local no aplica migraciones remotas.
- Los selectores de jugadores de amistosos pasan a popup flotante mediante portal, bloqueo de scroll, cierre con Escape y fondo difuminado, manteniendo identidad y selección manual.
- El progreso de tutoriales se considera completado por clave de recorrido, no por versión: refrescar o actualizar no vuelve a lanzar un tutorial ya visto. `chats`, `match` y `chat` quedan además admitidos por la API de progreso.
- El pago de inscripción por parte del propio jugador utiliza una ruta dedicada y autorizada server-side; ya no intenta guardar toda la configuración de temporada mediante una operación reservada a admins.
- Una temporada programada deja de bloquear a creadores, administradores y superusuarios aunque `VISTA ADMIN` esté desactivada: ven la temporada actual, calendario, jornadas, partidos y chat con normalidad. Los jugadores normales conservan el bloqueo hasta el inicio y no se altera la activación temporal de la Jornada 1.
- Economía añade al final el botón deshabilitado `Generar informe de transparencia · Próximamente`; la generación del informe queda pendiente para una entrega posterior.
- La validación local de entrega se ejecuta sin short-circuit: todos los gates se recopilan antes de fallar y, si todo pasa, `npm run dev` queda asociado al mismo PowerShell.
- Validación previa en el entorno de preparación: `git diff --check`, 15/15 checkers estáticos, inventario de seguridad actualizado a 86 rutas / 124 métodos, presupuesto de fuente en 106.952 líneas / 158 clientes / 49 páginas cliente y transpilación sintáctica de todos los TS/TSX modificados correctos. La suite real, ESLint, typecheck, build, quality y E2E se ejecutan de nuevo en el proyecto local mediante el instalador antes de arrancar desarrollo.

# v1.10.10 — PARTIDO unificado y chat de amistosos (2026-08-18)

- PARTIDO de Liga y Amistoso comparten `MatchDetailView`, `MatchDetailPairingPanel`, `MatchScheduleForm`, `CourtBookingPanel` y `MatchResultForm`; el editor de participantes se mantiene específico porque su negocio es distinto.
- El perfil REVÉS/DRIVE + DIESTRO/ZURDO del amistoso usa la misma ubicación y ciclo visual que Liga; no se inventa posición de clasificación fuera de competición.
- Los amistosos incorporan chat privado de texto para participantes vinculados con Realtime y recibos de lectura.
- Liga y amistosos permiten mensajes durante 24 horas tras registrar el resultado; las acciones de coordinación de Liga se cierran al finalizar el partido.
- Nueva migración aditiva `20260818213500_add_personal_match_chat.sql`: tablas privadas para mensajes/lecturas y función service-role para purgar chats de amistosos a los dos meses. La ruta programada de notificaciones ejecuta esa limpieza en modo best-effort.
- Esta entrega es local: no aplicar la migración ni publicar PRE/PROD hasta superar validación y revisión manual.

# v1.8.23 — Propuestas propias con contenido más ligero (2026-08-16)

- CHAT conserva el color dominante del tema en el contenedor exterior de las propuestas propias.
- Fecha, ubicación, votación, detalle de votos y badges interiores vuelven a superficies claras con texto oscuro.
- Las propuestas recibidas mantienen su presentación blanca y no cambia la lógica de votación, coordinación, reserva ni API.
- La cabecera de una propuesta propia vuelve a usar el mismo contraste `on-primary` que los mensajes enviados normales; el texto auxiliar y la hora/recibos comparten su estilo sin contaminar las superficies interiores claras.
- No se añaden migraciones ni se modifica el esquema de Supabase.

# v1.8.22 — Ajustes visuales de Chat y bandeja (2026-08-15)

- Las propuestas de ubicación centran verticalmente el nombre mientras no exista acuerdo y reservan espacio para la etiqueta `Acuerdo 4/4` cuando aparece.
- CHATS elimina los chevrons laterales de las conversaciones y recupera ese espacio para el contenido.
- Se conservan el ocultado del panel Pendiente de reserva tras confirmar y la diferenciación visual entre propuestas propias y recibidas.
- No se añaden migraciones ni se modifica el esquema de Supabase.

# v1.8.21 — Reserva pendiente desde acuerdo de fecha (2026-08-15)

- El detalle de Programación usa el formato `Jueves · 19 de Febrero de 2026 · 19:00`.
- Una fecha/hora con aprobación 4/4 pasa directamente a `awaiting_booking`; la ubicación ya no es requisito previo.
- CHAT fija el estado Pendiente de reserva sobre el historial y permite confirmar fecha, ubicación y pista o invalidar las fechas acordadas para abrir una nueva propuesta.
- Las ubicaciones aprobadas 4/4 se respetan al confirmar; sin acuerdo previo se ofrecen las ubicaciones configuradas, mientras las rechazadas 4/4 quedan señaladas y bloqueadas.
- Los votos ✓/✕ son reversibles al pulsar de nuevo el mismo voto.
- Los avisos de acuerdo de fecha y de partido programado comparten el hilo de notificación del chat; ambos incluyen a los cuatro participantes y se silencian en el dispositivo que mantiene ese CHAT visible.
- No se añaden migraciones ni se modifica el esquema de Supabase.

# v1.8.20 — Perfiles enlazados desde Chat (2026-08-15)

- Los nombres de jugadores visibles en CHAT abren su perfil mediante el `playerId` real del participante.
- El enlace se aplica al autor del bloque, detalle de votos y referencias de respuesta cuando el participante puede resolverse de forma segura.
- No hay cambios de API, permisos, Supabase, migraciones ni datos persistidos.

# v1.2.13 — Accesos de cierre y preparación operativa (2026-08-06)

- Inicio añade accesos a Historial y estadísticas y a Compartir resumen cuando la temporada está terminada.
- Registro de cambios ofrece contenido público genérico y detalle técnico exclusivo para superadministración.
- Quedan preparados observabilidad opcional, rulesets de GitHub, QA autenticada de PRE y backups cifrados de Supabase.
- Las integraciones externas permanecen desactivadas hasta configurar sus credenciales y variables.
- No se añaden migraciones ni se modifican datos persistidos.

# v1.2.12 — Automatización de calidad (2026-08-06)

- Supabase local reconstruye y prueba migraciones, actualización histórica y restauración de backup en CI.
- La autorización de liga y partido se centraliza y queda cubierta por una matriz completa de actores.
- Todas las rutas API se inventarían automáticamente y la allowlist pública queda cerrada.
- Se añaden presupuestos de código, bundle y Lighthouse con artefactos de diagnóstico.
- GitHub Actions separa los gates de código, navegador, base de datos y rendimiento.
- El rate limiting admite Redis REST compartido cuando se configuran credenciales y conserva fallback local; los logs incluyen metadatos de despliegue.
- No hay migraciones nuevas ni cambios de producto o datos persistidos.

# v1.2.11 — Valores iniciales de Notion Avatar (2026-08-06)

- Todas las categorías de Notion Avatar comienzan en el índice cero, mostrado como Estilo 1.
- Restablecer devuelve la receta completa a Estilo 1.
- La clave local experimental avanza a `smash-lob-avatar-lab-notion-v3` para no recuperar selecciones antiguas de PRE.
- No hay cambios de permisos, autenticación, API, Supabase, migraciones ni datos persistidos.
- La promoción conserva como requisitos manuales el backup de PROD y la auditoría SQL de identidades.

# v1.2.10 — Endurecimiento previo a producción (2026-08-06)

- Rama prevista: `chore/v1.2-prepublication-hardening`, creada desde `staging` en `bf605dd07bee3659a315c3ee1b0bec06daa4bfbf`.
- Avatar Lab queda habilitado únicamente en `pre.smashandlob.com` y desarrollo local; Ajustes, búsqueda, páginas y API quedan bloqueados en PROD.
- Los renderizadores experimentales requieren sesión, aplican rate limiting y no generan cachés públicas compartidas.
- Las nuevas imágenes globales se generan a 256 × 256 y se limitan a 160 KB; la lectura mantiene compatibilidad con imágenes antiguas de hasta 512 KB.
- `/api/access` publica `X-Smash-Lob-Snapshot-Bytes` y registra una advertencia estructurada cuando el snapshot supera 1 MB.
- Se añaden `/api/health`, smoke tests PRE/PROD, validación de versión, auditoría de migraciones e identidad, y checklist de promoción.
- La publicación a PROD queda bloqueada hasta superar `npm run release:check`, el smoke de PRE, la auditoría SQL y las comprobaciones manuales autenticadas del checklist.
- No se modifica ninguna migración ya aplicada; cualquier reparación de datos debe añadirse en una migración posterior y reversible.
- La regresión visual detectada en Ajustes correspondía al test: ocultaba únicamente la fila experimental y dejaba la sección vacía; v1.2.10 oculta la sección completa sin renovar snapshots.
- `npm audit --omit=dev --audit-level=high` informa cero vulnerabilidades de producción; los avisos altos de `npm ci` quedan limitados a herramientas de desarrollo.

# Avatar Lab v1.2.8 — Notion compacto (2026-08-05)

- Editor Notion reorganizado en una única vista móvil con preview y controles visibles simultáneamente.
- Eliminados presets, selección de forma y selección de fondo.
- Lienzo Notion fijo, rectangular y blanco.
- Categorías accesibles con anterior/siguiente y selector nativo; estilos centrados en navegación anterior/siguiente.
- Sin cambios en perfil, Supabase o datos de liga.

## v0.16.12 — Classic style naming and award header polish

- Renamed the visible neutral appearance style to Clásico/Classic/Klasikoa while preserving the internal `plain` storage key.
- Kept Colorido and all six palettes unchanged.
- Rounded the Home season-winner and season-MVP title bars to align with the containing cards.
- No API, permission, routing, database or remote-environment change.
- Local lint, typecheck and production build remain required before commit and promotion.

## v0.15.7 — Availability effect dependency cleanup

- ESLint exhaustive-deps warning removed from the availability screen.
- No API, permission or database changes.
- Local lint, typecheck and production build remain required before commit.

## v0.14.0 settings architecture (2026-07-24)

- Reorganized Settings into Personal, My leagues, Personal activity, Administration, Help and information, and Session.
- Player and spectator settings now share the same capability-driven visual architecture.
- Reorganized the league administration hub into General, People and access, Competition, Operations, and Data and control.
- Grouped personal notification preferences into four expandable categories.
- Added clearer internal sections to season, league, users, and administrative activity screens.
- Preserved all existing routes, anchors, APIs, permissions, and the current settings-search implementation.
- No database migration or remote change is required.


## Post-release validation fix (v0.15.5, 2026-07-24)

- Fixed two TypeScript errors introduced by actionable empty states on the Activity screen.
- Empty-state refresh actions now reuse the same refresh function as the section headers.
- No database migration, API contract, permission, or data change is required.

## v0.13.3 public changelog (2026-07-24)

- Added `/changelog` with a public-safe history of documented Smash & Lob releases starting at v0.6.2.
- Added access from player and spectator settings, the visible version footer, and the settings search index.
- Grouped minor revisions when a reliable public per-patch description is unavailable instead of inventing release details.
- Added the changelog route to the spectator allowlist.
- No database migration or remote change is required.


## v0.13.2 cumulative application-admin package (2026-07-23)

- Rebuilt the complete v0.13.x delivery from the original staging snapshot plus the v0.13.0 application-administration changes.
- Retains the v0.12.7 scheduling-panel and compact statistics season-selector refinements.
- Corrects the v0.13.1 upcoming-roster refresh so Supabase snapshots replace stale season/player membership data for the leagues represented by the snapshot.
- The correction is client-state-only and does not add or modify database migrations beyond `20260723133000_add_application_admin_controls.sql`.
- Version advanced to v0.13.2 because the previously delivered v0.13.1 package did not pass TypeScript validation.

# Production Hardening Status

Last updated: 2026-07-26 20:43:00 +02:00
Current branch at status update: `feature/v0.16-colorful-design`
Production branch confirmed from Git + Vercel: `main`
Production source version retained in this run: `v0.9.71`
Staging source commit retained in this run: `78f1986` (`v0.10.0`)
Active milestone state: `H20-H23 complete; environment isolation repair complete`

## Post-hardening fix checkpoint (v0.13.1, 2026-07-23)

- Fixed stale self-registration roster entries after a linked user leaves a league before the season starts.
- Supabase season snapshots are now authoritative for the leagues and seasons included in each refresh, so deleted `season_players` rows no longer survive in local state or localStorage.
- The existing unlink SQL function remains unchanged: it already removes the player from an upcoming self-registration roster and reopens registration. This patch only corrects client hydration.
- No database migration is required for v0.13.1.

## Post-hardening feature checkpoint (2026-07-23)

- Prepared source version `v0.13.0` on top of the current staging snapshot.
- Added global application administration for summary metrics, richer account data, account suspension/reactivation, onboarding resets, push/preference cleanup, league ownership transfer, and application-admin audit history.
- Added local migration `20260723133000_add_application_admin_controls.sql`; it has not been applied remotely by this patch.
- Account suspension is enforced in the shared server authentication boundary and renders a dedicated blocked-account screen before league providers load.
- League ownership transfer updates the league owner and both membership roles transactionally through a service-role-only SQL function.
- The v0.12.7 scheduling-panel and compact season-selector changes are retained cumulatively in this source.
- TypeScript/TSX syntax transpilation passed for every modified source file, and whitespace/conflict-marker checks are clean.
- Full dependency installation, lint, typecheck, and build could not be completed in the review container because its npm proxy returned HTTP 503 for required packages; these gates remain mandatory locally before commit.



## Product experience update — v0.16.0

- Added a fourth device-local appearance preference: `colorful`.
- The initial layout script and ThemeProvider apply the same resolved theme, preventing a light-theme flash during startup.
- Colorful styling is centralized in CSS and covers shell backgrounds, cards, statistics, ranking, bottom navigation, floating controls, forms and skeletons.
- Existing light, dark and system preferences remain supported without data migrations.
- Status colors remain semantic, and the per-league neutral-color option still takes precedence for status elements.
- Full local lint, TypeScript and production-build validation remains required before merging the feature branch.

## Final state summary

- `git fetch --all --prune` was rerun on 2026-07-16, and `git ls-remote --heads origin main release/production-hardening` confirmed both remote branches point to the same release line.
- The requested UI-only change is in place: the settings footer now renders `Beta cerrada · v0.9.68` for both player and spectator settings screens without changing `package.json`, `package-lock.json`, or `src/lib/appVersion.ts`.
- Local release gates for this final change passed: `git diff --check`, `npm run lint`, and `npm run build`.
- Preview and Production deployments for the release run reached `Ready`, and Vercel build logs tied them to `release/production-hardening` / `main` for the final release commit during rollout.
- Production env-name presence was confirmed without printing values, and the normalized checks for `QA_MODE=false`, `NEXT_PUBLIC_QA_MODE=false`, and `NEXT_PUBLIC_APP_URL=https://smash-lob.vercel.app` passed.
- The live production smoke suite passed for root, manifest, auth session/providers, Google provider metadata, cron-without-secret, protected no-session routes, and controlled invalid invite responses.
- The earlier invalid-key finding is superseded by the 2026-07-20 credential repair and the read-only REST validation recorded below.
- On 2026-07-18, the project owner completed the documented two-Google-account Production walkthrough, covering organizer, player/member, result/confirmation/MVP, and spectator flows.

## Environment isolation repair (2026-07-20)

- The local Supabase CLI link remains on PRE project `miadjotkucgluwbrgeih`; it was not switched to Production.
- Vercel Production now targets Supabase Production project `szycbwdzestcmimziyey` for the public URL, anon key, and service-role key.
- Vercel Preview defaults and the explicit Git branch `staging` overrides now target Supabase PRE project `miadjotkucgluwbrgeih` for the same three variables, preventing future Preview branches from falling back to Production.
- Both official legacy JWT pairs were validated before use: three JWT segments, expected project reference and role claims, and successful read-only HTTP checks.
- Public keys were compared exactly after storage without printing values. Service-role values were stored as Vercel Sensitive variables and cannot be read back.
- Production was rebuilt from its existing `main` deployment, preserving the v0.9.71 source line. Staging was rebuilt from its existing branch deployment, preserving v0.10.0.
- No code, data, migration, Supabase link, Production branch, or Git branch was changed as part of the remote configuration repair.
- Read-only data checks show 3 leagues in Production and 0 in PRE. The configured owner account exists in both environments and can create leagues; Production has 3 creator memberships while PRE has none.

## Verified deployment targets

- Preview credential-repair deployment id: `dpl_HppVyCzPCteV9vDJthi1c9fQESg4`
- Preview credential-repair URL: `https://smash-lmw3hmjw7-davidalonsoc4-8740s-projects.vercel.app`
- Preview stable alias (tracks subsequent `staging` commits): `https://smash-lob-git-staging-davidalonsoc4-8740s-projects.vercel.app`
- Preview status at the final post-push check: `Ready`
- Production deployment id: `dpl_ABUCNvnneZ5aTcLhwe51ChVRznBi`
- Production URL: `https://smash-op3577c8f-davidalonsoc4-8740s-projects.vercel.app`
- Production aliases:
  - `https://smash-lob.vercel.app`
  - `https://smash-lob-davidalonsoc4-8740s-projects.vercel.app`
  - `https://smash-lob-git-main-davidalonsoc4-8740s-projects.vercel.app`
- Production status: `Ready`

## Smoke-test snapshot (2026-07-20)

- `/` -> `200 text/html`
- `/api/auth/session` -> `200 application/json` with controlled anonymous response
- Production `/api/invites/CODEX-ENV-ISOLATION-CHECK-20260720` -> `404 application/json`, proving the server-side Supabase lookup completes without a credential error.
- Staging is intentionally behind Vercel Authentication. Authenticated Vercel checks returned an anonymous session and `{ "snapshot": null }` for the controlled invalid invite.
- Direct service-role REST reads completed without `401`: Production returned an exact league count of 3 and PRE returned 0.
- Production owner lookup found one account with league creation enabled and 3 creator memberships.
- PRE owner lookup found one account with league creation enabled and no memberships, consistent with an independent empty PRE dataset.

## Manual two-account verification completed

The project owner completed the interactive Production walkthrough with two Google accounts on 2026-07-18. The human-verified checklist covered:

- organizer sign-in
- opening the league
- generating a player invite
- joining with a second Google account
- claiming a player
- saving availability
- verifying calendar and ranking
- registering or reviewing a result
- verifying result confirmations and MVP voting
- opening and validating a spectator invite

This is human acceptance evidence reported by the project owner. It was not replayed independently by Codex, but it closes the final manual release check documented for the closed beta.

## Known residual risks

- Supabase platform defaults for `supabase_admin` in schema `public` remain an environment-level residual in `pg_default_acl`, although current public business tables remain owned by `postgres` and current-object grant/function audits are clean.
- Supabase security advisors still emit `RLS Enabled No Policy` informational findings on intentionally grants-closed server-only tables.
- The repo still has no automated test suite, so runtime confidence comes from static review plus Preview/Production smoke testing.
- The Google OAuth organizer/member/spectator round-trip now has human Production acceptance evidence; there is still no automated browser end-to-end suite to replay it continuously.

## Blockers

- No current release blocker is documented for the closed-beta scope.
- The application is considered Production Ready for controlled sharing with the league participants.

## v0.13.4 - Profile and navigation consistency (2026-07-24)

- Added a compact `/settings/profile` screen that unifies account-name and global profile-image editing.
- Kept create-league and join-league actions directly in Settings.
- Replaced remaining text navigation arrows with the shared `ClickableChevron` component.
- Made the current closed-beta version explicit on the public changelog card.
- No database migration is required.

## v0.14.1 - Settings polish (2026-07-24)

- Removed the duplicate application-version navigation row from Settings and restored the centered closed-beta version footer.
- Simplified the public changelog to show only release entries.
- Changed notification preference groups to load collapsed.
- Reworked per-day availability into compact expandable rows and removed the redundant profile-return button.
- Reduced Activity tab and Help screen visual scale to match the Settings architecture.
- No database migration, API, permission, route, or search-index change is required.

## v0.14.2 - Suggestions and settings search (2026-07-24)

- Added an authenticated suggestion inbox with private per-user submission history.
- Added a superuser-only suggestion review screen with internal status and notes.
- Added migration `20260724111500_add_application_suggestions.sql`; browser roles have no direct table access.
- Replaced the inline Settings search bar with a floating search control above the bottom navigation.
- Expanded the search index to cover notification groups, season rules, operations, exports, application administration, and suggestions.
- Improved search matching for natural phrases, plurals, partial words, and small typing errors.
- Compacted Match "More actions" entries to remain on a single line.

## v0.14.3 - Contextual help and stable search dialog (2026-07-24)

- Fixed the floating Settings search dialog to a stable responsive height; only the results area scrolls when the query or result count changes.
- Added a shared multilingual season guide used by Help and by the pre-join rules acceptance screen.
- Help now documents recent application features and summarizes the active roster, calendar, schedule, round-window, scoring, confirmation, MVP, fee, incident, and substitution configuration.
- Registration, MVP, incident, and substitute explanations are omitted when those features are disabled.
- The invitation rules summary now reflects the target season instead of always showing generic fee, calendar, MVP, and substitution rules.
- No database migration, API, permission, or search-index change is required.
- TypeScript syntax transpilation and isolated strict validation of the shared guide passed. Full project lint, typecheck, and build remain mandatory locally because dependencies were unavailable in the review container.

## v0.14.4 - Floating search dialog polish (2026-07-24)

- Anchored the Settings search dialog below the top floating controls while keeping its top edge fixed.
- Made the dialog height content-adaptive up to a responsive maximum.
- Limited scrolling to the results area and only when the content exceeds the available height.
- Extended the backdrop beyond the top viewport edge to remove uncovered pixels on mobile devices.
- No database migration, API, permission, route, or search-index change is required.
## v0.14.5 - React effect validation (2026-07-24)

- Removed synchronous state updates reached directly from effects in both suggestion screens.
- Made initial suggestion loads cancel-safe so late responses do not update unmounted pages.
- Moved notification hash expansion and scrolling into animation-frame callbacks.
- No database migration, API, permission, route, or search-index change is required.

## v0.14.6 - Reopen finished season hotfix (2026-07-24)

- Added a dedicated reopen path for finished seasons instead of reusing initial season start logic.
- Reopening preserves roster mode, players, registrations, season settings, existing matches, and results.
- Existing matches are reloaded from Supabase without calendar regeneration.
- No database migration is required.



## v0.15.0 - Image crop and optimization (2026-07-24)

- Added a reusable crop editor for player avatars and league logos.
- Added drag, zoom, rotation and final-shape previews before upload.
- Normalized client images to 512 × 512 compressed WebP data URLs.
- Added file type and 12 MB input-size validation.
- No migration, API, permission or database change is required.

## v0.15.1 - Loading states and skeletons (2026-07-24)

- Added reusable skeleton primitives and page compositions.
- Replaced generic session, profile and league-transition spinners with structured loading states.
- Added route skeletons for the most-used list, ranking, settings and detail screens.
- Skeleton animation respects reduced-motion preferences.
- No migration, API, permission or persistence change is required.

## v0.15.2 - Actionable empty states (2026-07-24)

- Added a shared empty-state component with context-specific actions.
- Replaced generic empty messages across matches, notifications, activity, suggestions, announcements, substitutes and statistics.
- Added compact variants for dense administrative screens.
- No migration, API, permission or persistence change is required.

## v0.15.3 - Contextual onboarding (2026-07-24)

- Added dismissible tips for Settings search, custom availability, Match actions and Season administration.
- Added a Help control to restore dismissed tips.
- Added Spanish, English and Basque onboarding copy.
- Tip state is local to the device and does not add server-side tracking.
- No migration, API, permission or remote persistence change is required.

## v0.15.4 - Lint cleanup (2026-07-24)

- Removed the unused translation binding reported by ESLint in `ProfileCompletionGate`.
- Preserved all profile completion, onboarding, and availability behavior.
- No migration, API, permission, or persistence change is required.

## v0.15.6 - Action feedback and connection recovery (2026-07-24)

- Added a global accessible action-feedback center above the bottom navigation.
- Added persistent offline status and a connection-restored confirmation.
- Added success/error feedback to profile, availability, notification, and suggestion actions.
- Added direct retry controls for recoverable availability, notification, and suggestion failures.
- No migration, API contract, permission, or database change is required.


## v0.16.1 - Location display consistency (2026-07-25)

- Centralized readable formatting for serialized schedule locations and courts.
- Fixed scheduled-match and upcoming-match notification bodies so legacy JSON values are never shown to users.
- Applied the formatter to Activity, match schedule summaries, calendar links and CSV exports.
- Added consistent Colorful-mode accents to notification, activity and schedule cards.
- No migration, API contract, permission or persistence change is required.

## v0.16.2 - Colorful appearance palettes (2026-07-25)

- Added five prepared palettes for Colorful mode: indigo/violet, blue/turquoise, emerald, coral/pink and orange/purple.
- Centralized palette values through CSS variables used by backgrounds, surfaces, navigation, cards, forms, standings and skeletons.
- Added device-local palette persistence and early startup application to avoid visual flashes.
- Preserved semantic match, payment, warning, success and error colours independently from the selected palette.
- Added Spanish, English and Basque labels plus Settings search terms.
- No database migration, API contract, permission or remote persistence change is required.

## v0.16.3 - Independent theme and visual style (2026-07-25)

- Split appearance into Light/Dark/System base theme and Plain/Colorful visual style.
- Added a compact Themes and appearance screen and reduced the main Settings block to one summary row.
- Added dedicated dark variants for all five Colorful palettes.
- Added automatic legacy localStorage migration and early startup application without visual flashes.
- Added Spanish, English and Basque copy plus updated Settings search routing.
- No database migration, API contract, permission or remote persistence change is required.

## v0.16.4 - Visual consistency, action feedback and image viewer (2026-07-25)

- Consolidated transient save confirmations in the global accessible feedback center.
- Improved Colorful-mode contrast for primary actions, secondary text, disabled controls and semantic notices, especially in dark mode.
- Added an accessible lightbox for main league logos and player profile images.
- Preserved inline contextual errors, retry behaviour, status colours and all existing business logic.
- No database migration, API contract, permission or remote persistence change is required.

## v0.16.5 - Visual closure and Settings search (2026-07-25)

- Extended the existing floating Settings search to the main navigation hubs for Settings, league administration, leagues and application administration.
- Kept concrete action and form screens free from the additional launcher.
- Contained Colorful card accent strips inside rounded borders without globally clipping card content.
- Added subtle interaction outlines to muted buttons and links on dark Colorful palettes.
- No database migration, API contract, permission or persistence change is required.

## v0.16.6 - Dark Colorful contrast closure (2026-07-26)

- Removed palette-coloured glow from fixed top action controls in dark Colorful themes.
- Added a dedicated compact primary treatment for the invite share control.
- Restored readable muted labels on palette-primary surfaces, including player statistics and MVP summaries.
- Centralized the correction in theme CSS so selected cards and equivalent components inherit the same contrast fix.
- No database migration, API contract, permission or persistence change is required.

## v0.16.7 - Colorful card accent strip alignment (2026-07-26)

- Replaced the absolutely positioned Colorful card accent strip with a layered card background.
- The strip is now clipped by the card padding box and follows the exact rounded border geometry.
- Preserved dedicated notification, activity and schedule gradients through a shared CSS variable.
- Avoided global overflow clipping, so menus and interactive card content remain unaffected.
- No database migration, API contract, permission or persistence change is required.

## v0.16.8 - Bottom navigation and panel accent cleanup (2026-07-26)

- Removed the blurred palette-coloured glow projected above the bottom navigation.
- Replaced it with a one-pixel separator and a minimal inner highlight in light and dark Colorful combinations.
- Restored the top accent gradient in row-based cards whose opaque children covered the layered card background.
- Applied the shared accent-reveal treatment to Settings, league administration and custom availability panels.
- Preserved exact rounded-corner clipping, active navigation gradients, safe-area layout and all navigation behavior.
- No database migration, API contract, permission or persistence change is required.


## v0.16.9 - Transparent league logos (2026-07-26)

- Added automatic alpha detection to the shared crop output.
- Transparent league logos preserve their background through PNG output, with transparent WebP fallback when needed to stay within the existing server size limit.
- Opaque logos keep the previous WebP format, dimensions and quality, so existing visual behavior remains unchanged.
- Audited all league-logo render paths; the shared component already uses a transparent container and `object-contain`.
- No database migration, API contract, permission or remote persistence change is required.

## v0.16.10 - Settings panel accent alignment (2026-07-26)

- Replaced the row-card padding workaround with an explicit internal accent strip rendered by `AppCard`.
- The strip is now clipped by the exact panel border radius and cannot be hidden or displaced by opaque rows.
- Applied the same shared treatment to Settings, league administration and custom day availability.
- Plain mode remains unchanged and does not reserve accent-strip space.
- No database migration, API contract, permission or persistence change is required.



## v0.16.11 · Paletas naturales y búsqueda de ligas

- Seis paletas Coloridas con variantes clara y oscura.
- Migración local de las cuatro paletas retiradas.
- Buscador contextual de ligas en `/leagues`.
- Sin migraciones ni cambios de API.

## v0.17.0 - Advanced statistics foundation (2026-07-26)

- Added season player comparisons with recent form, direct rivalry results and individual progress.
- Added the most frequent opponent to the existing individual season analysis.
- Brought Match scheduling and scoreboard panels into the shared Colorful accent treatment and removed the schedule-header divider.
- Made Home winner and MVP headers inherit the active Colorful palette while preserving Classic styling.
- No database migration, API contract, permission or remote persistence change is required.


## v0.17.1 - Season evolution and records (2026-07-26)

- Added global season records and personal competitive milestones.
- Added best/worst position, personal streaks and opponent records.
- Added compact period records to player profiles.
- Kept all calculations client-side over counted finished matches.
- No database migration, API contract or persistence change is required.


## v0.17.2 - Competitive progress charts (2026-07-26)

- Added comparative position and cumulative-points charts by round.
- Reused the player comparison selectors and existing calculated progress.
- Added palette-aware series and accessible SVG descriptions.
- Added no external chart dependency.
- No database migration, API contract or persistence change is required.


## v0.17.3 - Shareable final season summary (2026-07-26)

- Added a final-season card with champion, MVP, podium and competitive highlights.
- Added local PNG generation and native file sharing with download fallback.
- Adapted generated image colors to Classic and Colorful appearance settings.
- Added no external capture or chart dependency.
- No database migration, API contract or persistence change is required.


## v0.17.4 - Advanced statistics hardening (2026-07-26)

- Added tie-aware positions and shared champion handling.
- Excluded empty, tied or otherwise invalid finished results from all statistical calculations.
- Added data-quality visibility for pending, excluded and invalid matches plus roster changes.
- Precomputed progress once per selected season and skipped it in historical summaries.
- Fixed position chart scaling and shared-summary edge cases.
- No database migration, API contract or persistence change is required.

## v0.17.5 - Schedule accent consistency (2026-07-26)

- Removed the scheduling-only warm/accent card gradient.
- Match scheduling now inherits the same shared Colorful accent strip as standard application panels.
- Preserved panel clipping, rounded corners, layout and all scheduling behavior.
- No database migration, API contract, permission or persistence change is required.

## v0.17.6 - Statistics information architecture (2026-07-26)

- Replaced the overloaded statistics landing page with a compact overview.
- Split standings, comparison, individual analysis, records and season summary into dedicated routes.
- Preserved the selected season across statistics navigation through URL state.
- Reused one shared counted-match and statistics workspace across every detail page.
- Kept all v0.17 calculations available without changing formulas, APIs or persisted data.
- No database migration, API contract, permission or persistence change is required.

## v0.17.7 - Statistics callback dependency cleanup (2026-07-26)

- Replaced the type-only dependency on the full statistics object with the shared `MatchData` type.
- Removed the `react-hooks/exhaustive-deps` warning from the statistics workspace callback.
- Preserved all v0.17.6 routes, calculations and behavior.
- No database migration, API contract, permission or persistence change is required.


## v0.17.8 - Individual statistics refinement (2026-07-27)

- Added floating confirmation after creating or editing a match result.
- Added an all-player evolution route with position and accumulated-points views.
- Removed statistical pair rankings and shared-match counters from the v0.17 workspace.
- Ranked the strongest teammate by set differential and then game differential.
- Hid habitual-opponent frequency in balanced calendars.
- Reused the season selected on the statistics landing page across detail routes.
- Strengthened chart distinction through categorical colors, dash patterns and marker shapes.
- No database migration, API contract, permission or persistence change is required.

## v0.17.9 - Head-to-head and compact league evolution (2026-07-27)

- Renamed the two-player comparison route to Cara a cara and removed its duplicated evolution chart.
- Kept player summaries, recent form and direct-rivalry information focused on exactly two selected players.
- Replaced the league-evolution Top 4 shortcut with Top 3.
- Placed chart-mode and visibility selectors on one compact row and removed the repeated internal heading.
- Added one tick for every visible integer position and made seven rounds fit without horizontal scrolling.
- No database migration, API contract, permission or persistence change is required.
- Focused TypeScript syntax and chart-logic checks pass; full lint, project type-check and build remain pending in the local worktree because this review archive excluded `node_modules` and the package registry returned HTTP 503.

## v0.17.10 - Statistics usability and richer comparisons (2026-07-27)

- Differentiated participant and spectator invitation actions with dedicated user-plus and share icons.
- Removed the provisional podium, progress percentage, technical result counters and redundant navigation badges from the statistics landing page.
- Added sticky, editable player selectors to Head-to-head and Individual analysis.
- Expanded Head-to-head with direct set/game totals and performance against common opponents without double-counting aggregate matches.
- Reworked global and personal season records into plain-language cards with match context.
- Removed the standalone data-quality panel from the season summary, moved incomplete status beside the season label and blocked image export until the summary is complete.
- Rebuilt the shareable summary highlights and added cumulative game differential to league evolution.
- No database migration, API contract, permission or persistence change is required.
- Focused TypeScript transpilation and structural checks pass; full lint, project type-check and build remain pending in the local staging worktree because this review archive excludes `node_modules`.

## v0.17.11 - Floating statistics selectors and Classic accents (2026-07-27)

- Replaced the CSS-only sticky selectors with a shared intersection-driven fixed selector in Head-to-head and Individual analysis.
- Preserved the original selector height while floating to prevent content jumps and kept every player field editable.
- Positioned the floating layer below the existing top controls and restored it to normal flow when scrolling upward.
- Added restrained grayscale gradient accent strips to cards in Classic light and Classic dark while leaving Colorful palettes unchanged.
- Added reduced-motion handling for the selector entrance transition.
- No database migration, API contract, permission or persistence change is required.
- Focused TypeScript transpilation and structural checks pass; full lint, project type-check and build remain pending in the local staging worktree because this review archive excludes `node_modules`.

## v0.17.12 - League-wide statistics and individual evolution chart (2026-07-27)

- Made the fixed Head-to-head and Individual analysis selectors fully opaque with theme-aware borders and stronger exterior shadows.
- Added a `Toda la liga` statistics scope whenever a league contains more than one season; single-season leagues keep the selector hidden.
- Aggregated valid matches, rankings, comparisons, player details and records across all real seasons while resetting win streaks at season boundaries.
- Replaced the Individual analysis round table with a line chart for position, points and cumulative game differential.
- Preserved teammate, opponents, result and round context for every individual chart point.
- Rebuilt whole-league progress from each real season so metrics restart correctly, season boundaries are visible and lines do not imply continuity between competitions.
- Kept shareable final-summary images season-specific to avoid mixing champions, MVPs and podiums from different seasons.
- No database migration, API contract, permission or persistence change is required.
- Focused TypeScript syntax, semantic and aggregation smoke checks pass; full lint, project type-check and build remain pending in the local staging worktree because this review archive excludes installed dependencies.

## v0.17.13 - Taller and clearer season summary image (2026-07-27)

- Switched the generated season-summary asset used for both sharing and downloading to a taller vertical format.
- Reworked the image layout so champion, MVP, podium and highlights use the extra height with clearer spacing and hierarchy.
- Enlarged highlight cards and simplified podium rows to improve readability in the exported image.
- No database migration, API contract, permission or persistence change is required.
- Focused TypeScript syntax checks pass locally on the modified renderer; full lint, project type-check and build remain pending in the staging worktree with installed dependencies.


## v0.17.14 - Exported season summary readability fix (2026-07-27)

- Rebuilt the exported season-summary image with a taller single-column layout to avoid text collisions.
- Split champion and MVP into independent hero cards with more vertical space and stronger hierarchy.
- Stacked highlight cards vertically and constrained long copy to controlled wrapped lines with ellipsis.
- Kept sharing and downloading on the same generated asset.
- No database migration, API contract, permission or persistence change is required.
- Full lint, type-check and build remain pending in the local worktree with installed dependencies.


## v0.17.15 - Season summary export polish (2026-07-27)

- Combined champion and MVP into a single panel whenever they refer to the same player set.
- Added key player stats (points, wins, games difference) to hero panels in the page preview and exported image.
- Added games difference to podium rows in both the preview card and the exported image.
- Removed the intermediate badges for highlighted positions/moments and increased spacing between podium and highlights.
- Switched the generated summary image to a primarily light background regardless of the active app theme.
- No database migration, API contract, permission or persistence change is required.


## v0.17.16 - Compact monochrome season summary (2026-07-27)

- Replaced theme-driven export colors with a stable monochrome palette.
- Rendered separate champion and MVP panels side by side instead of vertically.
- Reduced hero, podium and highlight-card heights and tightened typographic hierarchy.
- Rendered highlights as a 2x2 grid in the exported image and two columns in the page preview when space allows.
- Switched the export canvas to a substantially shorter dynamic height.
- No database migration, API contract, permission or persistence change is required.


## v0.17.17 - Taller season summary readability pass (2026-07-27)

- Replaced the 2x2 highlight grid with a single-column list so long highlight text remains readable.
- Restored full-width champion/MVP hero cards to avoid displaced names and unused horizontal space.
- Increased the export canvas height slightly to improve breathing room and visual rhythm.
- Synced the in-page preview card with the same stacked hero/highlight presentation.
- No database migration, API contract, permission or persistence change is required.
## v1.1 stability hardening — checkpoint inicial (2026-08-02)

- Validación final local del árbol exacto: `npm ci` pasó; comprobación de secretos,
  seguridad y URLs pasó; `npm audit --json` informó 0 vulnerabilidades; lint,
  TypeScript y build pasaron; Vitest pasó 15 archivos/57 pruebas; Playwright pasó
  8/8 pruebas móvil/escritorio, incluidas Axe y referencias visuales; `git diff
  --check` pasó.
- `npm run env:check` detectó correctamente que la credencial
  `SUPABASE_SERVICE_ROLE_KEY` no está disponible en el entorno local real. El script
  pasó con un marcador de validación no secreto, demostrando el contrato sin fingir
  una credencial ni habilitar pruebas remotas.
- La revisión completa contra `staging` no encontró migraciones, secretos, dominios
  Vercel funcionales ni cambios de producto ajenos al objetivo.
- La rama permanece local, sin despliegue ni commits remotos. PRE no se ha modificado
  porque faltan credencial dedicada, pruebas OAuth/fixtures y autorización adicional
  para push, merge y despliegue. `main` y PROD permanecen intactos.
- Segundo bloque implementado: rate limiting reutilizable con respuesta 429,
  `Retry-After` y log seguro en invitaciones, espectadores, sugerencias y dispatch;
  baja push y endpoints 404/410 ahora se eliminan en lugar de quedar deshabilitados.
- El service worker usa caché `smash-lob-v1.1.0-rc.1`, elimina cachés anteriores,
  conserva un shell mínimo/offline y solo activa una revisión cuando el usuario lo
  solicita desde el nuevo aviso de actualización.
- Playwright descubrió y permitió corregir CSP de desarrollo, semántica ARIA de los
  skeletons y contraste del pie público. La ejecución móvil/escritorio terminó con
  8/8 pruebas E2E, Axe y visuales superadas.
- La candidata ya declara `1.1.0-rc.1`, incorpora CI, comprobación local de secretos,
  documentación de operación/aceptación y carga diferida del generador Excel.
- Se añadieron pruebas de autorización para anónimo, outsider entre ligas, jugador,
  espectador, admin, creator y superusuario, sin conceder una membresía de creator
  implícita al superusuario.
- No hay migraciones nuevas ni cambios remotos. OAuth real, flujos persistentes con
  fixtures y las ocho pantallas autenticadas siguen como validaciones manuales de PRE.
- Primer bloque implementado: entorno Auth.js explícito, logging estructurado seguro,
  página de error de autenticación con incidencia, retorno exacto de invitaciones,
  límites de host para URLs, páginas de error/offline y cabeceras de seguridad.
- Se corrigió `localhost:300` a `localhost:3000` y se retiró `AUTH_URL` del ejemplo
  porque la versión/configuración actual no demuestra que sea necesario.
- CSV y Excel neutralizan valores de texto que empiezan por `=`, `+`, `-` o `@`.
- Se añadió infraestructura Vitest, Testing Library, Playwright y Axe, con las primeras
  pruebas de Auth, URLs, clasificación/desempates, exportaciones, acceso anónimo,
  errores, accesibilidad y regresión visual.
- Primer control: lint pasó. TypeScript señaló fixtures incompletos que se corrigieron.
  Vitest quedó sin ejecutar por `spawn EPERM` dentro del sandbox y debe repetirse con
  permiso. La comprobación de entorno detectó `SUPABASE_SERVICE_ROLE_KEY` ausente sin
  imprimir valores; las pruebas reales de PRE siguen bloqueadas por esa credencial.
- Se verificó un árbol de trabajo limpio y se ejecutó `git fetch origin --prune`.
- `staging` coincide con `origin/staging` en `3495324` y declara v1.0.0.
- El árbol de archivos de `staging` es idéntico al de `main`; `main` solo añade el
  commit de merge de la versión estable.
- Se creó `feature/v1.1-stability-hardening` desde `staging`; no se reutilizó v0.19.
- `npm ci` reproducible pasó tras repetirlo fuera del sandbox por un `spawn EPERM`
  local. No se ejecutó ningún `npm audit fix`.
- El inventario y las prioridades están registrados en `docs/V1_1_PLAN.md`.
- No se ha modificado `main`, ningún remoto, ninguna base de datos ni ningún despliegue.

## v1.1 stability hardening — merge local en staging (2026-08-02)

- La credencial de servicio dedicada de PRE está presente en `.env.local` y en la
  variable sensible `SUPABASE_SERVICE_ROLE_KEY` de Vercel Preview para `staging`;
  no se registró ningún valor y Production permaneció intacta.
- `npm run env:check` pasó con las siete variables obligatorias presentes y sus
  valores ocultos.
- La reinstalación reproducible con `npm ci` terminó con código 0. Aunque su resumen
  inicial mostró un aviso de auditoría no reproducible, `npm audit --json` y
  `npm audit --audit-level=high` se repitieron después y confirmaron 0
  vulnerabilidades; no se ejecutó ningún comando de corrección automática.
- `npm run validate` pasó completo: entorno, secretos, seguridad, URLs públicas,
  lint, TypeScript, 15 archivos/57 pruebas Vitest y build de producción.
- `npm run test:e2e` pasó 8/8 pruebas en Chromium móvil y escritorio, incluidas Axe
  y referencias visuales; `git diff --check` también pasó.
- `feature/v1.1-stability-hardening` se subió y se verificó directamente en GitHub
  en `0b960bd41e959c97768dfc7bd599fbb999c0c753`.
- `staging` se sincronizó por avance rápido en `3495324` y recibió localmente el
  merge `515c542`; el merge aún no se ha subido ni desplegado.
- `main`, Production, la etiqueta `v1.0.0`, las bases de datos y las migraciones
  permanecen intactas.
- Siguen pendientes el despliegue y smoke tests de PRE, OAuth Google real, fixtures
  persistentes, pruebas autenticadas, aislamiento entre dos ligas y push real.

## v1.1 stability hardening — actualización de seguridad previa a PRE (2026-08-02)

- La repetición final de `npm ci` sobre el merge local descubrió 5 avisos altos
  nuevos de `npm audit`, todos originados por `brace-expansion` 1.1.16 en la cadena
  de herramientas de ESLint. La promoción se detuvo antes de validar, subir
  `staging` o desplegar PRE.
- El aviso `GHSA-mh99-v99m-4gvg` establece 1.1.17 como primera revisión corregida
  de la rama 1.x. Se actualizó únicamente el override 1.x de 1.1.16 a 1.1.17,
  sin salto mayor de ESLint ni corrección automática de npm.
- La línea base interna exige ahora 1.1.17 o superior para las cuatro copias
  limitadas a herramientas de lint; la copia principal de runtime permanece en
  la revisión corregida 5.0.8.
- `npm install --package-lock-only --ignore-scripts`, `npm run security:check`,
  `npm audit --audit-level=high` y `git diff --check` pasaron; la auditoría
  confirmó 0 vulnerabilidades.
- `staging` sigue solo local y `main`, Production, PRE, las bases de datos y las
  migraciones permanecen intactas. Todos los gates completos deben repetirse
  sobre este nuevo árbol antes de cualquier push.
- Tras crear `b5ae653`, la repetición desde cero terminó correctamente: `npm ci`
  informó 0 vulnerabilidades, `npm audit --audit-level=high` confirmó 0,
  `npm run validate` pasó entorno, secretos, seguridad, URLs, lint, TypeScript,
  15 archivos/57 pruebas y build, y `npm run test:e2e` pasó 8/8 pruebas.
- La candidata corregida queda lista localmente para subir `staging`; el despliegue
  y los smoke tests de PRE siguen pendientes y no se ha tocado `main` ni Production.

## v1.1 stability hardening — deployment y smoke de PRE (2026-08-02)

- `origin/staging` se verificó en
  `e1e9b3efeb17a57b90b243d8ca9371c73a963d7e`; `main` y el commit de la etiqueta
  `v1.0.0` permanecen en `a4abbf06904cc48c9eb614d4b6c4f16214f52aac`.
- Vercel creó `dpl_DPYZ5cj88FfrqDKUuiu1q7JhG2QW` para ese SHA. El deployment quedó
  `Ready` y asignado a `pre.smashandlob.com` y al alias estable de `staging`.
- Las sondas autenticadas mediante la protección de Vercel devolvieron `200` para
  raíz, manifiesto, icono, sesión y proveedores; `401` para cron sin secreto y dos
  rutas de liga protegidas sin sesión; y `404` controlado para códigos sintácticamente
  válidos pero inexistentes de jugador y espectador.
- Los metadatos Google de Auth.js usan
  `https://pre.smashandlob.com/api/auth/signin/google` y
  `https://pre.smashandlob.com/api/auth/callback/google`.
- El manifiesto publicado identifica `Smash & Lob PRE` y el service worker contiene
  el marcador `smash-lob-v1.1.0-rc.1`. La consulta posterior de logs del deployment
  devolvió cero entradas de nivel error.
- Quedan como gates manuales el recorrido OAuth real, la versión visible dentro de
  la aplicación autenticada, los fixtures persistentes, aislamiento entre ligas,
  exportaciones, PWA y push en dispositivo real. No se ha tocado Production.

## v1.1 stability hardening — primer acceso OAuth real en PRE (2026-08-02)

- Una cuenta Google dedicada de pruebas completó el retorno OAuth real a
  `https://pre.smashandlob.com/` y cargó correctamente su liga existente
  `PREP LIGA`.
- La interfaz autenticada mostró `PRE · v1.1.0-rc.1` en la cabecera y
  `Smash & Lob · v1.1.0-rc.1` en Ajustes, cerrando la comprobación visible de
  versión.
- La cuenta no expone controles de administración en Ajustes, por lo que este
  recorrido valida el caso de miembro existente. Siguen pendientes una cuenta
  nueva/organizadora, los retornos exactos desde invitaciones y el resto de
  flujos persistentes manuales.
- Una segunda cuenta Google dedicada completó después su primer acceso a PRE y
  mostró el onboarding inicial para crear o unirse a una liga. Con ello quedan
  verificados los recorridos OAuth real de cuenta existente y cuenta nueva.
- La segunda cuenta no tiene habilitado el permiso de creación de ligas, por lo
  que aún no puede utilizarse como organizadora hasta preparar explícitamente
  ese fixture solo en Supabase PRE.

## v1.1 stability hardening — fixtures persistentes y exportaciones de PRE (2026-08-02)

- Una cuenta dedicada de pruebas con rol `creator` abrió tres ligas existentes de
  PRE, inició `Temporada 2` en `Liga prep pruebas última` y generó sus 14 partidos.
- El primer partido se programó para el 2 de agosto de 2026 a las 23:00 en
  Polideportivo de Lasesarre. Se registró el resultado 6-4, 3-6, 6-2, se editó
  después el tercer set a 6-3 y se verificó que la corrección persistía tras
  recargar y navegar.
- El cambio entre esa liga, con 1 de 14 partidos jugados, y `PREP LIGA`, finalizada
  con 14 de 14, mantuvo separadas sus temporadas, calendarios, resultados y
  clasificaciones. La comprobación de autorización directa con una cuenta ajena a
  la primera liga sigue pendiente.
- Desde una sesión autenticada real se ejecutó la acción Compartir del resumen
  final de `PREP LIGA` sin error de aplicación y se descargaron los archivos Excel
  y CSV de `Temporada 3`.
- El Excel descargado contiene las hojas `Clasificación` (8 jugadores) y
  `Resultados` (14 partidos). El CSV contiene 14 filas y las mismas 12 columnas de
  resultados. La importación estructural, la comparación celda a celda entre ambos
  formatos y la revisión visual de todas las hojas no detectaron diferencias ni
  errores de fórmula.
- Antes de consultar una invitación de fixture con la credencial de servicio, una
  guarda local verificó el destino configurado y detuvo la operación: el
  `NEXT_PUBLIC_SUPABASE_URL` de `.env.local` apunta al proyecto Production
  `szycbwdzestcmimziyey`, no al proyecto PRE `miadjotkucgluwbrgeih`. No se llegó a
  ejecutar ninguna consulta de base de datos. Las comprobaciones con service role
  quedan pausadas hasta alinear en `.env.local` la URL, la clave anónima y la clave
  de servicio del mismo proyecto PRE.
- Las tres variables locales se corrigieron después con sus valores de Preview
  `staging`. La URL apunta a `miadjotkucgluwbrgeih`, la clave pública fue aceptada
  por Auth de Supabase y una lectura controlada con service role devolvió las tres
  ligas de PRE.
- La prueba real de caducidad reveló un fallo bloqueante: después de regenerar la
  invitación de `PREP LIGA`, el enlace anterior seguía resolviendo la liga. La
  función SQL conservaba todas las filas históricas con `revoked_at` nulo y el GET
  público, al usar service role, no aplicaba explícitamente el filtro RLS.
- Se añadió una comprobación compartida de vigencia a la resolución y al canje,
  filtros explícitos de `revoked_at` y la migración
  `20260802233000_revoke_previous_league_invites.sql`, que revoca los códigos
  anteriores de cada liga y hace atómica esa revocación en futuras regeneraciones.
- La migración pasó `supabase db push --linked --dry-run` y el enlace se verificó
  contra PRE. Se creó antes una copia local mínima de las 12 filas de `invites`
  con solo `id`, `league_id` y `revoked_at`; no contiene códigos de invitación.
- La corrección local pasó la prueba focalizada (3/3), lint, TypeScript,
  `npm run validate` completo (16 archivos/60 pruebas y build), Playwright 8/8,
  `npm audit --audit-level=high` con 0 vulnerabilidades y `git diff --check`.
  La migración todavía no se ha aplicado y la corrección aún no está desplegada.
- Los commits `df41351` (código, prueba y migración) y `cfc1a68`
  (documentación/evidencia) se subieron a `origin/staging`, verificado exactamente
  en `cfc1a689adb57d194d7f0a3d56cc5ed01a9ce415`. `main` y `v1.0.0` continúan en
  `a4abbf06904cc48c9eb614d4b6c4f16214f52aac`.
- Vercel desplegó ese commit como `dpl_EFz6DA7qLrHg6YgSC2u26LKqEByA`; alcanzó
  `Ready`, quedó asociado a `pre.smashandlob.com` y el log de build confirmó
  rama `staging`, commit `cfc1a68`, 0 vulnerabilidades, TypeScript y build correctos.
- La aplicación de la migración a Supabase PRE queda pendiente de autorización
  remota explícita. El cálculo previo confirma que revocará 9 invitaciones
  históricas todavía activas y conservará las 3 invitaciones actuales, una por
  cada liga PRE.
- Tras la autorización explícita, la migración
  `20260802233000_revoke_previous_league_invites.sql` se aplicó únicamente en
  Supabase PRE y aparece alineada en el historial local/remoto. La verificación
  posterior confirmó 9 invitaciones revocadas, 3 activas y correspondencia exacta
  entre cada invitación activa y el código actual de su liga.
- Una primera sonda externa con `fetch` pareció devolver snapshots antiguos con
  `x-vercel-cache: HIT`, pero la inspección de la URL final demostró que la
  petición había seguido la redirección de Deployment Protection y estaba
  midiendo la página de acceso de Vercel, no la API de PRE. Se corrige aquí esa
  clasificación para no atribuir a la aplicación una respuesta que no emitió.
- Se añadieron cabeceras reutilizables `private, no-store` para las respuestas GET
  de invitaciones de jugador y espectador, más `revalidate = 0` y una prueba
  específica de las tres capas de caché. La corrección pasó `npm run validate`
  (17 archivos/61 pruebas y build), Playwright 8/8 y `git diff --check`.
- El commit `1224684` se subió a `origin/staging` y Vercel lo desplegó como
  `dpl_BqxEmdc1cajdKCg1HPmP6WWVcZQF`, `Ready` y asociado a
  `pre.smashandlob.com`. Las cabeceras `no-store` se mantienen como defensa en
  profundidad aunque no existía el snapshot obsoleto inicialmente diagnosticado.
- Con autorización explícita se ejecutó la purga CDN a nivel de proyecto. La
  operación vació también la caché CDN de Production, sin cambiar su código ni
  sus datos.
- La repetición autenticada contra PRE confirmó que la invitación revocada y una
  invitación inexistente devuelven `snapshot: null`, mientras que la invitación
  vigente resuelve el snapshot de su liga. Las sondas exactas con autenticación
  de Vercel contra el deployment devolvieron `404`, `Age: 0`,
  `X-Vercel-Cache: MISS` y las tres cabeceras `no-store` tanto para la ruta de
  jugador como para la de espectador. Queda cerrado el gate de invitaciones
  inválidas y caducadas en PRE.
- Una cuenta dedicada de miembro, perteneciente únicamente a `PREP LIGA`, mostró
  solo esa liga en el selector. El acceso directo al partido fixture de la liga
  del organizador devolvió «Partido no encontrado» sin exponer sus datos.
- La respuesta autenticada de `/api/access` para esa misma cuenta contenía
  exclusivamente `PREP LIGA` y no incluía ni la segunda liga ni su partido. Junto
  con el cambio de ligas previamente validado desde la cuenta `creator`, queda
  cerrado el gate de aislamiento cruzado con las dos ligas fixture de PRE.
- La cuenta dedicada de miembro se suspendió temporalmente solo en Supabase PRE.
  La aplicación mostró el bloqueo «Cuenta suspendida» y ocultó los datos de liga.
  La cuenta se reactivó inmediatamente, se limpiaron el motivo y la fecha de
  suspensión y se confirmó que recuperaba el acceso normal a `PREP LIGA`.
- El onboarding ya verificado con la segunda cuenta Google dedicada cubre el caso
  de usuario autenticado sin acceso a ninguna liga. Con ambas evidencias queda
  cerrado el gate de usuario suspendido y usuario sin acceso contra PRE.
- La inspección del workflow público de GitHub detectó que las siete ejecuciones
  de `v1.1 quality` habían fallado en el mismo test de URL, aunque el job
  `browser` de la ejecución más reciente había pasado sus 8/8 pruebas. El runner
  configura intencionadamente `NEXT_PUBLIC_APP_URL=http://localhost:3000`, pero
  `tests/unit/appUrl.test.ts` esperaba siempre el origen de Production al probar
  el rechazo de un host reenviado arbitrario.
- El test se aisló del entorno del runner fijando explícitamente la variante y la
  URL de Production solo durante ese caso y restaurando después las variables.
  La reproducción exacta pasó 4/4; `npm run validate` pasó los 17 archivos/61
  pruebas y el build con las variables del job, y `npm run test:e2e` pasó 8/8.
  Los avisos de deprecación de Node 20 emitidos por acciones de GitHub no fueron
  la causa del fallo.
- El commit correctivo `5bebfb2` se verificó en `origin/staging`. La ejecución
  remota `v1.1 quality #8` terminó en `Success`: el job `quality` pasó en 1m21s
  y el job `browser` pasó en 1m40s con 8/8 pruebas Playwright. El gate remoto
  queda restablecido.
- La prueba física en una PWA Android ya instalada confirmó la actualización
  visible a `v1.1.0-rc.1` y el alta/baja real de push. La baja eliminó exactamente
  un endpoint de Supabase PRE y el alta posterior creó exactamente uno nuevo
  habilitado, sin volver a solicitar un permiso Android que ya estaba concedido.
- El arranque posterior en modo avión reveló un fallo bloqueante: Android restauró
  la pantalla de acceso y Auth.js intentó consultar la sesión sin red, en lugar
  de mostrar la experiencia offline. La prueba anterior solo cubría una nueva
  navegación interceptada por el service worker y no la restauración de una PWA
  ya cargada.
- Se añadió `OfflineGate` antes de `AuthGate` y una vista offline compartida, de
  modo que la pérdida de red oculta el login y los datos privados antes de que
  Auth.js intente cargar. Playwright incorpora ahora un proyecto aislado con
  service workers reales que cubre pérdida de conexión sobre una página cargada,
  relanzamiento/navegación offline y recuperación mediante «Reintentar». La nueva
  prueba reproduce el fallo antes del cambio y pasa después de la corrección.

## v1.1 stability hardening — cobertura autenticada automatizada (2026-08-03)

- Playwright usa una sesión y datos demo exclusivamente locales para recorrer ocho
  pantallas autenticadas representativas en Chromium móvil y escritorio: inicio,
  partidos, clasificación, estadísticas, ajustes, invitación, administración de
  temporada y resumen de temporada. No intervienen cuentas personales, PRE ni
  Production.
- Axe descubrió contrastes insuficientes en las cinco áreas principales y en
  administración, además de campos de edición de jugadores sin nombre accesible.
  Se corrigieron todos los impactos críticos o graves detectados.
- La revisión también descubrió enlaces anidados en tarjetas de partidos. Los
  nombres conservan sus enlaces en contextos normales y se renderizan como texto
  cuando toda la tarjeta ya es un enlace.
- El recorrido Axe pasó en móvil y escritorio. Se generaron 16 referencias
  visuales, se inspeccionaron y la repetición sin actualización pasó en ambos
  proyectos.
- La baja automática de endpoints push caducados se extrajo a una operación
  comprobable. Diez pruebas confirman que HTTP 404/410 elimina exactamente la
  suscripción afectada y que un fallo reintentable HTTP 500 no elimina nada.
- La evidencia visual real ya obtenida en PRE, combinada con Axe y regresión
  visual local sobre las mismas ocho rutas, cierra ese gate sin exigir una nueva
  intervención humana. Sigue pendiente únicamente reproducir en un dispositivo
  real la caducidad 404/410 de un endpoint push y repetir el arranque offline
  físico tras la corrección ya desplegada.
- `npm run validate` pasó entorno, secretos, seguridad, URLs, lint, TypeScript,
  17 archivos/64 pruebas y el build de producción. La primera ejecución conjunta
  de Playwright saturó el compilador de desarrollo al lanzar 12 workers y cuatro
  pruebas públicas agotaron su espera sobre la pantalla de compilación; no fue
  un fallo funcional. Se limitó la concurrencia a cuatro workers locales y dos
  en CI, y la repetición completa pasó 13/13, incluida la PWA con service worker.
  `npm audit --audit-level=high` confirmó 0 vulnerabilidades y
  `git diff --check` pasó.
- Las ejecuciones remotas `v1.1 quality #11` a `#14` aislaron una diferencia
  visual de 126 píxeles exclusivamente en el campo de fecha de administración de
  temporada. La instrumentación temporal situó el cambio dentro del texto de
  `input[type="date"]`: Windows lo dibuja según la configuración regional del
  sistema, independientemente del locale configurado en Playwright.
- La referencia visual conserva el campo y su icono, pero oculta únicamente el
  texto nativo de fecha durante la captura. Se retiró la instrumentación temporal
  una vez localizada la causa. La validación posterior pasó TypeScript, 4/4
  pruebas visuales sin regenerar referencias y 13/13 pruebas E2E en modo CI.
  El commit correctivo `7c78928` quedó verificado exactamente en
  `origin/staging`.
- La ejecución remota `v1.1 quality #15` (`30772604704`) terminó en `Success`:
  tanto el job `quality` como el job `browser` pasaron. Queda resuelto el último
  fallo visual específico del runner de Windows.
- La repetición física posterior en Android, con la PWA instalada y el modo avión
  activo, mostró correctamente la vista «Sin conexión» y la acción «Reintentar».
  Sin embargo, la continuación de la prueba demostró que el gate aún no estaba
  cerrado: al recuperar red la aplicación entraba en el formulario de perfil con
  un error de `fetch`, y un relanzamiento en frío sin red volvía a mostrar el
  login. La primera observación solo validaba la pérdida de conexión sobre una
  página ya abierta.
- La causa de la reconexión era que el evento `online` ocultaba el fallback antes
  de que Auth.js renovase la sesión que había fallado sin red. El fallback queda
  ahora fijado hasta pulsar «Reintentar», acción que realiza una navegación
  completa y crea una sesión limpia.
- El service worker redirige los arranques offline nuevos a `/offline` y sirve esa
  ruta desde caché, evitando depender de la hidratación de la ruta privada o del
  valor inicial de `navigator.onLine`. Dos regresiones con service worker real
  cubren una sesión autenticada durante pérdida/recuperación de red y un
  relanzamiento desde una página cerrada.
- La corrección pasó `npm run validate` completo (17 archivos/64 pruebas y build)
  y 14/14 pruebas Playwright en modo CI. Quedan pendientes el despliegue en PRE y
  la repetición física en Android antes de cerrar el gate.
- Vercel desplegó `bd7d156` únicamente en Preview como
  `dpl_FbbAA1B6RShWsradNCgZc23YcxTa`, `Ready` y asociado a
  `pre.smashandlob.com`; el log confirmó rama `staging`, el commit exacto,
  TypeScript, build y 0 vulnerabilidades.
- GitHub Actions `v1.1 quality #18` pasó `quality`, pero la regresión de sesión
  falló en `browser` porque simulaba el evento offline antes de confirmar que la
  aplicación autenticada había terminado de hidratar. Se añadió una espera
  observable sobre la navegación autenticada; las dos regresiones PWA se
  repitieron cinco veces cada una en modo CI y pasaron 10/10. La corrección
  funcional no cambió.
- La ejecución remota posterior `v1.1 quality #19` terminó en `Success` con
  `quality` y `browser` correctos. El deployment final de esa revisión,
  `dpl_7cxM6CiYA36vvCxJTwZAqAREkYvW`, quedó `Ready`, asociado a PRE y sirviendo
  el service worker con la redirección offline esperada.
- Al instalar esa revisión en la PWA Android, el aviso de nueva versión apareció,
  pero «Actualizar ahora» no produjo una respuesta visible y fue necesario
  refrescar manualmente. El mensaje `SKIP_WAITING` queda ahora unido mediante
  `event.waitUntil` al ciclo de vida del service worker; el botón muestra
  «Actualizando…» y programa una recarga de respaldo a los cuatro segundos si
  Android no emite `controllerchange`.
- Tres pruebas unitarias cubren el ciclo de vida solicitado, la recarga de
  respaldo y el caso de worker ya no disponible. La corrección pasó
  `npm run validate` completo (17 archivos/66 pruebas y build) y 14/14 pruebas
  Playwright en modo CI. Quedan pendientes el despliegue y la repetición física.
- El commit `c9ad883` quedó verificado en `origin/staging`; GitHub Actions
  `v1.1 quality #20` terminó en `Success` con `quality` y `browser` correctos.
  Vercel lo desplegó en Preview como `dpl_7qD9985sfzA7PTxcmgoyFpEqmGYi`,
  `Ready` y asociado a `pre.smashandlob.com`; la sonda autenticada confirmó
  `event.waitUntil(self.skipWaiting())` en el service worker servido.
- La repetición física en Android mostró el aviso, «Actualizar ahora» cambió a
  «Actualizando…» y la PWA se recargó automáticamente. Queda validado en
  dispositivo real el flujo de actualización controlada; sigue pendiente repetir
  el arranque offline en frío y la recuperación de sesión con este worker.

## v1.1.0 — aceptación final y autorización de publicación (2026-08-03)

- La prueba física pendiente de arranque offline en frío se completó correctamente
  en Android con el worker final: al abrir sin conexión apareció `/offline`, no se
  mostró Google Login ni onboarding y, al recuperar Internet y pulsar **Reintentar**,
  se restauró la sesión mediante una navegación completa.
- El alta y la baja push normales ya estaban verificadas físicamente en Android y
  Supabase PRE. La reproducción física de un endpoint caducado `404/410` se omite
  por decisión explícita de aceptación porque el comportamiento está cubierto por
  diez pruebas automatizadas. Se acepta como riesgo residual bajo la posible
  permanencia temporal de una suscripción obsoleta; no afecta a datos de ligas ni a
  suscripciones válidas.
- Con esta decisión quedan cerrados los criterios de aceptación de PRE para la rama
  `feature/v1.1-stability-hardening`. Se autoriza promover `v1.1.0-rc.1` a
  `v1.1.0`, aplicar en PROD únicamente la migración
  `20260802233000_revoke_previous_league_invites.sql`, fusionar `staging` en `main`
  y crear la etiqueta anotada `v1.1.0`.
- La publicación debe detenerse si el dry-run de Supabase detecta una migración
  pendiente distinta de la esperada o si falla cualquier gate local. No se autoriza
  `db reset`, `migration repair`, `npm audit fix`, `push --force` ni la reactivación
  de códigos de invitación antiguos.
- Este checkpoint documenta la aceptación y autorización. La evidencia del commit,
  deployment y smoke tests de Producción se registrará tras ejecutar la publicación.

## v1.2.1 - Candidata descartada por error de concepto (2026-08-03)

- La candidata de PRE introdujo `league_memberships.league_avatar_url` y una imagen distinta por liga. El modelo fue rechazado antes de promoverlo a Producción.
- Se conserva como antecedente técnico la migración aplicada `20260803160000_add_league_avatars_and_restore_unlinked_identity.sql`; no se modifica porque las migraciones aplicadas son inmutables.
- La parte válida de la candidata es `players.link_identity_snapshot` y la restauración de nombre e iniciales al desvincular una cuenta.
- La fotografía no forma parte de la identidad histórica recuperable y debe desaparecer al eliminar el vínculo.

## v1.2.2 - Imagen global e identidad histórica corregidas (2026-08-03)

- Retirada de la interfaz, contratos, tipos, carga de acceso, invitaciones, actividad y duplicación de temporadas toda dependencia del avatar específico por liga.
- La edición de imagen de Ajustes actualiza ahora `app_users.avatar_url`, por lo que la imagen es global para la cuenta y se refleja en todas sus ligas.
- La prioridad actual queda como imagen global de la cuenta vinculada y, si no existe, avatar predeterminado con iniciales. Los jugadores sin cuenta vinculada quedan siempre sin fotografía.
- La instantánea `link_identity_snapshot` conserva únicamente `displayName` y `avatarInitials`; al desvincular se restauran esos datos, se limpia `avatar_url` y vuelve el avatar predeterminado.
- Añadida la migración de avance `20260803203000_remove_league_avatars_and_keep_account_identity.sql`, que elimina `league_avatar_url` de PRE, limpia cualquier fotografía almacenada en `players` y redefine el trigger sin fotografías históricas.
- El futuro editor de avatares queda fuera de esta versión y deberá guardar un avatar global del usuario, independiente de sus ligas y de la fotografía subida.
- Versión incrementada a `v1.2.2`; changelog y caché PWA actualizados.
- Validación disponible en este entorno: los 24 archivos TypeScript/TSX modificados transpilan sin errores de sintaxis; los contratos estructurales de imagen global, API de cuenta, ausencia de escritura de imágenes por jugador, migración y versión pasan; también pasan la línea base de seguridad, las URLs públicas y el escaneo de secretos. `npm ci` no puede completarse aquí porque el registro interno devuelve 404 para `web-push@3.6.7`, por lo que lint, TypeScript completo, Vitest y build quedan como gate obligatorio del comando de aplicación antes de publicar PRE.

## v1.2.3 - Editor de imagen accesible en móvil (2026-08-03)

- El editor de recorte se monta mediante un portal en `document.body`, fuera de los contextos de apilamiento de la aplicación, y utiliza `z-[1000]` para quedar por encima de la navegación inferior y los controles flotantes.
- El diálogo se centra también en pantallas pequeñas, respeta las zonas seguras del dispositivo y limita su altura al viewport dinámico.
- El marco de recorte adapta su tamaño al espacio disponible; los cálculos de arrastre, zoom, rotación y exportación utilizan el tamaño real mostrado.
- El contenido central puede desplazarse de forma independiente y la barra con `Cancelar` y `Usar imagen` permanece fija y accesible.
- Añadida una prueba de contrato visual para impedir regresiones del portal, apilamiento, centrado, tamaño responsive y acciones visibles.
- No se requieren migraciones de Supabase ni cambios de persistencia.
- Validación disponible en este entorno: pasan el escaneo de secretos, la línea base de seguridad, las URLs públicas, `git diff --check`, la transpilación sintáctica de los cinco archivos TypeScript/TSX afectados y los contratos de portal, apilamiento, centrado, tamaño responsive, acciones visibles, versión y caché PWA. `npm ci` queda bloqueado aquí por un 404 del registro interno para `zod-validation-error@4.0.2`; el comando de aplicación mantiene `npm run validate` completo como gate obligatorio antes de publicar PRE.

## Avatar Lab DEMO 0.1 - experimento aislado de mundos de avatar (2026-08-03)

- Rama experimental independiente: `feature/avatar-worlds-demo`, creada desde el estado `staging` aprobado en `v1.2.3`. No modifica `main`, no añade migraciones y mantiene la versión global de la aplicación en `1.2.3`.
- Añadida la ruta PRE-only `/experimental/avatar-lab`, ausente de la navegación normal, con `noindex` y una rama propia en `AppRouteBoundary` que conserva autenticación y perfil completo, pero evita cargar proveedores de liga, partidos, temporada, MVP y `AppShell`.
- Implementada una única `AvatarRecipe` neutral y versionada, separada de `AvatarWorldPreference`. El espectador puede usar `pixel_chibi`; `chibi_illustrated` queda declarado, visible como «Próximamente» y sin renderer ni assets provisionales.
- El renderer Pixel Chibi utiliza SVG modular de coordenadas enteras sobre una plantilla lógica `192 × 240`, `shape-rendering="crispEdges"`, `image-rendering: pixelated`, paleta limitada y capas independientes para fondo, cuerpo, cabeza y pala. La referencia canónica queda guardada solo en documentación y no se usa como imagen plana.
- La orientación zurda refleja la geometría alrededor de x=96, pero la letra B de la pala se vuelve a dibujar fuera del grupo reflejado. Manga y muñequera se resuelven mediante lados relativos `dominant`/`non_dominant`.
- La DEMO incluye dos tonos de piel; tres estados de pelo; tres estados de barba; ojos y cejas configurables; gorra/cinta excluyentes; colores primario y secundario de camiseta; dos pantalones; manga, muñequera, calcetines, zapatillas y dos palas; además de aleatorización, restablecimiento, depuración y persistencia local versionada.
- Se añadieron manifest, paletas, esquemas portables, catálogos por categoría, guía de estilo, plantilla maestra, reglas de compatibilidad, arquitectura, alcance y roadmap bajo `public/avatars` y `docs/avatars`.
- Validación ejecutada en este entorno: `npm run avatars:check` pasa con 26 primitivas modulares; 28 archivos TS/TSX transpilan sin errores sintácticos; el typecheck estricto aislado de Avatar Lab pasa; las comprobaciones de ejecución de receta, normalización, aleatorización, persistencia y render diestro/zurdo pasan; todos los JSON cargan correctamente; la vista canónica se rasterizó desde el renderer real y se inspeccionó; `git diff --check` pasa.
- `npm ci` y, por tanto, `npm run validate` completo no pueden ejecutarse en este entorno porque el registro interno devuelve 404 para `zod-validation-error@4.0.2`. El script de entrega mantiene `npm ci`, `npm run avatars:check` y `npm run validate` como gates obligatorios antes del commit, push y publicación exclusiva en PRE.

## v1.2.4 - Laboratorio móvil de avatares limitado a PRE (2026-08-05)

- La rama experimental `feature/avatar-worlds-demo` se reduce a dos opciones viables: DiceBear Big Smile y Notion Avatar.
- Se eliminan Ready Player Me, Pacovqzz/Avatune, el prototipo Pixel Chibi y todos sus endpoints, recursos, modelos, documentación y pruebas huérfanas.
- Ajustes incorpora un acceso para usuarios autenticados; toda la ruta `/experimental/avatar-lab` permanece protegida por el layout PRE-only, `noindex` y el `AppShell` normal.
- Ambos editores adoptan componentes, anchura, tarjetas, navegación, tamaños táctiles y zonas seguras coherentes con la PWA móvil.
- Las recetas se conservan solo en `localStorage`; no existe integración con perfil, jugadores, Supabase ni migraciones.
- Notion Avatar se compone mediante un endpoint local cacheado a partir de los SVG abiertos del proyecto oficial, evitando la dependencia `react-notion-avatar` y su árbol de paquetes obsoleto.
- La versión visible, el changelog y la caché PWA avanzan a `v1.2.4`.
- La entrega debe superar el validador específico, Vitest focalizado, lint, TypeScript, suite completa y build antes de cualquier commit o publicación en PRE.

## v1.2.5 - Corrección de la línea base para publicar Avatar Lab en PRE (2026-08-05)

- Se mantiene el alcance funcional de v1.2.4: únicamente DiceBear Big Smile y Notion Avatar, sin escritura de perfil ni Supabase.
- La poda de dependencias reubicó tres copias heredadas de `brace-expansion@1.1.17` bajo plugins concretos de ESLint.
- El validador permite solo esas rutas exactas y exige que el lockfile las marque como dependencias de desarrollo; no se amplía la autorización al runtime.
- La copia principal de `brace-expansion` sigue obligada a `5.0.8` o superior.
- La versión visible, el changelog y la caché PWA avanzan a `v1.2.5`.
- Todos los gates se ejecutan antes del commit y de nuevo sobre el merge candidato a `staging`.

## v1.2.6 - Compatibilidad React del laboratorio de avatares (2026-08-05)

- Se eliminan las actualizaciones síncronas de estado ejecutadas directamente desde efectos en Big Smile y Notion Avatar.
- La restauración desde `localStorage` se realiza mediante tareas cancelables y las vistas previas derivan su estado de la URL o receta activa.
- El paginado de Notion se reinicia desde la acción de cambio de categoría.
- La versión visible, el changelog y la caché PWA avanzan a `v1.2.6`.
- No hay migraciones de Supabase ni cambios en datos persistidos.


## v1.2.7 - Limpieza de tipos generados y compatibilidad ES2017 (2026-08-05)

- La validación elimina `.next` y `tsconfig.tsbuildinfo` antes del typecheck para evitar referencias generadas a rutas experimentales ya retiradas.
- El renderer de Notion sustituye el flag `s` de expresión regular por un patrón multilínea compatible con el objetivo ES2017 del proyecto.
- Se mantiene el alcance de Avatar Lab: únicamente DiceBear Big Smile y Notion Avatar, limitado a PRE y sin persistencia en perfiles o Supabase.
- La versión visible, el changelog y la caché PWA avanzan a `v1.2.7`.
- No hay migraciones de Supabase ni cambios en datos persistidos.

## v1.9.0 - Resumen de jornada (2026-08-16)

- Nueva rama funcional prevista: `feature/v1.9.0-product-expansion`, basada en `main` v1.8.23 y destinada a agrupar las mejoras de producto posteriores al bloque de CHAT.
- `CALENDARIO` convierte la cabecera completa de cada jornada con partidos en un acceso pulsable a `/round/[id]`; no se añade un chevron ni una ruta duplicada.
- `/round/[id]` se redefine como `Resumen · Jornada X` y muestra estado/progreso, partidos, sets y juegos disputados, resultados compactos enlazados al detalle del partido, MVP y clasificación histórica.
- Con MVP por `voting` se muestran los MVP de cada partido; con `automatic` o `automatic_advanced` se muestra el MVP de jornada; `none` oculta el bloque.
- Mientras la jornada no está completa, la clasificación se etiqueta como provisional y los destacados definitivos permanecen bloqueados. Al completarse se calculan cambio de líder, mayor subida, partido más igualado y/o mejor racha según los datos disponibles.
- La clasificación histórica se calcula ignorando resultados de jornadas posteriores y muestra movimiento respecto a la clasificación anterior.
- El exportable de jornada y `Compartir resumen` quedan fuera de v1.9.0 inicial y son el siguiente desarrollo previsto.
- Se documentan en `docs/V1_9_PRODUCT_EXPANSION.md` los frentes posteriores ya acordados para valoración: nivel global orientado a amistosos, auditoría/expansión de estadísticas globales de parejas, sustituciones, cierre de temporada y panel de salud de administración.
- No hay cambios de API, Supabase ni migraciones en esta iteración.

## v1.9.1 - Pulido del Resumen de jornada (2026-08-16)

- El panel superior de la jornada usa `AppCard accentStrip` sin padding exterior para que la franja de acento quede anclada al borde superior; el titular deja el progreso `X/X partidos` exclusivamente en las métricas.
- `RESULTADOS` reutiliza `MatchDetailPairingPanel`, exactamente el componente del detalle de PARTIDO, con `linkPlayers={false}` para que el panel completo siga enlazando al partido sin enlaces anidados.
- Los destacados que representan un partido incorporan `matchId` y reutilizan el mismo `MatchDetailPairingPanel`; el resto de destacados mantiene su tarjeta textual.
- El contexto bajo `Resumen · Jornada X` vuelve a reflejar el estado real de la temporada y no el estado de la jornada.
- Se elimina la etiqueta aislada `JX` de la cabecera de clasificación.
- Se incorpora al pie el botón `Compartir resumen de jornada` con el mismo tratamiento primario del resumen de temporada. La generación/compartición de la imagen continúa pendiente para el siguiente desarrollo.
- No hay cambios de API, Supabase ni migraciones.

## v1.9.2 - Destacados editoriales en Resumen de jornada (2026-08-16)

- `RESULTADOS` conserva el `MatchDetailPairingPanel` completo como representación canónica de los partidos.
- `LO MÁS DESTACADO` deja de repetir ese panel: los destacados ligados a un partido usan una tarjeta editorial compacta con motivo, explicación, parejas, marcador global, sets y acceso al detalle.
- `Partido más igualado` expresa por qué fue igualado mediante la diferencia total de juegos, en lugar de volver a usar los nombres de las parejas como titular.
- Los destacados no ligados a partidos mantienen la misma jerarquía de etiqueta, titular y detalle para que la sección funcione como lectura editorial de la jornada.
- El exportable de Resumen de Jornada continúa pendiente como siguiente desarrollo.
- No hay cambios de API, Supabase ni migraciones.

## v1.9.3 - Comparaciones directas en destacados de jornada (2026-08-16)

- `LO MÁS DESTACADO` demuestra el motivo de cada tarjeta mediante una comparación directa, en lugar de añadir una segunda descripción genérica.
- `Partido más igualado` mantiene el marcador global de sets y enfrenta los juegos totales de ambas parejas, mostrando además la diferencia que origina el destacado.
- `Nuevo líder` y `Mayor subida` muestran posición anterior frente a posición actual; `En racha` compara la racha previa con la actual.
- Se elimina el texto `Ver partido`; la tarjeta completa continúa enlazando al detalle cuando el destacado corresponde a un encuentro.
- Se converge el contrato legacy de v1.9.1 al `matchId` real usado desde v1.9.2.
- No hay cambios de API, Supabase ni migraciones.

## v1.9.4 - Tie-break decisivo como destacado de jornada (2026-08-16)

- `LO MÁS DESTACADO` detecta partidos finalizados cuyo tercer set termina exactamente `7-6` o `6-7` y crea el momento `Decidido en tie-break`.
- El destacado mantiene el marcador global del encuentro y compara de forma directa el tercer set con `Tie-break` como dato central.
- Los encuentros ya destacados por tie-break se excluyen del cálculo de `Partido más igualado` para evitar duplicar el mismo partido en la sección.
- La selección de destacados reserva espacio suficiente para conservar los tie-breaks decisivos aunque coincidan con movimientos relevantes de clasificación.
- No hay cambios de API, Supabase ni migraciones.

## v1.9.5 - Borrado estable al registrar resultado (2026-08-16)

- `MatchResultForm` mantiene el avance automático al siguiente casillero únicamente cuando se introduce un valor válido.
- Borrar un marcador ya no mueve el foco al casillero anterior, tanto si se elimina un valor existente como si se pulsa Backspace/Delete sobre un campo vacío.
- El test histórico de destacados v1.9.2 deja de reutilizar un partido con tercer set `7-6`, evitando que choque con la clasificación `Decidido en tie-break` incorporada en v1.9.4.
- No hay cambios de API, Supabase ni migraciones.

## v1.9.6 - Resumen conectado y destacados simples compactos (2026-08-16)

- El título `Jornada X` de PARTIDO pasa a ser un enlace directo a `/round/X`, reutilizando la ficha `Resumen · Jornada X`.
- `LO MÁS DESTACADO` compacta en una sola fila los momentos sin partido (`Nuevo líder`, `Mayor subida` y `En racha`) y conserva protagonista + comparación directa.
- Los momentos ligados a un encuentro (`Partido más igualado` y `Decidido en tie-break`) mantienen el formato detallado con parejas, marcador y comparación porque necesitan más contexto.
- No hay cambios de API, Supabase ni migraciones.

## v1.9.7 - Jerarquía visual de destacados simples (2026-08-16)

- `NUEVO LÍDER`, `MAYOR SUBIDA` y `EN RACHA` recuperan su etiqueta como título independiente en la primera línea de cada tarjeta.
- La segunda línea compacta únicamente el contenido: protagonista a la izquierda y comparación directa a la derecha (`2.º → 1.º`, `3 victorias → 4 victorias`, etc.).
- `PARTIDO MÁS IGUALADO` y `DECIDIDO EN TIE-BREAK` mantienen intacto el formato detallado con parejas, marcador y comparación.
- No hay cambios de cálculo, API, Supabase ni migraciones.

## v1.9.8 - Pulido de PWA, CHAT y destacados (2026-08-16)

- El aviso de instalación PWA se limita a HOME, a sesiones autenticadas y a cuentas con una pertenencia a liga ya registrada; invitaciones, acceso inicial y rutas públicas dejan de mostrarlo.
- El resumen fijado de reserva de CHAT usa fecha numérica `DD/MM/YYYY` manteniendo la hora para reducir anchura.
- El `mt-px` entre mensajes consecutivos ya era común; la diferencia visual se corrige dando a los enviados la misma geometría de borde que los recibidos mediante borde transparente con `background-clip`, sin modificar el margen correcto de entrada.
- `EN RACHA` deja de mostrar la racha anterior y conserva únicamente las victorias consecutivas actuales.
- Los destacados asociados a un resultado muestran los dos nombres de cada pareja en líneas separadas y eliminan `/`, manteniendo marcador y comparación.
- `MatchReservationConfirmation` memoriza los arrays de ubicaciones aprobadas/rechazadas y elimina los dos warnings `react-hooks/exhaustive-deps`.
- No hay cambios de API, Supabase ni migraciones.

## Product evolution v1.9.9 (2026-08-16)

- Resumen de Jornada incorpora exportable PNG compartible con resultados, MVP, destacados y clasificación.
- Reutiliza el lenguaje visual de los exportables de temporada y mantiene fallback de descarga cuando Web Share de archivos no está disponible.
- Sin cambios de API, Supabase ni migraciones.


## Product evolution v1.10.0 (2026-08-16)

- Imagen opcional en onboarding de perfil, conservando almacenamiento global y fallback de Google.
- Override competitivo de imagen por jugador, exclusivo de superadmin y separado de identidad de cuenta.
- Fecha/hora programada de inicio de temporada con countdown, activación server-side y bloqueo competitivo preinicio.
- Centro de Difusión para admins con cinco exportables PNG 4:5 basados en datos reales.
- Nueva migración aditiva `20260816173000_add_competitive_player_images_and_scheduled_seasons.sql`.
- Scope excluido a propósito: pulido del PNG de Jornada, nivel global y estadísticas de parejas.

## Product evolution v1.10.2 — Media Kit visual rework (2026-08-17, en curso)

- Creada la rama local `codex/media-kit-visual-rework` desde `feature/v1.9.0-product-expansion`; `main`, Production y la etiqueta `v1.0.0` permanecen intactos.
- Aplicado y conservado `stash@{0}` (`WIP Media Kit v1.10.2 untracked`), que recupera dos recursos visuales de `opening_day_premium_01` y dos tests focalizados.
- El trabajo queda limitado a local: sin push, PRE, merge ni cambios remotos.
- Checkpoint inicial completado: implementación recuperada auditada y plantilla principal rehecha contra la referencia obligatoria.
- Implementada `opening_day_premium_01` como cartel dinámico 1080×1350 sobre la base artística recuperada: fondo carbón, máscara de acento tintable, viñeta, partículas, geometría premium, titular metálico, fecha enmarcada, metadatos y firma inferior.
- `Centro de difusión` incorpora editor completo, logo de liga con override temporal, seis acentos, vista previa del PNG real y acciones separadas para compartir o descargar.
- Reglas, Inscripciones, Próxima jornada, Inicio de temporada y Cuenta atrás derivan ahora de la misma familia Premium 01.
- Primera iteración visual revisada en `http://localhost:3000/admin/media-kit`; corregido el layout estrecho detectado en navegador.
- Validación focalizada: `npx tsc --noEmit` correcto y 11/11 tests de Media Kit correctos.
- Validación final local: `npm run lint`, `npx tsc --noEmit`, `npm run build`, 11/11 tests focalizados y `git diff --check` correctos.
- La app queda arrancada en `http://localhost:3000`; no se ha realizado push, merge, PRE ni ninguna otra operación remota.
- La segunda recarga del navegador quedó bloqueada por el onboarding de la sesión local con `app_user_lookup_failed`; no se rellenó el perfil ni se forzó acceso con datos personales. La inspección visual del PNG se completó antes de ese bloqueo.
- Corrección posterior: la firma inferior deja de ser editable y reutiliza el patrón de los exportables de temporada con el icono de la app, `CREADO CON` y `SMASH & LOB`.
- El titular principal incorpora cuatro tratamientos seleccionables (`Impacto`, `Condensada`, `Editorial` y `Atlética`) con familia, proporción, tamaño, contorno y, cuando corresponde, inclinación propias en el Canvas exportado.
- La elección tipográfica se aplica también a las piezas equivalentes de la familia Premium 01.
- Revisión visual completada en navegador para `Impacto`, `Condensada`, `Editorial` y `Atlética`; las cuatro variantes mantienen jerarquía, encaje y legibilidad, y el nuevo pie fijo aparece integrado sin desbordes ni errores de consola.
- Validación de la corrección: `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` y 13/13 tests focalizados correctos.
- Nueva iteración local: el catálogo de piezas pasa a funcionar como `Presets` y se sitúa antes de la composición; cada preset carga sus textos en una única `Personalización y vista previa`, desde la que se comparte o descarga el resultado.
- La composición identifica el preset activo, permite restablecerlo y renombra los seis campos según su función visual (`Titular`, `Subtítulo`, `Bloque destacado`, `Dato central` y etiquetas laterales) en vez de asumir siempre Jornada de apertura.
- El color de acento conserva la paleta curada y añade una opción `Personalizado` desplegable con selector visual y código hexadecimal validado.
- La observación incompleta del usuario sobre borrar texto queda pendiente de concretar; no se ha inferido ni aplicado ningún comportamiento adicional.
- A petición posterior, `Centro de difusión` abandona la sucesión de tarjetas grandes: los seis presets se compactan en una barra, mientras vista previa, compartir/descargar y personalización conviven en un único espacio de trabajo a dos columnas desde anchura tablet.
- Botones, campos, variantes tipográficas, acentos y control de logo reducen altura y espaciado; con el color personalizado cerrado, el conjunto está diseñado para quedar visible de un solo vistazo en escritorio.
- El preset conserva el nombre corto `Apertura` en la biblioteca, mientras su composición inicial recupera el titular `Jornada de apertura` y genera el subtítulo `Un día, X partido(s), el mejor comienzo` con el número real de encuentros de la primera jornada y concordancia singular/plural.
- La revisión en la anchura real del shell de la app (columna central estrecha) corrige el primer intento que desbordaba: cartel a 155 px, seis presets abreviados en una fila y controles en una columna lateral flexible de 158 px.
- Tipografía pasa a selector compacto, acento y logo comparten bloque, y las acciones quedan bajo el cartel; el estado cerrado completo se ve antes de la navegación inferior en la captura final.
- Interacción real verificada: `Altas` carga todos sus textos en la composición activa y `Color personalizado` acepta `#22AACC`, actualizando tanto selector como borrador hexadecimal.
- Validación final de esta iteración: `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` y 16/16 tests focalizados correctos.
- Ajuste móvil posterior: se descarta la división lateral de preview e inputs; personalización ocupa primero todo el ancho y la vista previa crece a 285 px debajo, con compartir/PNG unidos al cartel.
- La capa `opening-day-premium-01-accent.png` se reconstruye desde el fondo actual: 1080×1350, RGBA real y alfa derivado de la luminosidad del propio fondo, por lo que focos, líneas, pala, pelota y polvo quedan alineados al píxel y el centro oscuro permanece transparente.
- Dos propuestas del generador visual se descartaron por incumplir dimensiones y canal alfa; solo se aprovechó su dirección visual y el recurso final se normalizó de forma determinista contra `opening-day-premium-01-base.webp`.
- Rediseño móvil integral de `Centro de difusión`: los presets pasan a una biblioteca horizontal táctil y el espacio de trabajo separa `Vista previa` y `Personalizar` en dos modos, evitando comprimir simultáneamente cartel y formularios.
- Seleccionar un preset carga sus datos y vuelve automáticamente a la preview; el modo de edición ofrece campos a ancho cómodo, tipografía, acentos y logo agrupados, más un único CTA para regresar al cartel.
- Primera versión de `Premium 02 · Formato`: nuevo preset informativo 4:5 con título medio, introducción, filas numeradas y cierre, conservando fondo carbón, acento configurable, logo y firma fija de Smash & Lob.
- El preset explica clasificación individual, parejas diferentes, repetición mínima de rivales y calendario automático; carga cuatro filas de partida.
- El editor específico de Premium 02 admite entre 3 y 5 filas, edición de titular/descripción, reordenación, eliminación y alta de bloques; el Canvas adapta altura, espaciado y densidad al número de filas.
- Ajuste de la plantilla informativa: el título baja 35 px, desaparece toda etiqueta visible `Premium 02` del PNG y de la biblioteca, y las filas dejan de estar numeradas.
- Cada fila admite ahora un icono de imagen opcional con controles para cargar, cambiar o quitar; sin icono, el diseño utiliza una barra vertical del color de acento como marcador neutro.
- Corrección de jerarquía en Premium 01: los titulares de dos líneas reducen tamaño y separación vertical, mientras el subtítulo baja y gana aire; se elimina el solapamiento visible en presets como Reglas, Inicio y Cuenta atrás.
- El preset `Inscripciones` se redefine como aviso de cuota o fianza: prioriza reserva de plaza, importe por jugador y pago único, reutilizando el importe real configurado para la temporada cuando está disponible.
- Premium 01 y Premium 02 comparten una cabecera de temporada editable, inicializada con la temporada activa pero independiente de los presets para preparar piezas de una temporada futura.
- Primera versión de `Jornada` con diseño Premium 03: genera una pieza 4:5 por enfrentamiento, permite cargar cualquier partido de la jornada con jugadores, fecha, hora y sede reales, y mantiene todos esos campos editables antes de compartir o descargar.
- Pulido de Premium 03: nombres de ambas parejas centrados ópticamente y marcadores verticales desplazados al interior. Las sedes cargadas desde partidos se normalizan en todos los presets como `Municipio · Nombre corto`, evitando mostrar el JSON persistido del selector de ubicación.
- El formato automático de sede queda diferenciado por plantilla: Premium 01 usa `Municipio Nombre corto` sin separador, Premium 03 conserva `Municipio · Nombre corto` y Premium 02 no incorpora ubicación por defecto.
- El preset `Reglas` migra a Premium 02 y carga filas editables con la configuración real: obligatoriedad de tres sets, reparto de puntos por sets, desempate por diferencia de juegos y juegos a favor, y sistema MVP solo cuando está activo.
- Nuevo preset informativo `En pista` sobre Premium 02: coloca primero un calentamiento guiado de 10/15 minutos y explica después la variante STAR Point de la liga y el tie-break mediante cuándo se juega, cómo se gana y cómo rota el saque; se descarta el bloque de cambios de lado y resultado final.
- `Inscripción` fija su composición inicial en `Cuota de inscripción`, `Para gastos derivados de la liga`, `20€`, `Fianza`, `Pago único` y `Por jugador`; los campos se precargan con capitalización normal y el cartel mantiene el tratamiento visual en mayúsculas de Premium 01.
- El control de icono de cada fila informativa abre ahora una galería de 25 SVG precargados y coloreados con el acento activo; la carga de una imagen personalizada permanece disponible como acción independiente dentro del selector.
- Compilación local de esta iteración completada correctamente con `npm run build`; no se ejecutan comprobaciones adicionales durante esta fase de ajuste visual.
- El fondo compartido por las plantillas Premium se sustituye de forma reversible por una variante 1080×1350 que prolonga la textura de la pista hasta el borde inferior y elimina la franja negra visible; la máscara de acento se regenera con las mismas dimensiones a partir del nuevo fondo.
- La variante de fondo extendida queda integrada y compila correctamente con `npm run build`; los recursos anteriores se conservan sin sobrescribir como respaldo durante la prueba visual.
- Corrección posterior del render: se detecta que los degradados del Canvas volvían a ocultar la pista extendida al eliminar casi toda la luminosidad inferior; el fondo recupera progresivamente su textura solo desde `y=1040` hasta el borde, manteniendo intacto el oscurecimiento del área tipográfica.
- La corrección compila con `npm run build` y el servidor local se deja activo en `http://localhost:3000` para revisar la preview y la descarga contra el bundle actualizado.
- Se elimina la línea horizontal detectada en la recuperación del suelo: la máscara `destination-in` pasa a cubrir todo el lienzo, conservando alfa cero sobre el inicio del degradado en vez de dejar opaca la mitad superior del buffer auxiliar.
- La corrección de continuidad compila con `npm run build` y el servidor local permanece activo en el puerto 3000 para la siguiente revisión visual.
- La inspección de la preview real de `Apertura` confirma que la máscara PNG de acento no contiene una discontinuidad horizontal; el corte procedía del `floorGlow` del Canvas, que terminaba en `y=1260` conservando su intensidad máxima. La capa pasa a recorrer hasta el borde y desvanece de nuevo a alfa cero.
- El nuevo desvanecido de acento compila con `npm run build` y la preview local de `Apertura` se recarga contra el bundle actualizado.
- La apariencia de dispositivos sin preferencias guardadas cambia a `Claro + Colorido + Grafito` tanto en el script previo a hidratación como en `ThemeProvider`; las elecciones existentes en `localStorage` se siguen respetando.
- HOME unifica la línea de temporada simple y el selector para varias temporadas mediante `SeasonContextLine`: comparten contenido, tipografía, color, altura y posición, mientras la variante interactiva conserva semántica de botón y foco accesible sin indicios visuales en reposo.
- La iteración de apariencia predeterminada y cabecera de temporada compila correctamente con `npm run build`; no se ejecutan comprobaciones adicionales durante esta fase visual.
- Premium 02 y Premium 03 ya reutilizaban el fondo artístico común, pero sus velos negros al 78 % y 72 % lo ocultaban casi por completo; se reducen al 58 % y 54 % para recuperar de forma sutil focos, pista, pala y textura sin comprometer la lectura.
- Los presets informativos cargan iconos SVG de partida editables: Formato usa gráfico, dos jugadores, rayo y calendario; Reglas usa repetición, gráfico, balanza y trofeo cuando hay MVP; En pista usa pala, estrella, objetivo y rotación.
- Revisión local en navegador: Premium 02 y Premium 03 regeneran sus previews sin errores; el editor muestra 4 iconos en Formato, 3 en Reglas para la temporada actual sin MVP y 4 en En pista. La iteración compila correctamente con `npm run build`.
- Todas las imágenes del Media Kit usan ahora el icono oficial de Smash & Lob como logo de cabecera cuando la liga no tiene uno definido; un logo propio u override sigue teniendo prioridad y la firma inferior no cambia.
- El fallback de logo compila correctamente con `npm run build`; no se ejecutan comprobaciones adicionales en esta fase visual.
- Premium 02 y Premium 03 separan la cabecera lateral del marco decorativo: sus dos esquinas superiores bajan de `y=72` a `y=148`, justo después del logo, nombre de liga y temporada. Premium 01 conserva el marco original para su cabecera centrada.
- La variante de marco por composición compila correctamente con `npm run build`; no se ejecutan comprobaciones adicionales durante esta fase visual.
### Ajustes Media Kit — tipografías y preset En pista (2026-08-17)

- Premium 01 usa `Editorial` como tipografía inicial y también como fallback del exportador.
- El selector amplía sus opciones con cuatro estilos adicionales: `Monumental`, `Geométrica`, `Didona` y `Técnica`.
- El preset `En pista` cambia su titular precargado a `DURANTE EL PARTIDO`.
- Validación solicitada: `npm run build` completado correctamente (compilación, TypeScript y generación estática).

### Media Kit — cinco presets y Premium 04/05 (2026-08-17)

- Se incorporan los presets `Resultados`, `Clasificación`, `MVP`, `Próxima jornada` y `Final de temporada`, alimentados inicialmente con datos de la temporada activa y editables antes de exportar.
- `Premium 04 · Marcador` introduce una composición de filas densas para marcadores y top 5, con jerarquía específica para posiciones y cifras.
- `Premium 05 · Protagonista` introduce una composición editorial con fotografía central para MVP y campeón, nombre destacado y hasta tres datos o puestos de apoyo.
- `Próxima jornada` reutiliza Premium 01 para priorizar fecha, hora, sede y número de jornada.
- La biblioteca, los editores y los exportadores aceptan las cinco nuevas clases de pieza; Premium 05 permite sustituir o quitar temporalmente la fotografía protagonista.
- Validación solicitada: `npm run build` completado correctamente con TypeScript y generación estática.

### Media Kit — Premium 06 para Resultados (2026-08-18)

- `Resultados` deja de compartir Premium 04 con `Clasificación`; Premium 04 queda reservado al ranking y su top 5.
- Se crea `Premium 06 · Resultados`, inspirado en la lectura de la pantalla PARTIDO: nombres apilados de cada pareja a la izquierda, juegos de cada set en columnas y sets ganados en un bloque de mayor peso visual.
- El preset carga los partidos terminados de la última jornada disponible, usa un mínimo de 2 tarjetas y admite hasta 4 para temporadas de 16 jugadores.
- El personalizador permite editar los cuatro nombres, los juegos de cada set, añadir o quitar partidos entre 2 y 4, y recalcula automáticamente los sets ganados.
- Validación solicitada: `npm run build` completado correctamente con la nueva plantilla, editor y tipos de datos de resultados.
- RESULTADOS incorpora un selector de jornada completa; se inicializa con la última jornada cerrada y, al cambiarla, recarga parejas, juegos y sets antes de permitir el retoque manual.
- Personalización incorpora un selector común de `Temporada origen`: al cambiarlo, el preset activo vuelve a cargar los datos reales de esa temporada, mientras la cabecera superior permanece editable e independiente.
- Validación solicitada: `npm run build` completado correctamente con ambos selectores y la recarga de presets por temporada.
- Preparación de publicación: el Media Kit adopta los tokens tipográficos semánticos globales y elimina la descripción genérica de cabecera detectada por `typography:check`.
- El presupuesto global de fuente se actualiza de 102.300 a 104.000 líneas para registrar las nuevas plantillas y editores, manteniendo sin cambios los límites de clientes, páginas cliente, rutas API y archivos críticos; el árbol actual ocupa 103.599 líneas.

### Preparación de publicación Media Kit (2026-08-18)

- Playwright usa un servidor dedicado en `127.0.0.1:3100` y un `distDir` independiente (`.next-playwright`), por lo que ya no puede reutilizar accidentalmente una sesión local del puerto 3000 ni interferir con ella.
- Las pruebas visuales fijan el reloj en una fecha conocida y actualizan las versiones vigentes de los tutoriales de HOME, Ajustes y Administración de temporada; las capturas dejan de depender del día de ejecución o de overlays caducados.
- El grafito claro oscurece sus tonos secundarios para conservar la nueva apariencia predeterminada y cumplir contraste WCAG AA también en las pantallas públicas.
- Referencias visuales revisadas y actualizadas para HOME, Calendario, Administración de temporada y las pantallas públicas afectadas por el nuevo grafito predeterminado.
- Puerta local completa superada con `npm run release:check`: 146 archivos / 480 tests unitarios e integración, 56 tests Playwright, build de producción dentro de presupuesto y `npm audit --omit=dev --audit-level=high` con 0 vulnerabilidades.
- No hay migraciones nuevas ni cambios sobre migraciones ya aplicadas; el siguiente paso autorizado es publicar el mismo estado en `staging`/PRE y, tras verificarlo, promocionarlo a `main`/Producción.

### Corrección del aislamiento de Avatar Lab en Producción (2026-08-18)

- El primer smoke de Producción detectó que el layout ejecutaba `notFound()` pero Next.js conservaba un estado HTTP 200 al resolver el 404 dentro de una respuesta en streaming; la API experimental sí devolvía 404 correctamente.
- `src/proxy.ts` intercepta ahora exclusivamente `/experimental/avatar-lab/:path*` antes del render: continúa en PRE y local, y devuelve un 404 HTTP real con `no-store` en cualquier otro host, incluido Producción.
- El layout y las APIs conservan sus comprobaciones propias como defensa adicional; el contrato de assets y 13 tests focalizados de acceso, aislamiento y proxy pasan, junto con TypeScript.
- La republicación queda preparada para desplegar primero en `staging`/PRE y verificar después `main`/Producción.
- El preset `Apertura` precarga ahora su fecha únicamente como día y mes; el año se omite solo en esta pieza y el formato completo de `Jornada` y los demás presets no cambia.
- Puerta local final superada con `npm run release:check`: 147 archivos / 482 tests unitarios e integración, 56 tests Playwright, build de producción dentro de presupuesto y auditoría runtime con 0 vulnerabilidades.
- Publicación de aplicación verificada en PRE: `staging` `f3dce430b093bdbac043b88e4864d1f0bacf80e7`, despliegue Vercel `dpl_8YdcQKSyCYVhNqKwzEbFxjnpYmmz` READY y alias `pre.smashandlob.com`; el smoke autenticado confirma health v1.10.8/pre, página experimental disponible y API protegida con 401. El smoke público conserva el 302 previsto por la protección SSO de Vercel.
- Publicación de aplicación verificada en Producción: `main` `395f863bfdb295d7cbad404c111952102253a591`, despliegue Vercel `dpl_6q7GdrxqWQfCtKzZgE59HYtnebQb` READY y alias `smashandlob.com`; `npm run smoke:prod` confirma health v1.10.8/prod, portada disponible y Avatar Lab bloqueado con 404 tanto en página como en API.

### Media Kit — acentos de logo y preset Inicio (2026-08-18)

- La paleta curada incorpora `#53B401` como color de acento frecuente.
- Cuando existe un logo de liga o se carga uno temporal, el editor lo analiza automáticamente en el navegador y ofrece hasta cuatro colores útiles: tonos dominantes del propio logo y variantes armónicas; logos sin color aprovechable o bloqueados por CORS mantienen intacta la paleta manual.
- `Inicio` precarga `Volvemos con más ganas`, el número real de jugadores como etiqueta izquierda, `1 campeón` como dato central y el número real de jornadas como etiqueta derecha; el resto de su composición no cambia.
- Validación local: 11/11 tests focalizados, ESLint, TypeScript, build de producción y presupuesto de fuente correctos (103.756/104.000 líneas).
- Ajuste visual posterior: las etiquetas `PRESET`, `INFORMATIVO` y `SIN FECHA` de la biblioteca usan un rol tipográfico micro, menor tracking y una sola línea para permanecer dentro de cada burbuja sin alterar el nombre del preset.
- La biblioteca ordena sus presets según el recorrido de la temporada: Formato, Reglas, En pista, Cuota, Inicio, Cuenta atrás, Apertura, Agenda, Próxima, Jornada, Resultados, Clasificación, MVP y Final.
- Puerta local final superada con `npm run release:check`: 148 archivos / 487 tests unitarios e integración, 56 tests Playwright, build de producción dentro de presupuesto (828.623 bytes gzip en 85 chunks) y auditoría runtime con 0 vulnerabilidades.
- No hay migraciones nuevas ni cambios sobre migraciones ya aplicadas; este mismo estado queda autorizado para promoción secuencial a `staging`/PRE y, tras su verificación, a `main`/Producción.
- Publicación de aplicación verificada en PRE: `staging` `224d764430eccb6a9f6c76ad052a020d7f7ddf49`, despliegue Vercel `dpl_5sk895g3DVBgVFpjwsViMsdiWJ8k` READY y alias `pre.smashandlob.com`; el smoke autenticado confirma health v1.10.8/pre, página experimental disponible y API protegida con 401. El smoke público conserva el 302 previsto por la protección SSO de Vercel.
- Publicación de aplicación verificada en Producción: `main` `1316a8fddf5d916285d06027406e8f53f128836d`, despliegue Vercel `dpl_9Z4ZDi9aXCgfTqc1R4jBsfLkMNGo` READY y alias `smashandlob.com`; `npm run smoke:prod` confirma health v1.10.8/prod, portada disponible y Avatar Lab bloqueado con 404 tanto en página como en API.

### Recuperación de invitaciones al instalar la PWA (2026-08-18)

- El flujo existente se conserva: los enlaces de jugador y espectador siguen volviendo a su ruta exacta después de Google, y el aviso propio de instalación continúa limitado a HOME tras confirmar una liga.
- El límite de petición registra durante tres días la última invitación visitada en una cookie `HttpOnly`, `SameSite=Lax`, de ruta raíz y segura bajo HTTPS; solo acepta destinos internos `/invite/:code` y `/spectate/:code`, sin redirecciones externas.
- El manifiesto declara un identificador estable `/` y arranca la PWA mediante `/launch`; esa ruta recupera una incorporación incompleta o entra en HOME cuando no existe ninguna.
- Las APIs de alta de jugador y espectador eliminan la intención en la misma respuesta de éxito. Los flujos cliente repiten la limpieza como respaldo y HOME ofrece continuar o descartar una invitación abandonada.
- El acceso anónimo adapta título, explicación y CTA al enlace recibido sin modificar el callback de OAuth ni el proceso actual de reglas, selección de jugador, perfil o espectador.
- Validación focalizada: 20/20 tests de intención, redirección OAuth, proxy de Avatar Lab y PWA, más 2/2 recorridos Playwright móvil/escritorio; TypeScript, ESLint, `git diff --check` y revisión real de `/launch` en navegador correctos, sin errores de consola.
- El endpoint público solo permite consultar o borrar la cookie propia, no acepta cuerpos ni modifica datos de aplicación, y queda registrado explícitamente en el inventario de seguridad: 81 rutas y 117 métodos.
- El presupuesto de fuente registra la nueva ruta de arranque, API y aviso recuperable: 104.142 líneas y 153 clientes, sin cambiar límites de páginas cliente, rutas API ni archivos críticos.
- Puerta completa superada con `npm run release:check`: 149 archivos / 495 tests unitarios e integración, 58 tests Playwright —incluida la recuperación de invitación en móvil y escritorio—, build de producción dentro de presupuesto (829.664 bytes gzip en 85 chunks) y auditoría runtime con 0 vulnerabilidades.
- No se añaden migraciones ni se modifican datos persistentes.
- Publicación de aplicación verificada en PRE: `staging` `43086ce404a744d012925ca07a53004afb42ee5c`, despliegue Vercel `dpl_BiKce4SGhUPkxRbTePeJXkWTJe1x` READY y alias `pre.smashandlob.com`; el smoke autenticado confirma health v1.10.8/pre, manifiesto con `id` estable y arranque `/launch`, cookie de invitación `Secure`/`HttpOnly`/`SameSite=Lax`, recuperación sin intención hacia HOME y API protegida con 401. El smoke público conserva el 302 previsto por la protección SSO de Vercel.
- Publicación de aplicación verificada en Producción: `main` `02e943137f119e4e079cc7f42ac0e487da6fc4be`, despliegue Vercel `dpl_LS5hQaRiBX79M2UfrRV836seTyfh` READY y alias `smashandlob.com`; `npm run smoke:prod` confirma health v1.10.8/prod, portada disponible y Avatar Lab bloqueado. La comprobación específica confirma manifiesto con `id` estable y arranque `/launch`, endpoint de intención operativo, cookie de invitación `Secure`/`HttpOnly`/`SameSite=Lax` y redirección sin intención hacia HOME.

### Registro de cambios público agrupado (2026-08-18)

- La vista pública agrupa versiones consecutivas de la misma serie cuando comparten categoría y texto general; muestra un único rango de versiones y fechas en lugar de repetir el mismo panel.
- Las entradas con categoría `Novedad` conservan su título y resumen funcional reales para explicar qué capacidad se incorporó, sin exponer el detalle técnico reservado.
- Creadores, administradores de liga y superusuarios reciben el historial detallado únicamente cuando `Vista admin` está activa; al desactivarla ven exactamente el mismo resumen público que un jugador normal.
- El detalle completo solo se entrega desde servidor a cuentas autorizadas. Los usuarios normales no reciben ese contenido oculto en el cliente.
- El presupuesto registra 104.263 líneas, 154 clientes y 47 páginas cliente; el límite puntual de `src/lib/changelog.ts` sube a 2.410 líneas para sus tres campos opcionales de rango.
- Pulido previo a publicación: las series con una única entrega muestran `1 versión`, y la novedad v1.10.0 sustituye `overrides competitivos` y referencias internas por una explicación pública sobre perfiles, temporadas programadas y Centro de Difusión.
- Validación local final: 12/12 tests focalizados, ESLint, TypeScript, build de producción, presupuesto de fuente y `git diff --check` correctos. La revisión real en navegador confirma el detalle por versión con `Vista admin`, el resumen agrupado al desactivarla y los rangos de fecha sin concatenaciones. Cambio aislado en `codex/public-changelog-groups`, todavía no publicado.
- Puerta completa superada antes de publicación con `npm run release:check`: 150 archivos / 502 tests unitarios e integración, 58 tests Playwright, build de 830.472 bytes gzip en 85 chunks y auditoría runtime con 0 vulnerabilidades. No hay migraciones ni cambios de datos persistentes.
- La primera inspección autenticada de PRE confirmó health v1.10.8/pre y `/changelog` con 200, y detectó metadatos de fecha vacíos serializados en entradas antiguas sin fecha. Se omiten ahora esas propiedades cuando no existen; 8/8 tests focalizados, ESLint, TypeScript y build de producción vuelven a quedar correctos antes de la promoción.
- Publicación de aplicación verificada en PRE: `staging` `55823fdd47750da4e13321e1a3cb696a18b188ac`, despliegue Vercel `dpl_6HYXajo2Mn8JMEywbAbBPC89tqwe` READY y alias `pre.smashandlob.com`; health confirma v1.10.8/pre y `/changelog` responde 200 con la copia pública curada, sin `overrides competitivos` ni propiedades de fecha vacías.
- Publicación de aplicación verificada en Producción: `main` `fb2c1b9fef69a398972c9c01e0d0f912d8ff0f77`, despliegue Vercel `dpl_7SG5LJZzQ9Za3suGY8C31Jkxv27q` READY y alias `smashandlob.com`; `npm run smoke:prod` confirma v1.10.8/prod, portada disponible y Avatar Lab bloqueado. La inspección específica de `/changelog` confirma la copia pública curada y cero propiedades de fecha vacías.

### Mis partidos: hora, jugadores y detalle de amistosos (2026-08-18)

- `Mis partidos > Crear encuentro` usa ahora la hora local del dispositivo y la redondea siempre a la siguiente hora en punto: por ejemplo, 13:17 precarga 14:00; el cambio de 23:42 a 00:00 del día siguiente también queda cubierto.
- El selector declara pasos de una hora y reutiliza la misma función de redondeo que la programación de partidos de liga, sin modificar la conversión posterior a UTC al guardar.
- Validación local: 12/12 tests focalizados, ESLint, TypeScript, build de producción, presupuesto de fuente (104.287 líneas) y `git diff --check` correctos. No hay migraciones ni cambios de datos persistentes.
- La lista para registrar un amistoso absorbe jugadores históricos sin cuenta vinculada cuando su nombre identifica de forma inequívoca a una única cuenta; acumula todas sus ligas en una sola opción y conserva separadas las coincidencias ambiguas entre dos cuentas reales.
- Los selectores de pareja y rivales limitan su ancho, permiten encoger el bloque de texto y recortan etiquetas secundarias largas para no salir del panel contenedor.
- El detalle de un amistoso carga `preferred_side` y `dominant_hand` de las cuentas participantes y muestra etiquetas como `REVÉS DIESTRO` en el mismo panel de parejas; no dibuja la línea de posición de liga y omite la etiqueta para perfiles externos o incompletos.
- `Próximo partido` incorpora `Todos · Liga · Amistoso`, con `Todos` por defecto y selección cronológica del encuentro más cercano entre ambos tipos.
- Validación local ampliada: 21/21 tests focalizados, ESLint sin avisos, TypeScript, build de producción, presupuesto de fuente (104.427 líneas) y revisión real en navegador correctos. Se confirmó 14:00 como hora local redondeada, cero desbordamiento de selectores abiertos y metadatos de juego sin posición de liga.
- Estado de publicación: el primer ajuste horario alcanzó `staging` en `f7ab176`, antes de que se solicitara la pausa; la deduplicación, el arreglo visual, los metadatos de jugadores y el filtro `Todos` permanecen únicamente en el workspace local. No se ha promovido esta tanda a Producción.

### Mis partidos: programación, ubicaciones y pagos (2026-08-18)

- La programación del detalle personal reutiliza el mismo formato largo que PARTIDO de Liga, con día, fecha y hora separados mediante puntos medios.
- El alta y la edición de amistosos comparten un selector de ubicaciones en popup flotante, con fondo difuminado, búsqueda, selección del catálogo global y alta manual.
- El detalle incorpora `Pagos y reservas`: informa pagadores de pista y bolas, calcula las transferencias entre los cuatro participantes y permite actualizar su estado con permisos equivalentes al flujo de Liga.
- Se añade la migración aditiva `20260818133000_add_personal_match_bookings.sql`; crea una tabla separada protegida por RLS y accesible únicamente mediante `service_role`, sin modificar migraciones ya aplicadas ni las filas existentes de partidos personales.
- Las APIs nuevas requieren autenticación, pertenencia al amistoso, límites de petición y validación server-side de participantes e importes. Los recordatorios de pago no se exponen en amistosos porque la mensajería actual depende del contexto de liga.
- El presupuesto de fuente registra 105.034 líneas, 156 clientes y 47 páginas cliente; el inventario de seguridad incorpora las tres operaciones protegidas de reserva y transferencias personales.
- Puerta local completa superada con `npm run release:check`: 151 archivos / 508 tests unitarios e integración, 58 tests Playwright, build de producción dentro de presupuesto (836.723 bytes gzip en 85 chunks) y auditoría runtime con 0 vulnerabilidades.
- Revisión real local completada: fecha con puntos medios, popup de ubicación con fondo difuminado y bloque funcional de pagos visibles en el detalle del amistoso.
- Pendiente antes de publicación: aplicar y verificar la migración primero en PRE, desplegar `staging`, y solo después repetir migración y promoción en Producción.

### Reserva desde CHAT y Economía por persona - v1.10.9 (2026-08-18)

- La confirmación definitiva de reserva desde CHAT deja de aceptar una pista reservada sin datos económicos: antes de programar exige seleccionar uno o varios pagadores de pista e indicar el importe abonado por cada uno.
- La API de confirmación valida que todos los pagadores pertenezcan al partido y guarda `booking_reservations`, `booking_transfers` y `booking_updated_at` en la misma operación que fecha, ubicación y pista; las transferencias se calculan con `buildCourtBooking`, igual que en PARTIDO.
- Si falla la creación del mensaje de sistema del chat, el rollback restaura también reservas y transferencias anteriores, además de la programación.
- Economía de temporada calcula `availablePerPlayer` a partir del saldo realmente disponible dividido entre los jugadores únicos de la temporada. El panel Disponible muestra `X € POR PERSONA` en lugar de `Ingresado − gastado`.
- No requiere migraciones de Supabase. La entrega local incluye pruebas focalizadas para el flujo de reserva desde CHAT y el reparto del saldo por jugador; la puerta final de lint, tipos, build y revisión visual se ejecuta tras aplicar el ZIP en el proyecto real.


### Duración flexible y ampliación de temporadas - v1.12.3 (2026-08-26)

- La duración deja de estar acoplada al número de jugadores: creación con equilibrio completo o número personalizado de jornadas.
- Temporada larga escalable por vueltas completas hasta el máximo determinista soportado para cada plantilla de 8 a 24 jugadores.
- Los múltiplos exactos de la vuelta base generan vueltas completas equilibradas; los tramos parciales usan optimización determinista y la auditoría distingue equilibrio completo de resultado optimizado.
- Gestión puede ampliar una temporada existente a doble vuelta o temporada larga mientras no haya resultados, usando la misma barrera de seguridad que REROLL.
- La migración `20260826002000_resize_balanced_season_calendar.sql` realiza el redimensionado de forma atómica y limpia el estado operativo ligado a los emparejamientos sustituidos.
- La entrega se valida localmente con las puertas habituales y requiere aplicar la migración antes de publicar el código.

### Welcome Pack: refinamiento de impresión (2026-09-15)

- La faja conserva su composición: se amplían visualmente el logotipo y nombre de liga con origen inferior, los nombres de jugadores ganan aproximadamente un punto y se retiran únicamente las guías discontinuas de las zonas de pegado.
- Los dos precintos incluidos en el PDF pasan de 50 × 15 mm a 60 × 15 mm (64 × 19 mm con sangrado); su contenido permanece centrado y el logotipo gira 90 grados en el sentido de montaje vertical.
- El fajín de overgrip amplía el espacio útil del logotipo de 72 × 42 px a 80 × 46 px y reduce su separación con el nombre de liga.
- Validación final correcta: presupuesto de fuente de 125.531 líneas, ESLint, TypeScript, build de producción y presupuesto de build; 726 pruebas unitarias e integración y 62 pruebas Playwright superadas; auditoría runtime sin vulnerabilidades altas.
- Publicación verificada en PRE: `staging` `9bc7f8746c97aca60a4cfb0151af5c3f7a26a537`, despliegue Vercel `dpl_GCaS2e7LdVVRxjFnoDSHyzBnaSgo` READY y alias `pre.smashandlob.com`; health autenticado confirma v1.13.8/pre, portada 200 y Avatar Lab disponible con API protegida 401. El acceso público conserva el 302 esperado por SSO de Vercel.
- Publicación verificada en Producción: `main` `9bc7f8746c97aca60a4cfb0151af5c3f7a26a537`, despliegue Vercel `dpl_9sXCBm995bopH3JgCHFEAASaorzh` READY y alias `smashandlob.com`; `npm run smoke:prod` confirma health v1.13.8/prod, portada disponible y Avatar Lab oculto con 404.
- v1.14.1 publicado en PRE y Producción: `staging` y `main` en `9d96c30e46dc9df95e5efb2f7211a5cfa8a1c5cf`; PRE `dpl_81hb4LFKm4bM3CUpPfbAcqsX25tF` y Producción `dpl_DWkN7TYe8w1dupjgAzYcKmJnM5J9` READY, con alias `pre.smashandlob.com` y `smashandlob.com`. Validación focalizada: version:check, TypeScript, lint y 8 pruebas unitarias de los generadores. Smoke omitido por la indicación del proyecto.

- Ajuste pendiente de prueba en PRE v1.14.2: el contenido completo del precinto de bolsa se amplía para mejorar la legibilidad en impresión.
- Ajuste pendiente de prueba en rama v1.14.3: nombre de liga autoajustable y logos de prueba de 50 mm en huecos de la última hoja.
- Ajuste pendiente de prueba en rama v1.14.4: nueva plancha de pegatinas de logo con ancho configurable, orientación A4 automática y relleno de huecos a 50 mm.

### Optimización del snapshot de acceso (2026-09-16)

- La consulta de `season_settings` usada para ocultar datos de pretemporada se incorpora al `Promise.all` principal de `/api/access`.
- Se elimina una espera de red secuencial sin cambiar el payload, la autorización ni la generación fiable de calendarios.
- La rama queda en v1.14.6; se validan tests focalizados, TypeScript, ESLint y build de producción.
- La puerta de código ajusta el límite total al estado medido del repositorio tras incorporar las traducciones obligatorias, sin relajar los límites de build ni de rutas API.

- Publicación v1.14.7 verificada: `staging` y `main` quedaron en `536841d` y Vercel generó PRE `dpl_Dc7VaJjhhrzkcmQxeXp74C7gXTG3` READY (`pre.smashandlob.com`) y Producción `dpl_EkVRSraBSFY9mh5PaanGDGUmJWxM` READY (`smashandlob.com`). Health de Producción devuelve `1.14.7`; PRE mantiene la protección SSO pública esperada.

### HOME: acceso directo a Mis ligas (2026-09-16)

- El control superior izquierdo deja de refrescar HOME y enlaza directamente a `/leagues` con el texto `Mis ligas`.
- Se mantienen separados el cambio de competición y el área personal de `Mis partidos`.
- La validación de tipografía se actualiza para exigir el enlace directo a `Mis ligas` y eliminar el contrato anterior de refresco manual.
- HOME y el componente compartido `BackButton` incorporan la flecha izquierda visible para distinguir los accesos de vuelta.
- Mis ligas sustituye el botón de vuelta por `Refrescar` y mantiene la selección de competición como acción principal.

### Optimización de arranque percibido (2026-09-16)

- Se crea la rama `codex/performance-optimization` desde `58443f2` para medir y mejorar la carga sin tocar `main` ni `staging`.
- `LeagueAccessProvider` usa la última pertenencia de liga almacenada localmente para mostrar antes la aplicación mientras revalida el snapshot remoto; las operaciones protegidas siguen autorizándose en servidor.
- La versión de la rama pasa a v1.14.5 y el changelog explica el comportamiento visible.
- Build y presupuesto de JavaScript se mantienen dentro de los límites del repositorio. Lighthouse queda pendiente de repetir en un entorno con Chrome instalado: el runner local no dispone de una instalación de Chrome.

- Publicación v1.14.11 verificada: `staging` y `main` en `d8161b1`; PRE `dpl_5DABffBZqMAyUKrUWJtCix8n7vCK` y Producción `dpl_61fujbsDaFov57BubKyFsKyVJ6C8` quedaron READY con sus aliases públicos. `/api/health` devuelve `1.14.11` en ambos entornos.
- En los precintos de bolsa, los nombres de jugador largos reducen automáticamente su tipografía hasta caber en una sola línea, conservando el estilo seleccionado.
- El nombre del jugador deja un margen lateral adicional en los precintos cuando necesita reducirse para caber.












- v1.14.26: el bloque HEAD / Padel Pro / S+ vuelve a la posición original.

### Welcome Pack: tinta para pegatinas (2026-09-19)

- Se añade selector entre gris claro y blanco para las zonas blancas de los seis diseños. Gris claro queda como valor inicial.
- El PDF y las previsualizaciones usan la variante correspondiente; la transparencia y el resto del arte se conservan.
- Versión local de la rama: v1.15.3. Sin despliegue remoto.
- Publicación v1.15.3 verificada: `staging` y `main` apuntan a `caa2083`; Producción responde `/api/health` con v1.15.3. PRE responde mediante el alias protegido de Vercel y mantiene la protección SSO activa.

### Inicio de saneamiento v1.15.4 (2026-09-19)

- `main` remoto se verificó en `01c9212` (v1.15.3) y se creó `codex/v1.15.4-hardening-cleanup` desde ese estado.
- La línea base, los huecos confirmados y las decisiones de producto quedan documentados en `docs/production-hardening/V1_15_4_HARDENING_AUDIT.md`.
- Se implementó el estado persistente de leído/no leído de notificaciones con migración aditiva y API protegida; la pantalla permite marcar una notificación o todas como leídas sin tocar los contadores propios del chat.
- La actividad administrativa admite cursor estable (`createdAtBefore`) para consultar páginas antiguas sin duplicados; la exportación de cuenta y la anonimización autoservicio requieren sesión y confirmación reforzada.
- Se eliminó la exclusión histórica del gate de i18n para `personal-matches` y `components/personal`; las traducciones visibles de esa vertical y de notificaciones quedan cubiertas para español, inglés y euskera.
- El buscador de ajustes incluye las entradas legales cuando son aplicables y el acceso a crear liga permanece disponible para cuentas autorizadas aunque estén en modo jugador.
- Se corrigió el 404 del acceso público de espectador por QR: `/spectate/:code/view` ahora atraviesa el proxy público y conserva las restricciones del resto de rutas.
- Se corrigió la prioridad de plantillas dinámicas de i18n para que las frases específicas se evalúen antes que patrones genéricos (`{} en {}`); las pruebas de Welcome Pack y espectador vuelven a pasar.
- Validación parcial ejecutada: i18n, TypeScript, ESLint, presupuesto de fuente y pruebas focalizadas correctos. La validación completa y los bloques restantes de auditoría siguen pendientes; no hay migraciones aplicadas ni despliegues.
- El panel de Ajustes incorpora exportación JSON y solicitud de anonimización con confirmación reforzada; se mantiene disponible también en la vista de espectador autenticado. El presupuesto total se ajusta a 130.000 líneas para absorber esta capacidad y la cobertura i18n sin ampliar ningún presupuesto de archivo crítico.
- `npm run release:check` completado: 203 archivos y 769 tests unitarios/integración, 68 E2E (incluidos accesibilidad, visuales, QR de espectador y PWA), build de producción, presupuestos de código/build y `npm audit --omit=dev --audit-level=high` con 0 vulnerabilidades.
- Las baselines visuales de Ajustes se actualizaron porque la nueva sección de datos modifica intencionadamente la altura de la pantalla.
- Ramas remotas auditadas sin borrar ninguna: todas las ramas de trabajo existentes están a 0 commits exclusivos frente a `origin/main` y se pueden considerar absorbidas; se conserva la decisión de no eliminarlas sin aprobación explícita.
- Pendientes deliberadamente fuera de esta iteración por requerir decisiones/migraciones de mayor alcance: cola persistente de reintentos Push, lista de espera transaccional y extracción completa del macroarchivo de administración de temporadas. Quedan documentados como siguiente bloque, sin afirmar que estén implementados.

## v1.15.4 — PRE/PROD promotion (2026-09-19)

- `npm run release:check` completado: 204 archivos de test, 775 pruebas unitarias/integración, 68 E2E, lint sin errores (12 warnings preexistentes), typecheck, i18n, seguridad, migraciones, build dentro de presupuesto (1.072.077 bytes gzip), auditoría runtime sin vulnerabilidades.
- La rama integra el estado actual de `origin/staging` y el hardening de waitlist; las migraciones nuevas de cola y operaciones atómicas quedan incluidas en el release.
- PRE: migraciones aplicadas y verificadas en el proyecto Supabase enlazado durante esta sesión. El código queda listo para promocionarse a `staging`.
- PROD: se requiere enlazar explícitamente el proyecto Supabase de producción antes de aplicar migraciones; no se ha usado ni supuesto el proyecto PRE para PROD.
- Promoción final verificada en Git: `staging` y `main` apuntan a `72898a8`. Supabase PROD (`szycbwdzestcmimziyey`) recibió y verificó `20260919100000`, `20260919120000`, `20260919123000`, `20260919124500` y `20260919131500`; PRE (`miadjotkucgluwbrgeih`) quedó sincronizada con las cinco migraciones, incluida la pendiente histórica de estado de lectura. El enlace local se dejó de nuevo en PRE.
- Health PROD responde `200` con v1.15.4. PRE responde mediante la protección SSO de Vercel (deployment nuevo visible, sin error de aplicación); la validación funcional PRE queda condicionada a una sesión Vercel autorizada.

## Competition visual style (local branch, 2026-09-19)

- Se creó `codex/competition-visual-style-experimental` desde `origin/main` (`b0938fa`) sin tocar `main`, `staging`, PRE ni PROD.
- La base de apariencia se centraliza en `src/lib/visualStyle.ts` y `ThemeProvider`: Classic es el valor seguro; Competition queda disponible solo en desarrollo local y fuerza modo oscuro.
- Se añadió el acento persistente por liga (`leagues.accent_color`) con fallback `#D7A544`, validación hexadecimal y propagación al acceso autenticado y al espectador público.
- La UI de Ajustes ofrece Classic/Competition y desactiva claro/sistema cuando Competition está seleccionado; la página de administración de liga permite guardar el acento.
- Se añadió una primera capa de tokens y geometría Competition en `globals.css`, manteniendo intacto el estilo Classic.
- TypeScript, ESLint (sin errores), build de producción, i18n, seguridad, presupuesto de código, `git diff --check` y la batería unitaria completa pasan: 203 archivos y 769 tests.
- La migración `20260919150000_add_league_accent_color` se aplicó y verificó en el proyecto Supabase enlazado a PRE mediante `npx supabase db push`; PROD no se modificó.

## Competition visual style v2 (local branch, 2026-09-19)

- La rama `codex/competition-visual-style-v2` parte de `75ae572` y conserva el fondo geométrico validado en v1.
- Se refuerza la jerarquía de Home, ranking, estadísticas, partidos y perfil con cabeceras editoriales, tarjetas con niveles de superficie, acentos de liga y estados más legibles.
- Se corrigen colores de avisos ámbar, rojo y azul sobre fondo oscuro, además de foco visible para teclado.
- TypeScript, ESLint, build de producción y pruebas focalizadas pasan. No se ha desplegado la rama.
- Revisión visual en la IP local: se corrigió la miniatura de Competition que conservaba un degradado del estilo anterior y el contraste de textos secundarios dentro de badges con acento. El acento se verificó al cambiar entre ligas.

## Competition visual style v2 — revisión visual HOME y regresión Classic (2026-09-19)

- Se corrigió el desbordamiento del logo de liga en la cabecera de HOME: se elimina la transformación que lo hacía sobresalir de la tarjeta y se conserva su proporción dentro del contenedor.
- El nombre de liga se mantiene en una sola línea y ajusta dinámicamente la fuente al ancho disponible, evitando truncado y colisiones con la barra flotante.
- El panel `Líder` deja de heredar una altura mínima artificial y se ajusta a su contenido, manteniendo alineación equilibrada con `Jornadas`.
- Se revisaron visualmente HOME, Mis ligas, Ranking, Calendario, Jornada, detalle de partido, Perfil, Estadísticas, Apariencia y Mis partidos en el navegador local; no se observaron errores de consola.
- Se comprobó la HOME con el estilo Classic y se restauró Competition al finalizar. No se desplegó.
- `npm run release:check` se ejecutó completo: validaciones, 205 archivos/778 pruebas, build y presupuesto pasan; 42 E2E pasan y 26 quedan bloqueados por snapshots visuales históricos y avisos de contraste ya existentes en pantallas Classic (la revisión visual de esta iteración no introduce errores de consola). No se despliega hasta actualizar esas baselines/contrastes deliberadamente.

## Competition visual style v2 — acentos, paletas y cabeceras (2026-09-19)

- El título de la liga en HOME usa un ajuste responsive real: mantiene una sola línea y reduce progresivamente la fuente hasta el mínimo legible cuando cambia el ancho disponible.
- Competition incorpora acentos seleccionables (Color de la liga, dorado, azul, verde, coral, violeta y azul hielo). El acento seleccionado se aplica a los tokens `--app-accent` y `--competition-accent`; Color de la liga conserva el color propio de la liga.
- Classic vuelve a distinguir la paleta normal de las paletas coloridas y activa la clase `colorful` para que los temas índigo, medianoche, salvia, borgoña y grafito cambien realmente la interfaz.
- Las ligas nuevas aceptan un color de acento validado; la identidad de liga puede derivarlo inicialmente del logo y mantener un valor elegido manualmente. Welcome Pack y Media Kit toman el acento de la liga como valor inicial.
- Se reorganizó la cabecera de Notificaciones en móvil: el título queda separado de las acciones y los botones dejan de comprimirse en Competition.
- Se verificaron visualmente HOME, Apariencia, Notificaciones y cambios Classic/Competition en el navegador local sin errores de consola. No se ha desplegado.

## Competition visual style v2 — centrado y separación del logo (2026-09-19)

- La cabecera de HOME usa `items-center` y un `gap` compacto únicamente en Competition; el logo queda centrado respecto al bloque de identidad y más próximo al nombre de la liga.
- Classic conserva su estructura `items-start`, margen y escala `1.3` originales.
- Se actualizó el gate tipográfico y la prueba de geometría para proteger ambos comportamientos.
- La corrección se revisó en la IP local con Competition y Classic; no se ha desplegado.

## Competition visual style v2 — cabeceras unificadas (2026-09-19)

- Se aplica un panel editorial común a las cabeceras de Competition, incluyendo Calendario y Chats, con borde de acento, superficie oscura y jerarquía tipográfica coherente.
- El botón Volver mantiene su fila superior independiente para evitar solapes en móvil.
- La comprobación visual de Calendario y Chats se hizo en la IP local; Classic no recibe estos estilos.

## Competition visual style v2 — acento en perfil e identidad de liga (2026-09-19)

- Los bordes de los paneles de Mi perfil usan el acento de Competition mediante el token dinámico de la liga, eliminando el dorado fijo.
- El nombre de la liga conserva su capitalización original para respetar la identidad de marca; las etiquetas y títulos funcionales siguen en mayúsculas.
- Se verificó el color dinámico en el perfil y el build de producción; no se ha desplegado.

## Competition visual style v3 — propuesta de rediseño (2026-09-20)

- Se creó `codex/competition-visual-style-v3` desde el estado validado de v2.
- Las superficies de Competition pasan a una composición más dimensional con gradientes suaves, bordes derivados del acento y sombras profundas, sin alterar la estructura funcional.
- HOME, Calendario, Chats, Perfil y la navegación inferior comparten ahora un ritmo visual más marcado; las tarjetas de competición mantienen el contraste y el acento de la liga.
- El alcance queda aislado a `data-visual-style="competition"`; Classic permanece sin cambios.
- Revisión visual local realizada en móvil simulado para HOME, Calendario, Chats y Perfil. No se ha desplegado.
- Se eliminó el borde superior duplicado del panel Jornada en HOME; el acento queda controlado por la propia tarjeta, igual que en Líder.
- Se unificó también el tratamiento visual: Líder y Jornada usan ahora el mismo borde superior de 2px y se desactiva el acento interno distinto de `app-stat-card`.
- En Chats se elimina la barra lateral; la lista conserva el panel y la superficie propios de Competition sin esa línea de acento.

## Competition visual style v3 — superficies translúcidas (2026-09-20)

- Las tarjetas y paneles de Competition usan superficies semitransparentes con un desenfoque suave (`backdrop-filter`) para dejar ver el fondo sin perder legibilidad.
- Se reforzó la transparencia y se llevó el patrón geométrico al contenedor de Competition para que el efecto sea visible también en HOME, sin aclarar en exceso el texto.
- En Chats las conversaciones mantienen una base neutra; solo las no leídas reciben un acento discreto.
- El alcance sigue limitado a `data-visual-style="competition"`; los modos clásicos no cambian.

## Competition visual style v3 — acceso controlado (2026-09-20)

- Competition mantiene Classic como valor predeterminado y queda disponible únicamente para la allowlist de `NEXT_PUBLIC_COMPETITION_STYLE_ALLOWED_EMAILS`, también en desarrollo local.
- La cuenta autorizada para esta fase es `davidalonsoc4@gmail.com`; el selector se oculta a las demás cuentas.
- La sesión Auth.js se resuelve antes del `ThemeProvider` para aplicar el permiso también en PRE/PROD, sin depender solo de `localStorage`.
- PRE desplegado y verificado en `https://pre.smashandlob.com` con v1.15.4 y `staging` apuntando a `dbf08fa`; PROD no se ha modificado.

## Invitación de espectador — salida y recuperación de sesión (2026-09-20)

- La pantalla de invitación limpia al abrirse la cookie de recuperación de PWA; cerrar la aplicación ya no vuelve a forzar la invitación en el siguiente arranque.
- La entrada anónima a la vista pública limpia también la cookie antes de navegar, y se puede cancelar explícitamente con `Cancelar invitación`, que devuelve a la entrada normal de la aplicación.
- Se mantiene el enlace directo a la vista pública y se han añadido las traducciones de la nueva acción en español, inglés y euskera.
- El commit `2990f7c9` se ha desplegado en PRE como `dpl_3kTNdP4G1sBNamJYMjxy3m52Ct1L`; el alias `https://pre.smashandlob.com` apunta a esa versión y el health check devuelve `1.15.4`.

## Competition y vista pública — superficies y temporadas (2026-09-20)

- El patrón de fondo de Competition se conserva en una única capa fija; el contenedor que hace scroll ya no pinta una segunda copia.
- La barra del navegador/PWA mantiene un negro neutro en Competition. Ajustes, lista de Chats y Chat individual comparten ahora la superficie translúcida del resto del tema.
- La vista pública muestra siempre el nombre de la liga y una temporada explícita; cuando existen varias temporadas, el selector consulta únicamente temporadas de la liga del enlace y actualiza clasificación, calendario y visibilidad.
- Classic no recibe estas reglas porque todo el cambio queda bajo `data-visual-style="competition"`; la API pública valida el `seasonId` antes de resolverlo.
- El commit `a8476a7b` se ha desplegado en PRE como `dpl_BDPgZckqtHdnFEwMS4Zb48R4chxo`; `https://pre.smashandlob.com` apunta a esa versión y el health check devuelve `1.15.4`.

## Competition — persistencia de selección y cabecera pública (2026-09-20)

- `ThemeProvider` ya no convierte una selección Competition en Classic mientras Auth.js resuelve la sesión; la selección persistida se conserva durante la recarga y la allowlist se aplica al terminar la resolución.
- La cabecera de espectadores fuerza contraste explícito para que el nombre de la liga y la temporada sigan visibles con cualquier acento Competition.
- Validado con tests de Competition y espectadores, lint, TypeScript, build de producción y `git diff --check`. No desplegado todavía.
- El commit `6a95ab82` se ha desplegado en PRE como `dpl_85Sm6xRDZpgJXibgzdPoSbP3T255`; `https://pre.smashandlob.com` apunta a esa versión y el health check devuelve `1.15.4`.

## Vista pública, alcance del bloqueo programado y enlaces de espectador (2026-09-20)

- La cabecera de `/spectate/:code/view` mantiene contraste explícito también en Classic claro; el título de la liga deja de quedar blanco sobre una tarjeta blanca.
- Las tarjetas de partidos de la vista pública siguen la misma distribución de cabecera, parejas, tanteo y metadatos que Calendario, manteniendo la sanitización de datos públicos.
- El bloqueo de una temporada con inicio programado deja de ser global en `AppShell`: cada pantalla aplica el bloqueo según la temporada que realmente está mostrando. Una temporada anterior se puede consultar y utilizar con normalidad.
- Si una persona autenticada abre un enlace de espectador de una liga a la que ya pertenece, la aplicación selecciona esa liga y abre la experiencia completa; los usuarios sin membresía conservan el flujo de solo lectura.
- Se añadieron pruebas de regresión para contraste Classic, distribución pública, alcance del bloqueo y redirección de miembros.
- La línea completa de la rama (`26` commits por delante de `origin/main`) se publicó en PRE como `dpl_EUm9BfzekUzK5VbcvaMZaopexMrW` y en PROD como `dpl_wRgjMQ1NjdSCtQzBrmRVTgTwzEFa`; ambos deployments quedaron `Ready` y los health checks devuelven `1.15.4` en su entorno.

## Migración de acento de liga aplicada en PROD (2026-09-20)

- Se enlazó explícitamente la CLI al proyecto Supabase PROD `szycbwdzestcmimziyey` y el dry-run mostró una única migración pendiente: `20260919150000_add_league_accent_color.sql`.
- La migración se aplicó con `npx supabase db push --linked`; la lista remota quedó alineada con todas las migraciones locales.
- `npx supabase db lint --linked --schema public` terminó sin errores.
- La CLI se volvió a enlazar al proyecto PRE `miadjotkucgluwbrgeih` después de la operación.

## Bloqueo por temporada y panel de inscripciones en Competition (2026-09-20)

- La temporada elegida en HOME se persiste por liga en `localStorage` y se reutiliza al navegar por el resto de la aplicación. Esto permite consultar temporadas terminadas con normalidad aunque exista otra temporada programada en la misma liga.
- El bloqueo global de la experiencia jugador vuelve a estar acotado a la temporada seleccionada: las temporadas con inicio programado (incluida la fase de secretos) mantienen la vista de espera, mientras que una temporada terminada no queda bloqueada. Administración, ajustes, partidos personales, notificaciones y accesos públicos conservan sus rutas de utilidad.
- El panel de Inscripciones recibe una superficie Competition específica, con contraste, bordes, estados de pago y avisos legibles en oscuro. Las reglas quedan bajo `data-visual-style="competition"`; Classic no cambia.
- Validación focalizada: 23 pruebas unitarias, ESLint de los archivos modificados y TypeScript pasan. No se ha desplegado.

- El commit `c0210f41` se publicó en PRE como deployment Vercel `dpl_4otDuoXo9jzmJFG6ETz9LXSosnyE` (`Ready`, target `preview`) y `pre.smashandlob.com` quedó reasignado a esa versión. La sonda autenticada de `/api/health` devuelve `1.15.4/pre`. PROD no se ha modificado.

- La misma implementación, con la anotación documental `e9d85d89`, se publicó en PROD como deployment Vercel `dpl_8g4BQFQ99J3DhPJ7Jr2dXFy9diKu` (`Ready`, target `production`) y quedó asociada a `https://smashandlob.com`. La sonda autenticada de `/api/health` devuelve `1.15.4/prod`.

## Sincronización inmediata de la navegación por temporada (2026-09-20)

- La selección de temporada emite un evento de cambio en la misma pestaña y la AppShell actualiza de inmediato el estado de la BottomNav y del bloqueo de temporadas programadas. También se sincronizan cambios realizados desde otra pestaña mediante el evento `storage`.
- Alternar entre una temporada terminada y otra programada ya no requiere recargar la aplicación para recuperar o restringir la navegación.
- Validación focalizada: 20 pruebas unitarias, ESLint, TypeScript y `git diff --check` pasan. Aún no se ha desplegado este ajuste.

- El commit `ea67a3f0` se publicó en PRE como `dpl_EYCT9fntL83KFTtpeacY9h4a1oi2` y en PROD como `dpl_ELHq99Rk8urTaFA6HAgHaxQisksU`; ambos deployments quedaron `Ready`. Los health checks devuelven `1.15.4/pre` y `1.15.4/prod` respectivamente.

## Pulido de superficies oscuras en Competition (2026-09-20)

- Las franjas de reserva del chat y los estados de coordinación ya no muestran fondos claros en Competition; usan superficies oscuras semánticas con contraste suficiente.
- La tarjeta de Programación del detalle de partido conserva el acento en el borde, pero deja de heredar el tinte marrón del panel completo.
- Se añadieron equivalencias oscuras para estados azules, verdes, índigo, naranjas y rosas, siempre bajo `data-visual-style="competition"`; Classic permanece intacto.
- Validación: revisión visual local en detalle de partido y chat móvil, test de Competition (7 pruebas), TypeScript, build de producción y `git diff --check`.

## Ajustes, notificaciones y chat en Competition (2026-09-20)

- Las opciones de Ajustes y las categorías de Notificaciones incorporan el mismo patrón de iconos cuadrados que Estadísticas, manteniendo las miniaturas informativas de perfil y apariencia.
- El chat de partido muestra `JORNADA X` como título compacto. La reserva fijada se presenta con pin, etiqueta y segunda línea para fecha y ubicación, con contraste específico para Competition.
- Se revisaron los estados vacíos, el área de mensajes, el compositor y las tarjetas de coordinación en móvil; Classic queda fuera de los selectores visuales de Competition.
- Validación: revisión visual local en Ajustes, Notificaciones y Chat, 26 pruebas focalizadas, ESLint, TypeScript, build de producción y `git diff --check`.

## Pulido de cabecera y metadatos del chat en Competition (2026-09-20)

- La cabecera del chat pasa a ocupar todo el ancho de la pantalla sin bordes redondeados ni el borde lateral editorial de las pantallas de contenido; el título mantiene su centrado y el botón de volver.
- El compositor inferior se mantiene como una superficie continua y el botón de envío usa el acento y su color de contraste calculado, evitando una franja lateral o contrastes inconsistentes.
- Las horas y los checks de los mensajes reciben clases semánticas propias. En Competition se pintan con el contraste del acento activo, manteniendo legibilidad con acentos claros y oscuros; Classic no cambia.
- Validación focalizada: 19 pruebas unitarias, ESLint de TS (CSS ignorado por configuración), revisión visual local en móvil y `git diff --check`. No se ha desplegado.
- Ajuste posterior: la hora de los mensajes propios fuerza también el color de contraste en su elemento interno `.type-caption`, evitando que la regla global de captions la apague con el acento dorado.

## Apariencia fija en enlaces de espectadores y contraste de navegación (2026-09-20)

- Los enlaces de espectadores guardan al generarse una instantánea inmutable de la apariencia del creador: estilo visual, tema base, paleta, elección de acento y color resuelto. Los enlaces existentes sin instantánea se completan en su siguiente uso y después no vuelven a cambiar.
- Una persona anónima sin una preferencia visual explícita recibe esa apariencia al abrir la invitación o la vista pública; sus preferencias guardadas y las cuentas autenticadas tienen prioridad. Los valores por defecto escritos automáticamente por `ThemeProvider` no se consideran una elección del usuario.
- Se añadió la migración `20260920100000_add_spectator_invite_appearance.sql` y la API pública devuelve la apariencia sin exponer datos internos.
- En Calendario, `VISTA` queda centrado en su espacio y la opción activa fuerza el contraste del texto. La etiqueta de pagos pendientes de Ajustes usa el acento y su contraste en Competition.
- Validación: TypeScript, build de producción, migraciones, 14 pruebas focalizadas y `git diff --check`. No se ha desplegado.

- El presupuesto global de fuente se ajustó de 131.500 a 132.250 líneas de forma acotada: la base previa de esta rama ya medía 131.903 líneas antes de la apariencia de invitaciones, que añade 210 líneas netas. El nuevo margen cubre únicamente esta entrega y queda respaldado por el gate de calidad.

## Cierre de gates antes de despliegue (2026-09-20)

- Se corrigió la aserción estructural obsoleta de `v166HomeLeagueSwitcher.test.ts`, que esperaba la firma anterior de `useActiveLeague()`.
- El fixture E2E de espectador ahora refleja el contrato actual de la API (apariencia, temporada y lista de temporadas) y acepta el query string de selección.
- Axe detectó y se corrigieron contrastes insuficientes en los estados de jornadas, las tarjetas de Estadísticas y el bloque de imágenes del resumen de temporada.
- Se regeneraron las referencias visuales de los recorridos E2E tras los cambios de diseño vigentes.
- Suite unitaria: 205 archivos y 789 tests correctos. E2E focalizado de accesibilidad y espectador: 24 tests correctos. Recorrido visual actualizado: 20 tests correctos.
- `release:check` completo correcto tras estos ajustes: validación, 205 archivos/789 tests unitarios, build y presupuesto, 68 pruebas E2E y `npm audit --omit=dev --audit-level=high` sin vulnerabilidades.

## Publicación v1.15.4 de apariencia de espectadores (2026-09-20)

- La migración `20260920100000_add_spectator_invite_appearance.sql` se aplicó en PRE (`miadjotkucgluwbrgeih`) y PROD (`szycbwdzestcmimziyey`). En ambos proyectos `migration list` quedó alineado y `db lint --linked --schema public` no encontró errores.
- El commit `8c47d780` se publicó en PRE como deployment `dpl_GANmaQbvjUR2AfPpJXEuhUKoTTqX`; quedó `Ready` y el alias `https://pre.smashandlob.com` apunta a él. La comprobación autenticada con `vercel curl` devuelve `1.15.4/pre`; la petición HTTP anónima del smoke recibe el `302` de protección SSO previsto.
- El mismo commit se publicó en PROD como deployment `dpl_3L1PsgB2sEW3tDTnzGMkwctj1jKs`; quedó `Ready` y asociado a `https://smashandlob.com`. `vercel curl` devuelve `1.15.4/prod` y `npm run smoke:prod` pasa completo.

## Corrección de acceso al enlace QR de espectadores en PROD (2026-09-20)

- Los logs de PROD mostraron que `/spectate/:code` fallaba al renderizar con `useLeagueAccess must be used inside LeagueAccessProvider`: las rutas públicas omiten deliberadamente los proveedores autenticados, pero la pantalla intermedia todavía intentaba usar ese hook.
- La API de invitaciones resuelve ahora de forma segura si la sesión actual pertenece a la liga (o es superusuario) y devuelve solo el estado `viewerAccess`; la pantalla pública ya no depende de `LeagueAccessProvider`.
- Se añadió una prueba E2E de la pantalla intermedia anónima para evitar que vuelva a aparecer el error genérico “Algo no ha salido bien”.
- Validación focalizada: 17 tests unitarios, 4 E2E de espectadores, ESLint, TypeScript, build de producción y `git diff --check` correctos.
- El commit `0288fbf6` se publicó en PROD como deployment `dpl_FUx4AYwrQSQYADKXuZpYfYwnJS2N`; quedó `Ready` y el alias `https://smashandlob.com` apunta a él. Health check y `smoke:prod` pasan. La ruta real `/spectate/SP-58ZK-GUD9D-FDE3` responde sin el error de proveedor y no aparecen nuevas incidencias `1295237974` en los logs.

## Apariencia de invitación anónima y título de liga en vista pública (2026-09-20)

- En rutas `/spectate/...` sin sesión, `ThemeProvider` deja de reaplicar la preferencia local después de cargar la invitación; la apariencia inmutable del enlace se aplica siempre. Esto evita que un tema claro guardado en el dispositivo anule la apariencia del QR/enlace.
- El título de la liga en la cabecera pública tiene color explícito de alto contraste, también en Classic claro.
- Se añadió cobertura E2E para verificar que la paleta de la invitación se aplica sin sesión y regresión de la pantalla intermedia.
- Validación: 5 tests unitarios de espectadores, 4 E2E de espectadores, ESLint, TypeScript, build de producción y `git diff --check` correctos.
- El commit `58d34da8` está en la rama de trabajo y `origin/staging`. PRE apunta al deployment `dpl_Cppod6KMBmkJkqzxFx6ajBRsgDcV` (`Ready`, commit `58d34da8`) y `/api/health` devuelve `1.15.4/pre`. PROD apunta al deployment `dpl_Afb3nwRyudrCNyTQkiUzBb4pVcz9` (`Ready`, alias `https://smashandlob.com`) y `/api/health`/`smoke:prod` pasan.
