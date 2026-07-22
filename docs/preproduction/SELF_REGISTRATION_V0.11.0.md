# Smash & Lob v0.11.0 · Plantillas por autoinscripción

## Objetivo

Permitir que una temporada se cree indicando solamente su capacidad. Los nombres aparecen conforme las personas se incorporan con su cuenta, sin obligar al organizador a preparar previamente una lista de jugadores.

La modalidad anterior se conserva como `fixed`. Las temporadas existentes continúan funcionando en ese modo.

## Perfil global de usuario

Cada cuenta debe confirmar un nombre y un primer apellido antes de utilizar la aplicación tras el despliegue de esta versión.

- Los campos se precompletan a partir del nombre disponible en la sesión de Google cuando es posible.
- La confirmación guarda `first_name`, `last_name`, `display_name` y `profile_completed_at` en `app_users`.
- El nombre se utiliza en todas las ligas de la cuenta.
- Desde Ajustes puede modificarse posteriormente.
- Al cambiarlo, se actualizan los jugadores vinculados mediante `league_memberships`; no cambian `player_id`, estadísticas, partidos ni resultados.
- Los nombres no tienen que ser únicos.

## Modos de plantilla

### Plantilla preparada por el organizador (`fixed`)

Mantiene el flujo anterior: el organizador elige jugadores existentes y escribe los nuevos nombres antes de crear la temporada. El calendario se genera en ese momento.

### Jugadores se registran al unirse (`self_registration`)

- El organizador elige 8, 12 o 16 plazas.
- No introduce nombres.
- Su propio perfil ocupa la primera plaza.
- La temporada queda como `upcoming` y sin partidos.
- El calendario equilibrado se genera únicamente al pulsar **Comenzar temporada** con la plantilla completa.
- No se admite calendario manual en esta modalidad durante v0.11.0.

## Incorporación de jugadores

Una persona puede ocupar una plaza de dos formas:

1. Mediante la invitación de la liga, si todavía no pertenece a ella.
2. Desde la sala de espera de la HOME, si ya es miembro de la liga.

La operación `server_join_self_registration_season` es transaccional y bloquea la configuración de la temporada para impedir que dos cuentas ocupen simultáneamente la última plaza.

La operación:

- comprueba perfil completo, liga, temporada, estado y registro abierto;
- reutiliza el jugador ya vinculado a la cuenta o crea uno nuevo;
- crea o actualiza la membresía de liga;
- elimina una posible membresía como espectador;
- añade el jugador a `season_players`;
- añade su estado de inscripción económica;
- cierra automáticamente el registro al completar la capacidad.

## Sala de espera

La HOME y Administración muestran:

- jugadores inscritos y plazas disponibles;
- contador `inscritos/capacidad`;
- acción para incorporarse;
- acción para liberar una plaza antes del inicio;
- retirada de un participante por creator/admin;
- actualización al recuperar el foco y sondeo periódico mientras la pantalla está abierta.

Creator y administradores reciben eventos y notificaciones cuando una persona entra o sale. Al ocuparse la última plaza se notifica que la plantilla está completa.

## Liberar una plaza

`server_remove_self_registration_player` permite retirar al propio jugador o actuar como creator/admin/superusuario. Solo funciona con la temporada `upcoming`.

La operación elimina el vínculo con la temporada, pero conserva:

- la cuenta;
- la membresía de liga;
- el jugador global de esa liga;
- cualquier histórico de temporadas anteriores.

También elimina el pago de inscripción de esa temporada y vuelve a abrir el registro.

## Inicio de temporada

El botón permanece bloqueado hasta que:

- haya exactamente tantos jugadores activos como capacidad;
- las inscripciones económicas estén saldadas, cuando sean obligatorias.

El servidor genera el calendario equilibrado y llama a `server_start_self_registration_season`. La RPC vuelve a validar permisos, plantilla, pagos y participantes; inserta todos los partidos y activa la temporada dentro de una única transacción.

No puede generarse el calendario dos veces.

## Datos añadidos

### `app_users`

- `first_name`
- `last_name`
- `profile_completed_at`

### `season_settings`

- `roster_mode`: `fixed | self_registration`
- `player_capacity`
- `registration_open`
- `roster_completed_at`
- `schedule_mode`
- `calendar_mode`

## RPC añadidas

- `server_update_user_profile`
- `server_join_self_registration_season`
- `server_remove_self_registration_player`
- `server_start_self_registration_season`

Todas revocan acceso público y se ejecutan exclusivamente mediante el cliente de servidor con `service_role`.

## Compatibilidad

- Las temporadas existentes reciben `roster_mode = fixed`.
- Se conserva el flujo de reclamación de jugadores de las plantillas fijas.
- La edición global del nombre actualiza el jugador vinculado, no crea duplicados.
- Sustituciones, ranking, MVP, pagos, resultados y confirmaciones siguen utilizando los mismos `player_id`.

## Casos de prueba obligatorios en PRE

1. Confirmar perfil nuevo con valores precompletados desde Google.
2. Modificar nombre desde Ajustes y comprobar la propagación en dos ligas.
3. Crear una temporada fija y confirmar que no cambia el flujo anterior.
4. Crear una temporada por autoinscripción y comprobar que creator ocupa `1/N`.
5. Entrar por invitación con una cuenta nueva sin elegir jugador.
6. Incorporar a un miembro existente desde la HOME.
7. Intentar superar la capacidad con dos cuentas simultáneas.
8. Liberar la propia plaza y volver a incorporarse.
9. Retirar a otra persona como admin y comprobar que un jugador normal no puede hacerlo.
10. Confirmar notificaciones de incorporación, salida y plantilla completa.
11. Verificar que no se puede comenzar con plantilla incompleta.
12. Verificar que una cuota pendiente también bloquea el comienzo.
13. Comenzar con plantilla completa y confirmar calendario, partidos, ranking y HOME.
14. Intentar comenzar una segunda vez y confirmar que no duplica partidos.
15. Probar sustituciones, resultados, confirmaciones y MVP tras iniciar.

## Despliegue

La migración `20260722094500_add_self_registration_rosters.sql` debe aplicarse primero únicamente en Supabase PRE. El código depende de las columnas y RPC nuevas.

No aplicar la migración en producción hasta terminar todas las pruebas y preparar la publicación de v0.11.0.
