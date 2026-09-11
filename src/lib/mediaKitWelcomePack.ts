export type WelcomePackBagSealDesign = "frame" | "stripe" | "split"

export type WelcomePackBagSealPlayer = {
  id: string
  displayName: string
}

export const WELCOME_PACK_BAG_SEAL = {
  trimWidthMm: 45,
  trimHeightMm: 120,
  faceHeightMm: 60,
  bleedMm: 2,
  printedWidthMm: 49,
  printedHeightMm: 124,
  itemsPerA4: 8,
} as const

export const WELCOME_PACK_BAG_SEAL_DESIGNS: Array<{
  id: WelcomePackBagSealDesign
  label: string
  detail: string
}> = [
  { id: "frame", label: "Marco", detail: "Sobrio y centrado" },
  { id: "stripe", label: "Franja", detail: "Acento lateral" },
  { id: "split", label: "Bloque", detail: "Cabecera de color" },
]

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export function normalizeWelcomePackAccentColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value.trim()) ? value.trim().toUpperCase() : "#D7A544"
}

export function getWelcomePackBagSealSheetCount(playerCount: number) {
  return Math.max(0, Math.ceil(Math.max(0, playerCount) / WELCOME_PACK_BAG_SEAL.itemsPerA4))
}

function faceMarkup({
  playerName,
  leagueName,
  seasonName,
  logoUrl,
}: {
  playerName: string
  leagueName: string
  seasonName: string
  logoUrl?: string | null
}) {
  const logo = logoUrl
    ? `<span class="logo-shell"><img src="${escapeHtml(logoUrl)}" alt="" /></span>`
    : `<span class="logo-shell logo-fallback">${escapeHtml(
        leagueName
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase() || "SL",
      )}</span>`

  return `<div class="face-inner">
    <div class="brand-row">${logo}<span class="league-name">${escapeHtml(leagueName)}</span></div>
    <div class="welcome-label">WELCOME PACK</div>
    <div class="player-name">${escapeHtml(playerName)}</div>
    <div class="season-name">${escapeHtml(seasonName)}</div>
  </div>`
}

function sealMarkup({
  player,
  leagueName,
  seasonName,
  logoUrl,
  design,
}: {
  player: WelcomePackBagSealPlayer
  leagueName: string
  seasonName: string
  logoUrl?: string | null
  design: WelcomePackBagSealDesign
}) {
  const face = faceMarkup({
    playerName: player.displayName,
    leagueName,
    seasonName,
    logoUrl,
  })

  return `<div class="seal-cell design-${design}" data-player-id="${escapeHtml(player.id)}">
    <div class="trim-guide" aria-hidden="true"></div>
    <span class="fold-tick fold-tick-left" aria-hidden="true"></span>
    <span class="fold-tick fold-tick-right" aria-hidden="true"></span>
    <div class="seal-trim">
      <div class="seal-face seal-face-top">${face}</div>
      <div class="seal-face seal-face-bottom">${face}</div>
    </div>
  </div>`
}

