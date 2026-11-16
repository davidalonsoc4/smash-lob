---
name: smash-lob-ui
description: Mantiene y mejora la interfaz de Smash & Lob. Úsala para estilos, responsive, barras de navegación, tarjetas, botones, modales, accesibilidad o diseño móvil.
---

# Cambios visuales conservadores

- Inspecciona primero el componente y estilos existentes. **No rediseñes la aplicación** ni cambies su sistema visual salvo petición expresa.
- Conserva navegación global / navbar de liga / navbar de torneo, estados de carga, modo PWA, safe areas de Android/iOS, tema, i18n y la legibilidad en pantallas pequeñas.
- Prefiere componentes compartidos ya presentes (`AppCard`, modales, formularios) en lugar de duplicarlos. Examina casos de sólo lectura, edición, sin datos, errores y permisos.
- En un ajuste visual pequeño, limita las modificaciones al componente solicitado y estilos necesarios. Evita agregar dependencias para cambios triviales.
- Revisa accesibilidad: foco, teclado, `aria-label`, contrastes, estado deshabilitado y diálogos.
- Si el trabajo implica un rediseño grande, muestra el plan con opciones antes de ejecutar; no cambies lógica de negocio para ajustar una pantalla.
- Ejecuta pruebas y capturas locales (Playwright) cuando sea posible; si no puedes, declara la limitación. No publiques automáticamente.

Comandos útiles según alcance: `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:visual`, `npm run test:a11y`.
