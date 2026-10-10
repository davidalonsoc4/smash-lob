# Auditoría integral de Smash & Lob

## 1. Resumen ejecutivo

Auditoría documental cerrada el 10/10/2026 **CON HALLAZGOS Y BLOQUEOS EXPLÍCITOS**. Examinados 21/21 módulos identificados; registradas **40 incidencias: 0 P0, 10 P1, 27 P2 y 3 P3**. Hay 35 fichas confirmadas en su alcance indicado y cinco probables. No se han corregido errores, modificado datos, hecho commits/push ni desplegado.

Los riesgos prioritarios afectan a privilegios de cuenta, invitaciones, anonimización, operaciones parciales de ligas/temporadas/resultados y herramientas de pruebas. La prueba adicional de calendario tiene cuatro fallos reales. El último npm audit completo falla por dependencias de desarrollo; se detuvieron nuevas ejecuciones y no hay autorización de release. Que build y suites generales pasen no significa que la aplicación esté libre de errores.

## 2. Alcance

Inventario de módulos y rutas, análisis de flujos normales/límites/errores/permisos/datos, reproducciones aisladas, regresión de navegador, revisión de imágenes y contraste de antecedentes. No se autoriza escribir datos reales ni instalar paquetes. Cierre de auditoría significa que la revisión y sus límites quedan documentados; no aceptación funcional global ni comprobación de todas las combinaciones posibles.

## 3. Estado auditado

10/10/2026 Europe/Madrid. v1.15.9; commit 6fa8c72ed0d6be3077e5285f7a987a3e3a5369ea; PRE publicado en b6212a007cac7ae1f7a0b809b9953e561836edc0. Código funcional equivalente; documentación posterior separada.

## 4. Inventario y arquitectura

Next.js App Router 16.3.8 (lockfile), React 19.2.8, TypeScript, Tailwind 4, Auth.js/Google, Supabase PostgreSQL con cliente server service_role y autorización de aplicación. Providers cliente mantienen snapshots/cachés y contexto liga/temporada. PWA con service worker, Web Push, QR, calendarios ICS/Google y exportaciones de documentos. Vitest y Playwright/Axe. 70 páginas y 96 endpoints inventariados; detalle íntegro en auditoria-evidencias/inventario-repositorio.json. Módulos en AUDITORIA_PROGRESO.md.

## 5. Resultados generales

| Indicador | Resultado |
|---|---:|
| Incidencias críticas P0 del proyecto | 0 |
| Altas P1 | 10 |
| Medias P2 | 27 |
| Bajas P3 | 3 |
| Total de fichas | 40 |
| Confirmadas en el alcance de cada ficha | 35 |
| Probables, pendientes de validación completa | 5 |
| Fichas de origen histórico persistente | 3 |
| Fichas nuevas | 37 |
| Elementos históricos resueltos en alcance indicado | 37 |
| Elementos históricos pendientes | 18 |
| Elementos históricos obsoletos/no defectos | 6 |
| Elementos históricos persistentes | 3 |
| Módulos examinados | 21/21 (100 % del inventario modular) |
| Módulos con alguna comprobación adicional limitada/bloqueada | 21 |

Los 64 elementos históricos son una matriz de antecedentes, no 64 bugs adicionales. Los cinco probables son BUG-010/011/012/024/035. BUG-005 confirma aceptación/construcción de petición pero deja alcance de red SSRF pendiente; BUG-040 confirma dependencias afectadas, sin explotación demostrada. Otros confirmados conservan límites de UI, PostgreSQL o datos reales en su ficha: «confirmado» no significa reproducido en Producción.

El 100 % se refiere a módulos examinados mediante sus flujos y pruebas disponibles. **No es 100 % de pantallas navegadas, archivos leídos línea por línea, cobertura de código, combinaciones visuales ni funcionalidad real ejecutada.** Inventario: 70 páginas/96 API. La fuente de cada comprobación y sus límites está en los informes modulares de auditoria-evidencias y AUDITORIA_PROGRESO.md.

## 6. Incidencias históricas revalidadas

Matriz individual: [antecedentes-revalidados.md](auditoria-evidencias/antecedentes-revalidados.md), 47 puntos visuales V01 + seis funcionales V02 + once de v1.15.4. Reconciliados además Competition oscuro, validación React effects, checklists v1/v1.1/v1.2.11, QA v1.15.4 y hardening histórico sin duplicar fichas.

Persisten contratos de cuenta (BUG-002/003, agrupados en un antecedente), cursor compuesto de actividad (BUG-039) y versión del README (BUG-038). Votos con guardado, merge parcial cliente, selector de calendario amistoso, nombres con colisión e hidratación inicial siguen correctos dentro de pruebas actuales. Las 18 revalidaciones pendientes se conservan como tales, especialmente visual ampliado/dispositivos/servicios reales.

## 7–10. Incidencias nuevas, funcionales, visuales, seguridad y datos

Fichas BUG-001..040 al final, con reproducción, alcance, archivos, evidencia y propuesta sin implementar. Índice por módulo/pantalla en auditoria-evidencias/resumen-incidencias.md y copia estructurada en incidencias.json.

Errores funcionales/datos: 002–004, 006–007, 010–033, 035, 037 y 039. Seguridad/privacidad: 001–005, 008–009, 040 y cruces con operaciones parciales. Accesibilidad: 034/036. Documentación: 038. Las categorías se solapan deliberadamente; no sumarlas para calcular total.

No se añaden como bugs confirmados apreciaciones estéticas sin medición, altura de páginas capturadas, la barra fija dentro de fullPage, el icono Next Dev Tools, la versión normalizada de snapshots o límites de la herramienta. Observaciones y mejoras de diseño separadas en M16-M21-revision.md.

## 11. Pruebas y resultados

| Comprobación nueva | Resultado / evidencia |
|---|---|
| npm run validate aislado | Exit 0; 219 archivos / 858 pruebas, TypeScript/build, seguridad/i18n/dominio, 0 errores ESLint y 4 avisos heredados; validate-auditoria.log. |
| Lint dirigido tras sincronizar componentes | Exit 0; evidencia de sincronización y M01-M02-revision.md. |
| Playwright completo con placeholders/mocks | 76/76, sin actualizar snapshots; playwright-auditoria.log. Móvil/escritorio/Axe y offline; no cuentas reales. |
| Reproducciones/controles adicionales | 37/37 correctas: 32 pruebas que reproducen hallazgos, cuatro controles y un diagnóstico del guard PWA (035). No son 37 pruebas de que los bugs estén corregidos. Logs individuales y .test.ts.txt. |
| Barrido adicional de calendario | 102 escenarios dentro de un test: 98 correctos y 4 fallos, exit 1; calendario-barrido.json/log, BUG-020. |
| npm audit --omit=dev --json | Exit 0; cero avisos, npm-audit-runtime.json. |
| npm audit --json | **Exit 1**; 13 paquetes afectados: 2 critical, 10 high, 1 moderate; npm-audit-completo.json, BUG-040. No se equipara severidad de paquete a P0 del proyecto. |
| Presupuesto build | 1.181.274 bytes gzip / 102 chunks; dentro del límite existente. |
| Integridad / diff | 924 archivos funcionales contrastados, HEAD inicial; ver integridad-checkpoint.json y cierre-validacion.json. Sin correcciones ni snapshots alterados. |

PostgreSQL/pgTAP, restore y Lighthouse de CI inmediatamente anterior al encargo se conservan como **evidencia histórica** de código funcional equivalente; no se presentan como ejecución nueva. La consulta npm es actual y puede diferir del registro histórico. Tras el fallo completo de seguridad solo se cerró documentación/lectura, sin nuevas ejecuciones de código de pruebas o publicación.

## 12. Pendientes y bloqueos

| Bloqueo / pendiente | Motivo y alcance |
|---|---|
| OAuth Google, roles/cuentas reales y mutaciones PRE | Prohibido modificar datos reales. localhost:3000 apunta a PRE y GET auth/access pueden hacer upserts/iniciar temporadas. No se utiliza la sesión personal del navegador como prueba aislada. |
| Recorrido visual nuevo de cada pantalla y variante | Dos arranques aislados adicionales rechazados por revisión automática, sin causa concreta informada; no se elude. Disponibles seis capturas nuevas y diez referencias abiertas manualmente, contrastadas por suite nueva; cobertura completa de temas/acentos/texto/375/390/orientaciones no certificada. |
| PostgreSQL nuevo / concurrencia real / RLS desplegada | Docker no disponible y tareas requieren instalación/arranque con efectos no autorizados. Dobles en memoria confirman patrón de operaciones, no aislamiento PostgreSQL. BUG-024 sigue probable. |
| Lighthouse nuevo y carga/volumen | Script instala con npx; instalación no autorizada. Se conserva CI anterior y presupuesto build nuevo, sin fingir medición real nueva de Web Vitals. |
| Realtime y Push físico | Requieren dos identidades/dispositivos y servicios reales; no se envían notificaciones ni cron. Latencia localhost/PRE no diagnosticada con medición real. |
| PWA física, borradores y lectores de pantalla | Chromium offline pasa, pero iOS/Android, actualización instalada y BUG-035 necesitan reproducción física/controlada. BUG-034/036 sí tienen DOM aislado. |
| Calendarios/Excel/impresión | Generación/descarga/mock A4 cubiertos; importación en aplicaciones externas e impresión física no comprobadas. |
| Dependencias de herramientas | npm audit completo falla; corregir/disponer BUG-040 requiere autorización de fase de corrección. No nuevas pruebas, builds o publicación tras detectar el fallo. |