export function buildWelcomePackBagSealPrintHtml({
  players,
  leagueName,
  seasonName,
  logoUrl,
  accentColor,
  design,
}: {
  players: WelcomePackBagSealPlayer[]
  leagueName: string
  seasonName: string
  logoUrl?: string | null
  accentColor: string
  design: WelcomePackBagSealDesign
}) {
  const accent = normalizeWelcomePackAccentColor(accentColor)
  const sheets = Array.from(
    { length: getWelcomePackBagSealSheetCount(players.length) },
    (_, index) => players.slice(index * WELCOME_PACK_BAG_SEAL.itemsPerA4, (index + 1) * WELCOME_PACK_BAG_SEAL.itemsPerA4),
  )

  const sheetMarkup = sheets
    .map(
      (sheetPlayers) => `<section class="sheet">${sheetPlayers
        .map((player) => sealMarkup({ player, leagueName, seasonName, logoUrl, design }))
        .join("")}</section>`,
    )
    .join("")

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Welcome Pack · Precintos de bolsa · ${escapeHtml(leagueName)}</title>
  <style>
    @page { size: A4 portrait; margin: 4mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sheet { width: 202mm; min-height: 289mm; display: grid; grid-template-columns: repeat(4, 49mm); grid-template-rows: repeat(2, 124mm); gap: 2mm; align-content: start; break-after: page; page-break-after: always; }
    .sheet:last-child { break-after: auto; page-break-after: auto; }
    .seal-cell { --accent: ${accent}; position: relative; width: 49mm; height: 124mm; overflow: hidden; background: #050505; }
    .seal-trim { position: absolute; inset: 2mm; display: grid; grid-template-rows: 60mm 60mm; overflow: hidden; background: #050505; }
    .trim-guide { position: absolute; inset: 2mm; z-index: 20; border: .16mm solid rgba(0,0,0,.72); pointer-events: none; }
    .fold-tick { position: absolute; top: 61.85mm; z-index: 30; width: 2mm; height: .3mm; background: #111; }
    .fold-tick-left { left: 0; }
    .fold-tick-right { right: 0; }
    .seal-face { position: relative; min-height: 60mm; overflow: hidden; background: #080808; }
    .seal-face-bottom { transform: rotate(180deg); }
    .face-inner { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2.2mm; padding: 5mm 3.5mm; text-align: center; }
    .brand-row { display: flex; align-items: center; justify-content: center; gap: 2mm; max-width: 100%; }
    .logo-shell { display: grid; width: 9mm; height: 9mm; flex: 0 0 9mm; place-items: center; overflow: hidden; border-radius: 2mm; background: rgba(255,255,255,.96); color: #080808; font-size: 3mm; font-weight: 950; }
    .logo-shell img { width: 100%; height: 100%; padding: 1mm; object-fit: contain; }
    .league-name { max-width: 25mm; overflow: hidden; color: rgba(255,255,255,.78); font-size: 2.55mm; font-weight: 850; line-height: 1.05; text-transform: uppercase; letter-spacing: .12mm; }
    .welcome-label { color: var(--accent); font-size: 2.55mm; font-weight: 950; letter-spacing: .55mm; }
    .player-name { max-width: 36mm; color: #fff; font-size: 4.2mm; font-weight: 950; line-height: 1.02; text-wrap: balance; }
    .season-name { color: rgba(255,255,255,.58); font-size: 2.35mm; font-weight: 800; text-transform: uppercase; letter-spacing: .18mm; }
    .design-frame .seal-face { box-shadow: inset 0 0 0 1.15mm var(--accent); }
    .design-frame .face-inner { padding-inline: 5mm; }
    .design-stripe .seal-face::before { content: ""; position: absolute; inset-block: 0; left: 0; width: 3mm; background: var(--accent); }
    .design-stripe .seal-face::after { content: ""; position: absolute; inset-block: 0; right: 0; width: .6mm; background: color-mix(in srgb, var(--accent) 45%, transparent); }
    .design-split .seal-face::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 10mm; background: var(--accent); }
    .design-split .welcome-label { color: #fff; }
    .design-split .face-inner { padding-top: 12mm; }
    @media screen {
      body { padding: 12px; background: #e5e7eb; }
      .sheet { margin: 0 auto 16px; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.14); }
    }
  </style>
</head>
<body>
  ${sheetMarkup || '<p style="color:#111">No hay jugadores para imprimir.</p>'}
  <script>
    window.addEventListener("load", function () {
      var images = Array.from(document.images || []);
      Promise.all(images.map(function (image) {
        if (image.complete) return Promise.resolve();
        return new Promise(function (resolve) {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
      })).then(function () { window.setTimeout(function () { window.print(); }, 250); });
    });
  </script>
</body>
</html>`
}
