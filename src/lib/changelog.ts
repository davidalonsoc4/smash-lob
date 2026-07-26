export type ChangelogCategory =
  | "new"
  | "improvement"
  | "fix"
  | "foundation"

export type ChangelogRelease = {
  version: string
  date?: string
  title: string
  summary: string
  category: ChangelogCategory
  changes: string[]
}

export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: "v0.16.10",
    date: "26 de julio de 2026",
    title: "Franjas de Ajustes integradas en el panel",
    summary:
      "Los degradados de los paneles formados por filas se renderizan como contenido real y encajan exactamente en sus esquinas redondeadas.",
    category: "fix",
    changes: [
      "Ajustes deja de simular la franja mediante padding y una capa de fondo que podía quedar desplazada o parcialmente tapada.",
      "La franja pasa a ser un elemento interno del panel, recortado por el mismo borde y radio que el resto de la tarjeta.",
      "Administración de liga y Disponibilidad por días utilizan el mismo componente para evitar inconsistencias equivalentes.",
      "El estilo Plano no muestra la franja ni reserva espacio adicional y el resto de tarjetas Coloridas conserva su tratamiento actual.",
      "No se requieren migraciones, cambios de API ni modificaciones de lógica de negocio.",
    ],
  },
  {
    version: "v0.16.9",
    date: "26 de julio de 2026",
    title: "Logos de liga con transparencia",
    summary:
      "Los logos PNG transparentes conservan su fondo transparente sin modificar el aspecto ni la optimización de las imágenes opacas.",
    category: "improvement",
    changes: [
      "El recortador detecta transparencia en el resultado final y conserva automáticamente el canal alfa.",
      "Los logos opacos continúan guardándose como WebP con la misma calidad y apariencia utilizadas hasta ahora.",
      "Los PNG transparentes se mantienen como PNG cuando caben en el límite seguro; si son demasiado complejos, se usa WebP con transparencia como respaldo.",
      "Home, selector de ligas, Administración, invitaciones y visor ampliado continúan mostrando el logo mediante fondo transparente y ajuste completo.",
      "No se requieren migraciones, cambios de API ni modificaciones de los logos ya guardados.",
    ],
  },
  {
    version: "v0.16.8",
    date: "26 de julio de 2026",
    title: "Navegación sin halo y franjas restauradas",
    summary:
      "La barra inferior deja de proyectar resplandor y los paneles de opciones recuperan su franja Colorida correctamente integrada.",
    category: "fix",
    changes: [
      "La sombra difuminada sobre la navegación inferior se sustituye por una separación de un píxel, sin halo sobre el contenido.",
      "Los paneles formados por filas opacas reservan el espacio exacto de la franja superior para que el degradado vuelva a ser visible.",
      "Ajustes, Administración de liga y Disponibilidad por días comparten ahora el mismo tratamiento robusto.",
      "La franja continúa formando parte del fondo del panel, respeta las esquinas redondeadas y no requiere recortar menús ni contenido.",
      "No se requieren migraciones, cambios de API ni modificaciones de lógica de negocio.",
    ],
  },
  {
    version: "v0.16.7",
    date: "26 de julio de 2026",
    title: "Franja Colorida integrada en los paneles",
    summary:
      "La franja degradada superior pasa a formar parte del fondo del panel y queda recortada exactamente por sus esquinas redondeadas.",
    category: "fix",
    changes: [
      "La franja de color deja de utilizar un pseudo-elemento superpuesto que podía sobresalir visualmente en Home y otras tarjetas.",
      "El degradado se dibuja ahora dentro del padding box del propio panel, respetando borde y radio en cualquier tamaño de tarjeta.",
      "Las variantes de notificaciones, actividad y programación conservan sus degradados específicos mediante una variable compartida.",
      "La corrección no recorta contenido, menús ni elementos emergentes y mantiene intactos los estilos Plano, Claro y Oscuro.",
      "No se requieren migraciones, cambios de API ni modificaciones de lógica de negocio.",
    ],
  },
  {
    version: "v0.16.6",
    date: "26 de julio de 2026",
    title: "Contraste final en Colorido oscuro",
    summary:
      "Los controles flotantes pierden el halo excesivo y los textos secundarios sobre superficies de paleta recuperan una lectura clara.",
    category: "fix",
    changes: [
      "Los botones circulares superiores usan sombras neutras y compactas en Colorido oscuro, sin resplandor tintado alrededor.",
      "El botón principal de compartir conserva su jerarquía mediante degradado, borde y una sombra breve sin efecto luminoso.",
      "Los textos secundarios colocados sobre fondos primarios, como Victorias, Balance y otros labels equivalentes, heredan un color compatible con cada paleta.",
      "La corrección se aplica de forma centralizada a tarjetas, selectores y resúmenes equivalentes sin alterar Claro, Oscuro Plano ni los colores semánticos.",
      "No se requieren migraciones, cambios de API ni modificaciones de lógica de negocio.",
    ],
  },
  {
    version: "v0.16.5",
    date: "25 de julio de 2026",
    title: "Cierre visual y búsqueda extendida",
    summary:
      "La búsqueda de Ajustes acompaña a los centros de navegación y el modo Colorido termina su revisión de paneles y acciones oscuras.",
    category: "improvement",
    changes: [
      "La lupa flotante de búsqueda aparece en Ajustes, Administración de liga, Mis ligas y Administración de la aplicación, sin invadir las pantallas de formularios concretos.",
      "La franja degradada superior de las tarjetas Coloridas queda contenida dentro del borde y conserva el redondeado de las esquinas.",
      "Los botones y enlaces de acción con superficies neutras reciben un contorno sutil en Colorido oscuro para distinguirse del fondo.",
      "La revisión mantiene intactos Claro, Oscuro y Sistema en estilo Plano y no modifica lógica de negocio, APIs ni persistencia.",
    ],
  },
  {
    version: "v0.16.4",
    date: "25 de julio de 2026",
    title: "Consistencia visual, avisos y visor de imágenes",
    summary:
      "El sistema de temas gana legibilidad en todas las paletas, los avisos de guardado se unifican y logos y perfiles pueden ampliarse.",
    category: "improvement",
    changes: [
      "Los avisos de guardado de liga, temporada, usuarios, disponibilidad, notificaciones, sugerencias, incidencias y comunicados pasan al centro flotante global sin duplicarse en los formularios.",
      "Las paletas Coloridas adaptan el color del texto de botones al brillo del acento y refuerzan textos secundarios, campos deshabilitados y mensajes semánticos en modo oscuro.",
      "Los logos de liga y las imágenes de perfil principales pueden abrirse a pantalla ampliada con cierre por botón, fondo o tecla Escape.",
      "El visor conserva la proporción de la imagen, bloquea el desplazamiento de fondo y ofrece navegación accesible mediante teclado.",
      "La revisión afecta únicamente a presentación y feedback; no requiere migraciones, cambios de API ni permisos nuevos.",
    ],
  },
  {
    version: "v0.16.3",
    date: "25 de julio de 2026",
    title: "Tema base y estilo visual independientes",
    summary:
      "Claro, Oscuro y Sistema pueden combinarse con un estilo Plano o Colorido y con cualquiera de las cinco paletas preparadas.",
    category: "improvement",
    changes: [
      "La configuración visual se divide en Tema base, Estilo visual y Paleta de color.",
      "El estilo Colorido incorpora variantes claras y oscuras específicas para las cinco paletas.",
      "Sistema + Colorido cambia automáticamente entre la variante clara y oscura sin perder la paleta elegida.",
      "Ajustes muestra únicamente un resumen compacto y traslada la configuración detallada a Temas y apariencia.",
      "Las preferencias anteriores se migran automáticamente: Colorido conserva su paleta y el resto mantiene su tema con estilo Plano.",
      "La configuración sigue siendo local al dispositivo y no requiere migraciones ni cambios de API.",
    ],
  },
  {
    version: "v0.16.2",
    date: "25 de julio de 2026",
    title: "Paletas para la apariencia Colorida",
    summary:
      "El modo Colorido puede personalizarse con cinco combinaciones visuales preparadas, coherentes y seguras para el contraste.",
    category: "new",
    changes: [
      "Añadidas las paletas Índigo y violeta, Azul y turquesa, Verde esmeralda, Coral y rosa y Naranja y púrpura.",
      "La paleta se cambia en Ajustes sin recargar y se recuerda únicamente en el dispositivo.",
      "Fondos, navegación, tarjetas, formularios, clasificación, skeletons y controles adoptan automáticamente la combinación elegida.",
      "Los colores semánticos de errores, avisos, pagos y estados de partido permanecen independientes de la paleta visual.",
      "La apariencia seleccionada se aplica antes de hidratar la aplicación para evitar destellos con la paleta predeterminada.",
      "No se requiere migración, cambio de API ni persistencia remota.",
    ],
  },
  {
    version: "v0.16.1",
    date: "25 de julio de 2026",
    title: "Ubicaciones legibles y consistencia visual",
    summary:
      "Las ubicaciones y pistas se presentan con el mismo formato en toda la aplicación y el modo Colorido gana coherencia en avisos, actividad y programación.",
    category: "fix",
    changes: [
      "Las notificaciones de programación reconstruyen el lugar y la pista desde sus datos y dejan de mostrar objetos JSON, incluso en avisos históricos.",
      "Actividad, detalle de partido, calendario y exportaciones CSV comparten el mismo formateador de ubicaciones.",
      "Los recordatorios de próximo partido también aparecen en el centro de notificaciones personal con una ubicación legible.",
      "Las tarjetas de notificaciones, actividad y programación reciben acentos propios y consistentes dentro del modo Colorido.",
      "No se modifica el valor almacenado de la programación ni se requiere migración de base de datos.",
    ],
  },
  {
    version: "v0.16.0",
    date: "24 de julio de 2026",
    title: "Nueva apariencia Colorida",
    summary:
      "Smash & Lob estrena un cuarto modo visual más vivo, con una identidad coherente en navegación, tarjetas, clasificación y Ajustes.",
    category: "new",
    changes: [
      "Nueva opción Colorido en Ajustes, junto a Claro, Oscuro y Sistema, con vista previa de cada apariencia.",
      "Fondos azul lavanda, acentos índigo, violeta, rosa y ámbar y superficies con mayor profundidad visual.",
      "Tarjetas, estadísticas, clasificación, navegación inferior y controles flotantes adoptan una presentación propia del nuevo modo.",
      "Los colores funcionales de partidos, pagos y estados se mantienen reconocibles y pueden seguir neutralizándose desde la configuración de la liga.",
      "La apariencia se guarda únicamente en el dispositivo, se aplica sin recargar y evita destellos incorrectos al abrir la aplicación.",
      "El modo Claro, Oscuro y Sistema conservan su comportamiento anterior.",
    ],
  },
  {
    version: "v0.15.7",
    date: "24 de julio de 2026",
    title: "Validación limpia del feedback de disponibilidad",
    summary:
      "La carga de disponibilidad declara correctamente todas sus dependencias y deja el lint de la serie v0.15 sin avisos.",
    category: "fix",
    changes: [
      "Añadida la traducción del botón Reintentar a las dependencias del efecto que carga la disponibilidad.",
      "La corrección no cambia la carga, el guardado ni la recuperación ante errores de conexión.",
    ],
  },
  {
    version: "v0.15.6",
    date: "24 de julio de 2026",
    title: "Feedback de acciones y recuperación de conexión",
    summary:
      "Las operaciones importantes confirman su resultado sin perder el contexto y permiten reintentar errores temporales desde un aviso global.",
    category: "improvement",
    changes: [
      "Nuevo centro global de avisos accesibles para confirmaciones, errores e información de acciones.",
      "La aplicación avisa cuando se pierde la conexión y confirma automáticamente cuándo vuelve a estar disponible.",
      "Disponibilidad, notificaciones, perfil e ideas muestran confirmaciones visibles aunque la acción se realice fuera de la zona visible.",
      "Los errores recuperables de disponibilidad, notificaciones y sugerencias ofrecen un botón de reintento directo.",
      "Los avisos respetan el modo oscuro, el área segura móvil y la navegación inferior sin desplazar el contenido.",
    ],
  },
  {
    version: "v0.15.5",
    date: "24 de julio de 2026",
    title: "Actualización de actividad corregida",
    summary:
      "Los estados vacíos de Actividad reutilizan correctamente la recarga existente y vuelven a superar la validación de TypeScript.",
    category: "fix",
    changes: [
      "El botón Actualizar de los estados vacíos ya no referencia una función inexistente.",
      "La recarga de Actividad se centraliza para actualizar el diagnóstico local y volver a solicitar los eventos.",
      "La corrección no modifica el historial, los filtros ni la configuración de avisos de la liga.",
    ],
  },
  {
    version: "v0.15.4",
    date: "24 de julio de 2026",
    title: "Validación limpia de onboarding",
    summary:
      "El flujo de completado de perfil queda libre de avisos de lint tras la incorporación de los nuevos estados de carga.",
    category: "fix",
    changes: [
      "Eliminada una traducción inicializada pero no utilizada en la puerta de completado del perfil.",
      "La corrección no cambia el comportamiento del formulario, el onboarding ni la disponibilidad habitual.",
    ],
  },
  {
    version: "v0.15.3",
    date: "24 de julio de 2026",
    title: "Ayudas contextuales y onboarding ligero",
    summary:
      "Las funciones menos evidentes muestran consejos breves la primera vez que se utilizan, sin interrumpir el flujo normal de la aplicación.",
    category: "new",
    changes: [
      "Ajustes explica el acceso al buscador flotante la primera vez que se visita la pantalla.",
      "La disponibilidad por días aclara cómo activar jornadas y añadir varias franjas.",
      "Los partidos indican dónde encontrar incidencias y suplentes cuando esas acciones están disponibles.",
      "Administrar temporada explica la nueva organización por accesos rápidos y bloques.",
      "Cada consejo puede descartarse y volver a activarse desde Ayuda y conceptos básicos.",
      "Las ayudas están disponibles en español, inglés y euskera y se guardan únicamente en el dispositivo.",
    ],
  },
  {
    version: "v0.15.2",
    date: "24 de julio de 2026",
    title: "Estados vacíos con acciones útiles",
    summary:
      "Las pantallas sin contenido explican qué falta y ofrecen el siguiente paso adecuado en lugar de mostrar mensajes aislados.",
    category: "improvement",
    changes: [
      "Nuevo componente común para estados vacíos con icono, explicación y acciones principal y secundaria.",
      "Partidos, notificaciones y actividad ofrecen accesos directos para continuar la tarea.",
      "Los buzones de sugerencias distinguen claramente entre ausencia de propuestas y filtros sin resultados.",
      "Comunicados, suplentes y estadísticas muestran explicaciones específicas según el contenido pendiente.",
      "Los estados vacíos se adaptan al modo oscuro y conservan una presentación compacta en pantallas densas.",
    ],
  },
  {
    version: "v0.15.1",
    date: "24 de julio de 2026",
    title: "Cargas más fluidas y predecibles",
    summary:
      "Las esperas principales muestran skeletons con la estructura real de cada pantalla para reducir saltos visuales y mejorar la percepción de velocidad.",
    category: "improvement",
    changes: [
      "Nuevo sistema reutilizable de skeletons para inicio, listas, clasificación, detalle, ajustes y perfil.",
      "La carga inicial de sesión y perfil deja de mostrar tarjetas genéricas y presenta la estructura aproximada de la aplicación.",
      "El cambio entre ligas muestra un estado visual específico con el nombre de la liga de destino.",
      "Ranking, partidos, estadísticas, Ajustes, notificaciones, actividad, pagos, perfiles y partidos incorporan estados de carga de ruta.",
      "Las animaciones respetan la preferencia del sistema para reducir movimiento.",
    ],
  },
  {
    version: "v0.15.0",
    date: "24 de julio de 2026",
    title: "Recorte y optimización de imágenes",
    summary:
      "Las imágenes de perfil y los logotipos de liga pueden encuadrarse, ampliarse y girarse antes de guardarse.",
    category: "new",
    changes: [
      "Nuevo editor de recorte previo para imágenes de perfil y logotipos de liga.",
      "El usuario puede arrastrar, ampliar y girar la imagen con una vista previa del resultado final.",
      "Las imágenes se normalizan a formato cuadrado, 512 × 512 píxeles y se comprimen antes de guardarse.",
      "El editor usa máscara circular para avatares y cuadrada para logotipos, conservando transparencia cuando el navegador lo permite.",
    ],
  },
  {
    version: "v0.14.6",
    date: "24 de julio de 2026",
    title: "Reapertura segura de temporadas",
    summary:
      "Las temporadas cerradas pueden reabrirse conservando íntegramente su plantilla, calendario y configuración original.",
    category: "fix",
    changes: [
      "Reabrir una temporada ya no reutiliza el flujo de inicio ni regenera sus partidos.",
      "Se conservan la modalidad de plantilla, los jugadores, las inscripciones, las reglas y el calendario existentes.",
      "Los partidos guardados se recuperan de Supabase al reactivar la temporada.",
    ],
  },
  {
    version: "v0.14.5",
    date: "24 de julio de 2026",
    title: "Validación de efectos React",
    summary:
      "Las cargas iniciales del buzón y la navegación por anclas de Notificaciones cumplen las reglas de efectos de React sin alterar su funcionamiento.",
    category: "fix",
    changes: [
      "La bandeja de sugerencias de superusuario carga sus datos sin actualizar estado de forma síncrona dentro de un efecto.",
      "El historial personal de sugerencias usa una carga cancelable que evita actualizaciones después de desmontar la pantalla.",
      "Las anclas de Notificaciones abren y desplazan el grupo correspondiente mediante callbacks de animación seguros.",
    ],
  },
  {
    version: "v0.14.4",
    date: "24 de julio de 2026",
    title: "Buscador flotante más estable",
    summary:
      "La ventana de búsqueda conserva una posición fija, adapta su tamaño al contenido y cubre correctamente toda la pantalla con el fondo desenfocado.",
    category: "improvement",
    changes: [
      "La ventana de búsqueda se sitúa bajo los controles flotantes superiores con un margen constante.",
      "El panel crece o se compacta según los resultados sin desplazar su borde superior.",
      "El desplazamiento interno solo aparece cuando el contenido supera la altura máxima disponible.",
      "El fondo desenfocado se extiende más allá del borde superior para evitar franjas sin blur en móviles.",
    ],
  },
  {
    version: "v0.14.3",
    date: "24 de julio de 2026",
    title: "Ayuda contextual y búsqueda estable",
    summary:
      "La búsqueda flotante mantiene una altura estable y las explicaciones se adaptan a la configuración real de cada temporada.",
    category: "improvement",
    changes: [
      "La ventana flotante de búsqueda conserva una altura fija aunque cambien la consulta, los resultados o el teclado del móvil.",
      "Ayuda y conceptos básicos incorpora las funciones recientes de la aplicación y resume la configuración activa de la temporada.",
      "Las explicaciones de cuota, MVP, confirmaciones, incidencias y suplentes solo aparecen cuando esas funciones están habilitadas.",
      "La aceptación del reglamento antes de entrar en una liga muestra únicamente las reglas aplicables a esa temporada.",
    ],
  },
  {
    version: "v0.14.2",
    date: "24 de julio de 2026",
    title: "Sugerencias y búsqueda flotante",
    summary:
      "Nuevo canal de propuestas y una búsqueda de Ajustes más completa, rápida y accesible desde cualquier punto de la pantalla.",
    category: "new",
    changes: [
      "Nuevo Buzón de sugerencias dentro de Ayuda e información, con seguimiento privado del estado de cada propuesta.",
      "Los superusuarios pueden revisar, clasificar y anotar las sugerencias recibidas desde Administración de la aplicación.",
      "El buscador deja de ocupar espacio fijo y pasa a un botón flotante sobre la navegación inferior.",
      "El índice de búsqueda incorpora opciones internas de notificaciones, temporada, operaciones y administración global.",
      "La búsqueda tolera plurales, expresiones naturales y pequeños errores de escritura, y muestra accesos recientes y rápidos.",
      "El menú Más acciones de los partidos usa opciones más compactas para mantener cada texto en una sola línea.",
    ],
  },
  {
    version: "v0.14.1",
    date: "24 de julio de 2026",
    title: "Ajustes más compactos y claros",
    summary:
      "Pulido visual de Ajustes y sus pantallas informativas para reducir duplicidades, altura y elementos innecesarios.",
    category: "improvement",
    changes: [
      "La versión vuelve a mostrarse como texto centrado al final de Ajustes y se elimina el acceso duplicado.",
      "El Registro de cambios queda centrado únicamente en el historial de versiones.",
      "Todos los grupos de notificaciones aparecen cerrados al entrar en la pantalla.",
      "La disponibilidad por días usa filas compactas y desplegables para editar cada jornada.",
      "Actividad de la liga reduce el tamaño del encabezado y del selector General, Personal y Admin.",
      "Ayuda y conceptos básicos adapta tipografías, tarjetas y espacios al resto de Ajustes.",
    ],
  },
  {
    version: "v0.14.0",
    date: "24 de julio de 2026",
    title: "Nueva arquitectura de Ajustes",
    summary:
      "Ajustes y Administración se reorganizan por finalidad para encontrar cada opción con menos desplazamientos y menos mezclas de conceptos.",
    category: "improvement",
    changes: [
      "Ajustes se divide en Personal, Mis ligas, Actividad personal, Administración y Ayuda e información.",
      "Jugador y espectador comparten la misma arquitectura, mostrando únicamente las opciones permitidas por su rol.",
      "Administración se agrupa en General, Personas y accesos, Competición, Operaciones y Datos y control.",
      "Las preferencias de notificación se compactan en categorías desplegables.",
      "Administrar temporada incorpora navegación y separadores para calendario, reglas, plantilla y ciclo de vida.",
      "El buscador mantiene su funcionamiento anterior y se adaptará a la nueva arquitectura en una revisión posterior.",
    ],
  },
  {
    version: "v0.13.4",
    date: "24 de julio de 2026",
    title: "Perfil y navegación unificados",
    summary:
      "Ajustes más compactos y navegación visual consistente en toda la aplicación.",
    category: "improvement",
    changes: [
      "Nueva pantalla Mi perfil para editar conjuntamente el nombre y la imagen.",
      "El registro de cambios muestra de forma explícita el número de la versión actual.",
      "Los indicadores de navegación antiguos se sustituyen por chevrons homogéneos.",
      "Crear una liga y unirse a otra liga siguen disponibles directamente desde Ajustes.",
    ],
  },
  {
    version: "v0.13.3",
    date: "24 de julio de 2026",
    title: "Registro público de cambios",
    summary:
      "Nueva pantalla para consultar cómo ha evolucionado Smash & Lob desde las primeras versiones documentadas.",
    category: "new",
    changes: [
      "Historial de versiones ordenado desde la actualización más reciente.",
      "Acceso directo desde Ajustes y desde el número de versión de la aplicación.",
      "Descripciones preparadas para publicación, sin datos privados ni detalles internos sensibles.",
    ],
  },
  {
    version: "v0.13.2",
    date: "23 de julio de 2026",
    title: "Sincronización de plantillas",
    summary:
      "Corrección del estado de las plantillas antes del comienzo de una temporada.",
    category: "fix",
    changes: [
      "Un jugador que se desvincula deja de aparecer inmediatamente en la sala de espera.",
      "El contador de inscritos vuelve a reflejar las plazas realmente ocupadas.",
      "Se eliminan filas antiguas conservadas por el dispositivo sin afectar a otras ligas.",
    ],
  },
  {
    version: "v0.13.0",
    date: "23 de julio de 2026",
    title: "Administración de aplicación",
    summary:
      "Nueva gestión global para supervisar cuentas y el estado general de la aplicación.",
    category: "new",
    changes: [
      "Resumen global de usuarios, ligas, temporadas activas y dispositivos registrados.",
      "Más información de cuenta, accesos, roles y ligas administradas.",
      "Suspensión y reactivación de cuentas sin eliminar su historial.",
      "Reinicio de perfil, disponibilidad y preferencias de notificación.",
      "Transferencia de propiedad de ligas y registro de acciones administrativas.",
    ],
  },
  {
    version: "v0.12.7",
    date: "23 de julio de 2026",
    title: "Programación y estadísticas más compactas",
    summary: "Ajustes visuales para mostrar únicamente las acciones disponibles.",
    category: "improvement",
    changes: [
      "El panel Programación solo se despliega cuando el usuario puede editar o aplazar el partido.",
      "Los usuarios sin esas acciones ven una tarjeta compacta sin controles vacíos.",
      "El selector de temporada de Historial y estadísticas ocupa menos altura y solo aparece cuando hay varias temporadas.",
    ],
  },
  {
    version: "v0.12.1–v0.12.6",
    title: "Ajustes posteriores de gestión",
    summary:
      "Revisiones menores de estabilidad y presentación sobre las funciones estrenadas en v0.12.0.",
    category: "fix",
    changes: [
      "Correcciones en avisos de partidos y presentación de ubicaciones.",
      "Mejoras en los resúmenes de Administración de temporada.",
      "Ajustes de coherencia entre historial, temporadas y gestión de liga.",
    ],
  },
  {
    version: "v0.12.0",
    date: "22 de julio de 2026",
    title: "Gestión avanzada de ligas",
    summary:
      "Una de las mayores ampliaciones de la beta, centrada en incidencias, histórico y comunicación.",
    category: "new",
    changes: [
      "Incidencias de partido y resoluciones administrativas excepcionales.",
      "Duplicación de temporadas terminadas para preparar una nueva edición.",
      "Pantalla completa de Historial y estadísticas por temporada y jugador.",
      "Comunicados generales o dirigidos a una temporada con avisos push.",
      "Exportación de clasificación y resultados en CSV.",
    ],
  },
  {
    version: "v0.11.8",
    date: "22 de julio de 2026",
    title: "Estabilidad de actualización",
    summary:
      "Mejoras internas para refrescar datos de forma más fiable sin interrumpir el uso de la aplicación.",
    category: "fix",
    changes: [
      "Refresco suave de datos al volver a la aplicación.",
      "Correcciones de consistencia y calidad antes de la siguiente gran versión.",
    ],
  },
  {
    version: "v0.11.0",
    date: "22 de julio de 2026",
    title: "Temporadas por autoinscripción",
    summary:
      "Las temporadas pueden crearse por número de plazas y completar su plantilla conforme se unen los jugadores.",
    category: "new",
    changes: [
      "Modalidad de plantilla preparada por el organizador o por autoinscripción.",
      "Sala de espera con plazas disponibles, contador y acciones para entrar o salir.",
      "Perfil global de usuario con nombre y apellido reutilizado en todas las ligas.",
      "Generación del calendario al completar la plantilla y comenzar la temporada.",
    ],
  },
  {
    version: "v0.10.3",
    date: "20 de julio de 2026",
    title: "Suplentes consolidados",
    summary:
      "Correcciones y reglas adicionales para completar el sistema de sustituciones.",
    category: "fix",
    changes: [
      "Mayor consistencia al añadir, retirar y asignar suplentes.",
      "Protecciones para evitar incompatibilidades entre sustituciones puntuales y reemplazos permanentes.",
      "Historial y estadísticas de suplentes conservados aunque dejen la bolsa.",
    ],
  },
  {
    version: "v0.10.0",
    date: "20 de julio de 2026",
    title: "Suplentes y reemplazos",
    summary:
      "Nuevo sistema para gestionar ausencias sin alterar el historial de la competición.",
    category: "new",
    changes: [
      "Bolsa de suplentes externa a los titulares de la temporada.",
      "Sustituciones puntuales para un partido concreto.",
      "Reemplazos permanentes desde una jornada determinada.",
      "Puntos, MVP, confirmaciones y pagos atribuidos a quienes disputan realmente el partido.",
    ],
  },
  {
    version: "v0.9.69–v0.9.71",
    date: "18–20 de julio de 2026",
    title: "Identidad de beta y experiencia PWA",
    summary:
      "Ajustes de instalación, presentación y diferenciación de las versiones de prueba.",
    category: "improvement",
    changes: [
      "Mejoras visuales e iconos específicos para la aplicación instalable.",
      "Identificación más clara del estado de beta cerrada.",
      "Ajustes de navegación y búsqueda dentro de Ajustes.",
    ],
  },
  {
    version: "v0.9.68",
    date: "18 de julio de 2026",
    title: "Base de beta cerrada",
    summary:
      "Versión estable utilizada como referencia para las primeras validaciones completas con varias cuentas.",
    category: "foundation",
    changes: [
      "Recorrido completo de organizador, jugador y espectador.",
      "Validación de resultados, confirmaciones, MVP, invitaciones y disponibilidad.",
      "Indicador visible de beta cerrada en Ajustes.",
    ],
  },
  {
    version: "v0.9.38–v0.9.67",
    title: "MVP, confirmaciones y espectadores",
    summary:
      "La competición ganó más controles deportivos y nuevas formas de seguimiento.",
    category: "new",
    changes: [
      "Sistemas MVP automático, manual y por votación.",
      "Confirmación de resultados opcional u obligatoria.",
      "Acceso independiente para espectadores en modo de solo lectura.",
      "Modo oscuro y múltiples mejoras de interfaz, actividad y notificaciones.",
    ],
  },
  {
    version: "v0.9.14–v0.9.15",
    title: "Invitaciones simplificadas",
    summary:
      "Mejoras en el acceso a ligas y en la reclamación de jugadores.",
    category: "improvement",
    changes: [
      "Enlaces de invitación más limpios y fáciles de compartir.",
      "Flujo de incorporación corregido para nuevas cuentas.",
      "Regeneración controlada de códigos de invitación.",
    ],
  },
  {
    version: "v0.9.2",
    title: "Disponibilidad semanal",
    summary:
      "Los jugadores pueden indicar cuándo están disponibles para organizar las jornadas.",
    category: "new",
    changes: [
      "Disponibilidad por días y franjas horarias.",
      "Indicadores de coincidencia entre los cuatro participantes.",
      "Presentación compacta y pensada para elegir horarios rápidamente.",
    ],
  },
  {
    version: "v0.8.5",
    title: "Mejor experiencia en iPhone",
    summary:
      "Ajustes específicos para el uso de Smash & Lob como aplicación instalada.",
    category: "improvement",
    changes: [
      "Mejor adaptación a la barra superior y las zonas seguras de iOS.",
      "Correcciones de espaciado y navegación en modo PWA.",
    ],
  },
  {
    version: "v0.8.1",
    title: "Primera base estable",
    summary:
      "Consolidación de los principales flujos de liga antes de ampliar la beta.",
    category: "foundation",
    changes: [
      "Gestión más consistente de ligas, temporadas, jornadas y resultados.",
      "Mejoras generales de navegación y presentación.",
    ],
  },
  {
    version: "v0.7.62–v0.7.63",
    title: "Estructura principal de Smash & Lob",
    summary:
      "La aplicación reúne sus funciones esenciales de competición privada de pádel.",
    category: "foundation",
    changes: [
      "Ligas privadas con jugadores, temporadas y calendario.",
      "Registro de resultados, clasificación y perfiles.",
      "Actividad, notificaciones y administración básica de la competición.",
    ],
  },
  {
    version: "v0.6.4",
    date: "30 de junio de 2026",
    title: "Introducción de resultados más rápida",
    summary: "Pequeñas mejoras para agilizar el trabajo diario del organizador.",
    category: "improvement",
    changes: [
      "Avance automático entre los campos del marcador al registrar un partido.",
      "Panel de avisos administrativos plegado por defecto.",
    ],
  },
  {
    version: "v0.6.3",
    date: "30 de junio de 2026",
    title: "Resultado más compacto",
    summary: "Rediseño del bloque de ganador y consolidación del nombre de la PWA.",
    category: "improvement",
    changes: [
      "Panel de pareja ganadora más claro y compacto.",
      "Nombre instalable establecido como Smash & Lob Padel.",
    ],
  },
  {
    version: "v0.6.2",
    date: "30 de junio de 2026",
    title: "Actividad administrativa configurable",
    summary:
      "Primer registro conservado de una versión con controles administrativos diferenciados.",
    category: "foundation",
    changes: [
      "Pestaña administrativa de Actividad visible únicamente para roles autorizados.",
      "Configuración de los avisos que aparecen en la actividad de la liga.",
      "Mejor soporte para logotipos con fondo transparente.",
    ],
  },
]
