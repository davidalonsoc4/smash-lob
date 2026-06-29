# Smash & Lob - despliegue preview

## Estado de datos

La app ya usa Supabase para los datos principales:

- ligas
- temporadas
- jugadores
- partidos
- resultados
- ajustes de temporada
- lugares de liga
- códigos de invitación
- membresías por invitación

El `localStorage` queda como caché local y preferencias de navegador. En Ajustes existe una tarjeta de mantenimiento para limpiar caché local sin borrar datos de Supabase.

## Variables necesarias

Configura estas variables tanto en local como en Vercel:

```env
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ENABLE_DEMO_DATA=false
```

En local, `AUTH_URL` puede omitirse o apuntar a `http://localhost:3000`.
En Vercel, usa la URL real, por ejemplo `https://smash-lob.vercel.app`.

## Google OAuth

En Google Cloud añade estos redirect URIs:

```txt
http://localhost:3000/api/auth/callback/google
https://TU-DOMINIO.vercel.app/api/auth/callback/google
```

Si usas una URL de preview distinta, añádela también.

## Comprobaciones antes de publicar

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Pruebas mínimas en preview

1. Entrar con Google desde móvil.
2. Crear una liga nueva.
3. Añadir lugares de liga.
4. Programar partido.
5. Guardar resultado.
6. Regenerar invitación.
7. Entrar con otro usuario mediante invitación.
8. Reclamar jugador.
9. Crear nueva temporada.
10. Limpiar caché local desde Ajustes y comprobar que los datos vuelven desde Supabase.

## Superusuario global

El email `smashlobadmin@gmail.com` está configurado como superusuario global de la aplicación.

Además, en Supabase conviene dejar marcada la cuenta como superusuario con:

```sql
insert into public.app_users (email, display_name, is_superuser)
values ('smashlobadmin@gmail.com', 'Smash Lob Admin', true)
on conflict (email) do update
set is_superuser = true,
    display_name = coalesce(public.app_users.display_name, excluded.display_name);
```

El código también evita degradar a `false` un usuario que ya tenga `is_superuser = true` en Supabase.
