export const LOGO_STICKER_WIDTH_OPTIONS_MM = [20, 30, 40, 50, 60, 70, 80] as const

export type LogoStickerOrientation = "portrait" | "landscape"

type PageSize = { widthMm: number; heightMm: number }

const PRINTABLE_A4: Record<LogoStickerOrientation, PageSize> = {
  portrait: { widthMm: 202, heightMm: 289 },
  landscape: { widthMm: 289, heightMm: 202 },
}

function positiveAspectRatio(value: number) {
  return Number.isFinite(value) && value > 0.05 ? value : 1
}

export function getLogoStickerLayout(widthMm: number, aspectRatio: number, stickerCount: number) {
  const safeWidth = Math.max(10, widthMm)
  const safeAspect = positiveAspectRatio(aspectRatio)
  const slotWidthMm = Math.max(50, safeWidth)
  const stickerHeightMm = safeWidth / safeAspect

  const candidates = (Object.keys(PRINTABLE_A4) as LogoStickerOrientation[]).map((orientation) => {
    const page = PRINTABLE_A4[orientation]
    const columns = Math.max(1, Math.floor(page.widthMm / slotWidthMm))
    const rows = Math.max(1, Math.floor(page.heightMm / stickerHeightMm))
    return { orientation, columns, rows, itemsPerSheet: columns * rows }
  })

  const orientation = candidates
    .sort((first, second) => second.itemsPerSheet - first.itemsPerSheet || (first.orientation === "portrait" ? -1 : 1))[0]
  const sheetCount = Math.max(1, Math.ceil(Math.max(1, stickerCount) / orientation.itemsPerSheet))

  return {
    ...orientation,
    safeWidth,
    safeAspect,
    slotWidthMm,
    stickerHeightMm,
    sheetCount,
    orientationLabel: orientation.orientation === "portrait" ? "A4 vertical" : "A4 horizontal",
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

export function buildLogoStickerPrintHtml({
  logoUrl,
  leagueName,
  widthMm,
  stickerCount,
  aspectRatio,
}: {
  logoUrl: string
  leagueName: string
  widthMm: number
  stickerCount: number
  aspectRatio: number
}) {
  const layout = getLogoStickerLayout(widthMm, aspectRatio, stickerCount)
  const sheetMarkup = Array.from({ length: layout.sheetCount }, (_, sheetIndex) => {
    const stickers = Array.from({ length: layout.itemsPerSheet }, (_, slotIndex) => {
      const isPlayerSticker = sheetIndex * layout.itemsPerSheet + slotIndex < stickerCount
      return `<div class="sticker-slot"><img class="sticker-image ${isPlayerSticker ? "sticker-image-main" : "sticker-image-extra"}" src="${escapeHtml(logoUrl)}" alt="Logo de ${escapeHtml(leagueName)}" /></div>`
    }).join("")
    return `<section class="sheet">${stickers}</section>`
  }).join("")

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Pegatinas de logo · ${escapeHtml(leagueName)}</title>
  <style>
    @page sl-logo-stickers-portrait { size: A4 portrait; margin: 4mm; }
    @page sl-logo-stickers-landscape { size: A4 landscape; margin: 4mm; }
    @page { size: A4 ${layout.orientation}; margin: 4mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: Arial, sans-serif; }
    .sheet { page: sl-logo-stickers-${layout.orientation}; width: ${layout.orientation === "portrait" ? 202 : 289}mm; min-height: ${layout.orientation === "portrait" ? 289 : 202}mm; display: grid; grid-template-columns: repeat(${layout.columns}, ${layout.slotWidthMm}mm); grid-template-rows: repeat(${layout.rows}, ${layout.stickerHeightMm}mm); align-content: start; justify-content: center; overflow: hidden; break-after: page; page-break-after: always; }
    .sheet:last-child { break-after: auto; page-break-after: auto; }
    .sticker-slot { width: ${layout.slotWidthMm}mm; height: ${layout.stickerHeightMm}mm; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .sticker-image { display: block; height: auto; object-fit: contain; }
    .sticker-image-main { width: ${layout.safeWidth}mm; max-height: ${layout.stickerHeightMm}mm; }
    .sticker-image-extra { width: 50mm; max-height: ${layout.stickerHeightMm}mm; }
    .print-info { display: none; }
    @media screen { body { padding: 12px; background: #e5e7eb; } .print-info { display: block; } .sheet { margin: 0 auto 16px; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.14); } }
  </style>
</head>
<body>
  <div class="print-info" style="font:700 10px Arial; padding:4mm;">${escapeHtml(layout.orientationLabel)} · ${layout.safeWidth} mm de ancho · ${stickerCount} pegatinas mínimas</div>
  ${sheetMarkup}
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
