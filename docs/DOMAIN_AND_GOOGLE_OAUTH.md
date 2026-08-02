# Dominio y Google OAuth

Configuración oficial de Smash & Lob:

- `https://smashandlob.com` → Production / rama `main`.
- `https://pre.smashandlob.com` → Preview / rama `staging`.
- `https://www.smashandlob.com` → redirección al dominio principal.

## Páginas públicas

Estas rutas no requieren iniciar sesión ni pertenecer a una liga:

- Página principal: `https://smashandlob.com/about`
- Política de privacidad: `https://smashandlob.com/privacy`
- Condiciones de uso: `https://smashandlob.com/terms`

## Google Auth Platform

Datos de marca:

- Página principal: `https://smashandlob.com/about`
- Política de privacidad: `https://smashandlob.com/privacy`
- Condiciones del servicio: `https://smashandlob.com/terms`
- Dominio autorizado: `smashandlob.com`

### Orígenes de JavaScript autorizados

- `https://smashandlob.com`
- `https://pre.smashandlob.com`

### URI de redirección autorizados

- `https://smashandlob.com/api/auth/callback/google`
- `https://pre.smashandlob.com/api/auth/callback/google`

Los alias automáticos de Vercel no forman parte de la configuración pública final y no deben aparecer en invitaciones, enlaces de espectador, metadatos o documentación operativa actual.

## Entornos de Vercel

Mantener en Production y Preview sus credenciales correctas:

- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_SECRET`
- variables de Supabase propias de cada entorno

Para identificar de forma explícita el entorno visual y la URL pública:

- Production: `NEXT_PUBLIC_APP_VARIANT=production`
- Preview de `staging`: `NEXT_PUBLIC_APP_VARIANT=pre`

`NEXT_PUBLIC_APP_URL` es opcional por compatibilidad. La aplicación normaliza cualquier valor antiguo de Vercel al dominio oficial de producción o PRE.

## Identidad y contacto legal opcionales

- `NEXT_PUBLIC_LEGAL_RESPONSIBLE_NAME`
- `NEXT_PUBLIC_LEGAL_CONTACT_EMAIL`

Al ser información pública, estas variables deben configurarse en ambos entornos cuando se utilicen.

## Comprobación final

1. Desplegar `staging` y `main`.
2. Abrir las páginas públicas sin iniciar sesión.
3. Probar inicio y cierre de sesión en ventana privada en PROD y PRE.
4. Generar una invitación y un enlace de espectador en cada entorno.
5. Confirmar que los cuatro enlaces utilizan exclusivamente los dominios oficiales.
6. Confirmar que cada entorno conserva su proyecto de Supabase.
