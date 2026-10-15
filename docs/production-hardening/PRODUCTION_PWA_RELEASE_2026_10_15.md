# Revisión y publicación de los cambios pendientes de PRE

## Alcance y autorización

El usuario confirma mediante capturas antiguas que la franja ya existía, acepta el aspecto actual y autoriza revisar/limpiar y subir a Production todos los cambios publicados en PRE. Esta autorización posterior permite actualizar main y Production para esta entrega; no modifica el tag v1.0.0 ni autoriza migraciones nuevas. Se conserva navbar, línea dorada, temas y altura actuales. No se implementó la propuesta posterior de navbar completamente negra ni un wrapper Android.

Estado inicial verificado: Production/main2461429d/deploymentdpl_FwhBkHmaqFhbP2td2bPyGzZQRSi3; PRE/staging128bd448/deploymentdpl_HwWQ5NaP1MZKaCsniehib4Fsn4w6. Ambos READY y con alias correctos.

## Resultado de la revisión

- La diferencia pendiente contiene correcciones PWA de color nativo, canvas standalone, metadatos, descarga de iconos PRE y revalidación del manifest. No hay migraciones SQL, cambios Supabase ni dependencias nuevas entre main y staging.
- No hay overlay que simule la barra del sistema. Se conserva viewport-fit=cover y el área segura de controles. El negro nativo está probado en Xiaomi Android16; actualización sin reinstalación/sesión preservada probada en Android13, acelerada manualmente por Chrome.
- Retirada herramienta temporal PRE: componente/panel de Ajustes, colector, API de diagnóstico, traducciones específicas y sus tres archivos unitarios/dos escenarios E2E (cuatro ejecuciones móvil/escritorio).
- Retirada variable --app-system-surface: solo se escribía, ningún CSS la consumía. Meta theme-color, color-scheme y el canvas CSS efectivos se mantienen. Ajustada la prueba que observaba esa variable para conservar verificaciones reales de metadatos/modos.
- Retiradas excepción y texto de diagnóstico del checker/inventario de seguridad. Quedan idénticos a main; presupuesto de fuentes restaurado a132250, con132246 líneas reales.
- Las pruebas eliminadas pertenecían exclusivamente a la herramienta retirada; se conservan todas las regresiones funcionales de PWA, temas, instalación y manifest. No se cambian baselines visuales ni umbrales para aprobar.
- No se incorporan las PR Dependabot#22/#23: no están publicadas en PRE y contienen cambios de dependencias que requieren otra revisión. Adjuntos locales/evidencias de teléfono no se añaden a Git.

## Candidata y validación

Candidata1.15.22 desde staging, sin cambios de diseño ni funcionalidad de ligas/cuenta. Versiones package/lock/appVersion/changelog/SW/smoke alineadas.

Validación local con dependencias exactas Next16.3.8/Vitest4.1.11 y entorno ficticio: validate completo935 pruebas/240 archivos, TypeScript, lint0errores/4avisos anteriores, producción/build1183313bytes gzip/102chunks; auditoría completa0 vulnerabilidades. Última corrección documental del generador API validada con api-security y ESLint específico después de sincronizar copia. E2E completo pendiente al crear este informe.

La rama de trabajo habitual conserva node_modules antiguo; los gates se ejecutan en la copia aislada auditada, no se confunden con esa instalación. No OAuth/cuentas/Production automatizados.

## Publicación y comprobación

Pendientes PR/CI y verificación PRE1.15.22 antes de promoción a main. Tras publicar Production se verificarán SHA/rama/deployment/alias, health versión/entorno, manifest negro e iconos, SW/cache y ausencia de endpoint/panel temporal. No se considera publicado por un mero acuse de merge.

Rollback de aplicación identificable: deploymentProduction anterior dpl_FwhBkHmaqFhbP2td2bPyGzZQRSi3/main2461429d; sin migraciones de datos en esta entrega. No se promete actualización instantánea del WebAPK de todos los usuarios ni se prescribe reinstalación general: Chrome gestiona el calendario nativo.
E2E final:86/86 correcto, incluidas referencias visuales, Axe, estilos/modos, PWA/offline y manifest/iconos. APIsecurity final96rutas/139métodos y ESLint específico correctos. Sin actualización de baselines. Lista React revisada: ningún hook/flujo de datos nuevo, bootstrap/metadata coherentes y eliminación de imports/estado innecesarios.
