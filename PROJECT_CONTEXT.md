# PROJECT_CONTEXT

Contexto actualizado del proyecto `smash-lob` en `D:\DEVELOP\smash-lob`.

Fecha de esta actualizacion: 2026-06-29.

Este documento resume el estado real del prototipo despues de la ultima tanda de cambios. La app sigue siendo un prototipo local con datos fake y persistencia en `localStorage`; no hay backend ni autenticacion real todavia.

## Stack

- Next.js `16.2.9` con App Router en `src/app`.
- React `19.2.4`.
- TypeScript estricto.
- Tailwind CSS v4 con clases en JSX.
- Estado cliente con React Context.
- Persistencia temporal en `localStorage`.
- Sin base de datos.
- Login con Google implementado con Auth.js/NextAuth en modo minimo.
- La sesion se usa para identificar al usuario por email, pero los datos de liga siguen siendo fake/localStorage.

Scripts utiles:

```bash
npm run dev
npm run lint
npx tsc --noEmit
```

Validacion reciente:

- `npx tsc --noEmit`: OK.
- `npm run lint`: OK, con 3 warnings conocidos de dependencias de hooks:
  - `src/context/LeagueSettingsProvider.tsx`
  - `src/context/SeasonSettingsProvider.tsx`
  - `src/i18n/I18nProvider.tsx`

## Estado funcional actual

### Datos fake

El archivo principal es `src/data/fakeData.ts`.

Estado actual:

- Liga activa por defecto: `league-smash-lob`.
- Temporada activa: `season-2`.
- Las ligas creadas desde la UI se guardan en `localStorage` con la clave `smash-lob-leagues`.
- 8 jugadores en la temporada de Smash & Lob:
  - `davo`
  - `alvaro`
  - `alain`
  - `julen`
  - `bea`
  - `carlos`
  - `irene`
  - `marcos`
- Hay 7 jornadas con 2 partidos por jornada.
- La jornada 4 existe con partidos sin programar.
- `davo` tiene rol `admin`.
- `alvaro` tiene rol `player`.
- El tipo de rol ya contempla `creator`, `admin` y `player`.
- Las temporadas y sus jugadores se pueden modificar localmente mediante `SeasonSettingsProvider`.
- No tiene por que haber los mismos jugadores en cada temporada de una liga; la relacion vive en `seasonPlayers`.
- `SeasonSettingsProvider` tambien puede guardar perfiles de jugadores creados para nuevas temporadas en `smash-lob-season-data`.
- Decision de modelo: las invitaciones y el acceso son por liga; la participacion, calendario y reglas de juego son por temporada.

### Providers principales

En `src/app/layout.tsx`, la app se envuelve con:

1. `I18nProvider`
2. `AuthSessionProvider`
3. `AuthGate`
4. `SeasonSettingsProvider`
5. `LeagueAccessProvider`
6. `ActiveLeagueProvider`
7. `CurrentUserProvider`
8. `LeagueSettingsProvider`
9. `MatchDataProvider`
10. `LeagueEntryGate`
11. `AppShell`

`SeasonSettingsProvider` va por encima de `LeagueAccessProvider` para que las invitaciones y el usuario actual puedan resolver jugadores creados localmente al preparar una nueva temporada.

`CurrentUserProvider` representa el jugador reclamado por el usuario autenticado en la liga activa. Ya no existe selector temporal de usuario en Ajustes.

### Permisos

La logica esta en `src/lib/permissions.ts`.

Regla actual:

- `creator` y `admin` pueden administrar la liga activa.
- `creator` y `admin` pueden gestionar cualquier partido editable, aunque no participen.
- Jugadores normales solo pueden programar, aplazar, registrar o editar resultados de partidos en los que participan.

Esto se aplica en:

- `src/app/admin/page.tsx`
- `src/app/admin/league/page.tsx`
- `src/app/admin/season/page.tsx`
- `src/app/match/[id]/page.tsx`

Importante: esto es control de UI cliente, no seguridad real de backend.

## Pantallas actuales

### Inicio (`src/app/page.tsx`)

Muestra:

- Liga y temporada activas.
- Lider.
- Progreso de jornadas.
- Clasificacion resumida de 3 jugadores alrededor del usuario conectado:
  - si el usuario esta en medio, se muestra anterior/usuario/siguiente;
  - si es primero o ultimo, queda en extremo.
- Ultimo partido jugado.
- Proximo partido.

Detalles recientes:

- La clasificacion ya no muestra toda la tabla.
- La fila del usuario conectado se resalta.
- Los puntos tienen margen derecho/ancho minimo para no quedar pegados al borde.

### Partidos (`src/app/matches/page.tsx`)

Muestra jornadas agrupadas.

Estado actual:

