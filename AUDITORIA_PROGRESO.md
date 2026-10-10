# Progreso de auditoría integral

Fecha: 10/10/2026 (Europe/Madrid). Estado: CERRADA CON HALLAZGOS Y BLOQUEOS DOCUMENTADOS. Base: 6fa8c72ed0d6be3077e5285f7a987a3e3a5369ea, v1.15.9, codex/pre-pending-integration.

## Restricciones

Solo documentación/evidencias; sin correcciones, commits, push, despliegues, instalación de paquetes ni modificaciones de datos/esquema. No navegar autenticado en localhost/PRE sin comprobar efectos: requireAuthenticatedAppUser hace upsert incluso en GET y /api/access puede activar temporadas. Las pruebas usan la copia instalada y placeholders; ningún flujo real de escritura autorizado en esta auditoría.

## Hitos secuenciales

- A01 Inventario y antecedentes: COMPLETADO.
- A02 Auditoría por módulos: COMPLETADO en alcance seguro, 21/21 módulos; ver informes modulares.
- A03 Cruces, antecedentes y balance: COMPLETADO con validaciones externas/visuales bloqueadas explícitas; no aceptación de producto.

## Inventario

70 páginas, 96 APIs, 157 bibliotecas, 11 providers/contextos, 225 archivos TS de pruebas. Inventario íntegro: auditoria-evidencias/inventario-repositorio.json.

| ID | Módulo | Estado | Alcance (detalle en evidencias) |
|---|---|---|---|
| M01 | Autenticación, sesiones, perfiles y cuenta | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M02 | Autorización, roles y seguridad de API/RLS | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M03 | Ligas, miembros, invitaciones y espectadores | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M04 | Temporadas, inscripciones y lista de espera | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M05 | Generación y edición de calendarios | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M06 | Partidos, resultados y confirmaciones | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M07 | Incidencias, aplazamientos y sustituciones | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M08 | Disponibilidad y coordinación | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M09 | Chats de liga y propuestas | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M10 | Amistosos, participantes y chats personales | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M11 | Reservas, pagos, transferencias y economía | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M12 | Ranking, desempates y MVP | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M13 | Estadísticas, evolución e historial | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M14 | Notificaciones, Push y tareas programadas | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M15 | Exportaciones, QR y Media Kit/Welcome Pack | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M16 | Temas, tipografía, responsive y accesibilidad | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M17 | Idiomas, ajustes, ayuda y tutoriales | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M18 | PWA, offline y actualización | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M19 | Administración global, ubicaciones y sugerencias | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M20 | Sitio público, legal y laboratorio experimental | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |
| M21 | Rendimiento, observabilidad y calidad/infraestructura | REVISADO CON LÍMITES | Código + pruebas seguras + visual cuando aplica |

## Continuidad

Última tarea completada: revisión de 21 módulos, cruces, 64 antecedentes y 40 fichas, consolidación de pruebas, cobertura visual y bloqueos. Fuentes y HEAD conservados; ver integridad-checkpoint.json y cierre-validacion.json.

Próxima tarea de auditoría: ninguna comprobación adicional ejecutable dentro del alcance actual documentado. Quedan gates explícitos de dispositivos, servicios externos, PostgreSQL y visual ampliado; no se dan por realizados. El npm audit completo falló al final (BUG-040), por lo que se detuvieron nuevas ejecuciones y publicación. Solo lectura y documentación desde entonces.

El usuario decidirá qué corregir. No iniciar correcciones, instalaciones, escrituras reales, commits/push o despliegues con esta autorización. Si se retoma para validar un bloqueo, leer la fila correspondiente en AUDITORIA_GENERAL.md y no repetir todas las suites sin motivo.

## Estado final de cobertura

21/21 módulos examinados (100 % modular, no cobertura total de archivos/pantallas/casos). Todos conservan al menos una comprobación manual/externa o de escala pendiente. Evidencias M01-M02, M03-M04, M05-M07, M08-M15 y M16-M21; las dos últimas completan/reemplazan los pendientes parciales históricos de los checkpoints siguientes.

40 incidencias: P0 0 / P1 10 / P2 27 / P3 3; 35 confirmadas en alcance indicado, cinco probables. 37 nuevas, tres históricas persistentes. Matriz de 64 antecedentes: 37 resueltos en alcance, tres persistentes, 18 pendientes, seis obsoletos. Índices Markdown y JSON conservados.