Histórico visual del 9/10 (88 visitas/72 rutas o variantes) se reutiliza solo como antecedente identificado, no como recorrido nuevo. No hay comprobación de Producción en vivo ni dictamen legal.

## 13. Recomendaciones

1. Resolver primero límites de confianza: evitar reescritura de privilegios en auth (001), revisar acceso de invitación (008/009), destino Push (005) y cuenta/exportación/anonimización (002–004). Disponer herramientas vulnerables (040) antes de más ejecuciones sensibles.
2. Agrupar operaciones de negocio en transacciones/idempotencia y probar fallo en cada paso: ligas, temporada alta/inicio/borrado/duplicación, resultado/confirmaciones/incidencias (013–019, 023–025, 037). Revisar concurrencia PostgreSQL en entorno nuevo aislado, especialmente 024.
3. Corregir contratos de espera/calendario/coordinación/pagos/ranking: 006–012, 017, 020–022, 026–032, 039. Unificar modelos entre liga y amistosos y conservar identidades al cambiar plantilla.
4. Comprobar errores de persistencia y recuperación en cola Push (033); distinguir consulta vacía, entrega y confirmación; revisar diferencias de reintento entre liga/amistosos.
5. Idioma del documento y foco modal (034/036), conservación de borradores PWA (035), céntimos/posiciones/copy (029/031/038). Completar visual ampliado e integraciones bloqueadas antes de aceptación de producto.

Orden propuesto para una fase posterior, no ejecutado. Mantener commits pequeños por dominio cuando el usuario autorice corregir. No alterar migraciones ya aplicadas, force push ni usar correcciones forzadas de dependencias.

## 14. Balance priorizado

**Prioridad alta:** BUG-001, 003, 005, 008, 014, 016, 023, 024 (probable), 037 y 040. Riesgos de privilegios, exposición, privacidad, estado parcial, validación deportiva y herramientas. Ningún P0 demostrado; no se afirma una explotación real.

**Prioridad media:** 27 incidencias de contratos, concurrencia, coordinación, pagos, datos y accesibilidad; revisar índice por pantalla para agrupar trabajo. **Prioridad baja:** 029 céntimos, 031 posiciones empatadas y 038 README.

Auditoría cerrada con los bloqueos documentados. No se declara la aplicación íntegramente validada, lista para publicar ni libre de problemas. El trabajo se detiene en documentación; cualquier corrección, instalación, escritura real, commit o despliegue necesita autorización expresa posterior.

## Fichas de incidencias

### BUG-001 — El guard de autenticación puede restaurar privilegios o datos de perfil revocados concurrentemente

- Categoría: Seguridad / carrera de datos.
- Gravedad: **P1**. Confirmación: CONFIRMADO en reproducción aislada; no probado contra datos reales.
- Origen: Nuevo. Módulo: M01/M02.
- Ruta/pantalla: Cualquier API autenticada que invoca requireAuthenticatedAppUser.
- Archivos: `src/lib/serverAuth.ts:54`, `src/lib/serverAuth.ts:86`.

Cada petición lee app_users y hace upsert de numerosos campos, incluidos is_superuser y can_create_leagues. Una revocación o cambio de perfil posterior a esa lectura puede ser sobrescrito por el snapshot anterior.

**Reproducción segura:**

1. Mock de auth con cuenta ficticia y cliente Supabase en memoria.
2. maybeSingle devuelve copia con is_superuser=true; inmediatamente la operación administrativa simulada revoca el rol.
3. Ejecutar el helper real requireAuthenticatedAppUser.
4. El upsert vuelve a persistir is_superuser=true.

**Esperado:** La lectura autenticada no revierte una modificación administrativa concurrente.

**Observado:** Se restaura el privilegio previo y el actor autenticado lo recibe.

**Evidencia:** cuenta-reproducciones.test.ts.txt, caso BUG-001; cuenta-reproducciones.log (4/4).

**Causa:** Demostrada: patrón lectura + upsert de snapshot sin bloqueo/compare-and-swap.

**Solución propuesta, NO implementada:** Separar creación/sincronización mínima de cuenta del acceso; nunca reescribir privilegios en el guard. Actualizaciones de identidad explícitas/atómicas.

**Dependencias:** Transversal; afecta coherencia de M01/M02 y a cualquier endpoint protegido.

### BUG-002 — La exportación personal omite membresías y temporadas al confundir ID de cuenta e ID de jugador

- Categoría: Funcional / privacidad / exportación.
- Gravedad: **P2**. Confirmación: CONFIRMADO con handler real y datos aislados.
- Origen: Nuevo. Módulo: M01/M15.
- Ruta/pantalla: /settings, GET /api/account/export.
- Archivos: `src/app/api/account/export/route.ts:17`.

league_memberships se filtra por player_id=user.id, aunque user_id es el vínculo de cuenta y player_id pertenece a players. season_players repite la confusión y tampoco resuelve los IDs de jugador vinculados.

**Reproducción segura:**

1. Simular user.id=user-qa y membresía {user_id:user-qa,player_id:player-qa}.
2. Ejecutar GET real con cliente falso que aplica el filtro recibido.
3. Inspeccionar exportación y consultas.

**Esperado:** Se exportan las membresías propias y los season_players asociados a sus IDs de jugador.

**Observado:** Respuesta 200 con memberships vacío; consulta player_id=user-qa. La inspección demuestra el mismo filtro incorrecto en season_players.

**Evidencia:** cuenta-reproducciones.test.ts.txt, BUG-002; cuenta-reproducciones.log.

**Causa:** Demostrada: columna/identificador incorrectos; ownRows oculta además fallos de consulta devolviendo [].

**Solución propuesta, NO implementada:** Filtrar membresías por user_id; resolver jugadores propios antes de consultar temporadas; distinguir error y ausencia de registros.

**Dependencias:** No depende de BUG-001 para reproducirse.

### BUG-003 — Eliminar cuenta declara anonimización completa aunque conserva identidad asociada o fallen borrados auxiliares

- Categoría: Privacidad / integridad de operación.
- Gravedad: **P1**. Confirmación: CONFIRMADO en handler aislado para borrados fallidos y tablas omitidas; alcance de identidad retenida demostrado por código, sin inspeccionar cuentas reales.
- Origen: Histórico: compromiso de borrado integral de auditoría v1.15.4 no satisfecho. Módulo: M01/M02/M14.
- Ruta/pantalla: /settings, POST /api/account/delete.
- Archivos: `src/app/api/account/delete/route.ts:17`, `src/app/settings/page.tsx:280`, `docs/production-hardening/V1_15_4_HARDENING_AUDIT.md`.

La operación borra tres tablas y cambia parcialmente app_users. Ignora los errores de Promise.all, no anonimiza players/instantáneas históricas ni chats, no elimina membresías o gestiona propiedad de ligas, no exige reautenticación reciente y deja la sesión al usuario. No se afirma infracción legal; se documenta la discrepancia con el mensaje y contrato del producto.

**Reproducción segura:**

1. Dobles de las tres operaciones delete devuelven error; actualización app_users tiene éxito.
2. Invocar POST real con confirmación en castellano.
3. Registrar tablas tocadas y respuesta.

**Esperado:** La operación informa del fallo parcial y solo declara completado el alcance realmente anonimizado; cuenta con un flujo coherente para vínculos y sesión.

**Observado:** 200 {ok:true} aunque fallan los borrados; solo se tocan push_subscriptions, notification_preferences, notification_reads y app_users. La UI anuncia cuenta anonimizada.

**Evidencia:** cuenta-reproducciones.test.ts.txt, BUG-003; log; lista de escrituras del handler y contrato histórico.

**Causa:** Demostrada: resultados auxiliares ignorados y operación no transaccional/incompleta. La explotación de sesión o reidentificación en datos reales NO se ha intentado.

**Solución propuesta, NO implementada:** Definir anonimización integral e idempotente en transacción, comprobar errores y propiedad de ligas, reautenticar y terminar sesión. Verificar snapshots y participantes preservando resultados deportivos.

**Dependencias:** Puede interactuar con BUG-001 si otra petición autenticada está en vuelo; no se necesita esa carrera para observar éxito falso.

### BUG-004 — La confirmación de eliminación en inglés/euskera se rechaza silenciosamente

- Categoría: Funcional / i18n.
- Gravedad: **P2**. Confirmación: CONFIRMADO por evaluación de condición y traducciones actuales; pendiente captura UI.
- Origen: Nuevo. Módulo: M01/M17.
- Ruta/pantalla: /settings → Mis datos → Eliminar mi cuenta.
- Archivos: `src/app/settings/page.tsx:269`, `src/i18n/leagueText.ts:4025`, `src/i18n/leagueText.ts:4913`.

El prompt pide DELETE MY ACCOUNT o KONTUA EZABATU; el callback solo acepta ELIMINAR MI CUENTA y retorna sin aviso. El servidor también exige esa clave en castellano.

**Reproducción segura:**

