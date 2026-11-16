---
name: smash-lob-context
description: Comprende la arquitectura y los flujos de Smash & Lob. Úsala al estudiar una funcionalidad, diagnosticar bugs o desarrollar cambios de ligas, amistosos, torneos y permisos.
---

# Contexto funcional y localización eficiente

1. Abre `AGENTS.md` y después `CLAUDE.md`. Si el área es nueva, identifica primero los archivos mediante nombres de carpeta/símbolos: no leas todos los archivos de golpe.
2. Identifica el recorrido completo **pantalla → componente → API → autorización → Supabase → respuesta**. Distingue datos públicos de privados y responsabilidades de cada rol.
3. Áreas habituales: `src/app`, `src/components`, `src/lib`, `src/context`, `src/app/api`, `supabase/migrations`, `tests/`. Determina rutas reales en este checkout antes de citar archivos.
4. Los partidos de liga, amistosos y torneos son sistemas relacionados pero no idénticos. No apliques reglas de un tipo de partido a otro sin comprobar los permisos del backend.
5. En ligas, clasificación individual + rotación de compañeros. No revelar emparejamientos secretos. Torneos sujetos a feature flags y posibles diferencias PRE/PROD.
6. Antes de implementar: explica diagnóstico, archivos a tocar, riesgos de datos, permisos y plan de tests. Si es tarea concreta, evita auditorías globales.
7. Después: reporta cambios comprobables, tests realmente ejecutados y cualquier limitación.

En tareas de desarrollo, consulta primero las APIs y pruebas existentes; conserva interfaces reutilizadas. Para localizar referencias utiliza la herramienta de navegación TypeScript cuando esté disponible.
