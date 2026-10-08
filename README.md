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

### Heartbeat de Supabase PROD

`.github/workflows/supabase-prod-heartbeat.yml` ejecuta diariamente a las 05:37 UTC
un GET PostgREST equivalente a `SELECT id FROM public.leagues LIMIT 1`, para generar
actividad mínima de base de datos durante periodos sin usuarios. Descarta la respuesta,
no escribe datos y rechaza cualquier URL que no corresponda al proyecto PROD inventariado.
No usa la configuración de PRE ni el enlace local de Supabase.

Configura `SUPABASE_PROD_URL` y `SUPABASE_PROD_SERVICE_ROLE_KEY` (clave legacy
`service_role` de PROD) en GitHub → Settings → Secrets and variables → Actions →
New repository secret. Nunca copies la clave a variables públicas ni a archivos:
se requiere porque los grants actuales impiden esta lectura con anon/authenticated.
Solo las personas de confianza deben poder modificar workflows con acceso a estos Secrets.

Tras incorporar el workflow a la rama predeterminada mediante el proceso autorizado,
abre Actions → Supabase PROD heartbeat → Run workflow para comprobarlo y verifica
que el job termina correctamente. La declaración manual se valida localmente; una
ejecución real requiere publicar el workflow y configurar los Secrets.
No requiere checkout, dependencias, migraciones ni despliegue de la aplicación.
Consume minutos del cupo de GitHub Actions; revisa su disponibilidad en repositorios privados.

El cron puede retrasarse y GitHub desactiva los workflows programados de repositorios
públicos tras 60 días sin actividad del repositorio. Supabase no publica un umbral
que garantice que una consulta diaria evite la pausa; revisa avisos y ejecuciones fallidas.
Un proyecto ya pausado necesita reactivación manual. Referencias:
[GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
y [Supabase](https://supabase.com/docs/guides/platform/free-project-pausing).

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
