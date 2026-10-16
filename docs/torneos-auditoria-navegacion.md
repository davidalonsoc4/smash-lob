# Fase 0 — Auditoría de navegación para Mis Competiciones

Fecha: 15 de octubre de 2026. Código revisado: `f5c79b75`, rama `codex/production-pwa-release` (v1.15.22). Auditoría estática del código y de las pruebas existentes; no se ha ejecutado la aplicación ni se afirma validación funcional en navegador.

## 1. Arquitectura y navegación actuales

### Contenedor, acceso y selección

- [`src/app/layout.tsx`](../src/app/layout.tsx) monta una sola sesión Auth.js, `ThemeProvider`, internacionalización y `AppRouteBoundary`. Este último, en [`src/components/layout/AppRouteBoundary.tsx`](../src/components/layout/AppRouteBoundary.tsx), conserva los proveedores compartidos de cuenta, temporadas, partidos, acceso y liga activa, con `AuthGate`, `ProfileCompletionGate`, `LeagueEntryGate` y `AppShell`. Las páginas públicas y `/spectate/*` tienen una rama separada sin el shell autenticado.
- [`ActiveLeagueProvider.tsx`](../src/context/ActiveLeagueProvider.tsx) guarda la liga en `localStorage`, clave `smash-lob-active-league`. Restaura una liga accesible; tras hidratar permisos, recurre a la primera liga del usuario si hace falta. `activateLeague` comprueba acceso y cambia selección sin navegar; `changeActiveLeague` y `setActiveLeagueId` además llevan a `/`. `activateGrantedLeague` cubre altas/invitaciones confirmadas y oculta el contenido anterior con una transición hasta estar listo el destino.
- [`useCurrentLeagueData.ts`](../src/hooks/useCurrentLeagueData.ts) resuelve liga, temporada, jugadores y partidos. La temporada puede ser explícita o proceder de la selección compartida por liga ([`seasonSelection.ts`](../src/lib/seasonSelection.ts)); hay alternativas según participación y permisos. No existe un selector general de modalidades ni un contexto de torneo. Tener una liga recordada **no significa** estar visualizando una página de liga.
- [`LeagueEntryGate.tsx`](../src/components/auth/LeagueEntryGate.tsx) permite `/leagues` y `/personal-matches/*` incluso sin ligas o sin temporada inicial. En el primer acceso a `/`, con varias ligas y sin ser una recarga, redirige a `/leagues`; no redirige todos los inicios indiscriminadamente. También restringe rutas de espectadores y exige primera temporada en las rutas de liga. Estos controles importan tanto como la Navbar al incorporar modalidades.

### Recorrido real

| Pantalla o acción | Comportamiento actual | Archivos principales |
| --- | --- | --- |
| Mis ligas (`/leagues`) | Lista `userLeagues`, distingue liga actual/roles, muestra resumen de temporada. Entrar llama a `changeActiveLeague` y abre `/`. Ya contiene Mis Partidos y registrar amistoso. Incluye unirse y crear liga según permisos. | [`app/leagues/page.tsx`](../src/app/leagues/page.tsx) |
| Inicio de liga (`/`) | Enlace superior a `/leagues`. El nombre abre un selector de ligas que usa `activateLeague`, y ofrece un acceso directo a Mis Partidos. Selector de temporada compartido. | [`app/page.tsx`](../src/app/page.tsx) |
| Mis Partidos (`/personal-matches`) | Actividad personal transversal: próximos amistosos y un historial paginado que combina liga y amistosos. Consume `/api/personal-matches`; no equivale a una lista exclusiva de amistosos. | [`app/personal-matches/page.tsx`](../src/app/personal-matches/page.tsx), [`lib/personalMatches.ts`](../src/lib/personalMatches.ts) |
| Abrir partido desde el historial | Si es amistoso, abre `/personal-matches/[id]`. Si es de liga, activa su liga y abre `/match/[id]`, pasando a navegación de liga. | [`PersonalMatchCard.tsx`](../src/components/personal/PersonalMatchCard.tsx) |
| Enlace directo a partido de liga | Resuelve liga y temporada autorizadas antes de mostrar contenido; no depende exclusivamente de la última liga recordada. | [`useMatchLeagueContext.ts`](../src/hooks/useMatchLeagueContext.ts), [`app/match/[id]/page.tsx`](../src/app/match/[id]/page.tsx) |
| Registrar y consultar amistosos | `/personal-matches/new` crea y reemplaza la ruta por el detalle; detalle y chat siguen en el espacio personal. Hay perfil y lista de chats personales. | [`app/personal-matches/`](../src/app/personal-matches/) |
| Ajustes | Botón flotante abre `/settings?returnTo=<pathname>`. Ajustes ofrece Mis ligas y conserva opciones dependientes de la liga/rol; tiene presentación específica de espectador. Volver usa el retorno interno explícito, luego historial válido según referrer, luego `/`. El botón transmite pathname, no query string. | [`AppShell.tsx`](../src/components/layout/AppShell.tsx), [`app/settings/page.tsx`](../src/app/settings/page.tsx), [`BackButton.tsx`](../src/components/ui/BackButton.tsx) |
| Notificación de liga | `/open?leagueId=…&target=…` comprueba acceso, activa liga y reemplaza por destino interno normalizado. | [`LeagueNotificationRedirect.tsx`](../src/components/notifications/LeagueNotificationRedirect.tsx), [`leagueNavigation.ts`](../src/lib/leagueNavigation.ts) |