Validación nueva: validate 858/858, Playwright 76/76, 37 pruebas adicionales correctas (reproducen fallos/controles, no correcciones); barrido calendario 102 escenarios, cuatro fallos. npm runtime cero avisos; completo 13 paquetes afectados, exit 1. No ignorar ni debilitar ese gate. Seis capturas nuevas y diez referencias abiertas/contrastadas; histórico de 72 rutas separado.

## Registro cronológico (checkpoints previos, superados por estado final)
## Evidencia reutilizable

La ejecución inmediatamente anterior al encargo validó v1.15.9: 858 pruebas, 76 Playwright, build, auditoría runtime cero vulnerabilidades y cuatro jobs remotos correctos. Son evidencia histórica reciente, no nuevas ejecuciones de esta auditoría ni cobertura exhaustiva. Fuentes: docs/FUNCTIONAL_PRE_ACCEPTANCE.md, docs/VISUAL_AUDIT_RESULTS.md y STATUS.

## A01 completado

Inventario verificable: 70 páginas, 96 APIs, 157 bibliotecas y 21 módulos; índice de antecedentes generado con todos los informes localizables. Tecnologías, guards, providers y scripts identificados. TODO/FIXME/HACK no aportan tareas reales pendientes (las coincidencias TODO pertenecen a textos en castellano). Se revisaron configuraciones Vitest/Playwright, mocks de integración y efectos de scripts.

Seguridad de comprobaciones: validate usa checks locales, typegen/tsc, Vitest y build; ejecutar solo en copia existente con placeholders. Playwright usa 127.0.0.1:3100 y placeholders/mocks; no QA PRE. Bloqueados qa:pre, database:quality local (Docker ausente/descarga npm no autorizada), performance:lighthouse (npx instala paquete), external/rulesets y cualquier tarea cron de escritura. Reutilizar evidencia CI PostgreSQL/Lighthouse inmediatamente anterior, identificándola como histórica. No se ejecutan installs.

M01/M02: revisión de serverAuth, serverLeagueAccess, profile/delete y proxy iniciada. GET autenticados hacen upsert de toda la cuenta; investigar carreras. Eliminación de cuenta no equivale al compromiso histórico de anonimización integral; investigar sin enviar solicitudes reales.

### M01/M02 — checkpoint

Cuatro reproducciones aisladas correctas (4/4): restauración de privilegio revocado por el guard, exportación con ID incorrecto, éxito falso de anonimización y confirmación EN/EU imposible. BUG-001 a BUG-004 documentados con fichas completas. Las pruebas usan helpers/handlers reales y dobles en memoria, sin red. Se conservan como .ts.txt/.mts.txt para no incorporarlas accidentalmente a la compilación de la aplicación; copia temporal existente para ejecución.

validate de esta auditoría en ejecución con placeholders. Se verificó fingerprint de copia y sincronizaron cuatro archivos antes de typecheck/unitarias/build; checkout principal intacto. Autenticación/seguridad siguen EN CURSO, faltan análisis de entradas públicas, CSRF/SSRF, límites y matiz de sesiones.


### Checkpoint de validación y Auto Resume

validate finalizó con código 0: 219 archivos / 858 pruebas, TypeScript y build correctos, 0 errores ESLint / 4 avisos; presupuesto de build 1.181.274 bytes gzip / 102 chunks. Evidencia: auditoria-evidencias/validate-auditoria.log. Pendiente repetir lint dirigido de los tres componentes sincronizados durante lint para asegurar correspondencia exacta de ese gate.

Esquema contrastado para BUG-002/003: notification_preferences y push_subscriptions usan user_email y no user_id. Ambos handlers de cuenta consultan/borran por user_id e ignoran errores auxiliares. Añadir este detalle a las fichas sin confundir la demostración estática con una ejecución en PRE.

Invocación expresa de Auto Resume atendida: status oficial en solo lectura confirma ENABLED, watcher running, autoarranque registrado y 0 pendientes. Codex 0.162.0-alpha.2 pasa comprobaciones locales de compatibilidad estructural, aunque el registro no verifica esta compilación. Sin instalación, actualización ni cambio de configuración. La auditoría continúa EN CURSO; no se ha declarado validada toda la aplicación.


### Checkpoint A02 — M03/M04 y gates de navegador

Playwright nuevo de esta auditoría: 76/76, exit 0, sin actualizar snapshots. Lint dirigido pendiente ya completado (exit 0). Se revisaron las seis capturas nuevas guardadas en auditoria-evidencias/visual: selector de calendario centrado y legible en Competition claro/oscuro, móvil/escritorio; votos muestran Guardando sin solapamiento. En chat clásico claro el texto secundario de ayuda/horario se ve tenue: pendiente medir contraste, sin clasificar todavía como bug confirmado.