- Soporta varios partidos por jornada.
- En cada tarjeta, dentro de esta pantalla, el encabezado de partido muestra fecha de juego si esta finalizado o estado pendiente si no se ha jugado.
- El encabezado de jornada muestra `Completada`, `En curso`, `Proxima`, etc.
- Hay separacion entre tarjetas de partidos de la misma jornada.

### Detalle de partido (`src/app/match/[id]/page.tsx`)

Muestra:

- Marcador.
- Ventana oficial de jornada.
- Programacion.
- Formulario de programacion/reprogramacion.
- Formulario de resultado.
- Edicion de resultado.

Reglas:

- Partido `scheduling`: se puede programar antes de registrar resultado.
- Partido `scheduled`: se puede registrar resultado.
- Partido `finished`: se puede editar resultado.
- Partido `postponed`: debe reprogramarse antes de resultado.
- Admin/creator pueden gestionar todo.
- Jugadores normales solo gestionan sus partidos.

### Perfil (`src/app/profile/page.tsx`)

Se redujo para que no sea agobiante.

Muestra:

- Estadisticas del usuario conectado.
- Proximo partido.
- Ultimos 3 resultados.
- Acceso a historial completo.

Ya no muestra todos los partidos directamente.

### Historial de partidos (`src/app/profile/matches/page.tsx`)

Nueva pantalla.

Permite filtrar partidos del usuario conectado por:

- Todos
- Jugados
- Pendientes
- Programados
- Sin programar
- Aplazados

El filtro actual usa query string:

```text
/profile/matches?status=finished
```

El control visual es un selector compacto.

### Ajustes (`src/app/settings/page.tsx`)

Contiene:

- Boton `Volver`.
- Cambio de liga activa.
- Boton `Crear nueva liga`.
- Cambio de idioma.
- Acceso al panel admin si el usuario actual es admin/creator.
- Cuenta, cierre de sesion y acceso al flujo de invitaciones.
- Bloque de proximamente.

### Admin (`src/app/admin/page.tsx`)

Panel central de administracion.

Accesible solo para `creator`/`admin`.

Incluye un bloque `Invitar jugadores` con:

- Codigo de invitacion de la liga activa.
- Enlace `/invite/[code]`.
- Botones para copiar codigo o enlace.
- Boton para regenerar el codigo de la liga activa.

El invitado abre el enlace, inicia sesion con Google si hace falta y reclama uno de los jugadores no vinculados.

Los jugadores creados como huecos nuevos al preparar una temporada tambien quedan como jugadores de liga pendientes y pueden reclamarse mediante invitacion de liga.

Los codigos regenerados se guardan en `localStorage` con la clave `smash-lob-league-invite-codes`. Al regenerar, el codigo anterior deja de validar para nuevas invitaciones.

### Crear nueva liga (`src/app/league/new/page.tsx`)

Accesible desde Ajustes y desde el onboarding cuando el usuario no pertenece a ninguna liga.

Cualquier usuario autenticado puede crear una liga nueva aunque ya pertenezca a otras.

El formulario crea:

- Liga nueva con codigo de invitacion propio.
- Primera temporada activa.
- Jugadores iniciales de esa temporada.
- Perfil del primer jugador vinculado al usuario creador con rol `creator`.
- Reglas de juego y margen de jornadas guardados como ajustes de esa temporada.

Persistencia temporal implicada:

- `smash-lob-leagues`: ligas creadas localmente.
- `smash-lob-user-league-memberships`: membresia del creador.
- `smash-lob-season-data`: temporada inicial, jugadores y participantes.
- `smash-lob-season-round-settings`: reglas/margenes de la temporada inicial.
- `smash-lob-active-league`: liga nueva seleccionada como activa.

### Admin liga (`src/app/admin/league/page.tsx`)

Permite gestionar lugares habituales de juego.

### Admin temporada (`src/app/admin/season/page.tsx`)

Si la temporada activa esta en estado `active`, permite gestionar solo lo editable durante la temporada:

- Margen de jornadas:
  - sin margen;
  - margen fijo por jornada;
  - fecha de inicio;
  - dias por jornada.
- Listado de jugadores de la temporada, marcando si cada jugador ya esta vinculado a una cuenta de Google o sigue pendiente.
- Boton inferior `Terminar temporada`.

Si la temporada activa esta `finished`, desaparecen los ajustes editables y la pantalla pasa a `Comenzar nueva temporada`.

Ajustes de nueva temporada en esta fase:

- Nombre de la temporada.
- Cantidad de jugadores limitada a 8, 12 o 16.
- Participantes elegidos desde los jugadores existentes de la liga.
- Huecos restantes completados con nuevos nombres, que crean jugadores de liga pendientes de vincular.
- Calendario equilibrado como unica opcion visible de momento.
- Regla `Exigir tres sets jugados`.
- Margen de jornadas: fijo o sin margen.
- Fecha de inicio de la temporada y dias por jornada si se elige margen fijo.