El retorno del detalle de liga conserva sus reglas actuales (fallback `/matches`); no hay un retorno universal que obligue a volver a Mis Partidos. La auditoría no propone cambiarlo.

### Qué determina la Navbar

[`AppShell.tsx`](../src/components/layout/AppShell.tsx) decide por pathname qué barra montar, antes de que cada barra decida sus pestañas activas:

| Contexto de ruta | Navbar visible |
| --- | --- |
| Rutas de liga habituales: `/`, `/ranking`, `/matches`, `/match/[id]`, `/round/*`, `/player/*`, `/profile`, etc. | `BottomNav`: Inicio, Ranking, Partidos, Chats y Mi perfil. Para espectador: Inicio, Ranking, Partidos y Cuenta. |
| `/personal-matches` y descendientes, excepto chat de detalle | `PersonalMatchesNav`: Mis ligas, Mis partidos, Chats y Mi perfil. El enlace Mis ligas nunca está activo dentro de este espacio. |
| `/settings/*`, `/settings`, `/leagues`, `/availability`, `/payments`, `/activity`, `/help`, `/changelog`, administración y Avatar Lab | Ninguna barra inferior. |
| `/match/[id]/chat` y `/personal-matches/[id]/chat` | Ninguna barra inferior ni botón flotante de Ajustes; conversación ocupa su pantalla. `/chats` y `/personal-matches/chats` sí conservan sus barras respectivas. |
| Invitaciones, `/open`, `/league/new` e inicio de configuración de temporada | Sin barra inferior; las páginas públicas de espectador pasan por la rama pública del boundary. |

[`BottomNav.tsx`](../src/components/layout/BottomNav.tsx) está acoplado a liga/temporada: consulta rol de espectador, no leídos de chat y refresco de Inicio. El shell le pasa `homeOnlyLocked` para deshabilitar todo excepto Inicio en temporadas programadas. El shell también redirige rutas bloqueadas a `/`, exceptuando utilidades, Ajustes, Mis Partidos, invitaciones y notificaciones.

[`PersonalMatchesNav.tsx`](../src/components/personal/PersonalMatchesNav.tsx) tiene otro render y otra altura. Ambas barras declaran `data-bottom-nav-visible`; el shell reserva espacio inferior cuando monta alguna. No existe hoy un componente de Navbar configurable e independiente del dominio que se pueda usar directamente para torneos.

## 2. Propuesta de navegación

**Recomendación: evolucionar `/leagues` como Mis Competiciones y conservar la URL.** Ya es el punto de reunión entre ligas y actividad personal y ya está excluido de las barras y de la obligación de tener temporada. Añadir `/competitions` ahora obligaría a sincronizar enlaces y excepciones sin aportar funcionalidad. Tampoco hace falta cambiar `/` ni el arranque de la PWA.

La pantalla mantendría el acceso transversal **Mis Partidos**, y mostraría tres secciones sencillas:

1. **Ligas:** listado y acciones actuales, con idéntica selección y entrada a `/`.
2. **Torneos:** indicación «Próximamente» sin enlace a una ruta inexistente; posteriormente listado con entrada al torneo seleccionado.
3. **Amistosos:** acceso al espacio personal existente y a `/personal-matches/new`. Explicar que Mis Partidos combina liga y amistosos; no renombrar toda esa funcionalidad a Amistosos ni añadir un filtro ficticio que hoy no existe.

