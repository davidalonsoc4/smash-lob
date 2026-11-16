# Smash & Lob — contexto breve para Claude Code

Repositorio: `davidalonsoc4/smash-lob`. PWA de pádel con Next.js 16, React, TypeScript, Supabase y Vercel. La versión exacta se consulta en el `package.json` del checkout, nunca se presupone.

- Antes de editar, lee **`AGENTS.md`** y las instrucciones de la tarea; resuelve contradicciones preguntando o proponiendo un plan, nunca ignorando reglas de seguridad. Revisa documentación concreta cuando haga falta; no cargues todo el repositorio en el contexto.
- **Flujo de entornos (regla fija):** `staging` es PREproducción (**PRE**, `https://pre.smashandlob.com`) y tiene su **propia base de datos de pruebas**. `main` es PRODUCCIÓN (**PROD**, `https://smashandlob.com`). Todo cambio pasa primero por `staging`/PRE y solo después, con autorización independiente, se lleva a `main`. Nunca se trabaja ni se prueba directamente contra `main` ni contra datos de PROD.
- **Toda rama de trabajo parte de `staging` actualizado** y su PR apunta a `staging`, nunca a `main`. Excepción técnica: las sesiones en la nube pueden venir con una rama preasignada (`claude/...`); mientras el contenido coincida con `staging`, vale, pero el PR se abre igualmente contra `staging`.
- La promoción `staging` → `main` es una operación aparte: exige autorización explícita y diff exacto de lo aprobado. No fusiones `staging` completa en `main` sin comparar cambios (puede haber funciones ocultas o no aprobadas).
- Para desarrollar, comprueba `git status`, rama y HEAD actuales y conserva trabajo local y ajeno. Nunca uses comandos destructivos para limpiar cambios.
- No hacer `merge`, `push`, deploy, publicar PR como mergeada, migraciones ni cambios de datos remotos sin **autorización explícita**. Si la autorización es solamente PRE, PROD permanece intacta.
- Prioridad máxima: emparejamientos secretos, permisos por usuario/rol, RLS y Auth.js, notificaciones, chats, reservas, pagos, históricos y compatibilidad PWA. Proteger datos personales, tokens y claves de servicio. Los espectadores solo pueden consultar información explícitamente pública.
- Los amistosos pueden tener participantes enlazados a cuentas o nombres externos. El creador y participantes enlazados tienen permisos de edición autorizados por backend; el borrado y la administración global de pagos están reservados al creador. Verifica el código actual porque las reglas pueden evolucionar.
- El formato de liga rota las parejas entre jornadas y usa clasificación individual. Los torneos pueden estar ocultos en producción; comprobar el feature flag real antes de habilitarlos.
- Antes de programar Next.js, consulta la documentación instalada en `node_modules/next/dist/docs/` si lo requiere `AGENTS.md`.
- Lee **solo los ficheros necesarios**, busca símbolos y dependencias primero, cita rutas, evita búsquedas recursivas gigantes, refactorizaciones no solicitadas y análisis repetidos. En tareas pequeñas prioriza un diff mínimo.
- Al editar: validar `npm run lint` / `npm run typecheck` / tests dirigidos; para cambios amplios `npm run validate` y Playwright cuando corresponda. No fingir pruebas ni despliegues. Entregar archivos cambiados, riesgos, comprobaciones y pendientes.

Skills disponibles en `.claude/skills/`: `smash-lob-context`, `smash-lob-ui`, `smash-lob-pre`, `smash-lob-video`. Úsalas cuando coincida con la tarea, no todas a la vez.
