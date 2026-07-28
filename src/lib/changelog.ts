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