Mis Competiciones seguiría **sin Navbar inferior**. Inicio de liga, Ajustes y la primera pestaña personal apuntarían al mismo hub con el nuevo nombre. Se conservaría el selector rápido de ligas de Inicio y su acceso a Mis Partidos. Navegar al hub o a amistosos no borraría la liga ni temporada recordadas.

### Ampliación posterior a torneos

Usar un espacio explícito, por ejemplo `/tournaments/[id]` y sus descendientes. El identificador en la URL define qué torneo se abre y permite recarga/enlace directo; no reutilizar `activeLeagueId` ni inventar una liga para representarlo. Para esta navegación basta un pequeño clasificador de rutas (`hub`, `personal`, `league`, `tournament`, `settings`, `public`, `chat`) con prioridad para excepciones; no hace falta un proveedor universal de competiciones ni otro almacenamiento de contexto activo.

El shell debe reconocer el contexto de torneo **antes de caer en su comportamiento de liga**. `LeagueEntryGate` debe dejar de aplicar sus condiciones de liga a ese espacio; la ruta de torneo tendrá su propia comprobación de acceso cuando exista el dominio. También deben excluirse el bloqueo de temporada de liga, controles de invitación, notificaciones y búsquedas de liga. Ocultar solamente `BottomNav` no evita las redirecciones ni los controles incorrectos.

Reutilizar la presentación de la barra mediante una extracción pequeña de enlaces/iconos/estado activo a un componente sin hooks de liga (por ejemplo `ContextBottomNav.tsx`). Mantener `BottomNav` como adaptador de liga que conserva no leídos, refresco de Inicio, espectadores y bloqueo programado. Un adaptador de torneo entregaría su configuración y destinos bajo `/tournaments/[id]`; las pestañas concretas se fijarán con los requisitos del torneo, sin copiar rutas como `/ranking` o `/matches`. El adaptador personal puede mantenerse inicialmente; no es necesario unificarlo ni cambiar su diseño para añadir torneos.

La reutilización de contenido también tiene una base real: liga y amistosos ya usan [`MatchDetailView.tsx`](../src/components/match/MatchDetailView.tsx), con modelo personal en [`personalMatchDetailModel.ts`](../src/lib/personalMatchDetailModel.ts), y comparten [`MatchChatShared.tsx`](../src/components/match/chat/MatchChatShared.tsx). Un futuro torneo podría adaptar sus datos a esas vistas cuando sean compatibles. No reutilizar las páginas completas ni los hooks de liga como si fueran genéricos. `PersonalMatchOrigin` solo admite `friendly | league`: añadir torneos al historial sería otro requisito posterior, no consecuencia automática de añadir una Navbar.

Todo ello permanece bajo el layout, sesión, PWA y base de datos existentes. Esta propuesta no define tablas ni migra datos; la funcionalidad de torneos necesitará su diseño de dominio en su momento.

## 3. Cambios mínimos y tema visual

### Archivos para el primer cambio del hub

| Archivo | Cambio propuesto |
| --- | --- |
| `src/app/leagues/page.tsx` | Título Mis Competiciones, secciones de modalidades y aviso de torneos. Conservar listado, callbacks, permisos, resúmenes, invitaciones y acceso personal. |
| `src/app/page.tsx` | Cambiar el texto del enlace superior al hub; conservar el selector rápido de ligas. |
| `src/app/settings/page.tsx` | Actualizar nombre/descripción del acceso en las variantes normal y espectador. No alterar permisos ni retorno. |
| `src/components/personal/PersonalMatchesNav.tsx` | Cambiar solo el nombre de la primera pestaña; destino `/leagues`, resto de pestañas y reglas actuales intactos. |
| `src/lib/settingsSearch.ts` | Actualizar entrada del hub en los tres idiomas y sus palabras de búsqueda; mantener `/leagues` e identificador interno si sigue siendo útil. |
| `src/i18n/leagueText.ts` | Añadir traducciones de los nuevos textos para ES/EN/EU. |
| `src/components/notifications/LeagueNotificationRedirect.tsx`, `src/app/match/[id]/page.tsx` | Revisar los textos «Ver mis ligas» para que el destino común se nombre Mis Competiciones; no cambiar resolución de liga/destino. |

Al conservar `/leagues`, `AppShell`, `LeagueEntryGate`, proveedores y rutas de partidos **no requieren un cambio funcional para el hub**. `GlobalLeagueSearch` puede seguir buscando solo ligas, etiquetado como tal; no convertirlo en un buscador general ni prometer resultados de torneos. Revisar su presentación al reorganizar las secciones.

