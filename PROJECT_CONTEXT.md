# PROJECT_CONTEXT

Documento de contexto del proyecto `smash-lob`, generado a partir del estado actual del codigo en `D:\DEVELOP\smash-lob`.

Este archivo documenta lo que existe ahora mismo. No describe una version ideal ni cambios pendientes no aplicados. Nota importante: el usuario indico que todavia no se habia añadido el rol `creator`, pero el codigo actual si lo contiene en `src/data/fakeData.ts` y `src/lib/permissions.ts`. Por fidelidad al codigo, este documento registra esa realidad y la marca como punto a revisar.

## Arbol completo de archivos y carpetas

Arbol del proyecto excluyendo el contenido interno de `node_modules/` y `.next/`, que existen pero son dependencias/cache generada.

```text
smash-lob/
├─ .gitignore
├─ .next/
├─ eslint.config.mjs
├─ next-env.d.ts
├─ next.config.ts
├─ node_modules/
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ PROJECT_CONTEXT.md
├─ public/
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ README.md
├─ src/
│  ├─ app/
│  │  ├─ admin/
│  │  │  ├─ league/
│  │  │  │  └─ page.tsx
│  │  │  └─ season/
│  │  │     └─ page.tsx
│  │  ├─ favicon.ico
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  ├─ match/
│  │  │  └─ [id]/
│  │  │     └─ page.tsx
│  │  ├─ matches/
│  │  │  └─ page.tsx
│  │  ├─ page.tsx
│  │  ├─ player/
│  │  │  └─ [id]/
│  │  │     └─ page.tsx
│  │  ├─ profile/
│  │  │  └─ page.tsx
│  │  ├─ ranking/
│  │  │  └─ page.tsx
│  │  └─ settings/
│  │     └─ page.tsx
│  ├─ components/
│  │  ├─ layout/
│  │  │  ├─ AppShell.tsx
│  │  │  ├─ BottomNav.tsx
│  │  │  ├─ HeaderLeagueSelector.tsx
│  │  │  └─ LanguageSwitcher.tsx
│  │  ├─ league/
│  │  │  └─ LeagueSwitcher.tsx
│  │  ├─ match/
│  │  │  ├─ MatchResultForm.tsx
│  │  │  ├─ MatchScheduleBox.tsx
│  │  │  ├─ MatchScheduleForm.tsx
│  │  │  ├─ MatchScoreboard.tsx
│  │  │  └─ MatchStatsGrid.tsx
│  │  ├─ matches/
│  │  │  ├─ MatchCard.tsx
│  │  │  ├─ MatchStatusBadge.tsx
│  │  │  └─ RoundSection.tsx
│  │  ├─ player/
│  │  │  ├─ PlayerMatchesList.tsx
│  │  │  ├─ PlayerNameLink.tsx
│  │  │  └─ TeamPlayers.tsx
│  │  ├─ ranking/
│  │  │  └─ RankingTable.tsx
│  │  └─ ui/
│  │     ├─ AppCard.tsx
│  │     ├─ SectionHeader.tsx
│  │     └─ StatCard.tsx
│  ├─ context/
│  │  ├─ ActiveLeagueProvider.tsx
│  │  ├─ LeagueSettingsProvider.tsx
│  │  ├─ MatchDataProvider.tsx
│  │  └─ SeasonSettingsProvider.tsx
│  ├─ data/
│  │  └─ fakeData.ts
│  ├─ hooks/
│  │  └─ useCurrentLeagueData.ts
│  ├─ i18n/
│  │  ├─ I18nProvider.tsx
│  │  ├─ locales/
│  │  │  ├─ en.ts
│  │  │  ├─ es.ts
│  │  │  └─ eu.ts
│  │  └─ translations.ts
│  └─ lib/
│     ├─ leagues.ts
│     ├─ permissions.ts
│     ├─ players.ts
│     ├─ ranking.ts
│     └─ rounds.ts
└─ tsconfig.json
```

## Resumen tecnico del stack

- Framework: Next.js `16.2.9`, con App Router en `src/app`.
- Lenguaje: TypeScript, con `strict: true` en `tsconfig.json`.
- UI: React `19.2.4` y React DOM `19.2.4`.
- Estilos: Tailwind CSS v4 mediante `@tailwindcss/postcss`; las clases se escriben directamente en JSX.
- Gestor de paquetes: npm, confirmado por `package-lock.json`.
- Scripts disponibles: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.
- Base de datos: no hay base de datos ni cliente de backend.
- Persistencia: `localStorage` en el navegador.
- Autenticacion: no existe login real; el usuario actual esta fijado en `currentUserId = "davo"`.
- Permisos: existe logica en `src/lib/permissions.ts`; se aplica en Ajustes y rutas admin de forma client-side, no como seguridad real de backend.
- Internacionalizacion: sistema propio con `I18nProvider`, `translations.ts` y locales `es`, `en`, `eu`.
- Assets: solo SVGs de plantilla en `public/`; no se ve uso directo en la app.
- Alias: `@/*` apunta a `./src/*`.

