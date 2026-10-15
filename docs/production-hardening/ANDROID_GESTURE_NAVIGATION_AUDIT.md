# Android: auditoría de la navegación por gestos

Fecha: 2026-10-15. Hito: C16, **IN PROGRESS**. Base local: `5d96a617`, v1.15.19.
No se declara resuelto. No hay validación física nueva en esta auditoría.

Actualización posterior, candidata v1.15.20: se completa negro fijo para el canvas
standalone, no solo manifest/meta. El CSS anterior permitía canvas blanco en claro
y reglas más específicas de navegación/chat podían prevalecer. Bootstrap,
ThemeProvider y spectatorTheme ahora conservan --app-system-surface negro en
standalone; regla final html/body negra con prioridad suficiente y aplicable antes
de data-theme. Paneles y controles conservan claro/oscuro. Sin overlay ni cambios
de safe areas. Es una corrección del contrato de negro fijo; no demuestra que sea
la causa de la franja nativa persistente en oscuro. Gates y publicación de esta
candidata se registran en STATUS; aceptación Android física pendiente.

Decisión del usuario previa a la candidata v1.15.20: conservar negro fijo y publicarlo en PRE.
La comprobación remota nueva confirma que esa configuración ya está publicada
en PRE v1.15.19, deployment READY `dpl_6h9Rro9LCccqgwGYJmZeo1oA9Pkb`,
staging `a5c9dceda0697b79252917a6d04d1f008def9be8`. No se crea otra
versión ni se repite un despliegue idéntico en esa comprobación. La candidata
v1.15.20 descrita arriba sí modifica el canvas; se mantiene pendiente el resultado físico.

## 1. Diagnóstico y evidencias

La franja observada es, con alta probabilidad, una superficie del contenedor
Chrome/WebAPK o del sistema, fuera del contenido web. La causa precisa actual
no está demostrada. El candidato principal es la instalación nativa antigua;
si ya contiene negro, debe investigarse la ventana de Chrome/HyperOS.

| Escenario | Evidencia | Estado |
| --- | --- | --- |
| A: CSS/metadatos incorrectos | La configuración actual solicita negro en manifest y meta standalone; el diagnóstico previo midió html/body negros, color-scheme dark y safeBottom 0. La captura previa muestra blanco debajo del contenido oscuro. | No explica por sí solo la evidencia disponible; no se excluye una transición no capturada. |
| B: instalación antigua | STATUS registra lectura USB de versionCode 3, actualización 11-oct, themeColor/backgroundColor blancos, mientras el manifest web había cambiado. | Divergencia histórica comprobada; estado posterior a v1.15.19 pendiente. |
| C: límite de Chrome | Código oficial de la versión 155.0.8059.39: transparencia WebAPK bajo feature desactivada por defecto; color del manifest bajo feature activada por defecto. | Comprobado en fuente; activación efectiva y rama ejecutada en el móvil pendientes. |
| D: HyperOS | Xiaomi documenta adaptación de la zona de gestos mediante APIs Android nativas. No se encontró evidencia oficial específica que atribuya este fallo a Xiaomi 15T Pro/HyperOS 3. | Hipótesis abierta; no diagnóstico confirmado. |

Los datos físicos anteriores proceden de STATUS y de las evidencias conservadas
en `C:/Users/USER/.codex/android-system-surface-evidence`, no de una medición
realizada en este turno. El informe previo `SL-9E94717F` documenta Chrome UA 155,
standalone, Competition oscuro, html/body negros y metas negras. El Android 10
del UA reducido no es la versión real: la inspección USB anterior obtuvo Android 16.

En esta auditoría `adb devices -l` terminó correctamente con lista vacía.
No se leyó un APK actual, no se forzó actualización, no se cambió configuración,
no se desinstaló ni se borraron datos. No se accedió a cuentas ni datos PRE/PROD.

## 2. Transparencia: investigación antes de aceptar el negro

Existe una implementación real en Chromium para dibujar el contenido de PWAs
instaladas bajo las barras del sistema. No debe confundirse con soporte disponible
incondicionalmente para todos los usuarios de Chrome estable.

- En el tag **155.0.8059.39**, correspondiente al Chrome observado previamente,
  `kWebAppShortEdgesCutoutMode` está desactivada por defecto en C++ y en su flag
  Java de arranque. `WebappActivity` condiciona a ella la coordinación de
  edge-to-edge con `viewport-fit=cover`.
- La rama main consultada incorpora además condiciones por modo de visualización
  (`enable_standalone`), compatibilidad edge-to-edge y tratamiento separado de TWA.
  Main no representa necesariamente el binario instalado.
- `viewport-fit=cover` ya está en Smash & Lob. Solicita el comportamiento al
  navegador; no puede habilitar una feature nativa desactivada.