Para el contexto futuro de torneo sí se afectarían `src/components/layout/AppShell.tsx`, `src/components/auth/LeagueEntryGate.tsx`, `src/components/layout/BottomNav.tsx`, el componente presentacional nuevo, un helper pequeño de contexto de rutas y las nuevas páginas `/tournaments/[id]/*`. Ajustes aún usa `useCurrentLeagueData` y rol de la liga recordada: antes de exponerlo desde torneos habrá que conservar sus opciones de cuenta y evitar presentar configuración de la última liga como si fuera del torneo. La configuración específica del torneo pertenecerá a su espacio de rutas. No se propone una reescritura de todo Ajustes.

### Dependencias del tema y alternativa global

**El tema ya es global en gran parte.** [`ThemeProvider.tsx`](../src/context/ThemeProvider.tsx) aplica a `<html>` modo claro/oscuro/sistema, estilo `classic | competition`, paleta y acento elegidos en Ajustes. Se guardan localmente, no como un tema distinto por liga. «Competition» aquí es el nombre de un estilo visual, no un contexto de torneo.

La parte dinámica de liga sigue esta cadena:

1. `LeagueAccessProvider` expone `accentColor`; [`app/admin/league/page.tsx`](../src/app/admin/league/page.tsx) permite editarlo.
2. `AppShell` llama a `setLeagueAccent(activeLeague?.accentColor)` **en todas sus rutas**, incluido hub, Mis Partidos y Ajustes.
3. [`visualStyle.ts`](../src/lib/visualStyle.ts) resuelve el acento: en estilo Competition, la opción `league` usa ese color; un acento fijo como `gold` o `blue` ya permite independizarlo. Classic usa su paleta.
4. [`globals.css`](../src/app/globals.css) consume `--league-accent`, `--competition-accent`, sus contrastes y `--app-accent` para tarjetas, cabeceras, botones y barra. Por ello el acento de la última liga puede seguir visible en el espacio personal. Además, `AppShell` aplica `status-colors-disabled` según `activeLeague.statusColorsEnabled`, otra dependencia visual que no desaparece al fijar el acento.

También hay aplicación inicial antes de React en `src/app/layout.tsx`, y apariencia pública de invitaciones en [`spectatorTheme.ts`](../src/lib/spectatorTheme.ts). Esta última tiene un contrato propio: la apariencia del enlace de espectador no debe quedar sobrescrita por preferencias privadas del visitante anónimo. No basta con retirar una llamada del shell.

**Recomendación mínima: conservar el tema actual al introducir Mis Competiciones.** No es requisito para la navegación. Si después se decide usar un tema global independiente de ligas, la vía corta es conservar ThemeProvider y el CSS, elegir un acento global fijo y normalizar la preferencia local `league` a ese valor. Deben concordar el bootstrap del layout, `visualStyle.ts`, ThemeProvider y el selector `src/app/settings/appearance/page.tsx`; dejar de usar el acento de liga como fuente del tema global y decidir por separado el alcance global de colores de estado. Mantener campos y edición de identidad de liga evita migraciones y permite conservarlos en logos/tarjetas.

Cambiar el valor por defecto no transforma preferencias `league` ya guardadas. Retirar solo `setLeagueAccent` las dejaría usando un fallback en vez de una política explícita. Si el tema global también debe alcanzar espectadores anónimos, eso exige una decisión independiente sobre el contrato de enlaces existentes; por defecto conservarlo. No es necesario modificar autenticación, manifiesto, service worker ni superficies del sistema para ninguna de estas decisiones de tema web.

## 4. Riesgos y comprobaciones imprescindibles

