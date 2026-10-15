# Opciones para el espacio adicional bajo la PWA

Fecha: 2026-10-15. El usuario acepta la altura preexistente y el aspecto actual tras revisar capturas antiguas. Estas opciones se conservan como investigación, no como migración pendiente. C16 continúa únicamente por la revisión y publicación autorizada a Production.
Documento de decisión; no se ha migrado la aplicación ni modificado Production.

## Evidencia comprobada

En M2012K11AG/alioth, Android13, tanto Chrome153 como155.0.8059.39:

- PRE y Production instaladas en standalone tienen viewport de795.636CSSpx a DPR2.75.
- La navegación propia de Production termina en795.636CSSpx, paddingBottom0; viewport-fit=cover está presente.
- Pantalla1080x2400, status bar0–80, navegación nativa2356–2400 (44px), mandatory gestures2268–2400 (132px).
- El contenido termina en2268: quedan88px adicionales antes de la barra real. La ventana Android de Chrome ocupa toda la pantalla.
- Production no recibió los cambios PRE; su canvas blanco y el negro de PRE presentan la misma geometría. El hueco ya existía antes de actualizar el APK de PRE.
- Chrome153→155 no cambia esa geometría. El módulo concreto responsable de aplicar el inset no ha sido identificado con certeza; la coincidencia con mandatory gestures no acredita por sí sola un bug concreto.

Son lecturas técnicas sobre aperturas manuales del usuario; no se automatizaron operaciones de cuenta ni se escribieron datos de Production.

## Qué puede corregirse desde la web

El negro nativo ya está verificado en el Xiaomi Android16. También se ha actualizado una PRE antigua en Android13 sin desinstalar, conservando packageId, firstInstallTime y sesión. El calendario se aceleró manualmente con chrome://webapks; no existe aquí una implementación para forzar el WebAPK desde JavaScript.

Para la altura, los cambios CSS afectan al viewport que Chrome proporciona. No se ha identificado un mecanismo web estable para ampliar ese viewport en esta PWA standalone. theme-color cambia apariencia, no concede control de WindowInsets; env(safe-area-inset-bottom) es0 en estas mediciones. viewport-fit=cover ya está declarado. La arquitectura actual de Chromium describe nonimmersive standalone edge-to-edge condicionado por WebAppShortEdgesCutoutMode y parámetros desactivados por defecto; HEAD no se confunde con soporte estable del binario155. No se usan flags, fullscreen que oculte el indicador, exclusión de gestos, padding negativo ni barra HTML falsa.

## Opción A: conservar la PWA

Preparar una incidencia de Chromium/MIUI con geometría y reproducer mínimo sin cuentas/datos privados. No se ha enviado ninguna incidencia ni se promete fecha de arreglo. Mantener negro como resultado de color aceptado; el espacio adicional queda como limitación no resuelta en este dispositivo. No solicitar una reinstalación general: no hay evidencia de que corrija esta altura.

## Opción B: controlar una ventana Android propia

Si eliminar ese espacio es un requisito de producto, evaluar un contenedor con WebView/Activity propia, por ejemplo un proyecto Android basado en Capacitor. Su Activity puede configurar edge-to-edge y tratar WindowInsets nativos: dibujar fondo hasta el borde, mantener el indicador de gestos y reservar para controles el inset correcto de navegación, sin usar mandatorySystemGestures como una franja visual completa. La medición de88px sería una aserción del prototipo, no una constante que se codifique.

Esto es una capacidad de arquitectura, **no una corrección implementada o verificada**. La prueba debe demostrarlo en los dos móviles antes de decidir una migración. No se asegura que instalar un wrapper sin configurar insets baste.

Una TWA normal reutiliza Chrome/Custom Tabs. No se ofrece como garantía de eliminar el mismo problema del contenedor de Chrome. El modo inmersivo que oculte barras no cumple el requisito del indicador visible.

### Alcance mínimo de evaluación, sin publicar

1. Activity/WebView de diagnóstico sin datos reales, fondo y controles ficticios; medir navegación/mandatory insets y viewport en ambos móviles, incluido teclado, reapertura y restauración.
2. Conservar indicador nativo, contraste y gestos; negro uniforme o transparencia real, sin solapamientos de controles. No fijar88px ni ocultar barras.
3. Revisar Next.js SSR/API, Google OAuth con navegador externo/deep links, cookies/sesión, invitaciones, Push, service workers/offline, seguridad de navegación y distribución/actualizaciones.
4. No reutilizar una configuración server.url de live reload como arquitectura de producción por defecto; la documentación de Capacitor la identifica como mecanismo de desarrollo no destinado a Production.
5. Decidir arquitectura y pruebas de migración después de resultados; no cambiar main/Production ni sustituir automáticamente la PWA.

## Fuentes primarias

- [Arquitectura WebAPK/TWA de Chromium](https://chromium.googlesource.com/chromium/src/+/HEAD/components/webapps/docs/android_architecture.md): clases nativas, consumidor de insets, separación de modos y features.
- [Guía Android de edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge): configuración de la ventana e insets desde código Android.
- [Configuración oficial de Capacitor](https://capacitorjs.com/docs/config): limitaciones de server.url y opciones nativas. Requiere diseño específico; no se ha preparado una migración.

La referencia de Chromium HEAD describe la arquitectura actual en desarrollo. Las conclusiones de comportamiento de los teléfonos proceden de ADB/CDP y APKs reales, no de asumir que HEAD está activo.