1. Seleccionar EN o EU.
2. Pulsar eliminar y escribir el texto indicado por el prompt.
3. La condición fija compara un valor diferente y retorna antes de fetch.

**Esperado:** La confirmación indicada por la interfaz se acepta y se envía una clave interna normalizada.

**Observado:** La frase indicada en EN/EU siempre falla la comparación y no inicia la operación.

**Evidencia:** cuenta-reproducciones.test.ts.txt, BUG-004; traducciones y callback real; no se envió petición de borrado.

**Causa:** Demostrada: localización del prompt sin localización/normalización de su validación.

**Solución propuesta, NO implementada:** Separar texto visible localizado de confirmación interna, mostrar validación explícita y probar los tres idiomas.

**Dependencias:** El fallo impide alcanzar BUG-003 en EN/EU siguiendo las instrucciones visibles.

### Evidencia adicional de esquema para BUG-002 y BUG-003

La migración base `supabase/migrations/20260714155912_initial_remote_schema.sql:279` define `notification_preferences.user_email`; `:322` define `push_subscriptions.user_email`. Ninguna de estas tablas tiene `user_id` en las migraciones del repositorio. Los handlers de exportación y eliminación usan precisamente esa columna inexistente. Por tanto, además de los IDs de jugador incorrectos en la exportación, las consultas de preferencias y suscripciones fallan y se convierten silenciosamente en listas vacías. La eliminación ignora los errores de esos dos borrados y puede devolver éxito después de actualizar `app_users`.

Esta conclusión contrasta código y esquema versionado; no se han consultado ni modificado filas reales. La comprobación de divergencias del esquema desplegado queda fuera de esta demostración. No se ha probado la entrega de Push posterior al borrado ni se afirma que haya ocurrido.

### BUG-005 — Suscripciones Push aceptan destinos HTTPS internos arbitrarios

- Categoría: Seguridad / destino de petición servidor.
- Gravedad: **P1**. Confirmación: CONFIRMADO el almacenamiento y la construcción de petición al destino; PROBABLE alcance SSRF, pendiente comprobar restricciones de red.
- Origen: Nuevo. Módulo: M02/M14.
- Ruta: POST /api/notifications/subscribe; despacho y reintento Push.
- Archivos: `src/app/api/notifications/subscribe/route.ts:19`, `src/lib/serverPushRetry.ts:99`, `src/lib/serverPushDispatch.ts`; implementación instalada de web-push `src/web-push-lib.js:348`.

Un miembro autenticado puede registrar como endpoint cualquier cadena no vacía. No se valida esquema, host, IP privada ni proveedor Push. El dispatcher utiliza ese endpoint como destino de web-push; la dependencia copia hostname/port/path de la URL a https.request.

**Reproducción segura:** invocar el handler real con Supabase en memoria, una suscripción criptográficamente válida generada para la prueba y endpoint `https://127.0.0.1:9443/audit-no-request`. Respuesta 200 y endpoint conservado. `webPush.generateRequestDetails` prepara un POST al mismo destino sin efectuar red.

**Esperado:** rechazar destinos incompatibles con la política de servicios Push antes de almacenarlos; impedir acceso a direcciones internas durante el envío.

**Observado:** destino de loopback aceptado y petición construida. No se ha enviado esa petición, provocado un evento real ni probado acceso a metadatos/red interna. Autenticación de miembro limita el actor; no es un endpoint anónimo.

**Evidencia:** `seguridad-reproducciones.test.ts.txt` y `seguridad-reproducciones.log` (1/1), handler y dependencia instalada. No se imprime material criptográfico de prueba.

**Causa:** validación limitada a presencia de cadenas; despacho confía en el destino almacenado. Restricciones de red de Vercel y comportamiento de TLS no comprobados; limitan el alcance potencial.

**Solución propuesta, NO aplicada:** validar URL y proveedores/destinos permitidos, excluir IPs internas y resolver de forma segura al enviar; limitar registro/envío y probar errores de suscripción.

**Dependencias:** requiere miembro y una ocasión de despacho. Revisión de reintentos y eventos continúa en M14. No depende de BUG-001.

### BUG-006 — La lista de espera muestra posición 1 a cualquier jugador

- Categoría: Funcional / información de inscripción. Gravedad: **P2**. Estado: **CONFIRMADO**, nuevo; M04.
- Ruta: GET /api/leagues/[id]/seasons/[seasonId]/waitlist; sala de espera de temporada.
- Archivos: `src/app/api/leagues/[id]/seasons/[seasonId]/waitlist/route.ts:18`, `src/components/season/SeasonRosterWaitingRoom.tsx:300`.
- Explicación: para un jugador se filtran las filas por su user_id antes de calcular el índice en la cola. Su única fila tiene índice cero aunque el orden global sea tercero, cuarto, etc. La UI consume payload.position, no la posición de la fila.
- Reproducción: handler real con tres usuarios ficticios en posiciones 1, 2 y 3; actuar como el tercero, sin admin. La respuesta contiene items[0].position=3 y position=1.
- Esperado: posición real entre las entradas waiting, sin revelar identidades ajenas. Observado: posición 1.
- Evidencia: `ligas-espera-reproducciones.test.ts.txt` y log, caso BUG-006. Causa demostrada: findIndex posterior al filtro de identidad.
- Propuesta, no aplicada: calcular rango/count seguro antes de filtrar la proyección privada; probar altas, bajas y reordenación.
- Dependencias: contrato FIFO/posición visible de auditoría v1.15.4; no altera por sí mismo el orden de promoción.

### BUG-007 — Salir de la lista de espera impide volver a entrar

- Categoría: Funcional / persistencia de inscripción. Gravedad: **P2**. Estado: **CONFIRMADO en reproducción aislada y esquema**, nuevo; M04.
- Rutas: POST y DELETE /api/leagues/[id]/seasons/[seasonId]/waitlist.
- Archivos: `src/lib/serverSeasonWaitlist.ts:57`, `supabase/migrations/20260919123000_add_season_waitlist.sql:10`, `src/components/season/SeasonRosterWaitingRoom.tsx:174`.
- Explicación: salir conserva la fila con status=cancelled; el siguiente alta hace upsert con ignoreDuplicates=true sobre UNIQUE(season_id,user_id). El conflicto se ignora y no reactiva la fila. La API puede devolver ok con entry=null y la UI mostrar éxito temporal.
- Reproducción: una fila ficticia cancelled y un cliente que reproduce ON CONFLICT DO NOTHING; ejecutar joinSeasonWaitlist real. No cambia el estado y devuelve null sin error.
- Esperado: permitir reincorporación al final de la cola o informar explícitamente de una prohibición. Observado: permanece cancelled, aunque no se informa fallo.
- Evidencia: `ligas-espera-reproducciones.test.ts.txt`/log, BUG-007; esquema UNIQUE y controles de salir/entrar. La semántica de conflicto se simuló, no se ejecutó PostgreSQL local.
- Causa demostrada: cancelación lógica combinada con ignoreDuplicates. Propuesta, no aplicada: transición atómica condicionada cancelled→waiting con nueva posición; alta ya waiting idempotente y promoción protegida.
- Dependencias: cola y promoción M04/M14; también puede afectar a solicitudes que hayan expirado y queden cancelled.

### BUG-008 — Un código de invitación incorrecto permite leer una liga con su UUID

- Categoría: Seguridad / autorización de lectura. Gravedad: **P1**. Estado: **CONFIRMADO con handler real aislado**, nuevo; M02/M03.
- Ruta: GET /api/invites/WRONG-CODE?leagueId=<uuid de liga>.
- Archivo: `src/app/api/invites/[code]/route.ts`, función fetchLeagueByInviteCode, retorno final hintedLeague.
- Explicación: después de comprobar que el código no coincide ni existe invitación activa, la función devuelve igualmente la liga consultada por leagueId. El endpoint público no exige sesión. El UUID sustituye en la práctica la comprobación del código.
- Reproducción: base en memoria con una liga privada y código VALID-CODE, sin filas invites; llamar al GET real con WRONG-CODE y leagueId correcto. No se invoca autenticación y se obtiene 200 con snapshot, partidos, pagos y notas de incidencia ficticios.
- Esperado: 404/snapshot null para código incorrecto o revocado. Observado: snapshot completo de liga ajena.
- Evidencia: `ligas-espera-reproducciones.test.ts.txt`/log, BUG-008/009. No se han enumerado UUIDs ni consultado ligas reales.
- Causa demostrada: fallback a hintedLeague tras agotar todas las validaciones negativas. Propuesta, no aplicada: denegar cuando no exista coincidencia activa y probar código erróneo/revocado con hint válido.
- Dependencias: alcance agravado por BUG-009. Corregir solo el DTO no restablece la validación del código.

### BUG-009 — La previsualización pública de invitación incluye pagos y notas de incidencias

