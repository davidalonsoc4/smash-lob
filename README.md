# Smash & Lob

Aplicación Next.js para gestionar ligas privadas de pádel: temporadas, calendario,
resultados, clasificación, estadísticas, invitaciones, espectadores, avisos y
exportaciones.

## Entornos

- PROD: `https://smashandlob.com` desde `main`.
- PRE: `https://pre.smashandlob.com` desde `staging`.
- Desarrollo: `http://localhost:3000`.

La versión estable actual es `v1.1.0`. Las ramas de funcionalidad se validan
primero en PRE antes de promoverse a Producción.

## Configuración

Copia `.env.example` a `.env.local` y completa las variables localmente. Las
obligatorias se comprueban con `npm run env:check` sin mostrar sus valores:

- Auth.js: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
- URL pública: `NEXT_PUBLIC_APP_URL`.
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`.

`AUTH_URL`/`NEXTAUTH_URL` no forman parte de la configuración requerida actual.
Los secretos de Producción no deben usarse en PRE, CI ni desarrollo.

## Desarrollo y pruebas

```powershell
npm ci
npm run dev
```

Controles locales:

```powershell
npm run secrets:check
npm run security:check
npm run public-urls:check
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

Vitest cubre reglas de dominio, validadores, URLs, rate limiting, exportaciones y
límites de API. Playwright ejecuta acceso anónimo, errores de autenticación, Axe y
comparaciones visuales en móvil y escritorio. Las pruebas reales de Google OAuth
y datos persistentes de PRE necesitan fixtures/cuentas dedicadas.

## Arquitectura y seguridad

La sesión se resuelve con Auth.js. Las rutas API usan Supabase server-side y los
límites compartidos de autorización de usuario/liga; la service role nunca concede
permisos por sí sola. RLS y grants se gestionan mediante migraciones incrementales
en `supabase/migrations`.

No se editan migraciones aplicadas. Una migración nueva se prueba primero en local
y PRE, con reversión mediante una migración de avance. Para backup/restauración,
exporta la base del entorno correcto antes de aplicar cambios y verifica el
artefacto y su checksum.

El plan de estabilización está en `docs/V1_1_PLAN.md`; publicación, acciones
externas y rollback en `docs/V1_1_MANUAL_ACTIONS.md`; aceptación en
`docs/V1_1_ACCEPTANCE_CHECKLIST.md`.
