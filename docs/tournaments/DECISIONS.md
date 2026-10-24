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