- Categoría: Privacidad / minimización de respuesta. Gravedad: **P2**. Estado: **CONFIRMADA la exposición**, alcance deseado del producto pendiente; nuevo; M03/M07/M11.
- Ruta: GET /api/invites/[code], incluso con código válido y sin sesión.
- Archivos: `src/app/api/invites/[code]/route.ts:210`, `src/lib/supabaseMatches.ts:14`, mapSupabaseMatch.
- Explicación: se devuelve la colección completa de matches de todas las temporadas mediante el mapper interno. Incluye incidentReason/incidentNotes y courtBooking con pagadores, importes y transferencias; seasonSettings incorpora registrationFee. No es la proyección limitada del espectador público.
- Reproducción: GET real con VALID-CODE y datos ficticios con nota QA-private-note y reserva 24; ambos aparecen en el JSON sin sesión.
- Esperado propuesto: previsualización de invitación limitada a identidad de liga y plazas/requisitos necesarios para incorporarse; confirmar con producto cualquier dato adicional deliberadamente público. Observado: información operativa privada antes de aceptar/iniciar sesión.
- Evidencia: reproducción BUG-008/009 en `ligas-espera-reproducciones.test.ts.txt` y log; datos exclusivamente ficticios. No se afirma exposición real de datos médicos ni obligación legal concreta.
- Causa demostrada: reutilización de matchSelect/mapper interno sin DTO de invitación. Propuesta, no aplicada: DTO mínimo y pruebas negativas de campos; revisar temporadas progresivas y cuota por jugador.
- Dependencias: existe también con código válido, por lo que sobrevive a corregir BUG-008. Política exacta de datos de invitación requiere decisión del usuario.

### BUG-010 — La promoción de lista de espera no se reconoce en la sala de espera

- Categoría: Funcional / identificación de usuario. Gravedad: **P2**. Estado: **PROBABLE por trazado de contratos; pendiente reproducción visual**, nuevo; M04.
- Pantalla: sala de espera → confirmar plaza ofrecida.
- Archivos: `src/app/api/access/route.ts:592`, `src/components/season/SeasonRosterWaitingRoom.tsx:120`, API waitlist GET.
- Explicación: access serializa el userId de la membresía propia como email; waitlist devuelve user_id UUID. El componente busca item.user_id === membership.userId. La entrada promovida no coincide, setIsPromoted(false) y no aparece el bloque de confirmar, aunque el servidor ofrece una plaza.
- Reproducción prevista: miembro realista ficticio con membership.userId=qa@example.test y fila promoted user_id=UUID; cargar respuesta y observar bloque. Contratos y comparación comprobados; ejecución de la UI adicional bloqueada por arranque aislado rechazado.
- Esperado: mostrar la promoción propia y permitir confirmar dentro de las 48 h. Observado por código: igualdad UUID/email imposible; pendiente captura, no se hizo promoción real.
- Evidencia: fuentes citadas y `M01-M02-revision.md` para bloqueo visual. Causa probable: mezcla de identificadores de cuenta entre API y contexto cliente.
- Propuesta, no aplicada: devolver ownEntry/isOwn o identificador de cuenta estable, y probar los estados waiting/promoted/cancelled con contrato realista.
- Dependencias: BUG-006 afecta al mismo componente, pero la promoción tiene position=null y no se resuelve corrigiendo solo el cálculo de posición.

### BUG-011 — Una plaza ofrecida en lista de espera puede ser ocupada por otra inscripción

- Categoría: Funcional / concurrencia de aforo. Gravedad: **P2**. Estado: **PROBABLE; pendiente validación PostgreSQL aislada**, nuevo; M04.
- Ruta: baja de plantilla → promoción; registro ordinario y confirmación de promoción.
- Archivos: API registration DELETE/POST; `src/lib/serverSelfRegistration.ts`; última definición de server_join_self_registration_season_v2 en migración `20260803160000_add_league_avatars_and_restore_unlinked_identity.sql:177`.
- Explicación: la baja marca una entrada promoted y da 48 horas, pero no ocupa/reserva aforo. La RPC de inscripción ordinaria cuenta season_players activos y no consulta promociones. Otra cuenta puede llenar esa plaza antes de la confirmación.
- Reproducción prevista: liberar una plaza con A esperando, promover A, registrar B antes de que A confirme; A encuentra roster_full. Trazado de código/SQL hecho, no se ejecutó el escenario en una base.
- Esperado propuesto: proteger la prioridad ofrecida durante su plazo o aclarar expresamente que no reserva plaza. Observado por código: no existe comprobación de promociones en la RPC vigente. Política exacta de reserva requiere confirmación de producto.
- Evidencia: API registration:188–206; RPC indicada: conteo de activos y condición v_count >= player_capacity. PostgreSQL local bloqueado por Docker/instalación no disponible en este alcance.
- Causa probable: promoción y aforo administrados por procesos distintos sin reserva. Propuesta, no aplicada: reserva transaccional con caducidad y control de acceso al cupo.
- Dependencias: BUG-010 puede ocultar el ofrecimiento; no demuestra que este escenario haya ocurrido en PRE.

### BUG-012 — La caducidad de una promoción no hace avanzar automáticamente la cola

- Categoría: Funcional / ciclo de lista de espera. Gravedad: **P2**. Estado: **PROBABLE por revisión de todos los consumidores; pendiente escenario temporal**, nuevo; M04/M14.
- Rutas: waitlist/confirm, registration DELETE y cron de notificaciones.
- Archivos: API waitlist/confirm:22; búsquedas de season_waitlist/confirmation_expires_at en src y migraciones.
- Explicación: la fecha de 48 h solo se evalúa cuando el propio usuario intenta confirmar. Ese camino cancela la entrada y retorna 409, sin promover al siguiente. No se encontró un procesador de expiraciones en el cron ni en otro consumidor.
- Reproducción prevista: dejar caducar una promoción con otra persona waiting; ejecutar el ciclo programado en entorno aislado y comprobar avance. No se adelantó reloj ni ejecutó cron real. En el código, cancelación al confirmar no contiene una promoción posterior.
- Esperado propuesto: al vencer una oferta, liberar y ofrecer al siguiente según FIFO; verificar decisión de producto sobre automatización. Observado: no hay avance identificado y la oferta puede permanecer promoted indefinidamente si nadie confirma.
- Evidencia: trazado completo de referencias season_waitlist en src, handler de confirmación y cola. Ausencia en búsquedas complementa la revisión, no certifica automatizaciones externas no versionadas.
- Causa probable: ciclo temporal incompleto. Propuesta, no aplicada: procesador idempotente de caducidades/promociones y pruebas de reloj.
- Dependencias: M14; revisar junto a BUG-007/010/011 sin confundir posición visible con orden real.

### BUG-013 — Un fallo al crear la membresía deja una liga creada tras responder error

- Categoría: Integridad / creación parcial. Gravedad: **P2**. Estado: **CONFIRMADO con handler aislado**, nuevo; M03.
- Ruta: POST /api/leagues.
- Archivo: `src/app/api/leagues/route.ts:190`.
- Explicación: se inserta leagues antes de league_memberships e invites. Si falla uno de los pasos posteriores, catch responde 500 sin transacción ni compensación. Para un creador ordinario puede quedar una liga sin su acceso de creador.
- Reproducción: handler real, cuenta ficticia canCreateLeagues=true, persistencia en memoria de leagues y error simulado al insertar membresía. Responde 500 y conserva la liga.
- Esperado: creación íntegra o ningún recurso persistido; error recuperable sin duplicados al reintentar. Observado: fila de liga conservada y membresía ausente.
- Evidencia: `alta-liga-reproducciones.test.ts.txt` y log (1/1). No se creó una liga real.
- Causa demostrada: secuencia de escrituras independientes sin rollback. Propuesta, no aplicada: RPC transaccional de alta o compensación verificada e idempotencia.
- Dependencias: creación de ubicaciones globales también precede a la liga; no se atribuye corrupción de esas ubicaciones sin prueba.

### BUG-014 — El borrado de una temporada puede perder partidos y dejar la temporada intacta

- Categoría: Integridad / eliminación parcial. Gravedad: **P1**. Estado: **CONFIRMADO con helper aislado**, nuevo; M04/M06.
- Ruta: DELETE /api/leagues/[id]/seasons/[seasonId].
- Archivo: `src/lib/serverSeasonMutations.ts:1014`, deleteServerSeason.
- Explicación: borra matches, season_players, settings y seasons en peticiones independientes. Un error en el segundo paso deja partidos borrados y el resto conservado. El endpoint informa error, pero no restaura los datos anteriores.
- Reproducción: helper real con almacenamiento en memoria; borrado de matches correcto y error al borrar season_players. Se lanza season_delete_players_failed y matches permanece vacío.
- Esperado: atomicidad del borrado de competición; fallo sin pérdida parcial. Observado: temporada/plantilla conservadas sin sus partidos.
- Evidencia: `ciclo-temporada-reproducciones.test.ts.txt` y log (2/2). No se borraron datos reales ni se ejecutó DELETE sobre PRE.
- Causa demostrada: ausencia de transacción/compensación. Propuesta, no aplicada: una operación SQL transaccional con validación de liga/temporada y verificación de claves dependientes.
- Dependencias: autorización previa sí valida admin y temporada mutable; el defecto es consistencia tras error, no permiso anónimo.

### BUG-015 — Borrar una temporada cambia la temporada activa aunque se elimine otra