## Archivos de configuracion y raiz

### `package.json`

Define el proyecto privado `smash-lob`. Las dependencias de runtime son solo `next`, `react` y `react-dom`. Las dependencias de desarrollo son TypeScript, tipos de React/Node, ESLint, configuracion ESLint de Next y Tailwind v4. No hay dependencias para formularios, fechas, iconos, auth, base de datos ni estado global externo.

### `package-lock.json`

Lockfile de npm. Debe mantenerse sincronizado si se instalan o eliminan dependencias.

### `tsconfig.json`

Configura TypeScript estricto, `noEmit`, resolucion `bundler`, JSX `react-jsx`, plugin de Next y alias `@/*`. Incluye tipos generados de `.next`. Aunque `allowJs` esta activo, el codigo relevante actual esta en TS/TSX.

### `next.config.ts`

Configuracion minima de Next. Incluye `allowedDevOrigins` con `http://192.168.3.2:3000` y `http://localhost:300`. El segundo origen parece sospechoso porque falta un cero si la intencion era `localhost:3000`.

### `eslint.config.mjs`

Usa `eslint-config-next/core-web-vitals` y `eslint-config-next/typescript`. Ignora `.next/**`, `out/**`, `build/**` y `next-env.d.ts`.

### `postcss.config.mjs`

Activa Tailwind v4 mediante el plugin `@tailwindcss/postcss`.

### `next-env.d.ts`

Archivo generado por Next. No se debe editar manualmente. Contiene referencias de tipos de Next e importa tipos de rutas generados en `.next/dev/types/routes.d.ts`.

### `README.md`

Es el README inicial de `create-next-app`. No contiene documentacion especifica del producto Smash & Lob.

### `PROJECT_CONTEXT.md`

Este documento. Es documentacion, no forma parte del runtime de la app.

### `public/`

