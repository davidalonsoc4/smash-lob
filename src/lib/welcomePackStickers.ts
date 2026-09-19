export const WELCOME_PACK_STICKER_ARTWORKS = [
  { id: "padel-lovers", label: "Padel Lovers", src: "/media-kit/stickers/padel-lovers.png", whiteSrc: "/media-kit/stickers/white/padel-lovers.png", width: 1332, height: 927 },
  { id: "nos-vemos-en-la-pista", label: "Nos vemos en la pista", src: "/media-kit/stickers/nos-vemos-en-la-pista.png", whiteSrc: "/media-kit/stickers/white/nos-vemos-en-la-pista.png", width: 1536, height: 1024 },
  { id: "hoy-se-juega", label: "Hoy se juega", src: "/media-kit/stickers/hoy-se-juega.png", whiteSrc: "/media-kit/stickers/white/hoy-se-juega.png", width: 1228, height: 1023 },
  { id: "quien-reserva-buena", label: "Quien reserva buena", src: "/media-kit/stickers/quien-reserva-buena.png", whiteSrc: "/media-kit/stickers/white/quien-reserva-buena.png", width: 1435, height: 956 },
  { id: "por3-buena", label: "Por 3", src: "/media-kit/stickers/por3-buena.png", whiteSrc: "/media-kit/stickers/white/por3-buena.png", width: 1448, height: 1004 },
  { id: "evolucion-natural-buena", label: "Evolución natural", src: "/media-kit/stickers/evolucion-natural-buena.png", whiteSrc: "/media-kit/stickers/white/evolucion-natural-buena.png", width: 1734, height: 789 },
] as const

export type WelcomePackStickerId = (typeof WELCOME_PACK_STICKER_ARTWORKS)[number]["id"]
export type WelcomePackStickerOrientation = "portrait" | "landscape"

export const WELCOME_PACK_STICKER_A4 = { widthMm: 210, heightMm: 297 } as const
// Safe printable inset: most copy-shop printers cannot print to the paper edge.
export const WELCOME_PACK_STICKER_OUTER_MARGIN_MM = 5
export const WELCOME_PACK_STICKER_LOGO_MAX_WIDTH_MM = 50

type PageSize = { widthMm: number; heightMm: number }
type Rect = { xMm: number; yMm: number; widthMm: number; heightMm: number }

export type WelcomePackStickerPlacement = Rect & {
  kind: "artwork" | "league-logo"
  id: string
  label: string
  src: string
}

export type WelcomePackStickerLayout = {
  orientation: WelcomePackStickerOrientation
  orientationLabel: string
  page: PageSize
  printableArea: Rect
  stickerWidthMm: number
  maxStickerWidthMm: number
  copiesPerDesign: number
  columns: number
  rows: number
  artworkCount: number
  logoCount: number
  placements: WelcomePackStickerPlacement[]
}

const PAGE_SIZES: Record<WelcomePackStickerOrientation, PageSize> = {
  portrait: WELCOME_PACK_STICKER_A4,
  landscape: { widthMm: WELCOME_PACK_STICKER_A4.heightMm, heightMm: WELCOME_PACK_STICKER_A4.widthMm },
}

function getPrintableArea(page: PageSize): Rect {
  const margin = WELCOME_PACK_STICKER_OUTER_MARGIN_MM
  return {
    xMm: margin,
    yMm: margin,
    widthMm: page.widthMm - margin * 2,
    heightMm: page.heightMm - margin * 2,
  }
}

function safeAspectRatio(value: number) {
  return Number.isFinite(value) && value > 0.05 ? value : 1
}

function getSelectedArtworks(ids: readonly WelcomePackStickerId[], copiesPerDesign = 1, ink: "light-gray" | "white" = "light-gray") {
  const selected = new Set(ids)
  const copies = Math.min(20, Math.max(1, Math.floor(copiesPerDesign)))
  return WELCOME_PACK_STICKER_ARTWORKS
    .filter((artwork) => selected.has(artwork.id))
    .flatMap((artwork) => Array.from({ length: copies }, (_, copyIndex) => ({
      ...artwork,
      src: ink === "white" ? artwork.whiteSrc : artwork.src,
      copyIndex,
      placementId: `${artwork.id}-copy-${copyIndex + 1}`,
    })))
}

