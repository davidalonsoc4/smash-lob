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

function initials(value: string) {
  return (
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "SL"
  )
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
    ? `<span class="logo-medallion"><span class="logo-core"><img src="${escapeHtml(logoUrl)}" alt="" /></span></span>`
    : `<span class="logo-medallion"><span class="logo-core logo-fallback">${escapeHtml(initials(leagueName))}</span></span>`

  return `<div class="face-ornament face-ornament-a" aria-hidden="true"></div>
    <div class="face-ornament face-ornament-b" aria-hidden="true"></div>
    <div class="face-inner">
      <div class="eyebrow">WELCOME PACK</div>
      ${logo}
      <div class="league-name">${escapeHtml(leagueName)}</div>
      <div class="player-name">${escapeHtml(playerName)}</div>
      <div class="rule"><span></span><i></i><span></span></div>
      <div class="season-name">${escapeHtml(seasonName)}</div>
      <div class="signature">SMASH &amp; LOB</div>
    </div>`
}

function sealMarkup({
  player,
  leagueName,
  seasonName,
  logoUrl,
}: {
  player: WelcomePackBagSealPlayer
  leagueName: string
  seasonName: string
  logoUrl?: string | null
}) {
  const face = faceMarkup({
    playerName: player.displayName,
    leagueName,
    seasonName,
    logoUrl,
  })

  return `<div class="seal-cell" data-player-id="${escapeHtml(player.id)}">
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
}: {
  players: WelcomePackBagSealPlayer[]
  leagueName: string
  seasonName: string
  logoUrl?: string | null
  accentColor: string
}) {
  const accent = normalizeWelcomePackAccentColor(accentColor)
  const sheets = Array.from(
    { length: getWelcomePackBagSealSheetCount(players.length) },
    (_, index) => players.slice(index * WELCOME_PACK_BAG_SEAL.itemsPerA4, (index + 1) * WELCOME_PACK_BAG_SEAL.itemsPerA4),
  )

  const sheetMarkup = sheets
    .map(
      (sheetPlayers) => `<section class="sheet">${sheetPlayers
        .map((player) => sealMarkup({ player, leagueName, seasonName, logoUrl }))
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
    .seal-face { position: relative; min-height: 60mm; overflow: hidden; background:
      radial-gradient(circle at 14% 10%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 29%),
      linear-gradient(160deg, #121212 0%, #080808 48%, #030303 100%); }
    .seal-face::before { content: ""; position: absolute; inset: 1.55mm; border: .16mm solid rgba(255,255,255,.14); pointer-events: none; }
    .seal-face::after { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 1.35mm; background: var(--accent); }
    .seal-face-bottom { transform: rotate(180deg); }
    .face-ornament { position: absolute; width: 8mm; height: 8mm; opacity: .9; }
    .face-ornament-a { top: 3.2mm; right: 3.2mm; border-top: .45mm solid var(--accent); border-right: .45mm solid var(--accent); }
    .face-ornament-b { left: 3.2mm; bottom: 3.2mm; border-left: .28mm solid rgba(255,255,255,.35); border-bottom: .28mm solid rgba(255,255,255,.35); }
    .face-inner { position: absolute; inset: 0; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5.4mm 4.2mm 4.5mm; text-align: center; }
    .eyebrow { margin-bottom: 2.1mm; color: var(--accent); font-size: 2.1mm; font-weight: 900; letter-spacing: .62mm; line-height: 1; }
    .logo-medallion { display: grid; width: 11.6mm; height: 11.6mm; place-items: center; border: .34mm solid var(--accent); border-radius: 999px; box-shadow: 0 0 0 .35mm rgba(255,255,255,.09); }
    .logo-core { display: grid; width: 9.5mm; height: 9.5mm; place-items: center; overflow: hidden; border-radius: 999px; background: rgba(255,255,255,.98); color: #080808; font-size: 2.8mm; font-weight: 950; }
    .logo-core img { width: 100%; height: 100%; padding: 1mm; object-fit: contain; }
    .league-name { max-width: 34mm; margin-top: 1.8mm; overflow: hidden; color: rgba(255,255,255,.57); font-size: 2.05mm; font-weight: 800; line-height: 1.05; text-transform: uppercase; letter-spacing: .16mm; white-space: nowrap; text-overflow: ellipsis; }
    .player-name { max-width: 36.5mm; margin-top: 2.4mm; color: #fff; font-family: Georgia, "Times New Roman", serif; font-size: 4.55mm; font-weight: 700; line-height: .98; text-wrap: balance; }
    .rule { display: grid; grid-template-columns: 8mm 1.5mm 8mm; align-items: center; gap: 1.15mm; margin-top: 2.4mm; }
    .rule span { height: .18mm; background: rgba(255,255,255,.24); }
    .rule i { width: 1.45mm; height: 1.45mm; transform: rotate(45deg); background: var(--accent); }
    .season-name { margin-top: 2mm; color: rgba(255,255,255,.76); font-size: 2.15mm; font-weight: 850; text-transform: uppercase; letter-spacing: .2mm; }
    .signature { margin-top: 1.35mm; color: rgba(255,255,255,.28); font-size: 1.7mm; font-weight: 850; letter-spacing: .42mm; }
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
