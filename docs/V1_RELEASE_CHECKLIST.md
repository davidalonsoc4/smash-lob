# Checklist de aceptación para Smash & Lob v1.0

Esta lista se ejecuta primero en `https://pre.smashandlob.com`. La publicación de `v1.0.0` solo se prepara después de completar todas las pruebas sin incidencias bloqueantes.

## 1. Identidad de entorno y acceso

- La interfaz de PRE muestra claramente la etiqueta y los iconos de preproducción.
- Producción abre en `https://smashandlob.com` y PRE en `https://pre.smashandlob.com`.
- El inicio y cierre de sesión con Google funcionan en ambos dominios.
- Cada entorno carga exclusivamente sus propias ligas y su proyecto de Supabase.
- Las páginas `/about`, `/privacy` y `/terms` abren sin iniciar sesión.

## 2. Invitaciones y espectadores

- Una invitación generada en producción comienza por `https://smashandlob.com/invite/`.
- Una invitación generada en PRE comienza por `https://pre.smashandlob.com/invite/`.
- Un enlace de espectador de producción comienza por `https://smashandlob.com/spectate/`.
- Un enlace de espectador de PRE comienza por `https://pre.smashandlob.com/spectate/`.
- Los enlaces abren correctamente en una ventana privada y permiten completar el flujo esperado.
- Regenerar un código invalida o sustituye el enlace anterior según el comportamiento definido.

## 3. Liga y permisos

- Crear una liga y cambiar sus datos generales.
- Añadir o retirar administradores sin alterar al creador.
- Comprobar permisos de creator, admin, jugador y espectador.
- Verificar que un usuario sin permisos no puede ejecutar acciones administrativas mediante la interfaz ni las APIs.
- Crear una liga adicional y confirmar que los datos no se mezclan entre ligas.

## 4. Temporadas y jugadores

- Crear una temporada con el número de jugadores previsto.
- Probar plantilla manual y autoinscripción cuando corresponda.
- Vincular una cuenta con un jugador histórico y confirmar nombre, avatar y estadísticas anteriores.
- Iniciar, cerrar y consultar una temporada terminada.
- Cambiar entre temporada actual, temporadas anteriores y toda la liga.

## 5. Calendario, programación y resultados

- Generar el calendario completo y revisar todas las jornadas.
- Programar un partido con fecha, hora y ubicación.
- Introducir resultado y sets, confirmar el partido y comprobar la clasificación.
- Corregir un resultado siguiendo el flujo permitido.
- Como creator o admin, añadir o corregir a posteriori la fecha de un partido finalizado sin perder resultado ni sets.
- Comprobar incidencias, aplazamientos y suplentes en los casos habilitados.

## 6. Estadísticas, imágenes y datos

- Revisar clasificación, estadísticas individuales, cara a cara, evolución y récords.
- Generar Calendario actual, Calendario de enfrentamientos y Clasificación.
- Compartir y descargar cada imagen con y sin logo o avatares.
- En una temporada terminada, compartir y descargar el Resumen de temporada.
- Descargar el libro Excel y abrir sus hojas Clasificación y Resultados.
- Descargar ambos CSV y comprobar caracteres, columnas y datos históricos.

## 7. PWA, móvil y navegación

- Instalar la PWA en Android y abrirla desde el icono.
- Revisar icono, nombre, tema, pantalla inicial y modo standalone en PROD y PRE.
- Probar navegación principal, botón atrás, enlaces externos y recarga directa de rutas profundas.
- Revisar las pantallas principales en móvil y escritorio sin desbordamientos ni acciones inaccesibles.
- Confirmar el funcionamiento de notificaciones cuando estén activadas y autorizadas.

## 8. Validación técnica y publicación

- Ejecutar `npm ci`.
- Ejecutar `npm run validate` sin errores ni warnings propios del proyecto.
- Confirmar que `npm run public-urls:check` no detecta dominios antiguos en runtime.
- Revisar la línea base de seguridad y no ejecutar correcciones forzadas de dependencias.
- Confirmar que no hay migraciones pendientes inesperadas en PRE ni PROD.
- Revisar logs de Vercel después de las pruebas y descartar errores 500 o excepciones repetidas.
- Documentar cualquier incidencia no bloqueante antes de crear `v1.0.0`.
