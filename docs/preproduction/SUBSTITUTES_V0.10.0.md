# Suplentes y reemplazos · v0.10.3

## Flujo de ramas

```text
feature/substitutes-v0.10.0 -> staging -> main
```

La funcionalidad se prueba primero en PRE. No se aplica ningún cambio de base de datos en producción hasta que la rama haya sido validada y esté lista para promocionarse a `main`.

## Migración canónica

```text
supabase/migrations/20260720090000_add_season_substitutes.sql
```

La migración canónica y su migración correctora son la fuente de verdad para PRE y PROD. No hay SQL manual adicional que copiar después.

```text
supabase/migrations/20260720213000_fix_substitute_rpc_column_ambiguity.sql
```

Estado operativo:

```text
PRE  · ambas migraciones aplicadas y validadas
PROD · pendiente hasta aprobar la promoción desde staging
```

Antes de cualquier comando remoto en PRE:

```powershell
Get-Content .\supabase\.temp\project-ref
```

Debe devolver exclusivamente:

```text
miadjotkucgluwbrgeih
```

Aplicación en PRE:

```powershell
supabase db push
supabase migration list
```

Cuando esta funcionalidad esté aprobada para producción, las dos migraciones se aplicarán en orden desde el worktree de producción después de verificar expresamente el `project-ref` de PROD y antes de desplegar el código que depende de ella.

## Reglas funcionales

- Un jugador que figure en `season_players`, activo o dado de baja, nunca puede actuar como suplente en esa misma temporada.
- La bolsa de suplentes solo contiene jugadores externos a los titulares.
- Un suplente puede añadirse previamente o crearse al asignarlo a un partido.
- Los perfiles de suplente activos pueden reclamarse con el enlace de invitación de la liga.
- Una sustitución puntual cambia únicamente un partido y puede deshacerse mientras el resultado no esté registrado.
- El jugador que disputa realmente el partido recibe los puntos, puede votar y ser votado como MVP, confirma el resultado y participa en los pagos de pista.
- Las estadísticas puntuales de suplentes se calculan exclusivamente desde `match_substitutions` de tipo `single`; no entran en el ranking principal.
- Retirar o ascender a un suplente no elimina su historial.
- Un reemplazo permanente conserva el historial y los puntos del saliente, añade al entrante como titular desde cero y solo altera partidos no terminados desde la jornada elegida.
- Un reemplazo permanente se bloquea si el saliente tiene sustituciones puntuales futuras o si el entrante ya está asignado como suplente en otro partido pendiente.
- Los titulares dados de baja se muestran como `BAJA DESDE Jx`; los entrantes se muestran como `DESDE Jx`.
- Las reservas, compradores de bolas y transferencias de pista se actualizan y recalculan con los participantes reales.
- El panel de gestión de sustituciones solo aparece mientras el partido no está finalizado; el histórico de un partido cerrado se reconoce mediante sus etiquetas y desde Administración > Suplentes.
- La ayuda de la aplicación y el resumen obligatorio de normas explican la bolsa, la sustitución puntual, el reemplazo permanente y la atribución real de puntos.

## Integridad transaccional

Las operaciones críticas se ejecutan mediante funciones PostgreSQL accesibles únicamente con `service_role`:

- `server_add_season_substitute`
- `server_assign_match_substitute`
- `server_remove_match_substitute`
- `server_apply_season_replacement`

La modificación de partidos, auditoría, bolsa, titulares y pagos se confirma completa o se revierte completa. No se realizan reemplazos permanentes mediante una secuencia de escrituras independientes desde Next.js.

## Validación mínima en PRE

1. Añadir dos suplentes a la bolsa.
2. Abrir la invitación con una segunda cuenta y comprobar que un suplente activo aparece como perfil reclamable.
3. Confirmar que un titular, incluso uno dado de baja, no puede añadirse como suplente.
4. Asignar un suplente a un partido pendiente y verificar nombre, calendario, resultado, MVP y confirmaciones.
5. Crear una reserva de pista antes de sustituir; verificar que pagadores y transferencias se recalculan.
6. Deshacer la sustitución y comprobar que participantes y pagos vuelven al estado anterior.
7. Registrar un resultado con suplente y comprobar que sus puntos aparecen solo en «Rendimiento de suplentes».
8. Retirar al suplente de la bolsa y confirmar que sus estadísticas históricas permanecen.
9. Confirmar que una sustitución ya no puede deshacerse después de finalizar el partido.
10. Crear una sustitución futura para un suplente e intentar ascenderlo: el reemplazo permanente debe bloquearse hasta deshacerla.
11. Aplicar un reemplazo permanente desde una jornada futura.
12. Confirmar que los partidos anteriores no cambian, los futuros sí y las reservas futuras se actualizan.
13. Confirmar las etiquetas `BAJA DESDE Jx` y `DESDE Jx` en el ranking.
14. Confirmar que el saliente conserva sus puntos y el entrante empieza desde cero.
15. Confirmar que el panel de sustituciones desaparece al finalizar el partido, manteniendo las etiquetas de suplente.
16. Confirmar que Ayuda y la aceptación de normas explican correctamente los suplentes.
17. Ejecutar `npm run lint`, `npm run build` y una prueba con dos cuentas antes de promocionar la rama.

## Promoción a producción

Antes de aplicar la migración en PROD:

1. Confirmar que PRE ha superado todo el checklist.
2. Confirmar que la rama que entra en `main` contiene este mismo archivo de migración sin modificaciones pendientes.
3. Crear backup de Supabase producción.
4. Verificar explícitamente el proyecto Supabase de producción.
5. Aplicar la migración canónica.
6. Desplegar `main` y repetir una prueba de humo sin crear sustituciones sobre ligas reales.
