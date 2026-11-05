# Candidata v1.15.39

Incluye los cambios de Competiciones desde v1.15.36 y el chat general de liga por temporada. PRE conserva el acceso a torneos. La versión compilada para PROD oculta los torneos mediante la configuración de ese entorno.

PRE verificado el 5 de noviembre de 2026. PR #63, CI #427 correcto en los cuatro controles y staging `93485e7e7e8dc6a6a34c035e85d6d0aa0026e866`. El dominio `pre.smashandlob.com` sirve el despliegue `dpl_FvzPqtGf1C3LCNH3sBND5uKkwuvc` en estado READY. Health `1.15.39/pre`, service worker `1.15.39`, manifest HTTP 200 y ruta de chat HTTP 401 sin sesión de aplicación, comprobados con acceso autenticado a Vercel.

## Base de datos

Orden de las migraciones del chat:

1. `20261104141440_league_season_chat.sql` crea el chat y sus controles de acceso.
2. `20261104151343_league_season_chat_send.sql` añade el envío de mensajes.
3. `20261104152546_league_chat_account_deletion.sql` adapta el borrado de cuentas.

Las tres figuran en el historial remoto de PRE. Para PROD, comprobar el historial remoto y el resultado de `supabase db push --dry-run` con el proyecto de producción verificado y un checkout de la candidata. Contrastar la lista con el diferencial de migraciones de `main` a la candidata antes de aplicar nada.

## Promoción a PROD

1. Confirmar el commit servido en PRE y completar la aceptación manual con cuentas de prueba autorizadas. Probar envío, aislamiento entre temporadas y lectura de la temporada anterior.
2. Obtener autorización de publicación a PROD y comprobar la copia reciente de base de datos y el identificador del despliegue actual para recuperación.
3. Aplicar las migraciones pendientes de la candidata en el orden confirmado por el ensayo y volver a consultar el historial. Evitar restaurar una copia de base de datos como mecanismo rutinario de reversión de código.
4. Integrar la candidata de staging en main y dejar que Vercel la compile con configuración PROD. Verificar commit, dominio, health, service worker, disponibilidad del chat y bloqueo de las rutas de torneos. Si falla la publicación de código, restaurar el despliegue de código anterior y evaluar el esquema por separado.