Contiene SVGs de plantilla (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`). No se observa que esten importados por componentes actuales.

## Carpetas principales

### `src/app`

Contiene las rutas de Next App Router. Casi todas las paginas usan `"use client"`, porque dependen de contextos React, `localStorage`, hooks de navegacion o estado local.

### `src/components`

Componentes por dominio. La organizacion es clara y pragmatica: layout, liga, partido, listado de partidos, jugador, ranking y UI generica.

### `src/context`

Providers React de estado cliente. Son la capa de estado mutable del prototipo y guardan datos en `localStorage`.

### `src/data`

Datos fake y tipos base. Es la fuente inicial del dominio mientras no haya backend.

### `src/hooks`

Contiene el hook agregador `useCurrentLeagueData`, que es el punto central de lectura de datos para las paginas.

### `src/i18n`

Sistema casero de traducciones. El locale base es español y los otros idiomas se fusionan por fallback.

### `src/lib`

Funciones de dominio y calculo: ligas, jugadores, ranking, jornadas y permisos.

## Rutas y paginas

### `src/app/layout.tsx`

Root layout de Next. Define metadata y envuelve la app en este orden:

1. `I18nProvider`
2. `ActiveLeagueProvider`
3. `LeagueSettingsProvider`
4. `SeasonSettingsProvider`
5. `MatchDataProvider`
6. `AppShell`

El orden es importante porque las paginas usan `useCurrentLeagueData`, y ese hook depende de varios providers. La metadata define `title: "Smash & Lob"` y una descripcion con texto de padel.

### `src/app/page.tsx`

Dashboard principal. Muestra temporada activa, nombre de liga, descripcion de liga, ranking resumido, lider, progreso de jornadas, ultimo partido y siguiente partido. Usa `useCurrentLeagueData`, tarjetas UI, `MatchStatusBadge` y `getTeamDisplayName`.

Nota: `activeLeague.description` ya esta definido en el tipo `League` y en las ligas fake.

### `src/app/matches/page.tsx`

Calendario por jornadas. Usa `rounds` y `matches` de `useCurrentLeagueData`. Para cada jornada con partidos muestra ventana de fechas, estado y tarjetas `MatchCard`. Si no hay partidos, muestra estado vacio.

### `src/app/match/[id]/page.tsx`

Detalle de partido. Obtiene el parametro `id`, busca el partido dentro de la liga y temporada activas, muestra marcador, ventana oficial de jornada, programacion, registro/edicion de resultado y mensajes segun estado.

Reglas visibles:

- Resultado nuevo solo si el partido esta `scheduled`.
- Resultado editable si el partido esta `finished`.
- Partido `scheduling` pide programacion antes del resultado.
- Partido `postponed` pide reprogramacion antes del resultado.

### `src/app/ranking/page.tsx`

Pagina de clasificacion individual. Toma jugadores calculados desde `useCurrentLeagueData` y renderiza `RankingTable`.

### `src/app/profile/page.tsx`

Perfil del usuario actual fake. Busca el jugador con `currentUserId`. Muestra puntos, diferencia, resumen de temporada, partidos del usuario, acceso a ajustes y una tarjeta futura sobre cuenta/invitaciones.

### `src/app/player/[id]/page.tsx`

Perfil publico de jugador. Busca por `slug` o `id`, muestra estadisticas y partidos. Los perfiles fake ya incluyen `slug`.

### `src/app/settings/page.tsx`

Pantalla de ajustes. Permite cambiar liga activa, cambiar idioma y acceder al panel `/admin` solo si el usuario actual tiene permisos de admin/creator.

### `src/app/admin/league/page.tsx`

Formulario de administracion de sedes de la liga activa. Permite listar, añadir, evitar duplicados en UI, quitar y guardar sedes. Guarda via `LeagueSettingsProvider`. Comprueba permisos en cliente y muestra acceso denegado si el usuario no es admin/creator.

### `src/app/admin/season/page.tsx`

Formulario de administracion de ventanas de jornada de la temporada activa. Permite `none` o `fixed-days`, con fecha de inicio y dias por jornada. Guarda via `SeasonSettingsProvider`. Comprueba permisos en cliente y muestra acceso denegado si el usuario no es admin/creator.

## Componentes

### `src/components/layout/AppShell.tsx`

Carcasa visual mobile-first. Centra la app en `max-w-md`, usa fondo neutral, añade boton flotante de ajustes salvo en `/settings` y `/admin*`, y monta `BottomNav`. Incluye un icono SVG inline.

### `src/components/layout/BottomNav.tsx`

Navegacion inferior fija con cuatro entradas: Inicio, Ranking, Partidos y Perfil. Marca como activo Ranking tambien en `/player*`, y Partidos tambien en `/match*`.

### `src/components/layout/HeaderLeagueSelector.tsx`

Selector de liga para cabecera. Usa `leagues` y `useActiveLeague`. Parece no usado actualmente en `AppShell` ni paginas.

### `src/components/layout/LanguageSwitcher.tsx`

Dropdown de idioma. Maneja estado abierto/cerrado, cierra al hacer click fuera y llama a `setLocale`.

### `src/components/league/LeagueSwitcher.tsx`

Select de liga activa usado en ajustes. Cambia liga con `setActiveLeagueId`, alias de `changeActiveLeague`.

### `src/components/ui/AppCard.tsx`

Tarjeta base con borde, fondo blanco, padding y sombra. Acepta `className`.

### `src/components/ui/SectionHeader.tsx`

Cabecera simple de seccion con titulo y accion opcional.

### `src/components/ui/StatCard.tsx`

Tarjeta compacta de estadistica con label, valor y helper opcional.

### `src/components/matches/MatchCard.tsx`

Tarjeta clickable de partido. Muestra jornada, estado, parejas, resultado si esta finalizado o bloque de programacion si no. Si esta aplazado y hay ventana de jornada, muestra aviso naranja. Requiere `roundStartsAt` y `roundEndsAt`.

### `src/components/matches/MatchStatusBadge.tsx`

Badge de estado de partido. Traduce `finished`, `scheduled`, `scheduling` y `postponed`. Si recibe un estado desconocido, muestra el string literal.

### `src/components/matches/RoundSection.tsx`

Componente agrupador de jornada. Parece no usarse en la pantalla actual de partidos, pero ya esta ajustado para compilar con `MatchCard`, pasando `roundStartsAt={null}` y `roundEndsAt={null}`.

### `src/components/match/MatchScheduleForm.tsx`

Formulario principal para programar, editar, aplazar y reprogramar partidos. Usa `datetime-local`, selector de sedes, opcion `Otro`, sede personalizada y aviso si la fecha queda fuera de ventana oficial. Llama a `updateMatchSchedule` y `postponeMatch`.

### `src/components/match/MatchResultForm.tsx`

Formulario para registrar o editar resultado. Maneja tres sets. Valida enteros de 0 a 7, sin empate, con marcadores validos tipo 6-0, 6-4, 7-5 o 7-6. Calcula sets ganados y llama a `finishMatch`.

### `src/components/match/MatchScheduleBox.tsx`

Caja simple/antigua de programacion. Parece no usada y su boton no tiene handler.

### `src/components/match/MatchScoreboard.tsx`

Marcador de detalle. Muestra Pareja A/B con `TeamPlayers`, puntos si existen y sets si existen.

### `src/components/match/MatchStatsGrid.tsx`

Calcula juegos A/B, diferencia y puntos. Parece no usado actualmente.

### `src/components/player/PlayerNameLink.tsx`

Enlace al perfil de jugador. Usa `player.slug` si encuentra jugador; si no, cae a `/player/${playerId}`.

### `src/components/player/TeamPlayers.tsx`

Renderiza una pareja como enlaces de jugadores separados por `/`.

### `src/components/player/PlayerMatchesList.tsx`

Lista partidos en los que participa un jugador. Repite parte de la presentacion de `MatchCard`: estado, parejas, resultado o programacion pendiente.

### `src/components/ranking/RankingTable.tsx`

Tabla/lista de ranking. Ordena localmente por puntos, diferencia de juegos y juegos a favor. Cada fila enlaza a `/player/${player.slug}`.

## Estado y providers

### `ActiveLeagueProvider.tsx`

Mantiene la liga activa. Default desde `activeLeagueId` de `fakeData.ts`, actualmente `league-smash-lob`. Persiste en `localStorage` con key `smash-lob-active-league`. Valida que la liga exista antes de cambiarla.

### `LeagueSettingsProvider.tsx`

Mantiene sedes editables por liga. Default desde `leagues`. Persiste en `smash-lob-league-settings`. Fusiona storage con defaults para no perder ligas nuevas. Normaliza sedes con `trim`, quita vacias y deduplica con `Set`.

### `SeasonSettingsProvider.tsx`

Mantiene configuracion de ventanas de jornada. Default desde `seasonRoundSettings`. Persiste en `smash-lob-season-round-settings`. Fusiona settings guardados con defaults y conserva settings extra.

### `MatchDataProvider.tsx`

Mantiene partidos y sus mutaciones. Default desde `allMatches`. Persiste en `smash-lob-matches`. Acciones:

- `updateMatchSchedule`: guarda fecha/sede, calcula `dateLabel` con `Intl.DateTimeFormat("es-ES")` y cambia a `scheduled` salvo si estaba `finished`.
- `postponeMatch`: marca `postponed`, limpia fecha/sede y no modifica partidos finalizados.
- `finishMatch`: marca `finished`, guarda sets y calcula puntos segun sets ganados.

Riesgo: al leer storage, solo conserva partidos que existen en `allMatches`; partidos extra guardados no se incorporan.

## Hook principal

### `src/hooks/useCurrentLeagueData.ts`

Es el agregador central. Lee liga activa, settings de liga, partidos, settings de temporada y helpers de dominio. Devuelve `activeLeague`, `activeSeason`, `roundSettings`, `rounds`, `players`, `matches`, `lastMatch` y `nextMatch`. Casi todas las paginas dependen de este hook.

## Datos fake y modelo actual

### `src/data/fakeData.ts`

Define tipos y seed data. Tipos principales:

- `LeagueMemberRole = "creator" | "admin" | "player"`
- `League`
- `Season`
- `PlayerProfile`
- `LeagueMember`
- `SeasonPlayer`
- `MatchStatus`
- `Match`
- `SeasonRoundSettings`

Datos actuales:

- Usuario actual: `davo`.
- Liga activa por defecto: `league-smash-lob`.
- Ligas: `league-smash-lob` y `league-work`.
- Temporadas: `season-1`, `season-2`, `season-work-1`.
- Jugadores: `davo`, `alvaro`, `alain`, `julen`, `bea`, `carlos`, `irene`, `marcos`.
- Miembros de liga: `davo` aparece como `creator` en ambas ligas.
- Partidos: tres de Smash & Lob temporada 2 y uno de liga work.

Riesgos del archivo:

- Es una fuente de verdad fake muy cargada: tipos, entidades, calendario, ranking inicial y permisos viven en el mismo archivo.
- El usuario actual y varios datos de ejemplo estan acoplados a `currentUserId = "davo"`.
- Las ligas ya tienen `description` y los jugadores ya tienen `slug`; si se migran datos, hay que preservar esos campos porque el dashboard y los perfiles dependen de ellos.

## Librerias de dominio

### `src/lib/leagues.ts`

Busca ligas y temporadas, filtra partidos por liga/temporada, calcula jugadores/ranking y obtiene ultimo/siguiente partido. `lastMatch` y `nextMatch` se ordenan por `round`, no por fecha real.

### `src/lib/players.ts`

Helpers para encontrar jugador, obtener nombre visible y componer nombre de pareja.

### `src/lib/ranking.ts`

Calcula ranking individual. Solo cuentan partidos `finished`. Cada jugador de una pareja recibe los puntos de sets ganados por su pareja. Tambien calcula juegos a favor, en contra, diferencia, partidos jugados, victorias y derrotas. Ordena por puntos, diferencia de juegos y juegos a favor.

Nota: el tipo local `PlayerProfile` exige `slug`, y los datos fake actuales ya lo incluyen.

### `src/lib/rounds.ts`

Genera jornadas y ventanas. Estados posibles: `no-window`, `upcoming`, `active`, `overdue`, `completed`. Usa fechas locales y `new Date()` para comparar con hoy. Exporta `buildSeasonRounds`, `formatShortDate` e `isDateTimeInsideRoundWindow`.

### `src/lib/permissions.ts`

Define `LeagueRole = "creator" | "admin" | "player"`, `adminRoles = ["creator", "admin"]`, `getCurrentUserLeagueRole`, `isCurrentUserLeagueCreator` e `isCurrentUserLeagueAdmin`. Se usa para ocultar/mostrar acceso admin y para bloquear pantallas admin en cliente.

## Internacionalizacion

### `I18nProvider.tsx`

Guarda locale en `smash-lob-locale`. Locales validos: `es`, `en`, `eu`. Expone `locale`, `t`, `setLocale` y `toggleLocale`.

### `translations.ts`

Define `defaultLocale = "es"`. Para idiomas no españoles hace `deepMerge` del diccionario elegido sobre `es`, por lo que `en` y `eu` pueden ser parciales.

### `locales/es.ts`, `locales/en.ts`, `locales/eu.ts`

`es` es el diccionario base mas completo. `en` y `eu` son parciales. Las traducciones se apoyan en fallback a `es` mediante `deepMerge`.

## Estilos y UI

### `src/app/globals.css`

Importa Tailwind y define variables `--background` y `--foreground`, con variante para `prefers-color-scheme: dark`. El `body` usa `Arial, Helvetica, sans-serif`. Aunque el README menciona Geist, no se ve `next/font` configurado.

Convenciones visuales:

- Mobile-first, centrado en `max-w-md`.
- Fondo neutral y tarjetas blancas.
- Bordes redondeados grandes (`rounded-2xl`, `rounded-3xl`).
- Botones tactiles y textos en negrita.
- Navegacion inferior fija.
- Avisos de aplazamiento/ventana en naranja.

## Flujo de la aplicacion

1. Next monta `RootLayout`.
2. Se inicializan providers globales.
3. Los providers arrancan con datos de `fakeData.ts`.
4. En cliente, algunos providers leen `localStorage` y sustituyen/fusionan estado.
5. Las paginas llaman a `useCurrentLeagueData`.
6. Ese hook compone liga, temporada, partidos, ranking y jornadas.
7. Formularios de partido o admin llaman a acciones de providers.
8. Los providers actualizan estado y guardan en `localStorage`.
9. La UI se recalcula en cliente, incluyendo ranking y estados de jornadas.

## Navegacion

La navegacion principal esta en `BottomNav`: Inicio, Ranking, Partidos y Perfil. Las rutas dinamicas son `/match/[id]` y `/player/[id]`. Las pantallas de detalle usan `BackButton`, un boton generico `Volver` que ejecuta `router.back()` y usa una ruta fallback si no hay historial. Las rutas admin son accesibles desde ajustes para usuarios admin/creator y muestran estado sin permisos para usuarios sin rol admin.

## Autenticacion y permisos

No hay autenticacion real. El usuario actual es `davo`. La logica de permisos existe en cliente y se aplica a Ajustes y rutas admin para mostrar el panel solo a `creator` o `admin`. Sigue sin ser seguridad real de backend.

Punto conflictivo: el codigo actual ya incluye `creator`, aunque la instruccion del usuario menciona que no deberia haberse añadido. No se debe asumir que hay que quitarlo sin una peticion explicita; primero hay que aclarar si el codigo o la intencion de producto manda.

## Funcionalidades implementadas

- Dashboard de liga activa.
- Selector de liga activa.
- Ranking individual calculado automaticamente.
- Calendario por jornadas.
- Detalle de partido.
- Estados de partido: `finished`, `scheduling`, `scheduled`, `postponed`.
- Programacion de partidos con fecha, hora y sede.
- Sedes habituales editables por liga.
- Sede personalizada.
- Aplazar y reprogramar partidos.
- Registrar resultado.
- Editar resultado.
- Recalcular ranking tras resultados.
- Ventanas de jornada configurables.
- Aviso si una fecha queda fuera de la ventana.
- Perfil del usuario actual fake.
- Perfil publico de jugador.
- Selector de idioma.
- Locales español, ingles y euskera con fallback.
- Pantallas de ajustes y administracion basica.

## Funcionalidades incompletas o futuras

- Login real.
- Cuenta de usuario real.
- Invitaciones a ligas.
- Backend/base de datos.
- Crear ligas.
- Crear temporadas.
- Crear jugadores.
- Crear/generar partidos.
- Gestion completa de miembros y roles.
- Guards efectivos para admin.
- Cierre de sesion.
- Modo claro/oscuro configurable.
- Integracion con calendario externo.
- Historial y tendencias de jugador.
- Mejores parejas/rivales frecuentes.
- Tests automatizados.

## Errores visibles y partes sospechosas

- Mojibake en datos, traducciones y simbolos visibles.
- `creator` existe en codigo actual pese a la nota de que no deberia estar anadido.
- `PlayerProfile.slug` ya fue anadido a los datos fake para alinear ranking y perfiles.
- `League.description` ya fue anadido a los datos fake para alinear el dashboard.
- `RoundSection` ya fue ajustado para pasar props compatibles a `MatchCard`.
- `HeaderLeagueSelector`, `RoundSection`, `MatchScheduleBox` y `MatchStatsGrid` parecen no usados.
- Las rutas admin ya usan `permissions.ts` para permitir acceso a `creator` y `admin`.
- `completedRounds` en `Season` es estatico y puede no coincidir con jornadas derivadas.
- `lastMatch` y `nextMatch` ordenan por jornada, no por fecha.
- `MatchResultForm` exige tres sets validos; si el reglamento permite 2-0, habria que cambiarlo.
- `MatchDataProvider` no conserva partidos extra en storage si no existen en `allMatches`.
- Locales `en` y `eu` son parciales y pueden mezclar idiomas por fallback a espanol.

## Convenciones actuales

- Rutas con App Router y `page.tsx`.
- Client components para paginas interactivas.
- Estado global con React Context.
- Persistencia local con keys `smash-lob-*`.
- Imports absolutos con `@/`.
- Componentes pequeños por dominio.
- Tipos definidos cerca de datos/componentes, aunque ahora hay divergencias.
- Estilos Tailwind en JSX.
- UI mobile-first.
- Textos por `useI18n`, salvo nombres/datos fake.

## Decisiones reflejadas en el codigo

- La app es una liga privada de padel.
- El ranking es individual aunque los partidos son por parejas.
- Los puntos del ranking son sets ganados por pareja, asignados a cada jugador.
- Desempates por diferencia de juegos y juegos a favor.
- Cada liga tiene una temporada activa (`activeSeasonId`).
- Las jornadas pueden tener ventana oficial por fecha inicial y dias fijos.
- Los partidos pueden estar sin programar, programados, finalizados o aplazados.
- Un partido aplazado pierde fecha/lugar hasta reprogramarse.
- La administracion actual se limita a sedes y ventanas de jornada.
- El prototipo es 100% cliente con datos fake y `localStorage`.

## Zonas delicadas que no deberia tocar sin cuidado

- `src/data/fakeData.ts`: fuente de verdad fake y tipos base.
- `src/context/MatchDataProvider.tsx`: mutaciones de partido y persistencia.
- `src/hooks/useCurrentLeagueData.ts`: agregador central usado por muchas paginas.
- `src/lib/ranking.ts`: reglas de clasificacion.
- `src/lib/rounds.ts`: calculo de jornadas y fechas.
- `src/i18n/translations.ts`: fallback de traducciones.
- `src/app/layout.tsx`: orden de providers.
- Rutas `/admin/*`: protegidas solo en cliente; no confiar en esto como seguridad real cuando haya backend.
- Encoding: la busqueda actual en `src` no muestra mojibake conocido, pero conviene vigilarlo al editar textos con acentos.
- Migracion a backend: hay que preservar semantica de datos y `localStorage` o planear migracion.

## Recomendaciones para continuar

1. Decidir si `creator` es parte definitiva del modelo.
2. Definir reglas exactas de resultado: tres sets obligatorios o posibilidad de 2-0.
3. Decidir si `completedRounds` sera dato manual o derivado.
4. Centralizar tipos de dominio para evitar divergencias entre `fakeData`, `ranking` y componentes.
5. Anadir tests para ranking, validacion de sets, ventanas de jornada y permisos.
6. Resolver los warnings actuales de hooks en lint.
7. Antes de backend, modelar entidades: User, League, LeagueMember, Season, SeasonPlayer, Match, MatchSet, Location.
8. Mantener cambios pequenos y separados porque el prototipo esta bastante acoplado por `useCurrentLeagueData`.

## Estado actual de la app

La app esta en fase de prototipo funcional local. Es navegable, tiene ranking, calendario, detalle de partido, edicion local de programacion/resultados, ajustes de idioma/liga y administracion basica con panel `/admin`. El acceso admin ya se oculta/protege en cliente para roles no admin. No esta lista para produccion porque no tiene backend, auth real ni seguridad de servidor.

## Contexto para futuras IAs

Estas trabajando en `D:\DEVELOP\smash-lob`, una app Next.js App Router con React 19, TypeScript estricto y Tailwind v4. Es un prototipo mobile-first para una liga privada de padel. No hay backend ni login; la fuente inicial es `src/data/fakeData.ts` y las mutaciones se guardan en `localStorage` mediante providers.

Lee primero `src/app/layout.tsx`, `src/hooks/useCurrentLeagueData.ts`, `src/data/fakeData.ts`, `src/context/MatchDataProvider.tsx`, `src/lib/ranking.ts`, `src/lib/rounds.ts` y `src/lib/permissions.ts`. El hook `useCurrentLeagueData` es el eje de casi todas las pantallas.

Ten cuidado con esta contradiccion actual: el codigo si contiene `creator`, aunque en conversaciones anteriores se habia dicho que no estaba anadido. Los jugadores ya tienen `slug`, las ligas ya tienen `description`, y TypeScript queda limpio tras esa estabilizacion. No mezcles encoding, permisos y reglas de negocio en un solo cambio grande.

Si vas a seguir desarrollando, el orden recomendado es: definir reglas de resultado, decidir si `completedRounds` sera derivado o manual, resolver warnings de hooks, y solo despues plantear backend o generacion real de temporadas/partidos.

## Hoja de ruta y decisiones de producto

Esta seccion incorpora la hoja de ruta adjunta por el usuario. Es vision de producto y direccion de desarrollo, no necesariamente estado ya implementado. Antes de cambiar codigo, contrastar siempre con el estado real descrito arriba y con los archivos actuales.

### Vision general

Smash & Lob empezo como una app para una liga privada concreta, pero la vision correcta es una plataforma generica para gestionar ligas privadas de padel. Smash & Lob debe ser solo una liga creada dentro de la plataforma.

Un usuario podra pertenecer a varias ligas activas, por ejemplo Smash & Lob, Liga del curro, Liga de amigos o una liga de club. Cada liga debe tener jugadores, temporadas, jornadas, partidos, reglas, ubicaciones, permisos, ranking, historial y configuracion propios.

La prioridad de producto es funcionalidad clara en movil y una arquitectura que permita migrar mas adelante a Supabase/Auth/base de datos real sin rehacerlo todo.

### Preferencias obligatorias de desarrollo

- No dar parches sueltos ni instrucciones tipo "busca esto y cambia aquello".
- Entregar cambios completos y verificables dentro de los archivos afectados.
- Hacer cambios pequenos, funcionales y relacionados con la tarea.
- No modificar archivos no relacionados.
- No hacer refactors grandes sin necesidad.
- No inventar backend todavia.
- No introducir funcionalidades visuales complejas antes de cerrar el flujo funcional.
- Strings nuevos primero en `src/i18n/locales/es.ts`; ingles/euskera pueden quedar para fallback o mas adelante.
- Mantener la app mobile-first.
- Tras cada cambio funcional, indicar pruebas exactas: URL, ruta de navegacion en espanol, que debe verse y que comportamiento validar.

### Multi-liga

La app debe soportar varias ligas por usuario. Cada liga tendra ID, nombre, slug, temporada activa, jugadores, ubicaciones, partidos, ranking, configuracion y permisos propios.

El selector de liga debe vivir preferentemente dentro de Ajustes, no como titulo global, porque visualmente compite con los titulos de pantalla. Regla futura: si el usuario pertenece a una sola liga, no mostrar selector; si pertenece a varias, mostrar selector.

### Navegacion principal

La navegacion inferior debe mantenerse con cuatro pestanas: Inicio, Ranking, Partidos y Perfil. Debe ser comoda en movil: alta, blanca, tactil, clara, sin tapar contenido al hacer scroll y con pestana activa bien resaltada.

### Boton global de ajustes

El acceso a Ajustes debe ser global, pequeno, gris, minimalista y arriba a la derecha. El icono preferido es tipo sliders, no emoji de engranaje. Debe abrir `/settings`, no tapar titulos y no aparecer dentro de `/settings` ni `/admin`.

### Ajustes

Ajustes debe contener preferencias personales/de app, no todas las configuraciones admin mezcladas. Debe incluir liga activa si procede, idioma, acceso al panel admin solo si el usuario tiene permisos y futuros ajustes personales como tema, cuenta, invitaciones personales, cerrar sesion y notificaciones personales.

No deberian aparecer directamente como tarjetas separadas en Ajustes: Administrar liga, Administrar temporada o Lugares habituales. Eso debe ir dentro del panel admin.

### Panel de administrador

Debe existir `/admin` como panel unico. Desde Ajustes, si el usuario tiene permisos, se muestra una tarjeta "Panel de administrador". Dentro de `/admin` se agrupan configuraciones: administrar liga, temporada, lugares habituales, jugadores, invitaciones, reglas, generacion de jornadas, notificaciones y auditoria/historial.

Las rutas actuales `/admin/league` y `/admin/season` pueden conservarse, pero idealmente deben colgar de `/admin` y no enlazarse directamente desde Ajustes.

### Roles y permisos

La vision de producto recomienda `creator`, `admin` y `player`.

- `creator`: dueno/creador de la liga, con permisos admin fijos y sin perder control de su liga.
- `admin`: administrador anadido por el creator.
- `player`: jugador normal.

Para acceso admin, `creator` y `admin` pueden entrar; `player` no. El codigo actual ya contiene `creator`, pero cualquier trabajo sobre permisos debe comprobar primero el estado real del repositorio.

Funciones futuras utiles: `isCurrentUserLeagueCreator()`, `canManageAdmins()`, `canManageLeagueSettings()` y `canManageSeasonSettings()`.

### Temporadas y jornadas

Cada liga tiene temporadas y cada temporada tiene jornadas. La configuracion debe permitir sin margen especifico o margen fijo por jornada, con fecha de inicio de Jornada 1 y dias por jornada. Si no hay margen especifico, evitar textos redundantes en la pantalla de partidos. Si un partido esta aplazado y la jornada tenia margen, mostrar aviso de que las fechas previstas no se van a cumplir.

### Estados de partido

Estados deseados: `scheduling`, `scheduled`, `postponed`, `finished`.

- Sin programar: sin fecha/hora/lugar, no permite resultado, permite programar y aplazar.
- Programado: tiene fecha/hora/lugar, permite editar programacion, aplazar y registrar resultado.
- Aplazado: no muestra fecha/lugar antiguos como activos, no cuenta en ranking, no permite resultado, permite reprogramar y al reprogramar pasa a `scheduled`.
- Finalizado: tiene resultado, cuenta para ranking y permite editar resultado para recalcular ranking.

### Programacion y lugares habituales

Los partidos se programan con fecha, hora y lugar. El input `datetime-local` es valido para la version funcional porque en movil abre selector nativo. El lugar debe salir de lugares habituales de la liga activa o de la opcion "Otro". Cada liga tiene sus propios lugares habituales y no deben mezclarse entre ligas.

### Resultados y ranking

Solo partidos programados pueden registrar resultado. Partidos sin programar muestran resultado pendiente y aplazados muestran resultado bloqueado. Al guardar resultado, el partido pasa a finalizado.

Formato actual deseado: tres sets fijos, juegos de pareja A/B, puntos calculados como 3-0, 2-1, 1-2 o 0-3. Sets validos: 6-0 a 6-4, 7-5 y 7-6. No validos: 6-5, empates o valores fuera de 0-7.

El ranking debe calcularse desde partidos finalizados de la temporada activa. Criterios: puntos, diferencia de juegos y juegos a favor. Stats relevantes: puntos, partidos jugados, victorias, derrotas, juegos a favor, juegos en contra y diferencia.

### Perfil y jugadores

`/profile` es el perfil del usuario actual. `/player/[id]` es perfil publico. Perfil muestra estadisticas del usuario en la liga activa, resumen de temporada, mis partidos y futuras conexiones con cuenta real/login. Perfil no debe ser la entrada principal a Ajustes.

### Actividad, auditoria y notificaciones

La app debe tener en el futuro feed/historial de actividad, auditoria completa para admins y notificaciones configurables. Eventos relevantes: partido programado, aplazado, reprogramado, resultado registrado/editado, jugador anadido/eliminado, jornada generada, temporada cerrada y cambio de reglas.

Los admins deben ver todos los cambios, aunque no todos generen notificacion a jugadores.

### Reservas de pistas

No convertir la app en sistema de reservas. Las pistas/lugares son metadatos para programar partidos: lugar, pista opcional y nota opcional. No gestionar disponibilidad real de pistas.

### Autenticacion futura

Preferencia futura: Supabase Auth con Google login, perfiles de usuario, membership por liga, roles por liga e invitaciones por enlace/codigo. No implementar auth todavia salvo decision explicita.

### Invitaciones futuras

Flujo futuro: usuario crea liga, se convierte en `creator`, anade jugadores o genera invitaciones, jugadores entran por enlace/codigo como `player`, y creator puede promover admins.

### Generacion futura de jornadas

La app debe generar emparejamientos automaticamente. Para la liguilla original: parejas no fijas, todos juegan con todos, evitar repetir pareja si es posible, emparejamientos balanceados, siete jornadas para ocho jugadores y puntuacion individual por sets ganados.

Reglas futuras configurables: numero de jugadores, numero de jornadas, repetir pareja si/no, repetir rival si/no, modo de puntuacion, playoff si/no, calendario manual/automatico, ventanas de jornada y validacion de resultados.

### Diseno movil preferido

Mantener botones grandes, barra inferior comoda, formularios sencillos, tarjetas claras, textos cortos, scroll sin contenido tapado y no depender de hover. Mantener boton de ajustes minimalista gris tipo sliders, bottom nav blanca y alta, pestana activa clara, selector de liga dentro de Ajustes y titulos grandes por pantalla.

### Mejora pendiente del formulario de resultado

El formulario actual funciona pero es demasiado vertical. Mejora deseada: pasar a un layout compacto tipo tabla con columnas Set 1, Set 2 y Set 3, y filas por pareja. Debe seguir siendo comodo en movil.

### Orden recomendado de continuacion

1. Verificar estado real con `PROJECT_CONTEXT.md` y codigo actual.
2. Definir reglas exactas de resultado y validacion de sets.
3. Decidir si `completedRounds` sera derivado o manual.
4. Resolver warnings de hooks detectados por lint.
5. Mantener boton de ajustes global minimalista y bottom nav comoda.
6. Revisar que la barra inferior no tape contenido.
7. Simplificar formulario de resultado.
8. Anadir gestion de jugadores/invitaciones.
9. Anadir reglas de temporada.
10. Anadir generacion automatica de jornadas.
11. Anadir feed/historial.
12. Anadir notificaciones configurables por admin.
13. Preparar migracion a Supabase/Auth.

### Zonas especialmente delicadas segun roadmap

Tocar con cuidado context providers, keys de localStorage, `useCurrentLeagueData`, calculo de ranking, estado de partidos, `fakeData.ts`, i18n, `AppShell` y `BottomNav`.