BUG-005..015 incorporados al informe y al índice JSON: destino Push interno, dos fallos de espera, lectura con código incorrecto, DTO excesivo de invitación, promoción propia no reconocida (probable), reserva/caducidad de cola incompletas (probables), alta de liga parcial, borrado de temporada parcial y cambio indebido de temporada activa. 11 pruebas de reproducción en total (cuenta 4 + seguridad 1 + ligas/espera 3 + alta 1 + ciclo 2), todas pasan, exclusivamente memoria.

Lecturas por módulo: M01-M02-revision.md y M03-M04-revision.md. Pendiente M04: reproducir inicio fijo tras fallo intermedio y carrera de duplicación/cleanup; después continuar M05 calendario y el resto de módulos. No repetir status Auto Resume como sustituto de avance.

Bloqueo visual adicional: revisión automática rechazó dos arranques del servidor aislado, segundo sin ajuste de confianza del host; motivo concreto no informado. No se insiste con otro método para eludirlo. Proxy documental preparado pero no iniciado. Se mantienen los mocks de la suite existente y sus capturas; no se usa la sesión personal del navegador para evitar escrituras GET.

Integridad: 924 archivos fingerprintados, 0 diferencias funcionales, HEAD 6fa8c72 sin cambio; integridad-checkpoint.json. Solo documentación y evidencias modificadas. Auditoría completa todavía NO concluida.

### Checkpoint A02 — ciclo, duplicación y barrido de calendario

BUG-016..020 documentados: inicio parcial, pérdida de duración al duplicar, duplicación concurrente, compensación fallida y cuatro duraciones aceptadas que no se generan. Quince reproducciones aisladas correctas en total. Barrido independiente: 102 casos, 98 correctos y 4 fallidos; fallo nuevo conservado, sin corregir ni ocultar. M04 continúa con límites y M05 en curso. Próximo: reordenación de jornadas, reparación y regeneración antes de resultados/confirmaciones. No se modifica fuente ni datos reales.


Reordenación M05: BUG-021 entrada parcial mezcla jornadas; BUG-022 fallo intermedio deja actualización parcial. Tres pruebas nuevas pasan (dos reproducciones + control válido). Total: 17 reproducciones positivas y un control. Reparación usa guard de pristine y reroll comprueba resultados antes de RPC; pendiente contrastar restricciones SQL y concurrencia antes de concluir ese flujo.

### Revisión M05/M06 — reparación y resultados

Reparación normal exige upcoming y partidos pristine; reroll permite otros estados deliberadamente y rechaza resultados, usa RPC que limpia datos de emparejamientos antiguos y valida pertenencia/conjunto. Resize bloquea la fila de temporada. No se registra un bypass de estado como bug sin contrato de producto. Riesgo de concurrencia del guard se separa como BUG-024 PROBABLE, pendiente PostgreSQL.

BUG-023 CONFIRMADO: guardar resultado seguido de borrado fallido de confirmaciones conserva aceptación del marcador anterior; prueba nueva 1/1 con handler/derivación reales. Los gates generales anteriores no detectaron esta recuperación parcial. M06 EN CURSO; faltan bloqueo/desbloqueo, edición concurrente, casos de set y cruce con incidentes/amistosos. M04/M05 todavía no declarados completos.


M06: controles de 24 h/120 min, confirmaciones ajenas y modos pasan (3/3). M07 iniciado; BUG-025 éxito falso de limpieza reproducido (1/1). Evidencia modular M05-M07-revision.md distingue funciones verificadas de límites. Desasignación/reemplazo permanente y módulos M08..M21 pendientes.


### Punto de reanudación actualizado

25 fichas documentadas (BUG-001..025), separando confirmadas/probables. Pruebas adicionales: 23/23 (19 reproducciones + 4 controles); barrido calendario 102 casos con 4 fallos conservados. No se declara aceptación global ni cierre A02. Próximo: completar M04 alta/ajustes y M05 manuales; M06 concurrencia y M07 desasignación/reemplazo; continuar M08 disponibilidad y M09 chats. Ya leídos parcialmente chatRealtimeClient, serverChatRealtime, API coordination y availability de jugador (GET/PUT), aún sin declarar revisión de esos módulos. M08..M21 siguen pendientes.

Integridad revalidada: 924 archivos funcionales sin diferencias, HEAD inicial conservado. Ningún commit/push, despliegue, escritura de datos ni modificación de migraciones. Restricción visual aislada persiste; usar evidencia segura y documentar cobertura real.