- Categoría: Funcional / selección y estado de liga. Gravedad: **P2**. Estado: **CONFIRMADO con helper aislado**, nuevo; M04.
- Ruta: DELETE temporada, incluida una upcoming mientras existe otra active.
- Archivo: `src/lib/serverSeasonMutations.ts:1058`, deleteServerSeason.
- Explicación: al terminar siempre selecciona una temporada con limit(1) sin orden y sobrescribe leagues.active_season_id, sin comprobar si apuntaba a la eliminada. Puede elegir una finished antigua y desplazar a la active que permanece.
- Reproducción: liga con active_season_id=qa-active; eliminar una tercera temporada. Cliente en memoria devuelve como primer fallback qa-old-finished. El helper actualiza la liga a esa temporada antigua.
- Esperado: conservar la activa si no se elimina; si se elimina, resolver fallback determinista según reglas. Observado: selección antigua impuesta y devuelta al cliente.
- Evidencia: `ciclo-temporada-reproducciones.test.ts.txt`/log, BUG-015. La elección concreta del primer registro de PostgreSQL no está garantizada; esa falta de orden forma parte del problema.
- Causa demostrada: actualización incondicional y selección sin orden. Propuesta, no aplicada: actualizar solo si la liga apunta a la eliminada y priorizar estado/fecha de forma explícita.
- Dependencias: distinto de BUG-014; se reproduce con todos los borrados exitosos.

### BUG-016 — Un fallo al iniciar una temporada deja cerrada la anterior

- Categoría: Integridad / ciclo de temporada. Gravedad: **P1**. Estado: **CONFIRMADO con helper aislado**, nuevo; M04.
- Ruta: inicio de temporada; archivo src/lib/serverSeasonMutations.ts, startServerExistingSeason.
- Descripción: en plantilla fija se finalizan las temporadas activas antes de activar la solicitada; son escrituras independientes.
- Reproducción: helper real con cliente en memoria; cierre anterior exitoso y error al activar la nueva. Lanza season_start_failed y la anterior sigue finished.
- Esperado: transición íntegra o conservación del estado previo. Observado: ninguna de las dos queda activa tras el fallo simulado.
- Evidencia: ciclo-temporada-reproducciones.test.ts.txt y log (3/3). Sin escrituras reales.
- Causa: ausencia de transacción. Propuesta no aplicada: transición SQL atómica con validación del estado y actualización de active_season_id.
- Dependencias: distinta acción de BUG-014; comprobar también el inicio programado en M14.

### BUG-017 — Duplicar una temporada pierde su duración personalizada

- Categoría: Funcional / duplicación. Gravedad: **P2**. Estado: **CONFIRMADO con helper aislado**, nuevo; M04/M05.
- Ruta: duplicación; archivo src/lib/serverSeasonDuplication.ts:285, duplicateServerSeason.
- Descripción: se lee total_rounds de origen, pero el cálculo y generación nuevos omiten targetRoundCount y aplican el valor predeterminado del modo.
- Reproducción: duplicar con helper real una temporada extended finalizada de 14 jugadores y 10 jornadas. La nueva tiene 28 jornadas.
- Esperado: conservar la duración de la temporada duplicada o solicitar explícitamente otra. Observado: cambio silencioso a 28.
- Evidencia: duplicacion-reproducciones.test.ts.txt, caso 1; log 3/3. Persistencia ficticia en memoria.
- Causa: omisión del parámetro de duración. Propuesta no aplicada: trasladar y validar la duración de origen en cálculo/generación.
- Dependencias: calendario de duración flexible; no modifica resultados históricos.

### BUG-018 — Dos duplicaciones concurrentes pueden crear dos próximas temporadas

- Categoría: Concurrencia / integridad. Gravedad: **P2**. Estado: **CONFIRMADO en memoria; concurrencia PostgreSQL pendiente**, nuevo; M04.
- Ruta y archivo: duplicación, src/lib/serverSeasonDuplication.ts.
- Descripción: comprobar que no hay upcoming e insertarla son operaciones separadas; no se encontró una restricción equivalente en las migraciones versionadas.
- Reproducción: dos llamadas reales concurrentes con Promise.all, origen finalizado y 8 jugadores, cliente compartido en memoria. Ambas terminan y persisten dos upcoming.
- Esperado: una creación y un rechazo upcoming_season_already_exists, coherente con el control secuencial existente. Observado: dos éxitos.
- Evidencia: duplicacion-reproducciones.test.ts.txt, caso 2; log 3/3. No demuestra frecuencia en producción ni ejecuta una carrera en una base real.
- Causa probable: comprobación y creación sin exclusión atómica. Propuesta no aplicada: transacción y restricción de unicidad si se confirma la regla de una sola upcoming.
- Dependencias: regla de producto ya expresada por el rechazo del helper; validar concurrencia PostgreSQL en entorno autorizado.

### BUG-019 — La compensación fallida de duplicación deja una temporada incompleta

- Categoría: Recuperación / integridad. Gravedad: **P2**. Estado: **CONFIRMADO con helper aislado**, nuevo; M04.
- Ruta y archivo: duplicación, src/lib/serverSeasonDuplication.ts:106, cleanupDuplicatedSeason.
- Descripción: tras crear la temporada falla la inserción de jugadores; se intenta borrar la temporada, pero se ignora el error devuelto por el borrado.
- Reproducción: helper real con fallo de season_players y fallo de compensación. Se lanza season_duplicate_players_failed, pero queda la nueva upcoming sin plantilla.
- Esperado: rollback íntegro o estado parcial explícito y recuperable. Observado: recurso incompleto conservado, capaz de bloquear posteriores duplicaciones.
- Evidencia: duplicacion-reproducciones.test.ts.txt, caso 3; log 3/3, solo memoria.
- Causa: compensación no verificada. Propuesta no aplicada: transacción o compensación comprobada, recuperable e instrumentada.
- Dependencias: distinto de BUG-013; aquí existe compensación, pero no se comprueba su éxito.

### BUG-020 — Cuatro duraciones aceptadas fallan al generar el calendario

- Categoría: Funcional / límites de calendario. Gravedad: **P2**. Estado: **CONFIRMADO con funciones reales puras**, nuevo; M05.
- Ruta: configuración de duración y generación; archivo src/lib/calendar.ts, isValidSeasonScheduleTarget y generateExtendedBalancedCalendar.
- Reproducción: modo extended con jugadores ficticios qa-p-i: 17 jugadores/152 jornadas, 18/197, 22/241 y 24/206. Los cuatro valores están por debajo del máximo anunciado (153, 198, 242 y 207).
- Esperado: generar una duración admitida o rechazarla coherentemente antes de ofrecerla. Observado: error «La duración solicitada supera el máximo equilibrado para N jugadores» después de aceptar el valor.
- Evidencia: calendario-barrido.test.ts.txt, calendario-barrido.json y log: 102 casos, 98 correctos, 4 fallidos; exit 1 conservado. Se comprueban número de partidos/jornadas, cuatro jugadores distintos, ausencia de doble participación por jornada y reparto de apariciones.
- Causa probable: máximo precalculado y construcción de secuencias compatibles no coinciden para estos datos; el desempate utiliza firmas de jugadores. No se atribuye todavía una causa única ni independencia de los identificadores.
- Propuesta no aplicada: coherencia entre rango ofrecido y calendario construible; investigar búsqueda/desempates y añadir cobertura de longitudes próximas al máximo.
- Dependencias: los 98 casos correctos no certifican optimalidad de todos los emparejamientos. No se corrige código ni se rebaja la prueba fallida.

### BUG-021 — Una reordenación parcial mezcla partidos de jornadas diferentes

- Categoría: Validación / integridad de calendario. Gravedad: **P2**. Estado: **CONFIRMADO con helper real**, nuevo; M05.
- Ruta: PUT /api/leagues/[id]/seasons/[seasonId]/round-order. Archivos: handler correspondiente y src/lib/serverSeasonMutations.ts:1114.
- Descripción: la API exige enteros positivos únicos, pero no una permutación completa de las jornadas existentes. El helper solo modifica las jornadas incluidas.
- Reproducción: dos partidos en jornadas 1 y 2; roundOrder=[2]. El helper convierte la jornada 2 en 1 y deja la original 1 intacta.
- Esperado: rechazar la lista incompleta sin cambios. Observado: ambos partidos en jornada 1, sin error. El caso de control [2,1] produce correctamente [2,1].
- Evidencia: orden-jornadas-reproducciones.test.ts.txt y log 3/3, solo memoria; el parseo permisivo se verifica por lectura del handler. No se invoca la API real.
- Causa: validación insuficiente del conjunto. Propuesta no aplicada: comparar con las jornadas reales antes de persistir y exigir una permutación completa.
- Dependencias: requiere administrador y temporada mutable; no es un acceso no autorizado. Riesgo también para clientes antiguos o peticiones administrativas defectuosas.

### BUG-022 — Un error durante la reordenación deja cambios parciales de jornadas

- Categoría: Integridad / recuperación. Gravedad: **P2**. Estado: **CONFIRMADO con helper real**, nuevo; M05.
- Ruta y archivo: misma operación que BUG-021, updateServerSeasonRoundOrder.
- Descripción: cada partido se actualiza por separado. Fallar tras el primer cambio deja una reordenación incompleta.
- Reproducción: jornadas [1,2], permutación válida [2,1]; primera actualización exitosa y segunda con error. Lanza season_round_order_update_failed y quedan [2,2].
- Esperado: ambas actualizaciones o ninguna. Observado: partidas mezcladas tras responder error.
- Evidencia: orden-jornadas-reproducciones.test.ts.txt, caso 2 y control exitoso; log 3/3. No se modifica una base real.
- Causa: persistencia no transaccional. Propuesta no aplicada: operación SQL atómica con validación de permutación y pertenencia de todos los partidos a la temporada.
- Dependencias: distinto de BUG-021; ocurre incluso con entrada completa y válida.

