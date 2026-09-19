# Auditoría v1.15.4: saneamiento y deuda técnica

Fecha de inicio: 19 de septiembre de 2026  
Base: `origin/main` `01c9212`  
Versión: `1.15.3`  
Rama: `codex/v1.15.4-hardening-cleanup`

## Estado confirmado

- `main` y `staging` apuntan a la versión publicada `1.15.3`.
- `scripts/check-league-i18n.mjs` excluye `personal-matches` y `components/personal`; esas pantallas contienen cadenas visibles en castellano sin pasar por `tx`.
- `/notifications` proyecta `activity_events`, sin estado persistente de lectura por usuario.
- `/activity` y el backend limitan la consulta a ventanas finitas; no existe cursor compuesto para recorrer todo el histórico.
- La actividad informativa y la auditoría administrativa comparten actualmente el mismo almacenamiento y los avisos Push se ejecutan como efecto auxiliar.
- El buscador de ajustes necesita filtrar por estado real de temporada y validar sus destinos con hash.
- La capacidad de crear ligas debe separarse del modo de experiencia de la liga activa.
- La entrega Push no dispone de una cola persistente de reintentos e idempotencia.
- No existe una tabla ni API de lista de espera para temporadas llenas.
- No existe un flujo autoservicio completo para exportar o eliminar/anonymizar la cuenta.
- `src/app/admin/season/page.tsx` concentra 6.308 líneas; los providers principales también requieren una revisión acotada antes de extraer más responsabilidades.
- `README.md` describe una versión estable antigua (`v1.1.0`) y necesita alinearse con el estado actual sin borrar el historial.

## Decisiones de producto fijadas

- Lista de espera explícita, FIFO, posición visible, promoción con 48 horas para confirmar y cobro solo al promocionar. El administrador puede aceptar manualmente y los cambios quedan auditados. Al iniciar la temporada se congela la lista.
- Exportación de datos en JSON, limitada a los datos propios.
- Eliminación de cuenta autoservicio con reautenticación y confirmación reforzada: anonimización de la identidad histórica, borrado de datos personales, sesiones, Push y preferencias; transferencia o eliminación explícita de ligas creadas en solitario.
- Partidos personales y de liga comparten la experiencia base de partido. Las funciones propias de competición siguen restringidas a ligas.
- El centro de notificaciones contará todo lo visible aunque Push esté desactivado y conservará 180 días de historial operativo.
- No se despliega a PRE ni Producción desde esta rama.

## Orden de implementación

1. i18n y gate de regresión.
2. Centro de notificaciones y paginación/auditoría.
3. Push persistente y reintentos.
4. Buscador contextual y separación de permisos.
5. Lista de espera.
6. Exportación y eliminación de cuenta.
7. Matriz compartida de partidos y refactor incremental de administración de temporada.
8. Documentación, ramas y gates completos.
