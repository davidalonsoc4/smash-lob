# Avatar Lab DEMO 0.1 — plan de prueba en PRE

Ruta experimental: `/experimental/avatar-lab`

## Acceso

- Solo se renderiza cuando la aplicación se identifica como PRE/staging.
- No aparece en navegación. Se accede escribiendo la ruta directamente.
- Requiere sesión y perfil de cuenta completo.
- No lee ni escribe ligas, jugadores, partidos, clasificaciones, exportaciones o Supabase.

## Smoke test

1. Abrir la ruta con 320, 360, 390 y 430 px de ancho.
2. Confirmar que la receta inicial reproduce el personaje de referencia.
3. Cambiar diestro/zurdo y verificar pala, manga y muñequera; la B debe seguir legible.
4. Activar gorra y cinta alternativamente; nunca deben coexistir.
5. Cambiar pelo, barba, ojos, cejas, tonos, camiseta principal/secundaria, pantalón, manga, muñequera, calcetines, zapatillas y pala.
6. Aleatorizar repetidamente y comprobar que no aparecen huecos o solapamientos invalidantes.
7. Guardar temporalmente, recargar y confirmar recuperación local.
8. Restablecer y confirmar vuelta a la referencia canónica.
9. Intentar abrir la misma ruta en Producción; debe responder como no encontrada.

## Criterios de parada

No promover a Producción. Detener la prueba si el laboratorio modifica datos reales, aparece en navegación, mezcla mundos, refleja la B, permite gorra+cinta o pierde el estado local tras recargar.
