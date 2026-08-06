# Smash & Lob - despliegue y validación

## Entornos oficiales

- Producción: `https://smashandlob.com` sobre la rama `main`.
- Preproducción: `https://pre.smashandlob.com` sobre la rama `staging`.
- `https://www.smashandlob.com` debe redirigir al dominio principal.

Los enlaces compartidos por la aplicación no deben utilizar dominios de despliegue de Vercel. El comando `npm run public-urls:check` comprueba automáticamente que no reaparezcan en los archivos de ejecución.

## Estado de datos

La app usa Supabase para los datos principales:

- ligas y membresías;
- temporadas y jugadores;
- partidos, resultados y confirmaciones;
- ajustes, ubicaciones e invitaciones;
- espectadores, estadísticas y configuración administrativa.

El almacenamiento local queda limitado a caché y preferencias del navegador. Limpiar la caché local no debe eliminar información persistida en Supabase.

## Variables necesarias

Configurar las credenciales correspondientes en local, Production y Preview:

```env
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_ENABLE_DEMO_DATA=false
NEXT_PUBLIC_QA_MODE=false
QA_MODE=false
```

`NEXT_PUBLIC_APP_URL` debe contener siempre el dominio oficial del entorno: `https://smashandlob.com` en PROD y `https://pre.smashandlob.com` en PRE. Puede utilizarse `NEXT_PUBLIC_APP_VARIANT=production` en producción y `NEXT_PUBLIC_APP_VARIANT=pre` en `staging`, pero el dominio oficial es la fuente de verdad y prevalece ante una variante contradictoria. Los dominios automáticos de Vercel se normalizan al entorno oficial correspondiente.

## Google OAuth

Orígenes autorizados:

```txt
http://localhost:3000
https://smashandlob.com
https://pre.smashandlob.com
```

URI de redirección:

```txt
http://localhost:3000/api/auth/callback/google
https://smashandlob.com/api/auth/callback/google
https://pre.smashandlob.com/api/auth/callback/google
```

No añadir nuevos alias temporales de Vercel a los enlaces de producto. Las credenciales y callbacks deben mantenerse alineados con los dos dominios oficiales.

## Validaciones antes de publicar

Para validar código y build:

```bash
npm ci
npm run validate
```

`npm run validate` comprueba:

1. coherencia de versión entre `package.json`, lockfile, UI, changelog y service worker;
2. variables obligatorias y coherencia PRE/PROD;
3. secretos, línea base de seguridad y URLs públicas;
4. aislamiento y assets de Avatar Lab;
5. estructura de las migraciones de identidad;
6. ESLint, TypeScript, Vitest y build de producción.

Para una candidata de publicación completa:

```bash
npx playwright install chromium
npm run release:check
```

`release:check` añade Playwright y `npm audit --omit=dev --audit-level=high`.
Después de desplegar se ejecutan `npm run smoke:pre` o `npm run smoke:prod`; ambos consultan `/api/health`, verifican la versión y comprueban el aislamiento de Avatar Lab.

La promoción de v1.2.11 debe seguir `docs/prepublication/V1_2_11_RELEASE_CHECKLIST.md`. Antes de aplicar las migraciones en PROD hay que ejecutar en PRE y después en PROD, en modo de solo lectura, `docs/prepublication/identity-audit.sql`.

## Pruebas previas a v1.0

Ejecutar íntegramente `docs/V1_RELEASE_CHECKLIST.md` en PRE antes de preparar la etiqueta `v1.0.0` y repetir en producción las comprobaciones críticas de acceso, invitaciones, espectadores y datos.

## Notificaciones push

Variables requeridas cuando las notificaciones están activas:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:tu-email@example.com
```

En iPhone y iPad, las notificaciones web requieren instalar la PWA en la pantalla de inicio. En Android funcionan desde navegadores y PWAs compatibles con Push API.

## Modo QA

Las herramientas de simulación solo deben habilitarse en PRE:

```env
NEXT_PUBLIC_QA_MODE=true
QA_MODE=true
```

No activar estas variables en producción. Las acciones QA escriben datos reales y pueden generar notificaciones reales.
