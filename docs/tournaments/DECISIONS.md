# Decisiones e inventario

## Base real (24/10/2026)

| Área | Implementado | Brecha / reutilización |
| --- | --- | --- |
| Rápidos | `lib/rapidTournament.ts`: Americana 8–16, 1–4 pistas, 60/90/120, 16 min/ronda, transiciones 3 min; plantilla original 12/2 preservada | Máximo 24, tiempos/rondas configurables y parejas fijas pendientes. El balance general permite diferencia de un partido, no igualdad exacta universal |
| Mexicano | `lib/dynamicMexicano.ts`, `serverDynamicMexicano.ts`: ronda incremental determinista, ranking normalizado, RPC con control de estado/concurrencia | Parejas fijas y parámetros extendidos pendientes; no recalcular partidos disputados |
| Persistencia | `rapid_tournaments`, `_players`, `_rounds`, `_matches`, RPC de crear/sortear/iniciar/resultados/finalizar; migraciones flexibles y Mexicano existentes | Esquema restringe 8–16 y 1–6 rondas. No basta con desbloquear inputs. Migraciones nuevas aditivas y compatibilidad legacy necesarias |
| Acceso | `serverRapidTournaments.ts`: creador gestiona, cuenta vinculada consulta; `api/tournament-invites/*` reclama perfil con token | Admin delegado, espectador e inscripción por pareja pendientes; no heredar permisos por ser admin de liga origen |
| Pantallas | `components/tournament/RapidTournamentPage`, CreateForm, Settings, Live, TournamentNav; hub `/leagues` y listados operativos | Tradicional deshabilitado; registro de resultado y modelo centrados en puntos individuales |
| Directo | `rapidTournamentTiming`, `rapidTournamentAudio`, `RapidAudioSettings`: inicio real, preparación/transición, alertas y preferencias | Conservar, probar con nuevos parámetros; sin prometer sonido/background fuera de las capacidades PWA |
| Liga origen | `serverTournamentLeagueRoster`, formulario y administración importan plantilla y guardan liga/temporada origen | Snapshot independiente; no sincronizar resultados ni participantes después |
| Perfil | `PlayerProfileScreen`, `PersonalProfileStatistics`, `PlayerProfileIdentityCard`, `ProfileFormResults`, tabs/cara a cara compartidos | `PersonalMatchOrigin` sigue `friendly | league`; torneos no se agregan realmente. No convertir puntos en juegos/sets |
| UI | AppCard, SectionHeader, FitText, SelectChevron, BackButton, ContextBottomNav, MatchDetailView/MatchTeamsPanel y estilos semánticos | Adaptar datos, no copiar páginas de liga ni sus hooks/contextos. Preservar disponibilidad actual de COMPETITION |
| Social/economía | Chat/finanzas/notificaciones de liga y amistosos existen | Modelos autorizan por liga/partido: extraer presentación/cálculos y añadir contexto de torneo; no simular una liga ni inventar temporadas |

## Reglas de implementación

1. Conservar tablas, IDs y algoritmos de torneos existentes. Nuevos contratos explícitos y adaptadores; ampliar esquema por migraciones nuevas. Nada aplicado se edita.
2. Clasificación por jugador en rotativas y por equipo en fijas; métricas tipadas según puntuación. Desempates ordenados, deterministas y verificables; empates deportivos conservan posición compartida.
3. Viabilidad en servidor antes de crear/iniciar y en preview cliente; advertir balances matemáticamente imposibles en vez de declarar equilibrio perfecto.
4. Resultados disputados son inmutables frente a sorteos/recálculos automáticos. Correcciones autorizadas requieren historial, advertencias y control transaccional.
5. Un torneo no tiene temporadas. Liga/temporada origen son procedencia; identidad de cuenta global, nombres manuales vinculables mediante invitación existente.
6. Ningún push/merge ni PRE/PROD autorizado para este objetivo. Commits locales sí; pruebas aisladas sin cuentas personales.
7. Auto-Resume no es un ejecutor continuo de objetivos: su watcher recupera este chat tras fallos clasificados, sujeto a límites y a que el chat esté abierto. El plan y los checkpoints son la fuente de reanudación.
8. Duplicar usa un borrador editable con una nueva creación, no copia resultados ni reinicia el original. Servidor y nueva RPC exigen propiedad; las cuentas vinculadas por invitación pueden conservarse desde ese original autorizado aunque ya no compartan liga. Las RPC legacy mantienen sus restricciones. Cobertura SQL local y API; aplicación remota pendiente.
9. T03 entrega la creación común y configura los formatos rotativos ya existentes. La selección e inscripción por parejas fijas se integra con los motores en T04, y las opciones tradicionales con sus motores en T05. Se ajusta la dependencia de hitos, sin retirar alcance del objetivo ni habilitar controles sin implementación.
10. Calendario íntegro y participación con diferencia máxima de un partido son requisitos de inicio. Variedad de compañeros/rivales y rachas son optimizaciones auditadas por separado: una advertencia nunca se presenta como «Todo correcto». La plantilla original 12/2/6 conserva sus invariantes.
11. PostgreSQL local portátil sustituye únicamente la ausencia de Docker para probar las migraciones de torneos con fixtures sintéticos y roles reales. No equivale al gate final completo de Supabase/pgTAP/restore. El harness verifica el directorio del clúster y solo borra su propia base recién creada.
12. Parejas fijas reutilizan los cálculos exactos de clasificación existentes, contabilizando una unidad por pareja (sin duplicar puntos). Selección prioriza participación y descanso; Americana minimiza revancha, Mexicano cruza niveles próximos dentro de tolerancia de tres puntos. Distribución de pistas se optimiza sin prometer invariantes incompatibles: cuatro parejas, dos pistas y tres rondas con todos los rivales distintos obligan a que alguna pareja juegue las tres rondas en la misma pista.
