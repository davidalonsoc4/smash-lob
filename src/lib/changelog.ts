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
    version: "v1.4.5",
    date: "8 de agosto de 2026",
    title: "Ganador de cada set destacado en el Calendario",
    summary:
      "El marcador por juegos del Calendario resalta en negrita el resultado de la pareja que gana cada set para identificar la secuencia del partido más rápido.",
    category: "improvement",
    changes: [
      "En cada set finalizado, el número de juegos de la pareja ganadora se muestra en negrita y el de la pareja perdedora mantiene peso normal.",
      "Se conserva sin cambios la fecha en la cabecera izquierda, la ubicación en la zona inferior y el resto de la composición de las tarjetas.",
      "El ajuste sigue limitado al Calendario de liga mientras se termina de validar este diseño antes de reutilizarlo en Mis partidos.",
    ],
  },
  {
    version: "v1.4.4",
    date: "8 de agosto de 2026",
    title: "Resultado personal y marcador compacto en Calendario",
    summary:
      "El Calendario identifica tus partidos terminados como victoria o derrota y acerca los juegos de cada set al marcador de su pareja para leer el resultado de un vistazo.",
    category: "improvement",
    changes: [
      "Cuando el usuario participa en un partido finalizado, la etiqueta Finalizado pasa a mostrar Victoria en verde o Derrota en rojo según su resultado; los partidos ajenos conservan su estado habitual.",
      "Cada pareja muestra a la derecha sus juegos en cada set, seguidos del número de sets ganados, dentro del mismo bloque visual.",
      "En las tarjetas apiladas del Calendario desaparece la fila inferior de resultados por set porque esa información queda integrada junto a cada pareja.",
      "El cambio sigue limitado al Calendario de liga para poder pulirlo antes de reutilizarlo en Mis partidos.",
    ],
  },
  {
    version: "v1.4.3",
    date: "8 de agosto de 2026",
    title: "Paneles de parejas más claros en el Calendario",
    summary:
      "Las tarjetas del Calendario de liga muestran cada pareja en dos líneas dentro de su propio bloque visual y encajan el marcador en chips discretos para leer mejor cada partido.",
    category: "improvement",
    changes: [
      "Cada pareja del partido se muestra en su propio bloque gris suave con bordes redondeados, manteniendo a cada jugador en una línea independiente.",
      "El resultado de cada equipo deja de quedar suelto y pasa a mostrarse dentro de un pequeño chip visual alineado verticalmente con la pareja correspondiente.",
      "Se elimina la línea separadora entre equipos porque la separación visual queda resuelta por los dos bloques de pareja.",
      "El cambio sigue limitado al Calendario de liga para decidir después si se reutiliza el mismo lenguaje visual en Mis partidos.",
    ],
  },
  {
    version: "v1.4.1",
    date: "8 de agosto de 2026",
    title: "Mis partidos reúne toda tu actividad",
    summary:
      "Mis partidos evoluciona a una agenda e historial personal transversal que reúne competición y amistosos sin duplicar ni alterar los datos oficiales de las ligas.",
    category: "improvement",
    changes: [
      "El historial combina tus partidos terminados de todas las ligas con los amistosos y los carga realmente de 10 en 10 mediante paginación de base de datos.",
      "Próximo partido muestra el siguiente encuentro programado y permite alternar Liga / Amistoso cuando existen próximos partidos de ambos tipos.",
      "Las tarjetas identifican el origen mediante una etiqueta y color estable, muestran cada jugador en su propia línea, el marcador general por sets, hora, ubicación y acceso al detalle.",
      "Los amistosos pueden programarse para el futuro o registrarse una vez jugados; después se puede añadir o corregir el resultado desde su detalle.",
      "El detalle de un amistoso reutiliza el marcador de Partido y ofrece fecha, ubicación, Cómo llegar y Añadir al calendario, omitiendo las funciones exclusivamente competitivas.",
      "El modo Mis partidos conserva únicamente el botón flotante de Ajustes y sigue ocultando la navegación inferior y los controles propios de una liga.",
      "La guía de Ajustes explica el acceso Mis ligas / Mis partidos y sube de versión para volver a mostrarse una vez con esta nueva organización.",
    ],
  },
  {
    version: "v1.4.0",
    date: "8 de agosto de 2026",
    title: "Mis partidos fuera de liga",
    summary:
      "Smash & Lob incorpora un espacio personal separado de las ligas para registrar y conservar amistosos sin alterar ninguna competición oficial.",
    category: "new",
    changes: [
      "Mis ligas incorpora una entrada diferenciada a Mis partidos, manteniendo las ligas como núcleo competitivo de la aplicación.",
      "El modo personal permite consultar el historial, registrar un amistoso con fecha, ubicación, cuatro jugadores y resultado por sets, y abrir el detalle de cada encuentro.",
      "Un único partido aparece en el historial de todos los participantes que tengan una cuenta vinculada; los jugadores sin cuenta pueden añadirse manualmente por nombre.",
      "Los jugadores conocidos se ofrecen a partir de las ligas compartidas, sin exponer el directorio global de usuarios de la aplicación.",
      "Los amistosos se almacenan en tablas independientes y nunca afectan a clasificación, estadísticas oficiales, récords, temporadas ni MVP de las ligas.",
      "El modo Mis partidos usa una navegación simplificada sin controles flotantes ni barra inferior de liga.",
    ],
  },
  {
    version: "v1.3.6",
    date: "7 de agosto de 2026",
    title: "Guía completa y breve de Ajustes",
    summary:
      "Ajustes incorpora un recorrido corto por las secciones principales para que cada usuario sepa qué puede configurar y cómo encontrar cualquier opción rápidamente.",
    category: "improvement",
    changes: [
      "La guía de Ajustes recorre Perfil, Apariencia, Notificaciones, Buzón de sugerencias y termina en el buscador flotante.",
      "Los pasos se filtran automáticamente cuando una opción no está disponible para el rol actual, evitando explicaciones de controles que el usuario no puede ver.",
      "El recorrido permanece limitado a las áreas principales y no explica interruptores u opciones individuales para mantenerlo breve.",
      "El tutorial de Ajustes sube de versión para mostrarse una vez con la nueva estructura y seguir siendo repetible desde la ayuda visual.",
    ],
  },
  {
    version: "v1.3.5",
    date: "7 de agosto de 2026",
    title: "Ayudas flotantes correctamente sincronizadas",
    summary:
      "La guía de Inicio mantiene el recorrido de derecha a izquierda y cada botón flotante muestra ahora exactamente su título y explicación correspondientes.",
    category: "fix",
    changes: [
      "Ajustes se resalta junto a la explicación de Ajustes, sin reutilizar el texto de Notificaciones.",
      "Notificaciones, acceso de espectadores, invitación de jugadores y Ayuda mantienen cada uno su explicación asociada al botón correcto.",
      "El orden del recorrido sigue siendo de derecha a izquierda y continúa filtrando automáticamente los controles que el usuario no puede ver.",
      "Las comprobaciones automáticas validan selector, título y contenido explicativo en castellano, inglés y euskera para evitar desajustes futuros.",
    ],
  },
  {
    version: "v1.3.4",
    date: "7 de agosto de 2026",
    title: "Bienvenida integrada en la guía de Inicio",
    summary:
      "El primer recorrido reúne la bienvenida y la explicación completa de Inicio, mientras que las repeticiones comienzan directamente por las funciones de la pantalla.",
    category: "improvement",
    changes: [
      "Bienvenida deja de aparecer como tutorial independiente y pasa a ser el primer paso, de una sola vez, de la guía de Inicio.",
      "El recuadro de bienvenida utiliza prácticamente todo el ancho disponible de la aplicación para mejorar la lectura.",
      "La guía de Inicio explica los controles flotantes de derecha a izquierda: Ajustes, Notificaciones, acceso de espectadores, invitación de jugadores y Ayuda.",
      "Los pasos correspondientes a controles que el usuario no puede ver se omiten automáticamente según su rol y permisos.",
      "Al repetir manualmente la guía de Inicio se omite la bienvenida y se comienza directamente por el resumen de la liga.",
    ],
  },
  {
    version: "v1.3.3",
    date: "7 de agosto de 2026",
    title: "Posición estable al filtrar el calendario",
    summary:
      "El Calendario sigue llevando a la jornada activa al abrir la pantalla, pero respeta la posición del usuario cuando cambia entre todos los partidos y sus propios partidos.",
    category: "fix",
    changes: [
      "La jornada activa continúa enfocándose automáticamente al entrar en Calendario durante una temporada activa.",
      "Cambiar entre Liga completa y Mis partidos ya no desplaza de nuevo la pantalla ni interrumpe la consulta en curso.",
      "Las temporadas próximas o terminadas mantienen el comportamiento existente, sin posicionamiento automático.",
    ],
  },
  {
    version: "v1.3.2",
    date: "6 de agosto de 2026",
    title: "Calendario más compacto y centrado en la jornada actual",
    summary:
      "La pantalla de Calendario ocupa menos espacio en su selector de vista y lleva directamente a la jornada activa mientras la temporada está en curso.",
    category: "improvement",
    changes: [
      "El selector Liga completa / Mis partidos se muestra en una única línea con un diseño más compacto y los recuentos integrados en cada opción.",
      "Cuando la temporada está activa, la pantalla se desplaza automáticamente hasta la jornada marcada como activa.",
      "Las temporadas próximas o terminadas conservan la posición habitual y no realizan ningún desplazamiento automático.",
      "El cambio de vista mantiene el foco sobre la jornada activa siempre que esa jornada tenga partidos visibles en el filtro elegido.",
    ],
  },
  {
    version: "v1.3.1",
    date: "6 de agosto de 2026",
    title: "Tutoriales más directos y perfiles compactos",
    summary:
      "Las guías contextuales se centran en las acciones útiles de cada pantalla y los perfiles priorizan siempre la temporada más reciente sin ocupar espacio innecesario.",
    category: "improvement",
    changes: [
      "Inicio explica todos los controles flotantes disponibles para cada rol: notificaciones, invitaciones, acceso de espectadores, ayuda y ajustes.",
      "Partidos, Clasificación, Estadísticas y Administración de temporada eliminan la explicación repetida de la cabecera y comienzan directamente por sus funciones principales.",
      "Ajustes incorpora un tutorial específico que señala el buscador flotante de la esquina inferior derecha.",
      "Mi perfil y los perfiles de jugadores muestran siempre la información de la última temporada de la liga.",
      "Mientras la última temporada está activa o próxima, el selector histórico permanece oculto; cuando termina, aparece de forma compacta junto al nombre del jugador.",
    ],
  },
  {
    version: "v1.3.0",
    date: "6 de agosto de 2026",
    title: "Guías visuales y ayuda contextual",
    summary:
      "Cada usuario recibe tutoriales breves adaptados a su pantalla y rol, con progreso sincronizado entre dispositivos y acceso permanente desde la botonera flotante.",
    category: "new",
    changes: [
      "La botonera flotante superior incorpora un acceso de ayuda con un icono de interrogación para iniciar o repetir la guía de la pantalla actual.",
      "La primera versión incluye recorridos para introducción, Inicio, Partidos, Clasificación, Estadísticas y Administración de temporada.",
      "Las explicaciones resaltan visualmente cada elemento, permiten avanzar, retroceder, omitir o terminar y solo aparecen automáticamente la primera vez.",
      "Los recorridos se adaptan al rol: jugadores, espectadores y administradores solo ven funciones a las que realmente tienen acceso.",
      "El progreso se guarda por cuenta en Supabase y conserva un respaldo local para seguir funcionando ante una incidencia de red.",
      "La pantalla de Ayuda incorpora una biblioteca de tutoriales y una acción para volver a mostrar todas las guías.",
    ],
  },
  {
    version: "v1.2.14",
    date: "6 de agosto de 2026",
    title: "Calendario final simplificado",
    summary:
      "Las temporadas terminadas muestran una única exportación de calendario, con un nombre más claro y sin duplicar opciones equivalentes.",
    category: "improvement",
    changes: [
      "En Compartir resumen de temporada, una temporada terminada muestra un único panel llamado Calendario.",
      "El panel Calendario de enfrentamientos continúa disponible mientras la temporada está en curso, pero desaparece al finalizarla.",
      "La imagen, el texto al compartir y el nombre del archivo usan también la denominación Calendario cuando la temporada ha terminado.",
      "Clasificación y Resumen de temporada mantienen su funcionamiento actual.",
    ],
  },
  {
    version: "v1.2.13",
    date: "6 de agosto de 2026",
    title: "Accesos de temporada cerrada y preparación operativa",
    summary:
      "La pantalla principal facilita la consulta y el uso del resumen final, mientras el registro de cambios separa la información pública del detalle técnico de superadministración.",
    category: "improvement",
    changes: [
      "Las temporadas terminadas muestran en Inicio accesos directos a Historial y estadísticas y a Compartir resumen de temporada.",
      "El acceso de compartir abre directamente la sección correspondiente dentro del resumen de la temporada seleccionada.",
      "Registro de cambios continúa visible para todos con textos deliberadamente generales; el superadministrador conserva la vista técnica completa.",
      "Se añade observabilidad opcional para errores de servidor y cliente mediante un webhook seguro, con deduplicación y diagnóstico en la ruta de salud.",
      "Quedan preparados un ruleset de GitHub contra borrados y force-push, E2E autenticado de PRE, diagnóstico de Redis y backups cifrados programables de Supabase.",
      "Las integraciones externas permanecen desactivadas hasta configurar sus variables y secretos de forma explícita.",
    ],
  },
  {
    version: "v1.2.12",
    date: "6 de agosto de 2026",
    title: "Automatización de calidad y seguridad",
    summary:
      "La red de seguridad del repositorio incorpora pruebas reproducibles de base de datos, permisos, API y rendimiento antes de cada publicación.",
    category: "foundation",
    changes: [
      "Supabase local reconstruye todas las migraciones, ejecuta pgTAP, valida la actualización desde el esquema anterior y restaura un backup lógico en CI.",
      "Una política central y su matriz prueban acceso anónimo, suspendido, espectador, jugador, participante, administrador, creador y superusuario.",
      "Todas las rutas y métodos de API quedan inventariados; cualquier endpoint nuevo sin guarda reconocido hace fallar la validación.",
      "Se fijan presupuestos de complejidad, componentes cliente, JavaScript, assets y métricas Lighthouse para impedir regresiones silenciosas.",
      "GitHub Actions separa calidad, navegador, base de datos y rendimiento, conservando artefactos de diagnóstico cuando un gate falla.",
      "El rate limiting puede usar Redis REST compartido entre instancias y conserva un fallback en memoria; los logs añaden metadatos seguros de commit, despliegue y región.",
    ],
  },
  {
    version: "v1.2.11",
    date: "6 de agosto de 2026",
    title: "Valores iniciales consistentes en Notion Avatar",
    summary:
      "Todas las categorías del editor experimental Notion comienzan en su primer estilo para ofrecer una base neutra y predecible.",
    category: "fix",
    changes: [
      "Cara, nariz, boca, ojos, cejas, gafas, pelo, accesorios, detalles y barba se preseleccionan en Estilo 1.",
      "La acción Restablecer recupera también el Estilo 1 en todas las categorías.",
      "Se renueva la clave de almacenamiento local experimental para que la nueva selección inicial no quede oculta por recetas antiguas de PRE.",
      "No se modifican perfiles, permisos, APIs, Supabase ni datos de liga.",
    ],
  },
  {
    version: "v1.2.10",
    date: "6 de agosto de 2026",
    title: "Validación visual de la candidata de producción",
    summary:
      "La comprobación visual excluye correctamente la sección experimental completa y confirma que las dependencias de producción no presentan vulnerabilidades conocidas.",
    category: "fix",
    changes: [
      "El test visual de Ajustes oculta la sección completa de Avatar Lab en lugar de dejar una tarjeta experimental vacía.",
      "Las capturas de referencia existentes se conservan: no se aprueba ni se oculta ninguna regresión visual real.",
      "La auditoría npm de dependencias de producción finaliza con cero vulnerabilidades altas o críticas.",
      "Se mantiene el aislamiento funcional y de API de Avatar Lab exclusivamente en PRE y desarrollo local.",
    ],
  },
  {
    version: "v1.2.9",
    date: "6 de agosto de 2026",
    title: "Endurecimiento previo a producción",
    summary:
      "La candidata de publicación aísla completamente Avatar Lab en PRE, reduce el peso de las imágenes globales y añade controles de lanzamiento.",
    category: "fix",
    changes: [
      "Avatar Lab queda oculto en Ajustes y en su buscador fuera de PRE; sus páginas y API devuelven 404 en producción.",
      "Los renderizadores experimentales exigen sesión, aplican límites de solicitudes y evitan cachés públicas.",
      "El dominio oficial prevalece ante una variable de entorno contradictoria para impedir activar funciones PRE en producción.",
      "Las nuevas imágenes de perfil se generan a 256 × 256, se limitan a 160 KB y conservan compatibilidad de lectura con imágenes anteriores.",
      "El snapshot inicial informa su tamaño y registra una alerta estructurada cuando supera 1 MB.",
      "La validación incorpora comprobaciones específicas de avatares, migraciones de identidad, E2E y auditoría de dependencias para la publicación.",
      "Se añade una auditoría SQL de solo lectura y un checklist específico para promover la versión desde PRE a PROD.",
    ],
  },
  {
    version: "v1.2.8",
    date: "5 de agosto de 2026",
    title: "Editor Notion compacto y siempre visible",
    summary:
      "La edición de Notion Avatar se concentra en una sola vista móvil para cambiar categorías y estilos sin perder la previsualización.",
    category: "improvement",
    changes: [
      "La previsualización ocupa el espacio flexible de la pantalla y permanece visible junto a los controles principales en la vista móvil.",
      "Se eliminan los presets, la forma y el fondo: Notion Avatar utiliza siempre un lienzo rectangular blanco.",
      "La categoría se cambia mediante flechas o tocando su nombre para abrir el selector nativo del dispositivo.",
      "Los estilos se recorren con botones anterior y siguiente de mayor tamaño, mostrando claramente la posición dentro de cada categoría.",
      "La receta continúa guardándose solo en el navegador y no se aplica al perfil ni escribe en Supabase.",
    ],
  },
  {
    version: "v1.2.7",
    date: "5 de agosto de 2026",
    title: "Validación limpia del laboratorio de avatares",
    summary:
      "Se eliminan referencias generadas a rutas descartadas y se adapta el renderer Notion al objetivo TypeScript del proyecto.",
    category: "fix",
    changes: [
      "La validación elimina la caché .next y el estado incremental de TypeScript antes de comprobar tipos, evitando referencias obsoletas a Pacovqzz y Ready Player Me.",
      "El endpoint de Notion deja de utilizar el flag dotAll y mantiene el mismo tratamiento multilínea con una expresión compatible con ES2017.",
      "Se conservan únicamente DiceBear Big Smile y Notion Avatar, sin integración con perfiles ni escrituras en Supabase.",
      "No se requieren migraciones de Supabase ni cambios en datos persistidos.",
    ],
  },
  {
    version: "v1.2.6",
    date: "5 de agosto de 2026",
    title: "Compatibilidad del laboratorio con las reglas de React",
    summary:
      "Se corrige la gestión del estado local y de las vistas previas para completar la validación del laboratorio de avatares en PRE.",
    category: "fix",
    changes: [
      "Big Smile y Notion Avatar cargan las recetas locales mediante tareas cancelables sin actualizaciones síncronas dentro de efectos.",
      "El estado de carga de cada vista previa se deriva de la URL o receta que está realmente renderizándose, evitando renders encadenados.",
      "El paginado de Notion se reinicia desde la acción de cambio de categoría en lugar de usar un efecto adicional.",
      "Se mantiene el alcance experimental: los avatares siguen sin aplicarse al perfil ni escribirse en Supabase.",
      "No se requieren migraciones de Supabase ni cambios en datos persistidos.",
    ],
  },
  {
    version: "v1.2.5",
    date: "5 de agosto de 2026",
    title: "Publicación segura del laboratorio de avatares",
    summary:
      "Se corrige la validación de dependencias de desarrollo para publicar en PRE el laboratorio móvil de Big Smile y Notion Avatar.",
    category: "fix",
    changes: [
      "La línea base reconoce únicamente las copias heredadas de brace-expansion alojadas en rutas concretas de plugins de ESLint.",
      "Las excepciones siguen limitadas a dependencias de desarrollo y la copia principal mantiene la versión segura exigida.",
      "El laboratorio conserva solo DiceBear Big Smile y Notion Avatar, sin integración todavía con el perfil del usuario.",
      "La versión se incrementa antes de reanudar la validación completa y la publicación exclusiva en PRE.",
      "No se requieren migraciones de Supabase ni cambios en datos persistidos.",
    ],
  },
  {
    version: "v1.2.4",
    date: "5 de agosto de 2026",
    title: "Laboratorio de avatares en PRE",
    summary:
      "Ajustes incorpora un laboratorio móvil para comparar DiceBear Big Smile y Notion Avatar sin modificar todavía el perfil del usuario.",
    category: "new",
    changes: [
      "Se añade un acceso experimental desde Ajustes a una portada con los dos editores de avatar que siguen siendo viables.",
      "DiceBear Big Smile y Notion Avatar comparten una interfaz móvil coherente con el diseño de Smash & Lob.",
      "Ready Player Me y Pacovqzz se retiran junto con sus rutas, dependencias, recursos y pruebas experimentales.",
      "Las recetas de prueba se guardan únicamente en el navegador y no escriben en Supabase ni cambian la imagen de perfil.",
      "La ruta completa permanece limitada a PRE, requiere la sesión normal de la aplicación y no se indexa.",
      "No se requieren migraciones de Supabase ni cambios en datos persistidos.",
    ],
  },
  {
    version: "v1.2.3",
    date: "3 de agosto de 2026",
    title: "Editor de imagen accesible en móvil",
    summary:
      "El recorte de la imagen global se muestra centrado, por encima de la navegación y con la confirmación siempre disponible.",
    category: "fix",
    changes: [
      "El editor de recorte se renderiza directamente sobre la página para evitar que la navegación inferior quede por encima.",
      "El panel queda centrado en el viewport y respeta las zonas seguras superior e inferior del dispositivo.",
      "El marco de recorte adapta su tamaño al ancho y alto disponibles sin alterar el resultado final de 512 × 512.",
      "Los controles de Cancelar y Usar imagen permanecen visibles aunque el contenido del editor necesite desplazamiento.",
      "No se requieren migraciones de Supabase ni cambios en los datos guardados.",
    ],
  },
  {
    version: "v1.2.2",
    date: "3 de agosto de 2026",
    title: "Imagen global e identidad histórica corregidas",
    summary:
      "La imagen vuelve a pertenecer a la cuenta completa, se retira el avatar específico por liga de PRE y la desvinculación conserva únicamente la identidad histórica correcta.",
    category: "fix",
    changes: [
      "La imagen de perfil es global: una imagen subida o la imagen de Google se utiliza en todas las ligas vinculadas a la cuenta.",
      "Se elimina de Ajustes, las API y la resolución visual la imagen específica por liga introducida en la candidata v1.2.1.",
      "La prioridad visual queda preparada como imagen global de cuenta y, cuando no existe, avatar predeterminado con iniciales.",
      "Al vincular una cuenta se guardan el nombre y las iniciales históricas del jugador, sin guardar fotografías dentro de la instantánea.",
      "Al desvincular una cuenta se restauran el nombre y las iniciales históricas, se elimina cualquier imagen de la cuenta desvinculada y vuelve el avatar predeterminado.",
      "Una migración de corrección elimina league_avatar_url de PRE y limpia las instantáneas de identidad creadas con el modelo descartado.",
      "El futuro editor de avatares queda separado de esta versión y será global para cada usuario, no para cada liga.",
    ],
  },
  {
    version: "v1.1.0",
    date: "3 de agosto de 2026",
    title: "Acceso, seguridad y PWA más fiables",
    summary:
      "Smash & Lob refuerza la estabilidad del acceso, la protección entre ligas, las notificaciones y la aplicación instalada, manteniendo el diseño y los flujos habituales.",
    category: "improvement",
    changes: [
      "El acceso con Google conserva el enlace exacto de invitación y ofrece errores más claros con un código de incidencia.",
      "Se refuerzan los permisos y el aislamiento entre ligas, junto con validadores y límites para operaciones sensibles.",
      "Las exportaciones Excel y CSV neutralizan contenido que una hoja de cálculo podría interpretar como fórmula.",
      "La aplicación instalada detecta versiones nuevas, permite actualizarlas de forma controlada y ofrece una pantalla segura sin conexión.",
      "La baja de notificaciones elimina correctamente la suscripción guardada y limpia endpoints caducados sin afectar a los errores temporales.",
      "Se corrigen problemas de accesibilidad y se pospone la carga del generador Excel hasta que realmente se necesita.",
      "La versión incorpora una cobertura automática ampliada para autenticación, permisos, PWA, notificaciones, accesibilidad y regresiones visuales.",
      "Una migración revoca códigos de invitación antiguos que seguían activos y conserva únicamente el código vigente de cada liga.",
    ],
  },
  {
    version: "v1.0.0",
    date: "2 de agosto de 2026",
    title: "Primera versión estable de Smash & Lob",
    summary:
      "Smash & Lob cierra su etapa de preparación y publica una primera versión estable para gestionar ligas privadas de pádel con temporadas, partidos, clasificación, estadísticas, invitaciones y exportaciones.",
    category: "foundation",
    changes: [
      "La aplicación adopta oficialmente la versión v1.0.0 como primera edición estable para uso real en ligas privadas.",
      "La pantalla Ajustes elimina los accesos duplicados a Política de privacidad y Condiciones de uso, que continúan disponibles dentro de Sobre Smash & Lob.",
      "La etiqueta Beta cerrada desaparece de Ajustes y se sustituye por Smash & Lob junto a la versión instalada.",
      "La publicación conserva la resolución canónica de enlaces con smashandlob.com en producción y pre.smashandlob.com en PRE.",
      "El lanzamiento integra todos los cambios validados de la serie v0.19, incluida la identidad histórica, las imágenes compartibles, los exports Excel y CSV y la programación retroactiva para administración.",
      "No se requieren migraciones de Supabase ni cambios de datos persistidos para esta versión.",
    ],
  },
  {
    version: "v0.19.11",
    date: "2 de agosto de 2026",
    title: "Cierre técnico previo a v1.0",
    summary:
      "Smash & Lob unifica sus enlaces públicos con los dominios definitivos, refuerza las comprobaciones previas a publicación y reorganiza el registro de cambios por series para preparar las pruebas finales de la versión 1.0.",
    category: "foundation",
    changes: [
      "Los enlaces de invitación de jugadores utilizan siempre https://smashandlob.com en producción y https://pre.smashandlob.com en PRE, aunque una variable antigua todavía contenga una URL de Vercel.",
      "Los enlaces de espectador usan la misma resolución canónica y toman el entorno real de la petición para evitar cruces entre producción y preproducción.",
      "La URL pública se centraliza en un único módulo compartido por invitaciones, espectadores, identificación del entorno y metadatos de la aplicación.",
      "La base de metadatos se adapta al entorno para que las páginas de PRE no publiquen referencias canónicas de producción y viceversa.",
      "Se añade una comprobación automática que impide validar el proyecto si reaparece un dominio .vercel.app en los archivos de ejecución.",
      "El Registro de cambios pasa a mostrar un panel por serie, como v0.19 o v0.18, y conserva dentro el detalle de todas sus versiones de parche.",
      "Se incorpora una lista de pruebas de aceptación para cerrar la serie 0.19 antes de etiquetar y publicar la v1.0.0.",
      "No se requieren migraciones de Supabase ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.19.10",
    date: "31 de julio de 2026",
    title: "Compartir el resumen final y publicación completa",
    summary:
      "El resumen final de temporada incorpora la misma acción de compartir que el resto de imágenes y la serie 0.19 queda preparada para publicarse completa en producción.",
    category: "improvement",
    changes: [
      "La tarjeta Resumen de temporada muestra ahora un botón Compartir junto al botón de descarga cuando la temporada está terminada.",
      "La acción utiliza el sistema nativo de compartir archivos cuando está disponible y descarga la imagen como alternativa en dispositivos no compatibles.",
      "El texto compartido identifica correctamente la imagen como resumen final de temporada.",
      "No se requieren nuevas migraciones de Supabase para esta versión.",
    ],
  },
  {
    version: "v0.19.9",
    date: "30 de julio de 2026",
    title: "Programación retroactiva para administración",
    summary:
      "Las personas con rol creator o admin pueden añadir o corregir la fecha y el lugar de un partido aunque ya tenga resultado o pertenezca a una temporada cerrada.",
    category: "improvement",
    changes: [
      "La ficha de un partido finalizado vuelve a mostrar el panel de programación a creator y admin incluso cuando todavía no tiene fecha registrada.",
      "Los participantes normales mantienen el comportamiento anterior y no pueden modificar la programación después de finalizar el partido.",
      "Al guardar una programación retroactiva se conservan el estado Finalizado, el marcador, los sets y el resto de datos del resultado.",
      "En partidos finalizados no se precarga una fecha futura ni se muestran sugerencias de disponibilidad, de modo que la administración introduce manualmente la fecha real jugada.",
      "La API aplica la misma autorización en servidor para evitar que un jugador pueda saltarse la restricción desde el cliente.",
      "No se requieren migraciones de Supabase ni cambios de estructura de datos.",
    ],
  },
  {
    version: "v0.19.8",
    date: "30 de julio de 2026",
    title: "Nueva pantalla de exportación de datos",
    summary:
      "La zona administrativa de exportaciones se rehace por completo para guardar y trabajar con los datos de cada temporada mediante un libro Excel completo o archivos CSV separados.",
    category: "improvement",
    changes: [
      "La pantalla Exportar datos incorpora una cabecera renovada, selector de temporada y un resumen inmediato de jugadores, partidos y encuentros finalizados.",
      "Se añade la descarga de un libro Excel .xlsx real con dos hojas: Clasificación y Resultados.",
      "El archivo Excel incluye cabeceras destacadas, columnas dimensionadas, filtros y la primera fila inmovilizada para trabajar más cómodamente con los datos.",
      "Las descargas CSV de Clasificación y Resultados se mantienen como alternativas independientes para importar cada tabla en otras herramientas.",
      "La generación del archivo .xlsx se realiza en el navegador sin añadir dependencias nuevas ni enviar datos fuera del dispositivo.",
      "No se requieren migraciones de Supabase ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.19.7",
    date: "30 de julio de 2026",
    title: "Nombres históricos correctos en las imágenes de clasificación",
    summary:
      "La clasificación exportada vuelve a resolver los nombres y avatares reales de jugadores de temporadas anteriores aunque después se haya creado una temporada nueva con una plantilla diferente.",
    category: "fix",
    changes: [
      "Antes de generar las imágenes se reconcilian las filas de la clasificación con los perfiles completos de jugadores de la liga mediante su identificador estable.",
      "Los nombres genéricos como Jugador se sustituyen por el nombre histórico real cuando el perfil correspondiente sigue disponible.",
      "La misma resolución se aplica al podio y al resumen final para evitar inconsistencias entre las distintas imágenes compartibles.",
      "Se conservan correctamente avatar, iniciales, slug y vinculación de usuario del perfil real.",
      "No se requieren migraciones de Supabase ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.19.6",
    date: "30 de julio de 2026",
    title: "Resumen final sin vista previa",
    summary:
      "La pantalla de compartir temporada elimina la previsualización completa del resumen final y lo integra como una descarga adicional cuando la temporada ha terminado.",
    category: "improvement",
    changes: [
      "Se elimina de la pantalla la vista previa del resumen de temporada con campeón, MVP, podio y momentos destacados.",
      "Cuando la temporada está terminada aparece una cuarta opción, Descargar Resumen de Temporada, junto al calendario actual, calendario de enfrentamientos y clasificación.",
      "La descarga genera directamente la misma imagen final del resumen sin renderizar previamente su contenido dentro de la app.",
      "Las opciones comunes de logo de liga e imágenes de perfil también se aplican al resumen final descargado.",
      "Si la temporada está terminada pero tiene datos incompletos, la opción permanece visible y explica por qué todavía no puede generar la imagen.",
      "No se requieren migraciones de Supabase ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.19.5",
    date: "30 de julio de 2026",
    title: "Imágenes compartibles reunidas en el resumen de temporada",
    summary:
      "El calendario actual, el calendario limpio de enfrentamientos y la clasificación pasan a estar disponibles en la pantalla de compartir temporada durante toda la competición, mientras la zona administrativa vuelve a centrarse en los datos CSV.",
    category: "improvement",
    changes: [
      "La pantalla Compartir resumen de temporada muestra siempre las imágenes de Calendario actual, Calendario de enfrentamientos y Clasificación, aunque la temporada todavía esté en curso.",
      "El Calendario actual conserva estados, fechas, ubicaciones, marcadores y sets; el Calendario de enfrentamientos muestra exclusivamente las parejas y el VS de cada jornada.",
      "Las tres imágenes pueden compartirse directamente o guardarse en el dispositivo y comparten las opciones de logo de liga e imágenes de perfil.",
      "El resumen final de campeón, MVP, podio y destacados continúa apareciendo únicamente cuando la temporada está terminada y sus datos son válidos.",
      "La pantalla administrativa Exportar datos vuelve a ofrecer únicamente clasificación y resultados en CSV compatible con Excel, Google Sheets y LibreOffice.",
      "Se eliminan los avisos de ESLint por variables y funciones sin uso en el generador de imágenes de temporada.",
      "No se requieren migraciones de Supabase ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.19.4",
    date: "30 de julio de 2026",
    title: "Recorte extra del calendario y barra completa del podio",
    summary:
      "Se reduce todavía más el espacio vacío en el calendario exportado y se corrige la barra lateral del podio para que recorra todo el panel respetando las esquinas redondeadas.",
    category: "improvement",
    changes: [
      "Las tarjetas del calendario se compactan aún más para recortar espacio vacío sobrante debajo del contenido de cada partido y reducir de nuevo la altura total de la imagen.",
      "El bloque de cada jornada también disminuye el margen inferior entre filas para que el calendario resulte más denso y limpio.",
      "La barra lateral de color del podio en la clasificación pasa a recorrer todo el alto del panel y queda recortada siguiendo las esquinas redondeadas superior e inferior.",
      "No se requieren migraciones de Supabase ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.19.3",
    date: "30 de julio de 2026",
    title: "Compactación del calendario y podio más apaisado",
    summary:
      "Se compacta la imagen del calendario para reducir hueco sobrante por jornada y se reajusta el podio de la clasificación para mostrar mejor los nombres completos.",
    category: "improvement",
    changes: [
      "Las tarjetas del calendario de temporada reducen su altura y el espaciado inferior de cada jornada para aprovechar mejor el lienzo y disminuir la altura final de la imagen.",
      "El podio de la clasificación adopta un formato más alargado horizontalmente y menos cuadrado, con menor altura visual.",
      "Se reduce ligeramente la tipografía del nombre en el podio y se gana espacio útil para mostrar mejor nombre y apellido.",
      "Se reajustan avatar, marcador de puesto y estadísticas del podio para acompañar el nuevo formato más apaisado.",
      "No se requieren migraciones de Supabase ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.19.2",
    date: "30 de julio de 2026",
    title: "Ajuste fino de alineación en exports de temporada",
    summary:
      "Se corrige la alineación vertical de los textos dentro de las imágenes exportadas de calendario y clasificación para que etiquetas, avatares, podio y filas queden correctamente centrados.",
    category: "improvement",
    changes: [
      "Se recolocan hacia arriba y se centran correctamente los textos internos de las tarjetas de partido, incluidas las etiquetas de estado como Finalizado o Programado.",
      "El podio de la clasificación ajusta mejor el número de puesto, el nombre del jugador y los bloques de estadísticas para evitar que queden desplazados hacia abajo.",
      "Las filas de la tabla de clasificación alinean mejor posición, avatar, nombre y cifras para que queden a la misma altura visual.",
      "Los avatares con iniciales y la marca genérica de Smash & Lob se centran mejor dentro de sus contenedores.",
      "No se requieren migraciones de Supabase ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.19.1",
    date: "30 de julio de 2026",
    title: "Rediseño de exportaciones y cabeceras unificadas",
    summary:
      "Las exportaciones de calendario y clasificación adoptan una presentación más cuidada tanto en la app como en las imágenes PNG, con una identidad visual homogénea y mejor tratamiento de logotipos y avatares.",
    category: "improvement",
    changes: [
      "La pantalla de Compartir temporada abandona las cabeceras negras y adopta tarjetas más limpias, con mejor jerarquía visual y opciones de apariencia comunes.",
      "Las exportaciones de calendario y clasificación comparten ahora una cabecera y un pie de imagen alineados con el estilo del resumen final de temporada.",
      "La cabecera muestra el logo de la liga a la derecha, en grande y respetando la transparencia del PNG cuando existe.",
      "Se añade en la app la opción de incluir o no el logo de la liga y las imágenes de perfil en las imágenes exportadas.",
      "Cada partido del calendario exportado presenta las dos parejas a izquierda y derecha, con el VS o el resultado en el centro y los sets debajo cuando están disponibles.",
      "La clasificación exportada utiliza correctamente los avatares de los jugadores y, cuando faltan, muestra un icono genérico de perfil en lugar de dejar huecos inconsistentes.",
      "No se requieren migraciones de Supabase ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.19.0",
    date: "30 de julio de 2026",
    title: "Identidad histórica, exportaciones visuales e instalación anticipada",
    summary:
      "La nueva etapa de Smash & Lob permite que quienes se incorporan mediante autoinscripción recuperen su jugador de temporadas importadas, renueva las imágenes de calendario y clasificación y ofrece instalar la PWA antes de completar el acceso.",
    category: "new",
    changes: [
      "En las ligas con autoinscripción, una persona puede indicar qué jugador fue en una temporada anterior ya finalizada antes de ocupar su plaza en la nueva temporada.",
      "La vinculación reutiliza el mismo jugador en el histórico y en las temporadas futuras, de modo que partidos, clasificación y estadísticas anteriores pasan a mostrar el nombre y avatar actuales de la cuenta.",
      "Los jugadores históricos ya vinculados, reclamados por otra cuenta o presentes en la temporada actual dejan de estar disponibles para evitar identidades duplicadas.",
      "La exportación de calendario genera una imagen PNG vertical con cabecera de liga, jornadas, parejas, estado, fecha, ubicación, marcador y sets.",
      "La exportación de clasificación genera una imagen PNG con podio y tabla completa, manteniendo además los CSV de resultados y clasificación.",
      "El aviso de instalación de la PWA se monta desde el acceso inicial y también acompaña los enlaces de invitación antes del inicio de sesión y de la incorporación a la liga.",
      "Se añade una migración de Supabase para realizar la vinculación histórica y la autoinscripción en una única operación transaccional del servidor.",
    ],
  },
  {
    version: "v0.18.4",
    date: "30 de julio de 2026",
    title: "Actualización controlada de dependencias de producción",
    summary:
      "Smash & Lob incorpora las actualizaciones propuestas por Dependabot para Supabase y React después de validarlas dentro del flujo habitual de desarrollo, PRE y producción.",
    category: "foundation",
    changes: [
      "Se actualiza `@supabase/supabase-js` de 2.108.2 a 2.111.0.",
      "Se actualizan `react` y `react-dom` de 19.2.4 a 19.2.8.",
      "Las dependencias se incorporan desde la propuesta automática de Dependabot, pero se publican mediante la rama de desarrollo y las validaciones completas del proyecto.",
      "No se modifican las dependencias de desarrollo incluidas en la otra propuesta de Dependabot.",
      "No se requieren migraciones de Supabase ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.18.3",
    date: "30 de julio de 2026",
    title: "Diagnóstico de acceso limitado a los logs internos",
    summary:
      "La API vuelve a responder con un error genérico cuando no puede cargar las ligas, mientras conserva en los logs privados del servidor la etapa y el detalle técnico necesarios para futuras investigaciones.",
    category: "fix",
    changes: [
      "La respuesta pública de `/api/access` vuelve a limitarse a `league_snapshot_failed`, sin exponer la etapa ni el código técnico de Supabase.",
      "Los logs privados de Vercel mantienen la etapa de la consulta y el código, mensaje, detalle y sugerencia originales de Supabase.",
      "Se conserva la capacidad de diagnóstico introducida en la versión anterior sin añadir información técnica a la respuesta que recibe el navegador.",
      "No se modifica la lógica de sesiones, permisos, ligas ni datos persistidos.",
      "No se requieren nuevas migraciones de Supabase.",
    ],
  },
  {
    version: "v0.18.2",
    date: "30 de julio de 2026",
    title: "Diagnóstico seguro del fallo de carga de ligas",
    summary:
      "La API de acceso identifica qué consulta del resumen de liga está fallando y registra en el servidor el detalle técnico necesario para resolver el error sin exponer información sensible al usuario.",
    category: "fix",
    changes: [
      "La respuesta `league_snapshot_failed` incorpora una etapa segura (`stage`) que permite distinguir si falla la consulta de ligas, temporadas, jugadores, ajustes, partidos, sustituciones o membresías.",
      "Cuando Supabase devuelve un código de error, la API lo incluye de forma limitada en la respuesta para acelerar el diagnóstico sin publicar mensajes internos ni credenciales.",
      "Vercel registra el código, mensaje, detalle y sugerencia originales de Supabase únicamente en los logs del servidor.",
      "No se modifica la lógica de permisos, sesiones, ligas ni datos persistidos; esta versión sirve para localizar con precisión el fallo actual antes de aplicar una corrección funcional.",
      "No se requieren migraciones de Supabase.",
    ],
  },
  {
    version: "v0.18.1",
    date: "30 de julio de 2026",
    title: "Información pública, privacidad y condiciones de uso",
    summary:
      "Smash & Lob incorpora páginas públicas para describir la aplicación y documentar el uso de datos y las condiciones del servicio antes de completar la configuración del dominio y Google OAuth.",
    category: "foundation",
    changes: [
      "Se añaden las rutas públicas `/about`, `/privacy` y `/terms`, accesibles sin iniciar sesión ni pertenecer a una liga.",
      "La página pública describe las funciones principales de Smash & Lob y enlaza directamente la política de privacidad y las condiciones de uso.",
      "La política de privacidad documenta los datos básicos recibidos de Google, los datos gestionados en las ligas, las finalidades, proveedores, conservación y derechos.",
      "Las condiciones aclaran el carácter privado y no comercial del servicio, las responsabilidades de administradores y participantes y el alcance de los registros de resultados y pagos.",
      "La pantalla de acceso y Ajustes incorporan enlaces a la información pública y los nuevos documentos legales.",
      "Las nuevas opciones se integran en la búsqueda global de Ajustes en español, inglés y euskera.",
      "El layout separa las rutas públicas del árbol autenticado para evitar llamadas privadas y bloqueos de acceso en las páginas requeridas por Google OAuth.",
      "Se configura `https://smashandlob.com` como base de metadatos y se añaden URLs canónicas para las páginas públicas.",
      "Las páginas legales pueden publicar responsable y correo de contacto mediante `NEXT_PUBLIC_LEGAL_RESPONSIBLE_NAME` y `NEXT_PUBLIC_LEGAL_CONTACT_EMAIL` sin fijar datos personales en el repositorio.",
      "Se documenta la configuración final de dominios, Google OAuth y variables de Vercel para producción y PRE.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.18.0",
    date: "30 de julio de 2026",
    title: "Primera línea base automática de seguridad",
    summary:
      "La serie v0.18 comienza con controles reproducibles sobre las dependencias sensibles, validación unificada del proyecto y revisión automática semanal de actualizaciones.",
    category: "foundation",
    changes: [
      "Se añade `npm run security:check` para comprobar en el lockfile las versiones resueltas de next-auth, @auth/core y brace-expansion.",
      "La comprobación impide regresar a versiones de autenticación anteriores a next-auth 5.0.0-beta.32 o @auth/core 0.41.3.",
      "La copia principal de brace-expansion debe mantenerse en 5.0.8 o superior, mientras las copias heredadas 1.1.16 solo se permiten bajo las herramientas actuales de lint.",
      "Se añade `npm run validate` para encadenar seguridad, lint, TypeScript y build con una única orden.",
      "Dependabot revisará semanalmente las dependencias npm y separará las propuestas de producción y desarrollo.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.55",
    date: "29 de julio de 2026",
    title: "Icono y nombre más altos en el panel principal exportado",
    summary:
      "La imagen exportada aprovecha mejor el espacio liberado por la eliminación del subtítulo: agranda el icono principal y recoloca algo más arriba el nombre del campeón, MVP o campeón+MVP.",
    category: "improvement",
    changes: [
      "En la imagen exportada, el icono principal del panel de campeón/MVP aumenta de tamaño para aprovechar mejor la zona superior disponible.",
      "El icono se expande visualmente hacia arriba dentro del panel, respetando el margen izquierdo manual ya ajustado en iteraciones anteriores.",
      "El nombre del campeón, MVP o campeón+MVP se desplaza un poco más arriba para quedar mejor centrado en altura en el espacio útil restante.",
      "La preview de la app no cambia en esta iteración, ya que el ajuste solicitado afecta solo a la imagen generada/exportada.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.54",
    date: "29 de julio de 2026",
    title: "Ajuste final de altura en el panel principal exportado",
    summary:
      "La imagen exportada reajusta ligeramente hacia arriba el nombre del campeón, MVP o campeón+MVP para centrarlo mejor en altura dentro del panel principal.",
    category: "improvement",
    changes: [
      "En la imagen exportada se desplaza un poco hacia arriba el bloque del nombre dentro del panel principal de campeón/MVP.",
      "El nombre queda mejor centrado verticalmente en el espacio útil disponible entre el icono principal y la fila de estadísticas.",
      "No se modifica la preview de la app en esta iteración, ya que el ajuste pedido es solo para la imagen generada/exportada.",
      "El resto del diseño del resumen final permanece igual respecto a la versión anterior.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.53",
    date: "29 de julio de 2026",
    title: "Panel principal exportado con nombre alineado al icono",
    summary:
      "La imagen exportada simplifica el panel de ganador/MVP: elimina el subtítulo del panel y alinea el nombre a la izquierda, pegado visualmente al icono principal.",
    category: "improvement",
    changes: [
      "En la imagen exportada, el nombre del ganador, MVP o ganador+MVP se alinea a la izquierda dentro del panel principal, junto al icono correspondiente.",
      "Se elimina del panel principal exportado el subtítulo CAMPEÓN / MVP / CAMPEÓN Y MVP, dejando que el icono identifique el tipo de reconocimiento por sí solo.",
      "La composición del nombre se reajusta verticalmente para aprovechar mejor el espacio liberado por la eliminación del subtítulo.",
      "La preview de la app no cambia en esta iteración, porque el ajuste solicitado afecta solo a la imagen generada / exportada.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.52",
    date: "29 de julio de 2026",
    title: "Resumen sin MVP cuando está desactivado",
    summary:
      "Las temporadas configuradas sin sistema MVP dejan de mostrar cualquier panel de MVP en la vista previa y en la imagen exportada, y se elimina el warning restante del pie generado.",
    category: "fix",
    changes: [
      "La pantalla de compartir resumen consulta explícitamente la configuración MVP de la temporada seleccionada antes de construir los paneles principales.",
      "Cuando el sistema MVP está configurado como 'none', el resumen genera únicamente el panel de campeón o campeones, sin mostrar un panel vacío ni el texto 'Sin MVP calculado'.",
      "La misma colección de paneles alimenta la preview y la exportación, por lo que la ausencia de MVP queda garantizada en ambos formatos.",
      "Se elimina la constante `height` que había quedado sin uso en la firma inferior de `seasonSummaryImage.ts`, corrigiendo el warning de ESLint.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.51",
    date: "29 de julio de 2026",
    title: "Acceso más claro al resumen compartible",
    summary:
      "La navegación de Estadísticas y la pantalla del resumen final explican ahora de forma más directa que esta función sirve para generar, descargar y compartir el resumen de una temporada.",
    category: "improvement",
    changes: [
      "El acceso desde Estadísticas pasa a llamarse 'Compartir resumen de temporada' en lugar de 'Resumen de temporada'.",
      "La descripción del acceso aclara que permite generar, descargar o compartir el resumen final y consultar el historial de campeones.",
      "La pantalla de una temporada adopta también el título 'Compartir resumen de temporada' y una descripción centrada en la acción real disponible.",
      "La sección que contiene la imagen dentro de la pantalla pasa a llamarse 'Vista previa del resumen' para distinguirla del título general de la página.",
      "La vista histórica de todas las temporadas mantiene el nombre 'Resumen de la liga', ya que no genera una única imagen compartible.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.50",
    date: "29 de julio de 2026",
    title: "Ajuste fino del logo de cabecera y firma final",
    summary:
      "El logo de la liga recupera un pequeño margen vertical en la cabecera y la firma final 'Creado con Smash & Lob' deja de mostrarse dentro de un panel para integrarse como una firma centrada al pie, tanto en la preview como en la imagen exportada.",
    category: "improvement",
    changes: [
      "La preview de la app añade un pequeño margen superior e inferior al logo de la liga en la cabecera, manteniendo un tamaño grande pero algo más equilibrado.",
      "La imagen exportada hace lo mismo, reduciendo ligeramente el crecimiento vertical del logo con un margen extra arriba y abajo para que respire mejor dentro del panel.",
      "La firma final de la preview deja de ir dentro de un panel y pasa a mostrarse centrada y suelta, conservando el icono de la app y el texto 'Creado con Smash & Lob'.",
      "La imagen exportada reconvierte también el bloque inferior en una firma centrada sin tarjeta, manteniendo la identidad visual pero evitando el panel adicional al final de la composición.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.49",
    date: "29 de julio de 2026",
    title: "Separación extra del panel principal exportado",
    summary:
      "La imagen exportada desplaza manualmente hacia la derecha el contenido de los paneles de campeón/MVP para separarlo claramente de la barra lateral, y además queda resuelto el warning por parámetro no usado en la cabecera.",
    category: "fix",
    changes: [
      "Los paneles de campeón, MVP y campeón+MVP de la imagen exportada aumentan manualmente su margen izquierdo útil para evitar que el contenido se acerque o monte sobre la barra negra lateral.",
      "El icono principal sigue alineado a la izquierda, pero ahora arranca desde una referencia más separada de la barra negra, con mejor respiración visual.",
      "Las estadísticas del panel principal mantienen el ancho útil completo del panel, desplazadas con el mismo nuevo margen izquierdo para conservar coherencia visual.",
      "Se elimina el parámetro no usado `appIcon` de la cabecera exportada, dejando corregido el warning de ESLint en `src/lib/seasonSummaryImage.ts`.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.48",
    date: "29 de julio de 2026",
    title: "Logo de liga a altura completa en exportación",
    summary:
      "La imagen exportada lleva el logo de la liga a prácticamente toda la altura útil de la cabecera, igualando mejor el comportamiento de la preview de la app, y además elimina el warning por variable no usada en la generación del resumen.",
    category: "fix",
    changes: [
      "El logo de la liga en la imagen exportada pasa a calcular su tamaño a partir de toda la altura útil disponible del panel superior, manteniendo la proporción real del recurso.",
      "La cabecera exportada reserva al logo un bloque más alto y elimina la limitación anterior que impedía que creciera tanto como en la preview de la app.",
      "Se elimina el parámetro no utilizado `appIcon` del renderizado de cabecera en `seasonSummaryImage.ts`, corrigiendo el warning de ESLint por variable definida y no usada.",
      "La preview de la app no cambia en esta iteración porque ya mostraba el comportamiento esperado para el logo de la liga.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.47",
    date: "29 de julio de 2026",
    title: "Corrección del ancho útil en el panel principal exportado",
    summary:
      "El panel de ganador/MVP en la imagen exportada vuelve a ocupar todo el ancho útil entre la barra lateral y el borde derecho, manteniendo el icono alineado a la izquierda como en la preview de la app.",
    category: "fix",
    changes: [
      "La imagen exportada elimina la restricción que estaba encogiendo el bloque principal del panel de ganador/MVP y lo devuelve al ancho completo del área útil del panel.",
      "El icono de corona, estrella o combinado permanece alineado a la izquierda junto a la barra negra, mientras el contenido textual se centra dentro del espacio restante hasta el borde derecho.",
      "Las métricas del panel principal vuelven a usar todo el ancho disponible entre la barra lateral y el borde derecho del panel, siguiendo el mismo criterio visual que la preview de la app.",
      "La preview de la app no cambia en esta iteración porque ya tenía el comportamiento esperado.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.46",
    date: "29 de julio de 2026",
    title: "Logo de liga a toda altura en la cabecera",
    summary:
      "El logo de la liga en la cabecera del resumen final crece para ocupar prácticamente toda la altura útil del panel, tanto en la preview de la app como en la imagen exportada.",
    category: "improvement",
    changes: [
      "La preview de la app hace que el logo de la liga se estire en altura dentro de la cabecera, manteniendo su proporción y respetando la transparencia del archivo.",
      "La imagen exportada calcula el tamaño del logo según la altura útil del panel y su proporción real, para que llene mejor el espacio vertical disponible.",
      "El ancho del logo se adapta al propio recurso gráfico, evitando deformaciones y manteniendo márgenes limpios en la cabecera.",
      "El resto de la composición del panel superior y del resumen final se mantiene sin cambios funcionales en esta iteración.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.45",
    date: "29 de julio de 2026",
    title: "Reequilibrado del panel campeón/MVP",
    summary:
      "Los paneles de campeón, MVP y campeón+MVP se rehacen para que el bloque útil quede realmente centrado entre la barra lateral y el borde derecho, manteniendo el icono alineado a la izquierda.",
    category: "fix",
    changes: [
      "La preview de la app centra el bloque completo del panel principal dentro del espacio útil del panel y mantiene el icono alineado a la izquierda del conjunto.",
      "La imagen exportada aplica el mismo criterio, usando un bloque de contenido centrado con un ancho coherente entre márgenes para icono, nombre, foto y estadísticas.",
      "Las métricas del panel principal pasan a compartir el mismo ancho visual que el bloque superior, reforzando la consistencia entre márgenes y alineaciones.",
      "Se conserva el resto del rediseño del resumen final, incluida la cabecera centrada en la liga y la firma inferior de Smash & Lob.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.44",
    date: "29 de julio de 2026",
    title: "Cabecera del resumen centrada en la liga",
    summary:
      "La cabecera del resumen final deja de duplicar protagonismo con la marca de la app y pasa a centrarse en la liga, la temporada y el logo de la propia liga tanto en la preview como en la imagen exportada.",
    category: "improvement",
    changes: [
      "La preview de la app elimina el logo de Smash & Lob de la cabecera y reorganiza el panel para destacar la etiqueta de resumen, el nombre de la liga, la temporada y el logo de la liga.",
      "La imagen exportada aplica el mismo criterio visual, retirando el bloque superior con logo y nombre de la app para dar más protagonismo al contenido específico de la liga.",
      "El logo de la liga sigue respetando la transparencia del PNG y mantiene un tamaño amplio dentro de la cabecera sin romper los márgenes del panel.",
      "La firma inferior 'Creado con Smash & Lob' se conserva, evitando redundancia en la parte superior del resumen final.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.43",
    date: "29 de julio de 2026",
    title: "Centrado real del panel principal en la imagen exportada",
    summary:
      "El panel de campeón/MVP de la imagen generada centra ahora su contenido tomando como referencia el espacio útil entre la barra lateral izquierda y el borde derecho del panel.",
    category: "fix",
    changes: [
      "El panel principal de la imagen exportada recalcula el bloque superior para centrar de verdad el conjunto de icono, etiqueta, nombre y foto dentro del área útil del panel.",
      "La referencia de centrado pasa a ser el espacio comprendido entre la barra negra lateral y el borde derecho del panel, evitando la sensación de contenido desplazado.",
      "La fila de estadísticas mantiene el ancho completo del área útil del panel para conservar el equilibrio visual conseguido en versiones anteriores.",
      "La vista previa de la app y el resto del diseño del resumen final se mantienen sin cambios funcionales en esta iteración salvo el incremento de versión y registro asociado.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.42",
    date: "29 de julio de 2026",
    title: "Logo de liga ampliado y transparente en la cabecera",
    summary:
      "La cabecera del resumen final muestra el logo de liga respetando la transparencia real también en la vista previa, y lo amplía tanto en la app como en la imagen exportada.",
    category: "fix",
    changes: [
      "La vista previa de la app deja de forzar un recuadro blanco bajo el logo de la liga y respeta correctamente los PNG con fondo transparente.",
      "El logo de la liga en la vista previa gana tamaño y aprovecha mejor el espacio disponible de la cabecera sin romper los márgenes.",
      "La imagen exportada mantiene el logo transparente en la cabecera y lo amplía aún más para ocupar mejor el panel respetando el espaciado del diseño.",
      "El resto del comportamiento del resumen final se mantiene intacto, incluidas las opciones para mostrar u ocultar logo y fotos de perfil.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.41",
    date: "29 de julio de 2026",
    title: "Alineación del panel principal en app y exportación",
    summary:
      "El panel de campeón/MVP alinea el icono a la izquierda y centra mejor el contenido útil tanto en la vista previa de la app como en la imagen exportada.",
    category: "fix",
    changes: [
      "En la app, el icono de corona/estrella del panel ganador o MVP queda alineado a la izquierda respetando la barra lateral del diseño.",
      "En la app, la etiqueta, el nombre y la fila de estadísticas se recentran visualmente dentro del espacio útil del panel, entre la barra izquierda y el borde derecho.",
      "En la imagen exportada se replica el mismo criterio visual: icono principal a la izquierda y bloque de contenido centrado en el área útil del panel.",
      "Se mantiene el resto del rediseño del resumen final, incluidas las opciones para mostrar u ocultar logo de liga y fotos de perfil.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.40",
    date: "29 de julio de 2026",
    title: "Alineación final de los paneles del resumen en la app",
    summary:
      "La vista previa de la app reajusta la posición de los destacados y centra el contenido completo del panel Campeón/MVP dentro de su espacio útil.",
    category: "fix",
    changes: [
      "Los textos de 'Lo más destacado' se desplazan ligeramente hacia la izquierda manteniendo una separación segura respecto a la barra lateral.",
      "El panel Campeón/MVP adopta una estructura estable de barra y contenido en dos columnas, eliminando desplazamientos asimétricos.",
      "El conjunto formado por icono, etiqueta, nombre, foto opcional y estadísticas queda centrado dentro del espacio disponible entre la barra izquierda y el borde derecho.",
      "La imagen exportada no cambia en esta versión para cerrar primero el diseño de la vista previa dentro de la aplicación.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.39",
    date: "29 de julio de 2026",
    title: "Destacados correctamente alineados en la app",
    summary:
      "La vista previa del resumen final separa claramente la barra lateral del contenido de cada destacado para eliminar el desplazamiento y los recortes visuales.",
    category: "fix",
    changes: [
      "Los paneles de 'Lo más destacado' dejan de usar una barra posicionada de forma absoluta y pasan a una estructura de dos columnas estable.",
      "La etiqueta, el titular y el detalle se desplazan de forma visible hacia la derecha y mantienen siempre una separación fija respecto a la barra lateral.",
      "Los textos largos conservan el ancho disponible, el salto de línea y el centrado vertical sin invadir la zona de la barra.",
      "La imagen exportada no cambia en esta versión para poder cerrar primero el diseño de la app.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.38",
    date: "29 de julio de 2026",
    title: "Ajustes finales del resumen exportable y su vista previa",
    summary:
      "La imagen exportada integra mejor el logo de la liga y equilibra el panel principal, mientras la vista previa corrige los descuadres restantes en campeón/MVP y en 'Lo más destacado'.",
    category: "fix",
    changes: [
      "El logo de la liga en la imagen exportada se integra directamente sobre la cabecera sin el recuadro blanco cuando el archivo tiene fondo transparente.",
      "Los paneles de puntos, victorias y diferencia de juegos del bloque campeón/MVP pasan a ocupar todo el ancho útil del panel exportado para eliminar el hueco visual que quedaba bajo el icono.",
      "La vista previa dentro de la app reorganiza el bloque campeón/MVP para alinear mejor el icono, el nombre y las métricas dentro del mismo panel.",
      "Las tarjetas de 'Lo más destacado' aumentan su separación respecto a la barra lateral y centran mejor el contenido para evitar cortes visuales y descuadres.",
      "Se mantiene intacta la opción de incluir o excluir el logo de la liga y las fotos del campeón o MVP al generar la imagen final.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.37",
    date: "29 de julio de 2026",
    title: "Ajustes de alineación en la vista previa del resumen final",
    summary:
      "La vista previa dentro de la app corrige el descuadre del panel principal y de 'Lo más destacado' para reproducir mejor el diseño del resumen final.",
    category: "fix",
    changes: [
      "El icono de corona/MVP del panel principal se recentra visualmente y se integra mejor dentro de su contenedor en la vista previa.",
      "Las estadísticas de campeón/MVP dejan de quedar desplazadas a la derecha en la vista previa y pasan a ocupar todo el ancho del panel, sin huecos innecesarios bajo el icono.",
      "El contenido de las tarjetas de 'Lo más destacado' se reorganiza dentro de un bloque centrado verticalmente para evitar sensación de descuadre.",
      "Las cajas de métricas de la vista previa también igualan mejor su altura y su reparto interno para mantener una jerarquía visual más consistente.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.36",
    date: "29 de julio de 2026",
    title: "Resumen final con identidad Smash & Lob",
    summary:
      "La imagen compartible de fin de temporada adopta un diseño propio de Smash & Lob, más equilibrado, legible y preparado para nombres y textos variables.",
    category: "improvement",
    changes: [
      "La cabecera integra la identidad visual de Smash & Lob, el nombre de la liga, la temporada y el logo opcional dentro de una composición clara y vertical.",
      "Los paneles de campeón y MVP centran correctamente nombre, foto y contenido, eliminan espacios sobrantes y sustituyen la barra lateral recortada por un acento interior redondeado.",
      "El podio final alinea verticalmente nombres y métricas, admite nombres en dos líneas y mantiene el Top 3 dentro de un único panel agrupado.",
      "Los destacados calculan su altura según el contenido para evitar solapamientos, cortes y desalineaciones con textos de una, dos o tres líneas.",
      "El fondo, los separadores, los radios, las sombras y la firma final se unifican con el lenguaje visual de la aplicación y permanecen legibles aunque la app use un tema oscuro.",
      "Se conservan las opciones existentes para incluir o excluir el logo de la liga y las imágenes de campeón o MVP.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.35",
    date: "29 de julio de 2026",
    title: "Actualización de seguridad de dependencias",
    summary:
      "Se actualizan las dependencias afectadas por vulnerabilidades críticas y altas, manteniendo la compatibilidad y el funcionamiento completo de la aplicación.",
    category: "fix",
    changes: [
      "Next.js se actualiza a la versión 16.2.12.",
      "NextAuth y Auth.js se actualizan a sus primeras versiones corregidas.",
      "PostCSS y Sharp se fuerzan a versiones sin vulnerabilidades conocidas en producción.",
      "La auditoría de dependencias de producción queda en cero vulnerabilidades.",
      "ESLint, TypeScript y el build de producción se validan correctamente.",
      "Persisten avisos exclusivamente en herramientas de desarrollo de ESLint, cuya actualización mayor todavía no es compatible con eslint-config-next.",
    ],
  },
  {
    version: "v0.17.34",
    date: "28 de julio de 2026",
    title: "Cajas de estadísticas del resumen final corregidas",
    summary:
      "Los valores de puntos, victorias y diferencia de juegos vuelven a quedar completamente dentro de sus cajas en la imagen exportada.",
    category: "fix",
    changes: [
      "Las cajas de estadísticas de campeón y MVP ganan algo más de altura en la imagen exportada.",
      "Los números se recolocan verticalmente para que no queden pegados ni sobresalgan por la parte inferior.",
      "La fila de estadísticas también se sube ligeramente dentro del panel para mantener un equilibrio visual correcto.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.33",
    date: "28 de julio de 2026",
    title: "Podio unificado como panel único",
    summary:
      "La clasificación del resumen final se presenta ahora como un solo bloque continuo tanto en la app como en la imagen exportada, igual que en la pantalla de ranking.",
    category: "improvement",
    changes: [
      "El podio final de la vista previa deja de mostrarse como tarjetas separadas y pasa a mostrarse dentro de un único panel con divisores internos.",
      "La imagen exportada replica el mismo enfoque con un bloque agrupado de clasificación en lugar de filas visualmente independientes.",
      "Se mantiene intacta la información de posición, puntos y diferencia de juegos de cada jugador del Top 3.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.32",
    date: "28 de julio de 2026",
    title: "Ajuste fino final de los destacados exportados",
    summary:
      "La vista previa de la app vuelve al equilibrio anterior y solo la imagen exportada baja aún más el contenido de 'Lo más destacado'.",
    category: "fix",
    changes: [
      "La vista previa dentro de la app recupera el espaciado anterior de las tarjetas de 'Lo más destacado'.",
      "La imagen exportada desplaza todavía más hacia abajo la etiqueta, el titular y el detalle de cada destacado para separarlos más del borde superior.",
      "El resto del diseño del resumen final se mantiene sin cambios, incluidas las opciones de logo de liga y fotos de perfil.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.31",
    date: "28 de julio de 2026",
    title: "Destacados desplazados hacia abajo",
    summary:
      "El contenido de los paneles de 'Lo más destacado' se baja un poco para separarlo del borde superior y equilibrarlo mejor con el borde inferior.",
    category: "fix",
    changes: [
      "Las tarjetas de 'Lo más destacado' desplazan hacia abajo su etiqueta, titular y detalle en la imagen exportada.",
      "La vista previa en pantalla también aumenta el padding superior para reproducir el mismo equilibrio visual.",
      "El resto de ajustes recientes del resumen final se mantiene intacto, incluido el logo de liga ampliado y las opciones de inclusión de imágenes.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.30",
    date: "28 de julio de 2026",
    title: "Ajuste vertical de las tarjetas de destacados",
    summary:
      "El contenido de 'Lo más destacado' se desplaza ligeramente hacia abajo para que quede menos pegado al borde superior y mejor equilibrado dentro del panel.",
    category: "fix",
    changes: [
      "Las tarjetas de 'Lo más destacado' ganan más aire arriba y un reparto vertical más equilibrado tanto en la vista previa como en la imagen exportada.",
      "Se ajusta el bloque de etiqueta, titular y detalle para que todo el contenido quede visualmente más centrado dentro de cada panel.",
      "Se mantiene el resto del diseño, incluido el logo de liga ampliado y las opciones para incluir logo y fotos de perfil en la exportación.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.29",
    date: "28 de julio de 2026",
    title: "Logo de liga más grande y centrado en el resumen",
    summary:
      "El logo de la liga gana presencia en la cabecera de la imagen compartible y queda centrado verticalmente entre el borde superior y el primer panel.",
    category: "fix",
    changes: [
      "El logo aumenta de 132 a 176 píxeles en la imagen exportada.",
      "Su posición vertical se calcula con el espacio real disponible entre la franja superior y el panel de campeón o MVP.",
      "Se amplía ligeramente la separación horizontal respecto al texto para conservar una cabecera limpia.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.28",
    date: "28 de julio de 2026",
    title: "Destacados con subtítulo más pegado y titular con más aire",
    summary:
      "La sección Lo más destacado ajusta el espaciado vertical para acercar la línea descriptiva y dar un poco más de margen superior al titular principal.",
    category: "fix",
    changes: [
      "La línea descriptiva de tarjetas como 'La mejor serie individual de la temporada' reduce su margen vertical tanto en la vista previa como en la imagen exportada.",
      "El titular superior gana un poco más de margen por arriba para respirar mejor sin cambiar su tamaño de fuente.",
      "Se retoca el padding vertical de las tarjetas destacadas en la vista previa para que el comportamiento coincida con el PNG final.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.27",
    date: "28 de julio de 2026",
    title: "Resumen final con logo más visible y destacados más compactos",
    summary:
      "El resumen compartible agranda el logo de la liga, devuelve la barra de acento al lado izquierdo de campeón y MVP, y recorta todavía más los márgenes de las descripciones en los destacados.",
    category: "fix",
    changes: [
      "El logo de la liga gana bastante tamaño en la cabecera de la imagen compartible para que se identifique de un vistazo.",
      "Los paneles de campeón, MVP y combinado recuperan la barra de acento en el lateral izquierdo tanto en la vista previa como en la imagen exportada.",
      "La distribución interna de los paneles principales se ajusta para conservar el centrado del bloque foto + nombre con la barra situada a la izquierda.",
      "Las tarjetas de Lo más destacado reducen todavía más la altura sobrante y acercan la descripción al titular en la vista previa y en el PNG final.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.26",
    date: "28 de julio de 2026",
    title: "Campeón y MVP centrados con iconografía propia",
    summary:
      "Los paneles principales del resumen final se reconstruyen para centrar foto y nombre como un único bloque, diferenciar campeón y MVP mediante iconos de contorno y compactar los textos destacados.",
    category: "fix",
    changes: [
      "Los paneles de campeón y MVP eliminan la etiqueta textual superior y reservan una zona cuadrada a la izquierda para una corona o una estrella de contorno.",
      "La foto de perfil aparece a la izquierda del nombre y ambos elementos se centran juntos dentro del espacio útil del panel.",
      "La barra de acento pasa al lado derecho y queda recortada por las esquinas redondeadas del panel, sin sobresalir del contorno.",
      "El nombre gana tamaño y los bloques de estadísticas mantienen una distribución uniforme en campeón, MVP y panel combinado.",
      "Los textos descriptivos de Lo más destacado se acercan al titular y reducen el espacio vertical sobrante en la vista previa y en la imagen exportada.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.25",
    date: "28 de julio de 2026",
    title: "Acento lateral uniforme en toda la clasificación",
    summary:
      "Todas las posiciones del Ranking recuperan una barra lateral coherente con el tema, sin usar colores distintos según el puesto.",
    category: "fix",
    changes: [
      "La barra lateral aparece desde la primera hasta la última posición, tanto en los modos clásicos como en los coloridos.",
      "Todas las filas usan exactamente el mismo color de acento dentro de cada tema.",
      "Los temas coloridos reutilizan su color principal; Clásico claro usa un acento neutro y Clásico oscuro su color principal renovado.",
      "Las medallas y números de posición siguen comunicando el podio sin alterar el color de la barra.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.24",
    date: "28 de julio de 2026",
    title: "Acentos uniformes desde la quinta posición",
    summary:
      "La clasificación recupera las barras laterales únicamente desde el quinto puesto, usando el mismo color para todas esas filas.",
    category: "fix",
    changes: [
      "Las posiciones 1.ª a 4.ª permanecen sin barra lateral de color.",
      "Desde la 5.ª posición en adelante se recupera una barra uniforme con el color principal del tema.",
      "Se mantienen intactos los distintivos de oro, plata y bronce de las tres primeras posiciones.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.23",
    date: "28 de julio de 2026",
    title: "Paneles coloridos más limpios y Ranking sin barras laterales",
    summary:
      "Los títulos de los paneles coloridos pierden el subrayado decorativo y la clasificación elimina las barras de color laterales para mantener una lectura más uniforme.",
    category: "fix",
    changes: [
      "Se elimina la línea degradada situada bajo títulos de sección como Clasificación y Próximo partido en los temas coloridos.",
      "Las filas del Ranking dejan de mostrar barras verticales de color a la izquierda de los jugadores.",
      "Los distintivos de posición del podio se mantienen para conservar la jerarquía visual de los tres primeros puestos.",
      "La clasificación conserva su estructura compacta de panel único, sus separadores y sus esquinas exteriores.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.22",
    date: "28 de julio de 2026",
    title: "Ranking compacto y Clásico oscuro con más profundidad",
    summary:
      "La clasificación se presenta como un único panel continuo y el modo Clásico oscuro adopta una paleta por capas que diferencia mejor fondos, tarjetas, controles y acciones.",
    category: "improvement",
    changes: [
      "Las filas del Ranking quedan unidas dentro de un único contenedor, sin márgenes intermedios ni esquinas redondeadas independientes.",
      "La primera fila conserva únicamente las esquinas superiores y la última las inferiores gracias al recorte del panel exterior.",
      "Se mantienen separadores discretos entre jugadores y los acentos individuales de los temas coloridos sin aumentar la altura de la clasificación.",
      "Clásico oscuro estrena una escala azul grisácea neutra con diferencias claras entre fondo exterior, marco de la aplicación, tarjetas y superficies elevadas.",
      "Los bordes, campos, botones secundarios, controles flotantes y navegación inferior ganan contraste sin convertir el tema clásico en un tema colorido.",
      "Las acciones principales usan una superficie clara de alto contraste y la barra del navegador adopta el nuevo color de fondo del modo oscuro.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.21",
    date: "28 de julio de 2026",
    title: "Paneles clásicos con la misma estructura visual",
    summary:
      "Los modos Clásico claro y oscuro reutilizan ahora la misma construcción de tarjetas y franjas decorativas que los temas coloridos, manteniendo su paleta neutra.",
    category: "fix",
    changes: [
      "Las tarjetas de los modos clásicos dejan de dibujar la franja superior mediante un pseudo-elemento independiente.",
      "La franja neutra pasa a formar parte del fondo interno del panel, igual que en los temas coloridos, respetando siempre el borde y las esquinas redondeadas.",
      "Los paneles con filas opacas reutilizan también la misma franja estructural interna en todos los temas.",
      "Se corrige el desbordamiento visible en tarjetas como la vista previa de clasificación de Home sin alterar los colores actuales de Clásico claro y Clásico oscuro.",
      "El replanteamiento general de contraste y botones del modo Clásico oscuro queda reservado para una mejora posterior.",
      "No se requieren migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.20",
    date: "27 de julio de 2026",
    title: "Exportación final pulida y ajustes localizables",
    summary:
      "La imagen compartible respeta la transparencia del logo, centra con precisión todos sus bloques y estrena controles visuales más cuidados, mientras el buscador incorpora las recomendaciones de liga.",
    category: "fix",
    changes: [
      "El logo de la liga se dibuja en la imagen final con ajuste contain y sin fondo artificial, conservando las transparencias igual que en Home.",
      "Los controles para incluir logo y fotos se sustituyen por interruptores visuales accesibles, con iconos, estados claros y mensajes contextuales.",
      "La opción Recomendaciones de la liga obtiene una entrada propia en el buscador de Ajustes, con acceso directo al campo correspondiente y sinónimos en español, inglés y euskera.",
      "Las barras superiores de degradado del modo Clásico quedan encajadas dentro del borde redondeado de cada panel, incluso cuando la tarjeta no oculta el desbordamiento.",
      "La composición Canvas usa alineación vertical por bloques para cabecera, campeón/MVP, estadísticas, podio y destacados, eliminando los textos desplazados.",
      "No se requieren nuevas migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.19",
    date: "27 de julio de 2026",
    title: "Validación estricta sin avisos en estadísticas",
    summary:
      "Se corrige el aviso de dependencias del resumen de temporada y la entrega queda preparada para tratar cualquier warning de ESLint como un fallo antes de publicar.",
    category: "fix",
    changes: [
      "El cálculo memorizado del resumen final usa ahora el tipo explícito del ranking y deja de depender implícitamente del objeto completo de estadísticas.",
      "Se elimina el warning react-hooks/exhaustive-deps detectado en la pantalla Resumen de temporada.",
      "La validación recomendada ejecuta ESLint con max-warnings=0 para detener el flujo ante cualquier error o aviso.",
      "No se requieren nuevas migraciones ni cambios de datos persistidos.",
    ],
  },
  {
    version: "v0.17.18",
    date: "27 de julio de 2026",
    title: "Recomendaciones de liga y resumen final con logo/fotos opcionales",
    summary:
      "La administración de liga ya permite guardar recomendaciones útiles para los jugadores y la imagen final de temporada puede incluir, antes de compartir o descargar, el logo de la liga y las fotos del campeón o MVP.",
    category: "improvement",
    changes: [
      "La creación y edición de ligas incorporan un nuevo campo de recomendaciones para indicar bolas sugeridas, pistas habituales, equipamiento o notas prácticas.",
      "Las recomendaciones guardadas se muestran en la portada de la liga para que todos los miembros las tengan visibles.",
      "La insignia de PRE ahora enseña también la versión activa de la aplicación para identificar mejor cada build interna.",
      "El resumen final de temporada añade dos opciones previas a exportar: incluir el logo de la liga e incluir las fotos del campeón / MVP cuando existan.",
      "La composición exportable del resumen se reajusta para centrar mejor el contenido, suavizar la barra lateral y mejorar el encaje visual de los paneles principales.",
      "Se añade migración para persistir las recomendaciones de liga en Supabase y se actualiza la versión visible de la app a v0.17.18.",
    ],
  },
  {
    version: "v0.17.17",
    date: "27 de julio de 2026",
    title: "Resumen final más legible con destacados en columna",
    summary:
      "La imagen compartible deja de usar la cuadrícula 2×2 para los destacados, devuelve más protagonismo al ganador y recupera algo más de altura para mejorar la lectura.",
    category: "fix",
    changes: [
      "Los destacados vuelven a mostrarse en una sola columna para evitar recortes y mejorar la legibilidad de textos largos.",
      "Los paneles de campeón y MVP pasan a ocupar todo el ancho disponible, evitando nombres desplazados y espacios desaprovechados.",
      "La imagen exportada gana algo de altura y aire vertical para que el contenido respire mejor.",
      "Se mantiene la paleta monocroma, el podio con diferencia de juegos y la exportación con fondo claro estable.",
      "También se alinea la vista previa de la página con el nuevo apilado vertical de héroes y destacados.",
      "No se requieren migraciones, cambios de API ni modificaciones de datos persistidos.",
    ],
  },
  {
    version: "v0.17.16",
    date: "27 de julio de 2026",
    title: "Resumen final más sobrio, compacto y legible",
    summary:
      "La imagen exportada adopta una paleta casi monocroma, reduce notablemente su altura y reorganiza campeón, MVP y destacados para evitar ruido visual.",
    category: "fix",
    changes: [
      "Se elimina la mezcla de colores dependiente del tema y se sustituye por una paleta estable de blanco, grises y negro.",
      "Campeón y MVP se colocan en la misma fila cuando son distintos; si coinciden, se mantiene un único panel de ancho completo.",
      "Se refuerza la jerarquía tipográfica para priorizar temporada, nombres y resultados sobre etiquetas secundarias.",
      "Los datos de puntos, victorias y diferencia de juegos se compactan dentro de los paneles principales.",
      "El podio reduce su altura sin perder puntos ni diferencia de juegos.",
      "Lo más destacado pasa a una cuadrícula 2x2 en la imagen exportada y a dos columnas cuando hay espacio en la vista previa.",
      "La altura total de la imagen se calcula dinámicamente con un formato mucho más corto y fácil de compartir.",
      "No se requieren migraciones, cambios de API ni modificaciones de datos persistidos.",
    ],
  },
  {
    version: "v0.17.15",
    date: "27 de julio de 2026",
    title: "Resumen final exportable más claro y con mejor contexto competitivo",
    summary:
      "La imagen final de temporada reorganiza campeón y MVP, añade estadísticas clave, muestra la diferencia de juegos en el podio y adopta un fondo claro incluso con temas oscuros.",
    category: "fix",
    changes: [
      "Si campeón y MVP coinciden, ambos se unifican en un único panel para reducir altura y duplicidad visual.",
      "Los paneles de campeón y MVP se ajustan para dar más protagonismo al nombre y menos espacio vacío, incluyendo puntos, victorias y diferencia de juegos.",
      "Se eliminan las etiquetas intermedias de puestos destacados y momentos clave para compactar la imagen final.",
      "El podio incorpora también la diferencia de juegos, tanto en la vista previa de la página como en la imagen exportada.",
      "Se incrementa la separación visual entre Podio final y Lo más destacado para mejorar la lectura.",
      "La exportación utiliza ahora un fondo claramente luminoso y estable, independientemente del tema activo de la aplicación.",
      "No se requieren migraciones, cambios de API ni modificaciones de datos persistidos.",
    ],
  },
  {
    version: "v0.17.14",
    date: "27 de julio de 2026",
    title: "Resumen exportado más legible y sin solapes",
    summary:
      "La imagen exportada de final de temporada gana aún más altura, reorganiza su contenido en una sola columna y evita que los textos se pisen entre campeón, MVP y destacados.",
    category: "fix",
    changes: [
      "La imagen de resumen final adopta una estructura más vertical y de una sola columna para evitar cruces entre bloques de texto.",
      "Campeón y MVP pasan a mostrarse en tarjetas independientes con más espacio y jerarquía visual.",
      "El podio mantiene una lectura más limpia con nombres y puntos mejor separados.",
      "Los momentos destacados se apilan en tarjetas completas, con menos riesgo de solape y mejor claridad al compartir o descargar.",
      "Se refuerza el truncado controlado de textos largos para que nunca invadan otras zonas de la imagen.",
      "No se requieren migraciones, cambios de API ni modificaciones de datos persistidos.",
    ],
  },
  {
    version: "v0.17.13",
    date: "27 de julio de 2026",
    title: "Imagen de temporada más vertical y más clara",
    summary:
      "La imagen compartida y descargada adopta un formato vertical más alto y aprovecha mejor el espacio para presentar campeón, podio y momentos destacados con más claridad.",
    category: "improvement",
    changes: [
      "La imagen de Resumen de temporada pasa a un formato vertical más alto, pensado para compartir mejor en redes y mensajería.",
      "Compartir y Guardar imagen siguen utilizando exactamente el mismo archivo generado, sin variantes distintas.",
      "La cabecera destaca mejor al campeón y al MVP con más espacio y jerarquía visual.",
      "El podio se presenta con filas más claras, marcadores más legibles y puntos mejor separados visualmente.",
      "Los paneles de momentos destacados crecen y disponen de más espacio para explicar mejor cada estadística.",
      "No se requieren migraciones, cambios de API ni modificaciones de datos persistidos.",
    ],
  },
  {
    version: "v0.17.12",
    date: "27 de julio de 2026",
    title: "Histórico completo y evolución individual gráfica",
    summary:
      "Las estadísticas pueden evaluar toda la liga, el análisis individual sustituye la tabla por un gráfico y los selectores flotantes ganan una superficie completamente opaca.",
    category: "improvement",
    changes: [
      "Cuando una liga tiene varias temporadas, Estadísticas incorpora el ámbito Toda la liga y agrega partidos, victorias, puntos, sets, juegos, rachas, rivales, compañeros y récords de todo el historial.",
      "Las ligas con una sola temporada mantienen el comportamiento anterior y no muestran un selector redundante.",
      "Las rachas históricas no continúan artificialmente entre temporadas y los gráficos separan cada competición, reiniciando posición, puntos y diferencia de juegos.",
      "Análisis individual reemplaza la tabla Evolución por jornada por un gráfico con vistas de Posición, Puntos y Diferencia de juegos.",
      "Cada punto del gráfico individual conserva jornada, compañero, rivales, resultado y cambio respecto a la jornada anterior.",
      "Los selectores flotantes de Cara a cara y Análisis individual usan fondos totalmente opacos, bordes definidos y una sombra exterior más clara en todos los temas.",
      "No se requieren migraciones, cambios de API ni modificaciones de datos persistidos.",
    ],
  },
  {
    version: "v0.17.11",
    date: "27 de julio de 2026",
    title: "Selectores flotantes reales y acentos clásicos",
    summary:
      "Los selectores de jugadores pasan a una capa fija funcional durante el desplazamiento y los temas Clásicos ganan una franja neutra coherente con su estilo minimalista.",
    category: "fix",
    changes: [
      "Cara a cara y Análisis individual mantienen el selector en su posición normal hasta que sale de la pantalla y entonces muestran una versión realmente fija bajo los controles superiores.",
      "El selector flotante conserva su espacio original, se puede seguir utilizando y vuelve a su sitio al desplazarse hacia arriba.",
      "Se sustituye la implementación sticky anterior, que dependía del flujo de la página y no se comportaba correctamente en todos los dispositivos.",
      "Los estilos Clásicos claro y oscuro incorporan una franja superior en escala de grises en todas las tarjetas, sin añadir color ni perder el acabado plano.",
      "El movimiento de entrada respeta la preferencia de reducción de animaciones del dispositivo.",
      "No se requieren migraciones, cambios de API ni modificaciones de datos persistidos.",
    ],
  },
  {
    version: "v0.17.10",
    date: "27 de julio de 2026",
    title: "Estadísticas más útiles y comparativas completas",
    summary:
      "La portada estadística elimina información redundante, el cara a cara gana contexto competitivo y los récords y resúmenes explican mejor qué ocurrió en la temporada.",
    category: "improvement",
    changes: [
      "Los accesos flotantes diferencian claramente la invitación de jugadores del enlace para espectadores mediante iconos específicos.",
      "La portada de Estadísticas elimina el podio provisional, el progreso y los contadores técnicos para destacar líder, victorias, diferencia de juegos y mejor racha.",
      "Los accesos a los apartados estadísticos pierden las etiquetas laterales redundantes y alinean iconos, contenido y chevrón de forma simétrica.",
      "Cara a cara y Análisis individual mantienen sus selectores visibles al desplazarse y permiten cambiar de jugador sin volver al inicio.",
      "Cara a cara incorpora posición, porcentaje de victorias, balance, diferencia de juegos, forma reciente, duelos directos y rendimiento frente a rivales comunes.",
      "Récords de temporada y Resumen de temporada explican remontadas, partidos igualados y victorias amplias con protagonistas, marcador y contexto legible.",
      "El resumen final muestra el aviso de datos incompletos junto a la temporada y bloquea compartir o guardar la imagen hasta resolverlos.",
      "Evolución de la liga añade la diferencia de juegos acumulada como tercera vista del gráfico.",
      "No se requieren migraciones, cambios de API ni modificaciones de datos persistidos.",
    ],
  },
  {
    version: "v0.17.9",
    date: "27 de julio de 2026",
    title: "Cara a cara y evolución compacta",
    summary:
      "La comparación vuelve a centrarse exclusivamente en dos jugadores y la evolución global gana espacio, precisión y un acceso rápido al podio.",
    category: "improvement",
    changes: [
      "Comparar jugadores pasa a llamarse Cara a cara y conserva únicamente la información competitiva de los dos jugadores seleccionados.",
      "El gráfico de evolución se elimina del Cara a cara porque la comparación temporal completa ya está disponible en Evolución de la liga.",
      "El filtro destacado de Evolución de la liga cambia de top 4 a top 3 para reflejar el podio como referencia principal.",
      "Los selectores Posición/Puntos y Todos/Top 3 comparten una sola fila y se elimina el encabezado repetido dentro del panel.",
      "La escala de posiciones muestra cada puesto entero comprendido entre la mejor y la peor posición visibles.",
      "Los gráficos muestran hasta siete jornadas sin desplazamiento horizontal y reducen proporcionalmente el scroll en temporadas más largas.",
      "No se requieren migraciones, cambios de API ni modificaciones de datos persistidos.",
    ],
  },
  {
    version: "v0.17.8",
    date: "27 de julio de 2026",
    title: "Estadísticas individuales y evolución global",
    summary:
      "Las estadísticas se centran en el rendimiento individual, añaden la evolución completa de la liga y simplifican la navegación por temporada.",
    category: "improvement",
    changes: [
      "Al guardar o editar un resultado aparece una confirmación flotante accesible.",
      "La nueva pantalla Evolución de la liga permite comparar posición y puntos de todos los jugadores, ocultar series y destacar el top 4.",
      "Las pantallas de detalle utilizan la temporada elegida en la portada de Estadísticas y ya no repiten su selector.",
      "Se eliminan rankings, contadores y comparativas de pareja; el compañero más fuerte se determina por diferencia de sets y después de juegos.",
      "En calendarios equilibrados no se muestra Rival habitual, porque todos los cruces tienen una frecuencia equivalente.",
      "Los gráficos utilizan colores, trazos y marcadores diferenciados para mantener la lectura en todos los temas.",
      "No se requieren migraciones, cambios de API ni modificaciones de datos persistidos.",
    ],
  },
  {
    version: "v0.17.7",
    date: "26 de julio de 2026",
    title: "Validación limpia del espacio de estadísticas",
    summary:
      "Se corrige la dependencia del callback compartido de Estadísticas para dejar ESLint completamente limpio.",
    category: "fix",
    changes: [
      "El formateador compartido de partidos utiliza ahora el tipo MatchData directamente, sin depender del objeto completo de estadísticas.",
      "Se elimina el aviso react-hooks/exhaustive-deps detectado en useStatisticsWorkspace.",
      "No cambia ningún cálculo, pantalla, API, permiso ni dato persistido.",
      "No se requieren migraciones de Supabase.",
    ],
  },
  {
    version: "v0.17.6",
    date: "26 de julio de 2026",
    title: "Estadísticas más claras y organizadas",
    summary:
      "La pantalla principal de Estadísticas se convierte en un resumen compacto y distribuye el detalle en apartados específicos.",
    category: "improvement",
    changes: [
      "La portada de Estadísticas muestra solo progreso, líder, mejor racha, resultados válidos y podio provisional.",
      "Clasificación, comparativas, análisis individual, récords y resumen de temporada disponen ahora de pantallas propias.",
      "La temporada seleccionada se conserva al navegar entre todos los apartados estadísticos.",
      "El detalle completo sigue disponible, pero se evita concentrar tablas, gráficos, récords y resúmenes en una única pantalla extensa.",
      "No se requieren migraciones, cambios de API ni modificaciones de datos.",
    ],
  },
  {
    version: "v0.17.5",
    date: "26 de julio de 2026",
    title: "Degradado coherente en Programación",
    summary:
      "El panel Programación adopta exactamente la misma franja Colorida que el resto de tarjetas de la aplicación.",
    category: "fix",
    changes: [
      "Se elimina el degradado específico ámbar y rosa que diferenciaba Programación del resto de paneles.",
      "Programación hereda ahora la combinación principal, secundaria, acento y cálida definida por cada paleta Colorida.",
      "Se mantienen intactos el recorte de la franja, el redondeado, el contenido y el comportamiento del panel.",
      "No se requieren migraciones, cambios de API ni modificaciones de datos.",
    ],
  },
  {
    version: "v0.17.4",
    date: "26 de julio de 2026",
    title: "Validación y cierre de estadísticas avanzadas",
    summary:
      "La serie estadística se endurece ante empates, resultados excluidos, plantillas modificadas y temporadas incompletas.",
    category: "improvement",
    changes: [
      "Las posiciones y campeones reconocen empates reales por puntos, diferencia y juegos ganados.",
      "Los resultados vacíos o sin ganador quedan fuera de clasificación, récords, comparativas, gráficos y perfiles.",
      "Un panel de estado informa de partidos pendientes, resultados excluidos o no válidos, retiradas y movimientos de plantilla.",
      "La evolución de todos los jugadores se calcula una sola vez por temporada y el historial evita generar gráficos que no necesita.",
      "Se corrigen las escalas de posición, los resúmenes compartidos con campeones empatados y diversos casos de accesibilidad y contraste.",
    ],
  },
  {
    version: "v0.17.3",
    date: "26 de julio de 2026",
    title: "Resumen final compartible de temporada",
    summary:
      "Las temporadas terminadas reúnen campeón, MVP, podio y récords en una tarjeta preparada para compartir.",
    category: "new",
    changes: [
      "Las temporadas cerradas muestran un resumen final con campeón, MVP, podio, mejor racha, remontada y partidos destacados.",
      "El resumen puede compartirse como archivo PNG mediante el menú nativo del dispositivo.",
      "Cuando compartir archivos no está disponible, la aplicación permite guardar directamente la imagen generada.",
      "La imagen adapta sus colores al estilo Clásico o a la paleta Colorida activa sin capturar datos externos.",
      "No se incorporan dependencias, migraciones ni cambios de API.",
    ],
  },
  {
    version: "v0.17.2",
    date: "26 de julio de 2026",
    title: "Gráficos de evolución competitiva",
    summary:
      "La comparación entre jugadores incorpora gráficos de posición y puntos acumulados por jornada.",
    category: "new",
    changes: [
      "La comparativa de jugadores añade un gráfico alternable entre posición y puntos acumulados.",
      "Las dos series siguen los jugadores seleccionados y reutilizan su evolución por jornada ya calculada.",
      "Los colores del gráfico se adaptan a la paleta Colorida activa y mantienen contraste en Clásico claro y oscuro.",
      "El gráfico incluye etiquetas, detalles por punto y una descripción accesible para lectores de pantalla.",
      "No se añaden librerías externas, migraciones ni cambios de API.",
    ],
  },
  {
    version: "v0.17.1",
    date: "26 de julio de 2026",
    title: "Evolución y récords de temporada",
    summary:
      "Las estadísticas convierten el historial de resultados en récords de liga y marcas personales consultables.",
    category: "new",
    changes: [
      "Historial y estadísticas incorpora récords globales de racha, remontadas y partidos destacados.",
      "El análisis individual muestra mejor y peor posición, racha personal, rivales más vencidos y derrotas más repetidas.",
      "Los perfiles de jugador añaden un resumen compacto de récords del periodo seleccionado.",
      "Las remontadas solo se calculan cuando el ganador perdió el primer set y todos los récords excluyen resultados no contabilizados.",
      "Todos los cálculos reutilizan resultados contabilizados y no requieren migraciones, API ni persistencia adicional.",
    ],
  },
  {
    version: "v0.17.0",
    date: "26 de julio de 2026",
    title: "Comparativas competitivas y coherencia final de paneles",
    summary:
      "Las estadísticas estrenan comparativas directas, forma reciente y relaciones frecuentes, mientras Partido y los premios completan su integración con Colorido.",
    category: "new",
    changes: [
      "Historial y estadísticas permite comparar dos jugadores de la temporada con posición, puntos, victorias y forma de sus últimos cinco partidos.",
      "La comparativa analiza los enfrentamientos directos como rivales, incluyendo victorias y diferencia de juegos.",
      "El análisis individual añade forma reciente, rachas, rival más habitual o más difícil según el calendario y evolución por jornada.",
      "Programación y el marcador de Partido adoptan la misma franja Colorida que el resto de paneles y se elimina la línea innecesaria bajo la cabecera de Programación.",
      "Las cabeceras de Ganador y MVP utilizan el degradado correspondiente a la paleta Colorida activa y conservan su aspecto Clásico fuera de ese estilo.",
      "No se requieren migraciones, cambios de API ni persistencia adicional.",
    ],
  },
  {
    version: "v0.16.12",
    date: "26 de julio de 2026",
    title: "Estilos Clásico y Colorido y remate de premios",
    summary:
      "La apariencia neutra adopta el nombre Clásico y las cabeceras de Ganador y MVP encajan con el redondeado de sus paneles.",
    category: "improvement",
    changes: [
      "El estilo visual Plano pasa a mostrarse como Clásico, una denominación más natural y coherente frente a Colorido.",
      "Colorido conserva su nombre, sus seis paletas y todas las combinaciones con Claro, Oscuro y Sistema.",
      "La clave interna plain se mantiene para conservar las preferencias guardadas y evitar cualquier migración en los dispositivos.",
      "Las barras Ganador de temporada y MVP de temporada adoptan el mismo radio superior que la tarjeta que las contiene.",
      "El buscador reconoce Clásico y también los términos antiguos Plano, Plain y Laua para no perder accesos por costumbre.",
    ],
  },
  {
    version: "v0.16.11",
    date: "26 de julio de 2026",
    title: "Seis paletas naturales y búsqueda contextual de ligas",
    summary:
      "El modo Colorido incorpora seis combinaciones más naturales y la lupa de Mis ligas pasa a buscar competiciones en lugar de opciones de Ajustes.",
    category: "improvement",
    changes: [
      "Índigo y violeta se mantiene como paleta predeterminada y se añaden Azul noche y celeste, Salvia y bosque, Borgoña y rosa empolvado, Arena y terracota y Grafito y azul hielo.",
      "Cada paleta dispone de una variante clara y otra oscura coordinadas para fondos, paneles, navegación, formularios, ranking y controles.",
      "Las selecciones antiguas Azul y turquesa, Esmeralda, Coral y Naranja se migran automáticamente a sus alternativas naturales equivalentes.",
      "En Mis ligas, la lupa flotante filtra por nombre, descripción, temporada y rol, e inicia directamente el cambio a la liga seleccionada.",
      "No se requieren migraciones, cambios de API ni persistencia remota.",
    ],
  },
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
      "El estilo Clásico no muestra la franja ni reserva espacio adicional y el resto de tarjetas Coloridas conserva su tratamiento actual.",
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
      "La corrección no recorta contenido, menús ni elementos emergentes y mantiene intactos los estilos Clásico, Claro y Oscuro.",
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
      "La corrección se aplica de forma centralizada a tarjetas, selectores y resúmenes equivalentes sin alterar Claro, Oscuro Clásico ni los colores semánticos.",
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
      "La revisión mantiene intactos Claro, Oscuro y Sistema en estilo Clásico y no modifica lógica de negocio, APIs ni persistencia.",
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
      "Claro, Oscuro y Sistema pueden combinarse con un estilo Clásico o Colorido y con cualquiera de las cinco paletas preparadas.",
    category: "improvement",
    changes: [
      "La configuración visual se divide en Tema base, Estilo visual y Paleta de color.",
      "El estilo Colorido incorpora variantes claras y oscuras específicas para las cinco paletas.",
      "Sistema + Colorido cambia automáticamente entre la variante clara y oscura sin perder la paleta elegida.",
      "Ajustes muestra únicamente un resumen compacto y traslada la configuración detallada a Temas y apariencia.",
      "Las preferencias anteriores se migran automáticamente: Colorido conserva su paleta y el resto mantiene su tema con estilo Clásico.",
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