### BUG-023 — Un resultado modificado puede conservar confirmaciones del resultado anterior

- Categoría: Integridad / validación de resultados. Gravedad: **P1**. Estado: **CONFIRMADO con handler y derivación reales aislados**, nuevo; M06/M12.
- Ruta: PUT /api/matches/[matchId]/result. Archivos: handler (actualización de matches seguida de borrado de confirmaciones) y src/lib/resultConfirmations.ts.
- Descripción: guardar el resultado y eliminar sus confirmaciones son dos escrituras. Si falla la segunda, el resultado nuevo queda persistido con las confirmaciones anteriores. La derivación no comprueba que updatedAt corresponda a resultRecordedAt ni a una versión del marcador.
- Reproducción: reportador participante modifica un resultado terminado; actualización exitosa, borrado de confirmaciones con error simulado. API responde 500, marcador nuevo 3-0 persistido y las tres confirmaciones anteriores siguen presentes. getMatchResultConfirmationState devuelve validated inmediatamente para el nuevo resultado.
- Esperado: cambio y reinicio de confirmaciones atómicos; ningún resultado nuevo validado por aceptación de otro marcador. Observado: estado validated con confirmaciones de una fecha anterior a la modificación.
- Evidencia: resultados-reproducciones.test.ts.txt y log (1/1), handler real y derivación real, almacenamiento ficticio sin red. No se altera ningún resultado real.
- Causa: persistencia no atómica y confirmaciones sin versión de resultado. Propuesta no aplicada: transacción y vínculo de confirmación con versión; rechazar confirmaciones obsoletas.
- Dependencias: ranking requerido y MVP usan la derivación; concurrencia entre confirmar y editar merece prueba PostgreSQL adicional.

### BUG-024 — El guard SQL de regeneración puede competir con un resultado concurrente

- Categoría: Concurrencia / riesgo de pérdida de datos. Gravedad: **P1**. Estado: **PROBABLE por SQL y flujo de escritura; pendiente reproducción PostgreSQL**, nuevo; M05/M06.
- Rutas: repair-calendar con reroll y PUT result. Archivos: migraciones 20260825151500_allow_reroll_without_results.sql y 20260826002000_resize_balanced_season_calendar.sql; API result.
- Descripción: la RPC comprueba que no hay resultados y después actualiza/borran partidos. Reroll no bloquea esas filas antes del EXISTS; resize bloquea seasons, pero la escritura del resultado actualiza matches y no adquiere ese bloqueo de temporada. Estar dentro de una transacción no basta por sí solo para excluir una escritura concurrente entre comprobación y sustitución.
- Reproducción pendiente: dos transacciones controladas; pausar regeneración después del guard, guardar resultado en la otra, continuar regeneración. Comprobar si sobrescribe/elimina el resultado recién confirmado. No se ejecuta en PRE ni se afirma que ya haya sucedido.
- Esperado: serialización común entre resultado y regeneración, con rechazo si aparece un resultado. Observado por código: guard separado de las escrituras; UPDATE de reroll borra points, sets y result_recorded_at sin condición adicional de ausencia de resultado.
- Evidencia: lectura de SQL completo y API; PostgreSQL aislado no disponible dentro del alcance actual. Las RPC sí proporcionan rollback ante errores y validación del conjunto, lo que no resuelve necesariamente esta carrera.
- Causa probable: falta de un bloqueo común o predicado atómico. Propuesta no aplicada: bloqueo coherente de partidos/temporada en ambos caminos y prueba determinista de concurrencia.
- Dependencias: investigar aislamiento y triggers del despliegue antes de elevar a confirmado; no se modifican migraciones aplicadas.

### BUG-025 — Resolver una incidencia informa éxito aunque falle la limpieza de votos y confirmaciones

- Categoría: Recuperación / consistencia de resultado y MVP. Gravedad: **P2**. Estado: **CONFIRMADO con handler aislado**, nuevo; M07/M06/M12.
- Ruta: PUT /api/matches/[matchId]/incident. Archivo: handler, Promise.all posterior a actualizar matches.
- Descripción: los borrados de match_result_confirmations y mvp_votes devuelven error, pero la respuesta no se comprueba. La incidencia queda resuelta y la API responde 200 pese a conservar estado dependiente del marcador anterior.
- Reproducción: administrador ficticio resuelve con reset_result; actualización de partido exitosa y ambos borrados retornan error. Handler real responde 200 con incidencia resuelta y marcador vacío.
- Esperado: transición íntegra o error explícito con recuperación, sin anunciar limpieza completa. Observado: éxito falso ante ambos errores simulados.
- Evidencia: incidencias-reproducciones.test.ts.txt y log (1/1); no se resuelve ninguna incidencia real. La prueba verifica error devuelto por clientes y éxito de respuesta, no frecuencia de fallo en Supabase.
- Causa: se espera Promise.all pero se ignoran sus resultados; los errores normales del cliente no rechazan la promesa. Propuesta no aplicada: transacción de resolución y limpieza, verificar errores y versionar confirmaciones/votos cuando corresponda.
- Dependencias: BUG-023 muestra impacto de confirmaciones obsoletas; revisar cada resolución sin asumir que un marcador vacío puntúa por sí mismo.


### BUG-026 — Las recomendaciones no convierten la disponibilidad entre zonas horarias

- Categoría: Funcional / fecha y hora. Gravedad: **P2**. Estado: **CONFIRMADO con función real pura**, nuevo; M08.
- Pantalla: disponibilidad/recomendaciones de programación. Archivos: src/lib/playerAvailability.ts, buildAvailabilityRecommendations; serverPlayerAvailability.ts.
- Descripción: se guarda la zona del navegador por jugador, pero el cálculo compara start/end como minutos locales idénticos y nunca usa availability.timezone.
- Reproducción: cuatro jugadores disponibles 18:00–20:00, dos Europe/Madrid y dos Atlantic/Canary; solicitar partido de 120 minutos. Función recomienda 18:00 con coverage=4 aunque el solapamiento real es solo una hora.
- Esperado: convertir a una zona común y no ofrecer cobertura completa de dos horas. Observado: franja completa ficticia.
- Evidencia: disponibilidad-chat-reproducciones.test.ts.txt/log (2/2), sin red ni datos reales. Escenario futuro fijo; no depende del día actual.
- Causa: timezone es metadato sin uso en el algoritmo. Propuesta no aplicada: conversiones IANA/DST por fecha a zona de la liga y presentación explícita de zona.
- Dependencias: acordar si los horarios se introducen en hora del jugador o de la liga; la implementación guarda actualmente la zona del jugador sin explicitar una zona única.

### BUG-027 — El límite de mensajes hace desaparecer propuestas aprobadas y su estado

- Categoría: Funcional / historial y coordinación. Gravedad: **P2**. Estado: **CONFIRMADO con handler real aislado**, nuevo; M09/M10.
- Rutas: GET /api/matches/[matchId]/chat y pantalla chat; API colectiva /api/chats. Archivo: chat/route.ts, limit(60) seguido de buildMatchChatCoordination.
- Reproducción: propuesta de fecha aprobada por cuatro jugadores y 60 textos posteriores. GET devuelve 60 textos y coordinación unscheduled; con todos los mensajes la derivación real devuelve awaiting_booking.
- Esperado: propuestas vigentes y estado de coordinación independientes de la ventana de mensajes; historial accesible por paginación. Observado: aprobación desaparece del snapshot del chat, aunque la API coordination consulta todas las propuestas.
- Evidencia: disponibilidad-chat-reproducciones.test.ts.txt/log; markRead=0, persistencia ficticia. Lectura de UI no identifica carga de mensajes anteriores. Chat amistoso comparte limit(60), aunque no propuestas.
- Causa: se deriva estado de negocio de una ventana truncada. La vista colectiva también limita globalmente a 1200 mensajes, con riesgo de conteos/preview incompletos en chats antiguos (no reproducido aquí).
- Propuesta no aplicada: consultar propuestas vigentes aparte y paginar historial; agregados por chat para resumen/no leídos.
- Dependencias: no significa borrado físico de mensajes de liga; separar de expiración deliberada del chat amistoso.

### BUG-028 — Dos pagos simultáneos pueden sobrescribirse pese a responder éxito

- Categoría: Concurrencia / pagos. Gravedad: **P2**. Estado: **CONFIRMADO con handler real en memoria; PostgreSQL pendiente**, nuevo; M11.
- Ruta: PUT /api/matches/[matchId]/court-booking/transfers/[transferId]. Archivos: handler, courtBooking.ts y patrón equivalente serverPersonalMatchBooking.ts.
- Reproducción: dos transferencias distintas del mismo partido, snapshot inicial compartido, dos llamadas concurrentes a marcar pagado. Ambas responden 200 y la persistencia final conserva solo una pagada.
- Esperado: conservar ambos cambios independientes. Observado: el último array completo reemplaza el anterior.
- Evidencia: pagos-reproducciones.test.ts.txt/log (2/2), solo memoria. La actualización amistosa también sustituye el JSON completo sin versión, pero no se ejecutó su carrera separadamente.
- Causa: lectura-modificación-escritura de todo booking_transfers sin bloqueo ni versión. Propuesta no aplicada: actualizar transferencia atómicamente bajo lock, o control optimista de versión con reintento.
- Dependencias: cambios simultáneos de importes/reserva pueden producir el mismo patrón; no se afirma que haya ocurrido con pagos reales.

