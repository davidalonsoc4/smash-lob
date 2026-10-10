# M03/M04 — ligas, invitaciones, temporadas e inscripción

Auditoría exclusivamente documental. Se revisan las APIs y helpers actuales y su relación con el esquema versionado. La creación/borrado real no se repite: existe evidencia histórica de V02, pero esta petición prohíbe escrituras reales.

## M03

- Crear liga: permiso canCreateLeagues/superusuario, slug y código validados, datos acotados y limitación de peticiones. BUG-013 demuestra creación parcial al fallar membresía. No se creó nada en PRE.
- Editar liga: requireAdmin y campos de tipo explícito; normalización de ubicaciones, imágenes y acento. Diferencia de acotación entre POST y PATCH anotada; no se demostró desbordamiento con datos persistidos.
- Borrar liga: requireMember más creador/superusuario; RPC server_delete_league, evita inferir acceso por requireMember solamente. No se ejecutó.
- Roles: PATCH de membresía permite admin/player, excluye creator en lectura/escritura; admin requerido. Desvinculación permite propio/admin, protege creador y delega comprobación/transición en RPC. Se distingue operación de liga de la eliminación de cuenta.
- Invitación: regeneración admin, código validado, RPC y 409 en conflicto; claim autentica, exige perfil, comprueba código activo y jugador/temporada/ocupación. GET tiene BUG-008 (hint con código erróneo) y BUG-009 (datos internos en previsualización).
- Espectador: public-spectator valida invitación activa, acota temporada a la liga, aplica no-store/rate limit y DTO sin pagos/chat/notas. Calcula fase de secretos y calendario progresivo. No se encontró el fallback de BUG-008 en este endpoint. spectator-invites GET devuelve identidad limitada y acceso del usuario ya autenticado; no crea un vínculo en GET.
- Históricos: pruebas de validez/revocación de invitación pasan, pero solo prueban el helper isActiveStoredLeagueInvite, no el fallback del GET con hint. Es un hueco de cobertura, no una contradicción del resultado positivo de la suite.

## M04

- Estados upcoming/active/finished y mutabilidad: serverSeasonAccess comprueba temporada y liga; finished es solo lectura salvo superusuario. No se consideró un bypass por esa excepción explícita.
- Alta/configuración: valida 8–24 jugadores, modos, fechas futuras y duración. Próxima revisión detallada de calendario/manuales en M05. No se generaron temporadas reales.
- Autoinscripción: RPC vigente bloquea settings/season con FOR UPDATE, exige perfil, valida liga/jugador histórico, inscripción abierta, status upcoming y capacidad. Los locks de aforo existen; no se atribuye sobreaforo genérico sin prueba.
- Inicio: autoinscripción reutiliza RPC y gates de plantilla/cuota/calendario. Inicio programado tiene cron y fallback /api/access, que escribe; por eso no se navega con sesión real durante esta auditoría. Errores de plantilla/cuota se posponen, sin declarar inicio exitoso.
- Duplicación: exige origen finished, no upcoming existente y plantilla válida; genera calendario y cuota nueva, devuelve snapshot parcial. Incluye cleanup de temporada si fallan pasos posteriores, pero no verifica resultado del cleanup. Carrera entre duplicaciones simultáneas pendiente de reproducir; no se detectó restricción UNIQUE de upcoming por liga en esquema revisado. No se declara confirmada solo por ausencia en búsqueda.
- Lista de espera: BUG-006/007 reproducidos. BUG-010/011/012 documentados como probable/pendiente según su evidencia, sin promoción temporal real.
- Eliminación: BUG-014/015 reproducidos con helper real y almacenamiento en memoria. Mutación guardada por admin y temporada mutable; las dos incidencias se refieren a atomicidad y selección.
- Inicio fijo: termina otras active antes de actualizar la solicitada y la liga mediante escrituras independientes. Fallo intermedio podría dejar estado parcial; pendiente reproducción/registro específico. No se afirma pérdida real.

## Evidencias y límites

`ligas-espera-reproducciones.log`: 3/3, código válido e inválido; `alta-liga-reproducciones.log`: 1/1; `ciclo-temporada-reproducciones.log`: 2/2. La suite completa de 858 pruebas y 76 navegador pasó sobre el mismo código.

Pruebas PostgreSQL propias, OAuth real, confirmaciones destructivas reales y vistas autenticadas nuevas bloqueadas en esta auditoría. CI PostgreSQL inmediatamente anterior al encargo es evidencia histórica del mismo árbol funcional, no una ejecución nueva de estos escenarios. La automatización externa no versionada no se presupone inspeccionada.

M03: revisión de código y reproducciones cerrada con límites explícitos; comprobaciones visuales ampliadas siguen bloqueadas. M04 continúa para completar escenarios de ciclo/duplicación y referencias históricas; M05 prepara barrido puro del calendario.

Estado final: pendientes parciales de este checkpoint completados en M08-M15-revision.md y fichas 016..022/037. Antecedentes y balance en antecedentes-revalidados.md; no interpretar este checkpoint como estado final incompleto.
