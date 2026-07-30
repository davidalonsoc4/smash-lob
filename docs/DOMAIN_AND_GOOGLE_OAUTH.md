# Dominio y Google OAuth

Configuración objetivo de Smash & Lob:

- `https://smashandlob.com` → entorno Production / rama `main`.
- `https://pre.smashandlob.com` → entorno Preview / rama `staging`.
- `https://www.smashandlob.com` → redirección al dominio principal si Vercel no la aplica automáticamente.

## Páginas públicas

Estas rutas no requieren iniciar sesión ni pertenecer a una liga:

- Página principal pública: `https://smashandlob.com/about`
- Política de privacidad: `https://smashandlob.com/privacy`
- Condiciones de uso: `https://smashandlob.com/terms`

## Google Auth Platform: Branding

Configurar:

- Página principal de la aplicación: `https://smashandlob.com/about`
- Política de privacidad: `https://smashandlob.com/privacy`
- Condiciones del servicio: `https://smashandlob.com/terms`
- Dominio autorizado: `smashandlob.com`

## Cliente OAuth web

### Orígenes de JavaScript autorizados

- `https://smashandlob.com`
- `https://pre.smashandlob.com`

### URI de redirección autorizados

- `https://smashandlob.com/api/auth/callback/google`
- `https://pre.smashandlob.com/api/auth/callback/google`

Mantener temporalmente las URL antiguas de Vercel hasta confirmar que el acceso funciona en ambos dominios nuevos.

## Variables de entorno de Vercel

### Production

- `AUTH_URL=https://smashandlob.com`

### Preview, limitada a la rama `staging`

- `AUTH_URL=https://pre.smashandlob.com`

Mantener en ambos entornos los valores correctos de:

- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_SECRET`

Producción y PRE deben seguir utilizando sus respectivos proyectos y credenciales de Supabase.

## Identidad y contacto legal opcionales

Las páginas legales aceptan estas variables públicas:

- `NEXT_PUBLIC_LEGAL_RESPONSIBLE_NAME`
- `NEXT_PUBLIC_LEGAL_CONTACT_EMAIL`

Al contener información pública, deben configurarse tanto en Production como en Preview. Tras cambiar cualquier variable de Vercel es necesario volver a desplegar el entorno correspondiente.

## Comprobación final

1. Redesplegar `main` y `staging`.
2. Abrir las tres páginas públicas sin iniciar sesión.
3. Probar inicio y cierre de sesión en una ventana privada desde producción.
4. Repetir la prueba desde PRE.
5. Confirmar que producción conserva Supabase de producción y PRE conserva Supabase de staging.
