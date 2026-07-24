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