| Riesgo | Comprobación exigible al implementar |
| --- | --- |
| Doble Navbar, barra de liga en hub/torneo o selección activa errónea | Verificar una sola barra en cada contexto y ninguna en hub/Ajustes/chat de detalle; recorrer liga → hub → personal → detalle de liga → Ajustes → volver, con recarga y Atrás. |
| Redirección por última liga sin temporada, programada o de espectador | Probar hub y amistosos con cero/una/varias ligas, temporada ausente/programada/finalizada, jugador/admin/espectador. Torneos no deben heredar bloqueos, rol ni acciones de esa liga. |
| Perder contexto en historial, enlace directo o notificación | Abrir partido de otra liga desde Mis Partidos y mediante enlace directo; confirmar liga, temporada y Navbar. Comprobar `/open`, selección denegada y acceso revocado sin mostrar datos anteriores. |
| Regresión en amistosos | Verificar próximos e historial paginado, alta → detalle, resultado, reservas/pagos, lista de chats, chat de detalle y perfil; conservar sus endpoints y permisos. |
| Ajustes vuelve al lugar equivocado o muestra configuración ajena | Verificar `returnTo` desde liga, personal y hub; retorno inseguro rechazado. Para torneos, probar cuenta global sin datos/permisos de la liga anterior y retorno al torneo correcto. |
| Textos largos o búsqueda desactualizada | Revisar nuevo rótulo de pestaña en móvil/escritorio y ES/EN/EU, foco/teclado en tarjetas y búsqueda del hub sin afirmar que busca torneos. |
| Acento o estados heredados y destellos al arrancar | Probar Classic y Competition, claro/oscuro/sistema, acento de liga y fijo, cambio entre dos ligas, arranque/recarga y enlaces de espectador. Mantener contraste y contrato de preferencias guardadas. |

Referencias de cobertura ya presentes: `tests/unit/leaguesNavigation.test.ts`, `matchLeagueContext.test.tsx`, `personalMatchesNavigation.test.ts`, `v11022SettingsContextNavigation.test.ts`, `v11017SettingsContextAndPersonalSafeArea.test.ts`, `v11010UnifiedMatchAndPersonalChat.test.ts`, `competitionVisualStyle.test.ts` y `tests/e2e/authenticated-screens.spec.ts`. Algunas pruebas comprueban texto fuente: no sustituyen recorridos conductuales ni bastan para afirmar ausencia de una Navbar incorrecta.

Para futuras modificaciones: ejecutar primero las pruebas focalizadas del dominio, y antes de aceptar la entrega `npm run validate`, `npm run test:e2e` y `git diff --check`. Playwright debe usar exclusivamente el entorno ficticio de `playwright.config.ts`; no cuentas personales ni datos Production. OAuth real y cualquier comprobación de datos PRE siguen siendo puertas manuales explícitas. Detenerse ante una validación crítica fallida. No actualizar capturas solo para ocultar regresiones.

Validación de **esta fase documental**: contraste de referencias con código, comprobación de existencia de archivos citados, `git diff --check` y revisión del alcance del diff. No se ejecutan gates de una implementación inexistente ni se marca completado un hito funcional. Los hitos de PLAN figuran DONE; esta entrega se limita a la Fase 0 solicitada, sin reabrir ni avanzar trabajo ajeno. Fuera de alcance: base de datos, migraciones, dependencias, commits, publicación y problemas de la barra de gestos de Android.

## 5. Plan de implementación: tres tareas pequeñas

1. **Convertir el hub existente en Mis Competiciones.** Cambiar textos y secciones en los archivos de la tabla; mantener `/leagues`, todos los callbacks de liga y Mis Partidos, y torneos como aviso sin destino. Verificable: seleccionar otra liga sigue abriendo su Inicio; amistosos abren las mismas rutas; hub y Ajustes no muestran Navbar; ES/EN/EU y búsqueda consistentes. Mantener tema y arranque actuales.
2. **Cubrir los recorridos entre contextos.** Añadir pruebas conductuales focalizadas para las transiciones de la tabla, retorno desde Ajustes y casos sin liga/con temporada bloqueada. Corregir únicamente regresiones del cambio del hub si aparecen. Verificable: contenido, contexto y número de barras correctos en cada paso; pruebas focalizadas y gates locales completos anteriores pasan con datos ficticios. Esta tarea cierra la entrega del hub sin implementar torneos.
3. **Cuando comience torneos, incorporar su contenedor mínimo.** Añadir espacio `/tournaments/[id]`, clasificación de ruta y excepciones precisas de `LeagueEntryGate`/AppShell; extraer solo el render necesario de Navbar y conservar el adaptador de liga. Probar con datos sintéticos navegación propia, acceso denegado, enlace directo, recarga, Ajustes y retorno al hub, incluso sin ligas o con una liga espectadora/programada recordada. Verificable: ningún hook, bloqueo o control de liga alimenta la Navbar de torneo; ligas y amistosos conservan sus recorridos. El dominio persistente de torneos se diseñará después; esta tarea no autoriza tablas ni migraciones.

La sustitución opcional del acento dinámico por uno global queda documentada arriba y se pospone: mezclarla con estas tareas ampliaría el cambio visual sin ser necesaria para Mis Competiciones.