- El controlador nativo usa navegación transparente cuando su estado efectivo
  es edge-to-edge; el contenido debe llegar detrás y los controles respetar insets.
  Una barra Android transparente sobre una superficie blanca de Chrome seguiría
  viéndose blanca: transparencia de Window no implica contenido web detrás.
- La guía de Chrome sobre edge-to-edge en pestañas describe el «chin» y los insets.
  Que funcione en una pestaña no demuestra soporte equivalente en WebAPK standalone.
- Android 16 impone edge-to-edge según targetSdk de la actividad anfitriona. Esta
  puede consumir insets y dibujar su propia superficie. Next.js no controla su Window.

**Decisión:** no se implementa otro parche de transparencia. No se ha encontrado
una API web estable que permita exigirla en este WebAPK. La implementación existe
como capacidad de Chromium condicionada a features/rollout; no se activarán flags
manualmente ni se cambiará a fullscreen para ocultar la navegación. El valor por
defecto no demuestra qué configuración Finch recibe un dispositivo concreto.
Transparencia pendiente de soporte efectivo y validación física; no se afirma que
sea imposible para siempre o en todos los dispositivos.

Fuentes oficiales:

- [Flags nativas del tag observado](https://chromium.googlesource.com/chromium/src/+/refs/tags/155.0.8059.39/chrome/browser/flags/android/chrome_feature_list.cc).
- [Flags Java del mismo tag](https://chromium.googlesource.com/chromium/src/+/refs/tags/155.0.8059.39/chrome/browser/flags/android/java/src/org/chromium/chrome/browser/flags/ChromeFeatureList.java).
- [WebappActivity del mismo tag](https://chromium.googlesource.com/chromium/src/+/refs/tags/155.0.8059.39/chrome/android/java/src/org/chromium/chrome/browser/webapps/WebappActivity.java).
- [Condiciones actuales por display mode](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/android/java/src/org/chromium/chrome/browser/customtabs/BaseCustomTabActivity.java).
- [Seguimiento oficial de la coordinación de WebAPK y TWA](https://issues.chromium.org/issues/566271943).
- [Guía Chrome: edge-to-edge y safe areas](https://developer.chrome.com/docs/css-ui/edge-to-edge).
- [Android 16: enforcement según targetSdk](https://developer.android.com/about/versions/16/behavior-changes-16#edge-to-edge).

## 3. Alternativa negra: mecanismo y límites

Se mantiene la alternativa ya implementada, después de investigar transparencia:
manifest `theme_color: #000000`, `background_color: #000000` y meta negra en
standalone desde bootstrap y runtime. No hay otra implementación nueva justificada.

No se presupone que theme-color controle siempre la barra inferior. La evidencia
es el cambio oficial Chromium `0a6ab4f0e2ce17e572b05400ae6eacd7fc5389f0`:
WebappIntentDataProvider reutiliza el color de tema de instalación para navegación
cuando hay color personalizado y WebAppNavigationBarThemeColor está activa.
Esa feature está **activada por defecto en el tag 155.0.8059.39** descargado.
BaseCustomTabActivity llama al controlador también para WebAPK.

En modo ajustado, CustomTabNavigationBarController obtiene el color del proveedor
nativo y solicita apariencia de iconos acorde al contraste. En edge-to-edge solicita
transparencia y usa el tema de página para el contraste, no para pintar negro detrás.
No existe un miembro estándar separado de manifest que fije navigationBarColor.
El meta runtime no sustituye los colores incorporados en el APK instalado.

`background_color` sirve para el arranque/splash, no corrige por sí solo la barra
persistente. `color-scheme` afecta controles y dibujo web; no es una llamada a la
API Android de contraste. CSS html/body solo pinta dentro del viewport disponible.
`appleWebApp.statusBarStyle` es específico de Apple.

**Garantía:** esta configuración es una solicitud soportada por ese Chromium,
no una garantía universal de negro en Android 16/HyperOS. Falta comprobar el APK
actual, la feature efectiva, el estado edge-to-edge y los píxeles en el móvil.
La PWA estándar no puede sustituir esos controles nativos ni garantizar ausencia
de flash en el proceso anfitrión antes de cargar el documento.

Fuentes:

- [Cambio que añade color de navegación desde manifest](https://chromium.googlesource.com/chromium/src/+/0a6ab4f0e2ce17e572b05400ae6eacd7fc5389f0).
- [Controlador de navegación del tag observado](https://chromium.googlesource.com/chromium/src/+/refs/tags/155.0.8059.39/chrome/android/java/src/org/chromium/chrome/browser/customtabs/features/CustomTabNavigationBarController.java).
- [Coordinación de actividad del mismo tag](https://chromium.googlesource.com/chromium/src/+/refs/tags/155.0.8059.39/chrome/android/java/src/org/chromium/chrome/browser/customtabs/BaseCustomTabActivity.java).
- [APIs de barras Android](https://developer.android.com/design/ui/mobile/guides/foundations/system-bars).
- [Adaptación nativa de gestos documentada por Xiaomi](https://dev.mi.com/xiaomihyperos/documentation/detail?pId=1629).

## 4. Auditoría local e intentos anteriores

| Archivo o mecanismo | Resultado |
| --- | --- |
| src/app/manifest.ts | standalone, id/scope estables, dos colores negros. Iconos PRE públicos existentes para descarga nativa sin cookies. No migración a TWA. |
| src/app/layout.tsx | Viewport API de Next, cover y meta inicial negra; bootstrap antes de hidratación aplica preferencia y mantiene meta negra en standalone. Guías locales Next 16.3.8 leídas. |
| src/context/ThemeProvider.tsx | Sincroniza color-scheme y fondo con modo; meta standalone negra, navegador claro/oscuro. Sigue cambios de sistema. |
| src/lib/spectatorTheme.ts | Segundo escritor intencional para apariencia de invitación; mismo contrato de meta/fondo, no una corrección contradictoria. |
| src/app/globals.css | Canvas standalone claro/negro por modo; superficie de bottom nav por tema; no body::after que simule navegación. La regla standalone final prevalece sobre el fondo especial de chat. |
| BottomNav/PersonalMatchesNav | Navegación propia con safe-area inferior. No controla la superficie externa Android. |
| AppShell y chat | Reserva de contenido y uso de alturas/insets; safe areas no prueban acceso a región nativa. La reserva fija de 96px de AppShell deberá revisarse con inset real si se habilita edge-to-edge; no se cambia para ocultar blanco. |
| public/sw.js | Caché v1.15.19; manifest network-first con revalidación y fallback offline. Navegaciones online de red; no almacena páginas autenticadas como shell. |
| src/app/launch/page.tsx | Redirección server-side, sin una barra ni color nativo propios. |
| OfflineFallback | Documento web sujeto al tema/CSS, distinto del splash Android. Requiere comprobación física adicional de arranque offline. |
| tests/e2e/system-surface.spec.ts | Fuerza matchMedia y CSSOM en Chromium de escritorio. Comprueba contrato DOM/CSS; no instala un WebAPK ni valida barras Android. |

Historia revisada: `401b115d`, `83cfa593`, `40d4694c`, `c97010c3`,
`39e7c963`, `b1a60148`, `558c8db7`, `ec245a54`, `dfafb431`, `5d96a617`.
Se intentó sincronizar temas y pintar el inset; el overlay artificial fue retirado.
Después se retiraron colores blancos fijos, se corrigió caché del manifest y el
acceso anónimo a iconos PRE. Más tarde se reintrodujo blanco y se retiró otra vez,
antes de optar por negro fijo y splash negro. Estas iteraciones no sustituyeron
la prueba de que el paquete instalado se había actualizado.

Hay tres escritores de meta (bootstrap, proveedor y espectador), coherentes ahora.
Modificar solo uno generaría divergencias; no se refactorizan sin necesidad.
Cambiar la versión web/SW o recargar no demuestra sustitución del WebAPK.
No se añaden claves de manifest no soportadas ni cambios CSS especulativos.

## 5. Cambios y validaciones de esta auditoría

Primera fase, antes de v1.15.20: solo documentación, este informe y PLAN (criterio C16 actualizado a las prioridades
actuales) y STATUS (evidencias y siguiente gate). No código funcional eliminado,
no cambio de versión, no publicación, no modificación de main, Production,
v1.0.0, base de datos, instalación ni configuración móvil.

Validación local en copia de HEAD dentro de
`.quality-artifacts/android-navigation-audit-20261015/app`, sin .env locales,
con entorno ficticio equivalente a Playwright y dependencias ya instaladas.
Resultados actuales: controles estáticos, lint (0 errores/4 avisos existentes),
TypeScript y 944 pruebas/243 archivos correctos fuera del sandbox. El build de
la copia se detuvo porque Turbopack rechaza node_modules enlazado fuera de su raíz;
la corrección de esa preparación fue interrumpida por el usuario. No se afirma
validate completo ni E2E nuevos superados. No se publica código nuevo sobre ese gate.
Los gates previos de v1.15.19 y su despliegue ya existente son evidencia separada.

## 6. Procedimiento concreto en Xiaomi/PRE

1. Anotar versión de Chrome en Información de Chrome y Android/HyperOS en Ajustes.
   Comprobar actualización oficial de Chrome en Play Store; instalarla si existe.
   Una actualización no garantiza que la feature de transparencia esté desplegada.
2. Abrir **Smash & Lob PRE** desde su icono, confirmar entorno PRE y versión
   v1.15.19 o la versión PRE posterior expresamente verificada. No probar el icono
   de Producción. Descargar diagnóstico en Ajustes > Laboratorio.
3. Dejar que cargue con conexión, cerrar todas las ventanas PRE desde Recientes,
   conectar cargador y Wi-Fi para permitir la actualización normal de WebAPK.
   Reabrir después. No borrar almacenamiento. No se promete un plazo de actualización.
4. Si persiste, conectar USB y autorizar ADB para una lectura técnica. Verificar
   package/versionCode/lastUpdateTime y **AndroidManifest del APK instalado**:
   themeColor y backgroundColor deben corresponder a negro, no a -1L (blanco).
   No basta APP_VERSION ni el texto Succeeded en una consulta de actualización.
5. Con PRE visible y desbloqueado, capturar pantalla completa y estado limitado de
   su ventana/actividad: límites del contenido, navegación, insets y apariencia.
   Si el APK sigue blanco, el gate B continúa pendiente. Si ya es negro y la franja
   sigue blanca, investigar C/D con la ventana nativa y, cuando sea posible, comparar
   el mismo PRE en otro Android. No seguir cambiando el manifest entre pruebas.
6. Reinstalación **no obligatoria ni automática**. Solo como experimento voluntario
   posterior, tras guardar evidencia y advertir pérdida de preferencias/sesión locales,
   una instalación nueva permitiría separar actualización antigua de fallo runtime.
   No se recomienda borrar datos de Chrome ni restablecer flags o ajustes globales.

Chrome controla la regeneración del WebAPK. El procedimiento técnico con
`about://webapks` de la documentación oficial puede ayudar al diagnóstico, pero
no debe convertirse en requisito para los usuarios ni se interpreta como prueba
de incorporación de colores sin inspección de paquete.
[Ciclo oficial de actualizaciones](https://web.dev/articles/manifest-updates).

Mantener navegación **por gestos e indicador visible**. Xiaomi documenta esos
ajustes en Pantalla de inicio > Navegación del sistema (el nombre puede variar).
No ocultar el indicador ni desactivar gestos para aprobar la prueba.
[Referencia Xiaomi](https://www.mi.com/global/support/faq/details/KA-509311/).

Matriz física obligatoria, registrar captura/vídeo, versión y resultado:

| Prueba | Qué aceptar | Estado |
| --- | --- | --- |
| Inicio en frío, repetir 3 veces | Sin franja/flash blanco nativo durante splash, redirección y carga | Pendiente |
| Minimizar/restaurar, repetir 3 veces | Color estable e indicador funcional | Pendiente |
| Clásico y Competition × claro/oscuro/sistema | Transparencia con fondo real detrás o negro puro persistente | Pendiente |
| Sistema: cambiar claro/oscuro con PWA abierta | Contenido correcto; barra nativa estable | Pendiente |
| Inicio, ligas, partidos, chats, ajustes | Sin cambios bruscos al navegar ni controles bajo gestos | Pendiente |
| Abrir/cerrar teclado en campo sin enviar | Sin salto blanco persistente; controles alcanzables al cerrar. Registrar por separado superficie del IME mientras está abierto | Pendiente |
| Scroll, bottom nav propia y safe areas | Último control accesible, indicador nativo visible y gestos operativos | Pendiente |
| Arranque offline y recuperación | Sin flash nativo blanco y recuperación funcional | Pendiente |
| Mismo PRE en pestaña Chrome | Comparación diagnóstica; no aceptación de standalone | Pendiente |

Para negro puro, inspeccionar píxeles de captura **fuera del indicador y de su
antialiasing**, no solo juzgar visualmente un gris oscuro. Para transparencia,
demostrar continuidad del fondo real y límite de viewport detrás del indicador.
Un vídeo es necesario para evaluar flashes; una captura estática no basta.

## 7. Si el navegador sigue impidiendo ambos resultados

Abrir incidencia Chromium con reproducción mínima, versión exacta, package metadata
y ventana/captura sin información personal. Comparación en segundo Android para
separar Chrome de HyperOS. Mantener C16 abierto mientras no se cumpla aceptación.

Una TWA sigue dependiendo de Chrome/CustomTabActivity: no garantiza por sí sola
el mismo soporte edge-to-edge que WebAPK, como documenta la incidencia 566271943.
Un contenedor nativo (por ejemplo Capacitor con configuración Android propia)
permite controlar ventana, contraste y dibujo bajo barras, con fondo negro nativo
si se elige esa alternativa. En Android 16 debe diseñarse para edge-to-edge;
setNavigationBarColor aislado no basta. Requiere evaluar distribución, autenticación,
notificaciones, actualizaciones y safe areas con prueba física. No se migra ahora.