Decisiones:

- La liga gestiona personas, invitaciones, roles y acceso.
- La temporada gestiona competicion: participantes, calendario, reglas y resultados.
- Las reglas de resultado, cantidad de jugadores, calendario y nombres iniciales se definen al crear la temporada; durante la temporada no se editan desde esta pantalla.
- Los margenes y fechas de jornadas si son editables durante la temporada.
- La cantidad de jornadas se calcula de momento como `cantidad de jugadores - 1`, siguiendo la logica actual de 8 jugadores / 7 jornadas.

Estos datos se guardan de momento en `localStorage` con la clave `smash-lob-season-data`.

## Resultado de partidos

El formulario esta en `src/components/match/MatchResultForm.tsx`.

Estado actual:

- Formato compacto en tabla.
- Valida sets tipo `6-0`, `6-4`, `7-5`, `7-6`.
- Calcula puntos por sets ganados.
- Si `requiresThreeSets` esta activo, exige tres sets validos.
- Si `requiresThreeSets` esta desactivado, permite guardar 1 o 2 sets validos e ignora los sets vacios.

`MatchDataProvider` guarda ahora `resultRecordedAt` cuando se registra o edita un resultado:

```ts
resultRecordedAt: new Date().toISOString()
```

De momento `resultRecordedAt` no se muestra en UI.

## Navegacion y layout

`AppShell`:

- Layout mobile-first.
- Barra inferior con Inicio, Ranking, Partidos y Perfil.
- Boton flotante de Ajustes donde corresponde.
- En Perfil no aparece el boton flotante de Ajustes duplicado si ya se gestiona por la ruta de ajustes.

`BackButton`:

- Usa enlace con `fallbackHref`.
- Evita depender exclusivamente de `router.back()`.

`BottomNav`:

- Perfil queda activo tambien en subrutas como `/profile/matches`.

## Internacionalizacion

La app usa `src/i18n/I18nProvider.tsx` y `src/i18n/locales/es.ts`.

El idioma usado en las nuevas piezas esta principalmente actualizado en `es.ts`.

Los locales `en.ts` y `eu.ts` existen, pero pueden ir por detras del espanol.

## Google Login

Google Login ya esta implementado en fase minima.

Archivos principales:

- `src/auth.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/context/AuthSessionProvider.tsx`
- `src/components/auth/AuthGate.tsx`
- `src/components/auth/LeagueEntryGate.tsx`
- `src/context/LeagueAccessProvider.tsx`
- `src/context/CurrentUserProvider.tsx`

Dependencia instalada:

- `next-auth@5.0.0-beta.31`

Variables en `.env.local`:

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- tambien se dejaron `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` como alias/local legacy.

Callback local previsto:

```text
http://localhost:3000/api/auth/callback/google
```

Funcionamiento actual:

- Si no hay sesion, se muestra pantalla de entrada con boton `Entrar con Google`.
- Si se abre `/invite/[code]` sin sesion, se redirige al login de Google y se vuelve a esa invitacion.
- Si el usuario autenticado no pertenece a ninguna liga, `LeagueEntryGate` muestra Crear nueva liga / Unirme a liga existente.
- El modo implementado es cerrado: el usuario valida un codigo de invitacion y reclama un jugador predefinido.
- La vinculacion real del prototipo vive en `UserLeagueMembership`: `userId` de Google, `leagueId`, `playerId` y `role`.
- `PlayerProfile` no guarda email de Google; `Player.displayName` sigue siendo el nombre visible deportivo.

Importante:

- `.env.local` esta ignorado por git y no debe subirse.

## Cosas decididas para mas adelante

- Nueva Liga se hara mas adelante, cuando el flujo principal este mas funcional.
- Nuevo Torneo tambien queda para mas adelante.
- La creacion de ligas probablemente empezara como pantalla simple con todas las opciones, no como guia multipaso.
- Mas adelante:
  - usuarios reales;
  - invitaciones por email o enlace;
  - roles gestionables por creator;
  - varias ligas por usuario;
  - torneos;
  - persistencia real en backend/base de datos.

## Notas de desarrollo

- Cuidado con `localStorage`: puede conservar datos antiguos y hacer que el estado local no coincida con `fakeData.ts`.
- Para probar permisos, usar membresias en `defaultUserLeagueMemberships` o reclamar jugadores mediante `/invite/[code]`.
- Para limpiar estado local durante pruebas, puede ser necesario borrar claves:
  - `smash-lob-user-league-memberships`
  - `smash-lob-matches`
  - `smash-lob-season-round-settings`
  - `smash-lob-season-data`
  - `smash-lob-leagues`
  - `smash-lob-league-settings`
  - `smash-lob-league-invite-codes`
  - `smash-lob-active-league`
- No hay seguridad real hasta que exista backend.