function getPrimaryRows(
  ids: readonly WelcomePackStickerId[],
  stickerWidthMm: number,
  orientation: WelcomePackStickerOrientation,
  copiesPerDesign = 1,
  ink: "light-gray" | "white" = "light-gray",
) {
  const artworks = getSelectedArtworks(ids, copiesPerDesign, ink)
  if (artworks.length === 0 || stickerWidthMm <= 0) return null

  const page = PAGE_SIZES[orientation]
  const printableArea = getPrintableArea(page)
  const columns = Math.floor(printableArea.widthMm / stickerWidthMm)
  if (columns < 1) return null

  const sorted = [...artworks].sort((first, second) =>
    first.width / first.height - second.width / second.height ||
    WELCOME_PACK_STICKER_ARTWORKS.findIndex((artwork) => artwork.id === first.id) -
    WELCOME_PACK_STICKER_ARTWORKS.findIndex((artwork) => artwork.id === second.id),
  )
  const placements: WelcomePackStickerPlacement[] = []
  let yMm = printableArea.yMm
  let rows = 0

  for (let start = 0; start < sorted.length; start += columns) {
    const row = sorted.slice(start, start + columns)
    const rowHeightMm = Math.max(...row.map((artwork) => stickerWidthMm * artwork.height / artwork.width))
    if (yMm + rowHeightMm > printableArea.yMm + printableArea.heightMm + 0.0001) return null

    row.forEach((artwork, column) => {
      const heightMm = stickerWidthMm * artwork.height / artwork.width
      placements.push({
        kind: "artwork",
        id: artwork.placementId,
        label: artwork.label,
        src: artwork.src,
        xMm: printableArea.xMm + column * stickerWidthMm,
        yMm: yMm + (rowHeightMm - heightMm) / 2,
        widthMm: stickerWidthMm,
        heightMm,
      })
    })
    yMm += rowHeightMm
    rows += 1
  }

  return { page, printableArea, placements, columns, rows }
}

function fitsOnOneSheet(ids: readonly WelcomePackStickerId[], widthMm: number, orientation: WelcomePackStickerOrientation, copiesPerDesign: number) {
  return getPrimaryRows(ids, widthMm, orientation, copiesPerDesign) !== null
}

export function canFitWelcomePackStickersOnOneSheet(ids: readonly WelcomePackStickerId[], widthMm: number, copiesPerDesign = 1) {
  return (Object.keys(PAGE_SIZES) as WelcomePackStickerOrientation[])
    .some((orientation) => fitsOnOneSheet(ids, widthMm, orientation, copiesPerDesign))
}

export function getMaxWelcomePackStickerWidthMm(ids: readonly WelcomePackStickerId[], copiesPerDesign = 1) {
  const uniqueIds = [...new Set(ids)]
  if (uniqueIds.length === 0) return 0

  let maximum = 0
  for (const orientation of Object.keys(PAGE_SIZES) as WelcomePackStickerOrientation[]) {
    const maxPageWidth = Math.floor(getPrintableArea(PAGE_SIZES[orientation]).widthMm)
    for (let widthMm = 1; widthMm <= maxPageWidth; widthMm += 1) {
      if (fitsOnOneSheet(uniqueIds, widthMm, orientation, copiesPerDesign)) maximum = Math.max(maximum, widthMm)
    }
  }
  return maximum
}

function intersects(first: Rect, second: Rect) {
  return first.xMm < second.xMm + second.widthMm - 0.0001 &&
    first.xMm + first.widthMm > second.xMm + 0.0001 &&
    first.yMm < second.yMm + second.heightMm - 0.0001 &&
    first.yMm + first.heightMm > second.yMm + 0.0001
}

