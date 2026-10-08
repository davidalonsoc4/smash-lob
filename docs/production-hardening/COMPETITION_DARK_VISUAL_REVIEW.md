# Competition oscuro: revisión visual — 2026-10-08

Revisión de la instancia que el usuario mantiene en http://localhost:3000, mediante el navegador integrado de Codex, en el ancho estrecho del panel actual. Sin modificaciones de código, configuración, preferencias ni envíos de formularios. Se inspeccionaron HOME, Ranking, Calendario, Chats, conversación individual, detalle de partido (incluido scroll y formulario), Perfil, Ajustes, Apariencia, Notificaciones, Administración, Administración de temporada e inscripción, Pagos, Estadísticas (temporada activa e histórica) y Resumen de temporada. No equivale a una revisión de todos los estados ni de escritorio amplio.

## Correcciones prioritarias observadas

1. **Notificaciones: contraste de acción principal.** «Marcar todas como leídas» tiene texto blanco rgb(255,255,255), 16 px, peso 400, sobre dorado rgb(215,165,68), confirmado con estilos calculados. Contraste aproximado 2,24:1. Usar el color de contraste del acento, como en los botones dorados con texto oscuro de otras pantallas.
2. **Controles flotantes sobre contenido.** Al hacer scroll en el detalle de partido, los controles superiores quedan sobre nombres y textos; los accesos flotantes de chat/más acciones invaden la tarjeta de resultado. Dar una superficie propia a la barra y reservar espacio para acciones, sin solapar texto ni botones de guardar. La burbuja N de Next Dev Tools también tapa navegación y compositor, pero es exclusivamente de desarrollo y debe separarse de los defectos del producto.
3. **Deshabilitados indistinguibles de activos.** «Guardar resultado», «Guardar inscripción» y los «Guardar» de plantilla están deshabilitados en el árbol accesible pero siguen mostrándose dorados y prominentes. Definir un estado visual disabled común y legible; mantener el acento pleno para acciones disponibles.
4. **Avatares rotos en Ranking.** Se observa el icono de imagen rota en varios jugadores, además de avatares genéricos correctos en otros. Aplicar fallback también cuando falla la descarga, no solo cuando falta URL. No se ha determinado la causa de las imágenes fallidas.
5. **Estadísticas y empates.** Tarjetas de líderes, más victorias y mejor diferencia recortan listas de jugadores («David Alonso / Davi…», etc.). Mostrar un resumen de empate y ofrecer acceso a la lista completa. En una temporada sin resultados, indicar «Sin resultados todavía» en lugar de presentar a toda la plantilla como líderes con cero puntos.
6. **Chats: nombres ambiguos.** «con David vs David y David» no permite identificar el partido. Usar nombres visibles distinguibles, apellidos o avatares y una presentación consistente de compañero y rivales.
7. **Resumen de temporada: explicación contradictoria.** Al abrir Temporada 2 terminada, la pantalla dice que la descarga aparecerá cuando termine, pero el estado es «Datos incompletos» y el resumen está bloqueado por diez partidos pendientes/excluidos/no válidos. Mostrar la causa real y ofrecer acceso a su revisión.

## Mejoras de diseño propuestas

- Perfil: agrupar los récords sin datos bajo un mensaje claro, evitando seis tarjetas con guiones y porcentajes cero que pueden interpretarse como rendimiento real.
- Textos secundarios: aumentar su legibilidad en metadatos de partidos, reservas del chat, fechas, etiquetas y ayudas. La reserva del chat reúne fecha y ubicación en una línea pequeña; permitir una segunda línea y destacar fecha/hora. No se ha medido el contraste de todos estos textos.
- Jerarquía del acento: reducir fondos y bordes dorados en paneles informativos y reservar mayor intensidad para selección y acciones principales; actualmente demasiados bloques reclaman atención simultáneamente.
- Administración de temporada: mantener los accesos por sección, pero reducir la densidad del formulario largo, agrupando opciones y separando claramente las acciones de ciclo de vida.
- Apariencia: explicar junto a Tema base que Competition actualmente solo admite oscuro; no basta con atenuar Claro y Sistema mientras la descripción invita a elegirlos.
- Navegación: revisar la consistencia de «Volver» y el contexto de retorno; en Ajustes se observó enlace a HOME pese a haber entrado desde otras pantallas. Es una observación del estado actual, no una prueba exhaustiva de navegación.

## Alcance pendiente antes de afirmar cobertura completa

Otros acentos Competition, texto grande, teclado/foco, escritorio amplio, dispositivos físicos, permisos de jugador puro, chat con propuestas y mensajes largos, resultados completos, errores y estados de carga. La revisión inicial no ejecutó pruebas automáticas ni modificó datos.

## Implementación y segunda revisión

Rama local `codex/competition-dark-polish`, sin commit ni publicación. Se implementaron las siete correcciones prioritarias, incluido el acceso a revisión de partidos incompletos. Además, se simplificó el perfil sin resultados, se mejoraron los textos secundarios y la reserva del chat, y se aclaró la descripción del tema oscuro. El contexto de Volver ya tiene lógica de retorno en el componente compartido; el href de respaldo observado no demuestra un fallo, por lo que no se cambió.

Tras recargar localhost:3000 se comprobaron visualmente Ranking, Chats, conversación, detalle de partido y scroll, estadísticas sin resultados e históricas (desplegando empates), resumen incompleto, Perfil, Apariencia y botones deshabilitados de inscripción/plantilla. El botón de notificaciones tiene ahora texto rgb(17,17,17) sobre rgb(215,165,68). No se enviaron formularios ni se alteraron datos.

ESLint, TypeScript, i18n y presupuesto de fuente correctos; 40 tests focalizados en 11 archivos correctos en la primera iteración. No se ejecutó build sobre el servidor activo del usuario ni pruebas E2E con su cuenta.

## Tercera revisión y finalización de propuestas

Administración usa ahora secciones desplegables en Competition, con controles de ciclo de vida separados. Los enlaces abren el bloque correspondiente; los formularios permanecen montados para conservar ediciones. Las superficies informativas usan bordes neutros; selección, acciones y estados siguen diferenciados. El resumen incompleto muestra una lista desplegable con enlaces a los partidos afectados. Se corrigió el acceso histórico para resolver la temporada del partido y conservarla en el enlace a su jornada.

Revisadas vistas a 1280×900, 375×812 y ancho original, texto grande y todos los acentos disponibles. La revisión encontró y corrigió contraste de azul, nombres recortados, solapamiento de cabecera estrecha, estadísticas con cuatro columnas dentro de un panel estrecho y estados deshabilitados/seleccionados en el chat. El nuevo test de contraste verifica al menos 4,5:1 para los seis acentos y colores personalizados de prueba. Se comprobaron teclado/foco en desplegables, apertura por enlace, estados de carga/vacíos y propuesta de fecha sin enviar. Tandas adicionales de 41 y 17 tests correctas, junto a TypeScript, i18n, presupuesto y diff; ESLint sin errores y 11 advertencias preexistentes en Administración.

Preferencias restauradas a texto normal y color de liga; viewport temporal retirado. No se modificaron datos ni se enviaron mensajes. No quedan propuestas de código de esta revisión pendientes. La cobertura no incluye dispositivos físicos, otras cuentas/permisos ni todos los errores posibles: requieren un entorno de prueba dedicado. Evidencia local: C:/Users/USER/.codex/visualizations/2026/10/08/01a11af9-6fc8-7e02-a8f7-85ee6222e399/competition-admin-complete.png.