### BUG-029 — El reparto redondeado puede diferir dos céntimos entre jugadores

- Categoría: Cálculo / precisión monetaria. Gravedad: **P3**. Estado: **CONFIRMADO con helper real puro**, nuevo; M11.
- Pantallas: pagos de liga y amistosos, componente compartido. Archivo: src/lib/courtBooking.ts, buildCourtBooking.
- Reproducción: cuatro jugadores, único pagador de 22,06 €. Tras liquidar las transferencias calculadas, las cargas netas son 5,52/5,52/5,52/5,50 €.
- Esperado: reparto equitativo en céntimos (dos cuotas de 5,52 y dos de 5,51), diferencia máxima un céntimo. Observado: diferencia de dos céntimos, aunque la suma total sí se conserva.
- Evidencia: pagos-reproducciones.test.ts.txt/log, cálculo independiente en céntimos de coste neto tras transferencias.
- Causa: redondear una cuota uniforme antes de equilibrar saldos concentra el residuo. Propuesta no aplicada: repartir cociente y resto de céntimos explícitamente y de forma determinista.
- Dependencias: incidencia de precisión pequeña; no confundir con pérdida de dinero ni transferencias bancarias ejecutadas por la app.

### BUG-030 — Un empate permitido se trata de forma distinta en ranking y estadísticas

- Categoría: Datos / coherencia funcional. Gravedad: **P2**. Estado: **CONFIRMADO con derivaciones reales; aceptación por UI/API revisada en código**, nuevo; M06/M12/M13.
- Pantallas: registrar resultado, Ranking y Estadísticas. Archivos: MatchResultForm.tsx:125, API result, ranking.ts y seasonStatistics.ts.
- Reproducción: requires_three_sets=false, sets 6-0 y 0-6. UI y API permiten dos sets sin exigir ganador. Ranking cuenta un partido, un punto y una derrota para cada jugador; estadísticas considera el resultado inválido y lo excluye de su ranking.
- Esperado: regla coherente: impedir finalizar empatado o admitir empate con cálculo uniforme. Observado: cuatro derrotas y dos clasificaciones distintas para los mismos datos.
- Evidencia: ranking-reproducciones.test.ts.txt/log (2/2), funciones reales y revisión de canSave/parseo. No se guarda resultado real ni se afirma prueba visual del formulario.
- Causa: contrato de validación de resultado y filtros estadísticos distintos. Propuesta no aplicada: decidir regla de empate, compartir validador/derivación y cubrir formulario/API/ranking/estadísticas.
- Dependencias: amistosos ya exigen ganador; no se extiende este defecto a su alta.

### BUG-031 — Las posiciones de empate difieren entre detalle del partido y estadísticas

- Categoría: Presentación / coherencia. Gravedad: **P3**. Estado: **CONFIRMADO con helpers reales**, nuevo; M12/M13/M15.
- Pantallas: detalle de Partido y estadísticas/exportación. Archivos: rankingOrder.ts, seasonStatistics.ts y csvExport.ts.
- Reproducción: dos jugadores con mismos puntos, diferencia y juegos a favor. getRankingDisplayPosition devuelve 2 para el segundo; getRankingPosition devuelve 1 para ambos. CSV usa index+1, igual que el ordinal.
- Esperado: una convención de puesto compartida o indicar explícitamente ordinal frente a empate. Observado: posición distinta sin esa explicación.
- Evidencia: ranking-reproducciones.test.ts.txt/log; usos rastreados en detalle del partido y exportación estadística.
- Causa: helpers duplicados con reglas diferentes. Propuesta no aplicada: centralizar regla de empate y distinguir orden visual cuando sea necesario.
- Dependencias: no modifica los puntos ni impide ordenar establemente los nombres empatados.

### BUG-032 — Editar participantes de un amistoso deja pagos ligados a identificadores antiguos

- Categoría: Integridad / amistosos y pagos. Gravedad: **P2**. Estado: **CONFIRMADO con helper real en memoria**, nuevo; M10/M11.
- Ruta: PATCH /api/personal-matches/[id], action=participants. Archivo: serverPersonalMatches.ts, replacePersonalMatchParticipants.
- Descripción: borra las cuatro filas de participantes e inserta otras sin conservar id; reservas y transferencias almacenan esos IDs en JSON y no se remapean. Incluso jugadores conservados reciben IDs nuevos.
- Reproducción: amistoso con cuatro participantes y reserva/transferencia a old-0/old-1; ejecutar helper de reemplazo válido. Persisten cuatro IDs nuevos y el pago sigue referenciando los antiguos.
- Esperado: conservar identidad de participantes existentes o migrar de forma íntegra referencias económicas. Observado: ningún participante actual coincide con los IDs del pago.
- Evidencia: amistosos-reproducciones.test.ts.txt/log (1/1); RPC de creación no se invoca y no hay red. Booking del escenario permanece sin modificación, tal como el helper no accede a esa tabla.
- Causa: reemplazo por delete/insert con identidad nueva y referencias JSON independientes. Propuesta no aplicada: actualización transaccional que conserve IDs/remapee pagos; bloquear cambios incompatibles si hay liquidaciones.
- Dependencias: también la compensación de inserción fallida reconstruye filas sin id. Revisar pagos ya liquidados antes de proponer una limpieza automática.

### BUG-033 — La cola Push oculta errores de almacenamiento y puede repetir envíos

- Categoría: Fiabilidad / observabilidad. Gravedad: **P2**. Estado: **CONFIRMADO con helper real y transporte simulado**, nuevo; M14/M21.
- Ruta: tarea scheduled-check, proceso de reintentos. Archivo: src/lib/serverPushRetry.ts.
- Reproducción: sendNotification simulado exitoso, actualización de estado sent devuelve error. El helper informa sent=1, conserva pendiente en el doble y en la siguiente llamada vuelve a enviar. Una consulta fallida se presenta como attempted=0 sin error.
- Esperado: distinguir cola vacía de fallo de consulta y reconocer fallo de confirmación de envío; recuperación/idempotencia que minimice duplicados. Observado: contadores de éxito y duplicación simulada pese a error de persistencia.
- Evidencia: push-cola-reproducciones.test.ts.txt/log (2/2). web-push completamente simulado y claves placeholder, sin envío de notificaciones reales.
- Causa: el tipo de consulta omite error y no se inspecciona en select/update/upsert. Propuesta no aplicada: comprobar errores, claim atómico con lease y estrategia de idempotencia; métricas de fallos separadas.
- Dependencias: no atribuir una garantía de entrega exactamente una vez a Web Push. Unsubscribe sí elimina cola por FK ON DELETE CASCADE; se descartó ese falso positivo tras leer la migración.

### BUG-034 — El idioma del documento permanece en español al elegir inglés o euskera

- Categoría: Accesibilidad / i18n. Gravedad: **P2**. Estado: **CONFIRMADO en DOM aislado**, nuevo; M16/M17.
- Ruta/pantalla: Todas las pantallas al cambiar idioma en Ajustes.
- Archivos: src/app/layout.tsx:53; src/i18n/I18nProvider.tsx.
- Descripción: html tiene lang="es" y el proveedor cambia traducciones/localStorage sin actualizar ese atributo.
- Reproducción: montar el proveedor real con html español; pulsar el control de prueba que llama setLocale("en"); comprobar idioma mostrado y document.documentElement.lang. Repetir conceptualmente con eu utiliza el mismo callback.
- Esperado: el idioma principal del documento corresponde al contenido elegido. Observado: el contenido cambia a en y html sigue es. No se ha probado pronunciación con lector de pantalla físico.
- Evidencia: cierre-ui-reproducciones.test.ts.txt; cierre-reproducciones.log, 4/4 incluyendo otros casos.
- Causa demostrada: atributo fijo y ausencia de sincronización en el proveedor.
- Propuesta no aplicada: sincronizar lang con locale al hidratar/cambiar preferencia y probar navegación y lectores de pantalla.
- Dependencias: independiente de BUG-004. Axe en fixtures españoles no detecta esta discrepancia.

### BUG-035 — La actualización automática puede recargar formularios con cambios sin guardar

- Categoría: PWA / riesgo de pérdida de borradores. Gravedad: **P2**. Estado: **PROBABLE; guard demostrado, pérdida completa pendiente de navegador/PWA**, nuevo; M18.
- Ruta/pantalla: Formularios de partido, administración o chat con contenido no persistido y SW nuevo esperando.
- Archivos: src/components/layout/PwaUpdatePrompt.tsx; src/lib/pwaUpdate.ts.
- Descripción: transcurridos 60 s sin interacción, sin foco editable ni diálogo, la actualización se considera segura. No se consulta si existen cambios sin guardar. Un formulario editado y después desenfocado cumple esa condición.
- Reproducción pendiente de extremo a extremo: editar sin guardar; sacar el foco del campo; dejar SW en waiting y esperar 60 s. La reproducción aislada invoca el guard real con exactamente esos indicadores y devuelve true.
- Esperado: conservar borrador o posponer/consultar antes de recargar. Observado: guard permite activación y el componente programa location.reload; no se afirma haber perdido un formulario real durante esta auditoría.
- Evidencia: cierre-ui-reproducciones.test.ts.txt y cierre-reproducciones.log; lectura completa del componente y de requestPwaUpdate.
- Causa probable: inactividad/foco usados como sustituto del estado dirty del formulario.
- Propuesta no aplicada: registro común de operaciones/ediciones pendientes, recuperación de borradores y gate explícito antes de recargar.
- Dependencias: no confundir con fallo offline; las pruebas offline existentes pasan. Precisa worker controlado y formulario real aislado para confirmar el impacto.