function containedBy(first: Rect, second: Rect) {
  const epsilon = 0.0001
  return first.xMm >= second.xMm - epsilon && first.yMm >= second.yMm - epsilon &&
    first.xMm + first.widthMm <= second.xMm + second.widthMm + epsilon &&
    first.yMm + first.heightMm <= second.yMm + second.heightMm + epsilon
}

function splitFreeRectangles(freeRectangles: Rect[], used: Rect) {
  const result: Rect[] = []
  for (const free of freeRectangles) {
    if (!intersects(free, used)) {
      result.push(free)
      continue
    }

    const freeRight = free.xMm + free.widthMm
    const freeBottom = free.yMm + free.heightMm
    const usedRight = used.xMm + used.widthMm
    const usedBottom = used.yMm + used.heightMm

    if (used.xMm > free.xMm + 0.0001) result.push({ ...free, widthMm: used.xMm - free.xMm })
    if (usedRight < freeRight - 0.0001) result.push({ ...free, xMm: usedRight, widthMm: freeRight - usedRight })
    if (used.yMm > free.yMm + 0.0001) result.push({ ...free, heightMm: used.yMm - free.yMm })
    if (usedBottom < freeBottom - 0.0001) result.push({ ...free, yMm: usedBottom, heightMm: freeBottom - usedBottom })
  }

  const positive = result.filter((rect) => rect.widthMm > 0.0001 && rect.heightMm > 0.0001)
  return positive.filter((rect, index) => !positive.some((other, otherIndex) =>
    otherIndex !== index && containedBy(rect, other) &&
    (!containedBy(other, rect) || otherIndex < index),
  ))
}

function addLeagueLogoFillers(
  primary: WelcomePackStickerPlacement[],
  printableArea: Rect,
  logoUrl: string | null,
  leagueName: string,
  logoAspectRatio: number,
) {
  if (!logoUrl) return []

  let freeRectangles: Rect[] = [printableArea]
  for (const placement of primary) freeRectangles = splitFreeRectangles(freeRectangles, placement)

  const fillers: WelcomePackStickerPlacement[] = []
  const aspect = safeAspectRatio(logoAspectRatio)
  for (let count = 0; count < 500; count += 1) {
    const candidates = freeRectangles
      .map((free) => {
        const widthMm = Math.min(WELCOME_PACK_STICKER_LOGO_MAX_WIDTH_MM, free.widthMm, free.heightMm * aspect)
        const heightMm = widthMm / aspect
        return { free, widthMm, heightMm, area: widthMm * heightMm }
      })
      .filter((candidate) => candidate.widthMm >= 10 && candidate.heightMm >= 0.1)
      .sort((first, second) => second.area - first.area || first.free.yMm - second.free.yMm || first.free.xMm - second.free.xMm)
    const candidate = candidates[0]
    if (!candidate) break

    const placement: WelcomePackStickerPlacement = {
      kind: "league-logo",
      id: `league-logo-${count + 1}`,
      label: `Logo de ${leagueName}`,
      src: logoUrl,
      xMm: candidate.free.xMm,
      yMm: candidate.free.yMm,
      widthMm: candidate.widthMm,
      heightMm: candidate.heightMm,
    }
    fillers.push(placement)
    freeRectangles = splitFreeRectangles(freeRectangles, placement)
  }
  return fillers
}

