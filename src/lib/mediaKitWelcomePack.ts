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
    ? `<span class="logo-medallion"><span class="logo-ring"><span class="logo-core"><img src="${escapeHtml(logoUrl)}" alt="" /></span></span></span>`
    : `<span class="logo-medallion"><span class="logo-ring"><span class="logo-core logo-fallback">${escapeHtml(initials(leagueName))}</span></span></span>`

  return `<div class="background-ring background-ring-a" aria-hidden="true"></div>
    <div class="background-ring background-ring-b" aria-hidden="true"></div>
    <div class="background-texture" aria-hidden="true"></div>
    <div class="background-glow" aria-hidden="true"></div>
    <div class="frame" aria-hidden="true"></div>
    <div class="accent-line" aria-hidden="true"></div>
    <div class="corner corner-a" aria-hidden="true"></div>
    <div class="corner corner-b" aria-hidden="true"></div>
    <div class="spark spark-a" aria-hidden="true"></div>
    <div class="spark spark-b" aria-hidden="true"></div>
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
    .trim-guide { position: absolute; inset: 2mm; z-index: 30; border: .16mm solid rgba(0,0,0,.72); pointer-events: none; }
    .fold-tick { position: absolute; top: 61.85mm; z-index: 40; width: 2mm; height: .3mm; background: #111; }
    .fold-tick-left { left: 0; }
    .fold-tick-right { right: 0; }

    .seal-face { position: relative; min-height: 60mm; overflow: hidden; background:
      radial-gradient(circle at 50% 32%, color-mix(in srgb, var(--accent) 28%, transparent) 0%, transparent 34%),
      radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--accent) 14%, transparent) 0%, transparent 28%),
      radial-gradient(circle at 88% 8%, rgba(255,255,255,.10) 0%, transparent 24%),
      linear-gradient(158deg,#181818 0%,#080808 52%,#020202 100%); }
    .seal-face-top { transform: rotate(180deg); }
    .seal-face-bottom { transform: none; }

    .background-ring { position: absolute; border-radius: 999px; border-style: solid; border-color: var(--accent); pointer-events: none; }
    .background-ring-a { width: 30mm; height: 30mm; left: -12mm; top: 5mm; border-width: .28mm; opacity: .34; box-shadow: 0 0 10mm color-mix(in srgb, var(--accent) 16%, transparent); }
    .background-ring-b { width: 34mm; height: 34mm; right: -14mm; bottom: -2mm; border-width: .2mm; opacity: .18; }
    .background-texture { position: absolute; inset: 0; opacity: .11; background-image: repeating-linear-gradient(118deg,transparent 0,transparent 3.2mm,rgba(255,255,255,.34) 3.45mm,transparent 3.7mm); }
    .background-glow { position: absolute; width: 24mm; height: 24mm; left: 50%; top: 26%; transform: translateX(-50%); border-radius: 999px; background: var(--accent); filter: blur(8mm); opacity: .28; }
    .frame { position: absolute; inset: 1.55mm; border: .16mm solid rgba(255,255,255,.14); pointer-events: none; }
    .accent-line { position: absolute; left: 6mm; right: 6mm; top: 0; height: 1mm; background: linear-gradient(90deg, transparent, var(--accent), transparent); }
    .corner { position: absolute; width: 7.5mm; height: 7.5mm; }
    .corner-a { right: 3mm; top: 3mm; border-right: .42mm solid var(--accent); border-top: .42mm solid var(--accent); }
    .corner-b { left: 3mm; bottom: 3mm; border-left: .24mm solid rgba(255,255,255,.32); border-bottom: .24mm solid rgba(255,255,255,.32); }
    .spark { position: absolute; width: .9mm; height: .9mm; border-radius: 999px; background: var(--accent); }
    .spark-a { left: 4.5mm; top: 5.2mm; box-shadow: 3.2mm 1.8mm 0 color-mix(in srgb, var(--accent) 55%, transparent), 1.1mm 5mm 0 rgba(255,255,255,.22); }
    .spark-b { right: 5mm; bottom: 7mm; opacity: .45; box-shadow: -2.3mm -1.2mm 0 rgba(255,255,255,.18); }

    .face-inner { position: absolute; inset: 0; z-index: 5; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5.2mm 4.1mm 4.3mm; text-align: center; }
    .eyebrow { margin-bottom: 2mm; color: var(--accent); font-size: 2.05mm; font-weight: 900; letter-spacing: .72mm; line-height: 1; }
    .logo-medallion { display: grid; width: 13.2mm; height: 13.2mm; place-items: center; border: .28mm solid var(--accent); border-radius: 999px; box-shadow: 0 0 6mm color-mix(in srgb, var(--accent) 26%, transparent), inset 0 0 0 .25mm rgba(255,255,255,.10); }
    .logo-ring { display: grid; width: 11.2mm; height: 11.2mm; place-items: center; border: .18mm solid rgba(255,255,255,.22); border-radius: 999px; }
    .logo-core { display: grid; width: 9.9mm; height: 9.9mm; place-items: center; overflow: hidden; border-radius: 999px; background: rgba(255,255,255,.97); color: #080808; font-size: 2.8mm; font-weight: 950; box-shadow: inset 0 0 2.4mm rgba(0,0,0,.12); }
    .logo-core img { width: 100%; height: 100%; padding: 1mm; object-fit: contain; }
    .league-name { max-width: 34mm; margin-top: 1.7mm; overflow: hidden; color: rgba(255,255,255,.56); font-size: 2mm; font-weight: 850; line-height: 1.05; text-transform: uppercase; letter-spacing: .22mm; white-space: nowrap; text-overflow: ellipsis; }
    .player-name { max-width: 37mm; margin-top: 2.2mm; color: #fff; font-family: Georgia, "Times New Roman", serif; font-size: 4.7mm; font-weight: 700; line-height: .94; text-wrap: balance; text-shadow: 0 .6mm 3mm rgba(0,0,0,.68); }
    .rule { display: grid; grid-template-columns: 8.5mm 1.7mm 8.5mm; align-items: center; gap: 1.2mm; margin-top: 2.4mm; }
    .rule span:first-child { height: .18mm; background: linear-gradient(90deg, transparent, rgba(255,255,255,.34)); }
    .rule span:last-child { height: .18mm; background: linear-gradient(90deg, rgba(255,255,255,.34), transparent); }
    .rule i { width: 1.6mm; height: 1.6mm; transform: rotate(45deg); border: .2mm solid var(--accent); box-shadow: 0 0 2mm color-mix(in srgb, var(--accent) 45%, transparent); }
    .season-name { margin-top: 1.9mm; color: rgba(255,255,255,.80); font-size: 2.15mm; font-weight: 850; text-transform: uppercase; letter-spacing: .24mm; }
    .signature { margin-top: 1.2mm; color: rgba(255,255,255,.30); font-size: 1.65mm; font-weight: 850; letter-spacing: .5mm; }

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