### BUG-036 — La guía modal permite que el teclado vuelva a controles del fondo

- Categoría: Accesibilidad / navegación. Gravedad: **P2**. Estado: **CONFIRMADO en DOM aislado**, nuevo; M16/M17.
- Ruta/pantalla: Ayuda de esta pantalla / tours.
- Archivos: src/components/onboarding/GuidedTourOverlay.tsx; features/onboarding/OnboardingProvider.tsx.
- Descripción: el portal se anuncia role=dialog aria-modal=true, pero no mueve/contiene el foco ni vuelve inerte el resto de la página. Escape y flechas sí tienen handlers.
- Reproducción: montar overlay real con proveedor de tour simulado y un botón de fondo; conservar foco de ese botón; desde el último control del diálogo pulsar Tab hasta completar vuelta. El foco alcanza el botón de fondo.
- Esperado: foco inicial dentro, Tab/Shift+Tab contenidos y restauración al cerrar. Observado: foco fuera y recorrido hacia fondo; no se atribuye una prueba con lector físico.
- Evidencia: cierre-ui-reproducciones.test.ts.txt; cierre-reproducciones.log, interacción user-event con DOM real simulado, sin datos/red.
- Causa demostrada: falta gestión de foco y aislamiento modal en el componente y proveedor revisados.
- Propuesta no aplicada: diálogo nativo o gestión completa de foco/inert/restauración, con pruebas de teclado.
- Dependencias: las pruebas existentes verifican apertura del tour y Escape; no cubren contención de Tab.

### BUG-037 — Crear una temporada puede cerrar la anterior aunque falle el alta

- Categoría: Integridad / ciclo de temporada. Gravedad: **P1**. Estado: **CONFIRMADO con helper real en memoria**, nuevo; M04.
- Ruta/pantalla: Administración → Nueva temporada, POST /api/leagues/[id]/seasons.
- Archivos: src/lib/serverSeasonMutations.ts:1449, createServerSeason.
- Descripción: se marca finished la temporada indicada antes de insertar la nueva. Un fallo del insert devuelve error, sin restaurar estado. Fallos posteriores pueden además dejar temporadas, jugadores o calendarios parciales.
- Reproducción: actor ficticio, ocho nombres nuevos válidos, modo single/7 jornadas y temporada anterior activa; doble devuelve éxito al cerrar y error al insertar; ejecutar helper real.
- Esperado: alta y transición atómicas, o anterior conservada si no se crea nueva. Observado: season_create_failed y anterior finished.
- Evidencia: alta-temporada-reproducciones.test.ts.txt; cierre-reproducciones.log (prueba 1/1).
- Causa demostrada: secuencia de escrituras independientes sin compensación/transacción.
- Propuesta no aplicada: validar/generar primero y agrupar alta/vínculos/ajustes/transición en transacción idempotente; probar cada fallo intermedio.
- Dependencias: mismo patrón de atomicidad que BUG-013/014/016, pero operación distinta: crear, frente a iniciar una temporada ya existente.

### BUG-038 — README identifica una versión estable antigua como actual

- Categoría: Documentación / mantenimiento. Gravedad: **P3**. Estado: **CONFIRMADO por archivos actuales**, histórico; M21.
- Ruta/pantalla: README del repositorio, sección Entornos.
- Archivos: README.md:14; package.json; src/lib/appVersion.ts; docs/production-hardening/V1_15_4_HARDENING_AUDIT.md.
- Descripción: sigue anunciando v1.1.0 como versión estable actual, antecedente señalado expresamente en v1.15.4. El árbol auditado declara v1.15.9. No se infiere que Producción haya sido comprobada en vivo.
- Reproducción: comparar la afirmación del README con los archivos de versión del checkout y el informe histórico.
- Esperado: documentación precisa por entorno/versión o enlace a fuente vigente. Observado: afirmación antigua no fechada como histórica.
- Evidencia: lectura de los archivos indicados; version:check pasa porque no valida ese texto.
- Causa: actualización de release sin alinear esa documentación.
- Propuesta no aplicada: distinguir versión del checkout, PRE y release estable con fecha/fuente; evitar duplicación manual.
- Dependencias: no es fallo de UI ni demuestra versión incorrecta desplegada.

### BUG-039 — La paginación de actividad omite eventos empatados en fecha

- Categoría: Funcional / datos / historial. Gravedad: **P2**. Estado: **CONFIRMADO con helper real en memoria**, histórico; M14/M21.
- Ruta/pantalla: Actividad y consumidores de GET /api/leagues/[id]/activity.
- Archivos: src/app/api/leagues/[id]/activity/route.ts; src/lib/serverActivity.ts:431; docs/production-hardening/V1_15_4_HARDENING_AUDIT.md.
- Descripción: se añadió nextCursor, pero contiene solo createdAt. La página siguiente usa created_at < cursor y ordena solo por fecha, sin ID de desempate. El contrato histórico pedía cursor compuesto.
- Reproducción: tres eventos ficticios con exactamente el mismo timestamp; consultar limit=2 y después createdAtBefore=fecha del último recibido. Ejecutar fetchServerActivityEvents real con doble que aplica los filtros de consulta.
- Esperado: las páginas permiten alcanzar los tres registros una vez. Observado: primera página dos, segunda cero; tercero inaccesible por ese cursor. No se borran filas de BD.
- Evidencia: actividad-cursor-reproducciones.test.ts.txt/log (1/1). El test existente v1154HardeningCleanup comprueba presencia textual de cursor, no este borde.
- Causa demostrada: cursor/orden no únicos y límite estricto por fecha.
- Propuesta no aplicada: ordenar por created_at e id y codificar ambos, aplicando continuación lexicográfica; paginar antes/después de filtros de visibilidad de forma coherente.
- Dependencias: diferente del recorte de propuestas BUG-027; no requiere chat ni cambios deportivos.

### BUG-040 — Dependencias de desarrollo con avisos de seguridad, incluidos críticos en la cadena de pruebas

- Categoría: Seguridad / cadena de herramientas. Gravedad del proyecto: **P1**. Estado: **CONFIRMADO el árbol afectado y avisos oficiales; explotación del proyecto NO demostrada**, nuevo; M21.
- Ruta/pantalla: Desarrollo/CI, npm audit completo. No se identifica un endpoint público vulnerable mediante esta comprobación.
- Archivos: package.json; package-lock.json; configuración Vitest/ESLint. No modificados.
- Descripción: npm audit completo devuelve exit 1 y 13 paquetes afectados (2 critical, 10 high, 1 moderate). Son paquetes y dependencias propagadas, no 13 ataques independientes. npm audit --omit=dev devuelve exit 0, cero avisos. Lockfile: Vitest 3.2.7, tinypool 1.1.1, @vitest/mocker 3.2.7, ESLint 9.39.4, braces 3.0.3 y brace-expansion 1.1.18/5.0.9, marcados dev.
- Reproducción segura: consultar npm audit --json y --omit=dev --json en copia existente con lockfile idéntico; contrastar versiones/rangos y avisos oficiales. No se ejecuta payload ni se instala/actualiza nada.
- Esperado: gates distinguen runtime de herramientas y disponen los avisos relevantes antes de publicar/continuar ejecución sensible. Observado: gate runtime verde no refleja árbol de pruebas afectado; auditoría completa falla.
- Evidencia: auditoria-evidencias/npm-audit-completo.json y npm-audit-runtime.json; avisos contrastados en GitHub el 10/10/2026: [Tinypool worker options](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3), [Tinypool run options](https://github.com/advisories/GHSA-85c8-ppgw-ccpr), [Vitest mock redirect](https://github.com/advisories/GHSA-82fw-gwwq-j7x9), [brace-expansion](https://github.com/advisories/GHSA-qhr7-859c-m2p7).
- Causa/alcance: avisos de Tinypool describen gadgets que requieren una primitiva previa de contaminación de prototipos/opciones; no se ha demostrado esa entrada en Smash & Lob. El de Vitest depende del servidor de mocks/contexto correspondiente. No se declara RCE pública, compromiso de CI ni P0 por copiar la severidad del paquete.
- Propuesta no aplicada: evaluar actualizaciones compatibles y avisos por dependencia, comprobar overrides antiguos, repetir gates tras autorización. No ejecutar npm audit fix --force ni aceptar automáticamente la sugerencia de downgrade de eslint-config-next.
- Dependencias: fallo nuevo respecto a la consulta anterior de solo runtime; no invalida retrospectivamente los resultados funcionales, pero detiene nuevas ejecuciones de pruebas/publicación hasta disposición. Desde el hallazgo solo se realizan lecturas y documentación.