export function getWelcomePackStickerLayout({
  ids,
  stickerWidthMm,
  copiesPerDesign = 1,
  logoUrl,
  leagueName,
  logoAspectRatio = 1,
  ink = "light-gray",
}: {
  ids: readonly WelcomePackStickerId[]
  stickerWidthMm: number
  copiesPerDesign?: number
  logoUrl: string | null
  leagueName: string
  logoAspectRatio?: number
  ink?: "light-gray" | "white"
}): WelcomePackStickerLayout | null {
  const uniqueIds = [...new Set(ids)]
  const copies = Math.min(20, Math.max(1, Math.floor(copiesPerDesign)))
  const maxStickerWidthMm = getMaxWelcomePackStickerWidthMm(uniqueIds, copies)
  const widthMm = Math.min(Math.floor(stickerWidthMm), maxStickerWidthMm)
  if (uniqueIds.length === 0 || widthMm < 1) return null

  const candidates = (Object.keys(PAGE_SIZES) as WelcomePackStickerOrientation[])
    .map((orientation) => {
      const primaryLayout = getPrimaryRows(uniqueIds, widthMm, orientation, copies, ink)
      if (!primaryLayout) return null
      const fillers = addLeagueLogoFillers(
        primaryLayout.placements,
        primaryLayout.printableArea,
        logoUrl,
        leagueName,
        logoAspectRatio,
      )
      return {
        ...primaryLayout,
        orientation,
        fillers,
        usedArea: [...primaryLayout.placements, ...fillers].reduce((total, placement) => total + placement.widthMm * placement.heightMm, 0),
      }
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((first, second) => second.fillers.length - first.fillers.length || second.usedArea - first.usedArea ||
      (first.orientation === "portrait" ? -1 : 1))

  const chosen = candidates[0]
  if (!chosen) return null
  const page = chosen.page
  return {
    orientation: chosen.orientation,
    orientationLabel: chosen.orientation === "portrait" ? "A4 vertical" : "A4 horizontal",
    page,
    printableArea: chosen.printableArea,
    stickerWidthMm: widthMm,
    copiesPerDesign: copies,
    maxStickerWidthMm,
    columns: chosen.columns,
    rows: chosen.rows,
    artworkCount: chosen.placements.length,
    logoCount: chosen.fillers.length,
    placements: [...chosen.placements, ...chosen.fillers],
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character)
}

export function buildWelcomePackStickerPrintHtml({
  layout,
  leagueName,
}: {
  layout: WelcomePackStickerLayout
  leagueName: string
}) {
  const items = layout.placements.map((placement) => {
    const className = placement.kind === "artwork" ? "sticker-artwork" : "league-logo-sticker"
    return `<img class="${className}" src="${escapeHtml(placement.src)}" alt="${escapeHtml(placement.label)}" style="left:${placement.xMm}mm;top:${placement.yMm}mm;width:${placement.widthMm}mm;height:${placement.heightMm}mm" />`
  }).join("\n")

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Pegatinas · ${escapeHtml(leagueName)}</title>
  <style>
    @page { size: A4 ${layout.orientation}; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: Arial, sans-serif; }
    .sheet { position: relative; width: ${layout.page.widthMm}mm; height: ${layout.page.heightMm}mm; overflow: hidden; break-after: page; page-break-after: always; background: #fff; }
    .sheet:last-child { break-after: auto; page-break-after: auto; }
    .sticker-artwork, .league-logo-sticker { position: absolute; display: block; object-fit: contain; }
    .print-info { display: none; }
    @media screen { body { padding: 12px; background: #e5e7eb; } .print-info { display: block; } .sheet { margin: 0 auto 16px; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.14); } }
  </style>
</head>
<body>
  <div class="print-info" style="font:700 10px Arial; padding:4mm;">${layout.orientationLabel} · A4 · ${layout.artworkCount} pegatinas (${layout.copiesPerDesign} copias por diseño) · ${layout.stickerWidthMm} mm de ancho · sin separación interior · margen exterior ${WELCOME_PACK_STICKER_OUTER_MARGIN_MM} mm</div>
  <section class="sheet" aria-label="Pegatinas A4 de ${escapeHtml(leagueName)}">${items}</section>
  <script>
    window.addEventListener("load", function () {
      var images = Array.from(document.images || []);
      Promise.all(images.map(function (image) {
        if (image.complete) return Promise.resolve();
        return new Promise(function (resolve) { image.addEventListener("load", resolve, { once: true }); image.addEventListener("error", resolve, { once: true }); });
      })).then(function () { window.setTimeout(function () { window.print(); }, 250); });
    });
  </script>
</body>
</html>`
}
